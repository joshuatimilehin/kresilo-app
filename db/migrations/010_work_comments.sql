-- Additive: comments on the sample works shown in the reel. Runtime objects stay in kresilo_demo.
-- Sample works live in the app's catalog, not in the database, so a comment is
-- keyed by the work's catalog id; the command service checks that the id is a
-- real catalog work before calling these functions. Sample makers are
-- fictional and have no account, so only a comment's author can remove it.
CREATE TABLE IF NOT EXISTS kresilo_demo.creative_work_comments (
 id uuid PRIMARY KEY,
 work_id text NOT NULL CHECK (work_id ~ '^[a-z0-9-]{1,80}$'),
 person_id uuid NOT NULL REFERENCES kresilo_demo.creative_people(id),
 author text NOT NULL,
 body text NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
 created_at timestamptz NOT NULL DEFAULT now(),
 removed_at timestamptz
);
CREATE INDEX IF NOT EXISTS creative_work_comments_by_work
 ON kresilo_demo.creative_work_comments (work_id, created_at);

-- Anyone may read a work's comments. A signed-in viewer also learns which are theirs.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_work_comments_list(p_hash text, p_work text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_person uuid:=CASE WHEN p_hash IS NULL OR p_hash='' THEN NULL ELSE kresilo_demo.creative_person(p_hash) END;
BEGIN
 IF p_work IS NULL OR p_work !~ '^[a-z0-9-]{1,80}$' THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 RETURN kresilo_demo._ok(jsonb_build_object(
  'open', true,
  'canModerate', false,
  'comments', coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'author',c.author,'text',c.body,'at',c.created_at,'mine',v_person IS NOT NULL AND c.person_id=v_person) ORDER BY c.created_at)
     FROM (SELECT * FROM kresilo_demo.creative_work_comments WHERE work_id=p_work AND removed_at IS NULL ORDER BY created_at LIMIT 200) c),'[]'::jsonb)));
END $$;

CREATE OR REPLACE FUNCTION kresilo_demo.creative_work_comment_add(p_hash text, p_work text, p_id uuid, p_body text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_name text;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 IF p_work IS NULL OR p_work !~ '^[a-z0-9-]{1,80}$' THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_work,10));
 IF (SELECT count(*) FROM kresilo_demo.creative_work_comments WHERE work_id=p_work AND person_id=v_person AND created_at>now()-interval '1 minute')>=3 THEN RETURN kresilo_demo._err('RATE_LIMITED'); END IF;
 IF (SELECT count(*) FROM kresilo_demo.creative_work_comments WHERE work_id=p_work AND removed_at IS NULL)>=200 THEN RETURN kresilo_demo._err('LIMIT_REACHED'); END IF;
 SELECT left(coalesce(profile->>'name','You'),60) INTO v_name FROM kresilo_demo.creative_people WHERE id=v_person;
 INSERT INTO kresilo_demo.creative_work_comments(id,work_id,person_id,author,body) VALUES(p_id,p_work,v_person,v_name,p_body);
 RETURN kresilo_demo._ok(jsonb_build_object('id',p_id));
END $$;

-- The author removes their own comment.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_work_comment_remove(p_hash text, p_work text, p_id uuid) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash);
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 UPDATE kresilo_demo.creative_work_comments SET removed_at=now()
  WHERE id=p_id AND work_id=p_work AND removed_at IS NULL AND person_id=v_person;
 IF NOT FOUND THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 RETURN kresilo_demo._ok('{}');
END $$;
