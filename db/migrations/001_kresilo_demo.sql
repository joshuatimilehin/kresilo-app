-- ============================================================================
-- Kresilo sendable prototype — migration 001
-- Schema: kresilo_demo ONLY. Additive, idempotent, safe to re-run.
-- Never touches: other workspaces, public tables, kresilo_research (read-only),
-- or any other schema. No DROP of existing objects except own triggers.
--
-- Executed by the outer Codex agent through the Kristello/Octo MCP against
-- workspace 4a3b41e7-2e43-4485-9167-29426d53ccba. The generated app never runs
-- migrations and never holds a connection string.
--
-- Every command below is a single statement. All multi-step writes are done
-- inside one database function so a param-bearing HTTP call is one atomic
-- transaction (no BEGIN/COMMIT across separate HTTP calls).
--
-- Target: PostgreSQL 16 (verified 16.15 on the authorized workspace). Uses the
-- built-in gen_random_uuid() only. This migration creates NO extension and
-- writes NOTHING outside the kresilo_demo namespace.
-- Volatility: every read helper called from inside a mutating command
-- (ensure_guest, approve_proposal, ...) is VOLATILE, because a STABLE function
-- is pinned to the calling query snapshot and cannot see rows that the same
-- command has just written. https://www.postgresql.org/docs/16/xfunc-volatility.html
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS kresilo_demo;

-- ---------------------------------------------------------------- sessions --
-- Only the SHA-256 hash of the guest token is stored, never the token itself.
CREATE TABLE IF NOT EXISTS kresilo_demo.sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_hash   text NOT NULL UNIQUE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_seen_at   timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NOT NULL,
  CONSTRAINT sessions_hash_shape CHECK (session_hash ~ '^[a-f0-9]{64}$')
);

-- ---------------------------------------------------------------- projects --
CREATE TABLE IF NOT EXISTS kresilo_demo.projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_hash      text NOT NULL REFERENCES kresilo_demo.sessions(session_hash) ON DELETE CASCADE,
  title           text NOT NULL,
  visibility      text NOT NULL DEFAULT 'private',
  poster          jsonb NOT NULL,
  poster_version  integer NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT projects_title_len CHECK (btrim(title) <> '' AND length(title) <= 120),
  CONSTRAINT projects_private_only CHECK (visibility IN ('private')),
  CONSTRAINT projects_version_min CHECK (poster_version >= 1),
  -- This bounded prototype owns exactly one private project per guest session.
  -- The constraint is what makes concurrent first requests structurally safe:
  -- two ensure_guest calls can never produce two projects for one guest hash.
  CONSTRAINT projects_owner_unique UNIQUE (owner_hash)
);

-- Idempotent upgrade path: if projects exists from an earlier run of this
-- migration without the ownership constraint, add it now (still kresilo_demo only).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'kresilo_demo'::regnamespace AND relname = 'projects')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
        WHERE conrelid = 'kresilo_demo.projects'::regclass AND conname = 'projects_owner_unique') THEN
    ALTER TABLE kresilo_demo.projects
      ADD CONSTRAINT projects_owner_unique UNIQUE (owner_hash);
  END IF;
END
$$;

-- -------------------------------------------------------------- references --
CREATE TABLE IF NOT EXISTS kresilo_demo."references" (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES kresilo_demo.projects(id) ON DELETE CASCADE,
  ref_key     text NOT NULL,
  kind        text NOT NULL DEFAULT 'bundled',
  name        text NOT NULL,
  source      text NOT NULL,
  reason      text NOT NULL,
  tags        text[] NOT NULL DEFAULT '{}',
  swatches    text[] NOT NULL DEFAULT '{}',
  url_note    text,
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT references_key_unique UNIQUE (project_id, ref_key),
  CONSTRAINT references_kind CHECK (kind IN ('bundled', 'external-metadata', 'guest')),
  CONSTRAINT references_reason_required CHECK (btrim(reason) <> '' AND length(reason) <= 600),
  CONSTRAINT references_name_required CHECK (btrim(name) <> '' AND length(name) <= 140),
  CONSTRAINT references_source_required CHECK (btrim(source) <> '' AND length(source) <= 200)
);
CREATE INDEX IF NOT EXISTS references_project_idx ON kresilo_demo."references" (project_id, position);

-- ---------------------------------------------------------------- proposals --
CREATE TABLE IF NOT EXISTS kresilo_demo.proposals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid NOT NULL REFERENCES kresilo_demo.projects(id) ON DELETE CASCADE,
  intent            text NOT NULL,
  status            text NOT NULL DEFAULT 'proposed',
  rationale         text NOT NULL,
  patch             jsonb NOT NULL,
  palette_before    jsonb NOT NULL DEFAULT '{}'::jsonb,
  palette_after     jsonb NOT NULL DEFAULT '{}'::jsonb,
  cites             text[] NOT NULL DEFAULT '{}',
  source            text NOT NULL DEFAULT 'prototype-guidance',
  cost_label        text NOT NULL DEFAULT '0 demo credits - no external service called',
  applied_version   integer,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  approved_at       timestamptz,
  declined_at       timestamptz,
  CONSTRAINT proposals_intent_len CHECK (btrim(intent) <> '' AND length(intent) <= 500),
  CONSTRAINT proposals_status CHECK (status IN ('proposed', 'approved', 'declined')),
  CONSTRAINT proposals_cost_label CHECK (cost_label = '0 demo credits - no external service called')
);
CREATE INDEX IF NOT EXISTS proposals_project_status_idx ON kresilo_demo.proposals (project_id, status);

