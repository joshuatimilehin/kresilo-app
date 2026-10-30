import { ArrowsOutCardinal, HandPalm, Image, Lightning, Palette, Sparkle, TextT } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { aiAllowKeys, aiAllowLabel, aiAllowOf, type AiAllowKey } from "./aiAllow";
import { useCreative } from "./context";
import type { ProjectRecord } from "./contracts";

const MODES = [
  { id: "off", label: "Hand only", icon: <HandPalm size={22} /> },
  { id: "ask", label: "Ask first", icon: <Sparkle size={22} /> },
  { id: "auto", label: "Apply at once, with undo", icon: <Lightning size={22} /> },
] as const;
const SWITCH_ICON: Record<AiAllowKey, ReactNode> = {
  words: <TextT size={22} />,
  layout: <ArrowsOutCardinal size={22} />,
  look: <Palette size={22} />,
  images: <Image size={22} />,
};

/**
 * What Copilot may do in this project, as icons: hand only, ask first, or apply at once (with undo), and four
 * switches for what it may change (words, layout, look, images). Words start off: their text is the artist's.
 */
export function StudioAiControls({ projectId, fallback, revision }: { projectId: string; fallback: ProjectRecord; revision: () => number }) {
  const { run, workspace } = useCreative();
  const doc = (workspace?.projects.find((p) => p.id === projectId) ?? fallback).document;
  const mode = doc.aiApply ?? "ask";
  const allow = aiAllowOf(doc);
  const send = (change: { apply?: "off" | "ask" | "auto"; allow?: Partial<Record<AiAllowKey, boolean>> }) => void run("project.ai", { projectId, revision: revision(), ...change });
  return (
    <div className="sc-boards sc-ai" role="group" aria-label="What Copilot may do">
      {MODES.map((m) => (
        <button key={m.id} type="button" aria-pressed={mode === m.id} aria-label={m.label} title={m.label} onClick={() => mode !== m.id && send({ apply: m.id })}>
          {m.icon}
        </button>
      ))}
      <span className="sc-sep" aria-hidden="true" />
      {aiAllowKeys.map((k) => (
        <button key={k} type="button" aria-pressed={allow[k]} aria-label={aiAllowLabel[k]} title={`${aiAllowLabel[k]}: ${allow[k] ? "on" : "off"}`} disabled={mode === "off"} onClick={() => send({ allow: { [k]: !allow[k] } })}>
          {SWITCH_ICON[k]}
        </button>
      ))}
    </div>
  );
}
