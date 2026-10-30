import { formatRatio, type Art, type ArtFormat, type ImageLayer, type LayerRole } from "../contracts";
import { assets as libraryAssets, type LibraryAsset, type BrandTemplate } from "./index";
import { libraryArtUrl, SHARED_FOR_USE, type LibraryArt } from "../libraryArt";
import { templateLayout } from "./layouts";
import { hasArt } from "./art";

/**
 * How a library asset or a template becomes part of a project. These build the
 * exact layers that will be saved, so the preview a person sees is the result,
 * not an approximation. Nothing here writes anything.
 */
const ROLE_FOR: Record<LibraryAsset["type"], LayerRole> = {
  texture: "texture",
  pattern: "ornament",
  "icon-set": "ornament",
  "mockup-pack": "subject",
  "sticker-pack": "ornament",
  "photo-pack": "subject",
  "type-specimen": "other",
  "template-pack": "other",
  palette: "other",
  "motion-pack": "other",
};

export const canUseAsset = (a: LibraryAsset) => (SHARED_FOR_USE as readonly string[]).includes(a.sharing.mode);

/** Studio's asset shelves. "yours" holds the person's own imports. */
export type Shelf = "textures" | "patterns" | "stickers" | "icons" | "yours";

/** Which shelf a pack sits on. Templates, motion packs and palettes are not pictures to place, so they have none. */
const SHELF_OF: Partial<Record<LibraryAsset["type"], Shelf>> = {
  texture: "textures",
  "photo-pack": "textures",
  pattern: "patterns",
  "sticker-pack": "stickers",
  "icon-set": "icons",
  "type-specimen": "icons",
};
export const shelfOf = (a: Pick<LibraryAsset, "type">): Shelf | undefined => SHELF_OF[a.type];

/** The packs Studio offers: shared for use by their makers, and something you place on a canvas. */
export const studioAssets = (all: readonly LibraryAsset[] = libraryAssets): LibraryAsset[] =>
  all.filter((a) => canUseAsset(a) && Boolean(shelfOf(a)));

const layerBase = (name: string, role: LayerRole, art: LibraryArt, box: Pick<ImageLayer, "x" | "y" | "width" | "height">): ImageLayer =>
  ({
    id: crypto.randomUUID(),
    name,
    role,
    asset: "dusk-study",
    libraryArt: art,
    ...box,
    opacity: 1,
    rotation: 0,
    visible: true,
    filter: "none",
  }) as ImageLayer;

/** The most of the canvas a newly added picture takes, in either direction. */
export const ADD_SHARE = 0.6;

/**
 * Where a newly added picture lands: centred, keeping its own shape, and no
 * larger than `share` of the canvas in either direction. `aspect` is the
 * picture's width over its height; the box is in percentages of the canvas.
 */
export function fitBox(format: ArtFormat | undefined, aspect: number, share = ADD_SHARE): Pick<ImageLayer, "x" | "y" | "width" | "height"> {
  const canvas = formatRatio[format ?? "poster"];
  const shape = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  // Widths are a share of the canvas width, heights a share of its height.
  let width = share * 100,
    height = share * 100;
  if (shape > canvas) height = ((share * canvas) / shape) * 100;
  else width = ((share * shape) / canvas) * 100;
  const r = (n: number) => Math.round(n * 10) / 10;
  width = Math.max(5, r(width));
  height = Math.max(5, r(height));
  return { x: r((100 - width) / 2), y: r((100 - height) / 2), width, height };
}

/** The shape of an asset's picture: a generated preview is 3:2, a drawn one 4:3. */
export const assetAspect = (asset: Pick<LibraryAsset, "id">) => (hasArt(`asset:${asset.id}`) ? 3 / 2 : 4 / 3);

/**
 * The layer for an asset: centred and sized to fit the canvas (see `fitBox`).
 * Textures sit softly over what is under them; everything else is placed as is.
 */
export function assetLayer(asset: LibraryAsset, existing: readonly ImageLayer[] = [], format?: ArtFormat): ImageLayer {
  const art: LibraryArt = { kind: "asset", id: asset.id };
  const role = ROLE_FOR[asset.type];
  const taken = new Set(existing.map((l) => l.name));
  let name = asset.name;
  for (let n = 2; taken.has(name); n++) name = `${asset.name} ${n}`;
  const layer = layerBase(name, role, art, fitBox(format, assetAspect(asset)));
  return asset.type === "texture" ? { ...layer, opacity: 0.45, blend: "multiply" } : layer;
}