-- ---------------------------------------------------------------- approvals --
-- One approval row per proposal, forever. Unique proposal_id + unique
-- idempotency_key make repeat approval structurally impossible to duplicate.
CREATE TABLE IF NOT EXISTS kresilo_demo.approvals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id      uuid NOT NULL UNIQUE REFERENCES kresilo_demo.proposals(id) ON DELETE CASCADE,
  project_id       uuid NOT NULL REFERENCES kresilo_demo.projects(id) ON DELETE CASCADE,
  decision_id      uuid,
  version_id       uuid,
  idempotency_key  text UNIQUE,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS approvals_project_idx ON kresilo_demo.approvals (project_id);

-- ---------------------------------------------------------------- decisions --
CREATE TABLE IF NOT EXISTS kresilo_demo.decisions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            uuid NOT NULL REFERENCES kresilo_demo.projects(id) ON DELETE CASCADE,
  title                 text NOT NULL,
  reason                text NOT NULL,
  kind                  text NOT NULL DEFAULT 'manual',
  proposal_id           uuid REFERENCES kresilo_demo.proposals(id) ON DELETE SET NULL,
  source_reference_ids  text[] NOT NULL DEFAULT '{}',
  version_number        integer,
  created_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT decisions_title_len CHECK (btrim(title) <> '' AND length(title) <= 160),
  CONSTRAINT decisions_reason_len CHECK (btrim(reason) <> '' AND length(reason) <= 600),
  CONSTRAINT decisions_kind CHECK (kind IN ('accepted-proposal', 'manual', 'seed'))
);
CREATE INDEX IF NOT EXISTS decisions_project_idx ON kresilo_demo.decisions (project_id, created_at);

-- ----------------------------------------------------------------- versions --
CREATE TABLE IF NOT EXISTS kresilo_demo.versions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES kresilo_demo.projects(id) ON DELETE CASCADE,
  number      integer NOT NULL,
  poster      jsonb NOT NULL,
  note        text,
  origin      text NOT NULL DEFAULT 'manual-save',
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT versions_number_unique UNIQUE (project_id, number),
  CONSTRAINT versions_origin CHECK (origin IN ('seed', 'proposal-approval', 'manual-save'))
);

-- ----------------------------------------------------------- history_events --
-- Append-only. UPDATE/DELETE are blocked by trigger, even for the table owner.
CREATE TABLE IF NOT EXISTS kresilo_demo.history_events (
  id          bigserial PRIMARY KEY,
  project_id  uuid NOT NULL REFERENCES kresilo_demo.projects(id) ON DELETE CASCADE,
  verb        text NOT NULL,
  actor       text NOT NULL DEFAULT 'guest',
  summary     text NOT NULL,
  detail      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT history_summary_len CHECK (btrim(summary) <> '' AND length(summary) <= 300)
);
CREATE INDEX IF NOT EXISTS history_project_idx ON kresilo_demo.history_events (project_id, id DESC);

