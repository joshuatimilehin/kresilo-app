import { formatRatio, MAX_MARKS, type Art, type Mark, type PathMark, type ShapeMark, type TextMark } from "./contracts";
import { titleFontStacks } from "./layers";

/**
 * Text and shapes on the artwork (issue #53). Pure: building a mark, the CSS it
 * becomes on screen and in the motion export, and the small edits the panel
 * makes. Marks sit above image layers and below the title.
 */
export type MarkKind = "text" | "rectangle" | "ellipse" | "line";

export const markKindLabel: Record<MarkKind, string> = {
  text: "Text",
  rectangle: "Rectangle",
  ellipse: "Ellipse",
  line: "Line",
};

const base = (id: string, name: string) => ({
  id,
  name,
  x: 30,
  y: 40,
  width: 40,
  height: 20,
  rotation: 0,
  opacity: 1,
  visible: true,
});

/** A new mark in the middle of the canvas, named so no two share a name. */
export function newMark(kind: MarkKind, existing: readonly Mark[], id = crypto.randomUUID()): Mark {
  const taken = new Set(existing.map((m) => m.name));
  const label = markKindLabel[kind];
  let n = 1;
  while (taken.has(`${label} ${n}`)) n++;
  const name = `${label} ${n}`;
  if (kind === "text")
    return {
      ...base(id, name),
      kind: "text",
      text: "Your words",
      color: "#fff7e3",
      size: 8,
      font: "sans",
      italic: false,
      weight: 600,
      align: "left",
    };
  return {
    ...base(id, name),
    ...(kind === "line" ? { height: 2 } : {}),
    kind: "shape",
    shape: kind,
    fill: kind === "line" ? "none" : "#c7fe02",
    stroke: kind === "line" ? "#fff7e3" : "#111111",
    strokeWidth: kind === "line" ? 3 : 0,
    radius: kind === "rectangle" ? 8 : 0,
  };
}

export const canAddMark = (art: Art) => (art.marks?.length ?? 0) < MAX_MARKS;

export function addMark(art: Art, kind: MarkKind): Mark[] {
  const marks = art.marks ?? [];
  return canAddMark(art) ? [...marks, newMark(kind, marks)] : marks;
}

const lineHeight = 1.1;
const overlaps = (a: [number, number], b: [number, number]) => a[0] < b[1] && b[0] < a[1];

/**
 * Where a new line of text goes: a band of the canvas (in % of its height)
 * clear of the title, the caption and the text already there. Tries the
 * lower third first, where a poster's supporting line usually sits.
 */
export function textLineSpot(art: Art, height: number): number {
  const ratio = formatRatio[art.format ?? "poster"];
  // Sizes are in hundredths of the canvas width; this turns them into % of its height.
  const tall = (widthUnits: number) => widthUnits * ratio;
  const busy: [number, number][] = [];
  if (art.titleVisible !== false) {
    // Each written line, and the wrapping a long one gets inside the title's 93% width.
    const lines = art.title
      .split("\n")
      .reduce((n, line) => n + Math.max(1, Math.ceil((line.length * art.size * 0.42) / 93)), 0);
    busy.push([art.y, art.y + tall(art.size * lines * 0.85)]);
  }
  const caption = art.caption ?? "SALT FLATS /\nEVENING STUDY";
  if (art.captionVisible !== false && caption.trim())
    busy.push([55, 55 + tall(1.55 * 1.9 * caption.split("\n").length)]);
  for (const m of art.marks ?? []) if (m.visible && m.kind === "text") busy.push([m.y, m.y + m.height]);
  const pad = 2;
  for (const y of [74, 84, 64, 12, 36, 24, 46, 6, 90])
    if (y + height <= 98 && !busy.some((b) => overlaps([y - pad, y + height + pad], b))) return y;
  return Math.min(84, 98 - height);
}

/**
 * Adds a line of text to the artwork, sized for a supporting line and placed
 * clear of the title. Returns the new marks and the new line's id, or null
 * when the artwork already holds as many marks as it can.
 */
export function addTextLine(art: Art, id = crypto.randomUUID()): { marks: Mark[]; id: string } | null {
  const marks = art.marks ?? [];
  if (!canAddMark(art)) return null;
  const size = 5;
  const height = Math.max(4, Math.ceil(size * lineHeight * formatRatio[art.format ?? "poster"] * 1.6));
  const base = newMark("text", marks, id) as TextMark;
  const line: TextMark = {
    ...base,
    x: 6,
    y: textLineSpot(art, height),
    width: 80,
    height,
    size,
    color: /^#[0-9a-f]{6}$/i.test(art.color) ? art.color : base.color,
  };
  return { marks: [...marks, line], id };
}

