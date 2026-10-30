import { works } from "./catalog";
import { openBoardById } from "./openBoards";
import { projectById } from "./portfolio";

/**
 * What the work-comments table may hold comments for. Its rows are keyed by a
 * plain id the database only checks for shape (`^[a-z0-9-]{1,80}$`), so the
 * server checks here that the id names something real:
 *
 * - a catalog work, by its own id;
 * - a case study, as `case-<caseStudyId>`;
 * - an open board, as `board-<openBoardId>`.
 */
export const boardCommentId = (boardId: string) => `board-${boardId}`;
export const caseCommentId = (caseStudyId: string) => `case-${caseStudyId}`;

export function isCommentableId(id: string): boolean {
  if (!/^[a-z0-9-]{1,80}$/.test(id)) return false;
  if (works.some((w) => w.id === id)) return true;
  if (id.startsWith("case-")) return Boolean(projectById(id.slice(5)));
  if (id.startsWith("board-")) return Boolean(openBoardById(id.slice(6)));
  return false;
}
