import { defineHandler } from "nitro";
import { setResponseHeader } from "nitro/h3";
import { creativeQuery } from "../../creative/store";
import { hashToken, readToken } from "../../utils/session";

/** Who the signed-in viewer follows (person ids and roster maker ids), and how many follow them. */
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  try {
    const token = readToken(event);
    const hash = token ? await hashToken(token) : "";
    return { ok: true, ...(await creativeQuery<{ following: string[]; followers: number }>("creative_follows_mine", [hash])) };
  } catch {
    return { ok: false, following: [], followers: 0 };
  }
});
