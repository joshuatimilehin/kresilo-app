import type { Art, ImageLayer, TitleType } from "./contracts";
import {
  distinguishers,
  normalizeLayerName,
  preNameLayer,
  uniqueLayerName,
} from "./layerNames";
import { visualFilterId } from "./visuals/colour";
import type { VisualColours } from "./visuals/types";

export const imageFilters = {
  none: "none",
  grayscale: "grayscale(1)",
  warm: "sepia(.35) saturate(1.15)",
  cool: "sepia(.2) hue-rotate(155deg) saturate(.8)",
};

/**
 * Add an image layer on top. With no `name` it is pre-named from the asset
 * catalogue ("Paper orbit shape") and given that asset's role; the name is
 * always made unique within the project. `box` places it (percentages of the
 * canvas); without one it lands in the default spot.
 */
export function addImageLayer(
  art: Art,
  source: Pick<ImageLayer, "asset" | "mediaId">,
  name?: string,
  box: Pick<ImageLayer, "x" | "y" | "width" | "height"> = { x: 15, y: 20, width: 55, height: 45 },
): ImageLayer[] {
  const named = preNameLayer(art, source, box, name);
  return [
    ...(art.layers ?? []),
    {
      id: crypto.randomUUID(),
      name: named.name,
      role: named.role,
      ...source,
      ...box,
      opacity: 1,
      rotation: 0,
      visible: true,
      filter: "none",
    },
  ];
}

/**
 * Save an edited layer: the name is tidied and made unique among the other
 * layers, everything else is kept as given.
 */
export function applyLayerEdit(art: Art, edited: ImageLayer): ImageLayer[] {
  const layers = art.layers ?? [];
  const others = layers.filter((l) => l.id !== edited.id);
  const name = uniqueLayerName(
    normalizeLayerName(edited.name, "Image layer"),
    others.map((l) => l.name),
    distinguishers(
      edited,
      layers.findIndex((l) => l.id === edited.id),
      layers.length,
    ),
  );
  return layers.map((l) => (l.id === edited.id ? { ...edited, name } : l));
}

/** Rename one layer; other layers are untouched. */
export function renameLayer(art: Art, id: string, name: string): ImageLayer[] {
  const layer = art.layers?.find((l) => l.id === id);
  return layer ? applyLayerEdit(art, { ...layer, name }) : [...(art.layers ?? [])];
}

/**
 * Flip one layer's hand-only lock and return the new layers. Locking means
 * "I am working on this, or it is finished": AI proposals leave it alone until
 * a person unlocks it. Other layers are returned unchanged.
 */
export function toggleLayerLock(art: Art, id: string): ImageLayer[] {
  return (art.layers ?? []).map((l) => {
    if (l.id !== id) return l;
    if (l.aiLock === true) {
      const { aiLock: _removed, ...rest } = l;
      return rest;
    }
    return { ...l, aiLock: true };
  });
}

export function moveLayer(
  art: Art,
  id: string,
  direction: -1 | 1,
): ImageLayer[] {
  const layers = [...(art.layers ?? [])];
  const from = layers.findIndex((l) => l.id === id),
    to = from + direction;
  if (from >= 0 && to >= 0 && to < layers.length)
    [layers[from], layers[to]] = [layers[to], layers[from]];
  return layers;
}

export const imageShadows = {
  none: "",
  soft: "drop-shadow(0 12px 24px rgba(0,0,0,.35))",
  hard: "drop-shadow(8px 8px 0 rgba(0,0,0,.5))",
};

export type LayerStyle = Record<string, string | number | undefined>;

/**
 * One place that turns a layer's stored numbers and words into CSS, used by
 * the editor and by the motion renderer so an effect looks the same in both.
 * Layers saved before effects existed produce exactly the style they did.
 */
