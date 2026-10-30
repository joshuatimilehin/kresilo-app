/**
 * Toasts never sit on a control. They rise from the bottom centre (full width
 * on a phone), lifted above anything resting on the bottom edge in their lane:
 * the assistant, a tool sheet, Studio's bottom bar and its result line under
 * the canvas (which the canvas sizing keeps on screen), the phone navigation. If
 * that would push them into the header, they drop in from the top instead.
 */
export type Obstacle = { top: number; bottom: number; left: number; right: number };
export type ToastPlace = { side: "bottom"; lift: number } | { side: "top" };

/** What a toast keeps clear of. */
export const TOAST_AVOID = ".sx-ai, .sx-sheet, .sx-toolbox, .sx-workspace > .sx-result, .mobile-navigation, [data-toast-avoid]";
/** Sonner's phone layout (full width) starts at this width and below. */
export const TOAST_PHONE = 600;
const TOAST_WIDTH = 356;
const TOAST_HEIGHT = 64;
const GAP = 12;
/** Something counts as resting on the bottom edge when it ends this close to it. */
const RESTING = 140;
/** Keep toasts out of the header. */
const HEADER = 120;

export function toastPlace(obstacles: readonly Obstacle[], view: { width: number; height: number }): ToastPlace {
  const phone = view.width <= TOAST_PHONE;
  const lane = phone
    ? { left: 0, right: view.width }
    : { left: (view.width - TOAST_WIDTH) / 2 - GAP, right: (view.width + TOAST_WIDTH) / 2 + GAP };
  const resting = obstacles.filter(
    (o) =>
      o.bottom > o.top &&
      o.right > lane.left &&
      o.left < lane.right &&
      o.bottom >= view.height - RESTING &&
      o.top < view.height,
  );
  if (!resting.length) return { side: "bottom", lift: 0 };
  const lift = Math.round(view.height - Math.min(...resting.map((o) => o.top)) + GAP);
  if (view.height - lift - TOAST_HEIGHT < HEADER) return { side: "top" };
  return { side: "bottom", lift };
}

export const samePlace = (a: ToastPlace, b: ToastPlace) =>
  a.side === b.side && (a.side === "top" || (b.side === "bottom" && a.lift === b.lift));
