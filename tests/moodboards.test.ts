import { describe, expect, it } from "vitest";
import {
  addBoard,
  boardId,
  boardsHolding,
  keysToShow,
  MAX_BOARDS,
  removeBoard,
  setBoardPublic,
  toggleOnBoard,
  toggleSaved,
  type Moodboard,
} from "../src/creative/moodboards";

const start = { saved: ["case:a", "work:b"], moodboards: [] as Moodboard[] };

describe("moodboards", () => {
  it("makes boards with their own ids, public or private, and refuses an empty name or too many", () => {
    let boards = addBoard([], "  Quiet packaging ", false)!;
    expect(boards).toEqual([{ id: "m-quiet-packaging", name: "Quiet packaging", public: false, items: [] }]);
    boards = addBoard(boards, "Quiet packaging", true)!;
    expect(boards.map((b) => b.id)).toEqual(["m-quiet-packaging", "m-quiet-packaging-2"]);
    expect(addBoard(boards, "   ", true)).toBeNull();
    expect(boardId([], "***")).toBe("m-board");
    let many: Moodboard[] = [];
    for (let i = 0; i < MAX_BOARDS; i++) many = addBoard(many, `Board ${i}`, false)!;
    expect(addBoard(many, "One more", false)).toBeNull();
  });

  it("an item can sit on several boards at once, and putting it on a board also saves it", () => {
    let s = { ...start, moodboards: addBoard(addBoard([], "Colour", true)!, "Type", false)! };
    s = toggleOnBoard(s, "m-colour", "post:x");
    s = toggleOnBoard(s, "m-type", "post:x");
    expect(boardsHolding(s.moodboards, "post:x")).toEqual(["m-colour", "m-type"]);
    expect(s.saved[0]).toBe("post:x");
    s = toggleOnBoard(s, "m-colour", "post:x");
    expect(boardsHolding(s.moodboards, "post:x")).toEqual(["m-type"]);
    expect(s.saved).toContain("post:x");
  });

  it("taking an item out of Saved takes it off every board; saving again does not put it back", () => {
    let s = { ...start, moodboards: addBoard([], "Colour", true)! };
    s = toggleOnBoard(s, "m-colour", "case:a");
    s = toggleSaved(s, "case:a");
    expect(s.saved).not.toContain("case:a");
    expect(s.moodboards[0].items).toEqual([]);
    s = toggleSaved(s, "case:a");
    expect(s.saved[0]).toBe("case:a");
    expect(s.moodboards[0].items).toEqual([]);
  });

  it("changes privacy, deletes a board without losing what it held, and filters what is shown", () => {
    let s = { ...start, moodboards: addBoard([], "Colour", false)! };
    s = toggleOnBoard(s, "m-colour", "work:b");
    expect(setBoardPublic(s.moodboards, "m-colour", true)[0].public).toBe(true);
    expect(keysToShow(s.saved, s.moodboards, "all")).toEqual(s.saved);
    expect(keysToShow(s.saved, s.moodboards, "m-colour")).toEqual(["work:b"]);
    expect(keysToShow(s.saved, s.moodboards, "m-gone")).toEqual(s.saved);
    const after = removeBoard(s.moodboards, "m-colour");
    expect(after).toEqual([]);
    expect(s.saved).toContain("work:b");
  });

  it("ignores a board that does not exist", () => {
    expect(toggleOnBoard(start, "m-nope", "case:a")).toBe(start);
  });
});
