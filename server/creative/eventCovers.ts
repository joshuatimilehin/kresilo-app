import { createHmac, timingSafeEqual } from "node:crypto";
import { EVENT_COVER_REF } from "@/creative/contracts";

/**
 * A host's own picture for their event. The bytes go to Octo's file store
 * (no migration: the event document keeps only a reference), and everyone who
 * can see the event can see its cover. So that this public route can never be
 * pointed at someone's private file, the reference carries a signature only
 * this server can make: `<fileId>.<hmac>`. File ids of private media never
 * leave the server, and even if one did, it would have no signature.
 *
 * The key is KRESILO_COVER_SECRET when set, otherwise derived from the
 * storage key (which already lives only on the server).
 */
export const MAX_COVER_BYTES = 1_500_000;

function secret(): string | null {
  const own = (process.env.KRESILO_COVER_SECRET ?? "").trim();
  if (own) return own;
  const storage = (process.env.OCTO_API_KEY ?? "").trim();
  return storage ? createHmac("sha256", storage).update("kresilo-event-cover").digest("hex") : null;
}

const mac = (key: string, fileId: string) => createHmac("sha256", key).update(`event-cover:${fileId.toLowerCase()}`).digest("hex").slice(0, 32);

/** The reference for a stored cover, or null when this server cannot sign. */
export function signCover(fileId: string): string | null {
  const key = secret();
  if (!key || !/^[0-9a-f-]{36}$/i.test(fileId)) return null;
  return `${fileId.toLowerCase()}.${mac(key, fileId)}`;
}

/** The file id inside a reference this server signed, or null for anything else. */
export function verifyCover(ref: string): string | null {
  const key = secret();
  if (!key || !EVENT_COVER_REF.test(ref)) return null;
  const [fileId, sig] = ref.split(".");
  const want = Buffer.from(mac(key, fileId), "hex");
  const got = Buffer.from(sig, "hex");
  return want.length === got.length && timingSafeEqual(want, got) ? fileId : null;
}

export type CoverType = "image/jpeg" | "image/png" | "image/webp";

/** The picture type the bytes really are, or null when they are not one of the three. */
export function sniffImage(bytes: Uint8Array): CoverType | null {
  const b = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") return "image/png";
  if (b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}
