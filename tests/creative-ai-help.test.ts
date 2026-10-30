import { describe, expect, it } from "vitest";
import { changedSummary, nothingChanged, touchedParts, unsupportedAsk, WHAT_AI_CAN_DO } from "../src/creative/aiHelp";

describe("saying plainly what an AI request did", () => {
  it("recognises effects the assistant cannot make and offers the nearest thing", () => {
    expect(unsupportedAsk("apply glitter to the title")?.what).toBe("Glitter and sparkle");
    expect(unsupportedAsk("make it sparkle")?.instead).toMatch(/grain/);
    expect(unsupportedAsk("add a neon glow")?.what).toBe("Glow");
    expect(unsupportedAsk("import my photo")?.what).toBe("Importing your own images");
    expect(unsupportedAsk("make it smaller")).toBeNull();
    expect(unsupportedAsk("opacity 50%")).toBeNull();
  });

  it("says nothing changed, and why, for an unsupported ask or an unreadable one", () => {
    const glitter = nothingChanged("apply glitter");
    expect(glitter.kind).toBe("nothing");
    expect(glitter.headline).toMatch(/Nothing changed\. Glitter and sparkle is not something/);
    const unclear = nothingChanged("do the thing", "The prototype could not interpret this change.");
    expect(unclear.detail).toContain("could not interpret");
    expect(unclear.detail).toContain(WHAT_AI_CAN_DO);
  });

  it("describes a proposal or an applied change with what it touches", () => {
    expect(changedSummary("Quieter title.", false, ["your words (title or caption)"]).headline).toMatch(/proposal is ready/);
    expect(changedSummary("Quieter title.", true, []).headline).toMatch(/^Applied\./);
    expect(changedSummary("x", false, ["the background"]).detail).toContain("It changes: the background.");
  });

  it("names the surprising parts: words, colour, new images", () => {
    expect(touchedParts({ title: "New", color: "#fff" }, 0, 0)).toEqual(["your words (title or caption)", "the title colour"]);
    expect(touchedParts({}, 2, 1)).toEqual(["2 existing layers", "1 new catalog image"]);
    expect(touchedParts(undefined, 1, 0)).toEqual(["1 existing layer"]);
    expect(touchedParts({}, 0, 0)).toEqual([]);
  });
});
