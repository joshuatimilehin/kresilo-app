-- Additive: store an imported image once per owner (issue #39).
-- Imports keep one row per project (so access rules do not change) but the bytes
-- live in creative_blobs, keyed by the project owner and the content hash. The
-- same image imported twice by one owner is stored once. Older rows keep their
-- bytes where they are and read exactly as before.
CREATE TABLE IF NOT EXISTS kresilo_demo.creative_blobs (
 owner_id uuid NOT NULL REFERENCES kresilo_demo.creative_people(id),
 sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
 data_base64 text NOT NULL CHECK (length(data_base64) <= 18000000),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (owner_id, sha256)
);
ALTER TABLE kresilo_demo.creative_media ADD COLUMN IF NOT EXISTS blob_sha text;
ALTER TABLE kresilo_demo.creative_media ALTER COLUMN data_base64 DROP NOT NULL;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='creative_media_has_bytes') THEN
  ALTER TABLE kresilo_demo.creative_media ADD CONSTRAINT creative_media_has_bytes CHECK (data_base64 IS NOT NULL OR blob_sha IS NOT NULL);
 END IF;
END $$;

-- The new save. The old creative_media_save is left as it was (exports use it).
CREATE OR REPLACE FUNCTION kresilo_demo.creative_media_save_once(p_hash text,p_project uuid,p_id uuid,p_type text,p_data text,p_name text,p_sha text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_owner uuid; v_new boolean:=false;
BEGIN
 SELECT p.owner_id INTO v_owner FROM kresilo_demo.creative_projects p WHERE p.id=p_project AND (p.owner_id=v_person OR EXISTS(SELECT 1 FROM kresilo_demo.creative_members m WHERE m.project_id=p.id AND m.person_id=v_person));
 IF v_person IS NULL OR v_owner IS NULL THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 IF p_sha !~ '^[0-9a-f]{64}$' THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(v_owner::text,4));
 IF NOT EXISTS (SELECT 1 FROM kresilo_demo.creative_blobs WHERE owner_id=v_owner AND sha256=p_sha) THEN
  IF (SELECT coalesce(sum(length(m.data_base64)),0) FROM kresilo_demo.creative_media m JOIN kresilo_demo.creative_projects p ON p.id=m.project_id WHERE p.owner_id=v_owner)
     + (SELECT coalesce(sum(length(b.data_base64)),0) FROM kresilo_demo.creative_blobs b WHERE b.owner_id=v_owner) > 100000000 THEN RETURN kresilo_demo._err('LIMIT_REACHED'); END IF;
  INSERT INTO kresilo_demo.creative_blobs(owner_id,sha256,data_base64) VALUES(v_owner,p_sha,p_data);
  v_new:=true;
 END IF;
 INSERT INTO kresilo_demo.creative_media(id,project_id,content_type,data_base64,name,created_at,blob_sha) VALUES(p_id,p_project,p_type,NULL,left(p_name,120),now(),p_sha);
 RETURN kresilo_demo._ok(jsonb_build_object('id',p_id,'stored',v_new));
END $$;

-- Reads fall back to the shared bytes when a row has none of its own.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_media_get(p_hash text,p_id uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_media jsonb;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 SELECT jsonb_build_object('id',m.id,'contentType',m.content_type,'base64',coalesce(m.data_base64,b.data_base64),'name',m.name) INTO v_media
 FROM kresilo_demo.creative_media m JOIN kresilo_demo.creative_projects p ON p.id=m.project_id
 LEFT JOIN kresilo_demo.creative_blobs b ON b.owner_id=p.owner_id AND b.sha256=m.blob_sha
 WHERE m.id=p_id AND (p.owner_id=v_person OR EXISTS(SELECT 1 FROM kresilo_demo.creative_members member WHERE member.project_id=p.id AND member.person_id=v_person));
 IF v_media IS NULL THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 RETURN kresilo_demo._ok(v_media);
END $$;
