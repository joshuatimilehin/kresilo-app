import { colourName, LINE } from "./kit";
import type { Ctx } from "./screens";
import type { BrandKind } from "./types";

/**
 * Brand-identity sheets: the pages a client is shown. Each is built from the
 * brand name a person types and the project's palette, with the pack's own
 * pictures, words and type.
 */
const M = 7;

const initialsOf = (brand: string) => {
  const w = brand.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] ?? "K").slice(0, 2)).toUpperCase();
};

/** The wordmark lockup: a round logo tile and the brand name. */
const logo = (c: Ctx) => {
  const { s, pack, brand } = c;
  const tb = s.title(brand, M, 6, 88, 12, { lines: 2 });
  const y0 = tb + 4;
  const h = Math.max(10, s.H - 5 - y0);
  s.rect("Clear space", { x: 3, y: 3, w: 94, h: s.H - 6 }, "none", { edge: 1, stroke: s.roles.line });
  const t = s.pic("Logo mark", 0, { x: M, y: y0, w: h, h }, { ink: s.roles.onAccent, ground: s.roles.accent, mask: s.look.radius >= 3 ? "ellipse" : undefined });
  s.text("Tagline", pack.tagline, M + t.w + 5, y0 + 1, 100 - M - t.w - 5 - 8, 2.8, { color: s.roles.muted });
  [1, 2, 3].forEach((i) => {
    const size = Math.max(8, h * 0.3);
    const [ink, ground] = i === 1 ? [s.roles.ground, s.roles.ink] : i === 2 ? [s.roles.ink, s.roles.tint] : [s.roles.onAccent, s.roles.second];
    s.pic(`Logo version ${i}`, 0, { x: 100 - 8 - i * (size + 3), y: s.H - 5 - size, w: size, h: size }, { ink, ground, mask: s.look.radius >= 3 ? "ellipse" : undefined });
  });
};

const palette = (c: Ctx) => {
  const { s, pack, brand } = c;
  const tb = s.title(brand, M, 8, 66, 13, { lines: 2 });
  s.tile("Logo mark", 0, { x: 100 - M - 16, y: 8, w: 16, h: 16 }, { round: true, ink: s.roles.onAccent, ground: s.roles.accent });
  const y0 = Math.max(tb + 6, 30);
  const gap = 3;
  const sh = Math.min(24, (s.H - 6 - y0 - gap * 3) / 4);
  const swatches = [
    { name: "Primary", fill: s.roles.accent, on: s.roles.onAccent },
    { name: "Wash", fill: s.roles.tint, on: s.roles.ink },
    { name: "Ink", fill: s.roles.ink, on: s.roles.ground },
    { name: "Ground", fill: s.roles.ground, on: s.roles.ink },
  ];
  swatches.forEach((sw, i) => {
    const y = y0 + i * (sh + gap);
    s.rect(`${sw.name} swatch`, { x: M, y, w: 86, h: sh }, sw.fill, { radius: s.look.radius * 0.5, edge: i === 3 ? 1 : 0, stroke: s.roles.line });
    s.text(`${sw.name} name`, `${colourName(sw.fill)}\n${sw.fill.toUpperCase()}`, M + 4, y + sh - 2 * 4.2 * LINE - 3, 60, 4.2, { color: sw.on, weight: 700 });
  });
  void pack;
};

const type = (c: Ctx) => {
  const { s, pack, brand } = c;
  const display = s.look.font === "poster" ? "Poster serif" : "Inter";
  s.heading("Specimen", "Aa", M, 5, 60, 40, { color: s.roles.accent });
  s.label("Display name", `${display}\nHeadlines`, 60, 14, 34, 3.6, { color: s.roles.muted });
  s.rule("Rule one", M, 56, 86, s.roles.line, 1);
  const tb = s.title(brand, M, 60, 86, 14, { lines: 2 });
  s.heading("Alphabet", "ABCDEFGHIJKLM\nNOPQRSTUVWXYZ", M, tb + 4, 86, 6.4);
  s.rule("Rule two", M, tb + 4 + 2 * 6.4 * LINE + 4, 86, s.roles.line, 1);
  const py = tb + 4 + 2 * 6.4 * LINE + 8;
  s.label("Text name", "Inter\nBody text", M, py, 30, 3.6, { color: s.roles.muted });
  s.text("Sample", `${pack.tagline}.\n0123456789`, 40, py, 54, 4.4, { weight: 500 });
};

