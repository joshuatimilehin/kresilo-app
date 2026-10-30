/**
 * The shared events feed is public, but an online event's video link is for the
 * people going to it. The server blanks the link for anyone who is neither the
 * host nor registered; when a person registers, the feed reloads and the link
 * comes with it.
 */
export type FeedEntry<E extends { link?: string }> = { event: E; mine: boolean; youGo: boolean };

export function withoutLinksForStrangers<E extends { link?: string }, T extends FeedEntry<E>>(entries: readonly T[]): T[] {
  return entries.map((x) => (x.mine || x.youGo || !x.event.link ? x : { ...x, event: { ...x.event, link: "" } }));
}
