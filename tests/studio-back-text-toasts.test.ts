import { describe, expect, it } from "vitest";
import { artPatch, MAX_MARKS, newProject, type Art, type TextMark } from "../src/creative/contracts";
import { addTextLine, newMark, textLineSpot } from "../src/creative/marks";
import { planBack } from "../src/creative/backNav";
import { toastPlace } from "../src/creative/toastPlace";

// A canvas with no text or shapes yet (a brief start comes with an accent rule).
const art = (over: Partial<Art> = {}): Art => ({ ...newProject(crypto.randomUUID(), "Text").art, marks: [], ...over });
/** The title's band in % of the canvas height, as the poster draws it. */
const titleBand = (a: Art) => [a.y, a.y + a.size * a.title.split("\n").length * 0.85 * 0.75] as const;

describe("Text: add a line of text", () => {
  it("adds a text mark clear of the title, sized for a supporting line, and returns its id", () => {
    const a = art({ title: "Crumb & Co", x: 8, y: 10, size: 18 });
    const added = addTextLine(a)!;
    const line = added.marks.at(-1) as TextMark;
    expect(line.id).toBe(added.id);
    expect(line).toMatchObject({ kind: "text", visible: true, x: 6, width: 80, size: 5 });
    const [top, bottom] = titleBand(a);
    expect(line.y >= bottom || line.y + line.height <= top).toBe(true);
    expect(line.y + line.height).toBeLessThanOrEqual(98);
    expect(artPatch.safeParse({ marks: added.marks }).success).toBe(true);
  });

  it("keeps clear of a title in the lower third and of lines already added", () => {
    const a = art({ title: "Opening", y: 70, size: 16 });
    const first = addTextLine(a)!;
    const second = addTextLine({ ...a, marks: first.marks })!;
    const [one, two] = second.marks as TextMark[];
    expect(one.y + one.height <= two.y || two.y + two.height <= one.y).toBe(true);
    for (const l of [one, two]) {
      const [top, bottom] = titleBand(a);
      expect(l.y >= bottom || l.y + l.height <= top).toBe(true);
    }
  });

  it("names lines so none share a name, and stops at the mark limit", () => {
    let a = art();
    for (let i = 0; i < MAX_MARKS; i++) a = { ...a, marks: addTextLine(a)!.marks };
    expect(new Set(a.marks!.map((m) => m.name)).size).toBe(MAX_MARKS);
    expect(addTextLine(a)).toBeNull();
  });

  it("finds room on a wide canvas too", () => {
    const a = art({ format: "wide", y: 30, size: 12 });
    const h = Math.ceil(5 * 1.1 * (16 / 9) * 1.6);
    const y = textLineSpot(a, h);
    expect(y + h).toBeLessThanOrEqual(98);
    expect(newMark("text", []).kind).toBe("text");
  });
});

describe("Back goes where you came from", () => {
  it("steps back through history when the page before is in the app", () => {
    expect(planBack("/search?q=poster", "/projects/1")).toEqual({ kind: "history" });
    expect(planBack("/projects/1", "/projects/1")).toEqual({ kind: "history" });
  });

  it("goes to the parent when there is no earlier page in the app", () => {
    expect(planBack(undefined, "/projects/1")).toEqual({ kind: "go", to: "/projects/1", replace: false });
  });

  it("steps over a finished Create form and pages that would loop back", () => {
    expect(planBack("/create", "/projects/1")).toEqual({ kind: "go", to: "/projects/1", replace: false });
    expect(planBack("/motion/1", "/projects/1", { skip: ["/motion/1"] })).toMatchObject({ kind: "go", to: "/projects/1" });
    expect(planBack("/motion/2", "/projects/1", { skip: ["/motion/1"] })).toEqual({ kind: "history" });
  });

  it("returns Motion to its canvas: back when it came from there, otherwise in place of Motion", () => {
    expect(planBack("/studio/1?layer=a", "/studio/1", { within: "/studio/1" })).toEqual({ kind: "history" });
    expect(planBack("/projects", "/studio/1", { within: "/studio/1" })).toEqual({ kind: "go", to: "/studio/1", replace: true });
    expect(planBack(undefined, "/studio/1", { within: "/studio/1" })).toEqual({ kind: "go", to: "/studio/1", replace: true });
  });
});

describe("toasts never cover controls", () => {
  const desktop = { width: 1280, height: 800 };
  const phone = { width: 390, height: 844 };

  it("sits at the bottom when nothing rests there", () => {
    expect(toastPlace([], desktop)).toEqual({ side: "bottom", lift: 0 });
  });

  it("rises above the phone's bottom bar and an open tool sheet", () => {
    const bar = { top: 780, bottom: 844, left: 0, right: 390 };
    const sheet = { top: 520, bottom: 760, left: 8, right: 382 };
    expect(toastPlace([bar], phone)).toEqual({ side: "bottom", lift: 76 });
    expect(toastPlace([bar, sheet], phone)).toEqual({ side: "bottom", lift: 336 });
  });

  it("rises above the assistant when it sits in the toast's lane", () => {
    const assistant = { top: 400, bottom: 776, left: 500, right: 920 };
    expect(toastPlace([assistant], { width: 940, height: 800 })).toEqual({ side: "bottom", lift: 412 });
    // On a wide screen the assistant is off to the right, clear of the toast.
    expect(toastPlace([{ top: 400, bottom: 776, left: 836, right: 1256 }], desktop)).toEqual({ side: "bottom", lift: 0 });
  });

  it("drops in from the top when the whole lane is taken", () => {
    const tall = { top: 96, bottom: 770, left: 420, right: 900 };
    expect(toastPlace([tall], { width: 900, height: 800 })).toEqual({ side: "top" });
  });
});
