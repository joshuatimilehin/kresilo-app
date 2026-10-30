import { describe, expect, it } from "vitest";
import { lineFromBrief, titleFromBrief } from "../src/creative/guidance";
import { accentForBrief, briefStartArt, groundForBrief, markSchema, newProject } from "../src/creative/contracts";
import { titleBottom } from "../server/creative/context";

const BAKERY = "A poster for my friend's bakery opening on Saturday, warm and hand-drawn, with the name Crumb & Co";

describe("a supporting line from the brief", () => {
  it("keeps what the piece is for, without the request, the owner, the name or the style", () => {
    expect(lineFromBrief(BAKERY)).toBe("Bakery opening on Saturday");
    expect(lineFromBrief("Flyer for a band night at The Crown on Friday, loud and gritty, called Static Bloom")).toBe(
      "Band night at The Crown on Friday",
    );
    expect(lineFromBrief("A ferry timetable app screen for island commuters, clean and calm, called Island Hop")).toBe(
      "Ferry timetable for island commuters",
    );
    expect(lineFromBrief("A poster for the library reading week in March, playful and bright, titled Read Out Loud")).toBe(
      "Library reading week in March",
    );
    expect(lineFromBrief("A warm, hand-drawn menu for our harvest supper in a rustic style, named The Long Table")).toBe("Harvest supper");
  });

  it("says nothing when the brief has nothing more than the title", () => {
    expect(lineFromBrief("Bakery")).toBe("");
    expect(lineFromBrief("Jazz")).toBe("");
    // Without a name the title already is the subject, so a line would only repeat it.
    expect(titleFromBrief("A poster for the library reading week in March, playful and bright")).toBe("Library reading week in March");
    expect(lineFromBrief("A poster for the library reading week in March, playful and bright")).toBe("");
    expect(lineFromBrief("Ferry timetable for island commuters", "Ferry timetable for island commuters")).toBe("");
    expect(lineFromBrief("Warm and hand-drawn, called Crumb")).toBe("");
    expect(lineFromBrief("   ")).toBe("");
  });

  it("keeps lines short", () => {
    const line = lineFromBrief("A poster for the annual neighbourhood street food and music festival on the old harbour front next Sunday, called Tide");
    expect(line.split(" ").length).toBeLessThanOrEqual(8);
    expect(line.length).toBeLessThanOrEqual(48);
    expect(line).not.toMatch(/\s(?:on|the|of|and)$/);
  });
});

describe("the first layout from a brief", () => {
  it("adds the brief's line clear of the title and a thin accent rule", () => {
    const art = briefStartArt(BAKERY);
    expect(art.title).toBe("Crumb & Co");
    const marks = art.marks ?? [];
    for (const m of marks) expect(markSchema.safeParse(m).success).toBe(true);
    const text = marks.find((m) => m.kind === "text");
    const rule = marks.find((m) => m.kind === "shape");
    expect(text).toMatchObject({ text: "Bakery opening on Saturday", color: groundForBrief(BAKERY).color });
    expect(text!.y).toBeGreaterThan(titleBottom(art));
    expect(text!.y + text!.height).toBeLessThanOrEqual(100);
    expect(rule).toMatchObject({ shape: "line", stroke: accentForBrief(BAKERY) });
    expect(rule!.y).toBeGreaterThanOrEqual(titleBottom(art) - 2);
    expect(rule!.y).toBeLessThan(text!.y);
    expect(accentForBrief(BAKERY)).not.toBe(art.canvasColor);
    expect(accentForBrief(BAKERY)).not.toBe(art.color);
  });

  it("gives a one-word brief the rule alone", () => {
    const art = briefStartArt("Bakery");
    expect(art.marks?.map((m) => m.kind)).toEqual(["shape"]);
  });

  it("starts the project's first version on the same layout", () => {
    const p = newProject(crypto.randomUUID(), BAKERY);
    expect(p.versions[0].art).toEqual(p.art);
    expect(p.versions[0].art.marks).not.toBe(p.art.marks);
  });
});
