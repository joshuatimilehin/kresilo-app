import type { Art } from "../contracts";
import { styleById } from "../openDesign/styles";
import { contrastRatio, HEX, relativeLuminance } from "./colour";
import type { VisualColours, VisualKind } from "./types";

/** The canvas colour a project has before anyone sets one (the artwork's own default). */
export const DEFAULT_CANVAS = "#173e43";

export type VisualPalette = {
  ink: string;
  ground: string;
  /** The colours to offer: the Style's foreground, accent, background and surface, else the title and canvas colours. */
  swatches: string[];
};

const MIN_CONTRAST = 2;

const clean = (c: string | undefined, fallback: string) => (c && HEX.test(c) ? c.toLowerCase() : fallback);
const unique = (list: string[]) => [...new Set(list.map((c) => c.toLowerCase()))];

/**
 * Colours for a visual placed in a project. The default ink is the title
 * colour and the default ground is the canvas colour, so a new visual looks
 * like part of the piece. When the two are too close to read, the Style's
 * palette (or black or white) supplies a colour that does.
 *
 *  - ink visuals: ink is drawn on the canvas, so it must stand out from it.
 *  - duotone visuals: shadows take `ink` and highlights take `ground`; the
 *    darker of the two colours goes to the shadows, so a photo reads as a photo.
 */
export function paletteFor(project: { art: Pick<Art, "style" | "color" | "canvasColor"> }, kind: VisualKind = "ink"): VisualPalette {
  const art = project.art;
  const style = styleById(art.style);
  const title = clean(art.color, "#f2f1ed");
  const canvas = clean(art.canvasColor, DEFAULT_CANVAS);
  const swatches = unique(style ? [style.palette.fg, style.palette.accent, style.palette.bg, style.palette.surface] : [title, canvas]).filter((c) => HEX.test(c));
  const options = unique([title, canvas, ...swatches]);

  if (kind === "duotone") {
    let [a, b] = [title, canvas];
    if (contrastRatio(a, b) < MIN_CONTRAST) {
      let best = 0;
      for (const x of options)
        for (const y of options) {
          const r = contrastRatio(x, y);
          if (r > best) [a, b, best] = [x, y, r];
        }
    }
    const [dark, light] = relativeLuminance(a) <= relativeLuminance(b) ? [a, b] : [b, a];
    return { ink: dark, ground: light, swatches };
  }

  let ink = title;
  if (contrastRatio(ink, canvas) < MIN_CONTRAST) {
    const better = options.filter((c) => contrastRatio(c, canvas) >= MIN_CONTRAST).sort((x, y) => contrastRatio(y, canvas) - contrastRatio(x, canvas))[0];
    ink = better ?? (relativeLuminance(canvas) > 0.4 ? "#111111" : "#f2f1ed");
  }
  return { ink, ground: canvas, swatches };
}

/** The colours a new layer stores: ink visuals keep only `ink`, duotones keep both. */
export function coloursFor(kind: VisualKind, palette: Pick<VisualPalette, "ink" | "ground">): VisualColours {
  return kind === "duotone" ? { ink: palette.ink, ground: palette.ground } : { ink: palette.ink };
}
