import { defineHandler } from "nitro";
import { getQuery, setResponseHeader, setResponseStatus } from "nitro/h3";
import { creativeSession } from "../../creative/session";
import { creativeQuery } from "../../creative/store";
import type { StoredEvent } from "@/creative/events";

/** The signed-in person's own events, newest first. Never anyone else's. */
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "private, no-store");
  try {
    const q = getQuery(event);
    const project = typeof q.project === "string" && /^[0-9a-f-]{36}$/i.test(q.project) ? q.project : null;
    const limit = Math.min(Math.max(Number(q.limit) || 300, 1), 1000);
    const hash = await creativeSession(event);
    const events = await creativeQuery<StoredEvent[]>("creative_events_list", [hash, project, limit]);
    return { ok: true, events };
  } catch {
    setResponseStatus(event, 404);
    return { ok: false, events: [] };
  }
});
