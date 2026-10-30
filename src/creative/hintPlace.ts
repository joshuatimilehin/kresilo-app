/**
 * Where an icon's name shows: a hover tooltip or a tap balloon. It never sits
 * on another control (the button above it in a toolbox, the version badge, a
 * toolbar) and never leaves the screen. It tries above, then below, then the
 * side with more room, and keeps the first spot that is clear. Pure, so the
 * placement can be tested without a browser.
 */
export type Box = { left: number; top: number; right: number; bottom: number };
export type Spot = { left: number; top: number };

const GAP = 8;
const EDGE = 6;
const hits = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/** A rough size for a one-line name in the 12px label type. */
export const hintSize = (text: string) => ({ width: Math.min(240, Math.round(text.length * 7 + 22)), height: 27 });

export function hintPlace(target: Box, size: { width: number; height: number }, obstacles: readonly Box[], view: { width: number; height: number }): Spot {
  const cx = (target.left + target.right) / 2,
    cy = (target.top + target.bottom) / 2;
  const clampX = (x: number) => Math.min(view.width - EDGE - size.width, Math.max(EDGE, x));
  const clampY = (y: number) => Math.min(view.height - EDGE - size.height, Math.max(EDGE, y));
  const roomLeft = target.left,
    roomRight = view.width - target.right;
  const sides: Spot[] = [
    { left: target.right + GAP, top: clampY(cy - size.height / 2) },
    { left: target.left - GAP - size.width, top: clampY(cy - size.height / 2) },
  ];
  const candidates: Spot[] = [
    { left: clampX(cx - size.width / 2), top: target.top - GAP - size.height },
    { left: clampX(cx - size.width / 2), top: target.bottom + GAP },
    ...(roomRight >= roomLeft ? sides : sides.reverse()),
  ];
  const box = (s: Spot): Box => ({ left: s.left, top: s.top, right: s.left + size.width, bottom: s.top + size.height });
  const inView = (b: Box) => b.left >= EDGE - 0.5 && b.top >= EDGE - 0.5 && b.right <= view.width - EDGE + 0.5 && b.bottom <= view.height - EDGE + 0.5;
  const others = obstacles.filter((o) => !hits(o, target) && o.right > o.left && o.bottom > o.top);
  const clear = candidates.find((s) => {
    const b = box(s);
    return inView(b) && !hits(b, target) && !others.some((o) => hits(b, o));
  });
  if (clear) return clear;
  // Nowhere is fully clear: the spot that covers the least, still on screen.
  const cover = (s: Spot) => others.reduce((n, o) => {
    const b = box(s);
    const w = Math.max(0, Math.min(b.right, o.right) - Math.max(b.left, o.left));
    const h = Math.max(0, Math.min(b.bottom, o.bottom) - Math.max(b.top, o.top));
    return n + w * h;
  }, 0);
  const onScreen = candidates.map((s) => ({ left: clampX(s.left), top: clampY(s.top) })).filter((s) => !hits(box(s), target));
  return (onScreen.length ? onScreen : candidates).reduce((best, s) => (cover(s) < cover(best) ? s : best));
}
