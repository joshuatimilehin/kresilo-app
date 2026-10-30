import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The floor under BRAND_GUIDELINES.md: guidance is seen, not read. These checks
 * catch hint text coming back; they do not replace looking at the screen.
 */
const root = join(__dirname, "..", "src");
function tsx(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === "components" ? [] : tsx(p);
    return p.endsWith(".tsx") ? [p] : [];
  });
}
const files = tsx(root).map((p) => ({ p: p.slice(root.length + 1), src: readFileSync(p, "utf8") }));

/** Hint and explainer patterns that were removed and must not return. */
const banned = [
  "gestureHints",
  "canvas-gesture-hint",
  "canvas-context",
  "canvas-brief",
  "prompt-help",
  "prompt-target",
  "guided-hint",
  "sv-hint",
  "action-explain",
  "tool-level",
  "create-outcome",
  "Choose what works for your project",
];

/** Helper-text elements: a muted note, an inline note, a tagline, a hint. */
const helper = /className="(muted|inline-note|[a-z-]*-hint|guest-retention|create-footnote|modal-prose|pf-tagline)[ "]/g;

/**
 * The count may only go down. Lower it when you remove more; never raise it.
 * Consent, privacy and sample disclosures are the ones that remain.
 */
const HELPER_TEXT_MAX = 23;

describe("brand rules: guidance is seen, not read", () => {
  it("keeps removed hint text and explainers out of every screen", () => {
    const found = files.flatMap(({ p, src }) => banned.filter((b) => src.includes(b)).map((b) => `${p}: ${b}`));
    expect(found).toEqual([]);
  });

  it("never adds helper-text elements beyond today's count", () => {
    const count = files.reduce((n, { src }) => n + (src.match(helper)?.length ?? 0), 0);
    expect(count).toBeLessThanOrEqual(HELPER_TEXT_MAX);
  });

  it("keeps Studio's tools icon-only", () => {
    const float = files.find((f) => f.p.endsWith("StudioFloat.tsx"))!.src;
    const toolbox = float.slice(float.indexOf("export function StudioToolbox"), float.indexOf("export type QuickItem"));
    expect(toolbox).not.toMatch(/<span>[A-Za-z]/);
  });
});
