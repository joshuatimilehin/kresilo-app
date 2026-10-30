import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  cleanCulture,
  culturalContextSchema,
  cultureRows,
  hasCulture,
  impactSignals,
} from "../src/creative/culture";
import { commands, newProject, publicProject, type Publication } from "../src/creative/contracts";

describe("cultural context is the maker's, optional and sourced", () => {
  it("is optional and shows only the fields the maker filled", () => {
    expect(hasCulture(undefined)).toBe(false);
    expect(cultureRows({})).toEqual([]);
    expect(cultureRows({ place: "Salt flats, evening", materials: "Risograph" }).map((r) => r.label)).toEqual(["Place", "Materials"]);
  });

  it("needs a named source when a tradition is named", () => {
    expect(culturalContextSchema.safeParse({ tradition: "Indigo dyeing" }).success).toBe(false);
    expect(culturalContextSchema.safeParse({ tradition: "Indigo dyeing", source: "My grandmother's workshop" }).success).toBe(true);
    expect(culturalContextSchema.safeParse({ practice: "Hand lettering" }).success).toBe(true);
  });

  it("refuses unknown fields, empty text and very long text", () => {
    expect(culturalContextSchema.safeParse({ meaning: "x" }).success).toBe(false);
    expect(culturalContextSchema.safeParse({ place: "  " }).success).toBe(false);
    expect(culturalContextSchema.safeParse({ place: "x".repeat(301) }).success).toBe(false);
  });

  it("stores nothing when the form is emptied", () => {
    expect(cleanCulture({ place: "  ", source: "" })).toBeUndefined();
    expect(cleanCulture({ place: " Lagos ", language: "" })).toEqual({ place: "Lagos" });
  });
});

describe("no AI path writes cultural context", () => {
  it("is absent from artwork patches, proposals and model replies", () => {
    const contracts = readFileSync("src/creative/contracts.ts", "utf8");
    const patch = contracts.slice(contracts.indexOf("export const artPatch"), contracts.indexOf("export const artPatch") + 1500);
    expect(patch).not.toMatch(/cultur/i);
    for (const file of ["server/creative/plan.ts", "server/creative/assistant.ts", "server/creative/context.ts"]) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/culturalContext|\.cultural\b/);
    }
  });
});

const pub = (creators: string[], audience: Publication["audience"] = "community"): Publication =>
  ({
    id: crypto.randomUUID(),
    audience,
    title: "t",
    description: "d",
    creator: "You",
    credits: creators.map((c) => ({ title: "w", creator: c, source: "/work/x" })),
    lineage: [],
  }) as unknown as Publication;

describe("honest impact signals", () => {
  it("counts published works that credit a maker, the regions touched and who is credited alongside", () => {
    const out = impactSignals(
      [pub(["Ren Sato"]), pub(["Ren Sato", "Ayo Bello"]), pub(["Marina Costa"]), pub(["Ren Sato"], "private")],
      "Ren Sato",
    );
    expect(out.worksReferencing).toBe(2);
    expect(out.regions).toEqual(["East Asia", "West Africa"]);
    expect(out.makersAlongside).toBe(1);
    expect(out.basis).toMatch(/not a measure of reach/);
  });

  it("reads the community list as it is stored, where posts carry no audience field", () => {
    const stored = pub(["Ren Sato"]) as unknown as Record<string, unknown>;
    delete stored.audience;
    expect(impactSignals([stored as unknown as Publication], "Ren Sato").worksReferencing).toBe(1);
  });

  it("shows zero as zero and never invents a score", () => {
    const out = impactSignals([], "Ren Sato");
    expect(out).toMatchObject({ worksReferencing: 0, regions: [], makersAlongside: 0 });
    expect(Object.keys(out).sort()).toEqual(["basis", "makersAlongside", "regions", "worksReferencing"]);
  });
});

describe("cultural context on a published post", () => {
  const base = () => newProject(crypto.randomUUID(), "A study", "Study");
  const input = {
    projectId: crypto.randomUUID(),
    revision: 1,
    audience: "community",
    description: "About",
  };

  it("travels with the post only when the maker wrote some, with blanks dropped", () => {
    expect(publicProject(base(), "d", "Ayo").culture).toBeUndefined();
    expect(publicProject(base(), "d", "Ayo", undefined, { place: "  " } as never).culture).toBeUndefined();
    expect(publicProject(base(), "d", "Ayo", undefined, { place: "Salt flats", practice: "Risograph" }).culture).toEqual({
      place: "Salt flats",
      practice: "Risograph",
    });
  });

  it("is checked when publishing: a tradition needs its source, and no extra claims get in", () => {
    const schema = commands["publication.create"];
    expect(schema.safeParse({ ...input, culture: { tradition: "Indigo dyeing" } }).success).toBe(false);
    expect(schema.safeParse({ ...input, culture: { tradition: "Indigo dyeing", source: "My aunt" } }).success).toBe(true);
    expect(schema.safeParse({ ...input, culture: { meaning: "sacred" } }).success).toBe(false);
    expect(schema.safeParse(input).success).toBe(true);
  });

  it("records the sensitive flag, off by default", () => {
    expect(publicProject(base(), "d", "Ayo").disclosure.sensitive).toBe(false);
    expect(publicProject(base(), "d", "Ayo", { sensitive: true }).disclosure.sensitive).toBe(true);
  });
});
