import {
  useLayoutEffect,
  useState,
  type PointerEvent,
  type RefObject,
} from "react";
import {
  handles,
  visibleHandleSpots,
  type Box,
  type Canvas,
  type Guide,
  type Handle,
} from "./transform";

/** The canvas size in pixels, kept current as the window or layout changes. */
function useCanvasSize(ref: RefObject<HTMLElement | null>): Canvas | null {
  const [size, setSize] = useState<Canvas | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      setSize((old) =>
        old && old.width === r.width && old.height === r.height
          ? old
          : { width: r.width, height: r.height },
      );
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

function coarsePointer() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches
  );
}
const FALLBACK: Record<Handle, [number, number]> = {
  nw: [0, 0],
  n: [50, 0],
  ne: [100, 0],
  e: [100, 50],
  se: [100, 100],
  s: [50, 100],
  sw: [0, 100],
  w: [0, 50],
};
const cursor: Record<Handle, string> = {
  nw: "nwse-resize",
  n: "ns-resize",
  ne: "nesw-resize",
  e: "ew-resize",
  se: "nwse-resize",
  s: "ns-resize",
  sw: "nesw-resize",
  w: "ew-resize",
};
const names: Record<Handle, string> = {
  nw: "top left",
  n: "top",
  ne: "top right",
  e: "right",
  se: "bottom right",
  s: "bottom",
  sw: "bottom left",
  w: "left",
};

type Events = {
  onMove: (e: PointerEvent<HTMLElement>) => void;
  onUp: (e: PointerEvent<HTMLElement>) => void;
};

/**
 * Handles drawn over the selected image layer: eight to resize and one above
 * the top edge to rotate. They turn with the layer. The box is the layer's own
 * position, size and rotation in percent of the canvas. Pointer work happens
 * in the editor; keyboard users change the same numbers in the Layers panel.
 */
export function LayerHandles({
  box,
  canvasRef,
  onResizeStart,
  onRotateStart,
  onMove,
  onUp,
}: {
  box: Box;
  canvasRef: RefObject<HTMLElement | null>;
  onResizeStart: (handle: Handle, e: PointerEvent<HTMLElement>) => void;
  onRotateStart: (e: PointerEvent<HTMLElement>) => void;
} & Events) {
  const canvas = useCanvasSize(canvasRef);
  const coarse = coarsePointer();
  // Handles of a layer that reaches past the canvas are drawn back inside it
  // so they stay on screen; the layer's stored geometry is not touched.
  const visible = canvas
    ? visibleHandleSpots(box, canvas, coarse ? 14 : 9, coarse ? 44 : 34)
    : null;
  return (
    <div className="layer-handles-clip">
      <div
        className="layer-handles"
        style={{
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${box.width}%`,
          height: `${box.height}%`,
          transform: `rotate(${box.rotation}deg)`,
        }}
      >
        {!visible?.rotateMoved && (
          <span className="layer-rotate-stem" aria-hidden="true" />
        )}
        <span
          className="layer-handle layer-rotate-handle"
          data-handle="rotate"
          style={
            visible?.rotateMoved
              ? {
                  left: `${visible.rotate.left}%`,
                  top: `${visible.rotate.top}%`,
                }
              : undefined
          }
          title="Rotate (hold Shift for 15 degree steps)"
          aria-label="Rotate layer by dragging; use the Layers panel for exact angles"
          onPointerDown={onRotateStart}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
        {handles.map((h) => (
          <span
            key={h}
            className="layer-handle"
            data-handle={h}
            title={`Resize from the ${names[h]} (Shift frees the ratio on corners, Alt resizes from the centre)`}
            aria-label={`Resize layer from the ${names[h]} by dragging`}
            style={{
              left: `${visible?.spots[h].left ?? FALLBACK[h][0]}%`,
              top: `${visible?.spots[h].top ?? FALLBACK[h][1]}%`,
              cursor: cursor[h],
            }}
            onPointerDown={(e) => onResizeStart(h, e)}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          />
        ))}
      </div>
    </div>
  );
}

/** Thin lines that appear while a drag lines up with an edge, a centre or another layer. */
export function SnapGuides({ guides }: { guides: Guide[] }) {
  return (
    <>
      {guides.map((g) => (
        <span
          key={`${g.axis}-${g.at}`}
          className={`snap-guide snap-${g.axis}`}
          style={g.axis === "x" ? { left: `${g.at}%` } : { top: `${g.at}%` }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}
