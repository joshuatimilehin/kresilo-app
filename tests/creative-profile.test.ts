import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  PROFILE_TABS,
  disciplineLine,
  disciplines,
  hasPortrait,
  initials,
  lineageCaption,
  makerShorts,
  makerStories,
  makerWorks,
  nameParts,
  nextTab,
  panelId,
  playsOnHover,
  tabCounts,
  tabFromSearch,
  tabHref,
  tabId,
  tabLabel,
  workLineage,
  type ProfileWork,
} from "../src/creative/profile";
import { assets, creators, works } from "../src/creative/catalog";

const work = (over: Partial<ProfileWork> & { id: string }): ProfileWork => ({
  title: over.id,
  creatorId: "a",
  asset: "mineral",
  tags: [],
  ...over,
});
const url = (a: string) => `/img/${a}`;

describe("active tab from the URL", () => {
  it("defaults to Projects", () => {
    expect(tabFromSearch("")).toBe("projects");
    expect(tabFromSearch(null)).toBe("projects");
    expect(tabFromSearch(undefined)).toBe("projects");
    expect(tabFromSearch("?other=1")).toBe("projects");
  });
  it("reads stories and shorts, with or without the question mark", () => {
    expect(tabFromSearch("?tab=stories")).toBe("stories");
    expect(tabFromSearch("tab=shorts")).toBe("shorts");
    expect(tabFromSearch("?x=1&tab=shorts")).toBe("shorts");
    expect(tabFromSearch(new URLSearchParams("tab=stories"))).toBe("stories");
  });
  it("falls back to Projects for unknown, wrongly cased or empty values", () => {
    expect(tabFromSearch("?tab=reels")).toBe("projects");
    expect(tabFromSearch("?tab=Stories")).toBe("projects");
    expect(tabFromSearch("?tab=")).toBe("projects");
    expect(tabFromSearch("?tab=__proto__")).toBe("projects");
    expect(tabFromSearch("?tab=toString")).toBe("projects");
  });
  it("round trips through tabHref", () => {
    for (const tab of PROFILE_TABS) {
      const href = tabHref("ayo-bello", tab);
      expect(tabFromSearch(href.split("?")[1] ?? "")).toBe(tab);
    }
    expect(tabHref("ayo-bello", "projects")).toBe("/people/ayo-bello");
    expect(tabHref("ayo-bello", "assets")).toBe("/people/ayo-bello?tab=assets");
    expect(tabHref("ayo-bello", "stories")).toBe(
      "/people/ayo-bello?tab=stories",
    );
    expect(tabHref("a b", "shorts")).toBe("/people/a%20b?tab=shorts");
  });
});

