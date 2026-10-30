/**
 * Runtime shapes for the bundled sample portfolio. They mirror the planned
 * models in src/models (CaseStudy, LibraryAsset, BrandTemplate); a test checks
 * every record here against those schemas, because the app itself may not
 * import from src/models until a model is promoted.
 */
export type CaseKind =
  | "brand-identity"
  | "packaging"
  | "campaign"
  | "ui-ux"
  | "presentation"
  | "motion"
  | "editorial"
  | "spatial"
  | "photography"
  | "lettering";

export type CaseTheme =
  | "company"
  | "brand"
  | "culture"
  | "identity"
  | "empowerment"
  | "education"
  | "product"
  | "place"
  | "technology"
  | "story";

export type PanelKind =
  | "hero"
  | "wordmark-pattern"
  | "logo"
  | "palette"
  | "type"
  | "mockup"
  | "series"
  | "device"
  | "slides"
  | "motion"
  | "quote"
  | "process";

export type AiHelp = "none" | "assisted" | "generated";

export type CasePanel = { kind: PanelKind; caption?: string; scene?: string };

export type CaseStudy = {
  id: string;
  makerId: string;
  title: string;
  client: { name: string; what: string };
  kind: CaseKind;
  themes: CaseTheme[];
  tagline: string;
  role: string;
  year: number;
  palette: string[];
  story: { brief: string; idea: string; outcome: string };
  panels: CasePanel[];
  assetsUsed: string[];
  templateId?: string;
  aiHelp: AiHelp;
  process: string;
};

export type AssetType =
  | "texture"
  | "pattern"
  | "icon-set"
  | "type-specimen"
  | "palette"
  | "template-pack"
  | "photo-pack"
  | "motion-pack"
  | "mockup-pack"
  | "sticker-pack";

export type SharingMode = "free" | "free-with-credit" | "on-request" | "not-shared";

export type LibraryAsset = {
  id: string;
  makerId: string;
  name: string;
  type: AssetType;
  description: string;
  count: number;
  formats: ("svg" | "png" | "jpg" | "webp" | "mp4" | "pdf" | "otf" | "html")[];
  tags: string[];
  preview: { palette: string[]; motif: string };
  sharing: { mode: SharingMode; terms: string; requiresCredit: boolean; commercialUse: boolean };
  howToUse: string[];
  usedIn: string[];
};

export type TemplateKind =
  | "brand-board"
  | "logo-presentation"
  | "packaging-set"
  | "stationery"
  | "social-kit"
  | "deck"
  | "motion-sting"
  | "ui-kit"
  | "cover-art"
  | "poster";

export type BrandTemplate = {
  id: string;
  name: string;
  kind: TemplateKind;
  description: string;
  slots: { id: string; label: string; kind: "logo" | "wordmark" | "colour" | "image" | "text" }[];
  scenes: string[];
  palette: string[];
  outputs: ("png" | "pdf" | "mp4" | "html")[];
  howToUse: string[];
};
