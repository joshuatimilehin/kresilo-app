import { ArrowCounterClockwise, BookmarkSimple, Check, MagicWand, X } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { type CanvasVersion, type VersionKind, versionLabel } from "./canvasVersions";

const KIND_ICON: Record<VersionKind, ReactNode> = {
  accept: <Check size={20} weight="bold" />,
  decline: <X size={20} weight="bold" />,
  clean: <MagicWand size={20} />,
  manual: <BookmarkSimple size={20} />,
  restore: <ArrowCounterClockwise size={20} />,
};

const dateOf = (at: string) => new Date(at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/**
 * The canvas's earlier versions, newest first: one icon for what was about to happen, the date, and a press to go back.
 * The first button keeps the board as it is now.
 */
export function StudioVersions({ versions, busy, onKeep, onRestore }: { versions: readonly CanvasVersion[]; busy: boolean; onKeep: () => void; onRestore: (id: string) => void }) {
  return (
    <div className="sc-boards sc-versions" role="group" aria-label="Versions">
      <button type="button" aria-label="Keep this version" title="Keep this version" disabled={busy} onClick={onKeep}>
        <BookmarkSimple size={22} weight="fill" />
      </button>
      {versions.length > 0 && <span className="sc-sep" aria-hidden="true" />}
      {versions.map((v) => (
        <button key={v.id} type="button" disabled={busy} aria-label={`${versionLabel[v.kind]}, ${dateOf(v.at)}`} title={`${versionLabel[v.kind]}, ${dateOf(v.at)}`} onClick={() => onRestore(v.id)}>
          {KIND_ICON[v.kind]}
          <time dateTime={v.at}>{dateOf(v.at)}</time>
        </button>
      ))}
    </div>
  );
}
