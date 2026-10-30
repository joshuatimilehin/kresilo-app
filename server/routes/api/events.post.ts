import { defineHandler } from "nitro";
import { setResponseHeader, setResponseStatus } from "nitro/h3";
import { creativeSession } from "../../creative/session";
import { creativeQuery } from "../../creative/store";
import { isSameOrigin, rateLimit } from "../../utils/session";
import { cleanData, eventBatchSchema } from "@/creative/events";

/**
 * The screen's usage events, in batches. Same-origin, size-capped and
 * rate-limited; kinds and value shapes are a closed list (events.ts). A person
 * who turned recording off is acknowledged and nothing is stored.
 */
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  if (!isSameOrigin(event)) {
    setResponseStatus(event, 403);
    return { ok: false };
  }
  if (!rateLimit(event, "events")) {
    setResponseStatus(event, 429);
    return { ok: false };
  }
  try {
    const text = await event.req.text();
    if (text.length > 24_000) {
      setResponseStatus(event, 413);
      return { ok: false };
    }
    const parsed = eventBatchSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      setResponseStatus(event, 400);
      return { ok: false };
    }
    const hash = await creativeSession(event);
    const { device, session, client, events } = parsed.data;
    const build = event.req.headers.get("x-kresilo-build") ?? undefined;
    const stored = await creativeQuery<{ stored: number; recording: boolean }>("creative_event_log", [
      hash,
      events.map((e) => ({
        kind: e.kind,
        at: e.at,
        source: "client",
        project: e.projectId,
        session,
        device,
        client,
        build,
        data: cleanData(e.data),
      })),
    ]);
    return { ok: true, ...stored };
  } catch {
    setResponseStatus(event, 202);
    return { ok: false };
  }
});
