import type { Art, AssetKey, ImageLayer, Mark, ShapeMark, TextMark } from "../contracts";
import type { StartChoice } from "./useInStudio";

/**
 * Templates that open as a finished, editable layout: every block, word and
 * photo is its own text, shape or image layer, so a person changes any of it
 * in Studio. The canvas is 3:4; x and width are percent of its width, y and
 * height percent of its height, and text size is percent of its width.
 *
 * The layouts are Kresilo's own, in the template's colours. The portraits are
 * AI-generated images (they carry the sparkle); the paper is a plain scan-like
 * sheet made in code.
 */
export type LayoutArt = Pick<
  Art,
  "asset" | "backgroundFilter" | "backgroundOpacity" | "title" | "titleVisible" | "titleType" | "color" | "size" | "x" | "y" | "captionVisible" | "marks" | "layers" | "format" | "canvasColor"
>;

export { tones } from "./tones";
import { tones } from "./tones";
import { packById, packs } from "../packs/data";
import { layoutName, packLayout } from "../packs/layouts";

const id = () => crypto.randomUUID();
const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height, rotation: 0, opacity: 1, visible: true });

function text(name: string, value: string, at: [number, number, number, number], o: Partial<TextMark> & { color: string; size: number }): TextMark {
  return { id: id(), name, kind: "text", text: value, ...box(...at), font: "sans", italic: false, weight: 700, align: "left", ...o };
}

function shape(name: string, kind: ShapeMark["shape"], at: [number, number, number, number], fill: string, o: Partial<ShapeMark> = {}): ShapeMark {
  return { id: id(), name, kind: "shape", shape: kind, ...box(...at), fill, stroke: fill === "none" ? "#111111" : fill, strokeWidth: 0, radius: 0, ...o };
}

function photo(name: string, asset: AssetKey, at: [number, number, number, number], o: Partial<ImageLayer> = {}): ImageLayer {
  return { id: id(), name, role: "subject", asset, ...box(...at), filter: "grayscale", ...o } as ImageLayer;
}

/** A circle on the 3:4 canvas: its height is three quarters of its width. */
const circle = (x: number, y: number, w: number): [number, number, number, number] => [x, y, w, w * 0.75];

/** Up to two capital letters from the brand: "Harbour & Co." gives "HC". */
export function initialsOf(brand: string): string {
  const words = brand.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "K").slice(0, 2)).toUpperCase();
}

const titleFor = (brand: string, max: number, min = 12) => Math.max(min, Math.min(max, Math.round(150 / Math.max(1, brand.length))));

const sansTitle = { font: "sans", italic: false, weight: 800, align: "left", lineHeight: 0.9, tracking: -3 } as const;

