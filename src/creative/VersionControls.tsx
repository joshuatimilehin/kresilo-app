import { useCallback, useEffect, useState, type RefObject } from "react";
import { ArrowCounterClockwise, ArrowClockwise, ClockCounterClockwise } from "@phosphor-icons/react";
import { versionNavigation, type ProjectRecord } from "./contracts";
import { useCreative } from "./context";

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/**
 * Undo, redo and the saved versions, always in view above the canvas (phone
 * and desktop). Undo and redo step through saved versions without adding one;
 * Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z and Ctrl+Y do the same outside text fields.
 */
export function VersionControls({ record, busy, setBusy, openVersions, buttonRef, compact = false }: {
  compact?: boolean;
  record: ProjectRecord;
  busy: boolean;
  setBusy: (busy: boolean) => void;
  openVersions: () => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
}) {
  const { run } = useCreative();
  const navigation = versionNavigation(record.document);
  const canUndo = navigation.undo.length > 0;
  const canRedo = navigation.redo.length > 0;
  // Read by screen readers only: the canvas itself shows the change.
  const [said, setSaid] = useState("");
  const step = useCallback(async (direction: "undo" | "redo") => {
    if (busy || !(direction === "undo" ? canUndo : canRedo)) return;
    setBusy(true);
    try {
      const result = await run(direction === "undo" ? "version.undo" : "version.redo", {
        projectId: record.id,
        revision: record.revision,
      });
      if (result.ok) setSaid(direction === "undo" ? "Undone" : "Redone");
    } finally {
      setBusy(false);
    }
  }, [busy, canUndo, canRedo, record.id, record.revision, run, setBusy]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (
        target.closest("input, textarea, select") || target.isContentEditable
      )) return;
      if (document.querySelector('[role="dialog"]') || event.altKey || event.repeat || !(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key !== "z" && !(key === "y" && event.ctrlKey)) return;
      event.preventDefault();
      void step(key === "y" || event.shiftKey ? "redo" : "undo");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);
  const mod = isMac() ? "⌘" : "Ctrl+";
  const shift = isMac() ? "⇧" : "Shift+";
  const version = record.document.versions.at(-1)?.number ?? 1;
  return (
    <div className={compact ? "sx-history" : "version-controls"} role="group" aria-label="Artwork history">
      <span className="sx-undo-pair">
        <button
          type="button"
          aria-label="Undo artwork change"
          title={`Undo (${mod}Z)`}
          aria-keyshortcuts="Meta+Z Control+Z"
          disabled={busy || !canUndo}
          onClick={() => void step("undo")}
        >
          <ArrowCounterClockwise size={compact ? 22 : 20} weight="bold" />{!compact && <span>Undo</span>}
        </button>
        <button
          type="button"
          aria-label="Redo artwork change"
          title={`Redo (${shift}${mod}Z)`}
          aria-keyshortcuts="Meta+Shift+Z Control+Shift+Z Control+Y"
          disabled={busy || !canRedo}
          onClick={() => void step("redo")}
        >
          <ArrowClockwise size={compact ? 22 : 20} weight="bold" />{!compact && <span>Redo</span>}
        </button>
      </span>
      <button type="button" ref={buttonRef} title="Versions" aria-label={`View saved versions, ${version}`} disabled={busy} onClick={openVersions}>
        <ClockCounterClockwise size={compact ? 22 : 20} />
        {compact ? <i className="sx-badge">{version}</i> : <span>Versions · {version}</span>}
      </button>
      <span className="visually-hidden" role="status">{said}</span>
    </div>
  );
}
