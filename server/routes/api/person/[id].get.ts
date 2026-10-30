import { defineHandler } from "nitro";
import { getRouterParam, setResponseHeader, setResponseStatus } from "nitro/h3";
import { creativeQuery } from "../../../creative/store";
import { hashToken, readToken } from "../../../utils/session";
import { withoutTools } from "@/creative/publicStory";

/** A person's public page: their name, follower and following counts, and their community posts. */
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
    const person = await creativeQuery<{ id: string; name: string; counts: unknown; posts: unknown[] }>("creative_person_public", [hash, id.toLowerCase()]);
    return { ok: true, ...person, posts: person.posts.map(withoutTools) };
  } catch {
    setResponseStatus(event, 404);
    return { ok: false };
  }
});
