import { useState, type ReactNode } from "react";
import { Checkerboard, Layout, MagnifyingGlass, PaintBrushBroad, Plus, SelectionBackground, SquaresFour, Sticker, UploadSimple, User, Waves } from "@phosphor-icons/react";
import { sharingLabel, type LibraryAsset } from "./portfolio";
import { assetLayer, fitBox, shelfOf, studioAssets, type Shelf } from "./portfolio/useInStudio";
import { UseAssetDialog } from "./portfolio/UseDialogs";
import { libraryArtUrl } from "./libraryArt";
import { makerById } from "./makers";
import { addImageLayer } from "./layers";
import { VisualShelf } from "./visuals/VisualShelf";
import { PackShelf } from "./packs/PackShelf";
import { visualLayer } from "./visuals/layer";
import { paletteFor } from "./visuals/palette";
import type { Visual } from "./visuals/types";
import type { Art, ProjectRecord } from "./contracts";

/**
 * Studio's assets: what a designer builds a piece from. The makers' shared
 * packs (textures, patterns, stickers, icons and lettering), Kresilo's own
 * visuals (pictures recoloured to the project's palette) and the person's
 * own imports. Other makers' finished works are references, not assets: they
 * are kept, with credit, through the reference picker and never land on the
 * canvas from here.
 *
 * Adding is always the "+" beside a picture: the layer lands centred, sized to
 * fit, and selected, and it is one saved change, so Undo takes it back. The
 * picture itself opens a preview with the pack's sharing terms. Only an import
 * can become the background, and only through its own button.
 */
/** The shelves are the makers' packs and your imports, plus Kresilo's own visuals (pictures recoloured to the project). */
type Tab = Shelf | "visuals" | "templates";
const SHELVES: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "textures", label: "Textures", icon: <Waves size={20} /> },
  { id: "patterns", label: "Patterns", icon: <Checkerboard size={20} /> },
  { id: "stickers", label: "Stickers", icon: <Sticker size={20} /> },
  { id: "icons", label: "Icons and lettering", icon: <SquaresFour size={20} /> },
  { id: "visuals", label: "Visuals", icon: <PaintBrushBroad size={20} /> },
  { id: "templates", label: "Templates", icon: <Layout size={20} /> },
  { id: "yours", label: "Yours", icon: <User size={20} /> },
];

const MAX_LAYERS = 12;
// The panel remounts when the selection changes; keep the shelf the person was on.
let lastShelf: Tab = "textures";

async function pictureAspect(src: string): Promise<number> {
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    return img.naturalWidth / img.naturalHeight || 1;
  } catch {
    return 1;
  }
}

