import { defineHandler } from "nitro";
import { getRouterParam, setResponseHeader, setResponseStatus } from "nitro/h3";
import { creativeQuery } from "../../../creative/store";
import { hashToken, readToken } from "../../../utils/session";
import { withAuthors } from "../../../creative/follows";
import type { PostComments } from "@/creative/postComments";

/** The comments on a community post. Anyone may read; a signed-in viewer also learns which are theirs. */
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  const id = getRouterParam(event, "id") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    setResponseStatus(event, 404);
    return { ok: false };
  }
  try {
    const token = readToken(event);
    const hash = token ? await hashToken(token) : "";
    const list = await creativeQuery<PostComments>("creative_post_comments_list", [hash, id]);
    return { ok: true, ...list, comments: await withAuthors(list.comments) };
  } catch {
    setResponseStatus(event, 404);
    return { ok: false };
  }
});
