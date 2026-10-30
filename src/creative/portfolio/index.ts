import { caseStudies } from "./projects";
import { libraryAssets, type AssetSeed } from "./assets";
import { brandTemplates, mockupScenes } from "./templates";
import type { AssetType, CaseKind, CaseStudy, CaseTheme, LibraryAsset, SharingMode, TemplateKind } from "./types";

export { caseStudies, brandTemplates, mockupScenes };
export type { CaseStudy, LibraryAsset, BrandTemplate, CaseKind, CaseTheme, AssetType, SharingMode, TemplateKind } from "./types";
export type { MockupScene } from "./templates";

/** Assets with `usedIn` filled from the case studies that list them, so the two sides never disagree. */
export const assets: readonly LibraryAsset[] = libraryAssets.map((a: AssetSeed) => ({
  ...a,
  usedIn: caseStudies.filter((c) => c.assetsUsed.includes(a.id)).map((c) => c.id),
}));

export const projectById = (id: string) => caseStudies.find((c) => c.id === id);
export const assetById = (id: string) => assets.find((a) => a.id === id);
export const templateById = (id: string) => brandTemplates.find((t) => t.id === id);

export const projectsByMaker = (makerId: string) => caseStudies.filter((c) => c.makerId === makerId);
export const assetsByMaker = (makerId: string) => assets.filter((a) => a.makerId === makerId);

/** The case studies that used an asset, and the assets a case study used. */
export const projectsUsing = (assetId: string) =>
  caseStudies.filter((c) => c.assetsUsed.includes(assetId));
export const assetsIn = (project: CaseStudy) =>
  project.assetsUsed.map((id) => assetById(id)).filter((a): a is LibraryAsset => Boolean(a));

export const caseKindLabel: Record<CaseKind, string> = {
  "brand-identity": "Brand identity",
  packaging: "Packaging",
  campaign: "Campaign",
  "ui-ux": "UI and UX",
  presentation: "Presentation",
  motion: "Motion",
  editorial: "Editorial",
  spatial: "Spatial design",
  photography: "Photography",
  lettering: "Lettering",
};

export const themeLabel: Record<CaseTheme, string> = {
  company: "Company",
  brand: "Brand",
  culture: "Culture",
  identity: "Identity",
  empowerment: "Empowerment",
  education: "Education",
  product: "Product",
  place: "Place",
  technology: "Technology",
  story: "Story",
};

export const assetTypeLabel: Record<AssetType, string> = {
  texture: "Textures",
  pattern: "Patterns",
  "icon-set": "Icon set",
  "type-specimen": "Type",
  palette: "Palette",
  "template-pack": "Template pack",
  "photo-pack": "Photo pack",
  "motion-pack": "Motion pack",
  "mockup-pack": "Mockups",
  "sticker-pack": "Sticker pack",
};

export const templateKindLabel: Record<TemplateKind, string> = {
  "brand-board": "Brand board",
  "logo-presentation": "Logo presentation",
  "packaging-set": "Packaging",
  stationery: "Stationery",
  "social-kit": "Social kit",
  deck: "Deck",
  "motion-sting": "Motion",
  "ui-kit": "UI kit",
  "cover-art": "Cover art",
  poster: "Poster",
};

export const sharingLabel: Record<SharingMode, string> = {
  free: "Free to use",
  "free-with-credit": "Free with credit",
  "on-request": "Ask the maker",
  "not-shared": "Not shared",
};

/** One plain sentence on what a person may do with an asset. */
export function sharingSentence(a: LibraryAsset): string {
  const s = a.sharing;
  if (s.mode === "not-shared") return "The maker keeps this set private. It is shown here only as part of their projects.";
  const parts = [s.terms];
  if (s.mode === "free-with-credit" && !/credit/i.test(s.terms)) parts.push("Credit the maker.");
  return parts.join(" ");
}

/** What the AI did in a project, in words a visitor understands. */
export const aiHelpLabel = {
  none: "No AI was used",
  assisted: "AI-assisted, chosen and finished by hand",
  generated: "Partly AI-generated, and labelled",
} as const;
