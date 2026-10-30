import { brandTemplates } from "./portfolio/templates";
import type { VisualCategory } from "./visuals/types";
import type { SpecialistId } from "./specialists";

/**
 * Which designer works from which template packs and visual-library
 * categories. Plain id lists, so a new pack is one line here: add its template
 * ids to a designer's `templates`, and any new library category to a
 * designer's `visualCategories` (a test fails if a category belongs to no
 * designer or a listed id no longer exists). A template not listed here falls
 * to Brand identity, which is where the template packs began.
 */
export const designerMap: Record<
  SpecialistId,
  {
    /** Template ids (portfolio/templates.ts). */
    templates: readonly string[];
    /** Visual-library categories (visuals/types.ts) the designer reaches for first. */
    visualCategories: readonly VisualCategory[];
    /** Open Design style ids (openDesign/styles.json) it leans towards when the project has none chosen. */
    styles: readonly string[];
  }
> = {
  ui: {
    templates: ["ui-kit-starter", "landing-page"],
    visualCategories: ["tech and screens", "objects and tools", "shapes, lines and scribbles", "badges, frames and ornaments"],
    styles: ["clean", "modern", "flat", "simple", "sleek", "bento", "glassmorphism"],
  },
  brand: {
    templates: ["brand-board", "logo-on-products", "packaging-set", "stationery-kit", "pitch-deck", "social-launch-kit"],
    visualCategories: ["badges, frames and ornaments", "market and shop", "craft and making", "food and drink", "objects and tools"],
    styles: ["minimal", "refined", "premium", "luxury", "elegant", "editorial"],
  },
  illustration: {
    templates: ["album-cover", "anime-poster", "event-post-set"],
    visualCategories: [
      "nature and plants",
      "animals",
      "people and hands",
      "places and buildings",
      "sky, sea and weather",
      "music and nightlife",
      "events and gatherings",
      "sport and play",
      "textures and grounds",
    ],
    styles: ["artistic", "doodle", "storytelling", "fantasy", "paper", "vintage", "kami"],
  },
  motion: {
    templates: ["motion-sting", "story-series"],
    visualCategories: ["shapes, lines and scribbles", "transport and travel", "sky, sea and weather", "textures and grounds"],
    styles: ["energetic", "dramatic", "futuristic", "gradient", "neon", "cosmic"],
  },
};

/** The designer who works from a template; Brand identity when no one lists it. */
export function designerForTemplate(templateId: string): SpecialistId {
  for (const id of Object.keys(designerMap) as SpecialistId[]) if (designerMap[id].templates.includes(templateId)) return id;
  return "brand";
}

/** Templates (real ones only) a designer works from, as portfolio records. */
export const templatesFor = (id: SpecialistId) => brandTemplates.filter((t) => designerForTemplate(t.id) === id);
