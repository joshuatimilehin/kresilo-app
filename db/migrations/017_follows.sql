-- Additive: any person can follow any person. Runtime objects stay in kresilo_demo.
-- Until now a follow lived in the person's profile (profile->'following') against a
-- roster maker id, so only the 38 roster makers could be followed. A follow is now a
-- row: who follows (a person) and who is followed (a person id, or a roster maker id,
-- which is not in the database). The profile list is read as before until it is moved
-- here by creative_follow_migrate, which the app calls once for a person who still
-- has one. Follow and unfollow are idempotent, and nobody follows themselves.
CREATE TABLE IF NOT EXISTS kresilo_demo.creative_follows (
 follower uuid NOT NULL REFERENCES kresilo_demo.creative_people(id),
 followed text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (follower, followed),
 CONSTRAINT creative_follows_followed_shape CHECK (followed ~ '^[a-z0-9-]{1,60}$'),
 CONSTRAINT creative_follows_not_self CHECK (followed <> follower::text)
);
CREATE INDEX IF NOT EXISTS creative_follows_by_followed ON kresilo_demo.creative_follows (followed);

-- Follow (p_on true) or unfollow (false). A copy of the same id in the old profile list is dropped.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_follow_set(p_hash text, p_followed text, p_on boolean) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_to text:=lower(coalesce(p_followed,''));
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 IF v_to !~ '^[a-z0-9-]{1,60}$' THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;
 IF v_to = v_person::text THEN RETURN kresilo_demo._err('SELF_FOLLOW'); END IF;
 IF v_to ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND NOT EXISTS(SELECT 1 FROM kresilo_demo.creative_people WHERE id=v_to::uuid) THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(v_person::text,17));
 IF p_on THEN
  IF NOT EXISTS(SELECT 1 FROM kresilo_demo.creative_follows WHERE follower=v_person AND followed=v_to) THEN
   IF (SELECT count(*) FROM kresilo_demo.creative_follows WHERE follower=v_person)>=500 THEN RETURN kresilo_demo._err('LIMIT_REACHED'); END IF;
   IF (SELECT count(*) FROM kresilo_demo.creative_follows WHERE follower=v_person AND created_at>now()-interval '1 minute')>=30 THEN RETURN kresilo_demo._err('RATE_LIMITED'); END IF;
   INSERT INTO kresilo_demo.creative_follows(follower,followed) VALUES(v_person,v_to) ON CONFLICT DO NOTHING;
  END IF;
 ELSE
  DELETE FROM kresilo_demo.creative_follows WHERE follower=v_person AND followed=v_to;
 END IF;
 UPDATE kresilo_demo.creative_people
  SET profile=jsonb_set(profile,'{following}',coalesce((SELECT jsonb_agg(x) FROM jsonb_array_elements_text(profile->'following') x WHERE x<>v_to),'[]'::jsonb))
  WHERE id=v_person AND jsonb_typeof(profile->'following')='array';
 RETURN kresilo_demo._ok(jsonb_build_object('following',p_on));
END $$;

-- Moves the follows kept in the profile (roster makers) into the table, once. Safe to repeat.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_follow_migrate(p_hash text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_moved integer:=0;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(v_person::text,17));
 WITH old AS (
  SELECT DISTINCT lower(x) AS id FROM kresilo_demo.creative_people p, jsonb_array_elements_text(
   CASE WHEN jsonb_typeof(p.profile->'following')='array' THEN p.profile->'following' ELSE '[]'::jsonb END) x
  WHERE p.id=v_person AND lower(x) ~ '^[a-z0-9-]{1,60}$' AND lower(x)<>v_person::text LIMIT 500),
 put AS (
  INSERT INTO kresilo_demo.creative_follows(follower,followed) SELECT v_person,id FROM old ON CONFLICT DO NOTHING RETURNING 1)
 SELECT count(*) INTO v_moved FROM put;
 UPDATE kresilo_demo.creative_people SET profile=jsonb_set(profile,'{following}','[]'::jsonb) WHERE id=v_person AND jsonb_typeof(profile->'following')='array';
 RETURN kresilo_demo._ok(jsonb_build_object('moved',v_moved));
END $$;

