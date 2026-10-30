import { defineHandler } from "nitro";
import { setResponseHeader, setResponseStatus } from "nitro/h3";
import { isSameOrigin, rateLimit } from "../../utils/session";
import { creativeFailure } from "@/creative/contracts";
import { executeCreative } from "../../creative/service";
import { creativeSession } from "../../creative/session";
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  if (!isSameOrigin(event)) {
    setResponseStatus(event, 403);
    return creativeFailure("FORBIDDEN");
  }
  if (!rateLimit(event, "creative")) {
    setResponseStatus(event, 429);
    return creativeFailure(
      "RATE_LIMITED",
      "Please wait a moment before trying again.",
    );
  }
  try {
    const reader = event.req.body?.getReader();
    let text = "";
    let bytes = 0;
    const decoder = new TextDecoder();
    if (reader) {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.length;
        if (bytes > 6100000) {
          await reader.cancel();
          throw new Error("LIMIT_REACHED");
        }
        text += decoder.decode(chunk.value, { stream: true });
      }
    }
    text += decoder.decode();
    if (text.length > 6100000) {
      setResponseStatus(event, 413);
      return creativeFailure("INVALID_INPUT");
    }
    const body = JSON.parse(text);
    const hash = await creativeSession(event, body.verb === "workspace.get");
    const header = (name: string) => event.req.headers.get(name) ?? undefined;
    const result = await executeCreative(hash, body.verb, body.input, body.actor, {
      device: header("x-kresilo-device"),
      session: header("x-kresilo-session"),
      build: header("x-kresilo-build"),
    });
    if (result.ok && result.workspace)
      result.workspace.googleReady = Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
      );
    return result;
  } catch (error) {
    setResponseStatus(event, 503);
    return creativeFailure(
      error instanceof Error ? error.message : "STORAGE_ERROR",
    );
  }
});
