-- Additive: open boards people host, and real requests to join any open board.
-- Runtime objects stay in kresilo_demo.
-- The curated boards (src/creative/openBoards.ts) live in the app's bundle and
-- are run by fictional makers, so a request for one is stored but nobody can
-- answer it: it stays 'asked'. A board a person opens from their own project is
-- a row here; its host answers requests and the answer is the same on every
-- device. The service checks that a curated id names a real bundled board;
-- this layer checks shape, ownership and limits.
CREATE TABLE IF NOT EXISTS kresilo_demo.creative_boards (
 id text PRIMARY KEY CHECK (id ~ '^b-[a-z0-9]{6,16}$'),
 host_id uuid NOT NULL REFERENCES kresilo_demo.creative_people(id),
 project_id uuid NOT NULL REFERENCES kresilo_demo.creative_projects(id),
 -- title, the project's art when it was opened, and the roles it wants
 doc jsonb NOT NULL CHECK (jsonb_typeof(doc)='object' AND pg_column_size(doc) <= 16384),
 -- whether ideas pinned on the board show to everyone (015); otherwise only to the host and their author
 ideas_public boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 closed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS creative_boards_one_per_project
 ON kresilo_demo.creative_boards (project_id) WHERE closed_at IS NULL;

CREATE TABLE IF NOT EXISTS kresilo_demo.creative_board_requests (
 board_id text NOT NULL CHECK (board_id ~ '^[a-z0-9-]{1,80}$'),
 person_id uuid NOT NULL REFERENCES kresilo_demo.creative_people(id),
 state text NOT NULL CHECK (state IN ('asked','in','declined')),
 asks integer NOT NULL DEFAULT 1 CHECK (asks BETWEEN 1 AND 5),
 asked_at timestamptz NOT NULL DEFAULT now(),
 answered_at timestamptz,
 PRIMARY KEY (board_id, person_id)
);
CREATE INDEX IF NOT EXISTS creative_board_requests_by_board
 ON kresilo_demo.creative_board_requests (board_id, state, asked_at);

-- The host opens a board on a project they own, or updates the one already open for it.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_board_open(p_hash text, p_id text, p_project uuid, p_doc jsonb, p_ideas boolean) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_open text;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 IF p_id IS NULL OR p_id !~ '^b-[a-z0-9]{6,16}$' OR p_doc IS NULL OR jsonb_typeof(p_doc)<>'object' OR p_ideas IS NULL THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;
 IF NOT EXISTS(SELECT 1 FROM kresilo_demo.creative_projects WHERE id=p_project AND owner_id=v_person) THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_project::text,14));
 SELECT id INTO v_open FROM kresilo_demo.creative_boards WHERE project_id=p_project AND closed_at IS NULL;
 IF v_open IS NOT NULL THEN
  UPDATE kresilo_demo.creative_boards SET doc=p_doc, ideas_public=p_ideas WHERE id=v_open;
  RETURN kresilo_demo._ok(jsonb_build_object('id',v_open));
 END IF;
 IF (SELECT count(*) FROM kresilo_demo.creative_boards WHERE host_id=v_person AND closed_at IS NULL)>=10 THEN RETURN kresilo_demo._err('LIMIT_REACHED'); END IF;
 INSERT INTO kresilo_demo.creative_boards(id,host_id,project_id,doc,ideas_public) VALUES(p_id,v_person,p_project,p_doc,p_ideas);
 RETURN kresilo_demo._ok(jsonb_build_object('id',p_id));
END $$;

-- The host closes their board. It leaves the list; the requests are kept.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_board_close(p_hash text, p_id text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash);
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 UPDATE kresilo_demo.creative_boards SET closed_at=now() WHERE id=p_id AND host_id=v_person AND closed_at IS NULL;
 IF NOT FOUND THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 RETURN kresilo_demo._ok('{}');
END $$;

