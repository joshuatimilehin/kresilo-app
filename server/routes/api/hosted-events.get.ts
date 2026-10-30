import { defineHandler } from "nitro";
import { getQuery, setResponseHeader, setResponseStatus } from "nitro/h3";
import { creativeQuery } from "../../creative/store";
import { hashToken, readToken } from "../../utils/session";
import type { HostedEvent } from "@/creative/contracts";
import { withoutLinksForStrangers } from "@/creative/eventPrivacy";

export type PublicHostedEvent = { event: HostedEvent; hostName: string; going: number; mine: boolean; youGo: boolean };

/** Events people host: upcoming ones, or one by id. Anyone may read; a visitor also learns which are theirs. */
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  const id = String(getQuery(event).id ?? "");
  if (id && !/^h-[a-z0-9]{6,16}$/.test(id)) {
    setResponseStatus(event, 404);
    return { ok: false };
  }
  try {
    const token = readToken(event);
    const hash = token ? await hashToken(token) : "";
    return { ok: true, events: withoutLinksForStrangers(await creativeQuery<PublicHostedEvent[]>("creative_hosted_list", [hash, id])) };
  } catch {
    return { ok: true, events: [] };
  }
});
