/**
 * Moodboards: named boards a person files their saved things into, public or
 * private, like Instagram's saved collections. Everything saved is in Saved;
 * a board holds some of it. So an item on a board is always also in Saved, and
 * taking an item out of Saved takes it off every board.
 */
export type Moodboard = { id: string; name: string; public: boolean; items: string[] };

export const MAX_BOARDS = 12;
export const MAX_SAVED = 200;
export const BOARD_NAME_MAX = 40;

type State = { saved: string[]; moodboards: Moodboard[] };

const slug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

/** A board id that no other board has: m-<name>, then m-<name>-2 and so on. */
export function boardId(boards: readonly Moodboard[], name: string): string {
  const base = `m-${slug(name) || "board"}`;
  const taken = new Set(boards.map((b) => b.id));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

/** A new, empty board, or null when the name is empty or the person already has the most boards. */
export function addBoard(boards: readonly Moodboard[], name: string, isPublic: boolean): Moodboard[] | null {
  const clean = name.trim().slice(0, BOARD_NAME_MAX);
  if (!clean || boards.length >= MAX_BOARDS) return null;
  return [...boards, { id: boardId(boards, clean), name: clean, public: isPublic, items: [] }];
}

/** The ids of the boards that hold an item. */
export const boardsHolding = (boards: readonly Moodboard[], item: string): string[] =>
  boards.filter((b) => b.items.includes(item)).map((b) => b.id);

/** Puts an item on a board (also saving it), or takes it off that board and leaves it in Saved. */
export function toggleOnBoard(s: State, id: string, item: string): State {
  const board = s.moodboards.find((b) => b.id === id);
  if (!board) return s;
  const on = board.items.includes(item);
  if (!on && board.items.length >= MAX_SAVED) return s;
  return {
    saved: on || s.saved.includes(item) ? s.saved : [item, ...s.saved].slice(0, MAX_SAVED),
    moodboards: s.moodboards.map((b) =>
      b.id !== id ? b : { ...b, items: on ? b.items.filter((x) => x !== item) : [item, ...b.items] },
    ),
  };
}

/** Saves an item to Saved, or removes it from Saved and from every board. */
export function toggleSaved(s: State, item: string): State {
  if (s.saved.includes(item))
    return { saved: s.saved.filter((x) => x !== item), moodboards: s.moodboards.map((b) => ({ ...b, items: b.items.filter((x) => x !== item) })) };
  return { saved: [item, ...s.saved].slice(0, MAX_SAVED), moodboards: s.moodboards };
}

/** Makes a board public or private. */
export const setBoardPublic = (boards: readonly Moodboard[], id: string, isPublic: boolean): Moodboard[] =>
  boards.map((b) => (b.id === id ? { ...b, public: isPublic } : b));

/** Deletes a board; what it held stays in Saved. */
export const removeBoard = (boards: readonly Moodboard[], id: string): Moodboard[] => boards.filter((b) => b.id !== id);

/** The saved keys to show: all of Saved, or one board's items that are still saved, in the order saved. */
export function keysToShow(saved: readonly string[], boards: readonly Moodboard[], boardFilter: string): string[] {
  if (boardFilter === "all") return [...saved];
  const board = boards.find((b) => b.id === boardFilter);
  return board ? saved.filter((k) => board.items.includes(k)) : [...saved];
}
