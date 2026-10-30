import { creativeQuery } from "./store";

/** The author's person id on each item (a post or a comment), found by the item's id. Items whose author cannot be read are left as they are. */
export async function withAuthors<T extends { id: string }>(items: T[]): Promise<(T & { authorId?: string })[]> {
  if (!items.length) return items;
  try {
    const authors = await creativeQuery<Record<string, string>>("creative_authors", [items.map((i) => i.id)]);
    return items.map((i) => (authors[i.id] ? { ...i, authorId: authors[i.id] } : i));
  } catch {
    // Until migration 017 is applied nobody has a follow button.
    return items;
  }
}
