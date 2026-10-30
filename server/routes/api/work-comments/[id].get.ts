import { defineHandler } from "nitro";
import { getRouterParam, setResponseHeader, setResponseStatus } from "nitro/h3";
import { creativeQuery } from "../../../creative/store";
import { hashToken, readToken } from "../../../utils/session";
import { isCommentableId } from "@/creative/commentTargets";
import { withAuthors } from "../../../creative/follows";
import { hostedBoardAccess, hostedBoardOfComment } from "../../../creative/boards";
import type { PostComments } from "@/creative/postComments";

/** The comments on a work, a case study or an open board (see commentTargets.ts). Anyone may read; a signed-in viewer also learns which are theirs. */
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  const id = getRouterParam(event, "id") ?? "";
  const hosted = hostedBoardOfComment(id);
  if (!hosted && !isCommentableId(id)) {
    setResponseStatus(event, 404);
    return { ok: false };
  }
  try {
    const token = readToken(event);
    const hash = token ? await hashToken(token) : "";
    // A hosted board's talk is for its host and the people let in.
    if (hosted && !(await hostedBoardAccess(hash, hosted)).member) {
      setResponseStatus(event, 404);
      return { ok: false };
    }
    const list = await creativeQuery<PostComments>("creative_work_comments_list", [hash, id]);
    return { ok: true, ...list, comments: await withAuthors(list.comments) };
  } catch {
    setResponseStatus(event, 404);
    return { ok: false };
  }
});
