import { defineHandler } from "nitro";
import { sendRedirect, setCookie } from "nitro/h3";
import { googleClient } from "../../../../creative/google";
import { creativeSession } from "../../../../creative/session";
import { creativeQuery } from "../../../../creative/store";
import { newToken } from "../../../../utils/session";
export default defineHandler(async (event) => {
  try {
    const hash = await creativeSession(event, true);
    await creativeQuery("creative_open", [hash]);
    const client = googleClient(),
      state = newToken(),
      nonce = newToken();
    const { codeVerifier, codeChallenge } =
      await client.generateCodeVerifierAsync();
    setCookie(
      event,
      "kresilo_oauth",
      JSON.stringify({ state, nonce, codeVerifier }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/auth/google",
        maxAge: 600,
      },
    );
    return sendRedirect(
      event,
      client.generateAuthUrl({
        scope: ["openid", "profile"],
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: "S256" as never,
      }),
    );
  } catch {
    return sendRedirect(event, "/you?auth=setup");
  }
});
