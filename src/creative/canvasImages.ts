import { z } from "zod";

/**
 * Pictures people add to the Studio canvas. The scene itself holds about 1 MB of JSON, so a picture is stored as
 * project media (`canvas.image`) and the scene only remembers which canvas file is which media. Pictures a person
 * added are private: a project that has them on the canvas cannot be published.
 */
export const MAX_PICTURES = 24;
export const PICTURE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type PictureType = (typeof PICTURE_TYPES)[number];
/** Largest picture, in characters of base64 (about 4.5 MB of image). */
export const MAX_PICTURE_BASE64 = 6_000_000;

export const picturesSchema = z
  .record(z.string().min(1).max(64), z.object({ mediaId: z.string().uuid(), mimeType: z.enum(PICTURE_TYPES) }).strict())
  .refine((o) => Object.keys(o).length <= MAX_PICTURES, `At most ${MAX_PICTURES} pictures.`);
export type Pictures = z.infer<typeof picturesSchema>;

/** The pictures a saved scene remembers; null when the scene is not readable or its list is not valid. */
export function scenePictures(scene: string): Pictures | null {
  try {
    const parsed = JSON.parse(scene) as { images?: unknown };
    if (parsed.images === undefined) return {};
    const r = picturesSchema.safeParse(parsed.images);
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

/** True when the bytes begin the way their stated type says they should. */
export function pictureBytesValid(type: PictureType, bytes: Uint8Array): boolean {
  const head = (n: number) => Buffer.from(bytes.subarray(0, n));
  if (type === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216;
  if (type === "image/png") return head(8).toString("hex") === "89504e470d0a1a0a";
  return head(4).toString("ascii") === "RIFF" && Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP";
}
