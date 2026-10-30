import type { ArtFormat, ImageLayer, LayerRole } from "../contracts";
import { fitBox } from "../portfolio/useInStudio";
import type { Visual, VisualColours } from "./types";
import { coloursFor, type VisualPalette } from "./palette";
import { visualDefsMarkup } from "./colour";

/**
 * Putting a visual on a canvas, and checking a layer's visual. Pure; nothing
 * here writes anything.
 */

/** The shape each visual is drawn in, as width over height, for sizing it to fit. */
export const SHAPE_ASPECT: Record<Visual["shape"], number> = { portrait: 3 / 4, landscape: 4 / 3, square: 1 };

const ROLE_OF_CATEGORY: Partial<Record<Visual["category"], LayerRole>> = {
  "textures and grounds": "texture",
  "badges, frames and ornaments": "ornament",
  "shapes, lines and scribbles": "ornament",
};

/**
 * The layer for a visual: centred, sized to fit the canvas (no more than 60%
 * of it either way, like every added asset), in the colours given. Ink
 * visuals keep only an ink colour; duotones keep ink and ground.
 */
export function visualLayer(
  visual: Visual,
  palette: Pick<VisualPalette, "ink" | "ground">,
  existing: readonly ImageLayer[] = [],
  format?: ArtFormat,
  name?: string,
): ImageLayer {
  const taken = new Set(existing.map((l) => l.name.trim().toLowerCase()));
  const wanted = (name ?? visual.title).slice(0, 150);
  let unique = wanted;
  for (let n = 2; taken.has(unique.trim().toLowerCase()); n++) unique = `${wanted} ${n}`;
  return {
    id: crypto.randomUUID(),
    name: unique,
    role: ROLE_OF_CATEGORY[visual.category] ?? "subject",
    asset: "dusk-study",
    visual: { id: visual.id, ...coloursFor(visual.kind, palette) },
    ...fitBox(format, SHAPE_ASPECT[visual.shape]),
    opacity: 1,
    rotation: 0,
    visible: true,
    filter: "none",
  };
}

/** The colours a visual layer carries, as the renderer takes them. */
export const coloursOf = (l: Pick<ImageLayer, "visual">): VisualColours | undefined =>
  l.visual ? { ink: l.visual.ink, ...(l.visual.ground ? { ground: l.visual.ground } : {}) } : undefined;

/** The SVG filter definitions the visible visual layers need, each colour pair once ("" when there are none). */
export function visualDefsFor(layers: readonly ImageLayer[] | undefined): string {
  return visualDefsMarkup((layers ?? []).filter((l) => l.visible).flatMap((l) => coloursOf(l) ?? []));
}
