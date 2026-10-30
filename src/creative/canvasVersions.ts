/**
 * Versions of a Studio canvas: whole saved scenes kept inside the project, so a person can step back to how the
 * board looked before a draft, a clean-up or an experiment. A version is the scene as it was just before the thing
 * its kind names, so restoring one undoes that thing. Only the newest few are kept, and only while they fit the
 * project document (a project is refused above 2 MB and the live scene shares it).
 */
export const VERSION_KINDS = ["accept", "decline", "clean", "manual", "restore"] as const;
export type VersionKind = (typeof VERSION_KINDS)[number];
export type CanvasVersion = { id: string; at: string; kind: VersionKind; /** The saved scene; empty in what the app receives, which only lists them. */ scene: string };

export const MAX_VERSIONS = 12;
/** All kept scenes together, in characters of JSON. */
export const VERSIONS_BUDGET = 600_000;

export const versionLabel: Record<VersionKind, string> = {
  accept: "Before a draft was accepted",
  decline: "Before a draft was declined",
  clean: "Before Make clean",
  manual: "Saved by you",
  restore: "Before a restore",
};

/**
 * Adds a version to the kept ones, newest first. A scene identical to the newest is not kept twice, the oldest go
 * when there are too many or they no longer fit, and a scene too big to ever fit is refused (null).
 */
export function keepVersion(kept: readonly CanvasVersion[], add: CanvasVersion): CanvasVersion[] | null {
  if (add.scene.length > VERSIONS_BUDGET) return null;
  if (kept[0]?.scene === add.scene) return [...kept];
  const out = [add, ...kept].slice(0, MAX_VERSIONS);
  let total = out.reduce((n, v) => n + v.scene.length, 0);
  while (total > VERSIONS_BUDGET && out.length > 1) total -= out.pop()!.scene.length;
  return out;
}

/** What the app is sent: the list without the scenes. */
export const listVersions = (kept: readonly CanvasVersion[] | undefined): CanvasVersion[] => (kept ?? []).map((v) => ({ ...v, scene: "" }));
