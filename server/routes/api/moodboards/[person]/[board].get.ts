import { defineHandler } from "nitro";
import { getRouterParam, setResponseHeader, setResponseStatus } from "nitro/h3";
import { creativeQuery } from "../../../../creative/store";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** One moodboard its owner made public: its name, who made it and the saved things on it. Anyone may read; a private or missing board is a 404. */
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  const person = getRouterParam(event, "person") ?? "";
  const board = getRouterParam(event, "board") ?? "";
  if (!UUID.test(person)) {
    setResponseStatus(event, 404);
    return { ok: false };
  }
  try {
    return { ok: true, ...(await creativeQuery<{ owner: { id: string; name: string }; board: { id: string; name: string; items: string[] } }>("creative_moodboard_get", [person, board])) };
  } catch {
    setResponseStatus(event, 404);
    return { ok: false };
  }
});
