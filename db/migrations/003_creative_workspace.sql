-- Additive creative workspace. Runtime objects remain in kresilo_demo only.
-- Existing prototype projects, history and sessions are preserved.
CREATE TABLE IF NOT EXISTS kresilo_demo.creative_people (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), google_subject text UNIQUE,
 profile jsonb NOT NULL DEFAULT '{"name":"You","taste":[],"following":[],"mode":"explorer"}',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS kresilo_demo.creative_sessions (
 session_hash text PRIMARY KEY REFERENCES kresilo_demo.sessions(session_hash),
 person_id uuid NOT NULL REFERENCES kresilo_demo.creative_people(id)
);
CREATE TABLE IF NOT EXISTS kresilo_demo.creative_projects (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES kresilo_demo.creative_people(id),
 document jsonb NOT NULL, revision integer NOT NULL DEFAULT 1,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS kresilo_demo.creative_members (
 project_id uuid REFERENCES kresilo_demo.creative_projects(id),
 person_id uuid REFERENCES kresilo_demo.creative_people(id),
 PRIMARY KEY(project_id,person_id)
);
CREATE TABLE IF NOT EXISTS kresilo_demo.creative_invites (
 token_hash text PRIMARY KEY, project_id uuid NOT NULL REFERENCES kresilo_demo.creative_projects(id),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days', used_by uuid
);
CREATE TABLE IF NOT EXISTS kresilo_demo.creative_publications (
 id uuid PRIMARY KEY, project_id uuid NOT NULL REFERENCES kresilo_demo.creative_projects(id),
 audience text NOT NULL CHECK(audience IN ('private','community')),
 document jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION kresilo_demo.creative_person(p_hash text) RETURNS uuid
LANGUAGE sql VOLATILE AS $$
 SELECT person_id FROM kresilo_demo.creative_sessions WHERE session_hash=p_hash AND kresilo_demo._session_live(p_hash)
$$;
CREATE OR REPLACE FUNCTION kresilo_demo.creative_open(p_hash text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_person uuid; v_profile jsonb; v_google text;
BEGIN
 IF NOT kresilo_demo._session_live(p_hash) THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_hash,1));
 SELECT person_id INTO v_person FROM kresilo_demo.creative_sessions WHERE session_hash=p_hash;
 IF v_person IS NULL THEN
  INSERT INTO kresilo_demo.creative_people DEFAULT VALUES RETURNING id INTO v_person;
  INSERT INTO kresilo_demo.creative_sessions VALUES(p_hash,v_person);
 END IF;
 SELECT profile,google_subject INTO v_profile,v_google FROM kresilo_demo.creative_people WHERE id=v_person;
 RETURN kresilo_demo._ok(jsonb_build_object('person',v_profile||jsonb_build_object('id',v_person,'account',v_google IS NOT NULL),
  'projects',coalesce((SELECT jsonb_agg(jsonb_build_object('id',p.id,'document',p.document,'revision',p.revision,'owner',p.owner_id=v_person) ORDER BY p.updated_at DESC)
   FROM kresilo_demo.creative_projects p WHERE p.owner_id=v_person OR EXISTS(SELECT 1 FROM kresilo_demo.creative_members m WHERE m.project_id=p.id AND m.person_id=v_person)),'[]')));
END $$;
CREATE OR REPLACE FUNCTION kresilo_demo.creative_get(p_hash text,p_id uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_project jsonb;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 SELECT jsonb_build_object('id',p.id,'document',p.document,'revision',p.revision,'owner',p.owner_id=v_person) INTO v_project
 FROM kresilo_demo.creative_projects p WHERE p.id=p_id AND (p.owner_id=v_person OR EXISTS(SELECT 1 FROM kresilo_demo.creative_members m WHERE m.project_id=p.id AND m.person_id=v_person));
 IF v_project IS NULL THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 RETURN kresilo_demo._ok(v_project);
END $$;
-- Compare-and-swap makes the whole validated command atomic. Stale edits cannot
-- erase another collaborator's changes, approvals or immutable version history.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_save(p_hash text,p_id uuid,p_revision integer,p_document jsonb) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_old kresilo_demo.creative_projects; v_new integer;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 IF pg_column_size(p_document)>2000000 OR jsonb_typeof(p_document)<>'object' THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_id::text,2));
 SELECT * INTO v_old FROM kresilo_demo.creative_projects WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN
  IF p_revision<>0 THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
  IF (SELECT count(*) FROM kresilo_demo.creative_projects WHERE owner_id=v_person)>=20 THEN RETURN kresilo_demo._err('LIMIT_REACHED'); END IF;
  INSERT INTO kresilo_demo.creative_projects(id,owner_id,document) VALUES(p_id,v_person,p_document);
 ELSE
  IF v_old.owner_id<>v_person AND NOT EXISTS(SELECT 1 FROM kresilo_demo.creative_members WHERE project_id=p_id AND person_id=v_person) THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
  IF v_old.revision<>p_revision THEN RETURN kresilo_demo._err('CONFLICT'); END IF;
  -- Historical snapshots must retain the exact immutable prefix.
  IF jsonb_array_length(p_document->'versions')<jsonb_array_length(v_old.document->'versions') THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(v_old.document->'versions') WITH ORDINALITY a(value,ord)
   WHERE a.value IS DISTINCT FROM (p_document->'versions')->(a.ord::integer-1)) THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;
  UPDATE kresilo_demo.creative_projects SET document=p_document,revision=revision+1,updated_at=now() WHERE id=p_id;
 END IF;
 RETURN kresilo_demo.creative_get(p_hash,p_id);
END $$;
CREATE OR REPLACE FUNCTION kresilo_demo.creative_profile(p_hash text,p_profile jsonb) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash);
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 UPDATE kresilo_demo.creative_people SET profile=profile||p_profile WHERE id=v_person;
 RETURN kresilo_demo.creative_open(p_hash);
