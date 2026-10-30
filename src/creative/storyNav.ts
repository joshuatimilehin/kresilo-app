/**
 * How a story (a row of slides) is navigated. Pure, so keyboard, swipe and tap
 * all go through the same rules and are tested without a browser.
 */
export type NavAction = "next" | "prev" | "first" | "last" | "close";

/** What a key does. In a right-to-left page the horizontal arrows swap. */
export function keyAction(key: string, rtl = false): NavAction | null {
  switch (key) {
    case "ArrowRight":
      return rtl ? "prev" : "next";
    case "ArrowLeft":
      return rtl ? "next" : "prev";
    case "ArrowDown":
    case "PageDown":
      return "next";
    case "ArrowUp":
    case "PageUp":
      return "prev";
    case "Home":
      return "first";
    case "End":
      return "last";
    case "Escape":
      return "close";
    default:
      return null;
  }
}

/** Where a story is after an action. Stepping past the last slide stays on it; `close` leaves it. */
export function step(index: number, count: number, action: NavAction): { index: number; close: boolean } {
  const last = Math.max(count - 1, 0);
  switch (action) {
    case "next":
      return { index: Math.min(index + 1, last), close: false };
    case "prev":
      return { index: Math.max(index - 1, 0), close: false };
    case "first":
      return { index: 0, close: false };
    case "last":
      return { index: last, close: false };
    case "close":
      return { index, close: true };
  }
}

const SWIPE_DISTANCE = 48;
const CLOSE_DISTANCE = 110;

/**
 * What a finger drag means. A mostly sideways drag moves between slides (left
 * for next, right for previous; swapped in right-to-left pages); a long
 * downward drag closes. Short or diagonal drags are taps or scrolls: null.
 */
export function swipeAction(dx: number, dy: number, rtl = false): NavAction | null {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax >= SWIPE_DISTANCE && ax > ay * 1.5) {
    const toward = dx < 0 ? "next" : "prev";
    return rtl ? (toward === "next" ? "prev" : "next") : toward;
  }
  if (dy >= CLOSE_DISTANCE && ay > ax * 1.5) return "close";
  return null;
}

/** A tap on the left third goes back, anywhere else goes forward (mirrored in right-to-left pages). */
export function tapAction(x: number, width: number, rtl = false): "next" | "prev" {
  if (width <= 0) return "next";
  const leftZone = x / width < 0.34;
  const back = rtl ? x / width > 0.66 : leftZone;
  return back ? "prev" : "next";
}

/** True for elements that should keep their own keys (typing, buttons, links, selects). */
export function keepsOwnKeys(el: { tagName?: string; isContentEditable?: boolean } | null | undefined): boolean {
  const tag = (el?.tagName ?? "").toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || tag === "button" || tag === "a" || Boolean(el?.isContentEditable);
}
