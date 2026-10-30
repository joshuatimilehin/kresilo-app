import { useState } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { SHELF_ART } from "./canvasShelf";
import { VisualShelf } from "./visuals/VisualShelf";
import type { Visual } from "./visuals/types";

/** The picture shelf on the canvas: search, six icon chips, and a plus on each picture to place it. */
export function StudioShelf({ onPlace, onClose }: { onPlace: (v: Visual) => Promise<void>; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <aside className="sc-tray sc-shelf" aria-label="Pictures">
      <div className="sc-tray-bar sc-shelf-bar">
        <MagnifyingGlass size={20} aria-hidden="true" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search pictures" maxLength={60} autoComplete="off" />
        <button type="button" aria-label="Close pictures" title="Close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <div className="sc-shelf-grid">
        <VisualShelf
          art={SHELF_ART}
          query={query}
          busy={busy}
          full={false}
          addLabel={(name) => `Place ${name}`}
          onAdd={(v) => {
            setBusy(true);
            void onPlace(v).finally(() => setBusy(false));
          }}
        />
      </div>
    </aside>
  );
}
