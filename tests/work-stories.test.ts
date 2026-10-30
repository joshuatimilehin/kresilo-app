import { describe, expect, it } from "vitest";
import { works } from "../src/creative/catalog";
import { projectById } from "../src/creative/portfolio";
import { projectSlides } from "../src/creative/portfolio/story";
import { workCommentSeeds } from "../src/creative/workCommentSeeds";
import { creatorFor } from "../src/creative/catalog";

describe("every work has a story", () => {
  it("comes from a project by the same maker", () => {
    for (const w of works) {
      const p = projectById(w.projectId);
      expect(p, w.id).toBeDefined();
      expect(p?.makerId, w.id).toBe(w.creatorId);
      expect(w.description, w.id).not.toMatch(/AI-generated image/);
    }
  });

  it("tells the project slide by slide: brief, idea, captioned panels, outcome", () => {
    const p = projectById("after-light-trip")!;
    const slides = projectSlides(p);
    expect(slides[0].label).toBe("The brief");
    expect(slides[1].label).toBe("The idea");
    expect(slides.at(-1)?.label).toBe("What came of it");
    // The cover is the row's first card, so its caption is not a slide of its own.
    expect(slides.length).toBe(2 + p.panels.slice(1).filter((x) => x.caption).length + 1);
    expect(new Set(slides.map((s) => s.id)).size).toBe(slides.length);
  });

  it("has comments from real roster makers, never the work's own maker", () => {
    for (const [id, list] of Object.entries(workCommentSeeds)) {
      const w = works.find((x) => x.id === id);
      expect(w, id).toBeDefined();
      for (const c of list) {
        expect(creatorFor(c.by), `${id} ${c.by}`).toBeDefined();
        expect(c.by, id).not.toBe(w?.creatorId);
        expect(c.text.length).toBeLessThan(200);
      }
    }
  });
});
