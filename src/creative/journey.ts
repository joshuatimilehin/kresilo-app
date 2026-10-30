import type { Project } from "./contracts";
import { authorshipSteps } from "./authorship";

/**
 * The path from a goal to a published story, derived only from what a project
 * already stores (issue #40). Beginner, casual and expert (code: guided,
 * explorer, advanced) walk the same path; the level changes how much of it is
 * shown, never what counts as done. Nothing here writes anything.
 *
 * "Published" is not read: a project does not record its publications, so the
 * last step is the destination and is never ticked.
 */
export type Level = Project["mode"];

export const levelName: Record<Level, string> = {
  guided: "Beginner",
  explorer: "Casual",
  advanced: "Expert",
};

export type JourneyStep = {
  id: "goal" | "reference" | "change" | "decide" | "story" | "publish";
  label: string;
  /** One plain sentence on what to do. */
  hint: string;
  /** Null for the destination, which is never ticked. */
  done: boolean | null;
  /** Where to go, as a path with `:id` filled in by the caller. */
  to: "board" | "studio" | "preview";
};

export function journeySteps(p: Project): JourneyStep[] {
  const reasoned = p.references.filter((r) => r.reason.trim());
  const proposed = p.proposals.length > 0;
  const decided = p.proposals.some((q) => q.status !== "proposed") || p.versions.length > 1;
  return [
    { id: "goal", label: "State the goal", hint: "One sentence on what this piece is for.", done: Boolean(p.brief.trim()), to: "board" },
    {
      id: "reference",
      label: "Keep a reference and say why",
      hint: "Save work that shaped yours, with your reason.",
      done: reasoned.length > 0,
      to: "board",
    },
    {
      id: "change",
      label: "Make or ask for a change",
      hint: "Edit by hand, or ask the Copilot for a direction.",
      done: proposed || p.versions.length > 1,
      to: "studio",
    },
    {
      id: "decide",
      label: "Approve, edit or decline",
      hint: "Nothing from the Copilot changes the work until you decide.",
      done: decided && p.proposals.every((q) => q.status !== "proposed"),
      to: "studio",
    },
    {
      id: "story",
      label: "Choose what to tell",
      hint: "At the preview you pick the reasons and the authorship strip to show.",
      done: p.decisions.length > 0,
      to: "preview",
    },
    {
      id: "publish",
      label: "Preview, then publish",
      hint: "A private link first; publishing is always your explicit choice.",
      done: null,
      to: "preview",
    },
  ];
}

export const nextStep = (steps: JourneyStep[]) => steps.find((s) => s.done === false) ?? steps.at(-1)!;

export type StoryCheck = { id: string; label: string; met: boolean; basis: string };

/**
 * The shared test: can a designer tell their story with this? Each line is met
 * only if a stored record backs it (people-and-journeys.md). Points 7 and 8 (the
 * designer chose the audience; a viewer understands in a minute) are about
 * people, not records, so they are not scored here.
 */
export function storyCheck(p: Project): StoryCheck[] {
  const reasoned = p.references.filter((r) => r.reason.trim() && !r.mediaId);
  const steps = authorshipSteps(p);
  return [
    { id: "goal", label: "The goal is stated", met: Boolean(p.brief.trim()), basis: "The project's brief" },
    {
      id: "reference",
      label: "A credited reference with your reason",
      met: reasoned.length > 0,
      basis: "A saved reference from a catalog work, with its reason",
    },
    {
      id: "decision",
      label: "A decision with its rationale",
      met: p.decisions.some((d) => d.reason.trim()),
      basis: "An approved proposal and its rationale",
    },
    {
      id: "versions",
      label: "A before and after",
      met: p.versions.length > 1,
      basis: "More than one saved version",
    },
    {
      id: "authorship",
      label: "AI help is named by tool, never recorded as hand",
      met: steps.every((s) => s.origin === "hand" || Boolean(s.tool)),
      basis: "Every AI step in the authorship record names its tool",
    },
  ];
}
