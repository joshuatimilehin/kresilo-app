import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowCounterClockwise, Check, X } from "@phosphor-icons/react";
import type { PathMark } from "./contracts";
import { strokePath } from "./marks";

export type Stroke = PathMark["strokes"][number];

/** Brush colours and sizes (size is hundredths of the canvas width). */
export const BRUSH_COLOURS = ["#111111", "#F2F1ED", "#FF6B5B", "#C7FE02", "#8B5CF8", "#2F7D6D"];
export const BRUSH_SIZES = [0.6, 1.4, 3];
const MAX_POINTS = 300;

/**
 * Drawing on the canvas: a surface over the artwork that turns each drag into
 * a stroke. Points are percent of the canvas, so the drawing scales with it.
 */
export function DrawSurface({
  strokes,
  color,
  size,
  onStroke,
}: {
  strokes: Stroke[];
  color: string;
  size: number;
  onStroke: (s: Stroke) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState<[number, number][] | null>(null);
  const at = (e: ReactPointerEvent): [number, number] => {
    const r = box.current!.getBoundingClientRect();
    const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v * 100) / 100));
    return [clamp(((e.clientX - r.left) / r.width) * 100), clamp(((e.clientY - r.top) / r.height) * 100)];
  };
  return (
    <div
      ref={box}
      className="draw-surface"
      aria-label="Drawing surface"
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        setLive([at(e)]);
      }}
      onPointerMove={(e) => {
        if (!live || live.length >= MAX_POINTS) return;
        const p = at(e);
        const last = live[live.length - 1];
        // Skip tiny moves so long strokes stay within the point budget.
        if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.35) return;
        setLive([...live, p]);
      }}
      onPointerUp={() => {
        if (live) onStroke({ points: live, color, size });
        setLive(null);
      }}
      onPointerCancel={() => setLive(null)}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true">
        {[...strokes, ...(live ? [{ points: live, color, size }] : [])].map((s, i) => (
          <path
            key={i}
            d={strokePath(s.points)}
            stroke={s.color}
            style={{ strokeWidth: `${s.size}cqw` }}
            vectorEffect="non-scaling-stroke"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </div>
  );
}

/** The drawing tools: colour, size, undo a stroke, cancel, done. */
export function DrawBar({
  color,
  size,
  strokes,
  busy,
  onColor,
  onSize,
  onUndo,
  onCancel,
  onDone,
}: {
  color: string;
  size: number;
  strokes: number;
  busy: boolean;
  onColor: (c: string) => void;
  onSize: (s: number) => void;
  onUndo: () => void;
  onCancel: () => void;
  onDone: () => void;
}) {
  return (
    <div className="draw-bar" role="toolbar" aria-label="Drawing">
      <div className="draw-colours" role="radiogroup" aria-label="Brush colour">
        {BRUSH_COLOURS.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={`Colour ${c}`} style={{ background: c }} onClick={() => onColor(c)} />
        ))}
      </div>
      <div className="draw-sizes" role="radiogroup" aria-label="Brush size">
        {BRUSH_SIZES.map((s) => (
          <button key={s} type="button" role="radio" aria-checked={size === s} aria-label={`Size ${s}`} onClick={() => onSize(s)}>
            <i style={{ width: `${4 + s * 4}px`, height: `${4 + s * 4}px` }} />
          </button>
        ))}
      </div>
      <button type="button" aria-label="Undo the last stroke" title="Undo the last stroke" disabled={!strokes} onClick={onUndo}>
        <ArrowCounterClockwise size={20} />
      </button>
      <button type="button" aria-label="Stop drawing without saving" title="Cancel" onClick={onCancel}>
        <X size={20} />
      </button>
      <button type="button" className="draw-done" aria-label="Keep the drawing" title="Done" disabled={!strokes || busy} onClick={onDone}>
        <Check size={20} />
      </button>
    </div>
  );
}
