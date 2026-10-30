import { describe, expect, it } from "vitest";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { buildRequest, draftChanges, draftParts, limitDraft, marksFor, planAccept, planDraft, readDraft, draftRequest, type DraftOps } from "../src/creative/canvasDraft";
import { isDraft, isMark, joinScene, splitScene, tagMark } from "../src/creative/canvasMarks";

const el = (id: string, type: string, x: number, y: number, width: number, height: number, extra: Record<string, unknown> = {}) =>
  ({ id, type, x, y, width, height, version: 1, versionNonce: 1, seed: 1, updated: 1, isDeleted: false, frameId: null, groupIds: [], boundElements: null, strokeColor: "#edeae3", backgroundColor: "transparent", customData: undefined, ...extra }) as unknown as ExcalidrawElement;

const phone = el("phone", "frame", 100, 50, 390, 844);
const tablet = el("tablet", "frame", 700, 50, 820, 1180);
const card = el("card", "rectangle", 114, 700, 300, 120, { frameId: "phone" });
const button = el("button", "rectangle", 264, 740, 100, 36, { frameId: "phone", backgroundColor: "#c7fe02" });
const label = el("label", "text", 130, 140, 200, 40, { frameId: "phone", text: "My day" });
const far = el("far", "rectangle", 720, 100, 100, 50, { frameId: "tablet" });
const scene = [phone, tablet, card, button, label, far];
const ids = () => {
  let n = 0;
  return { id: () => `new${++n}`, random: () => 0.5 };
};

describe("Copilot's answer is read safely", () => {
  const known = new Set(["card", "button", "label"]);
  const board = { width: 390, height: 844 };
  it("keeps edits to elements on the board and ignores the rest", () => {
    const ops = readDraft(
      JSON.stringify({ rationale: "Centre the card", edits: [{ id: "card", set: { x: 45 } }, { id: "ghost", set: { x: 1 } }, { id: "button", set: {} }], removes: ["ghost", "label"] }),
      known,
      board,
    );
    expect(ops?.edits).toEqual([{ id: "card", set: { x: 45 } }]);
    expect(ops?.removes).toEqual(["label"]);
  });

  it("drops colours outside the brand set but keeps the rest of the edit", () => {
    const ops = readDraft({ rationale: "r", edits: [{ id: "button", set: { backgroundColor: "#ff00aa", strokeColor: "#8b5cf8", x: 10 } }] }, known, board);
    expect(ops?.edits[0].set).toEqual({ strokeColor: "#8b5cf8", x: 10 });
  });

  it("keeps positions inside the board", () => {
    const ops = readDraft({ rationale: "r", edits: [{ id: "card", set: { x: 9000, y: -50 } }], adds: [{ type: "rectangle", x: 5000, y: 20, width: 40, height: 40 }] }, known, board);
    expect(ops?.edits[0].set).toEqual({ x: 390, y: 0 });
    expect(ops?.adds[0].x).toBe(390);
  });

  it("refuses an answer that is not JSON, has no rationale, or changes nothing", () => {
    expect(readDraft("sorry, I cannot", known, board)).toBeNull();
    expect(readDraft({ edits: [{ id: "card", set: { x: 1 } }] }, known, board)).toBeNull();
    expect(readDraft({ rationale: "r", edits: [{ id: "ghost", set: { x: 1 } }] }, known, board)).toBeNull();
  });

  it("reads an answer wrapped in a code fence", () => {
    const ops = readDraft("```json\n" + JSON.stringify({ rationale: "r", edits: [{ id: "card", set: { x: 5 } }] }) + "\n```", known, board);
    expect(ops?.edits).toHaveLength(1);
  });
});

describe("the request names what the marks point at", () => {
  const circle = tagMark(el("m1", "ellipse", 250, 730, 130, 60), scene);
  const note = tagMark(el("m2", "text", 520, 780, 90, 30, { text: "Dropdown" }), scene);
  const elsewhere = tagMark(el("m3", "ellipse", 720, 100, 90, 40), scene);
  const all = [...scene, circle, note, elsewhere];

  it("sends positions relative to the board, the marks and their notes", () => {
    const req = buildRequest(all, phone, marksFor(all, phone));
    expect(draftRequest.safeParse(req).success).toBe(true);
    expect(req.board).toEqual({ id: "phone", width: 390, height: 844 });
    expect(req.elements.find((e) => e.id === "button")).toMatchObject({ x: 164, y: 690, width: 100, height: 36 });
    expect(req.marks.find((m) => m.kind === "text")?.note).toBe("Dropdown");
    expect(req.marks.find((m) => m.kind === "ellipse")?.anchor).toEqual({ id: "button", kind: "rectangle" });
  });

  it("leaves marks that answer another board out", () => {
    const mine = marksFor(all, phone).map((m) => m.id);
    expect(mine).toContain("m1");
    expect(mine).toContain("m2"); // a word beside the board, near enough to belong to it
    expect(mine).not.toContain("m3");
    expect(marksFor(all, tablet).map((m) => m.id)).toEqual(["m3"]);
  });
});

