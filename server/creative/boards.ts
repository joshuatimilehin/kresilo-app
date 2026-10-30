import { creativeQuery } from "./store";
import { isHostedBoardId, type HostedBoard } from "@/creative/boardRequests";

/**
 * What a person may do on a board someone hosts: the host and anyone the host
 * let in can see its work and talk on it. Curated boards live in the bundle
 * and keep their older rule (anyone signed in may comment).
 */
export async function hostedBoardAccess(hash: string, boardId: string): Promise<{ exists: boolean; host: boolean; member: boolean }> {
  if (!isHostedBoardId(boardId)) return { exists: false, host: false, member: false };
  const [board] = await creativeQuery<HostedBoard[]>("creative_boards_list", [hash, boardId]);
  if (!board) return { exists: false, host: false, member: false };
  return { exists: true, host: board.mine, member: board.mine || board.place === "in" };
}

/** The hosted board a comment id (`board-b-…`) names, if it names one. */
export const hostedBoardOfComment = (id: string) => (id.startsWith("board-") && isHostedBoardId(id.slice(6)) ? id.slice(6) : null);
