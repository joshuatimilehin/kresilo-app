import { z } from "zod";

/**
 * Rough work in, clean SVG out. The model draws an SVG from a picture of the marked region; this file makes
 * that SVG safe and on-brand before the canvas sees it. Nothing the model writes is trusted: only known
 * shapes and properties are kept, anything executable or external is dropped, every colour snaps to the
 * Kresilo palette and the result is split into named layers. Pure string work, so the server and the tests
 * run the same code.
 */
export const VECTOR_MAX_CHARS = 300_000;
const MAX_ELEMENTS = 1500;
const MAX_DEPTH = 12;
export const MAX_LAYERS = 24;

export const vectorRequest = z
  .object({
    image: z.string().regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/).max(3_000_000),
    width: z.number().finite().min(8).max(20000),
    height: z.number().finite().min(8).max(20000),
    notes: z.array(z.string().trim().max(300)).max(20).optional(),
    request: z.string().trim().max(300).optional(),
  })
  .strict();
export type VectorRequest = z.infer<typeof vectorRequest>;
export type VectorLayer = { name: string; svg: string };
export type VectorResult = { width: number; height: number; layers: VectorLayer[]; svg: string };

/** The Kresilo palette: ink and its surfaces, ivory, lime and violet. Every colour in an answer snaps to one of these. */
export const VECTOR_PALETTE = ["#0a0c0e", "#101315", "#16191c", "#1a1e21", "#2a3036", "#8d9396", "#edeae3", "#c7fe02", "#8b5cf8"] as const;
const SERIF = "Instrument Serif, Georgia, serif";
const SANS = "Inter, sans-serif";
const MONO = "IBM Plex Mono, monospace";