function story(choice: StartChoice, variant: number): LayoutArt {
  const t = tones(choice.palette);
  const brand = choice.brand.slice(0, 40);
  const ini = initialsOf(brand);
  const paper = { asset: "plain-paper" as const, backgroundFilter: "none" as const, backgroundOpacity: 1, captionVisible: false };
  const badge = (x: number, y: number) => [
    shape("Issue badge", "rectangle", [x, y, 18, 6], "none", { stroke: t.dark, strokeWidth: 2 }),
    text("Issue number", "ISSUE\n01", [x + 2, y + 0.8, 14, 5], { color: t.dark, size: 2.4, weight: 800, align: "center" }),
  ];
  if (variant === 1)
    return {
      ...paper,
      title: brand,
      titleVisible: true,
      titleType: sansTitle,
      color: t.dark,
      size: titleFor(brand, 14),
      x: 8,
      y: 70,
      layers: [photo("Sunglasses portrait", "portrait-shades", circle(14, 14, 72), { blend: "multiply", mask: { shape: "ellipse", feather: 1, invert: false } })],
      marks: [
        shape("Colour circle", "ellipse", circle(14, 14, 72), t.a, { opacity: 0.5 }),
        shape("Small circle", "ellipse", circle(84, 6, 10), t.a),
        shape("Corner circle", "ellipse", circle(-8, 88, 20), t.a),
        text("Initials", `${ini}.`, [8, 82, 40, 10], { color: t.dark, size: 14, weight: 900 }),
        text("Headline", "A START GUIDE\nFOR NEW MAKERS", [52, 84, 42, 8], { color: t.dark, size: 3, weight: 800 }),
        shape("Button", "rectangle", [52, 92, 30, 4.5], t.dark, { radius: 0 }),
        text("Button label", "LET’S START", [52, 92.8, 30, 3.5], { color: t.light, size: 2.3, weight: 800, align: "center" }),
        ...badge(8, 4),
        text("Arrow", "→", [86, 92, 10, 5], { color: t.dark, size: 6, weight: 400 }),
      ],
    };
  if (variant === 2)
    return {
      ...paper,
      title: brand,
      titleVisible: true,
      titleType: sansTitle,
      color: t.dark,
      size: titleFor(brand, 13),
      x: 6,
      y: 5,
      layers: [photo("Sunglasses portrait", "portrait-shades", [4, 24, 90, 76], { blend: "multiply", flipX: true })],
      marks: [
        shape("Colour band", "rectangle", [58, 0, 42, 100], t.a, { opacity: 0.82 }),
        text("Side initials", ini, [62, 20, 34, 30], { color: t.light, size: 30, weight: 900, rotation: 90, align: "center" }),
        text("Side line", `${brand.toUpperCase()} · SEASON ONE`, [40, 58, 80, 4], { color: t.light, size: 2.2, weight: 700, rotation: 90, align: "center" }),
        shape("Headline block", "rectangle", [4, 77, 40, 17], t.dark),
        text("Headline", "BECOME\nA PRO\nDESIGNER", [6, 78, 36, 14], { color: t.light, size: 5, weight: 900 }),
        text("Arrow", "↑", [66, 86, 10, 6], { color: t.light, size: 7, weight: 400 }),
        ...badge(6, 15),
        shape("Pop dot", "ellipse", circle(44, 18, 8), t.b),
      ],
    };
  return {
    ...paper,
    title: brand,
    titleVisible: true,
    titleType: sansTitle,
    color: t.dark,
    size: titleFor(brand, 13),
    x: 6,
    y: 80,
    layers: [photo("Leaping designer portrait", "portrait-leap", [4, 18, 92, 64], { blend: "multiply" })],
    marks: [
      text("Big letters", ini, [10, 22, 80, 56], { color: t.a, size: 40, weight: 900, align: "center", opacity: 0.78 }),
      text("Headline", "START GUIDE FOR\nNEW DESIGNERS", [14, 7, 72, 8], { color: t.dark, size: 4.2, weight: 800, align: "center" }),
      shape("Rule", "line", [38, 15.5, 24, 2], "none", { stroke: t.dark, strokeWidth: 2 }),
      shape("Right circle", "ellipse", circle(84, 28, 26), t.a),
      shape("Left circle", "ellipse", circle(-10, 72, 24), t.a),
      text("Side text", "BECOME A PRO DESIGNER", [-14, 52, 40, 4], { color: t.dark, size: 2.4, weight: 800, rotation: -90, align: "center" }),
      shape("Button", "rectangle", [56, 89, 36, 5], t.dark),
      text("Button label", "LET’S START", [56, 89.9, 36, 3.5], { color: t.light, size: 2.6, weight: 800, align: "center" }),
      ...badge(76, 4),
      text("Pop line", "EDITION 2026", [62, 20, 32, 3], { color: t.dark, size: 2.4, weight: 800, align: "right" }),
    ],
  };
}

