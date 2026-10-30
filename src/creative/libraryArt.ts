import { z } from "zod";
import { assetById, templateById } from "./portfolio";
import { mockupScenes } from "./portfolio/templates";
import { makerById } from "./makers";
import { artSrc } from "./portfolio/art";

/**
 * A layer drawn from a library asset or a template scene, instead of a photo.
 * It is stored as a small description (which asset, or which scene with which
 * brand name and colours), and drawn on demand by the same code that draws the
 * sample portfolio. Because it is a description and not an upload, a post that
 * uses one can be published, and it always carries its credit.
 *
 * Rules the command service enforces with these helpers:
 *  - only assets their maker shares for use (free, or free with credit) may be placed;
 *  - placing one credits the maker automatically, with the sharing terms as the reason;
 *  - a template scene credits the template.
 */
const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
export const BRAND_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 &'.-]{0,23}$/;

export const libraryArtSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("asset"), id: z.string().regex(/^[a-z0-9-]{1,60}$/) }).strict(),
  z
    .object({
      kind: z.literal("scene"),
      template: z.string().regex(/^[a-z0-9-]{1,60}$/),
      scene: z.enum(mockupScenes),
      brand: z.string().regex(BRAND_PATTERN),
      palette: z.array(hex).length(4),
    })
    .strict(),
]);
export type LibraryArt = z.infer<typeof libraryArtSchema>;

/** Where a layer's picture is drawn. Public: sample libraries and templates are not private. */
export function libraryArtUrl(art: LibraryArt): string {
  // A pack's generated preview when there is one, as a real picture; otherwise its drawing.
  if (art.kind === "asset") return artSrc(`asset:${art.id}`) ?? `/api/library-art/asset/${art.id}`;
  const p = art.palette.map((c) => c.slice(1).toLowerCase()).join("-");
  return `/api/library-art/scene?t=${art.template}&s=${art.scene}&b=${encodeURIComponent(art.brand)}&p=${p}`;
}

/** Reads a scene URL's query back into a `LibraryArt`, or null if anything is off. */
export function sceneFromQuery(q: Record<string, unknown>): LibraryArt | null {
  const raw = {
    kind: "scene" as const,
    template: String(q.t ?? ""),
    scene: String(q.s ?? ""),
    brand: String(q.b ?? ""),
    palette: String(q.p ?? "")
      .split("-")
      .map((c) => `#${c}`),
  };
  const parsed = libraryArtSchema.safeParse(raw);
  if (!parsed.success) return null;
  return templateById(parsed.data.kind === "scene" ? parsed.data.template : "") ? parsed.data : null;
}

export const SHARED_FOR_USE = ["free", "free-with-credit"] as const;

export type LibraryCheck =
  | { ok: true; credits: { workId: string; title: string; creator: string; source: string; reason: string; tags: string[] }[] }
  | { ok: false; message: string };

/**
 * Checks the library layers of an artwork and says whose credit they carry.
 * A missing asset or template, or an asset its maker has not shared for use,
 * refuses the whole edit.
 */
export function checkLibraryLayers(layers: readonly { libraryArt?: LibraryArt | null }[] | undefined): LibraryCheck {
  const credits: Extract<LibraryCheck, { ok: true }>["credits"] = [];
  const seen = new Set<string>();
  for (const l of layers ?? []) {
    const art = l.libraryArt;
    if (!art) continue;
    if (art.kind === "asset") {
      const asset = assetById(art.id);
      if (!asset) return { ok: false, message: "That asset library is not available." };
      if (!(SHARED_FOR_USE as readonly string[]).includes(asset.sharing.mode))
        return { ok: false, message: `${asset.name} is not shared for use. Ask the maker first.` };
      const key = `lib:${asset.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const maker = makerById(asset.makerId);
      credits.push({
        workId: key,
        title: asset.name,
        creator: maker?.name ?? "Unknown maker",
        source: `/assets/${asset.id}`,
        reason: `Used from the asset library “${asset.name}”. ${asset.sharing.terms}`.slice(0, 600),
        tags: asset.tags.slice(0, 4),
      });
    } else {
      const template = templateById(art.template);
      if (!template || !template.scenes.includes(art.scene))
        return { ok: false, message: "That template scene is not available." };
      const key = `tpl:${template.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      credits.push({
        workId: key,
        title: template.name,
        creator: "Kresilo",
        source: `/templates/${template.id}`,
        reason: `Started from the Kresilo template “${template.name}”.`,
        tags: [template.kind],
      });
    }
  }
  return { ok: true, credits };
}
