import { OAuth2Client } from "google-auth-library";
export function googleClient() {
  const id = process.env.GOOGLE_CLIENT_ID,
    secret = process.env.GOOGLE_CLIENT_SECRET;
  const redirect =
    process.env.GOOGLE_REDIRECT_URI ??
    "https://kresilo.design-bakery.com/api/auth/google/callback";
  if (!id || !secret) throw new Error("GOOGLE_SETUP_REQUIRED");
  return new OAuth2Client(id, secret, redirect);
}
