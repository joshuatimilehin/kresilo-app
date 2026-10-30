import type { Art, Mark } from "./contracts";
import { defaultTitleType, formatRatio } from "./contracts";
import { titleFontStacks } from "./layers";
import { assets } from "./catalog";
import { libraryArtUrl } from "./libraryArt";
import { visualFile, type VisualColours } from "./visuals/types";
import { recolourPixels } from "./visuals/colour";
import { coloursOf } from "./visuals/layer";

/**
 * A hosted event's own cover. The host either picks a picture of their own or
 * one of their projects; either way the browser draws a modest JPEG and the
 * "event.cover" command keeps it, answering with a reference the event stores
 * (the event document stays small). Everyone sees it at `/api/event-cover/…`.
 */
export const coverUrl = (ref: string) => `/api/event-cover/${ref}`;

/** The longest side a cover is drawn at. */
export const COVER_SIDE = 1400;

/** The size a picture is drawn at so that its longest side is at most `max`. */
export function fitWithin(w: number, h: number, max = COVER_SIDE): { w: number; h: number } {
  if (w <= 0 || h <= 0) return { w: max, h: max };
  const k = Math.min(1, max / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}

/** The largest `w`×`h` picture that fits a square of `side`, centred. */
export function containBox(w: number, h: number, side: number): { x: number; y: number; w: number; h: number } {
  const k = Math.min(side / w, side / h);
  const bw = Math.round(w * k),
    bh = Math.round(h * k);
  return { x: Math.round((side - bw) / 2), y: Math.round((side - bh) / 2), w: bw, h: bh };
}

/** The part of a `sw`×`sh` picture that fills a `dw`×`dh` box edge to edge (object-fit: cover). */
export function coverCrop(sw: number, sh: number, dw: number, dh: number): { sx: number; sy: number; sw: number; sh: number } {
  const scale = Math.max(dw / sw, dh / sh);
  const w = dw / scale,
    h = dh / scale;
  return { sx: (sw - w) / 2, sy: (sh - h) / 2, sw: w, sh: h };
}

/**
 * A visual's black-and-white picture painted in its colours, drawn whole
 * (contained) into a `w`x`h` box: an offscreen canvas whose pixels are mapped
 * with the same maths as the SVG filter the canvas and the export use.
 */
export function recolouredVisual(img: HTMLImageElement, colours: VisualColours, w: number, h: number): HTMLCanvasElement {
  const k = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const bw = Math.max(1, Math.round(img.naturalWidth * k)),
    bh = Math.max(1, Math.round(img.naturalHeight * k));
  const canvas = document.createElement("canvas");
  canvas.width = bw;
  canvas.height = bh;
  const c = canvas.getContext("2d", { willReadFrequently: true })!;
  c.drawImage(img, 0, 0, bw, bh);
  const pixels = c.getImageData(0, 0, bw, bh);
  recolourPixels(pixels.data, colours);
  c.putImageData(pixels, 0, 0);
  return canvas;
}

/** Breaks words into lines no wider than `max`, measured by `width`; explicit line breaks are kept. */
export function wrapLines(text: string, max: number, width: (s: string) => number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && width(next) > max) {
        out.push(line);
        line = word;
      } else line = next;
    }
    out.push(line);
  }
  return out;
}

const toBase64 = (bytes: Uint8Array) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

async function jpeg(canvas: HTMLCanvasElement): Promise<{ contentType: "image/jpeg"; base64: string }> {
  const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/jpeg", 0.86));
  if (!blob) throw new Error("COVER_DRAW_FAILED");
  return { contentType: "image/jpeg", base64: toBase64(new Uint8Array(await blob.arrayBuffer())) };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((done, fail) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => done(img);
    img.onerror = () => fail(new Error("COVER_IMAGE_FAILED"));
    img.src = src;
  });
}

