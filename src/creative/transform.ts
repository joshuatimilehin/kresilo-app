/**
 * Geometry for the canvas handles: resize, rotate and snap. Pure functions so
 * they can be tested without a browser. A box is a layer's position, size and
 * rotation, all in percent of the canvas except rotation (degrees); pointer
 * movements arrive in pixels and the canvas size converts between the two.
 * Limits match the layer schema in `contracts.ts`.
 */
export type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};
export type Canvas = { width: number; height: number };
export type Point = { x: number; y: number };
export type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
export type Guide = { axis: "x" | "y"; at: number };

export const LIMITS = { min: 5, max: 200, position: 100 } as const;
export const SNAP_THRESHOLD = 1.5;
export const handles: Handle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

const SIGN: Record<Handle, [number, number]> = {
  nw: [-1, -1],
  n: [0, -1],
  ne: [1, -1],
  e: [1, 0],
  se: [1, 1],
  s: [0, 1],
  sw: [-1, 1],
  w: [-1, 0],
};
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));
const round = (n: number, places = 2) => {
  const f = 10 ** places;
  return Math.round(n * f) / f + 0; // + 0 turns -0 into 0
};

export function isCorner(handle: Handle) {
  const [sx, sy] = SIGN[handle];
  return sx !== 0 && sy !== 0;
}

/** Centre and size of a box in pixels. */
function px(b: Box, c: Canvas) {
  return {
    cx: ((b.x + b.width / 2) / 100) * c.width,
    cy: ((b.y + b.height / 2) / 100) * c.height,
    w: (b.width / 100) * c.width,
    h: (b.height / 100) * c.height,
  };
}

function fromPx(
  cx: number,
  cy: number,
  w: number,
  h: number,
  rotation: number,
  c: Canvas,
): Box {
  return {
    x: round(clamp(((cx - w / 2) / c.width) * 100, -LIMITS.position, LIMITS.position)),
    y: round(clamp(((cy - h / 2) / c.height) * 100, -LIMITS.position, LIMITS.position)),
    width: round(clamp((w / c.width) * 100, LIMITS.min, LIMITS.max)),
    height: round(clamp((h / c.height) * 100, LIMITS.min, LIMITS.max)),
    rotation,
  };
}

/**
 * Resize by dragging a handle. `delta` is how far the pointer has moved in
 * pixels since the drag began; `start` is the box when it began. The opposite
 * edge or corner stays where it is (even when the layer is rotated), unless
 * `fromCenter` is set. Corner handles keep the aspect ratio when `keepAspect`.
 */
export function resizeBox(
  start: Box,
  handle: Handle,
  delta: Point,
  canvas: Canvas,
  opts: { keepAspect?: boolean; fromCenter?: boolean } = {},
): Box {
  const [sx, sy] = SIGN[handle];
  const { cx, cy, w, h } = px(start, canvas);
  const t = rad(start.rotation);
  const cos = Math.cos(t),
    sin = Math.sin(t);
  // The pointer's movement in the layer's own (rotated) axes.
  const lx = delta.x * cos + delta.y * sin;
  const ly = -delta.x * sin + delta.y * cos;
  const k = opts.fromCenter ? 2 : 1;
  let nw = sx ? w + sx * lx * k : w;
  let nh = sy ? h + sy * ly * k : h;
  const minW = (LIMITS.min / 100) * canvas.width,
    maxW = (LIMITS.max / 100) * canvas.width,
    minH = (LIMITS.min / 100) * canvas.height,
    maxH = (LIMITS.max / 100) * canvas.height;
  if (opts.keepAspect && sx && sy) {
    const fx = nw / w,
      fy = nh / h;
    const f = Math.abs(fx - 1) >= Math.abs(fy - 1) ? fx : fy;
    const fmin = Math.max(minW / w, minH / h),
      fmax = Math.min(maxW / w, maxH / h);
    const scale = clamp(f, fmin, Math.max(fmin, fmax));
    nw = w * scale;
    nh = h * scale;
  } else {
    nw = clamp(nw, minW, maxW);
    nh = clamp(nh, minH, maxH);
  }
  let ncx = cx,
    ncy = cy;
  if (!opts.fromCenter) {
    // Keep the opposite edge fixed: the centre moves by half the size change.
    const ox = (sx * (nw - w)) / 2,
      oy = (sy * (nh - h)) / 2;
    ncx = cx + ox * cos - oy * sin;
    ncy = cy + ox * sin + oy * cos;
  }
  return fromPx(ncx, ncy, nw, nh, start.rotation, canvas);
}

