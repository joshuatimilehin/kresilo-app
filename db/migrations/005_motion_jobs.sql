-- Durable export state keeps long renders out of the request timeout window.
CREATE TABLE IF NOT EXISTS kresilo_demo.creative_motion_jobs(
 id uuid PRIMARY KEY, project_id uuid NOT NULL REFERENCES kresilo_demo.creative_projects(id),
 state text NOT NULL CHECK(state IN ('running','ready','failed')),
 media_id uuid REFERENCES kresilo_demo.creative_media(id),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION kresilo_demo.creative_motion_start(p_hash text,p_project uuid,p_id uuid) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash);
BEGIN
 IF v_person IS NULL OR NOT EXISTS(SELECT 1 FROM kresilo_demo.creative_projects p WHERE p.id=p_project AND (p.owner_id=v_person OR EXISTS(SELECT 1 FROM kresilo_demo.creative_members m WHERE m.project_id=p.id AND m.person_id=v_person))) THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_project::text,5));
 IF EXISTS(SELECT 1 FROM kresilo_demo.creative_motion_jobs WHERE project_id=p_project AND state='running' AND created_at>now()-interval '10 minutes') THEN RETURN kresilo_demo._err('RENDER_BUSY'); END IF;
 INSERT INTO kresilo_demo.creative_motion_jobs(id,project_id,state) VALUES(p_id,p_project,'running');
 RETURN kresilo_demo._ok(jsonb_build_object('jobId',p_id,'state','running'));
END $$;
CREATE OR REPLACE FUNCTION kresilo_demo.creative_motion_finish(p_hash text,p_id uuid,p_media uuid) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash);
BEGIN
 IF NOT EXISTS(SELECT 1 FROM kresilo_demo.creative_motion_jobs j JOIN kresilo_demo.creative_projects p ON p.id=j.project_id WHERE j.id=p_id AND (p.owner_id=v_person OR EXISTS(SELECT 1 FROM kresilo_demo.creative_members m WHERE m.project_id=p.id AND m.person_id=v_person))) THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 UPDATE kresilo_demo.creative_motion_jobs SET state=CASE WHEN p_media IS NULL THEN 'failed' ELSE 'ready' END,media_id=p_media WHERE id=p_id;
 RETURN kresilo_demo._ok('{}');
END $$;
CREATE OR REPLACE FUNCTION kresilo_demo.creative_motion_get(p_hash text,p_id uuid) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash);v_job jsonb;
BEGIN
 SELECT jsonb_build_object('jobId',j.id,'state',CASE WHEN j.state='running' AND j.created_at<now()-interval '10 minutes' THEN 'failed' ELSE j.state END,'mediaId',j.media_id) INTO v_job
 FROM kresilo_demo.creative_motion_jobs j JOIN kresilo_demo.creative_projects p ON p.id=j.project_id
 WHERE j.id=p_id AND (p.owner_id=v_person OR EXISTS(SELECT 1 FROM kresilo_demo.creative_members m WHERE m.project_id=p.id AND m.person_id=v_person));
 IF v_job IS NULL THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 RETURN kresilo_demo._ok(v_job);
END $$;
