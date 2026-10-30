import { defineHandler } from "nitro";
import { getQuery, setResponseHeader, setResponseStatus } from "nitro/h3";
import { creativeQuery } from "../../creative/store";
import { hashToken, readToken } from "../../utils/session";
import { COMPETITION_ID } from "@/creative/contracts";
import type { PublicCompetition } from "@/creative/competitionRules";

/** Competitions people host, or one by id with its entries. Anyone may read; a visitor also learns what is theirs. */
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  const id = String(getQuery(event).id ?? "");
  if (id && !COMPETITION_ID.test(id)) {
    setResponseStatus(event, 404);
    return { ok: false };
  }
  try {
    const token = readToken(event);
    const hash = token ? await hashToken(token) : "";
    return { ok: true, competitions: await creativeQuery<PublicCompetition[]>("creative_competition_list", [hash, id]) };
  } catch {
    return { ok: true, competitions: [] };
  }
});
