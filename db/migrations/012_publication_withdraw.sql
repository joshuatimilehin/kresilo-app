-- Additive: the maker withdraws a published post, and opens or closes its
-- comments after publishing. Runtime objects stay in kresilo_demo.
-- A withdrawn post keeps its row (comments still point at it) but is marked
-- withdrawn_at: it leaves the community feed and its link, preview card,
-- embed and comments answer NOT_FOUND for everyone. Only the owner of the
-- project the post came from may withdraw it or change its comments.
ALTER TABLE kresilo_demo.creative_publications ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz;

-- One post, unless it was withdrawn.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_public(p_id uuid) RETURNS jsonb
LANGUAGE sql VOLATILE AS $$
 SELECT coalesce((SELECT kresilo_demo._ok(document||jsonb_build_object('id',id,'audience',audience)) FROM kresilo_demo.creative_publications WHERE id=p_id AND withdrawn_at IS NULL),kresilo_demo._err('NOT_FOUND'))
$$;

-- The community feed leaves withdrawn posts out.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_community() RETURNS jsonb
LANGUAGE sql VOLATILE AS $$
 SELECT kresilo_demo._ok(coalesce(jsonb_agg(document||jsonb_build_object('id',id) ORDER BY created_at DESC),'[]')) FROM (SELECT * FROM kresilo_demo.creative_publications WHERE audience='community' AND withdrawn_at IS NULL ORDER BY created_at DESC LIMIT 30) p
$$;

-- Whether the signed-in viewer owns this post (so the page offers its controls).
CREATE OR REPLACE FUNCTION kresilo_demo.creative_publication_mine(p_hash text, p_publication uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_person uuid:=CASE WHEN p_hash IS NULL OR p_hash='' THEN NULL ELSE kresilo_demo.creative_person(p_hash) END;
BEGIN
 RETURN kresilo_demo._ok(jsonb_build_object('mine', v_person IS NOT NULL AND EXISTS(
  SELECT 1 FROM kresilo_demo.creative_publications pu JOIN kresilo_demo.creative_projects pr ON pr.id=pu.project_id
  WHERE pu.id=p_publication AND pu.withdrawn_at IS NULL AND pr.owner_id=v_person)));
END $$;

-- The owner withdraws their post. It is kept, marked, and no longer shown.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_publication_withdraw(p_hash text, p_publication uuid) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash);
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 UPDATE kresilo_demo.creative_publications pu SET withdrawn_at=now()
  WHERE pu.id=p_publication AND pu.withdrawn_at IS NULL
    AND EXISTS(SELECT 1 FROM kresilo_demo.creative_projects pr WHERE pr.id=pu.project_id AND pr.owner_id=v_person);
 IF NOT FOUND THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 RETURN kresilo_demo._ok('{}');
END $$;

-- The owner opens or closes comments on their community post after publishing.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_publication_comments(p_hash text, p_publication uuid, p_open boolean) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash);
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 IF p_open IS NULL THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;
 UPDATE kresilo_demo.creative_publications pu
  SET document=jsonb_set(pu.document,'{disclosure}',coalesce(pu.document->'disclosure','{}'::jsonb)||jsonb_build_object('comments',p_open))
  WHERE pu.id=p_publication AND pu.audience='community' AND pu.withdrawn_at IS NULL
    AND EXISTS(SELECT 1 FROM kresilo_demo.creative_projects pr WHERE pr.id=pu.project_id AND pr.owner_id=v_person);
 IF NOT FOUND THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 RETURN kresilo_demo._ok(jsonb_build_object('comments',p_open));
END $$;

-- Comments on a withdrawn post are not listed and take no new comments (006, plus the marker).
CREATE OR REPLACE FUNCTION kresilo_demo.creative_post_comments_list(p_hash text, p_publication uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_person uuid:=CASE WHEN p_hash IS NULL OR p_hash='' THEN NULL ELSE kresilo_demo.creative_person(p_hash) END; v_pub kresilo_demo.creative_publications;
BEGIN
 SELECT * INTO v_pub FROM kresilo_demo.creative_publications WHERE id=p_publication AND audience='community' AND withdrawn_at IS NULL;
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
 SELECT * INTO v_pub FROM kresilo_demo.creative_publications WHERE id=p_publication AND audience='community' AND withdrawn_at IS NULL;
 IF NOT FOUND THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 IF coalesce((v_pub.document->'disclosure'->>'comments')::boolean,false) IS NOT TRUE THEN RETURN kresilo_demo._err('COMMENTS_CLOSED'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_publication::text,6));
 IF (SELECT count(*) FROM kresilo_demo.creative_post_comments WHERE publication_id=p_publication AND person_id=v_person AND created_at>now()-interval '1 minute')>=3 THEN RETURN kresilo_demo._err('RATE_LIMITED'); END IF;
 IF (SELECT count(*) FROM kresilo_demo.creative_post_comments WHERE publication_id=p_publication AND removed_at IS NULL)>=200 THEN RETURN kresilo_demo._err('LIMIT_REACHED'); END IF;
 SELECT left(coalesce(profile->>'name','You'),60) INTO v_name FROM kresilo_demo.creative_people WHERE id=v_person;
 INSERT INTO kresilo_demo.creative_post_comments(id,publication_id,person_id,author,body) VALUES(p_id,p_publication,v_person,v_name,p_body);
 RETURN kresilo_demo._ok(jsonb_build_object('id',p_id));
END $$;
