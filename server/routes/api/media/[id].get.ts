import { defineHandler } from "nitro";
import { getRouterParam, setResponseHeader, setResponseStatus } from "nitro/h3";
import { creativeQuery } from "../../../creative/store";
import { creativeSession } from "../../../creative/session";
import { readFileCached } from "../../../utils/octoFiles";
import { contentRange, parseRange } from "@/creative/range";

/**
 * Serves a stored image or loop to someone who may see it (the session check
 * happens in storage). Bytes come from the row (older media) or Octo's file
 * store (loops). Byte ranges are answered here because Safari needs them.
 */
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "private, no-store");
  setResponseHeader(event, "x-content-type-options", "nosniff");
  setResponseHeader(event, "accept-ranges", "bytes");
  const id = getRouterParam(event, "id");
  if (!/^[0-9a-f-]{36}$/i.test(id ?? "")) {
    setResponseStatus(event, 404);
    return { ok: false };
  }
  try {
    const media = await creativeQuery<{
      contentType: string;
      base64: string | null;
      fileId: string | null;
    }>("creative_media_get", [await creativeSession(event), id]);
    const bytes = media.fileId
      ? await readFileCached(media.fileId)
      : Buffer.from(media.base64 ?? "", "base64");
    setResponseHeader(event, "content-type", media.contentType);
    const range = parseRange(event.req.headers.get("range"), bytes.length);
    if (range === "invalid") {
      setResponseStatus(event, 416);
      setResponseHeader(event, "content-range", `bytes */${bytes.length}`);
      return "";
    }
    if (range) {
      setResponseStatus(event, 206);
      setResponseHeader(event, "content-range", contentRange(range, bytes.length));
      setResponseHeader(event, "content-length", String(range.end - range.start + 1));
      return new Uint8Array(bytes.subarray(range.start, range.end + 1));
    }
    setResponseHeader(event, "content-length", String(bytes.length));
    return new Uint8Array(bytes);
  } catch {
    setResponseStatus(event, 404);
    return { ok: false };
  }
});