const card = (c: Ctx) => {
  const { s, pack, brand } = c;
  const m = s.measureTitle(brand, 88, 12, { lines: 2 });
  const ty = s.H - 5 - m.h;
  s.title(brand, M, ty, 88, 12, { lines: 2 });
  const ch = Math.min(22.8, ty - 5 - 3);
  const cw = ch * 1.75;
  const y = 5;
  // Front: the logo tile and a panel of the same colour make one card.
  s.pic("Card logo", 0, { x: M, y, w: ch, h: ch }, { ink: s.roles.onAccent, ground: s.roles.accent });
  s.rect("Card front", { x: M + ch, y, w: cw - ch, h: ch }, s.roles.accent);
  s.label("Card front initials", initialsOf(brand), M + ch + 1.5, y + ch - 7, cw - ch - 3, 3.4, { color: s.roles.onAccent, align: "right" });
  // Back.
  const bx = M + cw + 6;
  s.rect("Card back", { x: bx, y, w: cw, h: ch }, s.roles.surface, { edge: 1, stroke: s.roles.line });
  s.heading("Card back name", brand.length > 16 ? brand.slice(0, 15) + "…" : brand, bx + 3, y + 3, cw - 6, 3.6);
  s.rule("Card back rule", bx + 3, y + 9.5, 10, s.roles.accent, 2);
  s.text("Card back tagline", pack.tagline, bx + 3, y + 11.5, cw - 6, 2.4, { color: s.roles.muted });
  if (ch >= 19) s.text("Card back line", pack.line ?? pack.tagline, bx + 3, y + 15.5, cw - 6, 2.4, { color: s.roles.muted });
};

const poster = (c: Ctx) => {
  const { s, pack, brand } = c;
  const headline = pack.headline ?? brand;
  const m = s.measureTitle(headline, 86, 13, { lines: 2 });
  const ph = Math.max(28, Math.min(84, s.H - 7 - 4 - m.h - 13 - 5));
  s.tile("Poster picture", 1, { x: M, y: 7, w: 86, h: ph }, { ink: s.roles.onAccent, ground: s.roles.accent });
  const tb = s.title(headline, M, 7 + ph + 4, 86, 13, { lines: 2 });
  s.rule("Rule", M, tb + 3, 86, s.roles.ink, 2);
  s.label("Brand", brand, M, tb + 6, 44, 3.6);
  s.text("Line", pack.line ?? pack.tagline, 50, tb + 6, 43, 3.6, { color: s.roles.muted, align: "right" });
};

const social = (c: Ctx) => {
  const { s, pack, brand } = c;
  s.pic("Post picture", 2, { x: 46, y: 7, w: 48, h: 48 }, { ink: s.roles.ink, ground: s.roles.tint, mask: "rounded" });
  s.oval("Sticker", { x: M, y: 8, w: 22, h: 22 }, s.roles.accent, { rotation: -8 });
  s.label("Sticker label", "New", M, 16.5, 22, 4.6, { color: s.roles.onAccent, align: "center", rotation: -8 });
  const tb = s.title(pack.headline ?? brand, M, 60, 86, 14, { lines: 2 });
  s.label("Brand", `${brand}  ·  ${pack.line ?? ""}`.trim(), M, Math.min(tb + 3, 90), 86, 3.4);
};

const label = (c: Ctx) => {
  const { s, pack, brand } = c;
  s.rect("Frame", { x: 5, y: 5, w: 90, h: 90 }, "none", { edge: Math.max(2, s.look.edge), stroke: s.roles.ink, radius: s.look.radius });
  const m = s.measureTitle(brand, 76, 13, { lines: 2 });
  const picH = Math.max(0, Math.min(36, 79 - 10 - m.h - 4 - 6));
  const ty = 10 + (picH >= 12 ? picH + 4 : 0);
  if (picH >= 12) s.tile("Label picture", 2, { x: 30, y: 10, w: 40, h: picH }, { ink: s.roles.ink, ground: s.roles.tint });
  const tb = s.title(brand, 12, ty, 76, 13, { lines: 2 });
  if (tb + 7 <= 80) s.text("Product line", pack.line ?? pack.tagline, 12, tb + 2, 76, 3.6, { color: s.roles.muted });
  s.rule("Rule", 12, 82, 76, s.roles.line, 1);
  s.label("Weight", "Net weight 250 g", 12, 85, 50, 2.8, { color: s.roles.muted });
  s.rect("Seal", { x: 76, y: 82, w: 12, h: 8 }, s.roles.accent, { radius: 1.5 });
};

export const BRAND_BUILDERS: Record<BrandKind, (c: Ctx) => void> = { logo, palette, type, card, poster, social, label };
