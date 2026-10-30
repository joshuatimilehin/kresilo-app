import { generatedArt } from "./generated";

/** The file name a generated image is saved under (see scripts/art-prompts.ts). */
export const artFile = (key: string) =>
  `/assets/kresilo/gen/${key.replace(/:/g, "--").toLowerCase().replace(/[^a-z0-9-]+/g, "-")}.jpg`;

/** Whether a generated image exists for a key. */
export const hasArt = (key: string): boolean => generatedArt.has(key);

/**
 * The generated image for a key, if one exists. The URL carries a hash of the
 * file, because /assets is served as immutable: a regenerated picture needs a
 * new URL to reach browsers and the CDN.
 */
export const artSrc = (key: string): string | undefined => {
  const v = generatedArt.get(key);
  return v ? `${artFile(key)}?v=${v}` : undefined;
};

/**
 * A project cover's small copy (scripts/art-thumbs.sh) for cards and grids, which
 * show it a few hundred pixels wide; any other picture comes back at full size.
 */
export const artThumb = (key: string): string | undefined => {
  const full = artSrc(key);
  if (!full || !/^panel:.+:0$/.test(key)) return full;
  const v = generatedArt.get(key);
  // &t names the thumbnail size (400px), so a browser or CDN holding an older, larger copy fetches the new one.
  return `${artFile(key).replace("/gen/", "/gen/t/")}?v=${v}&t=400`;
};