/** Angle of a point around a centre, 0 degrees straight up, clockwise. */
export function angleAround(center: Point, p: Point) {
  return deg(Math.atan2(p.y - center.y, p.x - center.x)) + 90;
}

function wrap(angle: number) {
  let a = ((angle % 360) + 360) % 360;
  if (a > 180) a -= 360;
  return a;
}

const SOFT_ANGLES = [-180, -135, -90, -45, 0, 45, 90, 135, 180];

/**
 * Rotate by dragging the rotation handle. The angle follows the pointer
 * around the layer's centre, starting from where the drag began. It clings to
 * 0, 45, 90 and 135 degrees within three degrees; `snap` (Shift) forces steps
 * of 15 degrees.
 */
export function rotateBox(
  start: Box,
  startPointer: Point,
  pointer: Point,
  canvas: Canvas,
  opts: { snap?: boolean } = {},
): Box {
  const { cx, cy } = px(start, canvas);
  const center = { x: cx, y: cy };
  let r = wrap(
    start.rotation +
      angleAround(center, pointer) -
      angleAround(center, startPointer),
  );
  if (opts.snap) r = Math.round(r / 15) * 15;
  else {
    const near = SOFT_ANGLES.find((a) => Math.abs(r - a) <= 3);
    if (near !== undefined) r = near;
  }
  r = clamp(r, -180, 180);
  return { ...start, rotation: round(r, 1) };
}

/** The axis-aligned box that contains a (possibly rotated) layer, in percent. */
export function bounds(b: Box, c: Canvas) {
  const { cx, cy, w, h } = px(b, c);
  const t = rad(b.rotation),
    cos = Math.abs(Math.cos(t)),
    sin = Math.abs(Math.sin(t));
  const bw = w * cos + h * sin,
    bh = w * sin + h * cos;
  const left = ((cx - bw / 2) / c.width) * 100,
    right = ((cx + bw / 2) / c.width) * 100,
    top = ((cy - bh / 2) / c.height) * 100,
    bottom = ((cy + bh / 2) / c.height) * 100;
  return {
    left,
    right,
    top,
    bottom,
    cx: (left + right) / 2,
    cy: (top + bottom) / 2,
  };
}

function nearest(values: number[], targets: number[], threshold: number) {
  let best: { delta: number; at: number } | null = null;
  for (const v of values)
    for (const t of targets) {
      const d = t - v;
      if (Math.abs(d) <= threshold && (!best || Math.abs(d) < Math.abs(best.delta)))
        best = { delta: d, at: t };
    }
  return best;
}

function targets(others: Box[], canvas: Canvas) {
  const xs = [0, 50, 100],
    ys = [0, 50, 100];
  for (const o of others) {
    const b = bounds(o, canvas);
    xs.push(b.left, b.cx, b.right);
    ys.push(b.top, b.cy, b.bottom);
  }
  return { xs, ys };
}

/**
 * Snap a moving layer so its edges or centre line up with the canvas edges,
 * the canvas centre or another layer. Returns the adjusted box and the guide
 * lines to draw.
 */
export function snapMove(
  box: Box,
  others: Box[],
  canvas: Canvas,
  threshold = SNAP_THRESHOLD,
): { box: Box; guides: Guide[] } {
  const b = bounds(box, canvas);
  const { xs, ys } = targets(others, canvas);
  const sx = nearest([b.left, b.cx, b.right], xs, threshold);
  const sy = nearest([b.top, b.cy, b.bottom], ys, threshold);
  const guides: Guide[] = [];
  if (sx) guides.push({ axis: "x", at: round(sx.at) });
  if (sy) guides.push({ axis: "y", at: round(sy.at) });
  return {
    box: {
      ...box,
      x: round(clamp(box.x + (sx?.delta ?? 0), -LIMITS.position, LIMITS.position)),
      y: round(clamp(box.y + (sy?.delta ?? 0), -LIMITS.position, LIMITS.position)),
    },
    guides,
  };
}

