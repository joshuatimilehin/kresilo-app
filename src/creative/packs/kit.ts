import { formatRatio, type ArtFormat, type ImageLayer, type Mark, type ShapeMark, type TextMark } from "../contracts";
import { tones } from "../portfolio/tones";
import type { LayoutArt } from "../portfolio/layouts";
import { contrastRatio, parseHex, toHex } from "../visuals/colour";
import type { Look, Pack } from "./types";

/**
 * The small toolkit pack layouts are drawn with. A layout is built on a
 * `Sheet` in units of the canvas width (1u is 1% of its width, so a phone is
 * 100u by 177.8u and a desktop 100u by 56.25u), in colours that are roles of
 * the project's palette, so the same layout recolours. The canvas holds 12
 * text and shape layers and 12 pictures; the sheet refuses a 13th.
 *
 * Text and shapes always sit above pictures, so a picture that needs a card
 * behind it is a tile (a picture with a ground colour) and a card that holds
 * a picture is an outline.
 */
export const MAX_MARKS = 12;
export const MAX_LAYERS = 12;

export function mix(a: string, b: string, t: number): string {
  const x = parseHex(a),
    y = parseHex(b);
  return toHex([0, 1, 2].map((i) => Math.round(x[i] + (y[i] - x[i]) * t)) as [number, number, number]);
}

export type Roles = {
  ground: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  /** A pale wash of the accent, for tiles. */
  tint: string;
  /** Text on the accent. */
  onAccent: string;
  /** A second colour from the palette, for small touches. */
  second: string;
};

const readable = (bg: string, dark: string, light: string) => (contrastRatio(bg, dark) >= contrastRatio(bg, light) ? dark : light);

/** The colours a layout uses, as roles of a four-colour palette. */
export function rolesOf(palette: readonly string[], look: Pick<Look, "ground">): Roles {
  const t = tones(palette);
  if (look.ground === "dark") {
    const accent = t.a;
    return { ground: t.dark, surface: mix(t.dark, t.light, 0.1), ink: t.light, muted: mix(t.dark, t.light, 0.62), line: mix(t.dark, t.light, 0.22), accent, tint: mix(t.dark, accent, 0.28), onAccent: readable(accent, t.dark, t.light), second: t.b };
  }
  if (look.ground === "accent") {
    const ground = t.a;
    const ink = readable(ground, t.dark, t.light);
    const accent = t.b;
    return { ground, surface: t.light, ink, muted: mix(ground, ink, 0.6), line: ink, accent, tint: mix(ground, t.light, 0.35), onAccent: readable(accent, t.dark, t.light), second: t.light };
  }
  const accent = t.a;
  return { ground: t.light, surface: mix(t.light, t.dark, 0.07), ink: t.dark, muted: mix(t.light, t.dark, 0.56), line: mix(t.light, t.dark, 0.18), accent, tint: mix(t.light, accent, 0.2), onAccent: readable(accent, t.dark, t.light), second: t.b };
}

/** A plain name for a colour, from its hue, lightness and strength. */
export function colourName(hex: string): string {
  const [r, g, b] = parseHex(hex).map((v) => v / 255);
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (l < 0.13) return "Near black";
  if (l > 0.94) return "Paper white";
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  if (s < 0.12) return l < 0.35 ? "Charcoal" : l < 0.7 ? "Stone" : "Pale grey";
  const hue = h < 15 || h >= 345 ? "red" : h < 40 ? "orange" : h < 62 ? "amber" : h < 75 ? "yellow" : h < 160 ? "green" : h < 195 ? "teal" : h < 255 ? "blue" : h < 290 ? "violet" : "pink";
  const prefix = l < 0.28 ? "Deep " : l > 0.8 ? "Pale " : "";
  return prefix ? `${prefix}${hue}` : `${hue[0].toUpperCase()}${hue.slice(1)}`;
}

/** Roughly how wide a character is, as a share of the type size. */
function charWidth(font: Look["font"], weight: number, caps: boolean): number {
  const w = font === "poster" ? 0.44 : 0.49 + Math.max(0, weight - 400) * 0.00012;
  return w * (caps ? 1.15 : 1);
}

export const LINE = 1.12;

/** Breaks text at spaces into lines of at most `max` characters; words longer than that stay whole. */
export function wrap(text: string, max: number, maxLines = 3): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (let word of para.split(/\s+/).filter(Boolean)) {
      while (word.length > max && max > 3) {
        if (line) out.push(line);
        out.push(`${word.slice(0, max - 1)}-`);
        line = "";
        word = word.slice(max - 1);
      }
      if (line && (line + " " + word).length > max) {
        out.push(line);
        line = word;
      } else line = line ? line + " " + word : word;
    }
    out.push(line);
  }
  return out.slice(0, maxLines);
}

