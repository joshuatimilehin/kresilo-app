import type { CaseStudy } from "./types";

/** Small pure helpers for drawing sample work in SVG: colour, a stable hash and the brand name. */
export const SERIF = '"Kresilo Poster", "Instrument Serif", Georgia, serif';
export const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif';

/** A stable number from text, so a project always draws the same way. */
export function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return Math.abs(h);
}

function channel(v: number) {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
/** Relative luminance of a #rrggbb colour. */
export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
/** Dark or light ink that stays readable on a background (WCAG contrast at least 4.5). */
export function readable(bg: string): "#14110f" | "#fbf8f2" {
  const l = luminance(bg);
  const dark = (l + 0.05) / (luminance("#14110f") + 0.05);
  const light = (luminance("#fbf8f2") + 0.05) / (l + 0.05);
  return dark >= light ? "#14110f" : "#fbf8f2";
}
export const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

/** The brand name a project draws: the client's name, or the title for a self-initiated study. */
export function brandName(p: CaseStudy): string {
  return /^A self-initiated/.test(p.client.what) ? p.title : p.client.name;
}

/** A name sized to fit a width: SVG font size for `chars` letters across `width` units. */
export function fitSize(chars: number, width: number, max: number, factor = 0.55): number {
  return Math.min(max, width / Math.max(chars, 1) / factor);
}

export const initials = (name: string) =>
  name
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");

/** Palette entry by position, wrapping. */
export const pal = (p: { palette: string[] }, i: number) => p.palette[((i % p.palette.length) + p.palette.length) % p.palette.length];
