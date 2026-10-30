import { describe, expect, it } from "vitest";
import { caseKindLabel, caseStudies } from "../src/creative/portfolio";
import { homeProjects } from "../src/creative/portfolio/feed";
import {
  disciplineMatches,
  isFiltering,
  kindSynonyms,
  normalise,
  placeMatches,
  searchProjects,
  suggestedProjects,
  textMatches,
} from "../src/creative/portfolio/searchIndex";
import { DISCIPLINES, makerById, makers } from "../src/creative/makers";

const titles = (q: string, more = {}) => searchProjects({ query: q, ...more }).map((p) => p.title);
const byTitle = (title: string) => caseStudies.find((c) => c.title === title)!;
const makerName = (id: string) => makerById(id)!.name;

describe("Discover finds projects", () => {
  it("folds accents, case and punctuation", () => {
    expect(normalise("Inês  DUARTE-Vũ")).toBe("ines duarte vu");
    expect(normalise("São Paulo")).toBe("sao paulo");
    expect(textMatches("sao", "São Paulo")).toBe(true);
    expect(textMatches("", "anything")).toBe(true);
  });

  it("finds the projects the live site missed", () => {
    expect(titles("ferry")).toEqual(expect.arrayContaining(["Praamiaeg", "Harbour Hours", "Fjord Post"]));
    expect(titles("bakery").length).toBeGreaterThanOrEqual(3);
    expect(searchProjects({ query: "Kertu" }).every((p) => makerName(p.makerId) === "Kertu Vaher")).toBe(true);
    expect(searchProjects({ query: "Kertu" }).length).toBe(caseStudies.filter((c) => c.makerId === "kertu-vaher").length);
  });

  it("matches Ines to Inês and Vu to Vũ", () => {
    const ines = searchProjects({ query: "ines" });
    expect(ines.length).toBeGreaterThan(0);
    expect(ines.every((p) => makerName(p.makerId) === "Inês Duarte")).toBe(true);
    expect(searchProjects({ query: "VU" }).some((p) => makerName(p.makerId) === "Vũ Bảo Ngân")).toBe(true);
    expect(titles("Inês")).toEqual(titles("ines"));
  });

  it("needs every word of the query (AND)", () => {
    const one = titles("ferry");
    const both = titles("ferry kertu");
    expect(both.length).toBeGreaterThan(0);
    expect(both.length).toBeLessThan(one.length);
    expect(titles("ferry zzzzqx")).toEqual([]);
    expect(titles("ferry kertu")).toEqual(["Praamiaeg"]);
  });

  it("matches whole words, or the start of longer ones, not any substring", () => {
    expect(titles("ferr").sort()).toEqual(titles("ferry").sort());
    expect(titles("erry")).toEqual([]);
    // "app" is a word, not the start of "apparel" or "happy".
    for (const p of searchProjects({ query: "app" })) {
      const text = JSON.stringify([p.title, p.tagline, p.story, p.client, p.kind]).toLowerCase();
      expect(/\bapps?\b/.test(text) || p.kind === "ui-ux" || makerById(p.makerId)!.discipline === "ui and ux design").toBe(true);
    }
  });

  it("puts a title match before a story-only match, with Home's order breaking ties", () => {
    const a = { ...byTitle("Praamiaeg"), id: "t-a", title: "Quillon", tagline: "x", client: { name: "Aaa", what: "x" }, story: { brief: "x", idea: "x", outcome: "x" } };
    const b = { ...a, id: "t-b", title: "Other", story: { brief: "a quillon", idea: "x", outcome: "x" } };
    const c = { ...b, id: "t-c" };
    const d = { ...a, id: "t-d", title: "Quillon again" };
    const source = [b, c, a, d];
    expect(searchProjects({ query: "quillon" }, source).map((p) => p.id)).toEqual(["t-a", "t-d", "t-b", "t-c"]);
    // Same search, same list.
    expect(searchProjects({ query: "quillon" }, source).map((p) => p.id)).toEqual(["t-a", "t-d", "t-b", "t-c"]);
  });

  it("keeps Home's order when nothing is typed", () => {
    expect(searchProjects({ makerId: "ayo-bello" }).map((p) => p.id)).toEqual(homeProjects(["ayo-bello"]).map((p) => p.id));
    expect(searchProjects({}).map((p) => p.id)).toEqual(homeProjects().map((p) => p.id));
  });

  it("accepts a few synonyms for kinds and disciplines", () => {
    for (const q of ["app", "interface"]) {
      expect(searchProjects({ query: q }).some((p) => p.kind === "ui-ux"), q).toBe(true);
    }
    expect(searchProjects({ query: "film" }).some((p) => p.kind === "motion")).toBe(true);
    expect(searchProjects({ query: "video" }).some((p) => makerById(p.makerId)!.discipline === "video editing")).toBe(true);
    for (const q of ["logo", "identity"]) {
      expect(searchProjects({ query: q }).some((p) => p.kind === "brand-identity"), q).toBe(true);
    }
    const app = searchProjects({ query: "app" }).map((p) => p.id);
    expect(searchProjects({ query: "apps" }).map((p) => p.id)).toEqual(expect.arrayContaining(app));
    expect(Object.keys(kindSynonyms).sort()).toEqual(Object.keys(caseKindLabel).sort());
  });

  it("matches the label of a kind, a place and a region", () => {
    expect(searchProjects({ query: "ui and ux" }).every((p) => p.kind === "ui-ux" || makerById(p.makerId)!.discipline === "ui and ux design" || /ux/i.test(JSON.stringify(p)))).toBe(true);
    expect(titles("lagos").length).toBeGreaterThan(0);
    expect(searchProjects({ query: "west africa" }).every((p) => makerById(p.makerId)!.region === "West Africa")).toBe(true);
  });
});