/**
 * Snap the edges a resize is moving to the same targets. Only layers that are
 * not rotated snap while resizing; a rotated layer returns unchanged. With
 * `keepAspect` on a corner, the closer axis snaps and the other follows.
 */
export function snapResize(
  start: Box,
  handle: Handle,
  candidate: Box,
  others: Box[],
  canvas: Canvas,
  opts: { keepAspect?: boolean; fromCenter?: boolean } = {},
  threshold = SNAP_THRESHOLD,
): { box: Box; guides: Guide[] } {
  if (start.rotation !== 0 || opts.fromCenter)
    return { box: candidate, guides: [] };
  const [sx, sy] = SIGN[handle];
  const { xs, ys } = targets(others, canvas);
  const edgeX = sx < 0 ? candidate.x : candidate.x + candidate.width;
  const edgeY = sy < 0 ? candidate.y : candidate.y + candidate.height;
  let hitX = sx ? nearest([edgeX], xs, threshold) : null;
  let hitY = sy ? nearest([edgeY], ys, threshold) : null;
  const corner = sx !== 0 && sy !== 0;
  if (opts.keepAspect && corner && hitX && hitY) {
    if (Math.abs(hitX.delta) <= Math.abs(hitY.delta)) hitY = null;
    else hitX = null;
  }
  let { x, y, width, height } = candidate;
  if (hitX) {
    if (sx < 0) {
      x += hitX.delta;
      width -= hitX.delta;
    } else width += hitX.delta;
  }
  if (hitY) {
    if (sy < 0) {
      y += hitY.delta;
      height -= hitY.delta;
    } else height += hitY.delta;
  }
  if (opts.keepAspect && corner && (hitX || hitY)) {
    // The other dimension follows so the picture keeps its proportions.
    const ratio =
      (start.width * canvas.width) / (start.height * canvas.height);
    if (hitX) {
      const nh = ((width * canvas.width) / ratio / canvas.height);
      if (sy < 0) y = candidate.y + candidate.height - nh;
      height = nh;
    } else {
      const nw = (height * canvas.height * ratio) / canvas.width;
      if (sx < 0) x = candidate.x + candidate.width - nw;
      width = nw;
    }
  }
  const guides: Guide[] = [];
  if (hitX) guides.push({ axis: "x", at: round(hitX.at) });
  if (hitY) guides.push({ axis: "y", at: round(hitY.at) });
  return {
    box: {
      x: round(clamp(x, -LIMITS.position, LIMITS.position)),
      y: round(clamp(y, -LIMITS.position, LIMITS.position)),
      width: round(clamp(width, LIMITS.min, LIMITS.max)),
      height: round(clamp(height, LIMITS.min, LIMITS.max)),
      rotation: candidate.rotation,
    },
    guides,
  };
}

/** A rectangle in canvas pixels. */
export type Rect = { left: number; top: number; right: number; bottom: number };

const inRect = (p: Point, r: Rect) =>
  p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;

/** True when a canvas-pixel point lies inside a (possibly rotated) layer box. */
export function hitsBox(box: Box, point: Point, canvas: Canvas) {
  const { cx, cy, w, h } = px(box, canvas);
  const t = rad(-box.rotation);
  const dx = point.x - cx,
    dy = point.y - cy;
  const lx = dx * Math.cos(t) - dy * Math.sin(t),
    ly = dx * Math.sin(t) + dy * Math.cos(t);
  return Math.abs(lx) <= w / 2 && Math.abs(ly) <= h / 2;
}

/**
 * Decide which layer a press on the canvas means when the title's box lies
 * over image layers. The box is only a convenient target: the title wins when
 * the press lands on its lettering (`onTitleInk`) or when no image is under
 * the point inside its box. Anywhere else in the box the topmost visible image
 * under the point wins. `images` run from bottom to top. Returns "title", an
 * image id, or null.
 */
