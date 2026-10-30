import type { MemberRole } from "./contracts";
import { openBoardById } from "./openBoards";

/**
 * Open boards people host, and where a person stands on any open board.
 *
 * The curated boards (openBoards.ts) are run by fictional makers: asking one
 * is stored for the asker but nobody can answer it, so it stays "asked". A
 * board a person opens from their own project is a row in the database; its
 * host answers requests and every device sees the same answer (migration 014).
 */
export type BoardPlace = "none" | "asked" | "in" | "declined";

/** What a hosted board keeps about itself: a name, the roles it wants and the picture people see. */
export type HostedBoardDoc = { title: string; cover: string; wanted: MemberRole[] };

export type HostedBoard = {
  id: string;
  doc: HostedBoardDoc;
  /** Whether ideas pinned on the board show to everyone (otherwise to the host and their author). */
  ideasPublic: boolean;
  hostName: string;
  /** The viewer hosts it. */
  mine: boolean;
  /** The project it was opened from, shown to its host only. */
  project: string | null;
  place: BoardPlace;
  /** Names of the people let in (the host is not listed). */
  members: string[];
};

export type InboxItem = { board: string; title: string; person: string; name: string; at: string };

export type BoardsState = {
  boards: HostedBoard[];
  /** The viewer's request on every board they asked, curated or hosted. */
  places: Record<string, BoardPlace>;
  /** Requests waiting on the viewer's own boards, oldest first. */
  inbox: InboxItem[];
};

export const HOSTED_BOARD_ID = /^b-[a-z0-9]{6,16}$/;
export const isHostedBoardId = (id: string) => HOSTED_BOARD_ID.test(id);

/** A board id a person may ask to join: one of the curated boards, or a hosted one (the database knows whether it is open). */
export const isAskableBoard = (id: string) => Boolean(openBoardById(id)) || isHostedBoardId(id);

export const emptyBoards: BoardsState = { boards: [], places: {}, inbox: [] };

export function placeOf(places: Record<string, BoardPlace>, id: string): BoardPlace {
  const p = places[id];
  return p === "asked" || p === "in" || p === "declined" ? p : "none";
}

/** Whether the person can see the board's work and talk on it: they host it, or the host let them in. */
export const canJoinIn = (place: BoardPlace, mine = false) => mine || place === "in";

/** The least a reply from the boards route must look like to be trusted by the screen. */
export function parseBoards(v: unknown): BoardsState {
  if (!v || typeof v !== "object") return emptyBoards;
  const o = v as Partial<BoardsState>;
  return {
    boards: Array.isArray(o.boards) ? o.boards.filter((b) => b && typeof b.id === "string" && isHostedBoardId(b.id) && b.doc && typeof b.doc.title === "string") : [],
    places: o.places && typeof o.places === "object" ? (o.places as Record<string, BoardPlace>) : {},
    inbox: Array.isArray(o.inbox) ? o.inbox.filter((i) => i && typeof i.board === "string" && typeof i.person === "string") : [],
  };
}
