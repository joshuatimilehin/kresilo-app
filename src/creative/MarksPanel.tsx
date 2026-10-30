import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Trash, PencilLine, Sticker } from "@phosphor-icons/react";
import { Action } from "./primitives";
import { MAX_MARKS, titleAligns, type Mark, type TitleType } from "./contracts";
import {
  addMark,
  describeMark,
  markKindLabel,
  moveMark,
  removeMark,
  updateMark,
  type MarkKind,
} from "./marks";
import type { HelpMode } from "./tools";

const num = (e: { target: { value: string } }) => Number(e.target.value);

function Field({ label, value, children }: { label: string; value?: string | number; children: React.ReactNode }) {
  return (
    <label className="field-label range-label">
      {label}
      {value !== undefined && <span>{value}</span>}
      {children}
    </label>
  );
}

/**
 * Add, change, reorder and remove text and shapes. Casual people get shapes;
 * experts also get text, corner rounding and stroke width. Changes are held
 * here until saved, then go through the one artwork command as a single edit.
 */
export function MarksPanel({
  initial,
  level,
  busy,
  onSave,
  onDraw,
  onSticker,
}: {
  initial: readonly Mark[];
  level: HelpMode;
  busy: boolean;
  onSave: (marks: Mark[]) => void;
  /** Starts drawing by hand on the canvas. */
  onDraw?: () => void;
  /** Asks the assistant for a sticker. */
  onSticker?: () => void;
}) {
  const [marks, setMarks] = useState<Mark[]>([...initial]);
  const [open, setOpen] = useState<string>(initial[0]?.id ?? "");
  const expert = level === "advanced";
  const kinds: MarkKind[] = expert ? ["rectangle", "ellipse", "line", "text"] : ["rectangle", "ellipse", "line"];
  const add = (kind: MarkKind) => {
    const next = addMark({ marks } as never, kind);
    setMarks(next);
    setOpen(next.at(-1)?.id ?? "");
  };
  const set = (id: string, change: Partial<Mark>) => setMarks((ms) => updateMark(ms, id, change));
  return (
    <div className="marks-panel">
      <div className="marks-add" role="group" aria-label="Add a shape or text">
        {onDraw && (
          <button type="button" className="pill acid" disabled={marks.length >= MAX_MARKS} onClick={onDraw}>
            <PencilLine size={18} /> Draw
          </button>
        )}
        {onSticker && (
          <button type="button" className="pill outline" onClick={onSticker}>
            <Sticker size={18} /> Sticker
          </button>
        )}
        {kinds.map((k) => (
          <button key={k} type="button" className="pill outline" disabled={marks.length >= MAX_MARKS} onClick={() => add(k)}>
            Add {markKindLabel[k].toLowerCase()}
          </button>
        ))}
      </div>
      <ul className="marks-list">
        {marks.map((m, i) => (
          <li key={m.id}>
            <div className="marks-row">
              <button type="button" className="text-button" aria-expanded={open === m.id} onClick={() => setOpen(open === m.id ? "" : m.id)}>
                <strong>{m.name}</strong> <small>{describeMark(m)}</small>
              </button>
              <button type="button" className="icon-button" aria-label={`Move ${m.name} down in the stack`} disabled={i === 0} onClick={() => setMarks(moveMark(marks, m.id, -1))}>
                <ArrowDown size={16} />
              </button>
              <button type="button" className="icon-button" aria-label={`Move ${m.name} up in the stack`} disabled={i === marks.length - 1} onClick={() => setMarks(moveMark(marks, m.id, 1))}>
                <ArrowUp size={16} />
              </button>
              <button type="button" className="icon-button" aria-label={`Remove ${m.name}`} onClick={() => setMarks(removeMark(marks, m.id))}>
                <Trash size={16} />
              </button>
            </div>
            {open === m.id && (
              <div className="marks-fields">
                <label className="field-label">
                  Name
                  <input value={m.name} maxLength={60} onChange={(e) => set(m.id, { name: e.target.value })} />
                </label>
                <label className="type-check">
                  <input type="checkbox" checked={m.visible} onChange={(e) => set(m.id, { visible: e.target.checked })} />
                  Show
                </label>
                {m.kind === "text" && (
                  <>
                    <label className="field-label">
                      Words
                      <textarea value={m.text} maxLength={80} onChange={(e) => set(m.id, { text: e.target.value })} />
                    </label>
                    <label className="field-label">
                      Colour
                      <input type="color" value={m.color} onChange={(e) => set(m.id, { color: e.target.value })} />
                    </label>
                    <Field label="Size" value={m.size}>
                      <input type="range" min={2} max={40} value={m.size} onChange={(e) => set(m.id, { size: num(e) })} />
                    </Field>
                    <label className="field-label">
                      Font
                      <select value={m.font} onChange={(e) => set(m.id, { font: e.target.value as TitleType["font"] })}>
                        <option value="poster">Poster serif</option>
                        <option value="sans">Clean sans</option>
                      </select>
                    </label>
                    <Field label="Weight" value={m.weight}>
                      <input type="range" min={400} max={900} step={100} value={m.weight} onChange={(e) => set(m.id, { weight: num(e) })} />
                    </Field>
                    <div className="type-align" role="group" aria-label="Alignment">
                      {titleAligns.map((a) => (
                        <button key={a} type="button" aria-pressed={m.align === a} onClick={() => set(m.id, { align: a })}>
                          {a[0].toUpperCase() + a.slice(1)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {m.kind === "shape" && (
                  <>
                    {m.shape !== "line" && (
                      <label className="field-label">
                        Fill
                        <input
                          type="color"
                          value={m.fill === "none" ? "#000000" : m.fill}
                          onChange={(e) => set(m.id, { fill: e.target.value })}
                        />
                        <button type="button" className="text-button" onClick={() => set(m.id, { fill: "none" })}>
                          No fill
                        </button>
                      </label>
                    )}
                    <label className="field-label">
                      {m.shape === "line" ? "Colour" : "Outline"}
                      <input type="color" value={m.stroke} onChange={(e) => set(m.id, { stroke: e.target.value })} />
                    </label>
                    {expert && (
                      <Field label={m.shape === "line" ? "Thickness" : "Outline width"} value={m.strokeWidth}>
                        <input type="range" min={0} max={20} step={1} value={m.strokeWidth} onChange={(e) => set(m.id, { strokeWidth: num(e) })} />
                      </Field>
                    )}
                    {expert && m.shape === "rectangle" && (
                      <Field label="Corner rounding" value={m.radius}>
                        <input type="range" min={0} max={50} value={m.radius} onChange={(e) => set(m.id, { radius: num(e) })} />
                      </Field>
                    )}
                  </>
                )}
                <Field label="Across" value={`${m.x}%`}>
                  <input type="range" min={-20} max={100} value={m.x} onChange={(e) => set(m.id, { x: num(e) })} />
                </Field>
                <Field label="Down" value={`${m.y}%`}>
                  <input type="range" min={-20} max={100} value={m.y} onChange={(e) => set(m.id, { y: num(e) })} />
                </Field>
                <Field label="Width" value={`${m.width}%`}>
                  <input type="range" min={2} max={120} value={m.width} onChange={(e) => set(m.id, { width: num(e) })} />
                </Field>
                {!(m.kind === "shape" && m.shape === "line") && (
                  <Field label="Height" value={`${m.height}%`}>
                    <input type="range" min={2} max={120} value={m.height} onChange={(e) => set(m.id, { height: num(e) })} />
                  </Field>
                )}
                <Field label="Turn" value={`${m.rotation}°`}>
                  <input type="range" min={-180} max={180} value={m.rotation} onChange={(e) => set(m.id, { rotation: num(e) })} />
                </Field>
                <Field label="Opacity" value={m.opacity}>
                  <input type="range" min={0} max={1} step={0.05} value={m.opacity} onChange={(e) => set(m.id, { opacity: num(e) })} />
                </Field>
              </div>
            )}
          </li>
        ))}
      </ul>
      <Action disabled={busy} onClick={() => onSave(marks)}>
        Save shapes and text
        <Check size={19} />
      </Action>
    </div>
  );
}
