import { useEffect, useSyncExternalStore } from "react";
import { useCreative } from "./context";
import { mergeFollowing, withFollow } from "./follows";

type State = { owner: string; ids: readonly string[]; followers: number; loaded: boolean };
const empty: State = { owner: "", ids: [], followers: 0, loaded: false };
let state = empty;
const listeners = new Set<() => void>();
const publish = (next: State) => {
  state = next;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

/** Reads the viewer's saved follows from the server into the shared list. */
export async function loadFollows(owner: string): Promise<void> {
  try {
    const r = await fetch("/api/follows").then((x) => x.json());
    if (r.ok) publish({ owner, ids: r.following, followers: r.followers ?? 0, loaded: true });
  } catch {
    /* the profile's own list still shows */
  }
}

/** Keeps the shared follow list for whoever is signed in, and moves old profile follows to the server the first time. Mount once. */
export function useFollowSync(): void {
  const { workspace } = useCreative();
  const owner = workspace?.person.id;
  const hasOld = (workspace?.person.following.length ?? 0) > 0;
  useEffect(() => {
    if (!owner) return;
    let live = true;
    void (async () => {
      if (hasOld) {
        // Quietly: before the server has the table, the profile list keeps working on its own.
        await fetch("/api/creative", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ verb: "follow.migrate", input: {} }),
        }).catch(() => undefined);
      }
      if (live) await loadFollows(owner);
    })();
    return () => {
      live = false;
    };
  }, [owner, hasOld]);
}

/** The people and makers the viewer follows, from the server and the profile together. */
export function useFollowing(): { ids: string[]; has: (id: string) => boolean; followers: number } {
  const { workspace } = useCreative();
  const shared = useSyncExternalStore(subscribe, () => state);
  const own = shared.owner === workspace?.person.id ? shared : empty;
  const ids = mergeFollowing(own.ids, workspace?.person.following ?? []);
  return { ids, has: (id) => ids.includes(id.toLowerCase()), followers: own.followers };
}

/** A follow or unfollow just went through: the shared list changes at once, and the server's list is read again. */
export function noteFollow(owner: string, id: string, on: boolean): void {
  publish({ ...state, owner, ids: withFollow(state.ids, id, on), loaded: true });
  void loadFollows(owner);
}