export const clip = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, Math.max(1, max - 1)).trimEnd()}…`);

export type Box = { x: number; y: number; w: number; h: number };
type TextOpts = { color?: string; weight?: number; align?: TextMark["align"]; font?: Look["font"]; italic?: boolean; caps?: boolean; opacity?: number; rotation?: number };
type ShapeOpts = { stroke?: string; edge?: number; radius?: number; opacity?: number; rotation?: number };
type PicOpts = { ink: string; ground?: string; mask?: "ellipse" | "rounded" };

const ASPECT = { s: 1, p: 3 / 4, l: 4 / 3 } as const;
const r1 = (n: number) => Math.round(n * 10) / 10;
const id = () => crypto.randomUUID();

export class Sheet {
  readonly ratio: number;
  readonly H: number;
  readonly roles: Roles;
  marks: Mark[] = [];
  layers: ImageLayer[] = [];
  private head: { text: string; x: number; y: number; size: number; color: string; align: "left" } | null = null;

  constructor(
    readonly format: ArtFormat,
    readonly pack: Pack,
    palette: readonly string[],
  ) {
    this.ratio = formatRatio[format];
    this.H = 100 / this.ratio;
    this.look = pack.look;
    this.roles = rolesOf(palette, pack.look);
  }
  readonly look: Look;

  /** Marks still free. */
  room = () => MAX_MARKS - this.marks.length;

  private place(x: number, y: number, w: number, h: number) {
    return { x: r1(x), y: r1(y * this.ratio), width: r1(Math.max(2, w)), height: r1(Math.max(2, h * this.ratio)) };
  }
  private push(m: Mark) {
    if (this.marks.length >= MAX_MARKS) throw new Error(`${this.pack.id}: more than ${MAX_MARKS} text and shape layers`);
    this.marks.push(m);
  }

  /** A rectangle; `edge` is the outline in pixels, `radius` the corner in units. */
  rect(name: string, b: Box, fill: string, o: ShapeOpts = {}): void {
    const edge = o.edge ?? 0;
    const r = o.radius ?? 0;
    const pct = r ? Math.min(50, (r / b.h) * 100, 1400 / b.w) : 0;
    const m: ShapeMark = { id: id(), name, kind: "shape", shape: "rectangle", ...this.place(b.x, b.y, b.w, b.h), rotation: o.rotation ?? 0, opacity: o.opacity ?? 1, visible: true, fill, stroke: o.stroke ?? (fill === "none" ? this.roles.ink : fill), strokeWidth: edge, radius: r1(pct) };
    this.push(m);
  }
  oval(name: string, b: Box, fill: string, o: ShapeOpts = {}): void {
    this.push({ id: id(), name, kind: "shape", shape: "ellipse", ...this.place(b.x, b.y, b.w, b.h), rotation: o.rotation ?? 0, opacity: o.opacity ?? 1, visible: true, fill, stroke: o.stroke ?? (fill === "none" ? this.roles.ink : fill), strokeWidth: o.edge ?? 0, radius: 0 });
  }
  /** A straight line; `weight` is its thickness in pixels. */
  rule(name: string, x: number, y: number, w: number, color: string, weight = 1): void {
    this.push({ id: id(), name, kind: "shape", shape: "line", ...this.place(x, y, w, 0), rotation: 0, opacity: 1, visible: true, fill: "none", stroke: color, strokeWidth: weight, radius: 0 });
  }

  /** Characters that fit a width at a size. */
  fit(w: number, size: number, o: { weight?: number; font?: Look["font"]; caps?: boolean } = {}): number {
    return Math.max(1, Math.floor(w / (size * charWidth(o.font ?? "sans", o.weight ?? 500, o.caps ?? false))));
  }

  /** A text mark; returns the bottom of its box. Text wider than the box is cut. */
  text(name: string, value: string, x: number, y: number, w: number, sizeWanted: number, o: TextOpts = {}): number {
    const size = Math.max(2, sizeWanted);
    const font = o.font ?? "sans";
    const weight = o.weight ?? 500;
    const caps = o.caps ?? false;
    const max = this.fit(w, size, { weight, font, caps });
    const lines = value.split("\n").map((l) => clip(l, max));
    const shown = caps ? lines.map((l) => l.toUpperCase()) : lines;
    const h = Math.max(2 / this.ratio, shown.length * size * LINE);
    this.push({ id: id(), name, kind: "text", text: shown.join("\n").slice(0, 80), ...this.place(x, y, w, h), rotation: o.rotation ?? 0, opacity: o.opacity ?? 1, visible: true, color: o.color ?? this.roles.ink, size, font, italic: o.italic ?? false, weight, align: o.align ?? "left" });
    return y + h;
  }

  /** A text mark in the pack's heading type. */
  heading(name: string, value: string, x: number, y: number, w: number, size: number, o: TextOpts = {}): number {
    return this.text(name, value, x, y, w, size, { font: this.look.font, weight: this.look.weight, italic: this.look.italic, ...o });
  }

  /** A label in the pack's small type: capitals when the pack sets them so. */
  label(name: string, value: string, x: number, y: number, w: number, size: number, o: TextOpts = {}): number {
    return this.text(name, value, x, y, w, size, { weight: 700, caps: this.look.caps, ...o });
  }

  /** A button: a filled box with centred words, and a hard shadow when the pack has one and there is room. */
  button(name: string, label: string, b: Box, o: { outline?: boolean } = {}): void {
    const { roles, look } = this;
    const solid = !o.outline;
    if (look.shadow && this.room() >= 3) this.rect(`${name} shadow`, { x: b.x + 1.2, y: b.y + 1.2, w: b.w, h: b.h }, roles.ink, { radius: look.radius });
    this.rect(name, b, solid ? roles.accent : "none", { radius: look.radius, edge: solid ? look.edge : Math.max(1.5, look.edge), stroke: solid ? roles.ink : roles.ink });
    const size = Math.min(4.4, b.h * 0.42);
    this.label(`${name} label`, label, b.x, b.y + (b.h - size * LINE) / 2, b.w, size, { color: solid ? roles.onAccent : roles.ink, align: "center" });
  }

  /**
   * A picture, fitted inside the box keeping its shape and centred; returns
   * where it landed. With `ground` it is a tile: the picture on a block of
   * that colour. `index` picks from the pack's pictures.
   */
  pic(name: string, index: number, b: Box, c: PicOpts): Box {
    if (this.layers.length >= MAX_LAYERS) throw new Error(`${this.pack.id}: more than ${MAX_LAYERS} pictures`);
    const n = this.pack.pictures.length;
    const i = ((index % n) + n) % n;
    const aspect = ASPECT[this.pack.shapes[i] ?? "s"];
    let w = b.w;
    let h = w / aspect;
    if (h > b.h) {
      h = b.h;
      w = h * aspect;
    }
    // A layer is never smaller than 5% of the canvas either way.
    const grow = Math.max(1, 5.1 / w, 5.1 / (h * this.ratio));
    w *= grow;
    h *= grow;
    const at = { x: b.x + (b.w - w) / 2, y: b.y + (b.h - h) / 2, w, h };
    const p = this.place(at.x, at.y, w, h);
    this.layers.push({
      id: id(),
      name: name.slice(0, 150),
      role: "subject",
      asset: "dusk-study",
      visual: { id: this.pack.pictures[i], ink: c.ink, ...(c.ground ? { ground: c.ground } : {}) },
      ...p,
      opacity: 1,
      rotation: 0,
      visible: true,
      filter: "none",
      ...(c.mask ? { mask: { shape: c.mask, feather: 0, invert: false } } : {}),
    } as ImageLayer);
    return at;
  }

  /** A picture tile in the pack's corner style, on a wash of the accent. */
  tile(name: string, index: number, b: Box, o: { round?: boolean; ink?: string; ground?: string } = {}): Box {
    const { roles, look } = this;
    const ground = o.ground ?? roles.tint;
    const inkOn = o.ink ?? (contrastRatio(roles.accent, ground) >= 3 ? roles.accent : roles.ink);
    const mask = o.round ? "ellipse" : look.radius >= 3 ? "rounded" : undefined;
    return this.pic(name, index, b, { ink: inkOn, ground, ...(mask ? { mask } : {}) });
  }

  /** How a title would be set: its lines, size and height, without placing it. */
  measureTitle(value: string, w: number, max: number, o: { caps?: boolean; lines?: number } = {}) {
    const { look } = this;
    const clean = value.trim() || "Kresilo";
    const fitAt = (size: number) => this.fit(w, size, { weight: look.weight, font: look.font, caps: o.caps });
    let size = max;
    let lines = wrap(clean, fitAt(size), 9);
    while (size > 12 && lines.length > (o.lines ?? 3)) {
      size -= 1;
      lines = wrap(clean, fitAt(size), 9);
    }
    lines = lines.slice(0, 4);
    return { lines, size, h: lines.length * size * 0.95 };
  }

  /**
   * The words that lead the canvas: the Art's title (12 to 45 wide), wrapped to
   * the width given and sized down to fit, but no smaller than 12. Returns the
   * bottom of the title.
   */
  title(value: string, x: number, y: number, w: number, max: number, o: { color?: string; caps?: boolean; lines?: number } = {}): number {
    const m = this.measureTitle(value, w, max, o);
    const text = (o.caps ? m.lines.map((l) => l.toUpperCase()) : m.lines).join("\n");
    this.head = { text, x: r1(x), y: r1(y * this.ratio), size: m.size, color: o.color ?? this.roles.ink, align: "left" };
    return y + m.h;
  }

  /** The finished layout, as the artwork a project starts from. */
  finish(): LayoutArt {
    const h = this.head ?? { text: this.pack.title, x: 6, y: 6, size: 12, color: this.roles.ink, align: "left" as const };
    return {
      asset: "plain-paper",
      backgroundFilter: "none",
      backgroundOpacity: 0,
      captionVisible: false,
      canvasColor: this.roles.ground,
      format: this.format,
      title: h.text,
      titleVisible: true,
      titleType: { font: this.look.font, italic: this.look.italic, weight: this.look.weight, align: "left", lineHeight: 0.95, tracking: this.look.font === "sans" ? -2 : -1 },
      color: h.color,
      size: h.size,
      x: Math.min(65, Math.max(0, h.x)),
      y: Math.min(80, Math.max(0, h.y)),
      marks: this.marks,
      layers: this.layers,
    };
  }
}