describe("Discover filters apply to projects", () => {
  it("filters by creator", () => {
    const list = searchProjects({ makerId: "ayo-bello" });
    expect(list.length).toBe(caseStudies.filter((c) => c.makerId === "ayo-bello").length);
    expect(list.every((p) => p.makerId === "ayo-bello")).toBe(true);
    expect(searchProjects({ makerId: "ayo-bello", query: "ferry" }).map((p) => p.title)).toEqual(["Harbour Hours"]);
  });

  it("filters by discipline, from the maker, for every discipline the roster has", () => {
    for (const d of DISCIPLINES) {
      const list = searchProjects({ discipline: d });
      for (const p of list) expect(disciplineMatches(p, d)).toBe(true);
      const owned = caseStudies.filter((c) => makerById(c.makerId)!.discipline === d);
      for (const p of owned) expect(list.map((x) => x.id)).toContain(p.id);
    }
    expect(searchProjects({ discipline: "video editing" }).length).toBeGreaterThan(0);
    // A tag from the works list that is also a kind.
    expect(searchProjects({ discipline: "motion" }).some((p) => p.kind === "motion")).toBe(true);
    expect(searchProjects({ discipline: "light" })).toEqual([]);
  });

  it("filters by place: city, country, region or area", () => {
    const lagos = makerById("ayo-bello")!;
    expect(placeMatches(lagos, "Lagos")).toBe(true);
    expect(placeMatches(lagos, "lagos, nigeria")).toBe(true);
    expect(placeMatches(lagos, "Nigeria")).toBe(true);
    expect(placeMatches(lagos, "West Africa")).toBe(true);
    expect(placeMatches(lagos, "Lisbon")).toBe(false);
    const list = searchProjects({ place: "Lagos" });
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((p) => makerById(p.makerId)!.place.startsWith("Lagos"))).toBe(true);
    // Every city in the picker finds projects.
    for (const city of new Set(makers.map((m) => m.place.split(",")[0]))) {
      expect(searchProjects({ place: city }).length, city).toBeGreaterThan(0);
    }
  });

  it("filters to the makers you follow", () => {
    const list = searchProjects({ makerIds: ["ayo-bello", "kertu-vaher"] });
    expect(new Set(list.map((p) => p.makerId))).toEqual(new Set(["ayo-bello", "kertu-vaher"]));
    expect(searchProjects({ makerIds: [] })).toEqual([]);
  });

  it("splits motion from still", () => {
    const motion = searchProjects({ kind: "motion" });
    const still = searchProjects({ kind: "still" });
    expect(motion.every((p) => p.kind === "motion")).toBe(true);
    expect(still.every((p) => p.kind !== "motion")).toBe(true);
    expect(motion.length + still.length).toBe(caseStudies.length);
  });

  it("combines filters with a query", () => {
    const list = searchProjects({ query: "ferry", place: "Tallinn" });
    expect(list.map((p) => p.title)).toEqual(["Praamiaeg"]);
  });

  it("knows when Discover is narrowed", () => {
    expect(isFiltering({})).toBe(false);
    expect(isFiltering({ query: "  " })).toBe(false);
    for (const f of [{ query: "a" }, { makerId: "x" }, { discipline: "x" }, { place: "x" }, { kind: "motion" }, { makerIds: [] }]) {
      expect(isFiltering(f)).toBe(true);
    }
  });
});

describe("Discover when nothing matches", () => {
  it("finds nothing for a nonsense search and offers a few projects from different makers", () => {
    expect(searchProjects({ query: "qzxv" })).toEqual([]);
    const offer = suggestedProjects();
    expect(offer).toHaveLength(6);
    expect(new Set(offer.map((p) => p.makerId)).size).toBe(6);
    expect(suggestedProjects(3).map((p) => p.id)).toEqual(offer.slice(0, 3).map((p) => p.id));
  });
});