describe("keyboard model for the tab list", () => {
  it("moves with the arrow keys and wraps", () => {
    expect(nextTab("posts", "ArrowRight")).toBe("stories");
    expect(nextTab("stories", "ArrowRight")).toBe("shorts");
    expect(nextTab("shorts", "ArrowRight")).toBe("projects");
    expect(nextTab("projects", "ArrowLeft")).toBe("shorts");
    expect(nextTab("posts", "ArrowLeft")).toBe("assets");
    expect(nextTab("shorts", "ArrowLeft")).toBe("stories");
  });
  it("jumps with Home and End and ignores other keys", () => {
    expect(nextTab("stories", "Home")).toBe("projects");
    expect(nextTab("stories", "End")).toBe("shorts");
    expect(nextTab("stories", "Enter")).toBeNull();
    expect(nextTab("stories", "a")).toBeNull();
  });
  it("gives every tab a unique id and panel id", () => {
    const ids = PROFILE_TABS.flatMap((t) => [tabId(t), panelId(t)]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("what a maker has", () => {
  const all = [
    work({ id: "1", creatorId: "a", motionSrc: "/m1.mp4" }),
    work({ id: "2", creatorId: "b" }),
    work({ id: "3", creatorId: "a" }),
    work({ id: "4", creatorId: "a", motionSrc: "/m4.mp4" }),
  ];
  it("keeps only that maker's works, in order", () => {
    expect(makerWorks("a", all).map((w) => w.id)).toEqual(["1", "3", "4"]);
    expect(makerWorks("nobody", all)).toEqual([]);
  });
  it("keeps only motion works as shorts", () => {
    expect(makerShorts("a", all).map((w) => w.motionSrc)).toEqual([
      "/m1.mp4",
      "/m4.mp4",
    ]);
    expect(makerShorts("b", all)).toEqual([]);
  });
  it("builds one story per maker that has works", () => {
    const own = makerWorks("a", all);
    const stories = makerStories({ id: "a", name: "A B" }, own, url);
    expect(stories).toHaveLength(1);
    expect(stories[0]).toMatchObject({
      id: "a",
      title: "Behind the Reference",
      image: "/img/mineral",
      slideCount: 3,
      byline: "A B · Process story",
    });
    expect(makerStories({ id: "x", name: "X" }, [], url)).toEqual([]);
  });
  it("opens Ayo's story on the process desk photo, as the viewer does", () => {
    const own = [work({ id: "w", creatorId: "ayo-bello" })];
    expect(
      makerStories({ id: "ayo-bello", name: "Ayo Bello" }, own, url)[0].image,
    ).toBe("/assets/kresilo/process-desk.webp");
  });
  it("counts and labels the tabs", () => {
    const counts = tabCounts([1, 2, 3], [1], []);
    expect(counts).toEqual({ projects: 0, assets: 0, posts: 3, stories: 1, shorts: 0 });
    expect(tabCounts([1], [], [], [1, 2], [1])).toMatchObject({ projects: 2, assets: 1 });
    expect(tabLabel("posts", counts)).toBe("Studies 3");
    expect(tabLabel("shorts", counts)).toBe("Shorts 0");
  });
});

describe("the real catalogue", () => {
  it("gives every maker with works a story that points at them", () => {
    // The roster also holds makers with no works yet; their tabs show an empty state.
    expect(creators.filter((c) => makerWorks(c.id, works).length > 0).length).toBeGreaterThanOrEqual(6);
    for (const c of creators) {
      const own = makerWorks(c.id, works);
      if (!own.length) continue;
      const [story] = makerStories(c, own, (a) => assets[a]);
      expect(story.id).toBe(c.id);
      expect(story.image).toBeTruthy();
    }
  });
  it("lists only existing motion loops as shorts", () => {
    for (const c of creators)
      for (const s of makerShorts(c.id, works)) {
        expect(s.motionSrc).toMatch(/\.mp4$/);
        expect(s.creatorId).toBe(c.id);
      }
    expect(makerShorts("ayo-bello", works).length).toBe(2);
    expect(makerShorts("nia-mensah", works)).toEqual([]);
    expect(makerShorts("ines-duarte", works)).toEqual([]);
  });
  it("sums the posts across makers to the whole catalogue", () => {
    const total = creators.reduce(
      (n, c) => n + makerWorks(c.id, works).length,
      0,
    );
    expect(total).toBe(works.length);
  });
});

describe("tile caption", () => {
  it("shows both numbers when both are known", () => {
    expect(lineageCaption({ references: 4, usedIn: 2 })).toBe(
      "Made from 4 references · Used in 2 posts",
    );
  });
  it("uses singular forms", () => {
    expect(lineageCaption({ references: 1, usedIn: 1 })).toBe(
      "Made from 1 reference · Used in 1 post",
    );
  });
  it("keeps zero, which is a real number", () => {
    expect(lineageCaption({ references: 0, usedIn: 0 })).toBe(
      "Made from 0 references · Used in 0 posts",
    );
  });
  it("shows only the part that is known", () => {
    expect(lineageCaption({ references: 3 })).toBe("Made from 3 references");
    expect(lineageCaption({ usedIn: 5 })).toBe("Used in 5 posts");
  });
  it("omits the line when nothing is known or the data is not a count", () => {
    expect(lineageCaption()).toBeNull();
    expect(lineageCaption({})).toBeNull();
    expect(lineageCaption({ references: Number.NaN })).toBeNull();
    expect(lineageCaption({ references: -1, usedIn: 1.5 })).toBeNull();
  });
  it("invents no numbers: the catalogue has no lineage data yet", () => {
    for (const w of works) expect(lineageCaption(workLineage[w.id])).toBeNull();
  });
});

describe("cover text", () => {
  it("lists the most common tags first, ties by first appearance", () => {
    const own = [
      work({ id: "1", tags: ["light", "colour"] }),
      work({ id: "2", tags: ["colour", "type", "light"] }),
      work({ id: "3", tags: ["colour", "print"] }),
    ];
    expect(disciplines(own)).toEqual(["colour", "light", "type"]);
    expect(disciplines(own, 1)).toEqual(["colour"]);
    expect(disciplineLine(own)).toBe("Colour · Light · Type");
    expect(disciplines([])).toEqual([]);
    expect(disciplineLine([])).toBe("");
  });
  it("splits names into upright and italic parts", () => {
    expect(nameParts("Ayo Bello")).toEqual({ first: "Ayo", last: "Bello" });
    expect(nameParts("Inês Duarte")).toEqual({ first: "Inês", last: "Duarte" });
    expect(nameParts("Mary Jane Watson")).toEqual({
      first: "Mary Jane",
      last: "Watson",
    });
    expect(nameParts("Cher")).toEqual({ first: "Cher", last: "" });
    expect(nameParts("  Ren   Sato ")).toEqual({ first: "Ren", last: "Sato" });
    expect(nameParts("")).toEqual({ first: "", last: "" });
  });
  it("makes initials", () => {
    expect(initials("Ren Sato")).toBe("RS");
    expect(initials("Inês Duarte")).toBe("ID");
    expect(initials("Cher")).toBe("C");
    expect(initials("Mary Jane Watson")).toBe("MJ");
    expect(initials("")).toBe("");
  });
  it("tells photographic portraits from vector marks", () => {
    expect(hasPortrait("/assets/kresilo/ayo-portrait.webp")).toBe(true);
    expect(hasPortrait("/assets/kresilo/ren-mark.svg")).toBe(false);
    expect(hasPortrait("/x/mark.SVG?v=2")).toBe(false);
    expect(hasPortrait("")).toBe(false);
    expect(hasPortrait(undefined)).toBe(false);
    const withPortrait = creators.filter((c) => hasPortrait(c.portrait));
    // The first three have drawn-from-life portraits; others gain generated ones as their files arrive.
    expect(withPortrait.map((c) => c.id).slice(0, 3)).toEqual(["ayo-bello", "nia-mensah", "marina-costa"]);
    for (const c of withPortrait) expect(existsSync(`public${c.portrait.split("?")[0]}`), c.id).toBe(true);
  });
});

describe("motion preference", () => {
  it("never starts a short on hover when motion is reduced", () => {
    expect(playsOnHover(true)).toBe(false);
    expect(playsOnHover(false)).toBe(true);
  });
});
