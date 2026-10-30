import type { VisualColours, VisualKind } from "./types";

/**
 * How a visual takes colour. Pure maths with no DOM, shared by every place a
 * visual is drawn so that all of them agree:
 *
 *  - the canvas, previews and the motion export use an SVG filter whose
 *    colour matrix is built from these same numbers (`visualFilterMarkup`);
 *  - an event cover, drawn on a canvas, maps pixels with `recolourPixels`.
 *
 * A picture is read by its luminance (Rec. 709 weights, on the stored sRGB
 * values, with no gamma step, which is also what the filter does because it
 * sets `color-interpolation-filters="sRGB"`).
 *
 *  - ink:     the colour is `ink` everywhere; only the alpha varies. Near-white
 *             is fully transparent and near-black fully opaque, with a short
 *             ramp between, so JPEG noise around the white ground disappears.
 *  - duotone: the colour runs from `ink` (black) to `ground` (white).
 *
 * A placed visual with a `ground` is a duotone; without one, it is ink.
 */
export type Rgb = [number, number, number];
/** Red, green, blue (0..255) and alpha (0..255). */
export type Rgba = [number, number, number, number];

export const HEX = /^#[0-9a-f]{6}$/i;

export function parseHex(hex: string): Rgb {
  const h = HEX.test(hex) ? hex.slice(1) : "000000";
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function toHex([r, g, b]: Rgb): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Rec. 709 weights. */
export const LUMA = [0.2126, 0.7152, 0.0722] as const;

/** Luminance of an sRGB colour, 0 (black) to 1 (white). */
export const luminanceOf = ([r, g, b]: Rgb): number => (LUMA[0] * r + LUMA[1] * g + LUMA[2] * b) / 255;

/** At or below this luminance an ink picture is fully opaque, at or above INK_WHITE it is fully clear. */
export const INK_BLACK = 0.18;
export const INK_WHITE = 0.94;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** The opacity (0..1) of one point of an ink picture, from its luminance (0..1). */
export const inkAlpha = (luminance: number): number => clamp01((INK_WHITE - luminance) / (INK_WHITE - INK_BLACK));

/** One point of an ink picture: the ink colour with the alpha its luminance gives. */
export function mapInk(luminance: number, inkHex: string): Rgba {
  const [r, g, b] = parseHex(inkHex);
  return [r, g, b, Math.round(inkAlpha(luminance) * 255)];
}

/** One point of a duotone picture: black takes `inkHex`, white takes `groundHex`, grey blends. */
export function mapDuotone(luminance: number, inkHex: string, groundHex: string): Rgb {
  const t = clamp01(luminance);
  const a = parseHex(inkHex),
    b = parseHex(groundHex);
  return [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as Rgb;
}

/** Which kind a placed visual is: a ground colour makes it a duotone. */
export const kindOfColours = (c: VisualColours): VisualKind => (c.ground ? "duotone" : "ink");

/** Recolours RGBA pixels in place (an ImageData's `data`), for drawing on a canvas. */
export function recolourPixels(data: Uint8ClampedArray, colours: VisualColours): void {
  const ink = parseHex(colours.ink);
  if (colours.ground) {
    const ground = parseHex(colours.ground);
    for (let i = 0; i < data.length; i += 4) {
      const t = clamp01((LUMA[0] * data[i] + LUMA[1] * data[i + 1] + LUMA[2] * data[i + 2]) / 255);
      data[i] = Math.round(ink[0] + (ground[0] - ink[0]) * t);
      data[i + 1] = Math.round(ink[1] + (ground[1] - ink[1]) * t);
      data[i + 2] = Math.round(ink[2] + (ground[2] - ink[2]) * t);
    }
    return;
  }
  for (let i = 0; i < data.length; i += 4) {
    const l = (LUMA[0] * data[i] + LUMA[1] * data[i + 1] + LUMA[2] * data[i + 2]) / 255;
    data[i] = ink[0];
    data[i + 1] = ink[1];
    data[i + 2] = ink[2];
    data[i + 3] = Math.round(inkAlpha(l) * (data[i + 3] / 255) * 255);
  }
}

/** The filter's id for a colour pair, so one definition serves every layer that uses it. */
export function visualFilterId(c: VisualColours): string {
  const ink = c.ink.slice(1).toLowerCase();
  return c.ground ? `kresilo-vis-${ink}-${c.ground.slice(1).toLowerCase()}` : `kresilo-vis-${ink}`;
}

/** Four-decimal numbers without trailing noise. */
const n = (v: number) => String(Math.round(v * 10000) / 10000);

/**
 * The 4x5 colour matrix (row-major, as feColorMatrix takes it) that does what
 * `mapInk` or `mapDuotone` does to every pixel of a grey picture.
 */
export function visualMatrix(c: VisualColours): number[] {
  const ink = parseHex(c.ink).map((v) => v / 255);
  if (c.ground) {
    const ground = parseHex(c.ground).map((v) => v / 255);
    const row = (i: number) => [...LUMA.map((w) => w * (ground[i] - ink[i])), 0, ink[i]];
    return [...row(0), ...row(1), ...row(2), 0, 0, 0, 1, 0];
  }
  const s = 1 / (INK_WHITE - INK_BLACK);
  return [
    0, 0, 0, 0, ink[0],
    0, 0, 0, 0, ink[1],
    0, 0, 0, 0, ink[2],
    ...LUMA.map((w) => -w * s), 0, INK_WHITE * s,
  ];
}

/**
 * One `<filter>` for a colour pair. Built from validated hex only, so nothing stored can become markup.
 * The matrix reads luminance only (transparent pixels count as black), so the result is clipped to the picture's own
 * alpha; otherwise the empty strip an image leaves when it is fitted into its box would come out as solid ink.
 */
export function visualFilterMarkup(c: VisualColours): string {
  if (!HEX.test(c.ink) || (c.ground !== undefined && !HEX.test(c.ground))) return "";
  return `<filter id="${visualFilterId(c)}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${visualMatrix(c).map(n).join(" ")}" result="v"/><feComposite in="v" in2="SourceAlpha" operator="in"/></filter>`;
}

/**
 * The SVG that defines the filters for a set of colour pairs, each once.
 * Static text built from validated hex; the page includes it once, like the
 * grain filters.
 */
export function visualDefsMarkup(pairs: readonly VisualColours[]): string {
  const seen = new Set<string>();
  const filters: string[] = [];
  for (const c of pairs) {
    const id = visualFilterId(c);
    if (seen.has(id)) continue;
    seen.add(id);
    const f = visualFilterMarkup(c);
    if (f) filters.push(f);
  }
  if (!filters.length) return "";
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${filters.join("")}</defs></svg>`;
}

/** WCAG relative luminance of a hex colour, 0..1 (this one is linearised, for contrast). */
export function relativeLuminance(hex: string): number {
  const lin = parseHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** WCAG contrast ratio between two hex colours, 1..21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
