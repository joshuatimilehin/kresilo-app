/**
 * Which Studio tools each help level shows (beginner, casual, expert). The
 * level is the person's own setting (`person.mode`, stored as guided, explorer
 * or advanced); this file only decides what appears. Hiding a tool never
 * removes a capability from the data or the command service: layers saved
 * with a tool keep it, and an expert can always change it later.
 *
 * Accessibility rule: the handles on the canvas need a pointer, so the numeric
 * position, size and rotation fields stay reachable at every level (collapsed
 * for beginners, open for the rest) instead of being removed.
 */
export type HelpMode = "guided" | "explorer" | "advanced";

export const modeLabel: Record<HelpMode, string> = {
  guided: "Beginner",
  explorer: "Casual",
  advanced: "Expert",
};

const rank: Record<HelpMode, number> = { guided: 0, explorer: 1, advanced: 2 };

/** Every tool the layer panel can offer, with the lowest level that shows it. */
export const toolLevel = {
  rename: "guided",
  opacity: "guided",
  filter: "guided",
  visibility: "guided",
  order: "guided",
  lock: "guided",
  numbers: "guided",
  crop: "explorer",
  mask: "explorer",
  shadow: "explorer",
  blend: "explorer",
  flip: "explorer",
  align: "explorer",
  maskEdges: "advanced",
  adjust: "advanced",
} as const satisfies Record<string, HelpMode>;

export type ToolId = keyof typeof toolLevel;

export const toolLabel: Record<ToolId, string> = {
  rename: "Layer name and role",
  opacity: "Opacity",
  filter: "Filter presets",
  visibility: "Show or hide",
  order: "Bring forward and send backward",
  lock: "Hand-only lock",
  numbers: "Exact numbers for position, size and rotation",
  crop: "Crop",
  mask: "Mask shape",
  shadow: "Shadow",
  blend: "Blend mode",
  flip: "Flip",
  align: "Align to the canvas",
  maskEdges: "Mask feather and invert",
  adjust: "Brightness, contrast, saturation and blur",
};

export const normalizeMode = (mode: string | undefined): HelpMode =>
  mode === "guided" || mode === "advanced" ? mode : "explorer";

export function hasTool(mode: HelpMode, tool: ToolId): boolean {
  return rank[mode] >= rank[toolLevel[tool]];
}

export function toolsFor(mode: HelpMode): ToolId[] {
  return (Object.keys(toolLevel) as ToolId[]).filter((t) => hasTool(mode, t));
}

/** The tools a person gets by moving up one level, for a gentle hint. */
export function unlockedNext(mode: HelpMode): { mode: HelpMode; tools: ToolId[] } | null {
  const order: HelpMode[] = ["guided", "explorer", "advanced"];
  const next = order[rank[mode] + 1];
  if (!next) return null;
  return {
    mode: next,
    tools: (Object.keys(toolLevel) as ToolId[]).filter((t) => toolLevel[t] === next),
  };
}

/** Beginners see the exact-number fields folded away; everyone else sees them open. */
export const numbersOpen = (mode: HelpMode) => mode !== "guided";

/**
 * Type controls for the title, by level. Beginners keep colour and size (the
 * existing panels); casual adds font, weight and alignment; expert adds line
 * height and letter spacing. Kept apart from `toolLevel` because they live in
 * the text panel, not the layer panel.
 */
export const typeControlLevel = {
  font: "explorer",
  weight: "explorer",
  align: "explorer",
  spacing: "advanced",
} as const satisfies Record<string, HelpMode>;
export type TypeControl = keyof typeof typeControlLevel;

export const hasTypeControl = (mode: HelpMode, control: TypeControl) =>
  rank[mode] >= rank[typeControlLevel[control]];

/**
 * How much of Studio's chrome each level sees (issue #40). Beginners get the
 * canvas, one short hint and the prompt box for the selected layer; casual
 * adds choosing several layers for the AI and the apply-right-away switch;
 * expert also keeps the full gesture hint. Hiding a control never changes
 * what is saved: a project already set to apply AI changes right away keeps
 * doing so, and the command console stays expert only.
 */
export type StudioChrome = {
  /** Chips to point the AI at several layers or the whole composition. */
  focusChips: boolean;
  /** The "apply AI changes right away" switch. */
  autoApplySwitch: boolean;
  /** The command console in More. */
  console: boolean;
};

export function studioChrome(mode: HelpMode): StudioChrome {
  return {
    focusChips: rank[mode] >= rank.explorer,
    autoApplySwitch: rank[mode] >= rank.explorer,
    console: mode === "advanced",
  };
}
