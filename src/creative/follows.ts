/** Who can be followed: a person (a uuid) or a roster maker (a slug). The same shape the server accepts. */
export const FOLLOW_ID = /^[a-z0-9-]{1,60}$/;
const PERSON_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const isPersonId = (id: string): boolean => PERSON_ID.test(id);

/** Whether a follow button belongs next to this author: someone is named, and it is not the viewer. */
export const canFollow = (viewerId: string | undefined, target: string | undefined): target is string =>
  Boolean(target) && FOLLOW_ID.test(String(target).toLowerCase()) && String(target).toLowerCase() !== (viewerId ?? "").toLowerCase();

/**
 * Everyone the viewer follows. Follows are saved on the server; roster follows
 * made before that are still in the profile until they are moved, so both are read.
 */
export function mergeFollowing(server: readonly string[], profile: readonly string[]): string[] {
  return [...new Set([...server, ...profile].map((id) => id.toLowerCase()))];
}

/** The followed ids split into roster makers (kept in the bundle) and people (kept on the server). */
export function splitFollowing(ids: readonly string[], isMaker: (id: string) => boolean): { makers: string[]; people: string[] } {
  return { makers: ids.filter(isMaker), people: ids.filter((id) => !isMaker(id) && isPersonId(id)) };
}

/** The followed ids after one follow or unfollow, newest first; repeating either changes nothing. */
export function withFollow(ids: readonly string[], id: string, on: boolean): string[] {
  const target = id.toLowerCase();
  const rest = ids.filter((x) => x !== target);
  return on ? [target, ...rest] : rest;
}
