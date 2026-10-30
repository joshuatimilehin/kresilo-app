import { defineHandler } from "nitro";
import { setResponseHeader, setResponseStatus } from "nitro/h3";
import { z } from "zod";
import { creativeSession } from "../../creative/session";
import { creativeQuery } from "../../creative/store";
import { startSticker } from "../../creative/stickers";
import { isSameOrigin, rateLimit } from "../../utils/session";

const body = z.object({ projectId: z.string().uuid(), prompt: z.string().trim().min(2).max(160) }).strict();

/** Starts a sticker for a project the person can edit; returns the job at once. */
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  if (!isSameOrigin(event)) {
    setResponseStatus(event, 403);
    return { ok: false, code: "FORBIDDEN" };
  }
  if (!rateLimit(event, "stickers")) {
    setResponseStatus(event, 429);
    return { ok: false, code: "RATE_LIMITED" };
  }
  try {
    const parsed = body.safeParse(JSON.parse(await event.req.text()));
    if (!parsed.success) {
      setResponseStatus(event, 400);
      return { ok: false, code: "INVALID_INPUT" };
    }
    const hash = await creativeSession(event);
    // Only a project this session can open.
    await creativeQuery("creative_get", [hash, parsed.data.projectId]);
    const started = startSticker(hash, parsed.data.projectId, parsed.data.prompt);
    if ("code" in started) {
      setResponseStatus(event, started.code === "RATE_LIMITED" ? 429 : 503);
      return { ok: false, code: started.code };
    }
    setResponseStatus(event, 202);
    return { ok: true, job: { id: started.job.id, status: started.job.status, prompt: started.job.prompt } };
  } catch {
    setResponseStatus(event, 404);
    return { ok: false, code: "NOT_FOUND" };
  }
});
