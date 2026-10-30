-- Additive: competitions a host sets (a prompt and a deadline), the published
-- projects people enter, and the votes they cast. Runtime objects stay in
-- kresilo_demo. Not applied by agents; the boss applies it.
--
-- The competition itself is a small JSON document checked by the command
-- service (competitionSchema in src/creative/contracts.ts): title, prompt,
-- rules, cover. The dates, the status and the winner are columns because the
-- database decides who may enter and vote, and when. An entry is a project its
-- author published to the community (creative_publications), so everyone who
-- votes can open the work. Rules enforced here, not on the screen:
--   * entries and votes only while the competition is open (status 'open',
--     after opens_at, before closes_at);
--   * the host does not enter their own competition;
--   * one entry per person per competition (a withdrawn entry frees the place);
--   * one vote per person per entry, and none on your own entry;
--   * only the host closes, and a closed competition never changes again.
CREATE TABLE IF NOT EXISTS kresilo_demo.creative_competitions (
 id text PRIMARY KEY CHECK (id ~ '^c-[a-z0-9]{6,16}$'),
 host_id uuid NOT NULL REFERENCES kresilo_demo.creative_people(id),
 doc jsonb NOT NULL CHECK (jsonb_typeof(doc)='object' AND pg_column_size(doc) <= 8192),
 opens_at timestamptz NOT NULL,
 closes_at timestamptz NOT NULL CHECK (closes_at > opens_at),
 status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
 winner_entry uuid,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS creative_competitions_by_close ON kresilo_demo.creative_competitions (closes_at DESC);

CREATE TABLE IF NOT EXISTS kresilo_demo.creative_competition_entries (
 id uuid PRIMARY KEY,
 competition_id text NOT NULL REFERENCES kresilo_demo.creative_competitions(id),
 publication_id uuid NOT NULL REFERENCES kresilo_demo.creative_publications(id),
 project_id uuid NOT NULL REFERENCES kresilo_demo.creative_projects(id),
 author_id uuid NOT NULL REFERENCES kresilo_demo.creative_people(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 withdrawn_at timestamptz
);
-- A person has one live entry per competition, and a post is entered once.
CREATE UNIQUE INDEX IF NOT EXISTS creative_competition_entries_one_each
 ON kresilo_demo.creative_competition_entries (competition_id, author_id) WHERE withdrawn_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS creative_competition_entries_one_post
 ON kresilo_demo.creative_competition_entries (competition_id, publication_id) WHERE withdrawn_at IS NULL;

CREATE TABLE IF NOT EXISTS kresilo_demo.creative_competition_votes (
 entry_id uuid NOT NULL REFERENCES kresilo_demo.creative_competition_entries(id),
 voter_id uuid NOT NULL REFERENCES kresilo_demo.creative_people(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (entry_id, voter_id)
);

-- Anyone may read competitions (or one by id, with its entries). A signed-in viewer also learns
-- which are theirs, their own entry and vote, and which of their published posts they could enter.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_competition_list(p_hash text, p_id text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_person uuid:=CASE WHEN p_hash IS NULL OR p_hash='' THEN NULL ELSE kresilo_demo.creative_person(p_hash) END;
BEGIN
 RETURN kresilo_demo._ok(coalesce((SELECT jsonb_agg(jsonb_build_object(
   'competition', c.doc,
   'hostName', coalesce(nullif(nullif(left(h.profile->>'name',60),''),'You'),'A Kresilo member'),
   'status', c.status,
   'winner', c.winner_entry,
   'entryCount', (SELECT count(*) FROM kresilo_demo.creative_competition_entries e WHERE e.competition_id=c.id AND e.withdrawn_at IS NULL),
   'mine', v_person IS NOT NULL AND c.host_id=v_person,
   'myEntry', (SELECT e.id FROM kresilo_demo.creative_competition_entries e WHERE e.competition_id=c.id AND e.author_id=v_person AND e.withdrawn_at IS NULL),
   'entries', CASE WHEN p_id IS NULL OR p_id='' THEN NULL ELSE coalesce((
     SELECT jsonb_agg(jsonb_build_object(
       'id', e.id,
       'publicationId', e.publication_id,
       'title', pu.document->'art'->>'title',
       'art', pu.document->'art',
       'creator', pu.document->>'creator',
       'votes', (SELECT count(*) FROM kresilo_demo.creative_competition_votes v WHERE v.entry_id=e.id),
       'mine', v_person IS NOT NULL AND e.author_id=v_person,
       'youVoted', v_person IS NOT NULL AND EXISTS(SELECT 1 FROM kresilo_demo.creative_competition_votes v WHERE v.entry_id=e.id AND v.voter_id=v_person)
      ) ORDER BY e.created_at)
     FROM kresilo_demo.creative_competition_entries e
     JOIN kresilo_demo.creative_publications pu ON pu.id=e.publication_id AND pu.withdrawn_at IS NULL
     WHERE e.competition_id=c.id AND e.withdrawn_at IS NULL),'[]'::jsonb) END,
   'posts', CASE WHEN p_id IS NULL OR p_id='' OR v_person IS NULL THEN NULL ELSE coalesce((
     SELECT jsonb_agg(jsonb_build_object('id', pu.id, 'title', pu.document->'art'->>'title', 'art', pu.document->'art') ORDER BY pu.created_at DESC)
     FROM (SELECT pu2.* FROM kresilo_demo.creative_publications pu2
           JOIN kresilo_demo.creative_projects pr ON pr.id=pu2.project_id
           WHERE pr.owner_id=v_person AND pu2.audience='community' AND pu2.withdrawn_at IS NULL
           ORDER BY pu2.created_at DESC LIMIT 12) pu),'[]'::jsonb) END
  ) ORDER BY c.closes_at DESC)
  FROM (SELECT * FROM kresilo_demo.creative_competitions
        WHERE (CASE WHEN p_id IS NOT NULL AND p_id<>'' THEN id=p_id ELSE true END)
        ORDER BY closes_at DESC LIMIT 100) c
  JOIN kresilo_demo.creative_people h ON h.id=c.host_id),'[]'::jsonb));
END $$;

-- The host publishes or updates a competition. Dates come in the document as instants; an id
-- another person hosts is refused, and a closed competition is never edited.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_competition_save(p_hash text, p_competition jsonb) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_id text:=p_competition->>'id'; v_owner uuid; v_status text; v_opens timestamptz; v_closes timestamptz;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 IF jsonb_typeof(p_competition)<>'object' OR v_id IS NULL OR v_id !~ '^c-[a-z0-9]{6,16}$' THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;
 BEGIN
  v_opens:=(p_competition->>'opensAt')::timestamptz; v_closes:=(p_competition->>'closesAt')::timestamptz;
 EXCEPTION WHEN others THEN RETURN kresilo_demo._err('INVALID_INPUT'); END;
 IF v_opens IS NULL OR v_closes IS NULL OR v_closes<=v_opens THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;
 SELECT host_id, status INTO v_owner, v_status FROM kresilo_demo.creative_competitions WHERE id=v_id;
 IF v_owner IS NOT NULL AND v_owner<>v_person THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 IF v_status='closed' THEN RETURN kresilo_demo._err('COMPETITION_CLOSED'); END IF;
 IF v_owner IS NULL AND (SELECT count(*) FROM kresilo_demo.creative_competitions WHERE host_id=v_person AND status='open')>=10 THEN RETURN kresilo_demo._err('LIMIT_REACHED'); END IF;
 INSERT INTO kresilo_demo.creative_competitions(id,host_id,doc,opens_at,closes_at) VALUES(v_id,v_person,p_competition,v_opens,v_closes)
 ON CONFLICT (id) DO UPDATE SET doc=EXCLUDED.doc, opens_at=EXCLUDED.opens_at, closes_at=EXCLUDED.closes_at, updated_at=now();
 RETURN kresilo_demo._ok(jsonb_build_object('id',v_id));
END $$;

-- The host closes the competition and names the winner: the entry they pick, or, with none given,
-- the entry with the most votes (the earliest entry wins a tie). A competition with no entries closes without one.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_competition_close(p_hash text, p_id text, p_winner uuid) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_host uuid; v_status text; v_winner uuid:=p_winner;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 SELECT host_id, status INTO v_host, v_status FROM kresilo_demo.creative_competitions WHERE id=p_id FOR UPDATE;
 IF v_host IS NULL THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 IF v_host<>v_person THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 IF v_status='closed' THEN RETURN kresilo_demo._err('COMPETITION_CLOSED'); END IF;
 IF v_winner IS NULL THEN
  SELECT e.id INTO v_winner FROM kresilo_demo.creative_competition_entries e
   JOIN kresilo_demo.creative_publications pu ON pu.id=e.publication_id AND pu.withdrawn_at IS NULL
   WHERE e.competition_id=p_id AND e.withdrawn_at IS NULL
   ORDER BY (SELECT count(*) FROM kresilo_demo.creative_competition_votes v WHERE v.entry_id=e.id) DESC, e.created_at, e.id LIMIT 1;
 ELSIF NOT EXISTS(SELECT 1 FROM kresilo_demo.creative_competition_entries e
   JOIN kresilo_demo.creative_publications pu ON pu.id=e.publication_id AND pu.withdrawn_at IS NULL
   WHERE e.id=v_winner AND e.competition_id=p_id AND e.withdrawn_at IS NULL) THEN
  RETURN kresilo_demo._err('NOT_FOUND');
 END IF;
 UPDATE kresilo_demo.creative_competitions
  SET status='closed', winner_entry=v_winner, closes_at=least(closes_at, now()), updated_at=now() WHERE id=p_id;
 RETURN kresilo_demo._ok(jsonb_build_object('winner',v_winner));
END $$;

-- A person enters a community post of their own. Not the host, not twice, not after the close.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_competition_enter(p_hash text, p_id text, p_publication uuid) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_host uuid; v_project uuid; v_entry uuid:=gen_random_uuid();
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 SELECT host_id INTO v_host FROM kresilo_demo.creative_competitions
  WHERE id=p_id AND status='open' AND now()>=opens_at AND now()<closes_at FOR SHARE;
 IF v_host IS NULL THEN RETURN kresilo_demo._err('COMPETITION_CLOSED'); END IF;
 IF v_host=v_person THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 SELECT pu.project_id INTO v_project FROM kresilo_demo.creative_publications pu
  JOIN kresilo_demo.creative_projects pr ON pr.id=pu.project_id
  WHERE pu.id=p_publication AND pu.audience='community' AND pu.withdrawn_at IS NULL AND pr.owner_id=v_person;
 IF v_project IS NULL THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_id,16));
 IF EXISTS(SELECT 1 FROM kresilo_demo.creative_competition_entries WHERE competition_id=p_id AND withdrawn_at IS NULL AND (author_id=v_person OR publication_id=p_publication)) THEN RETURN kresilo_demo._err('ALREADY_ENTERED'); END IF;
 IF (SELECT count(*) FROM kresilo_demo.creative_competition_entries WHERE competition_id=p_id AND withdrawn_at IS NULL)>=200 THEN RETURN kresilo_demo._err('LIMIT_REACHED'); END IF;
 INSERT INTO kresilo_demo.creative_competition_entries(id,competition_id,publication_id,project_id,author_id) VALUES(v_entry,p_id,p_publication,v_project,v_person);
 RETURN kresilo_demo._ok(jsonb_build_object('entry',v_entry));
END $$;

-- The author takes their entry out while the competition is open. Its votes go with it.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_competition_withdraw(p_hash text, p_entry uuid) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash);
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 UPDATE kresilo_demo.creative_competition_entries e SET withdrawn_at=now()
  WHERE e.id=p_entry AND e.author_id=v_person AND e.withdrawn_at IS NULL
    AND EXISTS(SELECT 1 FROM kresilo_demo.creative_competitions c WHERE c.id=e.competition_id AND c.status='open');
 IF NOT FOUND THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 RETURN kresilo_demo._ok('{}');
END $$;

-- One vote per person per entry: on adds it, off takes it back. Never on your own entry, only while open.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_competition_vote(p_hash text, p_entry uuid, p_on boolean) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_author uuid; v_comp text;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 IF p_on IS NULL THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;
 SELECT e.author_id, e.competition_id INTO v_author, v_comp FROM kresilo_demo.creative_competition_entries e
  JOIN kresilo_demo.creative_publications pu ON pu.id=e.publication_id AND pu.withdrawn_at IS NULL
  WHERE e.id=p_entry AND e.withdrawn_at IS NULL;
 IF v_author IS NULL THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 IF NOT EXISTS(SELECT 1 FROM kresilo_demo.creative_competitions c WHERE c.id=v_comp AND c.status='open' AND now()>=c.opens_at AND now()<c.closes_at) THEN RETURN kresilo_demo._err('COMPETITION_CLOSED'); END IF;
 IF v_author=v_person THEN RETURN kresilo_demo._err('OWN_ENTRY'); END IF;
 IF p_on THEN
  INSERT INTO kresilo_demo.creative_competition_votes(entry_id,voter_id) VALUES(p_entry,v_person) ON CONFLICT DO NOTHING;
 ELSE
  DELETE FROM kresilo_demo.creative_competition_votes WHERE entry_id=p_entry AND voter_id=v_person;
 END IF;
 RETURN kresilo_demo._ok(jsonb_build_object('votes',(SELECT count(*) FROM kresilo_demo.creative_competition_votes WHERE entry_id=p_entry)));
END $$;