export function layerStyle(l: ImageLayer): LayerStyle {
  // A visual is recoloured first; every other effect then works on the recoloured picture.
  const filters = [...(l.visual ? [`url(#${visualFilterId(l.visual as VisualColours)})`] : []), imageFilters[l.filter ?? "none"]].filter((f) => f !== "none");
  const a = l.adjust;
  if (a) {
    if (a.brightness !== 1) filters.push(`brightness(${a.brightness})`);
    if (a.contrast !== 1) filters.push(`contrast(${a.contrast})`);
    if (a.saturation !== 1) filters.push(`saturate(${a.saturation})`);
    if (a.blur > 0) filters.push(`blur(${a.blur}px)`);
    if (a.warmth) filters.push(warmthFilter(a.warmth));
    const step = grainStep(a.grain);
    if (step) filters.push(`url(#${grainFilterId(step)})`);
  }
  const shadow = imageShadows[l.shadow ?? "none"];
  if (shadow) filters.push(shadow);
  const c = l.crop;
  const rounded = l.mask?.shape === "rounded";
  const cropped = c && (c.top || c.right || c.bottom || c.left);
  const style: LayerStyle = {
    opacity: l.opacity,
    transform: `rotate(${l.rotation}deg)${l.flipX ? " scaleX(-1)" : ""}${l.flipY ? " scaleY(-1)" : ""}`,
    filter: filters.length ? filters.join(" ") : "none",
  };
  if (l.blend && l.blend !== "normal") style.mixBlendMode = l.blend;
  // A visual is always shown whole; the layer's box never crops it.
  if (l.visual) style.objectFit = "contain";
  if (cropped || rounded) {
    style.clipPath = `inset(${c?.top ?? 0}% ${c?.right ?? 0}% ${c?.bottom ?? 0}% ${c?.left ?? 0}%${rounded ? " round 12%" : ""})`;
  }
  if (l.mask?.shape === "brush") {
    const image = brushMaskImage(l.mask);
    style.WebkitMaskImage = image;
    style.maskImage = image;
    style.WebkitMaskSize = "100% 100%";
    style.maskSize = "100% 100%";
  }
  if (l.mask?.shape === "ellipse") {
    const stop = 100 - (l.mask.feather || 0.5);
    const gradient = l.mask.invert
      ? `radial-gradient(ellipse closest-side at 50% 50%, transparent ${stop}%, #000 100%)`
      : `radial-gradient(ellipse closest-side at 50% 50%, #000 ${stop}%, transparent 100%)`;
    style.WebkitMaskImage = gradient;
    style.maskImage = gradient;
  }
  return style;
}

type BrushMask = NonNullable<ImageLayer["mask"]>;
const n = (v: number) => Math.round(Math.min(100, Math.max(0, v)) * 10) / 10;

/**
 * A brush mask as an SVG image: painted strokes show the layer, the rest is
 * hidden (inverted: painted strokes hide it). Built only from bounded numbers,
 * so nothing stored can become markup. With no strokes yet the whole layer
 * shows, so choosing the brush never makes a layer vanish.
 */
export function brushMaskSvg(mask: BrushMask): string {
  const strokes = mask.strokes ?? [];
  if (!strokes.length) return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><rect width='100' height='100'/></svg>`;
  const blur = Math.min(10, (mask.feather ?? 0) / 4);
  const paths = strokes
    .map((s) => {
      const [first, ...rest] = s.points;
      const d = `M${n(first[0])} ${n(first[1])}` + (rest.length ? rest.map((p) => `L${n(p[0])} ${n(p[1])}`).join("") : `L${n(first[0]) + 0.01} ${n(first[1])}`);
      return `<path d='${d}' stroke-width='${n(s.size)}'/>`;
    })
    .join("");
  const filter = blur > 0 ? `<filter id='f'><feGaussianBlur stdDeviation='${blur}'/></filter>` : "";
  const g = (colour: string) => `<g fill='none' stroke='${colour}' stroke-linecap='round' stroke-linejoin='round'${blur > 0 ? " filter='url(#f)'" : ""}>${paths}</g>`;
  const body = mask.invert
    ? `<mask id='m'><rect width='100' height='100' fill='white'/>${g("black")}</mask><rect width='100' height='100' mask='url(#m)'/>`
    : g("black");
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>${filter ? `<defs>${filter}</defs>` : ""}${body}</svg>`;
}

/** The brush mask as a CSS image value. */
export const brushMaskImage = (mask: BrushMask) => `url("data:image/svg+xml,${encodeURIComponent(brushMaskSvg(mask))}")`;