export function pickLayer(args: {
  point: Point;
  canvas: Canvas;
  titleBox: Rect | null;
  onTitleInk: (point: Point) => boolean;
  images: { id: string; box: Box }[];
}): string | null {
  const { point, canvas, titleBox, onTitleInk, images } = args;
  const inTitle = titleBox !== null && inRect(point, titleBox);
  if (inTitle && onTitleInk(point)) return "title";
  for (let i = images.length - 1; i >= 0; i--)
    if (hitsBox(images[i].box, point, canvas)) return images[i].id;
  return inTitle ? "title" : null;
}

export type HandleSpot = { left: number; top: number };

const FRACTION: Record<Handle, [number, number]> = {
  nw: [0, 0],
  n: [0.5, 0],
  ne: [1, 0],
  e: [1, 0.5],
  se: [1, 1],
  s: [0.5, 1],
  sw: [0, 1],
  w: [0, 0.5],
};

/**
 * Where to draw each handle, in percent of the layer's own box, so that none
 * is drawn outside the canvas. A layer that reaches past an edge keeps its
 * stored geometry; only the handle's picture slides back inside, `inset`
 * pixels from the edge. The rotate handle sits `rotateOffset` pixels above the
 * top edge; `rotateMoved` says whether it had to leave that place.
 */
export function visibleHandleSpots(
  box: Box,
  canvas: Canvas,
  inset: number,
  rotateOffset: number,
) {
  const { cx, cy, w, h } = px(box, canvas);
  const t = rad(box.rotation),
    cos = Math.cos(t),
    sin = Math.sin(t);
  const lo = (size: number) => Math.min(inset, size / 2);
  const place = (lx: number, ly: number): HandleSpot & { moved: boolean } => {
    // layer-local pixel offset from the centre to world pixel position
    const wx = cx + lx * cos - ly * sin,
      wy = cy + lx * sin + ly * cos;
    const sx = clamp(wx, lo(canvas.width), canvas.width - lo(canvas.width)),
      sy = clamp(wy, lo(canvas.height), canvas.height - lo(canvas.height));
    const dx = sx - cx,
      dy = sy - cy;
    const bx = dx * cos + dy * sin,
      by = -dx * sin + dy * cos;
    return {
      left: round(((bx + w / 2) / w) * 100, 3),
      top: round(((by + h / 2) / h) * 100, 3),
      moved: sx !== wx || sy !== wy,
    };
  };
  const spots = {} as Record<Handle, HandleSpot>;
  for (const hd of handles) {
    const [fx, fy] = FRACTION[hd];
    const { left, top } = place((fx - 0.5) * w, (fy - 0.5) * h);
    spots[hd] = { left, top };
  }
  const r = place(0, -h / 2 - rotateOffset);
  return {
    spots,
    rotate: { left: r.left, top: r.top },
    rotateMoved: r.moved,
  };
}

/**
 * A point on the canvas (client pixels) in a layer's own space, 0 to 100 on
 * each axis, undoing the layer's turn and flips. Used to paint brush masks.
 */
export function toLayerPoint(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  l: { x: number; y: number; width: number; height: number; rotation?: number; flipX?: boolean; flipY?: boolean },
): [number, number] {
  const cx = l.x + l.width / 2,
    cy = l.y + l.height / 2;
  const dx = ((clientX - rect.left) / rect.width) * 100 - cx,
    dy = ((clientY - rect.top) / rect.height) * 100 - cy;
  const dxPx = (dx * rect.width) / 100,
    dyPx = (dy * rect.height) / 100;
  const t = ((l.rotation ?? 0) * Math.PI) / 180;
  const rx = dxPx * Math.cos(t) + dyPx * Math.sin(t),
    ry = -dxPx * Math.sin(t) + dyPx * Math.cos(t);
  const w = (l.width * rect.width) / 100,
    h = (l.height * rect.height) / 100;
  let x = ((rx + w / 2) / w) * 100,
    y = ((ry + h / 2) / h) * 100;
  if (l.flipX) x = 100 - x;
  if (l.flipY) y = 100 - y;
  const clamp = (v: number) => Math.round(Math.min(100, Math.max(0, v)) * 10) / 10;
  return [clamp(x), clamp(y)];
}

/** Keeps a stroke to at most `max` points by dropping evenly, always keeping both ends. */
export function thinStroke(points: readonly [number, number][], max = 200): [number, number][] {
  if (points.length <= max) return [...points];
  const step = (points.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => points[Math.round(i * step)]);
}