const TAGS = new Set(["svg", "g", "defs", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "text", "tspan", "linearGradient", "radialGradient", "stop", "clipPath"]);
const SHAPES = new Set(["rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "text", "tspan", "stop"]);
const ATTRS = new Set([
  "id", "viewBox", "width", "height", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "d", "points", "transform",
  "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "opacity", "fill-opacity", "stroke-opacity",
  "fill-rule", "clip-rule", "font-family", "font-size", "font-weight", "font-style", "letter-spacing", "text-anchor", "dominant-baseline",
  "offset", "stop-color", "stop-opacity", "gradientUnits", "gradientTransform", "clip-path", "fx", "fy",
]);
const COLOR_ATTRS = new Set(["fill", "stroke", "stop-color"]);
const NAMED: Record<string, string> = {
  black: "#000000", white: "#ffffff", red: "#ff0000", green: "#008000", blue: "#0000ff", yellow: "#ffff00", orange: "#ffa500", purple: "#800080",
  pink: "#ffc0cb", gray: "#808080", grey: "#808080", lime: "#00ff00", cyan: "#00ffff", magenta: "#ff00ff", navy: "#000080", teal: "#008080",
  brown: "#a52a2a", gold: "#ffd700", silver: "#c0c0c0", violet: "#ee82ee", ivory: "#fffff0", beige: "#f5f5dc", coral: "#ff7f50", indigo: "#4b0082",
};

function rgbOf(value: string): [number, number, number] | null {
  const v = value.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(v);
  if (hex) {
    const h = hex[1];
    const full = h.length <= 4 ? [...h].map((c) => c + c).join("") : h;
    return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
  }
  const rgb = /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/.exec(v);
  if (rgb) return [Math.min(255, +rgb[1]), Math.min(255, +rgb[2]), Math.min(255, +rgb[3])];
  return NAMED[v] ? rgbOf(NAMED[v]) : null;
}
const NEUTRALS = ["#0a0c0e", "#101315", "#16191c", "#1a1e21", "#2a3036", "#8d9396", "#edeae3"] as const;
const hue = (c: [number, number, number]) => {
  const [r, g, b] = c.map((v) => v / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (!d) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};
const apart = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
/**
 * The palette colour for a colour. Dull colours go to the nearest neutral (ink to ivory); colourful ones go to
 * lime or violet, whichever is nearer in hue, so a red or a blue does not turn into grey.
 */
export function brandColor(value: string): string | null {
  const c = rgbOf(value);
  if (!c) return null;
  const max = Math.max(...c);
  const min = Math.min(...c);
  const saturation = max ? (max - min) / max : 0;
  if (saturation >= 0.28 && max >= 60) return apart(hue(c), 73) <= apart(hue(c), 258) ? "#c7fe02" : "#8b5cf8";
  let best: string = NEUTRALS[0];
  let bestD = Infinity;
  for (const p of NEUTRALS) {
    const q = rgbOf(p)!;
    const d = 2 * (c[0] - q[0]) ** 2 + 4 * (c[1] - q[1]) ** 2 + 3 * (c[2] - q[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

function cleanValue(name: string, raw: string): string | null {
  const v = raw.trim();
  if (!v || v.length > (name === "d" || name === "points" ? 12000 : 400)) return null;
  if (/[<>]/.test(v) || /javascript:|data:|expression|@import|&#|\\/i.test(v)) return null;
  if (name === "id") return /^[A-Za-z][\w-]{0,40}$/.test(v) ? v : null;
  if (COLOR_ATTRS.has(name)) {
    if (/^(none|transparent)$/i.test(v)) return "none";
    if (/^url\(#[A-Za-z][\w-]{0,40}\)$/.test(v)) return v;
    if (/^currentcolor$/i.test(v)) return "#edeae3";
    return brandColor(v);
  }
  if (name === "clip-path") return /^url\(#[A-Za-z][\w-]{0,40}\)$/.test(v) ? v : null;
  if (name === "font-family") return /mono|courier|consolas/i.test(v) ? MONO : /serif|georgia|times|garamond|bodoni|instrument/i.test(v) && !/sans/i.test(v) ? SERIF : SANS;
  if (name === "transform" || name === "gradientTransform") return /^[\w\s.,()+-]+$/.test(v) && !/url|\bexpression\b/i.test(v) ? v : null;
  if (/url\(|[;{}]/.test(v)) return null;
  return v.replace(/\s+/g, " ");
}

const escapeText = (t: string) => t.replace(/&(?!(?:amp|lt|gt|quot|apos);)/g, "&amp;").replace(/>/g, "&gt;");
const names = (a: string) => a.replace(/^[^A-Za-z]+/, "").replace(/[-_]+/g, " ").trim();

type Node = { tag: string; attrs: string; kids: Node[]; text?: string };

/** Simple `.class { prop: value }` rules from a <style> block, so a model that styles by class still draws. Classes only; no at-rules. */
function classRules(src: string): Map<string, Map<string, string>> {
  const css = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1].replace(/\/\*[\s\S]*?\*\//g, "")).join("\n");
  const rules = new Map<string, Map<string, string>>();
  if (/@/.test(css)) return rules;
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const decl = declarations(m[2]);
    for (const sel of m[1].split(",")) {
      const name = /^\s*\.([\w-]+)\s*$/.exec(sel)?.[1];
      if (name) rules.set(name, new Map([...(rules.get(name) ?? []), ...decl]));
    }
  }
  return rules;
}
function declarations(text: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const part of text.split(";")) {
    const i = part.indexOf(":");
    if (i > 0) out.set(part.slice(0, i).trim().toLowerCase(), part.slice(i + 1).trim().replace(/^['"]|['"]$/g, ""));
  }
  return out;
}

/** Reads an SVG document into allowed nodes only, or null when it is malformed, executable or too large. */
function parse(raw: string): Node | null {
  if (raw.length > VECTOR_MAX_CHARS) return null;
  const start = raw.search(/<svg[\s>]/i);
  const end = raw.lastIndexOf("</svg>");
  if (start < 0 || end < start) return null;
  const src = raw.slice(start, end + 6).replace(/<!--[\s\S]*?-->/g, "").replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "").replace(/<[!?][^>]*>/g, "");
  const rules = classRules(src);
  const stack: Node[] = [];
  let root: Node | null = null;
  let skip = 0;
  let count = 0;
  const token = /<(\/?)([A-Za-z][\w:-]*)((?:\s[^<>]*?)?)(\/?)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = token.exec(src))) {
    if (m[5] !== undefined) {
      const top = stack[stack.length - 1];
      if (!skip && top && (top.tag === "text" || top.tag === "tspan") && m[5].trim()) top.kids.push({ tag: "#text", attrs: "", kids: [], text: escapeText(m[5]).slice(0, 200) });
      continue;
    }
    const closing = m[1] === "/";
    const tag = m[2].replace(/^svg:/, "");
    const self = m[4] === "/";
    if (closing) {
      if (skip) {
        skip--;
        continue;
      }
      const open = stack.pop();
      if (!open || open.tag !== tag) return null;
      continue;
    }
    if (skip || !TAGS.has(tag) || (root && tag === "svg")) {
      if (!self) skip++;
      continue;
    }
    if (++count > MAX_ELEMENTS || stack.length >= MAX_DEPTH) return null;
    const kept: string[] = [];
    const seen = new Set<string>();
    const given = new Map<string, string>();
    const attrRe = /([A-Za-z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let a: RegExpExecArray | null;
    while ((a = attrRe.exec(m[3]))) if (!given.has(a[1])) given.set(a[1], a[2] ?? a[3] ?? "");
    // CSS wins over presentation attributes: a class rule, then the style attribute.
    const merged = new Map([...given].filter(([k]) => k !== "class" && k !== "style"));
    for (const c of (given.get("class") ?? "").split(/\s+/)) for (const [k, v] of rules.get(c) ?? []) merged.set(k, v);
    for (const [k, v] of declarations(given.get("style") ?? "")) merged.set(k, v);
    for (const [name, raw] of merged) {
      if (!ATTRS.has(name) || seen.has(name)) continue;
      const value = cleanValue(name, raw);
      if (value === null) continue;
      seen.add(name);
      kept.push(`${name}="${value.replace(/"/g, "&quot;")}"`);
    }
    if (tag === "text" && !seen.has("font-family")) kept.push(`font-family="${SANS}"`);
    const node: Node = { tag, attrs: kept.join(" "), kids: [] };
    if (stack.length) stack[stack.length - 1].kids.push(node);
    else if (!root) root = node;
    else return null;
    if (!self) stack.push(node);
  }
  return stack.length || !root || root.tag !== "svg" ? null : root;
}

const write = (n: Node): string =>
  n.tag === "#text" ? n.text ?? "" : `<${n.tag}${n.attrs ? " " + n.attrs : ""}${n.kids.length ? `>${n.kids.map(write).join("")}</${n.tag}>` : "/>"}`;
const attr = (n: Node, name: string) => new RegExp(`(?:^| )${name}="([^"]*)"`).exec(n.attrs)?.[1];

/** A name for a group the model did not name: its first words of text, else what it mostly draws. */
function describe(g: Node): string {
  const first = (n: Node): string | undefined => (n.tag === "#text" ? n.text : n.kids.map(first).find(Boolean));
  const t = first(g)?.replace(/&[a-z]+;/g, " ").trim();
  if (t) return t.length > 22 ? t.slice(0, 21) + "…" : t;
  const tags = new Set<string>();
  const walk = (n: Node) => {
    tags.add(n.tag);
    n.kids.forEach(walk);
  };
  walk(g);
  return tags.has("path") || tags.has("circle") || tags.has("ellipse") ? "Shape" : tags.has("line") ? "Lines" : tags.has("rect") ? "Panel" : "";
}

/**
 * A model's SVG made safe, on-brand and split into layers. `box` is the size of the region it was drawn for;
 * the viewBox always matches it so layers stack exactly. Null when the answer cannot be used.
 */
export function cleanVector(raw: string, box: { width: number; height: number }): VectorResult | null {
  const root = parse(raw);
  if (!root) return null;
  const width = Math.round(box.width);
  const height = Math.round(box.height);
  const defs = root.kids.filter((k) => k.tag === "defs");
  const body = root.kids.filter((k) => k.tag !== "defs");
  const shells = ["linearGradient", "radialGradient", "clipPath"];
  const loose = body.filter((k) => k.tag !== "g");
  const groups = body.filter((k) => k.tag === "g");
  // Gradients and clips are shared: every layer carries them so it draws alone.
  const shared = [...defs.flatMap((d) => d.kids), ...body.filter((k) => shells.includes(k.tag))].filter((k) => shells.includes(k.tag));
  const drawn = (list: Node[]) => list.filter((k) => !shells.includes(k.tag));
  const layers: { name: string; nodes: Node[] }[] = [];
  const background = drawn(loose);
  if (background.length) layers.push({ name: "Background", nodes: background });
  for (const g of groups) {
    if (!g.kids.length) continue;
    const id = attr(g, "id");
    layers.push({ name: id ? names(id) || "Layer" : describe(g) || `Layer ${layers.length + 1}`, nodes: [g] });
  }
  if (!layers.length) return null;
  if (!layers.some((l) => l.nodes.some((n) => SHAPES.has(n.tag) || n.kids.length))) return null;
  const kept = layers.slice(0, MAX_LAYERS);
  const wrap = (nodes: Node[]) => {
    const inner = `${shared.length ? `<defs>${shared.map(write).join("")}</defs>` : ""}${nodes.map(write).join("")}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${inner}</svg>`;
  };
  const taken = new Map<string, number>();
  const named = kept.map((l) => {
    const n = (taken.get(l.name) ?? 0) + 1;
    taken.set(l.name, n);
    return { name: n > 1 ? `${l.name} ${n}` : l.name, nodes: l.nodes };
  });
  return {
    width,
    height,
    layers: named.map((l) => ({ name: l.name, svg: wrap(l.nodes) })),
    svg: wrap(kept.flatMap((l) => l.nodes)),
  };
}

/** An SVG as a data URL the canvas can hold as an image file. */
export const svgDataUrl = (svg: string) => `data:image/svg+xml;base64,${typeof btoa === "function" ? btoa(unescape(encodeURIComponent(svg))) : Buffer.from(svg).toString("base64")}`;
