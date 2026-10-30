import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { caseStudies } from "../src/creative/portfolio";
import { endlessHome, homeProjects, inWindow, reelProjects } from "../src/creative/portfolio/feed";

describe("opening a project starts a reel of projects", () => {
  const start = homeProjects()[5].id;

  it("starts on the project you opened, then follows Home's order", () => {
    const home = homeProjects().map((c) => c.id);
    const first = reelProjects(start, 1).map((c) => c.id);
    expect(first[0]).toBe(start);
    expect(first).toHaveLength(caseStudies.length);
    expect(first.slice(0, 3)).toEqual([home[5], home[6], home[7]]);
    // Home's tail wraps round to its head, so nothing opened from the end is a dead end.
    expect(first.at(-1)).toBe(home[4]);
  });

  it("never runs out: each further stretch holds every project again, with no repeat at the joins", () => {
    const three = reelProjects(start, 3).map((c) => c.id);
    expect(three).toHaveLength(caseStudies.length * 3);
    for (let n = 1; n < 3; n++) {
      const stretch = three.slice(n * caseStudies.length, (n + 1) * caseStudies.length);
      expect([...stretch].sort()).toEqual(caseStudies.map((c) => c.id).sort());
    }
    for (let i = 1; i < three.length; i++) expect(three[i], `at ${i}`).not.toBe(three[i - 1]);
  });

  it("is the same on every visit", () => {
    expect(reelProjects(start, 2).map((c) => c.id)).toEqual(reelProjects(start, 2).map((c) => c.id));
  });

  it("the full page lives at /case/:id/read and the reel links to it", () => {
    const app = readFileSync("src/App.tsx", "utf8");
    expect(app).toContain('path="/case/:id/read"');
    expect(readFileSync("src/creative/ProjectReel.tsx", "utf8")).toContain("/case/${project.id}/read");
  });

  it("the whole project is one tap away from every slide, not only at the end of the row", () => {
    const src = readFileSync("src/creative/ProjectReel.tsx", "utf8");
    expect(src).toContain('className="reel-open"');
    // It shows what you are looking at (the slide's own picture), like a profile picture.
    expect(src).toContain('className="reel-open-thumb"');
    // The first slide names the project's category.
    expect(src).toContain('className="reel-kind"');
    expect(src).toContain("/case/${project.id}/read");
    // Back from the full page returns to the slide you left.
    expect(src).toContain("kresilo-reel-slide");
    expect(readFileSync("src/creative/portfolio/Pages.tsx", "utf8")).toContain("navigate(-1)");
    expect(src).toContain('className="reel-title-link"');
  });

  it("a words-only slide is drawn as text, not as a repeated picture", () => {
    const reel = readFileSync("src/creative/ProjectReel.tsx", "utf8");
    expect(reel).toContain("<StoryTextCard");
    expect(readFileSync("src/creative/WorkReel.tsx", "utf8")).toContain("<StoryTextCard");
  });

  it("draws only the slides near the one in view", () => {
    const drawn = Array.from({ length: 200 }, (_, i) => i).filter((i) => inWindow(i, 50));
    expect(drawn).toEqual([49, 50, 51]);
    expect(inWindow(0, 0)).toBe(true);
  });

  it("Home's grid never runs out either: Home's order first, then more, never the same project twice in a row", () => {
    const home = homeProjects().map((c) => c.id);
    const feed = endlessHome(3).map((c) => c.id);
    expect(feed.slice(0, caseStudies.length)).toEqual(home);
    expect(feed).toHaveLength(caseStudies.length * 3);
    for (let i = 1; i < feed.length; i++) expect(feed[i], `at ${i}`).not.toBe(feed[i - 1]);
  });
});
