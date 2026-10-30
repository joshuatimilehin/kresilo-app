import data from "./styles.json";
import { defaultTitleType, type Art } from "../contracts";

/**
 * Design styles from Open Design (Apache-2.0), vetted for Kresilo: generic
 * looks only, none named after a company, product or person. A project picks
 * one in Studio; the assistant follows its palette, type and rules.
 * Rebuilt by scripts/open-design-styles.ts.
 */
export type DesignStyle = {
  id: string;
  name: string;
  category: string;
  summary: string;
  palette: { bg: string; surface: string; fg: string; muted: string; border: string; accent: string };
  fonts: { display: string; body: string };
  rules: string;
  credit: string;
};

export const designStyles: readonly DesignStyle[] = data;

export const styleById = (id: string | null | undefined) => (id ? designStyles.find((s) => s.id === id) : undefined);

const SERIF = /georgia|gelasio|charter|serif|playfair|garamond|baskerville|bodoni|times|lora|merriweather|fraunces|instrument/i;

/** Which of Kresilo's two title faces is closest to the style's display type. */
export const styleTitleFont = (s: DesignStyle): "poster" | "sans" => (SERIF.test(s.fonts.display) ? "poster" : "sans");

/**
 * Picking a style is one save: the style, its background and ink, and the
 * nearest title face, keeping the rest of how the title is set.
 */
export const styleArtPatch = (s: DesignStyle, art: Pick<Art, "titleType">): Partial<Art> => ({
  style: s.id,
  canvasColor: s.palette.bg,
  color: s.palette.fg,
  titleType: { ...(art.titleType ?? defaultTitleType), font: styleTitleFont(s) },
});

/** What the assistant is told about the chosen style. */
export const styleForAssistant = (s: DesignStyle) => ({
  name: s.name,
  mood: s.summary,
  palette: s.palette,
  titleFace: styleTitleFont(s),
  rules: s.rules,
});
