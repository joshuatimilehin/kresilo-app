-- Additive: idea cards, a person's pinned note on a spot of someone else's project.
-- Runtime objects stay in kresilo_demo.
-- An idea sits on a target: a board a person hosts ('b-…'), a curated board
-- ('board-<id>') or a curated case study ('case-<id>'). Curated targets live in
-- the app's bundle and are run by fictional makers, so nobody can answer their
-- ideas: they stay 'open' and show to their author, and to everyone only when
-- the service says the project is open to contributions. On a hosted board the
-- host answers (accept, decline or reply) and the board's own setting says
-- whether ideas show to everyone or only to the host and the author.
-- The picture is a reference the server signed (see server/creative/eventCovers.ts).
CREATE TABLE IF NOT EXISTS kresilo_demo.creative_idea_cards (
 id uuid PRIMARY KEY,
 target text NOT NULL CHECK (target ~ '^(b-[a-z0-9]{6,16}|board-[a-z0-9-]{1,80}|case-[a-z0-9-]{1,80})$'),
 panel smallint NOT NULL CHECK (panel BETWEEN 0 AND 19),
 x real NOT NULL CHECK (x BETWEEN 0 AND 1),
 y real NOT NULL CHECK (y BETWEEN 0 AND 1),
 body text NOT NULL CHECK (length(body) BETWEEN 1 AND 280),
 picture text CHECK (picture IS NULL OR picture ~ '^[0-9a-f-]{36}\.[0-9a-f]{32}$'),
 author_id uuid NOT NULL REFERENCES kresilo_demo.creative_people(id),
 author text NOT NULL,
 state text NOT NULL DEFAULT 'open' CHECK (state IN ('open','accepted','declined')),
 reply text CHECK (reply IS NULL OR length(reply) BETWEEN 1 AND 280),
 created_at timestamptz NOT NULL DEFAULT now(),
 answered_at timestamptz,
 removed_at timestamptz
);
CREATE INDEX IF NOT EXISTS creative_idea_cards_by_target
 ON kresilo_demo.creative_idea_cards (target, created_at) WHERE removed_at IS NULL;

-- A person pins an idea. The host of a hosted board cannot pin on their own board (they edit it).
CREATE OR REPLACE FUNCTION kresilo_demo.creative_idea_add(p_hash text, p_id uuid, p_target text, p_panel integer, p_x real, p_y real, p_body text, p_picture text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_host uuid; v_name text;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 IF p_target IS NULL OR p_target !~ '^(b-[a-z0-9]{6,16}|board-[a-z0-9-]{1,80}|case-[a-z0-9-]{1,80})$'
    OR p_panel NOT BETWEEN 0 AND 19 OR p_x NOT BETWEEN 0 AND 1 OR p_y NOT BETWEEN 0 AND 1
    OR p_body IS NULL OR length(p_body) NOT BETWEEN 1 AND 280 THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;
 IF p_target ~ '^b-' THEN
  SELECT host_id INTO v_host FROM kresilo_demo.creative_boards WHERE id=p_target AND closed_at IS NULL;
  IF v_host IS NULL THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
  IF v_host=v_person THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_target,16));
 IF (SELECT count(*) FROM kresilo_demo.creative_idea_cards WHERE author_id=v_person AND created_at>now()-interval '1 minute')>=5 THEN RETURN kresilo_demo._err('RATE_LIMITED'); END IF;
 IF (SELECT count(*) FROM kresilo_demo.creative_idea_cards WHERE target=p_target AND removed_at IS NULL)>=200
    OR (SELECT count(*) FROM kresilo_demo.creative_idea_cards WHERE target=p_target AND author_id=v_person AND removed_at IS NULL)>=20 THEN RETURN kresilo_demo._err('LIMIT_REACHED'); END IF;
 SELECT left(coalesce(profile->>'name','You'),60) INTO v_name FROM kresilo_demo.creative_people WHERE id=v_person;
 INSERT INTO kresilo_demo.creative_idea_cards(id,target,panel,x,y,body,picture,author_id,author) VALUES(p_id,p_target,p_panel,p_x,p_y,p_body,p_picture,v_person,v_name);
 RETURN kresilo_demo._ok(jsonb_build_object('id',p_id));