const cssName = (key: string) =>
  key.startsWith("Webkit")
    ? `-webkit-${key.slice(6).replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`).replace(/^-/, "")}`
    : key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** The same style as a CSS text string, for the motion renderer's HTML. */
export function layerCss(l: ImageLayer): string {
  return Object.entries(layerStyle(l))
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${cssName(k)}:${v}`)
    .join(";");
}

function sameLayer(a: ImageLayer, b: ImageLayer): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys)
    if (
      JSON.stringify((a as Record<string, unknown>)[k]) !==
      JSON.stringify((b as Record<string, unknown>)[k])
    )
      return false;
  return true;
}

/** Whether a layer is locked against AI changes (a person can still edit it). */
export const isAiLocked = (l: Pick<ImageLayer, "aiLock"> | undefined) =>
  l?.aiLock === true;

/**
 * Names of locked layers a patch would change or remove. An AI proposal that
 * touches a hand-only layer is refused; a patch with no layer list changes none.
 */
export function lockedLayerChanges(art: Art, patch: Partial<Art>): string[] {
  if (!patch.layers) return [];
  const next = new Map(patch.layers.map((l) => [l.id, l]));
  return (art.layers ?? [])
    .filter((l) => isAiLocked(l))
    .filter((l) => {
      const after = next.get(l.id);
      return !after || !sameLayer(l, after);
    })
    .map((l) => l.name);
}


/** The font stacks for a title: the screen's, and the motion export's (which embeds its own copies). */
export const titleFontStacks = {
  screen: { poster: '"Kresilo Poster", "Times New Roman", serif', sans: "Inter, Arial, sans-serif" },
  export: { poster: "Poster,serif", sans: "KresiloSans,Arial" },
} as const;

/**
 * The title's type as CSS properties, or nothing for a title nobody has set
 * type on, so every earlier project looks exactly as it did.
 */
export function titleStyle(
  type: TitleType | undefined,
  target: keyof typeof titleFontStacks = "screen",
): Record<string, string | number> {
  if (!type) return {};
  return {
    fontFamily: titleFontStacks[target][type.font],
    fontStyle: type.italic ? "italic" : "normal",
    fontWeight: type.weight,
    textAlign: type.align,
    lineHeight: type.lineHeight,
    letterSpacing: `${type.tracking / 100}em`,
  };
}

/** The same as CSS text, for the motion export's page. */
export function titleCss(type: TitleType | undefined): string {
  const style = titleStyle(type, "export");
  return Object.entries(style)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${v}`)
    .join(";");
}

/**
 * Colour warmth as a CSS filter: a little sepia and saturation for warm, a
 * small hue turn for cool. An honest approximation, not a white-balance tool.
 */
export function warmthFilter(w: number): string {
  const v = Math.max(-1, Math.min(1, w));
  return v > 0
    ? `sepia(${Math.round(v * 35) / 100}) saturate(${1 + Math.round(v * 15) / 100})`
    : `hue-rotate(${Math.round(-v * 18)}deg) saturate(${1 + Math.round(-v * 8) / 100})`;
}

/** Grain is drawn by a fixed set of SVG filters; the amount snaps to one of five steps. */
export const GRAIN_STEPS = 5;
export const grainStep = (grain: number | undefined): number =>
  grain && grain > 0 ? Math.max(1, Math.min(GRAIN_STEPS, Math.round(grain * GRAIN_STEPS))) : 0;
export const grainFilterId = (step: number) => `kresilo-grain-${step}`;

/** The SVG that defines the grain filters. Static text with no input in it; the page includes it once. */
export function grainDefsMarkup(): string {
  const filters = Array.from({ length: GRAIN_STEPS }, (_, i) => {
    const step = i + 1;
    const amount = (step * 0.12).toFixed(2);
    const offset = (-step * 0.06).toFixed(2);
    return `<filter id="${grainFilterId(step)}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise"/><feColorMatrix in="noise" type="saturate" values="0" result="grey"/><feComposite in="SourceGraphic" in2="grey" operator="arithmetic" k1="0" k2="1" k3="${amount}" k4="${offset}"/></filter>`;
  });
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${filters.join("")}</defs></svg>`;
}