describe("a draft is a copy beside the original", () => {
  const ops: DraftOps = {
    rationale: "Centre the card and add a menu",
    edits: [{ id: "card", set: { x: 45, backgroundColor: "#101315" } }],
    adds: [{ type: "rectangle", x: 200, y: 640, width: 150, height: 90, backgroundColor: "#8b5cf8" }],
    removes: ["label"],
  };

  it("copies the board and its children beside it and applies the edits to the copies only", () => {
    const d = planDraft(all(), phone, ops, ["m1"], ids(), 1000);
    expect(d.frame.x).toBe(100 + 390 + 120);
    expect(d.frame.id).not.toBe("phone");
    expect(d.children.map((c) => c.frameId)).toEqual([d.frame.id, d.frame.id]); // button and card; label removed
    const movedCard = d.children.find((c) => c.width === 300)!;
    expect(movedCard.x).toBe(d.frame.x + 45);
    expect(movedCard.backgroundColor).toBe("#101315");
    expect(card.x).toBe(114); // the original is untouched
    expect(d.adds[0]).toMatchObject({ x: d.frame.x + 200, y: 50 + 640, backgroundColor: "#8b5cf8" });
  });

  it("marks every copied element as a draft that remembers its source and the marks it answers", () => {
    const d = planDraft(all(), phone, ops, ["m1", "m2"], ids(), 1000);
    for (const e of [d.frame, ...d.children]) expect(isDraft(e)).toBe(true);
    expect(draftParts([d.frame, ...d.children, ...scene])).toHaveLength(1);
    expect(draftParts([d.frame, ...d.children])[0].data).toMatchObject({ source: "phone", marks: ["m1", "m2"] });
    expect(draftParts([d.frame, ...d.children])[0].members).toHaveLength(3);
  });

  it("keeps drafts out of the design list and gives them their own", () => {
    const d = planDraft(all(), phone, ops, [], ids(), 1000);
    const { design, drafts, marks } = splitScene([...scene, d.frame, ...d.children]);
    expect(design.map((e) => e.id)).toEqual(scene.map((e) => e.id));
    expect(drafts).toHaveLength(3);
    expect(marks).toHaveLength(0);
    expect(joinScene(design, marks, drafts)).toHaveLength(scene.length + 3);
    expect(drafts.some(isMark)).toBe(false);
  });

  it("accepting applies the edits to the original board and reports what to add", () => {
    const a = planAccept(all(), phone, ops, ids(), 2000);
    const byId = new Map(a.elements.map((e) => [e.id, e]));
    expect(byId.get("card")!.x).toBe(100 + 45);
    expect(byId.get("card")!.backgroundColor).toBe("#101315");
    expect(byId.get("label")!.isDeleted).toBe(true);
    expect(byId.get("button")!.x).toBe(264);
    expect(byId.get("far")).toBe(far); // another board is not touched
    expect(a.adds[0]).toMatchObject({ x: 100 + 200, y: 50 + 640 });
  });

  it("changes text only on text elements", () => {
    const a = planAccept(all(), phone, { rationale: "r", edits: [{ id: "label", set: { text: "Today" } }, { id: "card", set: { text: "nope" } }], adds: [], removes: [] }, ids(), 3);
    const byId = new Map(a.elements.map((e) => [e.id, e as unknown as { text?: string }]));
    expect(byId.get("label")!.text).toBe("Today");
    expect(byId.get("card")!.text).toBeUndefined();
  });

  function all() {
    return [...scene];
  }
});

describe("Copilot obeys the allow switches", () => {
  const ops: DraftOps = {
    rationale: "Rework the card",
    edits: [
      { id: "label", set: { text: "Today", x: 20 } },
      { id: "card", set: { backgroundColor: "#101315", width: 320, strokeWidth: 3 } },
    ],
    adds: [
      { type: "rectangle", x: 10, y: 10, width: 40, height: 20 },
      { type: "text", x: 12, y: 12, text: "Menu" },
      { type: "rectangle", x: 60, y: 10, width: 40, height: 20, text: "Item" },
    ],
    removes: ["label", "card"],
  };
  const types = new Map([["label", "text"], ["card", "rectangle"]]);
  const all = { words: true, layout: true, look: true, images: true };

  it("leaves a draft alone when everything is allowed", () => {
    const r = limitDraft(ops, all, types);
    expect(r.ops).toEqual(ops);
    expect(r.blocked).toEqual([]);
  });

  it("keeps words out while Words is off: text edits, new text, text inside shapes and removing a text", () => {
    const r = limitDraft(ops, { ...all, words: false }, types);
    expect(r.ops.edits).toEqual([{ id: "label", set: { x: 20 } }, { id: "card", set: { backgroundColor: "#101315", width: 320, strokeWidth: 3 } }]);
    expect(r.ops.adds.map((a) => a.type)).toEqual(["rectangle", "rectangle"]);
    expect(r.ops.adds.some((a) => "text" in a)).toBe(false);
    expect(r.ops.removes).toEqual(["card"]);
    expect(r.blocked).toEqual(["words"]);
  });

  it("keeps positions and sizes out while Layout is off, and colour and new shapes out while Look is off", () => {
    const layout = limitDraft(ops, { ...all, layout: false }, types);
    expect(layout.ops.edits).toEqual([{ id: "label", set: { text: "Today" } }, { id: "card", set: { backgroundColor: "#101315", strokeWidth: 3 } }]);
    expect(layout.ops.removes).toEqual(["label"]);
    const look = limitDraft(ops, { ...all, look: false }, types);
    expect(look.ops.edits).toEqual([{ id: "label", set: { text: "Today", x: 20 } }, { id: "card", set: { width: 320 } }]);
    expect(look.ops.adds.map((a) => a.type)).toEqual(["text"]);
    expect(look.blocked).toEqual(["look"]);
  });

  it("leaves nothing when every switch is off", () => {
    const r = limitDraft(ops, { words: false, layout: false, look: false, images: true }, types);
    expect(draftChanges(r.ops)).toBe(0);
    expect(r.blocked.sort()).toEqual(["layout", "look", "words"]);
  });
});