-- Open boards people host (or one by id). Anyone may read; a viewer also learns which are theirs and where they stand.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_boards_list(p_hash text, p_id text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_person uuid:=CASE WHEN p_hash IS NULL OR p_hash='' THEN NULL ELSE kresilo_demo.creative_person(p_hash) END;
BEGIN
 RETURN kresilo_demo._ok(coalesce((SELECT jsonb_agg(jsonb_build_object(
   'id', b.id,
   'doc', b.doc,
   'ideasPublic', b.ideas_public,
   'hostName', coalesce(nullif(nullif(left(h.profile->>'name',60),''),'You'),'A Kresilo member'),
   'mine', v_person IS NOT NULL AND b.host_id=v_person,
   'project', CASE WHEN v_person IS NOT NULL AND b.host_id=v_person THEN b.project_id END,
   'place', coalesce((SELECT r.state FROM kresilo_demo.creative_board_requests r WHERE r.board_id=b.id AND r.person_id=v_person),'none'),
   'members', coalesce((SELECT jsonb_agg(left(coalesce(nullif(nullif(m.profile->>'name',''),'You'),'A Kresilo member'),60) ORDER BY r.answered_at)
      FROM kresilo_demo.creative_board_requests r JOIN kresilo_demo.creative_people m ON m.id=r.person_id
      WHERE r.board_id=b.id AND r.state='in'),'[]'::jsonb)
  ) ORDER BY b.created_at DESC)
  FROM (SELECT * FROM kresilo_demo.creative_boards
        WHERE closed_at IS NULL AND (p_id IS NULL OR p_id='' OR id=p_id)
        ORDER BY created_at DESC LIMIT 100) b
  JOIN kresilo_demo.creative_people h ON h.id=b.host_id),'[]'::jsonb));
END $$;

-- A person asks to join. A curated board's request stays 'asked' (its host is fictional).
-- Asking again is allowed after a decline, up to five asks per board.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_board_ask(p_hash text, p_board text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_host uuid; v_row kresilo_demo.creative_board_requests;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 IF p_board IS NULL OR p_board !~ '^[a-z0-9-]{1,80}$' THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 IF p_board ~ '^b-[a-z0-9]{6,16}$' THEN
  SELECT host_id INTO v_host FROM kresilo_demo.creative_boards WHERE id=p_board AND closed_at IS NULL;
  IF v_host IS NULL THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
  IF v_host=v_person THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_board,15));
 SELECT * INTO v_row FROM kresilo_demo.creative_board_requests WHERE board_id=p_board AND person_id=v_person;
 IF FOUND THEN
  IF v_row.state<>'declined' THEN RETURN kresilo_demo._ok(jsonb_build_object('state',v_row.state)); END IF;
  IF v_row.asks>=5 THEN RETURN kresilo_demo._err('LIMIT_REACHED'); END IF;
  UPDATE kresilo_demo.creative_board_requests SET state='asked', asks=asks+1, asked_at=now(), answered_at=NULL WHERE board_id=p_board AND person_id=v_person;
 ELSE
  IF (SELECT count(*) FROM kresilo_demo.creative_board_requests WHERE board_id=p_board AND state='asked')>=100 THEN RETURN kresilo_demo._err('LIMIT_REACHED'); END IF;
  INSERT INTO kresilo_demo.creative_board_requests(board_id,person_id,state) VALUES(p_board,v_person,'asked');
 END IF;
 RETURN kresilo_demo._ok(jsonb_build_object('state','asked'));
END $$;

-- The host lets a person in or declines them. Only the board's host may answer; a decline also removes a member.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_board_answer(p_hash text, p_board text, p_person uuid, p_accept boolean) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_host uuid:=kresilo_demo.creative_person(p_hash); v_state text;
BEGIN
 IF v_host IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 IF p_accept IS NULL THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;
 IF NOT EXISTS(SELECT 1 FROM kresilo_demo.creative_boards WHERE id=p_board AND host_id=v_host AND closed_at IS NULL) THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_board,15));
 IF p_accept AND (SELECT count(*) FROM kresilo_demo.creative_board_requests WHERE board_id=p_board AND state='in')>=50
    AND NOT EXISTS(SELECT 1 FROM kresilo_demo.creative_board_requests WHERE board_id=p_board AND person_id=p_person AND state='in') THEN RETURN kresilo_demo._err('LIMIT_REACHED'); END IF;
 v_state:=CASE WHEN p_accept THEN 'in' ELSE 'declined' END;
 UPDATE kresilo_demo.creative_board_requests SET state=v_state, answered_at=now() WHERE board_id=p_board AND person_id=p_person;
 IF NOT FOUND THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 RETURN kresilo_demo._ok(jsonb_build_object('state',v_state));
END $$;

-- Where the viewer stands on every board they asked for (curated or hosted), and the requests waiting on the boards they host.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_board_places(p_hash text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_person uuid:=CASE WHEN p_hash IS NULL OR p_hash='' THEN NULL ELSE kresilo_demo.creative_person(p_hash) END;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._ok(jsonb_build_object('places','{}'::jsonb,'inbox','[]'::jsonb)); END IF;
 RETURN kresilo_demo._ok(jsonb_build_object(
  'places', coalesce((SELECT jsonb_object_agg(board_id,state) FROM kresilo_demo.creative_board_requests WHERE person_id=v_person),'{}'::jsonb),
  'inbox', coalesce((SELECT jsonb_agg(jsonb_build_object(
      'board', r.board_id,
      'title', b.doc->>'title',
      'person', r.person_id,
      'name', left(coalesce(nullif(nullif(p.profile->>'name',''),'You'),'A Kresilo member'),60),
      'at', r.asked_at) ORDER BY r.asked_at)
    FROM kresilo_demo.creative_board_requests r
    JOIN kresilo_demo.creative_boards b ON b.id=r.board_id AND b.host_id=v_person AND b.closed_at IS NULL
    JOIN kresilo_demo.creative_people p ON p.id=r.person_id
    WHERE r.state='asked'),'[]'::jsonb)));
END $$;
