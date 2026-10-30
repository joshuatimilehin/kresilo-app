import data from "./packs.json";
import type { BrandTemplate } from "../portfolio/types";
import type { Pack } from "./types";

/** The template packs, as saved in packs.json. */
export const packs: readonly Pack[] = data as unknown as Pack[];

export const packById = (id: string, list: readonly Pack[] = packs): Pack | undefined => list.find((p) => p.id === id);

/** How many layouts a pack holds, for pickers. */
export const layoutCount = (pack: Pack) => pack.layouts.length;

/** A pack as a template, so the template pages, Studio and the start dialog treat it like any other. */
export function packTemplate(pack: Pack): BrandTemplate {
  const ui = pack.subtype === "ui-ux";
  return {
    id: pack.id,
    name: pack.title,
    kind: ui ? "ui-kit" : "brand-board",
    description: pack.about,
    slots: [
      { id: "name", label: "Brand name", kind: "wordmark" },
      { id: "colours", label: "Four colours", kind: "colour" },
    ],
    scenes: [],
    palette: pack.palette,
    outputs: ["png"],
    howToUse: ["Name the brand and pick colours.", ui ? "Open a screen and change any part of it." : "Open a sheet and change any part of it."],
  };
}

export const packTemplates: readonly BrandTemplate[] = packs.map(packTemplate);