export function AssetShelf({
  record,
  busy,
  save,
  onAdded,
  importReference,
}: {
  record: ProjectRecord;
  busy: boolean;
  save: (patch: Partial<Art>, opts?: { saved?: string }) => Promise<boolean>;
  /** The new layer's id, so it can be selected. */
  onAdded: (layerId: string) => void;
  importReference: () => void;
}) {
  const art = record.document.art;
  const [shelf, setShelfState] = useState<Tab>(lastShelf);
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<LibraryAsset | null>(null);
  const setShelf = (s: Tab) => {
    lastShelf = s;
    setShelfState(s);
  };
  const full = (art.layers?.length ?? 0) >= MAX_LAYERS;
  const q = query.trim().toLowerCase();
  // On the Visuals tab the search looks through the visuals only; elsewhere it looks through everything.
  const onVisuals = shelf === "visuals";
  const onTemplates = shelf === "templates";
  const packs = onVisuals || onTemplates
    ? []
    : studioAssets().filter((a) => (q ? `${a.name} ${a.tags.join(" ")} ${makerById(a.makerId)?.name ?? ""}`.toLowerCase().includes(q) : shelfOf(a) === shelf));
  const uploads = onVisuals || onTemplates
    ? []
    : record.document.references.filter((r) => r.mediaId && r.contentType !== "video/mp4" && (q ? r.title.toLowerCase().includes(q) : shelf === "yours"));

  async function addPack(a: LibraryAsset) {
    const layer = assetLayer(a, art.layers ?? [], art.format);
    if (await save({ layers: [...(art.layers ?? []), layer] }, { saved: `Added “${a.name}”.` })) onAdded(layer.id);
  }
  async function addVisual(v: Visual) {
    const layer = visualLayer(v, paletteFor(record.document, v.kind), art.layers ?? [], art.format);
    if (await save({ layers: [...(art.layers ?? []), layer] }, { saved: `Added “${v.title}”.` })) onAdded(layer.id);
  }
  async function addUpload(mediaId: string, title: string) {
    const box = fitBox(art.format, await pictureAspect(`/api/media/${mediaId}`));
    const layers = addImageLayer(art, { mediaId }, title, box);
    const added = layers.at(-1);
    if (added && (await save({ layers }, { saved: `Added “${added.name}”.` }))) onAdded(added.id);
  }
  const addLabel = (name: string) => (full ? `${MAX_LAYERS} layers is the most` : `Add ${name}`);

  return (
    <div className="asset-shelf">
      <div className="asset-shelf-tabs" role="tablist" aria-label="Asset kinds">
        {SHELVES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={shelf === s.id && (!q || s.id === "visuals" || s.id === "templates")}
            aria-label={s.label}
            onClick={() => {
              setQuery("");
              setShelf(s.id);
            }}
          >
            {s.icon}
          </button>
        ))}
      </div>
      <label className="asset-shelf-search">
        <MagnifyingGlass size={16} aria-hidden="true" />
        <input type="search" aria-label="Search assets" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <div className="asset-grid" role="tabpanel" aria-label={q && !onVisuals && !onTemplates ? "Search results" : SHELVES.find((s) => s.id === shelf)?.label}>
        {(q || shelf === "yours") && !onVisuals && !onTemplates && (
          <button type="button" className="asset-import" aria-label="Import an image or keep a reference" onClick={importReference}>
            <UploadSimple size={24} />
          </button>
        )}
        {uploads.map((r) => (
          <figure key={r.id} className="asset-tile">
            <img src={`/api/media/${r.mediaId}`} alt="" />
            <figcaption>{r.title}</figcaption>
            <span className="asset-tile-actions">
              <button
                type="button"
                className="asset-bg"
                disabled={busy}
                aria-label={`Use ${r.title} as the background`}
                onClick={() => void save({ backgroundMediaId: r.mediaId }, { saved: "Background changed." })}
              >
                <SelectionBackground size={18} />
              </button>
              <button type="button" className="asset-add" disabled={busy || full} aria-label={addLabel(r.title)} onClick={() => void addUpload(r.mediaId!, r.title)}>
                <Plus size={18} weight="bold" />
              </button>
            </span>
          </figure>
        ))}
        {packs.map((a) => {
          const maker = makerById(a.makerId);
          return (
            <figure key={a.id} className="asset-tile">
              <button type="button" className="asset-thumb" aria-label={`Preview ${a.name}, ${sharingLabel[a.sharing.mode]}`} onClick={() => setPreview(a)}>
                <img src={libraryArtUrl({ kind: "asset", id: a.id })} alt="" loading="lazy" />
              </button>
              <figcaption>
                {a.name}
                {a.sharing.requiresCredit && maker ? <small>{maker.name}</small> : null}
              </figcaption>
              <span className="asset-tile-actions">
                <button type="button" className="asset-add" disabled={busy || full} aria-label={addLabel(a.name)} onClick={() => void addPack(a)}>
                  <Plus size={18} weight="bold" />
                </button>
              </span>
            </figure>
          );
        })}
        {onTemplates && <PackShelf query={q} />}
        {(onVisuals || q) && !onTemplates && (
          <VisualShelf art={art} query={q} busy={busy} full={full} addLabel={addLabel} onAdd={(v) => void addVisual(v)} chips={onVisuals} limit={onVisuals ? undefined : 12} />
        )}
      </div>
      {preview && (
        <UseAssetDialog
          asset={preview}
          projectId={record.id}
          open
          onClose={() => setPreview(null)}
          onAdded={(p) => {
            const id = p.document.art.layers?.at(-1)?.id;
            if (id) onAdded(id);
          }}
        />
      )}
    </div>
  );
}