END $$;

-- The ideas on a target. p_public is the service's word for a curated target (is it open to contributions?);
-- a hosted board decides for itself. A viewer sees their own ideas and, as host, all of them; everyone else
-- sees open and accepted ideas when the target is open to contributions. Accepted ideas credit their author.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_ideas_list(p_hash text, p_target text, p_public boolean) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_person uuid:=CASE WHEN p_hash IS NULL OR p_hash='' THEN NULL ELSE kresilo_demo.creative_person(p_hash) END;
        v_host uuid; v_open boolean:=coalesce(p_public,false);
BEGIN
 IF p_target IS NULL OR p_target !~ '^(b-[a-z0-9]{6,16}|board-[a-z0-9-]{1,80}|case-[a-z0-9-]{1,80})$' THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 IF p_target ~ '^b-' THEN
  SELECT host_id, ideas_public INTO v_host, v_open FROM kresilo_demo.creative_boards WHERE id=p_target AND closed_at IS NULL;
  IF v_host IS NULL THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 END IF;
 RETURN kresilo_demo._ok(jsonb_build_object(
  'host', v_person IS NOT NULL AND v_person=v_host,
  'public', v_open,
  'ideas', coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id',i.id,'panel',i.panel,'x',i.x,'y',i.y,'text',i.body,'picture',i.picture,'state',i.state,'reply',i.reply,
      'author',i.author,'at',i.created_at,'mine',v_person IS NOT NULL AND i.author_id=v_person) ORDER BY i.created_at)
    FROM (SELECT * FROM kresilo_demo.creative_idea_cards c
          WHERE c.target=p_target AND c.removed_at IS NULL
            AND ((v_person IS NOT NULL AND (c.author_id=v_person OR v_person=v_host))
                 OR (v_open AND c.state IN ('open','accepted')))
          ORDER BY c.created_at LIMIT 200) i),'[]'::jsonb),
  'credits', coalesce((SELECT jsonb_agg(jsonb_build_object('name',a.author,'ideas',a.n) ORDER BY a.n DESC, a.author)
    FROM (SELECT author, count(*) AS n FROM kresilo_demo.creative_idea_cards
          WHERE target=p_target AND removed_at IS NULL AND state='accepted' AND (v_open OR (v_person IS NOT NULL AND v_person=v_host))
          GROUP BY author) a),'[]'::jsonb)));
END $$;

-- The host of a hosted board accepts, declines or replies to an idea. A reply keeps the idea open.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_idea_answer(p_hash text, p_id uuid, p_decision text, p_reply text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_state text; v_reply text:=nullif(btrim(coalesce(p_reply,'')),'');
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 IF p_decision NOT IN ('accept','decline','reply') OR (p_decision='reply' AND v_reply IS NULL) OR length(coalesce(v_reply,''))>280 THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;
 v_state:=CASE p_decision WHEN 'accept' THEN 'accepted' WHEN 'decline' THEN 'declined' ELSE NULL END;
 UPDATE kresilo_demo.creative_idea_cards c SET state=coalesce(v_state,c.state), reply=coalesce(v_reply,c.reply), answered_at=now()
  WHERE c.id=p_id AND c.removed_at IS NULL
    AND EXISTS(SELECT 1 FROM kresilo_demo.creative_boards b WHERE b.id=c.target AND b.host_id=v_person AND b.closed_at IS NULL);
 IF NOT FOUND THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 RETURN kresilo_demo._ok(jsonb_build_object('state',coalesce(v_state,'open')));
END $$;

-- The author takes their idea back, or the host of its board removes it.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_idea_remove(p_hash text, p_id uuid) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash);
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 UPDATE kresilo_demo.creative_idea_cards c SET removed_at=now()
  WHERE c.id=p_id AND c.removed_at IS NULL
    AND (c.author_id=v_person OR EXISTS(SELECT 1 FROM kresilo_demo.creative_boards b WHERE b.id=c.target AND b.host_id=v_person));
 IF NOT FOUND THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 RETURN kresilo_demo._ok('{}');
END $$;