function landing(choice: StartChoice): LayoutArt {
  const t = tones(choice.palette);
  const brand = choice.brand.slice(0, 40);
  const chip = (name: string, label: string, x: number, y: number, w: number) => [
    shape(`${name} chip`, "rectangle", [x, y, w, 5.5], t.light),
    text(`${name} label`, label, [x, y + 1.2, w, 4], { color: t.dark, size: 2.8, weight: 800, align: "center" }),
  ];
  return {
    asset: "plain-paper",
    backgroundFilter: "none",
    backgroundOpacity: 1,
    captionVisible: false,
    title: "Come as\nyou are.",
    titleVisible: true,
    titleType: { font: "poster", italic: true, weight: 400, align: "left", lineHeight: 0.85, tracking: -3 },
    color: t.dark,
    size: 15,
    x: 6,
    y: 14,
    layers: [
      photo("Leaf pattern oval", "garden-grid", [64, 11, 28, 37], { filter: "none", mask: { shape: "ellipse", feather: 1, invert: false } }),
      photo("Sunglasses portrait", "portrait-shades", [50, 50, 44, 23]),
      photo("Leaping designer portrait", "portrait-leap", [6, 73, 44, 23]),
    ],
    marks: [
      shape("Logo", "ellipse", circle(6, 3.4, 5), t.dark),
      text("Brand name", brand, [13, 3.5, 40, 4], { color: t.dark, size: 3, weight: 800 }),
      text("Menu", "WORK   PEOPLE   NOTES", [44, 4, 50, 3], { color: t.dark, size: 2.2, weight: 700, align: "right" }),
      text("Intro", "Small studios, real people,\nwork that feels like home.", [6, 38, 52, 8], { color: t.dark, size: 3, weight: 500 }),
      shape("Play button", "ellipse", circle(70, 41, 14), t.b),
      text("Play", "▶", [70, 43.2, 14, 6], { color: t.light, size: 4.5, weight: 400, align: "center" }),
      shape("Talk tile", "rectangle", [6, 50, 44, 23], t.a),
      ...chip("Talk", "TALK TO US", 10, 58.7, 36),
      shape("Join tile", "rectangle", [50, 73, 44, 23], t.dark),
      ...chip("Join", "MAKE WITH US", 54, 81.7, 36),
    ],
  };
}

function eventPost(choice: StartChoice, variant: number): LayoutArt {
  const t0 = tones(choice.palette);
  const t = variant === 2 ? { ...t0, a: t0.b, b: t0.a } : t0;
  const brand = choice.brand.slice(0, 40);
  const marks: Mark[] = [
    shape("Background", "rectangle", [0, 0, 100, 100], t.dark),
    shape("Arc", "ellipse", [-20, -20, 66, 50], t.b),
    shape("Light cell", "rectangle", [50, 0, 50, 33.4], t.light),
    shape("Dot", "ellipse", circle(64, 7, 22), t.a),
    shape("Sun cell", "rectangle", [0, 66.6, 50, 33.4], t.a),
    shape("Sun", "ellipse", circle(12, 74, 26), t.light),
    shape("Stripe 1", "line", [55, 74, 40, 2], "none", { stroke: t.light, strokeWidth: 5 }),
    shape("Stripe 2", "line", [55, 82, 40, 2], "none", { stroke: t.light, strokeWidth: 5 }),
    shape("Stripe 3", "line", [55, 90, 40, 2], "none", { stroke: t.light, strokeWidth: 5 }),
    text("When and where", "LIVE TALK · 14 NOV · 18:00", [6, 36, 60, 3], { color: t.light, size: 2.6, weight: 700 }),
    shape("Seat button", "rectangle", [54, 54, 38, 6], t.b, { radius: 50 }),
    text("Seat label", "SAVE A SEAT", [54, 55.4, 38, 4], { color: t.dark, size: 2.8, weight: 800, align: "center" }),
  ];
  const mirror = variant === 1;
  return {
    asset: "plain-paper",
    backgroundFilter: "none",
    backgroundOpacity: 1,
    captionVisible: false,
    title: brand,
    titleVisible: true,
    titleType: { ...sansTitle, lineHeight: 0.95 },
    color: t.light,
    size: titleFor(brand, 16),
    x: 6,
    y: 41,
    layers: [],
    marks: mirror ? marks.map((m) => (m.name === "When and where" || m.name === "Background" ? m : { ...m, x: Math.max(-20, 100 - m.x - m.width) })) : marks,
  };
}