-- --------------------------------------------------- private preview picks --
CREATE TABLE IF NOT EXISTS kresilo_demo.preview_selections (
  project_id  uuid PRIMARY KEY REFERENCES kresilo_demo.projects(id) ON DELETE CASCADE,
  selection   jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------- immutability ----
CREATE OR REPLACE FUNCTION kresilo_demo._blocked() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'kresilo_demo.% is append-only', TG_TABLE_NAME;
END
$$;

DROP TRIGGER IF EXISTS history_events_no_update ON kresilo_demo.history_events;
CREATE TRIGGER history_events_no_update BEFORE UPDATE ON kresilo_demo.history_events
  FOR EACH ROW EXECUTE FUNCTION kresilo_demo._blocked();
DROP TRIGGER IF EXISTS history_events_no_delete ON kresilo_demo.history_events;
CREATE TRIGGER history_events_no_delete BEFORE DELETE ON kresilo_demo.history_events
  FOR EACH ROW EXECUTE FUNCTION kresilo_demo._blocked();
DROP TRIGGER IF EXISTS versions_no_update ON kresilo_demo.versions;
CREATE TRIGGER versions_no_update BEFORE UPDATE ON kresilo_demo.versions
  FOR EACH ROW EXECUTE FUNCTION kresilo_demo._blocked();
DROP TRIGGER IF EXISTS approvals_no_update_of_key ON kresilo_demo.approvals;
CREATE TRIGGER approvals_no_update_of_key BEFORE UPDATE OF proposal_id, idempotency_key ON kresilo_demo.approvals
  FOR EACH ROW EXECUTE FUNCTION kresilo_demo._blocked();

-- ------------------------------------------------------------- helpers ------
CREATE OR REPLACE FUNCTION kresilo_demo._err(p_code text) RETURNS jsonb
LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_build_object('ok', false, 'code', p_code);
$$;

CREATE OR REPLACE FUNCTION kresilo_demo._ok(p_data jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_build_object('ok', true, 'data', coalesce(p_data, '{}'::jsonb));
$$;

-- VOLATILE on purpose: called from inside mutating commands, where a STABLE
-- read would be pinned to the calling query snapshot and miss just-written rows.
CREATE OR REPLACE FUNCTION kresilo_demo._session_live(p_hash text) RETURNS boolean
LANGUAGE sql VOLATILE AS $$
  SELECT EXISTS (
    SELECT 1 FROM kresilo_demo.sessions
    WHERE session_hash = p_hash AND expires_at > now()
  );
$$;


-- Deep-merge an allowlisted proposal patch onto the live poster. Nothing else
-- in the poster can be reached, and no expression is evaluated.
CREATE OR REPLACE FUNCTION kresilo_demo.apply_patch(p_poster jsonb, p_patch jsonb) RETURNS jsonb
LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(p_poster, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
    'palette', CASE WHEN coalesce(p_patch, '{}'::jsonb) ? 'palette'
                    THEN coalesce(p_poster->'palette', '{}'::jsonb) || (p_patch->'palette') END,
    'composition', CASE WHEN coalesce(p_patch, '{}'::jsonb) ? 'composition'
                    THEN coalesce(p_poster->'composition', '{}'::jsonb) || (p_patch->'composition') END,
    'typography', CASE WHEN coalesce(p_patch, '{}'::jsonb) ? 'typography'
                    THEN coalesce(p_poster->'typography', '{}'::jsonb) || (p_patch->'typography') END
  ));
$$;

CREATE OR REPLACE FUNCTION kresilo_demo.log_event(
  p_project_id uuid, p_verb text, p_summary text, p_detail jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE sql AS $$
  INSERT INTO kresilo_demo.history_events (project_id, verb, summary, detail)
  VALUES (p_project_id, p_verb, p_summary, coalesce(p_detail, '{}'::jsonb));
$$;

-- Snapshot loader. Deliberately returns no session identifier, no owner hash,
-- no tokens: only project-facing design data.
-- VOLATILE: get_project is the last step of every mutating command, so it must
-- read command-local writes (new session, project, poster, decision, version,
-- history) in the same transaction rather than the calling query's snapshot.
CREATE OR REPLACE FUNCTION kresilo_demo.get_project(p_hash text, p_project_id uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE
  v_project jsonb;
BEGIN
  IF NOT kresilo_demo._session_live(p_hash) THEN
    RETURN kresilo_demo._err('SESSION_INVALID');
  END IF;

  SELECT jsonb_build_object(
    'id', pr.id,
    'title', pr.title,
    'visibility', pr.visibility,
    'poster', pr.poster,
    'posterVersion', pr.poster_version,
    'updatedAt', pr.updated_at,
    'references', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'id', r.ref_key, 'dbId', r.id, 'kind', r.kind, 'name', r.name,
               'source', r.source, 'reason', r.reason, 'tags', r.tags,
               'swatches', r.swatches, 'urlNote', r.url_note, 'position', r.position,
               'addedAt', r.created_at)
             ORDER BY r.position, r.created_at)
      FROM kresilo_demo."references" r WHERE r.project_id = pr.id), '[]'::jsonb),
    'proposals', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'id', p.id, 'intent', p.intent, 'status', p.status, 'rationale', p.rationale,
               'patch', p.patch, 'paletteBefore', p.palette_before, 'paletteAfter', p.palette_after,
               'cites', p.cites, 'costLabel', p.cost_label, 'createdAt', p.created_at,
               'updatedAt', p.updated_at, 'appliedVersion', p.applied_version)
             ORDER BY p.created_at DESC)
      FROM kresilo_demo.proposals p WHERE p.project_id = pr.id), '[]'::jsonb),
    'approvals', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'id', a.id, 'proposalId', a.proposal_id, 'decisionId', a.decision_id,
               'versionId', a.version_id, 'createdAt', a.created_at) ORDER BY a.created_at)
      FROM kresilo_demo.approvals a WHERE a.project_id = pr.id), '[]'::jsonb),
    'decisions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'id', d.id, 'title', d.title, 'reason', d.reason, 'kind', d.kind,
               'proposalId', d.proposal_id, 'sourceReferenceIds', d.source_reference_ids,
               'versionNumber', d.version_number, 'createdAt', d.created_at) ORDER BY d.created_at)
      FROM kresilo_demo.decisions d WHERE d.project_id = pr.id), '[]'::jsonb),
    'versions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'id', v.id, 'number', v.number, 'poster', v.poster, 'note', v.note,
               'origin', v.origin, 'createdAt', v.created_at) ORDER BY v.number)
      FROM kresilo_demo.versions v WHERE v.project_id = pr.id), '[]'::jsonb),
    'history', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'id', h.id, 'verb', h.verb, 'actor', h.actor, 'summary', h.summary,
               'detail', h.detail, 'createdAt', h.created_at) ORDER BY h.id DESC)
      FROM (SELECT * FROM kresilo_demo.history_events hx WHERE hx.project_id = pr.id
            ORDER BY hx.id DESC LIMIT 80) h), '[]'::jsonb),
    'previewSelection', COALESCE(
      (SELECT ps.selection FROM kresilo_demo.preview_selections ps WHERE ps.project_id = pr.id),
      '{}'::jsonb)
  )
  INTO v_project
  FROM kresilo_demo.projects pr
  WHERE pr.id = p_project_id AND pr.owner_hash = p_hash;

  IF v_project IS NULL THEN
    RETURN kresilo_demo._err('FORBIDDEN');
  END IF;

  RETURN kresilo_demo._ok(v_project);
