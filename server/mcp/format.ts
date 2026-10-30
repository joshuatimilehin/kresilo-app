/**
 * Short views of projects for tool results. A project document carries every
 * saved version of the artwork, which is far more than an agent needs to pick
 * its next call, so results keep the current state, anything waiting for a
 * decision, and the latest few events. The revision is always present so the
 * next call can name it.
 */
import {
  versionNavigation,
  currentVersion,
  type ProjectRecord,
  type Suggestion,
  type Workspace,
} from "../../src/creative/contracts";

const RECENT_HISTORY = 8;
const RECENT_DECIDED = 5;
const RECENT_COMMENTS = 10;

export function proposalView(q: Suggestion) {
  // `targets` (several focused layers) is optional and only on newer projects.
  const targets = (q as { targets?: string[] }).targets;
  return {
    id: q.id,
    status: q.status,
    intent: q.intent,
    rationale: q.rationale,
    cites: q.cites,
    ...(q.target ? { target: q.target } : {}),
    ...(targets?.length ? { targets } : {}),
    patch: q.patch,
    ...(q.motion ? { motion: q.motion } : {}),
    provenance: q.provenance,
  };
}

/** A canvas project's cover picture is a large data URL; an agent is told it exists and how big it is, not sent it. */
const artView = (art: ProjectRecord["document"]["art"]) => {
  if (!art.snapshot) return art;
  const { image: _image, ...cover } = art.snapshot;
  return { ...art, snapshot: cover };
};

/** What an agent needs to know about a Studio canvas: when it was saved, where AI helped and how many versions are kept. */
const canvasView = (canvas: ProjectRecord["document"]["canvas"]) =>
  canvas ? { savedAt: canvas.at, ...(canvas.origins ? { parts: canvas.origins } : {}), versions: canvas.versions?.length ?? 0 } : undefined;

export function compactProject(record: ProjectRecord) {
  const p = record.document;
  // Set only by projects that use the "apply AI changes right away" option.
  const aiApply = (p as { aiApply?: string }).aiApply;
  const navigation = versionNavigation(p);
  const waiting = p.proposals.filter((q) => q.status === "proposed");
  const decided = p.proposals.filter((q) => q.status !== "proposed").slice(-RECENT_DECIDED);
  return {
    id: record.id,
    revision: record.revision,
    title: p.title,
    brief: p.brief,
    ...(aiApply ? { aiApply } : {}),
    art: artView(p.art),
    ...(p.canvas ? { canvas: canvasView(p.canvas) } : {}),
    motion: p.motion,
    references: p.references.map((r) => ({
      id: r.id,
      workId: r.workId,
      title: r.title,
      creator: r.creator,
      reason: r.reason,
      ...(r.mediaId ? { mediaId: r.mediaId } : {}),
    })),
    proposalsWaiting: waiting.map(proposalView),
    proposalsDecided: decided.map((q) => ({ id: q.id, status: q.status, intent: q.intent })),
    comments: p.comments.slice(-RECENT_COMMENTS).map((c) => ({
      id: c.id,
      author: c.author,
      text: c.text,
      resolved: c.resolved,
    })),
    versions: {
      count: p.versions.length,
      latest: p.versions.at(-1)?.number ?? 0,
      current: currentVersion(p)?.number ?? 0,
      canUndo: navigation.undo.length > 0,
      canRedo: navigation.redo.length > 0,
    },
    decisions: p.decisions.length,
    history: p.history.slice(-RECENT_HISTORY).map((h) => ({
      at: h.at,
      actor: h.actor,
      summary: h.summary,
    })),
  };
}

export function compactWorkspace(workspace: Workspace) {
  return {
    person: { name: workspace.person.name, mode: workspace.person.mode },
    projects: workspace.projects.map((record) => ({
      id: record.id,
      revision: record.revision,
      title: record.document.title,
      brief: record.document.brief,
      references: record.document.references.length,
      proposalsWaiting: record.document.proposals.filter((q) => q.status === "proposed").length,
      versions: record.document.versions.length,
      owner: record.owner,
    })),
  };
}
