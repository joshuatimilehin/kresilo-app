-- Additive: a per-user, per-session, per-device usage log (append-only).
-- Flat columns plus a small jsonb bag, so the rows can be exported to an
-- analytics store unchanged. A person can turn recording off (profile
-- "analytics": false) and can delete their own rows.
CREATE TABLE IF NOT EXISTS kresilo_demo.usage_events (
 id bigserial PRIMARY KEY,
 at timestamptz NOT NULL DEFAULT now(),
 person_id uuid NOT NULL REFERENCES kresilo_demo.creative_people(id),
 session_id text,
 device_id text,
 project_id uuid,
 kind text NOT NULL CHECK (kind ~ '^[a-z]+\.[a-z]+$'),
 source text NOT NULL DEFAULT 'client' CHECK (source IN ('client','server')),
 actor text NOT NULL DEFAULT 'person',
 data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(data) <= 4096),
 client jsonb,
 build text
);
CREATE INDEX IF NOT EXISTS usage_events_person_at ON kresilo_demo.usage_events (person_id, at DESC);
CREATE INDEX IF NOT EXISTS usage_events_project_at ON kresilo_demo.usage_events (project_id, at DESC) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS usage_events_kind_at ON kresilo_demo.usage_events (kind, at DESC);

-- Records up to 50 events for the signed-in person, unless they turned recording off.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_event_log(p_hash text, p_events jsonb) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_n integer:=0; v_e jsonb; v_on boolean;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 SELECT coalesce((profile->>'analytics')::boolean,true) INTO v_on FROM kresilo_demo.creative_people WHERE id=v_person;
 IF NOT v_on THEN RETURN kresilo_demo._ok(jsonb_build_object('stored',0,'recording',false)); END IF;
 IF jsonb_typeof(p_events)<>'array' THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;
 FOR v_e IN SELECT * FROM jsonb_array_elements(p_events) LIMIT 50 LOOP
  INSERT INTO kresilo_demo.usage_events(at,person_id,session_id,device_id,project_id,kind,source,actor,data,client,build)
  VALUES(
   coalesce(to_timestamp((v_e->>'at')::double precision/1000.0), now()),
   v_person, left(v_e->>'session',36), left(v_e->>'device',36),
   CASE WHEN v_e->>'project' ~ '^[0-9a-f-]{36}$' THEN (v_e->>'project')::uuid END,
   v_e->>'kind', coalesce(v_e->>'source','client'), left(coalesce(v_e->>'actor','person'),40),
   coalesce(v_e->'data','{}'::jsonb), v_e->'client', left(v_e->>'build',20));
  v_n:=v_n+1;
 END LOOP;
 -- keep the newest 20000 rows per person
 DELETE FROM kresilo_demo.usage_events WHERE person_id=v_person AND id < (SELECT coalesce(min(id),0) FROM (SELECT id FROM kresilo_demo.usage_events WHERE person_id=v_person ORDER BY id DESC LIMIT 20000) k);
 RETURN kresilo_demo._ok(jsonb_build_object('stored',v_n,'recording',true));
END $$;

-- A person's own events, newest first.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_events_list(p_hash text, p_project uuid, p_limit integer) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash);
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 RETURN kresilo_demo._ok(coalesce((SELECT jsonb_agg(jsonb_build_object('id',e.id,'at',e.at,'kind',e.kind,'source',e.source,'actor',e.actor,'projectId',e.project_id,'sessionId',e.session_id,'deviceId',e.device_id,'data',e.data,'client',e.client) ORDER BY e.id DESC)
   FROM (SELECT * FROM kresilo_demo.usage_events WHERE person_id=v_person AND (p_project IS NULL OR project_id=p_project) ORDER BY id DESC LIMIT least(greatest(coalesce(p_limit,200),1),1000)) e),'[]'::jsonb));
END $$;

-- A person deletes their own log.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_events_clear(p_hash text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_n integer;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 DELETE FROM kresilo_demo.usage_events WHERE person_id=v_person;
 GET DIAGNOSTICS v_n = ROW_COUNT;
 RETURN kresilo_demo._ok(jsonb_build_object('deleted',v_n));
END $$;
