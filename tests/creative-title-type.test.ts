import { describe, expect, it } from "vitest";
import { artPatch, commands, defaultTitleType, newProject, titleTypeSchema } from "../src/creative/contracts";
import { titleCss, titleStyle } from "../src/creative/layers";
import { hasTypeControl, typeControlLevel } from "../src/creative/tools";

describe("title type: schema", () => {
  it("accepts the default look and a changed one inside an artwork patch", () => {
    expect(titleTypeSchema.safeParse(defaultTitleType).success).toBe(true);
    expect(artPatch.safeParse({ titleType: { ...defaultTitleType, font: "sans", italic: false, weight: 700, align: "center" } }).success).toBe(true);
    expect(artPatch.safeParse({ title: "Only a title" }).success).toBe(true);
  });

  it("refuses unknown fonts, out-of-range numbers and extra keys", () => {
    const bad = [
      { font: "comic-sans" },
      { weight: 350 },
      { weight: 1000 },
      { align: "justify" },
      { lineHeight: 0.2 },
      { lineHeight: 3 },
      { tracking: -20 },
      { tracking: 50 },
      { fontFamily: "x; background:url(//evil)" },
    ];
    for (const change of bad) expect(titleTypeSchema.safeParse({ ...defaultTitleType, ...change }).success, JSON.stringify(change)).toBe(false);
  });

  it("travels through the one artwork command", () => {
    const input = { projectId: crypto.randomUUID(), revision: 1, patch: { titleType: defaultTitleType } };
    expect(commands["artwork.edit"].safeParse(input).success).toBe(true);
  });
});

describe("title type: rendering", () => {
  it("leaves a title with no type settings exactly as it was", () => {
    expect(titleStyle(undefined)).toEqual({});
    expect(titleCss(undefined)).toBe("");
    expect(newProject(crypto.randomUUID(), "x").art.titleType).toBeUndefined();
  });

  it("writes the same look for the screen and for the motion export, with each one's own fonts", () => {
    const type = { ...defaultTitleType, font: "sans" as const, italic: false, weight: 700, align: "center" as const, lineHeight: 1.1, tracking: 2 };
    expect(titleStyle(type)).toEqual({
      fontFamily: "Inter, Arial, sans-serif",
      fontStyle: "normal",
      fontWeight: 700,
      textAlign: "center",
      lineHeight: 1.1,
      letterSpacing: "0.02em",
    });
    expect(titleCss(type)).toBe("font-family:KresiloSans,Arial;font-style:normal;font-weight:700;text-align:center;line-height:1.1;letter-spacing:0.02em");
    expect(titleStyle(defaultTitleType, "export").fontFamily).toBe("Poster,serif");
  });

  it("only ever emits characters a font name, number or keyword can produce", () => {
    for (const font of ["poster", "sans"] as const)
      expect(titleCss({ ...defaultTitleType, font })).not.toMatch(/url\(|expression|javascript|["'<>{}]/i);
  });
});

describe("title type: help levels", () => {
  it("gives beginners colour and size only, casual font, weight and alignment, expert the spacing too", () => {
    expect(Object.keys(typeControlLevel).filter((c) => hasTypeControl("guided", c as never))).toEqual([]);
    expect(Object.keys(typeControlLevel).filter((c) => hasTypeControl("explorer", c as never))).toEqual(["font", "weight", "align"]);
    expect(Object.keys(typeControlLevel).filter((c) => hasTypeControl("advanced", c as never))).toEqual(["font", "weight", "align", "spacing"]);
  });
});
