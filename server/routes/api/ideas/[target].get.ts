import { defineHandler } from "nitro";
import { getRouterParam, setResponseHeader, setResponseStatus } from "nitro/h3";
import { creativeQuery } from "../../../creative/store";
import { hashToken, readToken } from "../../../utils/session";
import { isIdeaTarget, openToIdeas, type IdeaList } from "@/creative/ideaCards";

/**
 * The ideas pinned on a project: a viewer sees their own, a board's host sees
 * all of them, and everyone sees open and accepted ones where the project is
 * open to contributions (see ideaCards.ts).
 */
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  const target = getRouterParam(event, "target") ?? "";
  if (!isIdeaTarget(target)) {
    setResponseStatus(event, 404);
    return { ok: false };
  }
  try {
    const token = readToken(event);
    const hash = token ? await hashToken(token) : "";
    return { ok: true, ...(await creativeQuery<IdeaList>("creative_ideas_list", [hash, target, openToIdeas(target)])) };
  } catch {
    setResponseStatus(event, 404);
    return { ok: false };
  }
});