/** The artwork with the asset layer added, for a preview or for saving. */
export function withAssetLayer(art: Art, asset: LibraryAsset): Art {
  return { ...art, layers: [...(art.layers ?? []), assetLayer(asset, art.layers ?? [], art.format)] };
}

export type StartChoice = { brand: string; palette: string[] };

/** Colour sets to start from: the template's own, then three others. */
export const paletteChoices = (t: BrandTemplate): { name: string; palette: string[] }[] => [
  { name: "Template", palette: padFour(t.palette) },
  { name: "Harbour", palette: ["#14213d", "#fca311", "#f3ecd8", "#3f7f93"] },
  { name: "Garden", palette: ["#2d6a4f", "#f1e7c8", "#d4a373", "#264653"] },
  { name: "Signal", palette: ["#ff3d71", "#101935", "#fff1b8", "#00d1b2"] },
];

export function padFour(p: readonly string[]): string[] {
  return [...p, ...p, ...p, ...p].slice(0, 4);
}

/** Positions for 1 to 4 scenes on the poster, below the title. */
const SLOTS: Record<number, { x: number; y: number; w: number; h: number }[]> = {
  1: [{ x: 6, y: 36, w: 88, h: 50 }],
  2: [
    { x: 6, y: 34, w: 88, h: 30 },
    { x: 6, y: 66, w: 88, h: 30 },
  ],
  3: [
    { x: 6, y: 34, w: 88, h: 30 },
    { x: 6, y: 66, w: 43, h: 29 },
    { x: 51, y: 66, w: 43, h: 29 },
  ],
  4: [
    { x: 5, y: 34, w: 44, h: 30 },
    { x: 51, y: 34, w: 44, h: 30 },
    { x: 5, y: 66, w: 44, h: 30 },
    { x: 51, y: 66, w: 44, h: 30 },
  ],
};

/**
 * The poster a template starts: the brand name as the title and each product
 * scene as a layer drawn for that brand and those colours. A template with no
 * product scenes (a brand board, a logo sting) starts with the title only.
 */
export function templateStartArt(t: BrandTemplate, base: Art, choice: StartChoice, variant = 0): Art {
  const layout = templateLayout(t.id, choice, variant);
  if (layout) return { ...base, backgroundMediaId: null, ...layout };
  const scenes = t.scenes.slice(0, 4);
  const slots = SLOTS[scenes.length] ?? [];
  const layers = scenes.map((scene, i) =>
    layerBase(
      `${scene[0].toUpperCase()}${scene.slice(1)} mockup`,
      "subject",
      { kind: "scene", template: t.id, scene: scene as never, brand: choice.brand, palette: padFour(choice.palette) },
      { x: slots[i].x, y: slots[i].y, width: slots[i].w, height: slots[i].h },
    ),
  );
  const brand = choice.brand.slice(0, 40);
  return {
    ...base,
    // A quiet grey paper, so the brand's own colours carry the poster.
    asset: "folded-paper",
    backgroundMediaId: null,
    backgroundFilter: "grayscale",
    backgroundOpacity: 1,
    title: brand,
    caption: `${t.name.toUpperCase()} /\nTEMPLATE`,
    captionVisible: false,
    color: padFour(choice.palette)[0],
    // Long names get smaller so the name stays on one line above the products.
    size: Math.max(9, Math.min(18, Math.round(170 / Math.max(1, brand.length)))),
    x: 6,
    y: 6,
    layers,
  };
}

export const sceneUrl = (t: BrandTemplate, scene: string, choice: StartChoice) =>
  libraryArtUrl({ kind: "scene", template: t.id, scene: scene as never, brand: choice.brand, palette: padFour(choice.palette) });

/** Why a brand name cannot be used, or null. */
export function brandProblem(brand: string): string | null {
  const b = brand.trim();
  if (!b) return "Give your brand a name.";
  if (b.length > 24) return "Keep the name to 24 characters.";
  if (!/^[A-Za-z0-9][A-Za-z0-9 &'.-]*$/.test(b)) return "Use letters, numbers, spaces and & ' . - only.";
  return null;
}
