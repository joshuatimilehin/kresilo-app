-- Additive: read one public moodboard. Boards live in the owner's profile (profile.moodboards, written by profile.update);
-- this function only reads, and only a board its owner marked public. A private or missing board answers NOT_FOUND,
-- the same as one that does not exist, so nobody learns which. Safe to run twice.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_moodboard_get(p_person uuid, p_board text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_name text; v_board jsonb;
BEGIN
 IF p_board IS NULL OR p_board !~ '^m-[a-z0-9-]{1,40}$' THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 SELECT left(coalesce(profile->>'name','A Kresilo member'),60),
        (SELECT b FROM jsonb_array_elements(CASE WHEN jsonb_typeof(profile->'moodboards')='array' THEN profile->'moodboards' ELSE '[]'::jsonb END) b
         WHERE b->>'id'=p_board AND coalesce((b->>'public')::boolean,false) LIMIT 1)
   INTO v_name, v_board
   FROM kresilo_demo.creative_people WHERE id=p_person;
 IF v_board IS NULL THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 RETURN kresilo_demo._ok(jsonb_build_object(
   'owner', jsonb_build_object('id',p_person,'name',coalesce(nullif(nullif(v_name,''),'You'),'A Kresilo member')),
   'board', jsonb_build_object('id',v_board->>'id','name',left(v_board->>'name',40),'items',
      coalesce((SELECT jsonb_agg(i) FROM (SELECT i FROM jsonb_array_elements_text(v_board->'items') i LIMIT 200) s),'[]'::jsonb))));
END $$;
