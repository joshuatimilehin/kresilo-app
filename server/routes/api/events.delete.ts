import { defineHandler } from "nitro";
import { setResponseHeader, setResponseStatus } from "nitro/h3";
import { creativeSession } from "../../creative/session";
import { creativeQuery } from "../../creative/store";
import { isSameOrigin } from "../../utils/session";

/** A person deletes their own usage log. */
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  if (!isSameOrigin(event)) {
    setResponseStatus(event, 403);
    return { ok: false };
  }
  try {
    const hash = await creativeSession(event);
    return { ok: true, ...(await creativeQuery<{ deleted: number }>("creative_events_clear", [hash])) };
  } catch {
    setResponseStatus(event, 404);
    return { ok: false };
  }
});