/** A square cover: the artist big, the title small, over a night drive, a chrome bloom or a Swiss grid. */
function albumCover(choice: StartChoice, variant: number): LayoutArt {
  const t = tones(choice.palette);
  const artist = choice.brand.slice(0, 40);
  const ring = (x: number, y: number, w: number): [number, number, number, number] => [x, y, w, w];
  const base = { format: "square" as const, backgroundFilter: "none" as const, backgroundOpacity: 1, captionVisible: false, titleVisible: true };
  if (variant === 1)
    return {
      ...base,
      asset: "plain-paper",
      backgroundOpacity: 0,
      canvasColor: t.dark,
      title: artist.toUpperCase(),
      titleType: { ...sansTitle, align: "center", tracking: -2 },
      color: t.light,
      size: titleFor(artist, 15),
      x: 4,
      y: 76,
      layers: [photo("Chrome flower photo", "vinyl-bloom", ring(22, 12, 56), { filter: "none", mask: { shape: "ellipse", feather: 2, invert: false } })],
      marks: [
        shape("Halo", "ellipse", ring(18, 8, 64), "none", { stroke: t.a, strokeWidth: 2 }),
        text("Album title", "BLOOM / SIDE A", [6, 4, 50, 4], { color: t.light, size: 2.6, weight: 700 }),
        text("Track list", "01 Glasshouse\n02 Ultraviolet\n03 Petals, slowly", [64, 4, 32, 12], { color: t.light, size: 2.2, weight: 500, align: "right" }),
        shape("Accent dot", "ellipse", ring(88, 88, 5), t.a),
      ],
    };
  if (variant === 2)
    return {
      ...base,
      asset: "plain-paper",
      title: artist,
      titleType: { ...sansTitle, tracking: -2 },
      color: t.dark,
      size: titleFor(artist, 12),
      x: 6,
      y: 6,
      layers: [photo("Coastal road at dusk", "vinyl-dusk", [46, 46, 48, 48], { filter: "grayscale" })],
      marks: [
        text("Big number", "01", [4, 30, 44, 30], { color: t.a, size: 26, weight: 900 }),
        shape("Rule", "line", [6, 64, 36, 2], "none", { stroke: t.dark, strokeWidth: 2 }),
        text("Album title", "NIGHT\nDRIVES", [6, 68, 36, 14], { color: t.dark, size: 5.5, weight: 900 }),
        text("Year", "LP · 2026", [6, 88, 36, 4], { color: t.dark, size: 2.4, weight: 600 }),
        shape("Corner block", "rectangle", [46, 6, 48, 36], t.a),
        text("Side text", "SIDE A — SIDE B", [62, 18, 30, 4], { color: t.dark, size: 2.2, weight: 700, align: "right" }),
      ],
    };
  return {
    ...base,
    asset: "vinyl-dusk",
    title: artist,
    titleType: { ...sansTitle, tracking: -3 },
    color: t.light,
    size: titleFor(artist, 14),
    x: 6,
    y: 5,
    layers: [],
    marks: [
      shape("Shade", "rectangle", [0, 70, 100, 30], t.dark, { opacity: 0.45 }),
      text("Album title", "NIGHT DRIVES", [6, 84, 60, 5], { color: t.light, size: 3.4, weight: 800 }),
      text("Year", "THE DEBUT ALBUM · 2026", [6, 90.5, 70, 3], { color: t.light, size: 2, weight: 600 }),
      shape("Sticker", "ellipse", ring(76, 74, 18), t.a),
      text("Sticker label", "NEW\nALBUM", [76, 79, 18, 8], { color: t.dark, size: 2.6, weight: 900, align: "center" }),
    ],
  };
}

