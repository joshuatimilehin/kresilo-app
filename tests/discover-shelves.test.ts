import { describe, expect, it } from "vitest";
import { caseStudies } from "../src/creative/portfolio";
import { homeProjects } from "../src/creative/portfolio/feed";
import { kindCounts, projectOfTheWeek, projectsOfKind } from "../src/creative/DiscoverShelves";
import { readFileSync } from "node:fs";

describe("Discover is made of real projects", () => {
  it("counts the kinds of project, biggest first, and every project is in exactly one kind", () => {
    const k = kindCounts();
    expect(k.reduce((n, x) => n + x.count, 0)).toBe(caseStudies.length);
    for (let i = 1; i < k.length; i++) expect(k[i - 1].count).toBeGreaterThanOrEqual(k[i].count);
    for (const { kind, count } of k) expect(projectsOfKind(kind)).toHaveLength(count);
  });

  it("picks one project of the week: the same all week, a different one the next", () => {
    const week = 7 * 24 * 60 * 60 * 1000;
    const monday = 2900 * week;
    expect(projectOfTheWeek(monday).id).toBe(projectOfTheWeek(monday + week - 1).id);
    expect(projectOfTheWeek(monday).id).not.toBe(projectOfTheWeek(monday + week).id);
    expect(homeProjects().map((p) => p.id)).toContain(projectOfTheWeek(monday).id);
  });

  it("no longer opens on the leftover story and single posters", () => {
    const explore = readFileSync("src/creative/Explore.tsx", "utf8");
    expect(explore).toContain("<DiscoverShelves");
    expect(explore).not.toContain("DiscoverIntro");
    expect(explore).not.toContain("COLLECTION / LAGOS");
    // Single works only show once something narrows the page.
    expect(explore).toContain('(narrowed || mode !== "For you" ? shown : [])');
  });

  it("keeps sideways rows from widening the page", () => {
    const css = readFileSync("src/creative/discover.css", "utf8");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr)");
    expect(css).toMatch(/\.dx > \* \{\s*min-width: 0;/);
  });
});
