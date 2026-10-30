import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  COLLECTION_LABEL,
  COLLECTION_NOTE,
  collectionById,
  collectionFacts,
  collectionWorks,
  collections,
  collectionsFor,
} from "../src/creative/collections";
import { works } from "../src/creative/catalog";
import { isSampleMaker, makerById } from "../src/creative/makers";

describe("curated collections", () => {
  it("only point at works that exist, with no repeats inside one collection", () => {
    for (const c of collections) {
      expect(collectionWorks(c), c.id).toHaveLength(c.workIds.length);
      expect(new Set(c.workIds).size, c.id).toBe(c.workIds.length);
    }
  });

  it("are small, have unique ids and a theme in plain words", () => {
    expect(new Set(collections.map((c) => c.id)).size).toBe(collections.length);
    for (const c of collections) {
      expect(c.workIds.length, c.id).toBeGreaterThanOrEqual(3);
      expect(c.workIds.length, c.id).toBeLessThanOrEqual(8);
      expect(c.theme.length, c.id).toBeGreaterThan(20);
    }
  });

  it("span more than one maker and more than one region, so no theme stands for a place", () => {
    for (const c of collections) {
      const f = collectionFacts(c);
      expect(f.makers.length, c.id).toBeGreaterThanOrEqual(2);
      expect(f.regions.length, c.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("credit every work to a maker in the roster", () => {
    for (const c of collections)
      for (const w of collectionWorks(c)) {
        expect(makerById(w.creatorId), `${c.id}/${w.id}`).toBeTruthy();
        expect(isSampleMaker(w.creatorId)).toBe(true);
      }
    expect(COLLECTION_LABEL).toBe("Collection");
    expect(COLLECTION_NOTE).toMatch(/not by claims about where it comes from/);
    expect(COLLECTION_NOTE).toMatch(/keeps its maker’s credit/);
  });

  it("count facts from the works rather than state them", () => {
    const c = collectionById("long-evening-light")!;
    const f = collectionFacts(c);
    expect(f.works).toBe(c.workIds.length);
    expect(f.makers).toEqual([...new Set(collectionWorks(c).map((w) => w.creator))]);
  });

  it("let a work say which collections it is in", () => {
    expect(collectionsFor("tidal-lines").map((c) => c.id)).toEqual(["long-evening-light", "colour-in-small-spaces"]);
    expect(collectionsFor("never-in-one")).toEqual([]);
    expect(works.some((w) => w.id === "tidal-lines")).toBe(true);
  });

  it("make no cultural claim: theme text names no tradition, ceremony or community", () => {
    const text = collections.map((c) => `${c.title} ${c.theme}`).join(" ");
    expect(text).not.toMatch(/tradition|ritual|ceremon|sacred|heritage|ancestr|tribe|indigenous/i);
  });
});

describe("collections page wording", () => {
  it("adds no sample or fictional wording of its own", () => {
    const source = readFileSync("src/creative/CollectionPages.tsx", "utf8");
    expect(source).not.toContain("SampleBadge");
    expect(source).not.toMatch(/fictional|made-up|imaginary/i);
  });
});
