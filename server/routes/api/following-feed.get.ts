import { defineHandler } from "nitro";
import { setResponseHeader } from "nitro/h3";
import { creativeQuery } from "../../creative/store";
import { hashToken, readToken } from "../../utils/session";
import { withoutTools } from "@/creative/publicStory";

/** Community posts by the people the viewer follows, newest first. */
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  try {
    const token = readToken(event);
    if (!token) return { ok: true, publications: [] };
    const posts = await creativeQuery<unknown[]>("creative_following_feed", [await hashToken(token)]);
    return { ok: true, publications: posts.map(withoutTools) };
  } catch {
    return { ok: false, publications: [] };
  }
});
