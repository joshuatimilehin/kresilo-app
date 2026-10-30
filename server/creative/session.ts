import type { H3Event } from "nitro/h3";
import { OctoStore } from "../store/octoStore";
import { expiresAt, hashToken, readToken, rotateGuest } from "../utils/session";
export async function creativeSession(
  event: H3Event,
  create = false,
): Promise<string> {
  const store = new OctoStore();
  const token = readToken(event);
  let hash = token ? await hashToken(token) : null;
  if (hash) {
    const live = await store.sessionLive(hash);
    if (!live.ok) throw new Error("STORAGE_ERROR");
    if (!live.data) hash = null;
  }
  if (!hash) {
    if (!create) throw new Error("SESSION_INVALID");
    hash = (await rotateGuest(event)).hash;
  }
  const seed = await store.ensureGuest(hash, expiresAt());
  if ("code" in seed) throw new Error(seed.code);
  return hash;
}