END
$$;

-- ------------------------------------------------------------- ensure_guest --
-- Atomic: session + private seeded project + references + decisions + version 1
-- + history in a single statement. Idempotent per session hash.
--
-- IMPORTANT (app-side contract): this function renews the activity window of an
-- existing session row, so the server must call kresilo_demo._session_live(hash)
-- FIRST and rotate to a brand-new guest token when it answers false. Expiry is
-- enforced in server/routes/api/*, not here, so an expired credential can never
-- re-claim the project it used to own.
CREATE OR REPLACE FUNCTION kresilo_demo.ensure_guest(
  p_hash text, p_expires_at timestamptz, p_seed jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path = kresilo_demo, pg_temp
AS $$
DECLARE
  v_project uuid;
  v_hash_ok boolean := (p_hash IS NOT NULL AND p_hash ~ '^[a-f0-9]{64}$');
  v_title text := btrim(coalesce(p_seed->>'title', ''));
  v_poster jsonb := p_seed->'poster';
BEGIN
  IF NOT v_hash_ok THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;
  IF v_title = '' OR length(v_title) > 120 THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;
  IF jsonb_typeof(v_poster) <> 'object' THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;

  -- Serialize concurrent first requests for one guest hash. The advisory lock
  -- is transaction-scoped, so only one session can be seeding this guest.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_hash, 0));

  INSERT INTO kresilo_demo.sessions (id, session_hash, expires_at)
    VALUES (gen_random_uuid(), p_hash, p_expires_at)
  ON CONFLICT (session_hash) DO UPDATE
    SET last_seen_at = now(),
        -- sliding activity window, hard-capped at 45 days from first sight
        expires_at = GREATEST(
          kresilo_demo.sessions.expires_at,
          LEAST(EXCLUDED.expires_at, kresilo_demo.sessions.created_at + interval '45 days'));

  SELECT id INTO v_project FROM kresilo_demo.projects WHERE owner_hash = p_hash;
  IF v_project IS NOT NULL THEN
    -- Repeated ensure_guest always returns the existing project, never a second one.
    RETURN kresilo_demo._ok(jsonb_build_object(
      'alreadyExisted', true, 'snapshot', kresilo_demo.get_project(p_hash, v_project)));
  END IF;

  INSERT INTO kresilo_demo.projects (id, owner_hash, title, visibility, poster, poster_version)
    VALUES (gen_random_uuid(), p_hash, v_title, 'private', v_poster, 1)
    ON CONFLICT (owner_hash) DO NOTHING
    RETURNING id INTO v_project;

  IF v_project IS NULL THEN
    -- Lost the race against an identical request: return the project it created.
    SELECT id INTO v_project FROM kresilo_demo.projects WHERE owner_hash = p_hash;
    IF v_project IS NOT NULL THEN
      RETURN kresilo_demo._ok(jsonb_build_object(
        'alreadyExisted', true, 'snapshot', kresilo_demo.get_project(p_hash, v_project)));
    END IF;
    RETURN kresilo_demo._err('STORAGE_ERROR');
  END IF;

  INSERT INTO kresilo_demo."references"
        (id, project_id, ref_key, kind, name, source, reason, tags, swatches, url_note, position)
  SELECT gen_random_uuid(), v_project,
         r->>'key',
         CASE WHEN r->>'kind' IN ('bundled','external-metadata','guest')
              THEN r->>'kind' ELSE 'bundled' END,
         left(btrim(r->>'name'), 140),
         left(btrim(coalesce(r->>'source', 'Salt Flats study')), 200),
         left(btrim(r->>'reason'), 600),
         COALESCE(ARRAY(SELECT jsonb_array_elements_text(r->'tags')), '{}'),
         COALESCE(ARRAY(SELECT jsonb_array_elements_text(r->'swatches')), '{}'),
         left(r->>'urlNote', 200),
         ord
    FROM jsonb_array_elements(COALESCE(p_seed->'references', '[]'::jsonb))
         WITH ORDINALITY AS t(r, ord)
   WHERE btrim(COALESCE(r->>'reason', '')) <> ''
     AND btrim(COALESCE(r->>'name', '')) <> ''
     AND COALESCE(r->>'key', '') <> '';

  INSERT INTO kresilo_demo.decisions
        (id, project_id, title, reason, kind, source_reference_ids, version_number)
  SELECT gen_random_uuid(), v_project,
         left(btrim(d->>'title'), 160),
         left(btrim(d->>'reason'), 600),
         'seed',
         COALESCE(ARRAY(SELECT jsonb_array_elements_text(d->'sourceReferenceIds')), '{}'),
         1
    FROM jsonb_array_elements(COALESCE(p_seed->'decisions', '[]'::jsonb)) AS d
   WHERE btrim(COALESCE(d->>'title', '')) <> ''
     AND btrim(COALESCE(d->>'reason', '')) <> '';

  INSERT INTO kresilo_demo.versions (id, project_id, number, poster, note, origin)
    VALUES (gen_random_uuid(), v_project, 1, v_poster, 'Seeded Salt Flats poster v4', 'seed');

  IF jsonb_typeof(p_seed->'proposals') = 'array' THEN
    INSERT INTO kresilo_demo.proposals
          (id, project_id, intent, status, rationale, patch, palette_before, palette_after, cites, source)
    SELECT gen_random_uuid(), v_project,
           left(btrim(pr->>'intent'), 500), 'proposed',
           left(btrim(pr->>'rationale'), 600),
           COALESCE(pr->'patch', '{}'::jsonb),
           COALESCE(pr->'paletteBefore', '{}'::jsonb),
           COALESCE(pr->'paletteAfter', '{}'::jsonb),
           COALESCE(ARRAY(SELECT jsonb_array_elements_text(pr->'cites')), '{}'),
           'prototype-guidance'
      FROM jsonb_array_elements(p_seed->'proposals') AS pr
     WHERE btrim(COALESCE(pr->>'intent', '')) <> '';
  END IF;

  PERFORM kresilo_demo.log_event(v_project, 'project.seed',
    'Seeded private Salt Flats project for a new guest',
    jsonb_build_object('posterVersion', 1));

  RETURN kresilo_demo._ok(jsonb_build_object(
    'alreadyExisted', false, 'snapshot', kresilo_demo.get_project(p_hash, v_project)));
EXCEPTION
  WHEN unique_violation THEN
    -- A concurrent request for this guest won the race. Never surface a
    -- transient uniqueness error: return the project that now exists.
    SELECT id INTO v_project FROM kresilo_demo.projects WHERE owner_hash = p_hash;
    IF v_project IS NULL THEN RETURN kresilo_demo._err('STORAGE_ERROR'); END IF;
    RETURN kresilo_demo._ok(jsonb_build_object(
      'alreadyExisted', true, 'snapshot', kresilo_demo.get_project(p_hash, v_project)));
  WHEN OTHERS THEN
    RETURN kresilo_demo._err('STORAGE_ERROR');
END
$$;

-- ------------------------------------------------------------- reference.add
CREATE OR REPLACE FUNCTION kresilo_demo.add_reference(
  p_hash text, p_project_id uuid, p_ref jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path = kresilo_demo, pg_temp
AS $$
DECLARE
  v_pid uuid;
  v_count integer;
  v_key text := lower(btrim(COALESCE(p_ref->>'key', '')));
  v_name text := btrim(COALESCE(p_ref->>'name', ''));
  v_reason text := btrim(COALESCE(p_ref->>'reason', ''));
  v_source text := btrim(COALESCE(p_ref->>'source', ''));
BEGIN
  IF NOT kresilo_demo._session_live(p_hash) THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
  SELECT id INTO v_pid FROM kresilo_demo.projects
   WHERE id = p_project_id AND owner_hash = p_hash FOR UPDATE;
  IF NOT FOUND THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;

  IF v_key = '' OR length(v_key) > 80 OR v_key !~ '^[a-z0-9][a-z0-9._-]*$'
     OR v_name = '' OR v_reason = '' OR v_source = '' THEN
    RETURN kresilo_demo._err('REASON_REQUIRED');
  END IF;

  SELECT count(*) INTO v_count FROM kresilo_demo."references" WHERE project_id = v_pid;
  IF v_count >= 40 THEN RETURN kresilo_demo._err('LIMIT_REACHED'); END IF;
  IF EXISTS (SELECT 1 FROM kresilo_demo."references" WHERE project_id = v_pid AND ref_key = v_key) THEN
    RETURN kresilo_demo._err('DUPLICATE_REFERENCE');
  END IF;

  INSERT INTO kresilo_demo."references"
        (id, project_id, ref_key, kind, name, source, reason, tags, swatches, url_note, position)
  VALUES (gen_random_uuid(), v_pid, v_key, 'guest', left(v_name, 140), left(v_source, 200),
          left(v_reason, 600),
          COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_ref->'tags')), '{}'),
          COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_ref->'swatches')), '{}'),
          left(p_ref->>'urlNote', 200),
          v_count + 1);

  PERFORM kresilo_demo.log_event(v_pid, 'reference.add',
    'Added reference "' || left(v_name, 60) || '"',
    jsonb_build_object('refKey', v_key, 'reasonLength', length(v_reason)));

  RETURN kresilo_demo._ok(jsonb_build_object('snapshot', kresilo_demo.get_project(p_hash, v_pid)));
EXCEPTION WHEN OTHERS THEN
  RETURN kresilo_demo._err('STORAGE_ERROR');
END
$$;

-- ------------------------------------------------------------ proposal.new
CREATE OR REPLACE FUNCTION kresilo_demo.create_proposal(
  p_hash text, p_project_id uuid, p_proposal jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path = kresilo_demo, pg_temp
AS $$
DECLARE
  v_pid uuid;
  v_intent text := btrim(COALESCE(p_proposal->>'intent', ''));
  v_id uuid;
BEGIN
  IF NOT kresilo_demo._session_live(p_hash) THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
  SELECT id INTO v_pid FROM kresilo_demo.projects
   WHERE id = p_project_id AND owner_hash = p_hash FOR UPDATE;
  IF NOT FOUND THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
  IF v_intent = '' OR length(v_intent) > 500 THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;

  INSERT INTO kresilo_demo.proposals
        (id, project_id, intent, status, rationale, patch, palette_before, palette_after, cites, cost_label)
  VALUES (gen_random_uuid(), v_pid, left(v_intent, 500), 'proposed',
          left(btrim(COALESCE(p_proposal->>'rationale', 'Prototype guidance.')), 600),
          COALESCE(p_proposal->'patch', '{}'::jsonb),
          COALESCE(p_proposal->'paletteBefore', '{}'::jsonb),
          COALESCE(p_proposal->'paletteAfter', '{}'::jsonb),
          COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_proposal->'cites')), '{}'),
          left(COALESCE(p_proposal->>'costLabel', '0 demo credits - no external service called'), 120))
  RETURNING id INTO v_id;

  -- The active poster is explicitly NOT touched by proposal.create.
  PERFORM kresilo_demo.log_event(v_pid, 'proposal.create',
    'Proposed: ' || left(v_intent, 60),
    jsonb_build_object('proposalId', v_id, 'posterChanged', false));

  RETURN kresilo_demo._ok(jsonb_build_object('proposalId', v_id,
    'snapshot', kresilo_demo.get_project(p_hash, v_pid)));
EXCEPTION WHEN OTHERS THEN
  RETURN kresilo_demo._err('STORAGE_ERROR');
END
$$;

-- ------------------------------------------------------------- proposal.edit
-- Allowed only while the proposal is still open.
CREATE OR REPLACE FUNCTION kresilo_demo.edit_proposal(
  p_hash text, p_project_id uuid, p_proposal_id uuid, p_patch jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path = kresilo_demo, pg_temp
AS $$
DECLARE
  v_pid uuid;
  v_proposal kresilo_demo.proposals;
BEGIN
  IF NOT kresilo_demo._session_live(p_hash) THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
  SELECT id INTO v_pid FROM kresilo_demo.projects
   WHERE id = p_project_id AND owner_hash = p_hash FOR UPDATE;
  IF NOT FOUND THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;

  SELECT * INTO v_proposal FROM kresilo_demo.proposals
   WHERE id = p_proposal_id AND project_id = v_pid FOR UPDATE;
  IF NOT FOUND THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
  IF v_proposal.status <> 'proposed' THEN RETURN kresilo_demo._err('PROPOSAL_CLOSED'); END IF;

  UPDATE kresilo_demo.proposals
     SET patch = kresilo_demo.apply_patch(v_proposal.patch, COALESCE(p_patch, '{}'::jsonb)),
         palette_after = COALESCE(p_patch->'palette', palette_after),
         updated_at = now()
   WHERE id = v_proposal.id;

  PERFORM kresilo_demo.log_event(v_pid, 'proposal.edit',
    'Edited the proposed warm accent before approval',
    jsonb_build_object('proposalId', v_proposal.id));

  RETURN kresilo_demo._ok(jsonb_build_object('snapshot', kresilo_demo.get_project(p_hash, v_pid)));
EXCEPTION WHEN OTHERS THEN
  RETURN kresilo_demo._err('STORAGE_ERROR');
END
$$;

-- ---------------------------------------------------------- proposal.approve
-- ONE statement = ONE transaction: row lock + idempotent approval insert +
-- poster change + Decision + Version + History, atomically.
CREATE OR REPLACE FUNCTION kresilo_demo.approve_proposal(
  p_hash text, p_project_id uuid, p_proposal_id uuid, p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path = kresilo_demo, pg_temp
AS $$
DECLARE
  v_pid uuid;
  v_proposal kresilo_demo.proposals;
  v_poster jsonb;
  v_number integer;
  v_decision_id uuid;
  v_version_id uuid;
  v_key text := nullif(left(btrim(COALESCE(p_idempotency_key, '')), 120), '');
BEGIN
  IF NOT kresilo_demo._session_live(p_hash) THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;

  SELECT id INTO v_pid FROM kresilo_demo.projects
   WHERE id = p_project_id AND owner_hash = p_hash FOR UPDATE;
  IF NOT FOUND THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;

  SELECT * INTO v_proposal FROM kresilo_demo.proposals
   WHERE id = p_proposal_id AND project_id = v_pid FOR UPDATE;
  IF NOT FOUND THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;

  -- Duplicate approval semantics are deliberate, and never claim false success:
  --   approved    -> safely idempotent, returns the already-written result
  --   declined    -> the proposal is CLOSED, so it is NOT reported as approved
  --   superseded  -> likewise closed
  IF v_proposal.status = 'approved' THEN
    RETURN kresilo_demo._ok(jsonb_build_object('alreadyApplied', true, 'status', 'approved',
      'snapshot', kresilo_demo.get_project(p_hash, v_pid)));
  END IF;
  IF v_proposal.status <> 'proposed' THEN
    RETURN kresilo_demo._err('PROPOSAL_CLOSED');
  END IF;

  BEGIN
    INSERT INTO kresilo_demo.approvals (id, proposal_id, project_id, idempotency_key)
      VALUES (gen_random_uuid(), v_proposal.id, v_pid, v_key);
  EXCEPTION WHEN unique_violation THEN
    IF EXISTS (SELECT 1 FROM kresilo_demo.approvals a WHERE a.proposal_id = v_proposal.id) THEN
      -- This exact proposal was approved by a concurrent request: idempotent.
      RETURN kresilo_demo._ok(jsonb_build_object('alreadyApplied', true, 'status', 'approved',
        'snapshot', kresilo_demo.get_project(p_hash, v_pid)));
    END IF;
    -- The key was already used for a DIFFERENT proposal: that is a client bug,
    -- not a repeat of this approval. Never report it as successfully applied.
    RETURN kresilo_demo._err('IDEMPOTENCY_CONFLICT');
  END;

  v_poster := kresilo_demo.apply_patch(
    (SELECT poster FROM kresilo_demo.projects WHERE id = v_pid), v_proposal.patch);
  v_number := (SELECT poster_version FROM kresilo_demo.projects WHERE id = v_pid) + 1;

  UPDATE kresilo_demo.projects
     SET poster = v_poster, poster_version = v_number, updated_at = now()
   WHERE id = v_pid;

  INSERT INTO kresilo_demo.versions (id, project_id, number, poster, note, origin)
    VALUES (gen_random_uuid(), v_pid, v_number, v_poster,
            left('Accepted: ' || btrim(v_proposal.intent), 200), 'proposal-approval')
    RETURNING id INTO v_version_id;

  INSERT INTO kresilo_demo.decisions
        (id, project_id, title, reason, kind, proposal_id, source_reference_ids, version_number)
  VALUES (gen_random_uuid(), v_pid,
          left(btrim(v_proposal.intent), 160),
          left(btrim(v_proposal.rationale), 600),
          'accepted-proposal', v_proposal.id, v_proposal.cites, v_number)
    RETURNING id INTO v_decision_id;

  UPDATE kresilo_demo.approvals
     SET decision_id = v_decision_id, version_id = v_version_id
   WHERE proposal_id = v_proposal.id;

  UPDATE kresilo_demo.proposals
     SET status = 'approved', approved_at = now(), updated_at = now(), applied_version = v_number
   WHERE id = v_proposal.id;

  PERFORM kresilo_demo.log_event(v_pid, 'proposal.approve',
    'Approved proposal - poster, decision, version v' || v_number || ' written atomically',
    jsonb_build_object('proposalId', v_proposal.id, 'versionNumber', v_number,
                       'decisionId', v_decision_id, 'cites', v_proposal.cites));

  RETURN kresilo_demo._ok(jsonb_build_object('alreadyApplied', false, 'versionNumber', v_number,
    'snapshot', kresilo_demo.get_project(p_hash, v_pid)));
EXCEPTION WHEN OTHERS THEN
  RETURN kresilo_demo._err('STORAGE_ERROR');
END
$$;

-- --------------------------------------------------------- proposal.decline
-- Active artwork is never modified; only a rejection history row is appended.
CREATE OR REPLACE FUNCTION kresilo_demo.decline_proposal(
  p_hash text, p_project_id uuid, p_proposal_id uuid, p_note text
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path = kresilo_demo, pg_temp
AS $$
DECLARE
  v_pid uuid;
  v_proposal kresilo_demo.proposals;
BEGIN
  IF NOT kresilo_demo._session_live(p_hash) THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
  SELECT id INTO v_pid FROM kresilo_demo.projects
   WHERE id = p_project_id AND owner_hash = p_hash FOR UPDATE;
  IF NOT FOUND THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;

  SELECT * INTO v_proposal FROM kresilo_demo.proposals
   WHERE id = p_proposal_id AND project_id = v_pid FOR UPDATE;
  IF NOT FOUND THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
  IF v_proposal.status <> 'proposed' THEN RETURN kresilo_demo._err('PROPOSAL_CLOSED'); END IF;

  UPDATE kresilo_demo.proposals
     SET status = 'declined', declined_at = now(), updated_at = now()
   WHERE id = v_proposal.id;

  PERFORM kresilo_demo.log_event(v_pid, 'proposal.decline',
    'Declined proposal - active poster unchanged',
    jsonb_build_object('proposalId', v_proposal.id, 'note', left(btrim(COALESCE(p_note, '')), 200)));

  RETURN kresilo_demo._ok(jsonb_build_object('snapshot', kresilo_demo.get_project(p_hash, v_pid)));
EXCEPTION WHEN OTHERS THEN
  RETURN kresilo_demo._err('STORAGE_ERROR');
END
$$;

-- ------------------------------------------------------------- decision.add
-- Shared by the GUI and the terminal (`kresilo decision add`).
CREATE OR REPLACE FUNCTION kresilo_demo.add_decision(
  p_hash text, p_project_id uuid, p_title text, p_reason text, p_sources jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path = kresilo_demo, pg_temp
AS $$
DECLARE
  v_pid uuid;
  v_decision_id uuid;
  v_title text := btrim(COALESCE(p_title, ''));
  v_reason text := btrim(COALESCE(p_reason, ''));
BEGIN
  IF NOT kresilo_demo._session_live(p_hash) THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
  SELECT id INTO v_pid FROM kresilo_demo.projects
   WHERE id = p_project_id AND owner_hash = p_hash FOR UPDATE;
  IF NOT FOUND THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
  IF v_title = '' OR v_reason = '' THEN RETURN kresilo_demo._err('REASON_REQUIRED'); END IF;

  INSERT INTO kresilo_demo.decisions (id, project_id, title, reason, kind, source_reference_ids)
  VALUES (gen_random_uuid(), v_pid, left(v_title, 160), left(v_reason, 600), 'manual',
          COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_sources)), '{}'))
  RETURNING id INTO v_decision_id;

  PERFORM kresilo_demo.log_event(v_pid, 'decision.add',
    'Decision recorded: ' || left(v_title, 60),
    jsonb_build_object('decisionId', v_decision_id));

  RETURN kresilo_demo._ok(jsonb_build_object('decisionId', v_decision_id,
    'snapshot', kresilo_demo.get_project(p_hash, v_pid)));
EXCEPTION WHEN OTHERS THEN
  RETURN kresilo_demo._err('STORAGE_ERROR');
END
$$;

-- ------------------------------------------------------------ version.save
CREATE OR REPLACE FUNCTION kresilo_demo.save_version(
  p_hash text, p_project_id uuid, p_note text
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path = kresilo_demo, pg_temp
AS $$
DECLARE
  v_pid uuid;
  v_number integer;
  v_poster jsonb;
BEGIN
  IF NOT kresilo_demo._session_live(p_hash) THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
  SELECT id, poster, poster_version INTO v_pid, v_poster, v_number
    FROM kresilo_demo.projects
   WHERE id = p_project_id AND owner_hash = p_hash FOR UPDATE;
  IF NOT FOUND THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;

  v_number := v_number + 1;
  INSERT INTO kresilo_demo.versions (id, project_id, number, poster, note, origin)
    VALUES (gen_random_uuid(), v_pid, v_number, v_poster,
            left(btrim(COALESCE(p_note, 'Manual save')), 200), 'manual-save');
  UPDATE kresilo_demo.projects SET poster_version = v_number, updated_at = now() WHERE id = v_pid;

  PERFORM kresilo_demo.log_event(v_pid, 'version.save',
    'Saved immutable version v' || v_number, jsonb_build_object('versionNumber', v_number));

  RETURN kresilo_demo._ok(jsonb_build_object('versionNumber', v_number,
    'snapshot', kresilo_demo.get_project(p_hash, v_pid)));
EXCEPTION WHEN OTHERS THEN
  RETURN kresilo_demo._err('STORAGE_ERROR');
END
$$;

-- ------------------------------------------------------------ history.list
-- History is read back in the same request as the command that appended to it,
-- so it must be VOLATILE like every other session-facing read (see header).
CREATE OR REPLACE FUNCTION kresilo_demo.list_history(
  p_hash text, p_project_id uuid, p_limit integer DEFAULT 40
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE
SET search_path = kresilo_demo, pg_temp
AS $$
DECLARE
  v_owned boolean;
  v_events jsonb;
BEGIN
  IF NOT kresilo_demo._session_live(p_hash) THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
  SELECT EXISTS (SELECT 1 FROM kresilo_demo.projects
                  WHERE id = p_project_id AND owner_hash = p_hash) INTO v_owned;
  IF NOT v_owned THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', h.id, 'verb', h.verb, 'actor', h.actor, 'summary', h.summary,
           'detail', h.detail, 'createdAt', h.created_at) ORDER BY h.id DESC), '[]'::jsonb)
    INTO v_events
    FROM (SELECT * FROM kresilo_demo.history_events
           WHERE project_id = p_project_id ORDER BY id DESC
           LIMIT GREATEST(LEAST(COALESCE(p_limit, 40), 200), 1)) h;

  RETURN kresilo_demo._ok(jsonb_build_object('history', v_events));
EXCEPTION WHEN OTHERS THEN
  RETURN kresilo_demo._err('STORAGE_ERROR');
END
$$;

-- ------------------------------------------------------------- retention ---
-- Retention is enforced by kresilo_demo._session_live plus the server's
-- rotate-on-expiry contract (see ensure_guest above): an expired guest can never
-- re-claim the project it used to own. No cleanup routine is created here, and
-- the application never claims that expired rows were deleted.

-- --------------------------------------------------- publish preview choice
CREATE OR REPLACE FUNCTION kresilo_demo.set_preview_selection(
  p_hash text, p_project_id uuid, p_selection jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path = kresilo_demo, pg_temp
AS $$
DECLARE
  v_pid uuid;
BEGIN
  IF NOT kresilo_demo._session_live(p_hash) THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
  SELECT id INTO v_pid FROM kresilo_demo.projects
   WHERE id = p_project_id AND owner_hash = p_hash FOR UPDATE;
  IF NOT FOUND THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;

  INSERT INTO kresilo_demo.preview_selections (project_id, selection, updated_at)
    VALUES (v_pid, COALESCE(p_selection, '{}'::jsonb), now())
    ON CONFLICT (project_id) DO UPDATE
      SET selection = EXCLUDED.selection, updated_at = now();

  PERFORM kresilo_demo.log_event(v_pid, 'publish.preview',
    'Updated private preview selection', COALESCE(p_selection, '{}'::jsonb));

  RETURN kresilo_demo._ok(jsonb_build_object('selection', p_selection));
EXCEPTION WHEN OTHERS THEN
  RETURN kresilo_demo._err('STORAGE_ERROR');
END
$$;

-- Verification helper: what exists in kresilo_demo after this migration.
SELECT jsonb_build_object(
  'schema', 'kresilo_demo',
  'tables', (SELECT jsonb_agg(c.relname ORDER BY c.relname)
             FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'kresilo_demo' AND c.relkind = 'r'),
  'functions', (SELECT jsonb_agg(p.proname ORDER BY p.proname)
                FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE n.nspname = 'kresilo_demo')
) AS kresilo_demo_migration_state;
