import { describe, expect, it } from "vitest";
import {
  hasTool,
  modeLabel,
  normalizeMode,
  numbersOpen,
  toolLevel,
  toolsFor,
  unlockedNext,
  type HelpMode,
  type ToolId,
} from "../src/creative/tools";

const modes: HelpMode[] = ["guided", "explorer", "advanced"];
const all = Object.keys(toolLevel) as ToolId[];

describe("help level tools", () => {
  it("names the levels the way people see them", () => {
    expect(modeLabel).toEqual({ guided: "Beginner", explorer: "Casual", advanced: "Expert" });
  });

  it("shows more tools at each level and never fewer", () => {
    const counts = modes.map((m) => toolsFor(m).length);
    expect(counts).toEqual([7, 13, 15]);
    for (let i = 1; i < modes.length; i++)
      for (const t of toolsFor(modes[i - 1])) expect(hasTool(modes[i], t)).toBe(true);
    expect(toolsFor("advanced")).toHaveLength(all.length);
  });

  it("keeps beginners to a few safe tools", () => {
    expect(toolsFor("guided").sort()).toEqual(
      ["filter", "lock", "numbers", "opacity", "order", "rename", "visibility"].sort(),
    );
    for (const hidden of ["crop", "mask", "shadow", "blend", "flip", "align", "maskEdges", "adjust"] as ToolId[])
      expect(hasTool("guided", hidden)).toBe(false);
  });

  it("adds shapes, shadows and blends for casual and feather and sliders for expert", () => {
    for (const t of ["crop", "mask", "shadow", "blend", "flip", "align"] as ToolId[]) {
      expect(hasTool("explorer", t)).toBe(true);
    }
    expect(hasTool("explorer", "maskEdges")).toBe(false);
    expect(hasTool("explorer", "adjust")).toBe(false);
    expect(hasTool("advanced", "maskEdges")).toBe(true);
    expect(hasTool("advanced", "adjust")).toBe(true);
  });

  it("never takes the hand-only lock or the exact numbers away from anyone", () => {
    // The handles need a pointer, so keyboard users rely on the numbers.
    for (const m of modes) {
      expect(hasTool(m, "lock")).toBe(true);
      expect(hasTool(m, "numbers")).toBe(true);
    }
    expect(numbersOpen("guided")).toBe(false);
    expect(numbersOpen("explorer")).toBe(true);
    expect(numbersOpen("advanced")).toBe(true);
  });

  it("treats an unknown or missing level as casual", () => {
    expect(normalizeMode(undefined)).toBe("explorer");
    expect(normalizeMode("something")).toBe("explorer");
    expect(normalizeMode("guided")).toBe("guided");
    expect(normalizeMode("advanced")).toBe("advanced");
  });

  it("tells a person what the next level adds", () => {
    expect(unlockedNext("guided")?.mode).toBe("explorer");
    expect(unlockedNext("guided")?.tools).toEqual(["crop", "mask", "shadow", "blend", "flip", "align"]);
    expect(unlockedNext("explorer")?.tools).toEqual(["maskEdges", "adjust"]);
    expect(unlockedNext("advanced")).toBeNull();
  });
});

import { studioChrome } from "../src/creative/tools";

describe("Studio chrome by level", () => {
  it("gives beginners the canvas and the prompt box for one layer, nothing more", () => {
    expect(studioChrome("guided")).toEqual({ focusChips: false, autoApplySwitch: false, console: false });
  });

  it("adds choosing several layers and the apply-right-away switch for casual", () => {
    expect(studioChrome("explorer")).toEqual({ focusChips: true, autoApplySwitch: true, console: false });
  });

  it("gives experts everything, including the console", () => {
    expect(studioChrome("advanced")).toEqual({ focusChips: true, autoApplySwitch: true, console: true });
  });

  it("never shows less at a higher level", () => {
    const order = ["guided", "explorer", "advanced"] as const;
    for (let i = 1; i < order.length; i++) {
      const lower = studioChrome(order[i - 1]);
      const higher = studioChrome(order[i]);
      for (const key of ["focusChips", "autoApplySwitch", "console"] as const) if (lower[key]) expect(higher[key]).toBe(true);
    }
  });
});
