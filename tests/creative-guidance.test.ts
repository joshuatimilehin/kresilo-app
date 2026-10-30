import { describe, expect, it } from "vitest";
import { countLabel, promptGate } from "../src/creative/guidance";

describe("countLabel", () => {
  it("uses the singular for exactly one", () => {
    expect(countLabel(1, "version")).toBe("1 version");
    expect(countLabel(1, "reference")).toBe("1 reference");
  });
  it("uses the plural for zero and many", () => {
    expect(countLabel(0, "version")).toBe("0 versions");
    expect(countLabel(2, "version")).toBe("2 versions");
  });
  it("accepts an irregular plural", () => {
    expect(countLabel(3, "person", "people")).toBe("3 people");
  });
});

describe("promptGate", () => {
  const base = { targetExists: true, intent: "make it warmer" };
  it("allows a prompt with a target and text, with or without references", () => {
    expect(promptGate(base)).toEqual({ ok: true, reason: "" });
  });
  it("asks for a target first", () => {
    const g = promptGate({ ...base, targetExists: false });
    expect(g.ok).toBe(false);
    expect(g.reason).toMatch(/choose an image/i);
  });
  it("asks for text when only the text is missing", () => {
    const g = promptGate({ ...base, intent: "   " });
    expect(g.ok).toBe(false);
    expect(g.reason).toMatch(/describe the change/i);
  });
});
