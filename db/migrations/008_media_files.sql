-- Additive: keep rendered loops outside database rows (issue #44). Run after 007.
-- The bytes live in Octo's file store (R2); this row keeps only the file id and
-- the facts needed to serve it. Older rows keep their bytes where they are and
-- read exactly as before.
ALTER TABLE kresilo_demo.creative_media ADD COLUMN IF NOT EXISTS file_id uuid;
ALTER TABLE kresilo_demo.creative_media ADD COLUMN IF NOT EXISTS size_bytes integer;
ALTER TABLE kresilo_demo.creative_media ALTER COLUMN data_base64 DROP NOT NULL;
ALTER TABLE kresilo_demo.creative_media DROP CONSTRAINT IF EXISTS creative_media_has_bytes;
ALTER TABLE kresilo_demo.creative_media ADD CONSTRAINT creative_media_has_bytes
 CHECK (data_base64 IS NOT NULL OR blob_sha IS NOT NULL OR file_id IS NOT NULL);

CREATE OR REPLACE FUNCTION kresilo_demo.creative_media_save_file(p_hash text,p_project uuid,p_id uuid,p_type text,p_file uuid,p_name text,p_size integer) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash);
BEGIN
 IF v_person IS NULL OR NOT EXISTS(SELECT 1 FROM kresilo_demo.creative_projects p WHERE p.id=p_project AND (p.owner_id=v_person OR EXISTS(SELECT 1 FROM kresilo_demo.creative_members m WHERE m.project_id=p.id AND m.person_id=v_person))) THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 IF p_type NOT IN ('video/mp4','image/jpeg','image/png','image/webp') OR p_size IS NULL OR p_size<=0 OR p_size>12582912 THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;
 INSERT INTO kresilo_demo.creative_media(id,project_id,content_type,data_base64,name,created_at,file_id,size_bytes) VALUES(p_id,p_project,p_type,NULL,left(p_name,120),now(),p_file,p_size);
 RETURN kresilo_demo._ok(jsonb_build_object('id',p_id));
END $$;

-- Reads return the file id for stored files, the bytes for older rows.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_media_get(p_hash text,p_id uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_media jsonb;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 SELECT jsonb_build_object('id',m.id,'contentType',m.content_type,'name',m.name,'base64',coalesce(m.data_base64,b.data_base64),'fileId',m.file_id,'size',m.size_bytes) INTO v_media
 FROM kresilo_demo.creative_media m JOIN kresilo_demo.creative_projects p ON p.id=m.project_id
 LEFT JOIN kresilo_demo.creative_blobs b ON b.owner_id=p.owner_id AND b.sha256=m.blob_sha
 WHERE m.id=p_id AND (p.owner_id=v_person OR EXISTS(SELECT 1 FROM kresilo_demo.creative_members member WHERE member.project_id=p.id AND member.person_id=v_person));
 IF v_media IS NULL THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 RETURN kresilo_demo._ok(v_media);
END $$;
