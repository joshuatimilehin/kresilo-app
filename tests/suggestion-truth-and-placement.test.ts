import { describe, expect, it } from "vitest";
import { newProject, type Art, type Mark } from "../src/creative/contracts";
import { changeSummary, changedParts, suggestionInputs, truthfulReason } from "../src/creative/suggestionSummary";
import { hintPlace, hintSize, type Box } from "../src/creative/hintPlace";
import { TOAST_AVOID, toastPlace } from "../src/creative/toastPlace";

const base = (): Art => ({ ...newProject(crypto.randomUUID(), "A study", "Crumb & Co").art, marks: [] });
const text = (over: Partial<Mark> = {}): Mark =>
  ({ id: crypto.randomUUID(), name: "Opening time", kind: "text", text: "Opening Saturday 9am", x: 7, y: 30, width: 80, height: 8, rotation: 0, opacity: 1, visible: true, color: "#3B2A1E", size: 5, font: "sans", italic: false, weight: 600, align: "left", ...over }) as Mark;

describe("a suggestion's shown reason", () => {
  it("names only what the kept patch changes", () => {
    const art = base();
    expect(changeSummary(art, { color: "#4A2E1C", canvasColor: "#F3E3C6", marks: [text()] })).toBe(
      "Title colour, ground colour, new text “Opening Saturday 9am”.",
    );
    // Values equal to what is there are no change at all.
    expect(changeSummary(art, { title: art.title, color: art.color })).toBe("No visible change.");
    expect(changedParts(art, { title: "Crumb & Co." })).toEqual(["title “Crumb & Co.”"]);
  });

  it("names changed and removed text and shapes, layers and motion", () => {
    const line = text();
    const art = { ...base(), marks: [line] };
    expect(changedParts(art, { marks: [{ ...line, text: "Open 9am" } as Mark] })).toEqual(["text “Open 9am”"]);
    expect(changedParts(art, { marks: [{ ...line, y: 60 } as Mark] })).toEqual(["text “Opening time”"]);
    expect(changedParts(art, { marks: [] })).toEqual(["removed “Opening time”"]);
    expect(changedParts(art, {}, { movement: "drift" })).toEqual(["motion"]);
  });

  it("keeps the model's words only when nothing was left out", () => {
    const art = base();
    const patch = { canvasColor: "#F3E3C6" };
    const said = "Set a warm cream ground that suits the bakery brief.";
    expect(truthfulReason({ rationale: said, dropped: false, art, patch })).toBe(said);
    expect(truthfulReason({ rationale: said, dropped: true, art, patch })).toBe("Ground colour.");
  });

  it("caps a long list", () => {
    const art = base();
    const marks = Array.from({ length: 7 }, (_, i) => text({ name: `Line ${i}`, text: `Line ${i}` }));
    expect(changeSummary(art, { marks })).toMatch(/and 2 more changes\.$/);
  });

  it("names the inputs, never the model or the provider", () => {
    const shown = suggestionInputs("ali/qwen3.8-omni-flash · your brief and canvas · provider-reported $0.000412");
    expect(shown).toBe("Your brief and canvas");
    expect(suggestionInputs("ali/qwen3.8-omni-flash · project references and saved reasons")).toBe("Your references, saved reasons and canvas");
    for (const p of ["Prototype guidance · preset prompt controls · no model called · review before applying", undefined])
      expect(suggestionInputs(p)).not.toMatch(/qwen|model|provider|prototype/i);
  });
});

describe("an icon's name never sits on another control", () => {
  const view = { width: 1280, height: 800 };
  const size = hintSize("✓ Text");
  const hit = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const at = (s: { left: number; top: number }): Box => ({ left: s.left, top: s.top, right: s.left + size.width, bottom: s.top + size.height });
  // Studio on a desktop: the version badge and undo row above the canvas's right edge, the toolbox beside it.
  const badge: Box = { left: 846, top: 104, right: 930, bottom: 148 };
  const textTool: Box = { left: 940, top: 156, right: 984, bottom: 200 };
  const colourTool: Box = { left: 940, top: 206, right: 984, bottom: 250 };
  const shapesTool: Box = { left: 940, top: 256, right: 984, bottom: 300 };

  it("moves beside a toolbox button instead of onto its neighbours or the badge", () => {
    for (const target of [textTool, colourTool]) {
      const others = [badge, textTool, colourTool, shapesTool].filter((b) => b !== target);
      const spot = at(hintPlace(target, size, others, view));
      expect(others.some((o) => hit(spot, o))).toBe(false);
      expect(hit(spot, target)).toBe(false);
    }
  });

  it("stays above a lone button, and on screen at the edges", () => {
    const lone: Box = { left: 600, top: 400, right: 644, bottom: 444 };
    expect(at(hintPlace(lone, size, [], view)).bottom).toBeLessThanOrEqual(lone.top);
    const corner: Box = { left: 1250, top: 2, right: 1278, bottom: 30 };
    const spot = at(hintPlace(corner, size, [], view));
    expect(spot.right).toBeLessThanOrEqual(view.width);
    expect(spot.top).toBeGreaterThanOrEqual(0);
  });
});

describe("toasts stay fully on screen", () => {
  it("lift above Studio's result line under the canvas", () => {
    expect(TOAST_AVOID).toContain(".sx-result");
    const result = { top: 724, bottom: 768, left: 480, right: 800 };
    const place = toastPlace([result], { width: 1280, height: 800 });
    expect(place).toEqual({ side: "bottom", lift: 88 });
  });
});

describe("explanations that promise more than the suggestion holds", () => {
  const art = newProject("p", "A poster for a bakery", "Crumb & Co").art;
  it("falls back to the summary when texture is promised but only colour changes", () => {
    const patch = { canvasColor: "#A1B2C3", color: "#3B2A1C" };
    const shown = truthfulReason({ rationale: "Set warm cream ground with visible paper texture.", dropped: false, art, patch });
    expect(shown).not.toMatch(/texture/i);
    expect(shown).toMatch(/ground colour/i);
  });
  it("keeps the model's words when what it describes is there", () => {
    const patch = { canvasColor: "#A1B2C3" };
    const rationale = "Warm cream ground in the spirit of your brief.";
    expect(truthfulReason({ rationale, dropped: false, art, patch })).toBe(rationale);
  });
  it("falls back when motion is promised but none is set", () => {
    const shown = truthfulReason({ rationale: "Slow drift across the poster.", dropped: false, art, patch: { color: "#222222" } });
    expect(shown).not.toMatch(/drift/i);
  });
});
