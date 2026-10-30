-- Additive: a hosted event's schedule, the running order shown as a tracklist
-- on the event page and as a slide in the events reel. Runtime objects stay in
-- kresilo_demo. Rows are {"time":"19:30","label":"Doors"}; the command service
-- (scheduleRowSchema in src/creative/contracts.ts) checks each row, and this
-- layer checks that it is a short array. It lives in its own column so the
-- event document keeps its size cap. Events saved before this migration have no
-- rows and read back exactly as before. Safe to run twice.
ALTER TABLE kresilo_demo.creative_hosted_events ADD COLUMN IF NOT EXISTS schedule jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE kresilo_demo.creative_hosted_events DROP CONSTRAINT IF EXISTS creative_hosted_events_schedule_check;
ALTER TABLE kresilo_demo.creative_hosted_events ADD CONSTRAINT creative_hosted_events_schedule_check
 CHECK (jsonb_typeof(schedule)='array' AND jsonb_array_length(schedule) <= 12 AND pg_column_size(schedule) <= 4096);

-- Anyone may read upcoming events (or one by id); the schedule rejoins the event when it has rows.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_hosted_list(p_hash text, p_id text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_person uuid:=CASE WHEN p_hash IS NULL OR p_hash='' THEN NULL ELSE kresilo_demo.creative_person(p_hash) END;
BEGIN
 RETURN kresilo_demo._ok(coalesce((SELECT jsonb_agg(jsonb_build_object(
   'event', e.doc || CASE WHEN jsonb_array_length(e.schedule)>0 THEN jsonb_build_object('schedule', e.schedule) ELSE '{}'::jsonb END,
   'hostName', coalesce(nullif(nullif(left(h.profile->>'name',60),''),'You'),'A Kresilo member'),
   'going', (SELECT count(*) FROM kresilo_demo.creative_hosted_going g WHERE g.event_id=e.id),
   'mine', v_person IS NOT NULL AND e.host_id=v_person,
   'youGo', v_person IS NOT NULL AND EXISTS(SELECT 1 FROM kresilo_demo.creative_hosted_going g WHERE g.event_id=e.id AND g.person_id=v_person)
  ) ORDER BY e.starts_at)
  FROM (SELECT * FROM kresilo_demo.creative_hosted_events
        WHERE removed_at IS NULL
          AND (CASE WHEN p_id IS NOT NULL AND p_id<>'' THEN id=p_id
                    ELSE starts_at >= to_char(now() - interval '1 day','YYYY-MM-DD"T"HH24:MI') OR host_id=v_person END)
        ORDER BY starts_at LIMIT 200) e
  JOIN kresilo_demo.creative_people h ON h.id=e.host_id),'[]'::jsonb));
END $$;

-- The host publishes or updates their event; the schedule is kept beside the document. An id another person already hosts is refused.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_hosted_save(p_hash text, p_event jsonb) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_id text:=p_event->>'id'; v_owner uuid; v_rows jsonb;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 IF jsonb_typeof(p_event)<>'object' OR v_id IS NULL OR v_id !~ '^h-[a-z0-9]{6,16}$' OR coalesce(p_event->>'startsAt','') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$' THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;
 v_rows:=coalesce(p_event->'schedule','[]'::jsonb);
 IF jsonb_typeof(v_rows)<>'array' OR jsonb_array_length(v_rows)>12 THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;
 SELECT host_id INTO v_owner FROM kresilo_demo.creative_hosted_events WHERE id=v_id;
 IF v_owner IS NOT NULL AND v_owner<>v_person THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 IF v_owner IS NULL AND (SELECT count(*) FROM kresilo_demo.creative_hosted_events WHERE host_id=v_person AND removed_at IS NULL)>=20 THEN RETURN kresilo_demo._err('LIMIT_REACHED'); END IF;
 INSERT INTO kresilo_demo.creative_hosted_events(id,host_id,doc,starts_at,schedule) VALUES(v_id,v_person,p_event-'schedule',p_event->>'startsAt',v_rows)
 ON CONFLICT (id) DO UPDATE SET doc=EXCLUDED.doc, starts_at=EXCLUDED.starts_at, schedule=EXCLUDED.schedule, updated_at=now(), removed_at=NULL;
 RETURN kresilo_demo._ok(jsonb_build_object('id',v_id));
END $$;