/** An anime key-visual poster: a slanted title over a rooftop sky, neon rain, or three manga panels. */
function animePoster(choice: StartChoice, variant: number): LayoutArt {
  const t = tones(choice.palette);
  const title = choice.brand.slice(0, 40);
  const base = { format: "poster" as const, backgroundFilter: "none" as const, backgroundOpacity: 1, captionVisible: false, titleVisible: true };
  const speed = (y: number, w: number, c: string) => shape(`Speed line ${y}`, "line", [100 - w, y, w, 2], "none", { stroke: c, strokeWidth: 2, opacity: 0.8 });
  if (variant === 1)
    return {
      ...base,
      asset: "anime-rain",
      title: title.toUpperCase(),
      titleType: { ...sansTitle, tracking: -2 },
      color: t.a,
      size: titleFor(title, 13),
      x: 6,
      y: 74,
      layers: [],
      marks: [
        shape("Night shade", "rectangle", [0, 68, 100, 32], t.dark, { opacity: 0.7 }),
        shape("Side band", "rectangle", [88, 0, 12, 100], t.dark, { opacity: 0.75 }),
        text("Side text", "A STORY IN THE RAIN", [64, 40, 60, 4], { color: t.light, size: 2.6, weight: 800, rotation: 90, align: "center" }),
        text("Season", "NEW SEASON · SPRING 2026", [6, 92, 70, 3], { color: t.light, size: 2.2, weight: 700 }),
        ...[0, 1, 2, 3, 4, 5].map((i) => shape(`Dot ${i + 1}`, "ellipse", circle(6 + i * 4, 5, 3), t.b)),
      ],
    };
  if (variant === 2)
    return {
      ...base,
      asset: "plain-paper",
      title: title,
      titleType: { ...sansTitle, align: "center", tracking: -1 },
      color: t.dark,
      size: titleFor(title, 12),
      x: 30,
      y: 6,
      layers: [
        photo("Rooftop courier drawing", "anime-rooftop", [4, 18, 92, 38], { filter: "none" }),
        photo("Rainy crossing drawing", "anime-rain", [4, 58, 44, 38], { filter: "none" }),
        photo("Rooftop close-up", "anime-rooftop", [52, 58, 44, 38], { filter: "none", flipX: true }),
      ],
      marks: [
        shape("Panel frame 1", "rectangle", [4, 18, 92, 38], "none", { stroke: t.dark, strokeWidth: 4 }),
        shape("Panel frame 2", "rectangle", [4, 58, 44, 38], "none", { stroke: t.dark, strokeWidth: 4 }),
        shape("Panel frame 3", "rectangle", [52, 58, 44, 38], "none", { stroke: t.dark, strokeWidth: 4 }),
        shape("Speech bubble", "ellipse", [56, 22, 36, 12], t.light, { stroke: t.dark, strokeWidth: 3 }),
        text("Speech", "WE RIDE\nAT DAWN!", [58, 24.5, 32, 8], { color: t.dark, size: 3.2, weight: 900, align: "center" }),
        text("Volume", "VOL. 1", [4, 7, 22, 5], { color: t.a, size: 4, weight: 900 }),
        text("Season", "SPRING 2026", [74, 8, 22, 3], { color: t.dark, size: 2.2, weight: 800, align: "right" }),
      ],
    };
  return {
    ...base,
    asset: "anime-rooftop",
    title: title.toUpperCase(),
    titleType: { ...sansTitle, align: "left", tracking: -3 },
    color: t.light,
    size: titleFor(title, 14),
    x: 6,
    y: 9,
    layers: [],
    marks: [
      shape("Title band", "rectangle", [-4, 6, 108, 15], t.a, { rotation: -4, opacity: 0.92 }),
      text("Episode", "EPISODE 01", [6, 3, 40, 3], { color: t.light, size: 2.6, weight: 800 }),
      speed(30, 30, t.light),
      speed(33, 22, t.light),
      speed(36, 34, t.light),
      shape("Date block", "rectangle", [6, 88, 40, 6], t.dark),
      text("Season", "SPRING 2026", [6, 89.3, 40, 4], { color: t.light, size: 2.6, weight: 800, align: "center" }),
    ],
  };
}

/** The layouts each editable template offers. */
export const LAYOUT_VARIANTS: Record<string, number> = {
  "story-series": 3,
  "landing-page": 1,
  "event-post-set": 3,
  "album-cover": 3,
  "anime-poster": 3,
  // Template packs: one entry per pack, as many layouts as it holds.
  ...Object.fromEntries(packs.map((p) => [p.id, p.layouts.length])),
};

export const hasLayout = (templateId: string) => templateId in LAYOUT_VARIANTS;

/** A template's editable layout for a brand and colours, or null for templates drawn from product scenes. */
export function templateLayout(templateId: string, choice: StartChoice, variant = 0): LayoutArt | null {
  if (packById(templateId)) return packLayout(templateId, choice, variant);
  if (templateId === "story-series") return story(choice, variant % 3);
  if (templateId === "landing-page") return landing(choice);
  if (templateId === "event-post-set") return eventPost(choice, variant % 3);
  if (templateId === "album-cover") return albumCover(choice, variant % 3);
  if (templateId === "anime-poster") return animePoster(choice, variant % 3);
  return null;
}

/** The name of one of a template's layouts, for a picker: a pack's screen or sheet, else its number. */
export function layoutLabel(templateId: string, variant: number): string {
  const pack = packById(templateId);
  return pack ? layoutName(pack, variant) : `Layout ${variant + 1}`;
}
