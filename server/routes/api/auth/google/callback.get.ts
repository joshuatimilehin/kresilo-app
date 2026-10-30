import { defineHandler } from "nitro";
import { getCookie, deleteCookie, getQuery, sendRedirect } from "nitro/h3";
import { googleClient } from "../../../../creative/google";
import { creativeSession } from "../../../../creative/session";
import { creativeQuery } from "../../../../creative/store";
import {
  expiresAt,
  newToken,
  sha256Hex,
  setSessionToken,
} from "../../../../utils/session";
export default defineHandler(async (event) => {
  try {
    const saved = JSON.parse(getCookie(event, "kresilo_oauth") ?? "{}");
    deleteCookie(event, "kresilo_oauth", { path: "/api/auth/google" });
    const query = getQuery(event);
    if (
      !saved.state ||
      query.state !== saved.state ||
      typeof query.code !== "string"
    )
      throw new Error("INVALID_STATE");
    const hash = await creativeSession(event);
    const client = googleClient();
    const { tokens } = await client.getToken({
      code: query.code,
      codeVerifier: saved.codeVerifier,
    });
    if (!tokens.id_token) throw new Error("NO_IDENTITY");
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (
      !payload?.sub ||
      (payload as unknown as { nonce: string }).nonce !== saved.nonce
    )
      throw new Error("INVALID_IDENTITY");
    await creativeQuery("creative_google", [
      hash,
      payload.sub,
      payload.name ?? "You",
    ]);
    const token = newToken();
    const next = { hash: await sha256Hex(token) };
    await creativeQuery("creative_rotate", [hash, next.hash, expiresAt()]);
    setSessionToken(event, token);
    return sendRedirect(event, "/projects");
  } catch {
    return sendRedirect(event, "/you?auth=failed");
  }
});
