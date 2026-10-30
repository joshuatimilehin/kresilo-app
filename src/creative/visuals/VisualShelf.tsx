import { useMemo, useState, type ReactNode } from "react";
import { CaretDown, ForkKnife, Hammer, Leaf, MagnifyingGlass, MapTrifold, MusicNotes, Plus, Shapes } from "@phosphor-icons/react";
import type { Art } from "../contracts";
import { coloursFor, paletteFor } from "./palette";
import { visualDefsMarkup, visualFilterId } from "./colour";
import { findVisuals, visualGroups, type VisualGroupId } from "./find";
import { visuals as library } from "./library";
import { visualFile, type Visual } from "./types";

/**
 * The Visuals tab of Studio's assets: the library's pictures drawn already
 * recoloured in the project's own palette (ink pictures in the title colour on
 * the canvas colour, duotones from shadow to highlight), six icon chips to
 * narrow them, and a "+" on each to place it. The thumbnails use the same SVG
 * filter the canvas does, so what the tile shows is what lands.
 */
const GROUP_ICON: Record<VisualGroupId, ReactNode> = {
  food: <ForkKnife size={20} />,
  life: <MusicNotes size={20} />,
  nature: <Leaf size={20} />,
  places: <MapTrifold size={20} />,
  things: <Hammer size={20} />,
  marks: <Shapes size={20} />,
};

const PAGE = 48;
// The panel remounts when the selection changes; keep the chip the person was on.
let lastGroup: VisualGroupId | null = null;

export function VisualShelf({
  art,
  query,
  busy,
  full,
  addLabel,
  onAdd,
  chips = true,
  limit,
  list = library,
}: {
  art: Pick<Art, "style" | "color" | "canvasColor">;
  query: string;
  busy: boolean;
  full: boolean;
  addLabel: (name: string) => string;
  onAdd: (v: Visual) => void;
  /** Whether to show the group chips (the Visuals tab) or only matches (a search from another tab). */
  chips?: boolean;
  /** Show at most this many matches, with no "more". */
  limit?: number;
  list?: readonly Visual[];
}) {
  const [group, setGroupState] = useState<VisualGroupId | null>(lastGroup);
  const [shown, setShown] = useState(PAGE);
  const setGroup = (g: VisualGroupId | null) => {
    lastGroup = g;
    setGroupState(g);
    setShown(PAGE);
  };
  const found = useMemo(() => findVisuals(list, { query, group: chips ? group : null }), [list, query, group, chips]);
  const rows = found.slice(0, limit ?? shown);
  const ink = paletteFor({ art }, "ink"),
    duo = paletteFor({ art }, "duotone");
  const defs = visualDefsMarkup([coloursFor("ink", ink), coloursFor("duotone", duo)]);
  const filterOf = (v: Visual) => `url(#${visualFilterId(coloursFor(v.kind, v.kind === "duotone" ? duo : ink))})`;

  return (
    <>
      <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: defs }} />
      {chips && (
        <div className="visual-chips" role="group" aria-label="Kinds of picture">
          {visualGroups.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={group === g.id}
              aria-label={g.label}
              title={g.label}
              onClick={() => setGroup(group === g.id ? null : g.id)}
            >
              {GROUP_ICON[g.id]}
            </button>
          ))}
        </div>
      )}
      {rows.map((v) => (
        <figure key={v.id} className="asset-tile visual-tile">
          <div className="visual-thumb" style={v.kind === "ink" ? { background: ink.ground } : undefined}>
            <img src={visualFile(v.id)} alt="" loading="lazy" decoding="async" style={{ filter: filterOf(v) }} />
          </div>
          <figcaption>{v.title}</figcaption>
          <span className="asset-tile-actions">
            <button type="button" className="asset-add" disabled={busy || full} aria-label={addLabel(v.title)} title={addLabel(v.title)} onClick={() => onAdd(v)}>
              <Plus size={18} weight="bold" />
            </button>
          </span>
        </figure>
      ))}
      {chips && !rows.length && (
        <span className="visual-empty" role="img" aria-label="No pictures found">
          <MagnifyingGlass size={28} />
        </span>
      )}
      {limit === undefined && found.length > shown && (
        <button type="button" className="visual-more" aria-label="Show more pictures" title="Show more" onClick={() => setShown(shown + PAGE)}>
          <CaretDown size={20} />
        </button>
      )}
    </>
  );
}
