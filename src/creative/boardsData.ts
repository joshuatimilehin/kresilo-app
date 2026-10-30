import { useCallback, useEffect, useState } from "react";
import { emptyBoards, parseBoards, placeOf, type BoardPlace, type BoardsState } from "./boardRequests";
import { noIdeas, parseIdeas, type IdeaList } from "./ideaCards";

/** How often a visible page asks again, so a host's answer reaches the asker's screen without a reload. */
const REFRESH_MS = 15000;

/** Reads a small JSON route now, when the tab comes back and every few seconds while it is open. */
function useLive<T>(url: string | null, parse: (v: unknown) => T, initial: T): { data: T; refresh: () => Promise<void>; ready: boolean } {
  const [data, setData] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const refresh = useCallback(async () => {
    if (!url) return;
    try {
      const r = await fetch(url, { credentials: "same-origin" }).then((x) => x.json());
      setData(parse(r?.ok ? r : null));
    } catch {
      /* the last answer stays */
    }
    setReady(true);
  }, [url, parse]);
  useEffect(() => {
    void refresh();
    if (!url) return;
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = window.setInterval(tick, REFRESH_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [url, refresh]);
  return { data, refresh, ready };
}

/** The boards people host, the viewer's place on every board, and the requests waiting on their own boards. */
export function useBoardsState() {
  const { data, refresh, ready } = useLive<BoardsState>("/api/boards", parseBoards, emptyBoards);
  return { ...data, refresh, ready, placeOn: (id: string): BoardPlace => placeOf(data.places, id) };
}

/** The ideas on one target; nothing is read until `enabled`. */
export function useIdeas(target: string, enabled = true) {
  const { data, refresh } = useLive<IdeaList>(enabled ? `/api/ideas/${target}` : null, parseIdeas, noIdeas);
  return { list: data, refresh };
}
