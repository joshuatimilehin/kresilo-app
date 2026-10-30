import type { ArtFormat } from "../contracts";

/**
 * Template packs: UI/UX screens and brand-identity sheets that open in Studio
 * as editable layouts. The concept of each pack (what it is for, the screens
 * or sheets it holds, its style) comes from the saved pack concepts; the look,
 * palette, copy and pictures are written for it here (packs.json).
 */
export type PackSubtype = "ui-ux" | "brand-identity";

/** Screens: phone ones are tall (9:16), desktop ones wide (16:9). */
export const PHONE_KINDS = ["welcome", "list", "detail", "choice", "wheel", "summary", "confirm", "pass", "stamps", "form", "board"] as const;
export const DESKTOP_KINDS = ["site-home", "site-grid", "site-detail", "dashboard"] as const;
/** Sheets: a logo sheet, a palette, a type specimen, a business card, a poster, a social post and a label. */
export const BRAND_KINDS = ["logo", "palette", "type", "card", "poster", "social", "label"] as const;

export type PhoneKind = (typeof PHONE_KINDS)[number];
export type DesktopKind = (typeof DESKTOP_KINDS)[number];
export type BrandKind = (typeof BRAND_KINDS)[number];
export type LayoutKind = PhoneKind | DesktopKind | BrandKind;

const BRAND_FORMAT: Record<BrandKind, ArtFormat> = { logo: "wide", palette: "poster", type: "poster", card: "wide", poster: "poster", social: "square", label: "square" };

/** The canvas each kind of layout is drawn on. */
export function formatOf(kind: LayoutKind): ArtFormat {
  if ((PHONE_KINDS as readonly string[]).includes(kind)) return "story";
  if ((DESKTOP_KINDS as readonly string[]).includes(kind)) return "wide";
  return BRAND_FORMAT[kind as BrandKind];
}

/** How a pack sets its type, corners and ground. Sizes are in hundredths of the canvas width. */
export type Look = {
  font: "sans" | "poster";
  /** Heading weight, 400 to 900. */
  weight: number;
  /** Corner radius of cards and buttons. */
  radius: number;
  /** Outline width in pixels; 0 for none. */
  edge: number;
  ground: "light" | "dark" | "accent";
  /** Small labels in capitals. */
  caps: boolean;
  /** A hard offset shadow under buttons. */
  shadow: boolean;
  italic: boolean;
};

export type PackLayoutSpec = { kind: LayoutKind; item: string };

export type Pack = {
  id: string;
  title: string;
  subtype: PackSubtype;
  industry: string;
  about: string;
  concepts: string[];
  /** The screens or sheets the concept describes. */
  items: string[];
  style: string;
  formats: string[];
  /** Four colours: the pack's own; a layout reads them as roles (see tones). */
  palette: string[];
  look: Look;
  tagline: string;
  /** Library pictures, in order of use; ink pictures only. */
  pictures: string[];
  /** The shape of each picture: s square, p portrait, l landscape (copied from the library so layouts never load it). */
  shapes: ("s" | "p" | "l")[];
  layouts: PackLayoutSpec[];
  /** UI packs. */
  cta?: string;
  rows?: [string, string][];
  value?: "price" | "time" | "date" | "count" | "none";
  /** Brand packs. */
  headline?: string;
  line?: string;
};