/** A picture the host chose, drawn down to a cover. */
export async function fileToCover(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const size = fitWithin(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = size.w;
    canvas.height = size.h;
    canvas.getContext("2d")!.drawImage(img, 0, 0, size.w, size.h);
    return await jpeg(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** One of the host's projects drawn as a cover: its ground, picture and image layers, then its title, caption, text and shapes. */
export async function artToCover(art: Art) {
  const ratio = formatRatio[art.format ?? "poster"];
  const size = ratio >= 1 ? { w: COVER_SIDE, h: Math.round(COVER_SIDE / ratio) } : { w: Math.round(COVER_SIDE * ratio), h: COVER_SIDE };
  const canvas = document.createElement("canvas");
  canvas.width = size.w;
  canvas.height = size.h;
  const g = canvas.getContext("2d")!;
  g.fillStyle = art.canvasColor ?? "#111";
  g.fillRect(0, 0, size.w, size.h);
  const draw = async (src: string | undefined, x: number, y: number, w: number, h: number, alpha: number, turn = 0, visual?: VisualColours) => {
    if (!src) return;
    const img = await loadImage(src).catch(() => null);
    if (!img) return;
    g.save();
    g.globalAlpha = alpha;
    g.translate(x + w / 2, y + h / 2);
    g.rotate((turn * Math.PI) / 180);
    if (visual) {
      const shown = recolouredVisual(img, visual, w, h);
      g.drawImage(shown, -shown.width / 2, -shown.height / 2);
    } else {
      const c = coverCrop(img.naturalWidth, img.naturalHeight, w, h);
      g.drawImage(img, c.sx, c.sy, c.sw, c.sh, -w / 2, -h / 2, w, h);
    }
    g.restore();
  };
  await draw(art.snapshot?.image ?? (art.backgroundMediaId ? `/api/media/${art.backgroundMediaId}` : assets[art.asset]), 0, 0, size.w, size.h, art.snapshot ? 1 : art.backgroundOpacity ?? 1);
  for (const l of (art.snapshot ? [] : art.layers ?? []).filter((x) => x.visible)) {
    const src = l.visual ? visualFile(l.visual.id) : l.libraryArt ? libraryArtUrl(l.libraryArt) : l.mediaId ? `/api/media/${l.mediaId}` : l.asset ? assets[l.asset] : undefined;
    await draw(src, (l.x / 100) * size.w, (l.y / 100) * size.h, (l.width / 100) * size.w, (l.height / 100) * size.h, l.opacity, l.rotation, coloursOf(l));
  }
  await document.fonts?.load('italic 400 100px "Kresilo Poster"').catch(() => undefined);
  await document.fonts?.load("400 100px Inter").catch(() => undefined);
  const text = (t: string, x: number, y: number, boxW: number, px: number, color: string, type: { font: "poster" | "sans"; italic: boolean; weight: number; align: "left" | "center" | "right"; lineHeight: number }) => {
    g.save();
    g.fillStyle = color;
    g.textBaseline = "top";
    g.font = `${type.italic ? "italic " : ""}${type.weight} ${px}px ${titleFontStacks.screen[type.font]}`;
    const lines = wrapLines(t, boxW, (l) => g.measureText(l).width);
    g.textAlign = type.align;
    const ax = type.align === "left" ? x : type.align === "center" ? x + boxW / 2 : x + boxW;
    lines.forEach((l, i) => g.fillText(l, ax, y + i * px * type.lineHeight));
    g.restore();
  };
  const t0 = { ...defaultTitleType, ...art.titleType };
  const tt = { font: t0.font ?? "poster", italic: t0.italic ?? true, weight: t0.weight ?? 400, align: t0.align ?? "left", lineHeight: t0.lineHeight ?? 0.78 } as const;
  if (art.titleVisible !== false && art.title)
    text(art.title, (art.x / 100) * size.w, (art.y / 100) * size.h, size.w * Math.max(0.3, 0.93 - art.x / 100), (art.size / 100) * size.w, art.color, tt);
  if (art.captionVisible !== false && art.caption)
    text(art.caption.toUpperCase(), 0.07 * size.w, 0.9 * size.h, size.w * 0.86, 0.026 * size.w, art.color, { font: "sans", italic: false, weight: 500, align: "left", lineHeight: 1.3 });
  for (const m of (art.marks ?? []).filter((x: Mark) => x.visible)) {
    const mx = (m.x / 100) * size.w,
      my = (m.y / 100) * size.h,
      mw = (m.width / 100) * size.w,
      mh = (m.height / 100) * size.h;
    g.save();
    g.globalAlpha = m.opacity;
    g.translate(mx + mw / 2, my + mh / 2);
    g.rotate((m.rotation * Math.PI) / 180);
    g.translate(-mw / 2, -mh / 2);
    if (m.kind === "text") {
      g.restore();
      g.save();
      g.globalAlpha = m.opacity;
      text(m.text, mx, my, mw, (m.size / 100) * size.w, m.color, { font: m.font, italic: m.italic, weight: m.weight, align: m.align, lineHeight: 1.1 });
    } else if (m.kind === "shape") {
      g.fillStyle = m.fill === "none" ? "transparent" : m.fill;
      g.strokeStyle = m.stroke;
      g.lineWidth = (m.strokeWidth / 100) * size.w;
      if (m.shape === "line") {
        g.beginPath();
        g.moveTo(0, mh / 2);
        g.lineTo(mw, mh / 2);
        g.stroke();
      } else if (m.shape === "ellipse") {
        g.beginPath();
        g.ellipse(mw / 2, mh / 2, mw / 2, mh / 2, 0, 0, Math.PI * 2);
        if (m.fill !== "none") g.fill();
        if (m.strokeWidth > 0) g.stroke();
      } else {
        if (m.fill !== "none") g.fillRect(0, 0, mw, mh);
        if (m.strokeWidth > 0) g.strokeRect(0, 0, mw, mh);
      }
    }
    g.restore();
  }
  // Event covers are square, and a poster would be cropped by that frame: fit
  // the whole piece inside it, on the project's own ground.
  const out = document.createElement("canvas");
  out.width = out.height = COVER_SIDE;
  const o = out.getContext("2d")!;
  o.fillStyle = art.canvasColor ?? "#111";
  o.fillRect(0, 0, COVER_SIDE, COVER_SIDE);
  const fit = containBox(size.w, size.h, COVER_SIDE);
  o.drawImage(canvas, fit.x, fit.y, fit.w, fit.h);
  return jpeg(out);
}
