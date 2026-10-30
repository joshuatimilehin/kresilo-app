import { useEffect, type ReactNode } from "react";
import { useT } from "./locale";
import type { MessageKey } from "./i18n";
import { Link } from "react-router-dom";
import { DotsThree, Drop, PlayCircle, Shapes, Sparkle, Stack, TextT, X } from "@phosphor-icons/react";

/**
 * Studio's floating controls. Icons only: each button has an accessible name
 * for screen readers and no visible caption or hover tooltip (AI_RULES.md).
 */
export type Tool = "layers" | "text" | "colour" | "shapes" | "ai" | "more";

export function StudioToolbox({
  narrow,
  showShapes,
  motionHref,
  onMotion,
  active,
  aiWaiting,
  aiOff = false,
  onTool,
}: {
  narrow: boolean;
  showShapes: boolean;
  motionHref: string;
  /** Called just before Motion opens, so Studio can keep its state for the way back. */
  onMotion?: () => void;
  /** The tool whose sheet is open, if any. */
  active: Tool | null;
  /** A proposal is waiting for a decision. */
  aiWaiting: boolean;
  /** The artist turned the assistant off for this project (hand-only). */
  aiOff?: boolean;
  onTool: (tool: Tool) => void;
}) {
  const { t } = useT();
  const b = (tool: Tool, label: string, icon: ReactNode, extra = "") => (
    <button key={tool} type="button" className={`sx-tool ${extra}`.trim()} aria-label={label} aria-pressed={active === tool} onClick={() => onTool(tool)}>
      {icon}
      {tool === "ai" && aiWaiting && <i className="sx-dot" aria-hidden="true" />}
    </button>
  );
  return (
    // No tap balloon here: the selected tool is named once, in its sheet's header.
    <nav className="sx-toolbox" aria-label="Tools" data-narrow={narrow || undefined} data-no-hint>
      {narrow && b("layers", t("tool.layers"), <Stack size={24} />)}
      {b("text", t("tool.text"), <TextT size={24} />)}
      {b("colour", t("tool.colour"), <Drop size={24} />)}
      {showShapes && b("shapes", t("tool.shapes"), <Shapes size={24} />)}
      <Link className="sx-tool" to={motionHref} aria-label={t("tool.motion")} title={t("tool.motion")} onClick={onMotion}>
        <PlayCircle size={24} />
      </Link>
      {b("ai", t("tool.ai"), <Sparkle size={24} weight={aiOff ? "regular" : "fill"} />, aiOff ? "sx-ai-tool sx-ai-off" : "sx-ai-tool")}
      {b("more", t("tool.more"), <DotsThree size={26} />)}
    </nav>
  );
}

export type QuickItem = { id: string; label: string; icon: ReactNode; on?: boolean; disabled?: boolean };

/**
 * A small bar that floats right beside the selected layer or selection. It sits
 * above it, or below it when the selection is near the top. Icons only; the
 * label is the accessible name and the hover tooltip.
 */
export function QuickBar({
  box,
  items,
  onItem,
}: {
  box: { x: number; y: number; width: number; height: number };
  items: QuickItem[];
  onItem: (id: string) => void;
}) {
  const below = box.y < 14;
  const left = Math.min(Math.max(box.x + box.width / 2, 14), 86);
  const top = below ? Math.min(box.y + box.height, 92) : box.y;
  return (
    <div className={`sx-quick ${below ? "below" : ""}`} style={{ left: `${left}%`, top: `${top}%` }} role="toolbar" aria-label="Selected layer" onPointerDown={(e) => e.stopPropagation()}>
      {items.map((it) => (
        <button key={it.id} type="button" title={it.label} aria-label={it.label} aria-pressed={it.on} disabled={it.disabled} onClick={() => onItem(it.id)}>
          {it.icon}
        </button>
      ))}
    </div>
  );
}

const toolKey = { layers: "tool.layers", text: "tool.text", colour: "tool.colour", shapes: "tool.shapes", ai: "tool.ai", more: "tool.more" } as const satisfies Record<Tool, MessageKey>;
const toolIcons: Record<Tool, ReactNode> = {
  layers: <Stack size={20} />,
  text: <TextT size={20} />,
  colour: <Drop size={20} />,
  shapes: <Shapes size={20} />,
  ai: <Sparkle size={20} weight="fill" />,
  more: <DotsThree size={22} />,
};

/**
 * A tool's controls, beside the canvas rather than over it: a short sheet above
 * the toolbox on a phone, a floating panel to the right on a desktop. No
 * backdrop, so the design stays in view and changes show on it live. The
 * header names the selected tool; it is the one place a tool is named.
 */
export function ToolSheet({ tool, onClose, actions, children }: { tool: Tool | null; onClose: () => void; actions?: ReactNode; children: ReactNode }) {
  const { t } = useT();
  useEffect(() => {
    if (!tool) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector('[role="dialog"][data-state="open"]')) onClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [tool, onClose]);
  if (!tool) return null;
  return (
    <section className="sx-sheet" aria-label={t(toolKey[tool])} data-tool={tool}>
      <header>
        <span className="sx-readout">
          {toolIcons[tool]}
          <b>{t(toolKey[tool])}</b>
        </span>
        <span className="sx-sheet-actions">
          {actions}
          <button type="button" aria-label="Close" onClick={onClose}>
            <X size={20} />
          </button>
        </span>
      </header>
      <div className="sx-sheet-body">{children}</div>
    </section>
  );
}
