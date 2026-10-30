import { defineHandler } from "nitro";
import { deleteCookie } from "nitro/h3";
import { creativeSession } from "../../../creative/session";
import { creativeQuery } from "../../../creative/store";
import { cookieName, isSameOrigin } from "../../../utils/session";
export default defineHandler(async (event) => {
  if (!isSameOrigin(event)) return { ok: false };
  try {
    await creativeQuery("creative_logout", [await creativeSession(event)]);
    deleteCookie(event, cookieName(), { path: "/" });
    return { ok: true };
  } catch {
    return { ok: false };
  }
});
