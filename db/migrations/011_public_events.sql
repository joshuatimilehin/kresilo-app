-- Additive: events that people host, visible to everyone. Runtime objects stay in kresilo_demo.
-- The event itself is a small JSON document checked by the command service
-- (hostedEventSchema in src/creative/contracts.ts) before it reaches here; this
-- layer checks ownership, the id's shape and the size. Who is going is kept
-- per person, so the count is real and a person sees their own place.
CREATE TABLE IF NOT EXISTS kresilo_demo.creative_hosted_events (
 id text PRIMARY KEY CHECK (id ~ '^h-[a-z0-9]{6,16}$'),
 host_id uuid NOT NULL REFERENCES kresilo_demo.creative_people(id),
 doc jsonb NOT NULL CHECK (jsonb_typeof(doc)='object' AND pg_column_size(doc) <= 8192),
 starts_at text NOT NULL CHECK (starts_at ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 removed_at timestamptz
);
CREATE INDEX IF NOT EXISTS creative_hosted_events_by_start
 ON kresilo_demo.creative_hosted_events (starts_at) WHERE removed_at IS NULL;

CREATE TABLE IF NOT EXISTS kresilo_demo.creative_hosted_going (
 event_id text NOT NULL REFERENCES kresilo_demo.creative_hosted_events(id),
 person_id uuid NOT NULL REFERENCES kresilo_demo.creative_people(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (event_id, person_id)
);

-- Anyone may read upcoming events (or one by id). A viewer also learns which are theirs and which they are going to.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_hosted_list(p_hash text, p_id text) RETURNS jsonb
LANGUAGE plpgsql VOLATILE AS $$
DECLARE v_person uuid:=CASE WHEN p_hash IS NULL OR p_hash='' THEN NULL ELSE kresilo_demo.creative_person(p_hash) END;
BEGIN
 RETURN kresilo_demo._ok(coalesce((SELECT jsonb_agg(jsonb_build_object(
   'event', e.doc,
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

-- The host publishes or updates their event. An id another person already hosts is refused.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_hosted_save(p_hash text, p_event jsonb) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_id text:=p_event->>'id'; v_owner uuid;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 IF jsonb_typeof(p_event)<>'object' OR v_id IS NULL OR v_id !~ '^h-[a-z0-9]{6,16}$' OR coalesce(p_event->>'startsAt','') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$' THEN RETURN kresilo_demo._err('INVALID_INPUT'); END IF;
 SELECT host_id INTO v_owner FROM kresilo_demo.creative_hosted_events WHERE id=v_id;
 IF v_owner IS NOT NULL AND v_owner<>v_person THEN RETURN kresilo_demo._err('FORBIDDEN'); END IF;
 IF v_owner IS NULL AND (SELECT count(*) FROM kresilo_demo.creative_hosted_events WHERE host_id=v_person AND removed_at IS NULL)>=20 THEN RETURN kresilo_demo._err('LIMIT_REACHED'); END IF;
 INSERT INTO kresilo_demo.creative_hosted_events(id,host_id,doc,starts_at) VALUES(v_id,v_person,p_event,p_event->>'startsAt')
 ON CONFLICT (id) DO UPDATE SET doc=EXCLUDED.doc, starts_at=EXCLUDED.starts_at, updated_at=now(), removed_at=NULL;
 RETURN kresilo_demo._ok(jsonb_build_object('id',v_id));
END $$;

-- The host takes their event down.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_hosted_remove(p_hash text, p_id text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash);
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 UPDATE kresilo_demo.creative_hosted_events SET removed_at=now() WHERE id=p_id AND host_id=v_person AND removed_at IS NULL;
 IF NOT FOUND THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 RETURN kresilo_demo._ok('{}');
END $$;

-- A person says they are going, or takes it back. Full events take no one new.
CREATE OR REPLACE FUNCTION kresilo_demo.creative_hosted_going(p_hash text, p_id text, p_on boolean) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_person uuid:=kresilo_demo.creative_person(p_hash); v_spots integer;
BEGIN
 IF v_person IS NULL THEN RETURN kresilo_demo._err('SESSION_INVALID'); END IF;
 SELECT coalesce((doc->>'spots')::integer,0) INTO v_spots FROM kresilo_demo.creative_hosted_events WHERE id=p_id AND removed_at IS NULL;
 IF v_spots IS NULL THEN RETURN kresilo_demo._err('NOT_FOUND'); END IF;
 IF p_on THEN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_id,11));
  IF NOT EXISTS(SELECT 1 FROM kresilo_demo.creative_hosted_going WHERE event_id=p_id AND person_id=v_person)
     AND (SELECT count(*) FROM kresilo_demo.creative_hosted_going WHERE event_id=p_id)>=v_spots THEN RETURN kresilo_demo._err('LIMIT_REACHED'); END IF;
  INSERT INTO kresilo_demo.creative_hosted_going(event_id,person_id) VALUES(p_id,v_person) ON CONFLICT DO NOTHING;
 ELSE
  DELETE FROM kresilo_demo.creative_hosted_going WHERE event_id=p_id AND person_id=v_person;
 END IF;
 RETURN kresilo_demo._ok(jsonb_build_object('going',(SELECT count(*) FROM kresilo_demo.creative_hosted_going WHERE event_id=p_id)));
END $$;
