import { openBoardById, openBoards } from "./openBoards";
import { projectById } from "./portfolio";
import { isHostedBoardId } from "./boardRequests";

/**
 * Idea cards: a person pins a short note on a spot of a picture in someone
 * else's project (migration 015). An idea sits on a target:
 *
 * - a board a person hosts, by its id (`b-…`);
 * - a curated board, as `board-<openBoardId>`;
 * - a curated case study (the reel), as `case-<caseStudyId>`.
 *
 * Curated projects belong to fictional makers, so no one can answer their
 * ideas: they stay "open", and show to everyone only when the project is open
 * to contributions (it has an open board). A hosted board's own setting
 * decides; the host answers.
 */
export const IDEA_TARGET = /^(b-[a-z0-9]{6,16}|board-[a-z0-9-]{1,80}|case-[a-z0-9-]{1,80})$/;
export const IDEA_MAX = 280;
export const IDEA_PANELS = 20;

export const boardIdeaTarget = (boardId: string) => (isHostedBoardId(boardId) ? boardId : `board-${boardId}`);
export const caseIdeaTarget = (caseId: string) => `case-${caseId}`;

/** Whether the target names something real. A hosted board is checked by the database. */
export function isIdeaTarget(target: string): boolean {
  if (!IDEA_TARGET.test(target)) return false;
  if (target.startsWith("case-")) return Boolean(projectById(target.slice(5)));
  if (target.startsWith("board-")) return Boolean(openBoardById(target.slice(6)));
  return true;
}

/** Whether a curated target is open to contributions, so its ideas show to everyone. A hosted board decides for itself. */
export function openToIdeas(target: string): boolean {
  if (target.startsWith("board-")) return Boolean(openBoardById(target.slice(6)));
  if (target.startsWith("case-")) return openBoards.some((b) => b.projectId === target.slice(5));
  return false;
}

export type IdeaState = "open" | "accepted" | "declined";
export type Idea = {
  id: string;
  panel: number;
  /** Where on the picture, 0 to 1 from the top left. */
  x: number;
  y: number;
  text: string;
  picture: string | null;
  state: IdeaState;
  reply: string | null;
  author: string;
  at: string;
  mine: boolean;
};
export type IdeaList = {
  /** The viewer hosts this board and can answer. */
  host: boolean;
  public: boolean;
  ideas: Idea[];
  /** People whose ideas were accepted, with how many. */
  credits: { name: string; ideas: number }[];
};
export const noIdeas: IdeaList = { host: false, public: false, ideas: [], credits: [] };

/** Where a picture kept with an idea (or a board) is served. */
export const pictureUrl = (ref: string) => `/api/event-cover/${ref}`;

export const clamp01 = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));

/** The spot a tap landed on, as fractions of the picture's box. */
export function spotOf(clientX: number, clientY: number, box: { left: number; top: number; width: number; height: number }) {
  return { x: clamp01((clientX - box.left) / Math.max(1, box.width)), y: clamp01((clientY - box.top) / Math.max(1, box.height)) };
}

/** An idea's text, trimmed and held to the limit, or why it cannot be sent. */
export function checkIdea(text: string): { ok: true; text: string } | { ok: false } {
  const clean = text.trim();
  return clean && clean.length <= IDEA_MAX ? { ok: true, text: clean } : { ok: false };
}

export function parseIdeas(v: unknown): IdeaList {
  if (!v || typeof v !== "object") return noIdeas;
  const o = v as Partial<IdeaList>;
  return {
    host: o.host === true,
    public: o.public === true,
    ideas: Array.isArray(o.ideas) ? o.ideas.filter((i) => i && typeof i.id === "string" && typeof i.text === "string" && Number.isFinite(i.x) && Number.isFinite(i.y)) : [],
    credits: Array.isArray(o.credits) ? o.credits.filter((c) => c && typeof c.name === "string") : [],
  };
}
