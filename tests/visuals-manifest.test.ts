import { describe, expect, it } from "vitest";
import { checkLibraryOnDisk, checkManifest } from "../scripts/visuals-manifest";
import { visuals } from "../src/creative/visuals/library";
import { fixture } from "./visuals-fixture";

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const files = (list: { id: string }[] = fixture) => list.map((v) => `${v.id}.jpg`);

describe("the committed visual library", () => {
  it("matches the pictures on disk (passes while it is empty)", () => {
    const report = checkLibraryOnDisk();
    expect(report.errors).toEqual([]);
    expect(report.entries).toBe(visuals.length);
    expect(report.files).toBe(visuals.length);
  });
});

describe("checking a library against its pictures", () => {
  it("passes six good entries with their files", () => {
    const report = checkManifest(fixture, files(), () => jpeg);
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual([]);
    expect(report).toMatchObject({ entries: 6, files: 6 });
  });

  it("passes an empty library with an empty folder, and ignores dotfiles", () => {
    expect(checkManifest([], [".gitkeep"]).errors).toEqual([]);
  });

  it("flags an entry with no file and a file with no entry", () => {
    const report = checkManifest(fixture, [...files().slice(1), "stray-picture.jpg"]);
    expect(report.errors).toContain('"hand-drawn-loaf": no file hand-drawn-loaf.jpg in the picture folder');
    expect(report.errors).toContain("stray-picture.jpg: no entry in library.json");
  });

  it("flags files that are not JPEGs", () => {
    expect(checkManifest(fixture, [...files(), "notes.txt"]).errors).toContain("notes.txt: not a .jpg file");
    const report = checkManifest(fixture, files(), (name) => (name === "hand-drawn-loaf.jpg" ? Buffer.from("<svg>") : jpeg));
    expect(report.errors).toEqual(["hand-drawn-loaf.jpg: not a JPEG"]);
  });

  it("flags categories that do not exist, and unknown kinds, hands and shapes", () => {
    const bad = [{ ...fixture[0], category: "food" }, { ...fixture[1], kind: "colour" }, { ...fixture[2], hand: "pencil" }, { ...fixture[3], shape: "round" }];
    const report = checkManifest(bad, files(bad));
    expect(report.errors.join("\n")).toMatch(/category "food" is not one of the 17 categories/);
    expect(report.errors.join("\n")).toMatch(/kind must be ink or duotone/);
    expect(report.errors.join("\n")).toMatch(/hand must be one of/);
    expect(report.errors.join("\n")).toMatch(/shape must be one of/);
  });

  it("needs 8 to 20 distinct concepts", () => {
    const concepts = (n: number) => Array.from({ length: n }, (_, i) => `meaning ${i}`);
    const few = { ...fixture[0], concepts: concepts(7) };
    const many = { ...fixture[1], concepts: concepts(21) };
    const edge = [{ ...fixture[2], concepts: concepts(8) }, { ...fixture[3], concepts: concepts(20) }];
    const repeated = { ...fixture[4], concepts: [...concepts(7), "Meaning 0"] };
    const blank = { ...fixture[5], concepts: [...concepts(8), " "] };
    const report = checkManifest([few, many, ...edge, repeated, blank], files(fixture));
    expect(report.errors).toContain('"hand-drawn-loaf": 7 concepts; 8 to 20 are needed');
    expect(report.errors).toContain('"wheat-ear-linocut": 21 concepts; 8 to 20 are needed');
    expect(report.errors).toContain('"paper-grain-texture": concepts repeat');
    expect(report.errors).toContain('"sun-badge-stamp": concepts must be a list of words');
    expect(report.errors.filter((e) => e.startsWith('"vinyl-record-line"') || e.startsWith('"harbour-ferry-photo"'))).toEqual([]);
  });

  it("flags ids that are not kebab-case or are used twice", () => {
    const bad = [{ ...fixture[0], id: "Hand Drawn Loaf" }, { ...fixture[1] }, { ...fixture[1] }];
    const report = checkManifest(bad, ["wheat-ear-linocut.jpg"]);
    expect(report.errors.join("\n")).toMatch(/id must be kebab-case/);
    expect(report.errors).toContain('"wheat-ear-linocut": id is used twice');
  });

  it("warns, without failing, about a title that is not two to five words", () => {
    const report = checkManifest([{ ...fixture[0], title: "Loaf" }], ["hand-drawn-loaf.jpg"]);
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual(['"hand-drawn-loaf": title has 1 word; two to five read best']);
  });

  it("refuses a library that is not a list", () => {
    expect(checkManifest({}, []).errors).toEqual(["library.json must be a list"]);
  });
});
