-- Additive: comments on published posts (issue #36). Runtime objects stay in kresilo_demo.
-- Board comments are unchanged and still live inside the project document.
-- A comment can be added only to a community post whose owner opened comments
-- when publishing (publication document: disclosure.comments = true).
CREATE TABLE IF NOT EXISTS kresilo_demo.creative_post_comments (
 id uuid PRIMARY KEY,
 publication_id uuid NOT NULL REFERENCES kresilo_demo.creative_publications(id),
 person_id uuid NOT NULL REFERENCES kresilo_demo.creative_people(id),
 author text NOT NULL,
 body text NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
 created_at timestamptz NOT NULL DEFAULT now(),
 removed_at timestamptz
);
CREATE INDEX IF NOT EXISTS creative_post_comments_by_post
 ON kresilo_demo.creative_post_comments (publication_id, created_at);

-- Anyone may read a community post's comments. A signed-in viewer also learns
-- which are theirs and whether they may moderate (the owner of the post).
CREATE OR REPLACE FUNCTION kresilo_demo.creative_post_comments_list(p_hash text, p_publication uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_person uuid:=CASE WHEN p_hash IS NULL OR p_hash='' THEN NULL ELSE kresilo_demo.creative_person(p_hash) END; v_pub kresilo_demo.creative_publications;
BEGIN
 SELECT * INTO v_pub FROM kresilo_demo.creative_publications WHERE id=p_publication AND audience='community';
 IF NOT FOUND THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 RETURN kresilo_demo._ok(jsonb_build_object(
  'open', coalesce((v_pub.document->'disclosure'->>'comments')::boolean,false),
  'canModerate', v_person IS NOT NULL AND EXISTS(SELECT 1 FROM kresilo_demo.creative_projects p WHERE p.id=v_pub.project_id AND p.owner_id=v_person),
  'comments', coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'author',c.author,'text',c.body,'at',c.created_at,'mine',v_person IS NOT NULL AND c.person_id=v_person) ORDER BY c.created_at)
     FROM (SELECT * FROM kresilo_demo.creative_post_comments WHERE publication_id=p_publication AND removed_at IS NULL ORDER BY created_at LIMIT 200) c),'[]'::jsonb)));
END $$;

CREATE OR REPLACE FUNCTION kresilo_demo.creative_post_comment_add(p_hash text, p_publication uuid, p_id uuid, p_body text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_pub kresilo_demo.creative_publications; v_name text;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 SELECT * INTO v_pub FROM kresilo_demo.creative_publications WHERE id=p_publication AND audience='community';
 IF NOT FOUND THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 IF coalesce((v_pub.document->'disclosure'->>'comments')::boolean,false) IS NOT TRUE THEN RETURN kresilo_demo._err('COMMENTS_CLOSED'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_publication::text,6));
 IF (SELECT count(*) FROM kresilo_demo.creative_post_comments WHERE publication_id=p_publication AND person_id=v_person AND created_at>now()-interval '1 minute')>=3 THEN RETURN kresilo_demo._err('RATE_LIMITED'); END IF;
 IF (SELECT count(*) FROM kresilo_demo.creative_post_comments WHERE publication_id=p_publication AND removed_at IS NULL)>=200 THEN RETURN kresilo_demo._err('LIMIT_REACHED'); END IF;
 SELECT left(coalesce(profile->>'name','You'),60) INTO v_name FROM kresilo_demo.creative_people WHERE id=v_person;
 INSERT INTO kresilo_demo.creative_post_comments(id,publication_id,person_id,author,body) VALUES(p_id,p_publication,v_person,v_name,p_body);
 RETURN kresilo_demo._ok(jsonb_build_object('id',p_id));
END $$;

-- The author removes their own comment; the post's owner may remove any on their post.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_post_comment_remove(p_hash text, p_publication uuid, p_id uuid) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash);
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 UPDATE kresilo_demo.creative_post_comments c SET removed_at=now()
  WHERE c.id=p_id AND c.publication_id=p_publication AND c.removed_at IS NULL
    AND (c.person_id=v_person OR EXISTS(SELECT 1 FROM kresilo_demo.creative_publications pu JOIN kresilo_demo.creative_projects pr ON pr.id=pu.project_id WHERE pu.id=p_publication AND pr.owner_id=v_person));
 IF NOT FOUND THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 RETURN kresilo_demo._ok('{}');
END $$;