export const updateMark = (marks: readonly Mark[], id: string, change: Partial<Mark>): Mark[] =>
  marks.map((m) => (m.id === id ? ({ ...m, ...change } as Mark) : m));

export const removeMark = (marks: readonly Mark[], id: string): Mark[] => marks.filter((m) => m.id !== id);

/** Moves a mark up or down in the stack of marks (later draws on top). */
export function moveMark(marks: readonly Mark[], id: string, by: -1 | 1): Mark[] {
  const i = marks.findIndex((m) => m.id === id);
  const j = i + by;
  if (i < 0 || j < 0 || j >= marks.length) return [...marks];
  const out = [...marks];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

export type MarkStyle = Record<string, string | number>;

/**
 * The CSS for a mark. `size` is in hundredths of the canvas width: the screen
 * uses container units (cqw); the 540px motion export uses pixels.
 */
export function markStyle(m: Mark, target: "screen" | "export" = "screen"): MarkStyle {
  const box: MarkStyle = {
    position: "absolute",
    left: `${m.x}%`,
    top: `${m.y}%`,
    width: `${m.width}%`,
    height: `${m.height}%`,
    opacity: m.opacity,
    transform: `rotate(${m.rotation}deg)`,
    boxSizing: "border-box",
  };
  if (m.kind === "text") return { ...box, ...textStyle(m, target) };
  if (m.kind === "path") return { ...box, overflow: "visible", pointerEvents: "none" };
  return { ...box, ...shapeStyle(m) };
}

function textStyle(m: TextMark, target: "screen" | "export"): MarkStyle {
  return {
    color: m.color,
    fontSize: target === "export" ? `${m.size * 5.4}px` : `${m.size}cqw`,
    fontFamily: titleFontStacks[target][m.font],
    fontStyle: m.italic ? "italic" : "normal",
    fontWeight: m.weight,
    textAlign: m.align,
    lineHeight,
    whiteSpace: "pre-line",
    overflowWrap: "anywhere",
  };
}

function shapeStyle(m: ShapeMark): MarkStyle {
  const stroke = m.strokeWidth > 0 ? `${m.strokeWidth}px solid ${m.stroke}` : "none";
  if (m.shape === "line")
    return { height: 0, borderTop: `${Math.max(m.strokeWidth, 1)}px solid ${m.stroke}` };
  return {
    background: m.fill === "none" ? "transparent" : m.fill,
    border: stroke,
    borderRadius: m.shape === "ellipse" ? "50%" : `${m.radius}%`,
  };
}

/** The same style as CSS text, for the motion export's page. */
export function markCss(m: Mark): string {
  return Object.entries(markStyle(m, "export"))
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${v}`)
    .join(";");
}

/** A plain sentence for a list or a screen reader. */
export function describeMark(m: Mark): string {
  if (m.kind === "path") return `Drawing, ${m.strokes.length} stroke${m.strokes.length === 1 ? "" : "s"}`;
  return m.kind === "text" ? `Text “${m.text}”` : `${markKindLabel[m.shape]} shape`;
}

/**
 * A stroke as a smooth SVG path in a 0..100 box: straight to the first
 * midpoint, then quadratic curves through each point to the next midpoint.
 */
export function strokePath(input: readonly (readonly unknown[])[]): string {
  const points = input as unknown as readonly (readonly [number, number])[];
  const r = (v: number) => Math.round(v * 100) / 100;
  if (points.length === 1) return `M${r(points[0][0])} ${r(points[0][1])}l0.01 0`;
  let d = `M${r(points[0][0])} ${r(points[0][1])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    d += `Q${r(x)} ${r(y)} ${r((x + nx) / 2)} ${r((y + ny) / 2)}`;
  }
  const last = points[points.length - 1];
  return `${d}L${r(last[0])} ${r(last[1])}`;
}

/**
 * A drawing as SVG markup for the motion export (540 pixels wide). Every
 * value is a bounded number or a checked colour, so nothing stored becomes markup.
 */
export function drawingSvg(m: PathMark, width = 540): string {
  const paths = m.strokes
    .map(
      (s) =>
        `<path d="${strokePath(s.points)}" stroke="${/^#[0-9a-f]{6}$/i.test(s.color) ? s.color : "#111111"}" stroke-width="${Math.round(s.size * width) / 100}" vector-effect="non-scaling-stroke" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join("");
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" style="overflow:visible">${paths}</svg>`;
}
