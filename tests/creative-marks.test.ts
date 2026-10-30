import { describe, expect, it } from "vitest";
import { artPatch, commands, markSchema, MAX_MARKS, newProject, type Mark } from "../src/creative/contracts";
import { addMark, canAddMark, markCss, markStyle, moveMark, newMark, removeMark, updateMark } from "../src/creative/marks";

// Artwork from before text and shapes existed: a starter, which has none.
const art = () => newProject(crypto.randomUUID(), "A poster", "Study", "evening-poster").art;

describe("marks: schema", () => {
  it("accepts a new text mark and each shape", () => {
    for (const kind of ["text", "rectangle", "ellipse", "line"] as const)
      expect(markSchema.safeParse(newMark(kind, [])).success, kind).toBe(true);
  });

  it("keeps earlier artwork valid and travels through the one artwork command", () => {
    expect(art().marks).toBeUndefined();
    const marks = [newMark("text", []), newMark("rectangle", [])];
    expect(artPatch.safeParse({ marks }).success).toBe(true);
    expect(commands["artwork.edit"].safeParse({ projectId: crypto.randomUUID(), revision: 1, patch: { marks } }).success).toBe(true);
  });

  it("refuses values that could escape into CSS or break the picture", () => {
    const text = newMark("text", []) as Mark;
    const shape = newMark("rectangle", []) as Mark;
    const bad: Record<string, unknown>[] = [
      { ...text, color: "red; background:url(//evil)" },
      { ...text, font: "Comic Sans" },
      { ...text, text: "" },
      { ...text, text: "x".repeat(81) },
      { ...text, size: 90 },
      { ...shape, fill: "url(x)" },
      { ...shape, shape: "polygon(0 0)" },
      { ...shape, strokeWidth: 99 },
      { ...shape, radius: 80 },
      { ...shape, width: 500 },
      { ...shape, extra: 1 },
      { ...shape, kind: "image" },
    ];
    for (const m of bad) expect(markSchema.safeParse(m).success, JSON.stringify(m).slice(0, 60)).toBe(false);
  });

  it("limits the number of marks and refuses repeated ids", () => {
    const one = newMark("rectangle", []);
    const many = Array.from({ length: MAX_MARKS + 1 }, (_, i) => ({ ...one, id: crypto.randomUUID(), name: `M${i}` }));
    expect(artPatch.safeParse({ marks: many }).success).toBe(false);
    expect(artPatch.safeParse({ marks: [one, one] }).success).toBe(false);
  });
});

describe("marks: edits", () => {
  it("adds named marks without repeating a name and stops at the limit", () => {
    let a = art();
    a = { ...a, marks: addMark(a, "rectangle") };
    a = { ...a, marks: addMark(a, "rectangle") };
    expect(a.marks!.map((m) => m.name)).toEqual(["Rectangle 1", "Rectangle 2"]);
    for (let i = 0; i < 20; i++) a = { ...a, marks: addMark(a, "line") };
    expect(a.marks).toHaveLength(MAX_MARKS);
    expect(canAddMark(a)).toBe(false);
  });

  it("changes, reorders and removes a mark by id", () => {
    const a = newMark("rectangle", []);
    const b = newMark("ellipse", [a]);
    const marks = [a, b];
    expect(updateMark(marks, b.id, { opacity: 0.4 })[1].opacity).toBe(0.4);
    expect(updateMark(marks, b.id, { opacity: 0.4 })[0]).toEqual(a);
    expect(moveMark(marks, a.id, 1).map((m) => m.id)).toEqual([b.id, a.id]);
    expect(moveMark(marks, a.id, -1).map((m) => m.id)).toEqual([a.id, b.id]);
    expect(removeMark(marks, a.id).map((m) => m.id)).toEqual([b.id]);
  });
});

describe("marks: rendering", () => {
  it("styles a rounded rectangle, an ellipse and a line", () => {
    const rect = { ...newMark("rectangle", []), fill: "#c7fe02", radius: 12, strokeWidth: 2, stroke: "#111111" } as Mark;
    expect(markStyle(rect)).toMatchObject({ background: "#c7fe02", border: "2px solid #111111", borderRadius: "12%", left: "30%", width: "40%" });
    expect(markStyle({ ...rect, shape: "ellipse" } as Mark).borderRadius).toBe("50%");
    expect(markStyle(newMark("line", []))).toMatchObject({ height: 0, borderTop: "3px solid #fff7e3" });
  });

  it("sizes text in container units on screen and pixels in the export", () => {
    const text = { ...newMark("text", []), size: 10 } as Mark;
    expect(markStyle(text).fontSize).toBe("10cqw");
    expect(markStyle(text, "export").fontSize).toBe("54px");
    expect(markStyle(text, "export").fontFamily).toBe("KresiloSans,Arial");
  });

  it("writes CSS text with only fixed templates and numbers", () => {
    const css = [newMark("text", []), newMark("rectangle", []), newMark("line", [])].map(markCss).join(";");
    expect(css).not.toMatch(/url\(|expression|javascript|["'<>{}]/i);
    expect(css).toContain("transform:rotate(0deg)");
  });
});
