import { assetLayerNames } from "./catalog";
import type { Art, ImageLayer, LayerRole } from "./contracts";

/**
 * Layer names and roles. A person has to know which layer to configure, so
 * every layer carries a plain name (unique within its project) and a role, a
 * one-word answer to "what is this layer for". Pure functions only, so the
 * editor, the command service and the model's context all read the same words.
 */

export const maxLayerNameLength = 160;

/** Plain-language labels for each role, with a short hint for tooltips. */
export const roleLabels: Record<
  LayerRole,
  { label: string; noun: string; hint: string }
> = {
  background: {
    label: "Background",
    noun: "Background image",
    hint: "Fills the canvas behind everything else.",
  },
  subject: {
    label: "Subject",
    noun: "Main subject",
    hint: "The main picture the poster is about.",
  },
  texture: {
    label: "Texture",
    noun: "Texture",
    hint: "A surface such as paper or plaster, usually blended or faded.",
  },
  type: {
    label: "Lettering",
    noun: "Lettering",
    hint: "Letters or words that are part of the image.",
  },
  ornament: {
    label: "Ornament",
    noun: "Ornament",
    hint: "A decorative pattern or detail.",
  },
  overlay: {
    label: "Overlay",
    noun: "Colour overlay",
    hint: "Colour or light laid over other layers.",
  },
  shape: {
    label: "Shape",
    noun: "Shape",
    hint: "A graphic shape or mark.",
  },
  other: {
    label: "Other",
    noun: "Image",
    hint: "Something else.",
  },
};

export const roleLabel = (role: LayerRole | undefined): string =>
  roleLabels[role ?? "other"].label;

/** The layer's role: its own, else the catalogue's for its asset, else other. */
export function layerRole(
  layer: Pick<ImageLayer, "role" | "asset">,
): LayerRole {
  if (layer.role) return layer.role;
  return (layer.asset && assetLayerNames[layer.asset]?.role) || "other";
}

/** Tidy a typed name: collapse spaces, drop control characters, cap the length. */
export function normalizeLayerName(raw: string, fallback = "Image layer"): string {
  const cleaned = Array.from(raw, (c) => (c < " " || c === "\u007f" ? " " : c))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || fallback).slice(0, maxLayerNameLength).trim();
}

const key = (name: string) => normalizeLayerName(name, "").toLowerCase();

type Box = Pick<ImageLayer, "x" | "y" | "width" | "height">;

/** Where the middle of a layer sits: centre, left, top right, and so on. */
export function positionWord(box: Box): string {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const h = cx < 38 ? "left" : cx > 62 ? "right" : "";
  const v = cy < 38 ? "top" : cy > 62 ? "bottom" : "";
  return [v, h].filter(Boolean).join(" ") || "centre";
}

/** Rough size by how much of the canvas the layer covers. */
export function sizeWord(box: Box): "large" | "medium" | "small" {
  const covered = (box.width * box.height) / 10000;
  return covered >= 0.6 ? "large" : covered <= 0.12 ? "small" : "medium";
}

function placeText(box: Box): string {
  const p = positionWord(box);
  if (p === "centre") return "at the centre";
  return p.includes(" ") || p === "top" || p === "bottom"
    ? `at the ${p}`
    : `on the ${p}`;
}

/**
 * A short plain description of a layer for people and for the model's context:
 * name, role, where it sits and how big it is, in words.
 */
export function describeLayer(layer: ImageLayer): string {
  const role = roleLabels[layerRole(layer)].label.toLowerCase();
  return `${layer.name} (${role} layer), ${placeText(layer)}, ${sizeWord(layer)} size${layer.visible ? "" : ", currently hidden"}`;
}

/**
 * Make a name unique among `taken` (ignoring case). Tries the name as is, then
 * the name with each distinguishing word ("Paper texture, left"), and only as
 * a last resort a number ("Paper texture 2").
 */
export function uniqueLayerName(
  name: string,
  taken: readonly string[],
  hints: readonly string[] = [],
): string {
  const used = new Set(taken.map(key));
  const base = normalizeLayerName(name);
  if (!used.has(key(base))) return base;
  for (const hint of hints) {
    if (!hint || key(base).includes(hint.toLowerCase())) continue;
    const candidate = `${base}, ${hint}`;
    if (candidate.length <= maxLayerNameLength && !used.has(key(candidate)))
      return candidate;
  }
  for (let n = 2; ; n++) {
    const suffix = ` ${n}`;
    const candidate = `${base.slice(0, maxLayerNameLength - suffix.length).trim()}${suffix}`;
    if (!used.has(key(candidate))) return candidate;
  }
}

/** Words that tell two similar layers apart, from their real place in the stack. */
export function distinguishers(box: Box, index: number, count: number): string[] {
  const stack = index >= count - 1 ? "front" : index <= 0 ? "back" : "middle";
  return [positionWord(box), sizeWord(box), stack];
}

/**
 * The name and role a layer gets when it is first added: the asset's
 * descriptive name from the catalogue (or the given name for an imported
 * image), made unique within the project.
 */
export function preNameLayer(
  art: Art,
  source: Pick<ImageLayer, "asset" | "mediaId">,
  box: Box,
  given?: string,
): { name: string; role: LayerRole } {
  const known = source.asset ? assetLayerNames[source.asset] : undefined;
  const base = given?.trim() || known?.layerName || "Imported image";
  const layers = art.layers ?? [];
  const name = uniqueLayerName(
    base,
    layers.map((l) => l.name),
    distinguishers(box, layers.length, layers.length + 1),
  );
  return { name, role: known?.role ?? "other" };
}

/**
 * Suggest a name for a layer without a model: its asset's descriptive name
 * (or its role for an imported image), plus size and place when they say
 * something, kept unique among the other layers.
 */
export function suggestLayerName(
  layer: ImageLayer,
  art: Art,
  others: readonly ImageLayer[] = (art.layers ?? []).filter(
    (l) => l.id !== layer.id,
  ),
): string {
  const role = layerRole(layer);
  const known = layer.asset ? assetLayerNames[layer.asset] : undefined;
  const base =
    known?.layerName ??
    (role === "other" ? "Imported image" : roleLabels[role].noun);
  const size = sizeWord(layer);
  const place = positionWord(layer);
  const parts = [base];
  if (size !== "medium") parts.push(size);
  if (place !== "centre") parts.push(place);
  const all = art.layers ?? [];
  const index = all.findIndex((l) => l.id === layer.id);
  return uniqueLayerName(
    parts.join(", "),
    others.map((l) => l.name),
    distinguishers(layer, index < 0 ? all.length : index, all.length || 1),
  );
}
