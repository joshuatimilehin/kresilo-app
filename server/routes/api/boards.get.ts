import { defineHandler } from "nitro";
import { setResponseHeader } from "nitro/h3";
import { creativeQuery } from "../../creative/store";
import { hashToken, readToken } from "../../utils/session";
import { emptyBoards, type BoardsState, type HostedBoard, type InboxItem, type BoardPlace } from "@/creative/boardRequests";

/**
 * The boards people host, where the viewer stands on every board they asked
 * (curated or hosted), and the requests waiting on the boards they host.
 * Anyone may read the list; a visitor with no session sees no places or inbox.
 */
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  try {
    const token = readToken(event);
    const hash = token ? await hashToken(token) : "";
    const [boards, mine] = await Promise.all([
      creativeQuery<HostedBoard[]>("creative_boards_list", [hash, ""]),
      creativeQuery<{ places: Record<string, BoardPlace>; inbox: InboxItem[] }>("creative_board_places", [hash]),
    ]);
    return { ok: true, boards, places: mine.places, inbox: mine.inbox } satisfies { ok: true } & BoardsState;
  } catch {
    return { ok: true, ...emptyBoards };
  }
});
