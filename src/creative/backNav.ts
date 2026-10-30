import { useNavigate } from "react-router-dom";

/**
 * Back goes where you came from. The router keeps each history entry's
 * position (`history.state.idx`); this remembers the path at each position in
 * this tab, so a Back control can tell whether the page before is inside the
 * app, and which page it is, before it steps back.
 */
const KEY = "kresilo-trail";
const trail = new Map<number, string>();

function stored(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export const historyIndex = () =>
  typeof window === "undefined" ? 0 : Number((window.history.state as { idx?: number } | null)?.idx ?? 0);

/** Records the path shown at a history position (called on every navigation). */
export function rememberEntry(idx: number, path: string) {
  trail.set(idx, path);
  try {
    const all = stored();
    all[idx] = path;
    sessionStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage can be unavailable; the in-memory trail still works */
  }
}

/** The app path one step back in this tab's history, if that step is inside the app. */
export function entryBefore(idx = historyIndex()): string | undefined {
  if (idx <= 0) return undefined;
  return trail.get(idx - 1) ?? stored()[idx - 1];
}

export type BackPlan = { kind: "history" } | { kind: "go"; to: string; replace: boolean };

const pathOf = (p: string) => p.split(/[?#]/)[0];

/**
 * Where Back goes from here.
 * - `within`: Back always lands on this page (Motion returns to its canvas):
 *   a history step when the page before is it, otherwise it replaces this entry.
 * - otherwise a history step when the page before is inside the app and not
 *   one of `skip` (a finished form, or a page that would loop back here);
 *   with nothing usable before, the parent `fallback`.
 */
export function planBack(
  previous: string | undefined,
  fallback: string,
  opts: { within?: string; skip?: readonly string[] } = {},
): BackPlan {
  if (opts.within) {
    return previous !== undefined && pathOf(previous) === pathOf(opts.within)
      ? { kind: "history" }
      : { kind: "go", to: opts.within, replace: true };
  }
  const skip = ["/create", ...(opts.skip ?? [])];
  if (previous !== undefined && !skip.some((s) => pathOf(previous) === s || pathOf(previous).startsWith(`${s}/`)))
    return { kind: "history" };
  return { kind: "go", to: fallback, replace: false };
}

/**
 * Back to where you came from: a history step when the page before is inside
 * the app, otherwise the parent page. With `within`, Back always lands there
 * (Motion and Preview return to their canvas). See planBack.
 */
export function useBack(fallback: string, opts: { within?: string; skip?: readonly string[] } = {}) {
  const navigate = useNavigate();
  return () => {
    const plan = planBack(entryBefore(), fallback, opts);
    if (plan.kind === "history") navigate(-1);
    else navigate(plan.to, { replace: plan.replace });
  };
}
