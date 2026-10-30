import { useEffect, useRef, useState } from "react";
import { Drop, PaintBucket } from "@phosphor-icons/react";
import type { Art, ImageLayer } from "../contracts";
import { visualById } from "./library";

/**
 * The colours of a selected visual: one swatch for the ink, and for a duotone
 * a second for the ground (the highlights). They use the same colour control as
 * the rest of Studio. A change is one saved version, so Undo takes it back;
 * dragging through the picker saves once it settles, not on every step.
 */
const SETTLE_MS = 400;

export function VisualColourControls({
  layer,
  save,
  art,
  busy,
}: {
  layer: ImageLayer;
  art: Pick<Art, "layers">;
  busy: boolean;
  save: (patch: Partial<Art>, opts?: { saved?: string }) => Promise<boolean>;
}) {
  const visual = layer.visual!;
  const [ink, setInk] = useState(visual.ink);
  const [ground, setGround] = useState(visual.ground);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef<(() => void) | null>(null);
  const flush = () => {
    clearTimeout(timer.current);
    const run = pending.current;
    pending.current = null;
    run?.();
  };
  useEffect(() => {
    setInk(visual.ink);
    setGround(visual.ground);
  }, [layer.id, visual.ink, visual.ground]);
  // Leaving the layer within the settle time still keeps the colour.
  useEffect(() => flush, []);
  // A duotone has a ground; an ink picture has only ink. A picture no longer in the library follows what it stores.
  const duotone = visualById(visual.id)?.kind === "duotone" || (!visualById(visual.id) && Boolean(visual.ground));

  function change(next: { ink: string; ground?: string }) {
    setInk(next.ink);
    setGround(next.ground);
    clearTimeout(timer.current);
    pending.current = () => {
      const layers = (art.layers ?? []).map((l) => (l.id === layer.id ? { ...l, visual: { id: visual.id, ink: next.ink, ...(next.ground ? { ground: next.ground } : {}) } } : l));
      void save({ layers });
    };
    timer.current = setTimeout(flush, SETTLE_MS);
  }

  return (
    <div className="visual-colours" role="group" aria-label="Picture colours">
      <label className="visual-swatch" title="Ink">
        <Drop size={20} weight="fill" aria-hidden="true" />
        <input type="color" aria-label="Ink colour" disabled={busy} value={ink} onChange={(e) => change({ ink: e.target.value, ground })} />
      </label>
      {duotone && (
        <label className="visual-swatch" title="Ground">
          <PaintBucket size={20} weight="fill" aria-hidden="true" />
          <input type="color" aria-label="Ground colour" disabled={busy} value={ground ?? "#ffffff"} onChange={(e) => change({ ink, ground: e.target.value })} />
        </label>
      )}
    </div>
  );
}
