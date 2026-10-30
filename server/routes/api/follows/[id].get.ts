import { defineHandler } from "nitro";
import { getRouterParam, setResponseHeader, setResponseStatus } from "nitro/h3";
import { creativeQuery } from "../../../creative/store";
import { hashToken, readToken } from "../../../utils/session";

/** How many follow one profile (a person or a roster maker), how many that person follows, and whether the viewer follows them. */
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  const id = (getRouterParam(event, "id") ?? "").toLowerCase();
  if (!/^[a-z0-9-]{1,60}$/.test(id)) {
    setResponseStatus(event, 404);
    return { ok: false };
  }
  try {
    const token = readToken(event);
    const hash = token ? await hashToken(token) : "";
    return { ok: true, ...(await creativeQuery<{ followers: number; following: number; mine: boolean }>("creative_follow_counts", [hash, id])) };
  } catch {
    setResponseStatus(event, 404);
    return { ok: false };
  }
});
