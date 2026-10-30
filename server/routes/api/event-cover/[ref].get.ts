import { defineHandler } from "nitro";
import { getRouterParam, setResponseHeader, setResponseStatus } from "nitro/h3";
import { readFileCached } from "../../../utils/octoFiles";
import { sniffImage, verifyCover } from "../../../creative/eventCovers";

/**
 * A hosted event's own cover, for anyone who can see the event. Only
 * references this server signed are served (see eventCovers.ts), and only
 * when the bytes really are a picture.
 */
export default defineHandler(async (event) => {
  const missing = () => {
    setResponseStatus(event, 404);
    setResponseHeader(event, "cache-control", "no-store");
    return "";
  };
  const fileId = verifyCover(getRouterParam(event, "ref") ?? "");
  if (!fileId) return missing();
  try {
    const bytes = await readFileCached(fileId);
    const type = sniffImage(bytes);
    if (!type) return missing();
    setResponseHeader(event, "content-type", type);
    setResponseHeader(event, "x-content-type-options", "nosniff");
    // A reference never changes its picture: a new picture is a new reference.
    setResponseHeader(event, "cache-control", "public, max-age=86400");
    setResponseHeader(event, "content-length", String(bytes.length));
    return new Uint8Array(bytes);
  } catch {
    return missing();
  }
});