-- Who the signed-in viewer follows. Nobody is followed for a viewer with no session.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_follows_mine(p_hash text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_person uuid:=CASE WHEN p_hash IS NULL OR p_hash='' THEN NULL ELSE kresilo_demo.creative_person(p_hash) END;
BEGIN
 RETURN kresilo_demo._ok(jsonb_build_object(
  'following', coalesce((SELECT jsonb_agg(followed ORDER BY created_at DESC) FROM kresilo_demo.creative_follows WHERE follower=v_person),'[]'::jsonb),
  'followers', (SELECT count(*) FROM kresilo_demo.creative_follows WHERE followed=v_person::text)));
END $$;

-- Counts for one profile (a person id or a roster maker id), and whether the viewer follows it.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_follow_counts(p_hash text, p_target text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_person uuid:=CASE WHEN p_hash IS NULL OR p_hash='' THEN NULL ELSE kresilo_demo.creative_person(p_hash) END; v_to text:=lower(coalesce(p_target,''));
BEGIN
 IF v_to !~ '^[a-z0-9-]{1,60}$' THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 RETURN kresilo_demo._ok(jsonb_build_object(
  'followers', (SELECT count(*) FROM kresilo_demo.creative_follows WHERE followed=v_to),
  'following', CASE WHEN v_to ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                    THEN (SELECT count(*) FROM kresilo_demo.creative_follows WHERE follower=v_to::uuid) ELSE 0 END,
  'mine', v_person IS NOT NULL AND EXISTS(SELECT 1 FROM kresilo_demo.creative_follows WHERE follower=v_person AND followed=v_to)));
END $$;

-- A person's public page: name, counts and their community posts. Only people who have a post on show are listed.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_person_public(p_hash text, p_person uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_name text;
BEGIN
 SELECT left(coalesce(profile->>'name','You'),60) INTO v_name FROM kresilo_demo.creative_people WHERE id=p_person;
 IF v_name IS NULL OR NOT EXISTS(
   SELECT 1 FROM kresilo_demo.creative_publications pu JOIN kresilo_demo.creative_projects pr ON pr.id=pu.project_id
   WHERE pr.owner_id=p_person AND pu.audience='community' AND pu.withdrawn_at IS NULL) THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 RETURN kresilo_demo._ok(jsonb_build_object('id',p_person,'name',v_name,
  'counts', (kresilo_demo.creative_follow_counts(p_hash,p_person::text))->'data',
  'posts', coalesce((SELECT jsonb_agg(p.d ORDER BY p.created_at DESC) FROM (
     SELECT pu.document||jsonb_build_object('id',pu.id,'authorId',p_person) AS d, pu.created_at
     FROM kresilo_demo.creative_publications pu JOIN kresilo_demo.creative_projects pr ON pr.id=pu.project_id
     WHERE pr.owner_id=p_person AND pu.audience='community' AND pu.withdrawn_at IS NULL ORDER BY pu.created_at DESC LIMIT 30) p),'[]'::jsonb)));
END $$;

-- The Following tab: community posts by the people the viewer follows, newest first.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_following_feed(p_hash text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_person uuid:=CASE WHEN p_hash IS NULL OR p_hash='' THEN NULL ELSE kresilo_demo.creative_person(p_hash) END;
BEGIN
 RETURN kresilo_demo._ok(coalesce((SELECT jsonb_agg(p.d ORDER BY p.created_at DESC) FROM (
   SELECT pu.document||jsonb_build_object('id',pu.id,'authorId',pr.owner_id) AS d, pu.created_at
   FROM kresilo_demo.creative_publications pu JOIN kresilo_demo.creative_projects pr ON pr.id=pu.project_id
   WHERE v_person IS NOT NULL AND pu.audience='community' AND pu.withdrawn_at IS NULL
    AND pr.owner_id<>v_person
    AND pr.owner_id::text IN (SELECT followed FROM kresilo_demo.creative_follows WHERE follower=v_person)
   ORDER BY pu.created_at DESC LIMIT 30) p),'[]'::jsonb));
END $$;

-- Who wrote each of up to 300 published posts or comments (post, case-study and work comments), by id,
-- so a follow button can sit next to a name. Withdrawn posts and removed comments are not listed.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_authors(p_ids jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_ids text[];
BEGIN
 IF p_ids IS NULL OR jsonb_typeof(p_ids)<>'array' THEN RETURN kresilo_demo._ok('{}'); END IF;
 SELECT coalesce(array_agg(x),'{}') INTO v_ids FROM (SELECT x FROM jsonb_array_elements_text(p_ids) x LIMIT 300) s;
 RETURN kresilo_demo._ok(coalesce((SELECT jsonb_object_agg(a.id,a.author) FROM (
   SELECT pu.id::text AS id, pr.owner_id::text AS author FROM kresilo_demo.creative_publications pu
    JOIN kresilo_demo.creative_projects pr ON pr.id=pu.project_id
    WHERE pu.id::text = ANY(v_ids) AND pu.audience='community' AND pu.withdrawn_at IS NULL
   UNION ALL
   SELECT c.id::text, c.person_id::text FROM kresilo_demo.creative_post_comments c WHERE c.id::text = ANY(v_ids) AND c.removed_at IS NULL
   UNION ALL
   SELECT c.id::text, c.person_id::text FROM kresilo_demo.creative_work_comments c WHERE c.id::text = ANY(v_ids) AND c.removed_at IS NULL) a),'{}'::jsonb));
END $$;