END $$;
-- Called only after the server exchanges a Google code and verifies userinfo.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_google(p_hash text,p_subject text,p_name text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_guest uuid:=kresilo_demo.creative_person(p_hash); v_account uuid;
BEGIN
 IF v_guest IS NULL OR length(p_subject)<3 THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 IF EXISTS(SELECT 1 FROM kresilo_demo.creative_people WHERE id=v_guest AND google_subject IS NOT NULL AND google_subject<>p_subject) THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_subject,3));
 SELECT id INTO v_account FROM kresilo_demo.creative_people WHERE google_subject=p_subject;
 IF v_account IS NULL THEN
  UPDATE kresilo_demo.creative_people SET google_subject=p_subject,profile=profile||jsonb_build_object('name',left(p_name,80)) WHERE id=v_guest;
 ELSE
  -- Adopt only this guest's work, never another signed-in person's projects.
  IF EXISTS(SELECT 1 FROM kresilo_demo.creative_people WHERE id=v_guest AND google_subject IS NOT NULL AND google_subject<>p_subject) THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
  IF v_account<>v_guest THEN
   UPDATE kresilo_demo.creative_projects SET owner_id=v_account WHERE owner_id=v_guest;
   INSERT INTO kresilo_demo.creative_members SELECT project_id,v_account FROM kresilo_demo.creative_members WHERE person_id=v_guest ON CONFLICT DO NOTHING;
   UPDATE kresilo_demo.creative_sessions SET person_id=v_account WHERE session_hash=p_hash;
  END IF;
 END IF;
 RETURN kresilo_demo.creative_open(p_hash);
END $$;
CREATE OR REPLACE FUNCTION kresilo_demo.creative_invite(p_hash text,p_id uuid,p_token text) RETURNS jsonb
LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM kresilo_demo.creative_projects WHERE id=p_id AND owner_id=kresilo_demo.creative_person(p_hash)) THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 INSERT INTO kresilo_demo.creative_invites(token_hash,project_id) VALUES(p_token,p_id);
 RETURN kresilo_demo._ok('{}');
END $$;
CREATE OR REPLACE FUNCTION kresilo_demo.creative_join(p_hash text,p_token text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_invite kresilo_demo.creative_invites;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 SELECT * INTO v_invite FROM kresilo_demo.creative_invites WHERE token_hash=p_token AND expires_at>now() FOR UPDATE;
 IF NOT FOUND OR (v_invite.used_by IS NOT NULL AND v_invite.used_by<>v_person) THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 INSERT INTO kresilo_demo.creative_members VALUES(v_invite.project_id,v_person) ON CONFLICT DO NOTHING;
 UPDATE kresilo_demo.creative_invites SET used_by=v_person WHERE token_hash=p_token;
 RETURN kresilo_demo.creative_get(p_hash,v_invite.project_id);
END $$;
CREATE OR REPLACE FUNCTION kresilo_demo.creative_publish(p_hash text,p_id uuid,p_revision integer,p_publication uuid,p_audience text,p_document jsonb) RETURNS jsonb
LANGUAGE plpgsql AS $$
BEGIN
 IF p_audience NOT IN ('private','community') OR NOT EXISTS(SELECT 1 FROM kresilo_demo.creative_projects WHERE id=p_id AND owner_id=kresilo_demo.creative_person(p_hash) AND revision=p_revision) THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 INSERT INTO kresilo_demo.creative_publications(id,project_id,audience,document) VALUES(p_publication,p_id,p_audience,p_document);
 RETURN kresilo_demo._ok(jsonb_build_object('id',p_publication));
END $$;
CREATE OR REPLACE FUNCTION kresilo_demo.creative_public(p_id uuid) RETURNS jsonb
LANGUAGE sql VOLATILE AS $$
 SELECT coalesce((SELECT kresilo_demo._ok(document||jsonb_build_object('id',id,'audience',audience)) FROM kresilo_demo.creative_publications WHERE id=p_id),kresilo_demo._err('NOT_FOUND'))
$$;
CREATE OR REPLACE FUNCTION kresilo_demo.creative_community() RETURNS jsonb
LANGUAGE sql VOLATILE AS $$
 SELECT kresilo_demo._ok(coalesce(jsonb_agg(document||jsonb_build_object('id',id) ORDER BY created_at DESC),'[]')) FROM (SELECT * FROM kresilo_demo.creative_publications WHERE audience='community' ORDER BY created_at DESC LIMIT 30) p
$$;
CREATE OR REPLACE FUNCTION kresilo_demo.creative_logout(p_hash text) RETURNS jsonb
LANGUAGE plpgsql AS $$
BEGIN
 UPDATE kresilo_demo.sessions SET expires_at=now() WHERE session_hash=p_hash;
 RETURN kresilo_demo._ok('{}');
END $$;
CREATE OR REPLACE FUNCTION kresilo_demo.creative_rotate(p_hash text,p_new text,p_expiry timestamptz) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash);
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 INSERT INTO kresilo_demo.sessions(session_hash,expires_at) VALUES(p_new,least(p_expiry,now()+interval '30 days'));
 INSERT INTO kresilo_demo.creative_sessions VALUES(p_new,v_person);
 UPDATE kresilo_demo.sessions SET expires_at=now() WHERE session_hash=p_hash;
 RETURN kresilo_demo._ok('{}');
END $$;
