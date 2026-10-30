/**
 * Kresilo's own visual library: pictures made ahead of time and recoloured to
 * each project's palette, so Studio can place "a hand-drawn loaf" in the
 * project's colours without generating anything while the person waits.
 *
 * Every file is a JPEG in public/assets/kresilo/visuals/<id>.jpg, made by us
 * (marked as AI-made wherever it shows). How a visual takes colour depends on
 * its kind:
 *
 *  - ink:     one-colour artwork, black on pure white. Rendered with the white
 *             made transparent and the black painted in one palette colour
 *             (slot "ink"). Icons, spot illustrations, badges, scribbles.
 *  - duotone: a full-range black-and-white picture (photo, texture, tonal
 *             illustration). Rendered through a gradient map: shadows take
 *             slot "ink", highlights take slot "ground". Photos, skies, paper.
 *
 * Colours come from the project (its Style's fg/accent/bg/surface, or the
 * title colour and canvas colour), or the person picks them; a layer stores
 * the hex it was given.
 */
export type VisualKind = "ink" | "duotone";

export const visualCategories = [
  "food and drink",
  "market and shop",
  "music and nightlife",
  "events and gatherings",
  "nature and plants",
  "sky, sea and weather",
  "places and buildings",
  "transport and travel",
  "objects and tools",
  "craft and making",
  "people and hands",
  "animals",
  "sport and play",
  "tech and screens",
  "badges, frames and ornaments",
  "shapes, lines and scribbles",
  "textures and grounds",
] as const;
export type VisualCategory = (typeof visualCategories)[number];

export type Visual = {
  /** Stable kebab-case id; also the file name. */
  id: string;
  kind: VisualKind;
  category: VisualCategory;
  /** Two to five words, shown under the thumbnail: "Hand-drawn loaf". */
  title: string;
  /** One plain sentence of what is in the picture and its hand (line, brush, linocut, photo…). */
  about: string;
  /**
   * The meanings it can serve, for matching by sense rather than by word:
   * the thing itself, what it stands for, occasions, moods and the kinds of
   * brief it suits (for "loaf": bread, bakery, baking, breakfast, warmth,
   * home-made, opening day, café menu, farmers market…). 8 to 20 entries.
   */
  concepts: string[];
  /** The hand it is drawn in, so a project can keep one consistent hand. */
  hand: "line" | "brush" | "linocut" | "stipple" | "geometric" | "photo" | "texture";
  /** How it sits: portrait, landscape or square, for placing it sized to fit. */
  shape: "portrait" | "landscape" | "square";
};

/** The two colour slots a placed visual carries. */
export type VisualColours = { ink: string; ground?: string };

/** Where a visual's file lives. */
export const visualFile = (id: string) => `/assets/kresilo/visuals/${id}.jpg`;
