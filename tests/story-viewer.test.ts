import { describe, expect, it } from "vitest";
import { keepsOwnKeys, keyAction, step, swipeAction, tapAction } from "../src/creative/storyNav";
import { makerStorySlides, STORY_PROJECTS } from "../src/creative/portfolio/story";
import { projectsByMaker } from "../src/creative/portfolio";
import { makers } from "../src/creative/makers";

describe("story keys", () => {
  it("moves with the arrows, page keys, Home and End, and closes with Escape", () => {
    expect(keyAction("ArrowRight")).toBe("next");
    expect(keyAction("ArrowLeft")).toBe("prev");
    expect(keyAction("ArrowDown")).toBe("next");
    expect(keyAction("PageUp")).toBe("prev");
    expect(keyAction("Home")).toBe("first");
    expect(keyAction("End")).toBe("last");
    expect(keyAction("Escape")).toBe("close");
    expect(keyAction("a")).toBeNull();
    expect(keyAction("Tab")).toBeNull();
  });

  it("swaps the horizontal arrows in a right-to-left page", () => {
    expect(keyAction("ArrowRight", true)).toBe("prev");
    expect(keyAction("ArrowLeft", true)).toBe("next");
    expect(keyAction("ArrowDown", true)).toBe("next");
  });

  it("leaves typing, buttons and links their own keys", () => {
    for (const tagName of ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"]) expect(keepsOwnKeys({ tagName })).toBe(true);
    expect(keepsOwnKeys({ tagName: "DIV", isContentEditable: true })).toBe(true);
    expect(keepsOwnKeys({ tagName: "DIV" })).toBe(false);
    expect(keepsOwnKeys(null)).toBe(false);
  });
});

describe("story steps", () => {
  it("stops at both ends and jumps to the first and last slide", () => {
    expect(step(0, 5, "prev")).toEqual({ index: 0, close: false });
    expect(step(4, 5, "next")).toEqual({ index: 4, close: false });
    expect(step(1, 5, "next")).toEqual({ index: 2, close: false });
    expect(step(3, 5, "first")).toEqual({ index: 0, close: false });
    expect(step(1, 5, "last")).toEqual({ index: 4, close: false });
    expect(step(2, 5, "close")).toEqual({ index: 2, close: true });
    expect(step(0, 0, "next")).toEqual({ index: 0, close: false });
  });
});

describe("swipes and taps", () => {
  it("reads a sideways drag as next or previous and a long downward drag as close", () => {
    expect(swipeAction(-90, 10)).toBe("next");
    expect(swipeAction(90, -10)).toBe("prev");
    expect(swipeAction(10, 160)).toBe("close");
    expect(swipeAction(-90, 10, true)).toBe("prev");
  });

  it("ignores short, diagonal or upward drags so scrolling and taps still work", () => {
    expect(swipeAction(20, 5)).toBeNull();
    expect(swipeAction(-80, 80)).toBeNull();
    expect(swipeAction(0, -200)).toBeNull();
    expect(swipeAction(10, 60)).toBeNull();
  });

  it("goes back on a tap in the left third and forward elsewhere, mirrored in right-to-left", () => {
    expect(tapAction(20, 300)).toBe("prev");
    expect(tapAction(150, 300)).toBe("next");
    expect(tapAction(290, 300)).toBe("next");
    expect(tapAction(280, 300, true)).toBe("prev");
    expect(tapAction(20, 300, true)).toBe("next");
    expect(tapAction(10, 0)).toBe("next");
  });
});

describe("a maker's story", () => {
  it("has real slides for every maker, made from their own projects", () => {
    for (const m of makers) {
      const slides = makerStorySlides(m.id);
      expect(slides.length, m.id).toBe(Math.min(STORY_PROJECTS, projectsByMaker(m.id).length) * 4);
      for (const s of slides) {
        expect(s.project.makerId).toBe(m.id);
        expect(s.text.length).toBeGreaterThan(20);
      }
    }
  });

  it("does not give two makers the same captions", () => {
    const texts = makers.flatMap((m) => makerStorySlides(m.id).map((s) => s.text));
    expect(new Set(texts).size).toBeGreaterThan(texts.length * 0.9);
    expect(texts.join(" ")).not.toMatch(/I kept the horizon low/);
  });

  it("tells each project in order: cover, brief, idea, outcome", () => {
    const [a, b, c, d] = makerStorySlides("ren-sato");
    expect([a.label.includes("·"), b.label, c.label, d.label]).toEqual([true, "The brief", "The idea", "What came of it"]);
  });
});
