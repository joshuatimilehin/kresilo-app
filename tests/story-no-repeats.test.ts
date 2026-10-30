import { describe, expect, it } from "vitest";
import { caseStudies } from "../src/creative/portfolio";
import { projectSlides } from "../src/creative/portfolio/story";

describe("a project's story slides never repeat a picture", () => {
  it("gives each slide its own picture, never the cover, and marks a slide that has none as words only", () => {
    for (const p of caseStudies) {
      const slides = projectSlides(p);
      const pictured = slides.filter((s) => !s.textOnly).map((s) => s.panel);
      expect(new Set(pictured).size, `${p.id} repeats a picture`).toBe(pictured.length);
      expect(pictured.includes(p.panels[0]), `${p.id} shows its cover again`).toBe(false);
      for (const s of slides) expect(s.text.length, `${p.id} ${s.id}`).toBeGreaterThan(0);
      // Pictures only run out when the project's own panels do.
      const available = p.panels.length - 1;
      expect(pictured.length, p.id).toBe(Math.min(slides.length, pictured.length));
      expect(pictured.length).toBeLessThanOrEqual(available);
    }
  });

  it("keeps the story in order: brief, idea, the captioned panels, outcome", () => {
    for (const p of caseStudies) {
      const ids = projectSlides(p).map((s) => s.id);
      expect(ids[0]).toBe(`${p.id}-brief`);
      expect(ids[1]).toBe(`${p.id}-idea`);
      expect(ids.at(-1)).toBe(`${p.id}-outcome`);
    }
  });
});
