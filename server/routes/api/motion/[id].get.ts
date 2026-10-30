import { defineHandler } from "nitro";
import { getRouterParam, setResponseHeader, setResponseStatus } from "nitro/h3";
import { creativeSession } from "../../../creative/session";
import { creativeQuery } from "../../../creative/store";
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  const id = getRouterParam(event, "id");
  if (!/^[0-9a-f-]{36}$/i.test(id ?? "")) {
    setResponseStatus(event, 404);
    return { ok: false };
  }
  try {
    return {
      ok: true,
      ...(await creativeQuery<object>("creative_motion_get", [
        await creativeSession(event),
        id,
      ])),
    };
  } catch {
    setResponseStatus(event, 404);
    return { ok: false };
  }
});
