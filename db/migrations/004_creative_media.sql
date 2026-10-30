-- Bounded user imports and rendered exports use the same workspace storage.
CREATE TABLE IF NOT EXISTS kresilo_demo.creative_media (
 id uuid PRIMARY KEY,project_id uuid NOT NULL REFERENCES kresilo_demo.creative_projects(id),
 content_type text NOT NULL CHECK(content_type IN ('image/jpeg','image/png','image/webp','video/mp4')),
 data_base64 text NOT NULL CHECK(length(data_base64)<=18000000),
 name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION kresilo_demo.creative_media_save(p_hash text,p_project uuid,p_id uuid,p_type text,p_data text,p_name text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash);
BEGIN
 IF v_person IS NULL OR NOT EXISTS(SELECT 1 FROM kresilo_demo.creative_projects p WHERE p.id=p_project AND (p.owner_id=v_person OR EXISTS(SELECT 1 FROM kresilo_demo.creative_members m WHERE m.project_id=p.id AND m.person_id=v_person))) THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(v_person::text,4));
 IF (SELECT coalesce(sum(length(m.data_base64)),0) FROM kresilo_demo.creative_media m JOIN kresilo_demo.creative_projects p ON p.id=m.project_id WHERE p.owner_id=v_person)>100000000 THEN RETURN kresilo_demo._err('LIMIT_REACHED'); END IF;
 INSERT INTO kresilo_demo.creative_media VALUES(p_id,p_project,p_type,p_data,left(p_name,120),now());
 RETURN kresilo_demo._ok(jsonb_build_object('id',p_id));
END $$;
CREATE OR REPLACE FUNCTION kresilo_demo.creative_media_get(p_hash text,p_id uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_media jsonb;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 SELECT jsonb_build_object('id',m.id,'contentType',m.content_type,'base64',m.data_base64,'name',m.name) INTO v_media
 FROM kresilo_demo.creative_media m JOIN kresilo_demo.creative_projects p ON p.id=m.project_id
 WHERE m.id=p_id AND (p.owner_id=v_person OR EXISTS(SELECT 1 FROM kresilo_demo.creative_members member WHERE member.project_id=p.id AND member.person_id=v_person));
 IF v_media IS NULL THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 RETURN kresilo_demo._ok(v_media);
END $$;
