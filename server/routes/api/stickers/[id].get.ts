import { defineHandler } from "nitro";
import { getRouterParam, setResponseHeader, setResponseStatus } from "nitro/h3";
import { creativeSession } from "../../../creative/session";
import { stickerStatus } from "../../../creative/stickers";

/** How a sticker job is going: making, ready or failed. Only its own session sees it. */
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  try {
    const hash = await creativeSession(event);
    const job = stickerStatus(getRouterParam(event, "id") ?? "", hash);
    if (!job) {
      setResponseStatus(event, 404);
      return { ok: false };
    }
    return { ok: true, job };
  } catch {
    setResponseStatus(event, 404);
    return { ok: false };
  }
});
