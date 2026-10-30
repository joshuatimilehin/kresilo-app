import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { caseStudies } from "../src/creative/portfolio";
import { artThumb } from "../src/creative/portfolio/art";
import { FeedProjectCard } from "../src/creative/portfolio/Cards";
import { homeProjects } from "../src/creative/portfolio/feed";
import { makerById, makers } from "../src/creative/makers";

const card = (id: string) => {
  const project = caseStudies.find((c) => c.id === id)!;
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(FeedProjectCard, { project })));
};

describe("Home is a feed of projects", () => {
  const feed = homeProjects();

  it("lists every case study from every maker, once", () => {
    expect(feed.map((c) => c.id).sort()).toEqual(caseStudies.map((c) => c.id).sort());
    expect(new Set(feed.map((c) => c.makerId)).size).toBe(makers.length);
  });

  it("interleaves makers and keeps the same order on every visit", () => {
    for (let i = 1; i < feed.length; i++) expect(feed[i].makerId, `${feed[i - 1].id} then ${feed[i].id}`).not.toBe(feed[i - 1].makerId);
    expect(homeProjects().map((c) => c.id)).toEqual(feed.map((c) => c.id));
    // The first screen is not one maker's catalogue: twelve cards, twelve makers.
    expect(new Set(feed.slice(0, 12).map((c) => c.makerId)).size).toBe(12);
  });

  it("keeps only the makers you follow on Following", () => {
    const followed = ["ayo-bello", makers[makers.length - 1].id];
    const mine = homeProjects(followed);
    expect(mine.length).toBe(caseStudies.filter((c) => followed.includes(c.makerId)).length);
    expect(mine.every((c) => followed.includes(c.makerId))).toBe(true);
  });

  it.each(feed.map((c) => [c.id] as const))("shows %s by its cover, title and maker, opening the case study", (id) => {
    const project = caseStudies.find((c) => c.id === id)!;
    const html = card(id);
    // Cards show the cover's small copy.
    const cover = artThumb(`panel:${id}:0`);
    if (cover) expect(html).toContain(`src="${cover.replace(/&/g, "&amp;")}"`);
    else expect(html).toMatch(/<svg[^>]*class="vis"/);
    expect(html).toContain(`href="/case/${id}"`);
    expect(html).toContain(project.title.replace(/&/g, "&amp;"));
    const maker = makerById(project.makerId)!;
    expect(html).toContain(`href="/people/${maker.id}"`);
    expect(html).toContain("creator-avatar");
    expect(html).toContain(maker.name.replace(/&/g, "&amp;"));
  });

  it("has no boards, single works, events or community posts", () => {
    const source = readFileSync("src/creative/Explore.tsx", "utf8");
    const home = source.slice(source.indexOf("export function Explore()"), source.indexOf("/** Discover's opening"));
    for (const gone of ["OpenBoardCard", "openBoards", "WorkVisual", "/api/community", "recommend(", "Meetups"]) expect(home).not.toContain(gone);
    expect(home).toContain("ProjectFeed");
  });
});
