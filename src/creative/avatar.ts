/**
 * The picture an avatar draws. Avatars are 22 to 34 pixels across, so a maker's
 * portrait is swapped for its tiny copy (scripts/portrait-thumbs.sh) and the
 * full portrait stays for the profile page; drawn marks and anything else are
 * left alone.
 */
export function avatarSrc(portrait: string): string {
  // A portrait's address may end in a version tag (?v=...), which the copy keeps so a new portrait is fetched anew.
  const m = /\/([^/?]*portrait[^/?]*)\.(?:jpg|webp)(\?.*)?$/.exec(portrait);
  return m ? `/assets/kresilo/p/${m[1]}.jpg${m[2] ?? ""}` : portrait;
}
