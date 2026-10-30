import { describe, expect, it } from "vitest";
import {
  assetById,
  assets,
  assetsIn,
  brandTemplates,
  caseStudies,
  mockupScenes,
  projectById,
  projectsByMaker,
  projectsUsing,
  templateById,
} from "../src/creative/portfolio";
import { makers, isSampleMaker } from "../src/creative/makers";
import { caseStudySchema, caseStudyKinds, caseStudyThemes } from "../src/models/case-study";
import { libraryAssetSchema } from "../src/models/library-asset";
import { brandTemplateSchema } from "../src/models/brand-template";

const stamp = { schemaVersion: "0.1.0", sample: true, visibility: "community", updatedAt: "2026-10-22T09:00:00.000Z" };

describe("sample portfolio matches the planned models", () => {
  it.each(caseStudies.map((c) => [c.id, c] as const))("case study %s", (_id, c) => {
    const parsed = caseStudySchema.safeParse({ ...stamp, ...c });
    expect(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.issues)).toBe(true);
  });
  it.each(assets.map((a) => [a.id, a] as const))("asset %s", (_id, a) => {
    const parsed = libraryAssetSchema.safeParse({ ...stamp, ...a });
    expect(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.issues)).toBe(true);
  });
  it.each(brandTemplates.map((t) => [t.id, t] as const))("template %s", (_id, t) => {
    const { sample: _s, visibility: _v, ...templateStamp } = stamp;
    const parsed = brandTemplateSchema.safeParse({ ...templateStamp, ...t, source: "kresilo-original", licenceChecked: true });
    expect(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.issues)).toBe(true);
  });
});

describe("portfolio integrity", () => {
  it("has unique ids", () => {
    for (const list of [caseStudies, assets, brandTemplates]) expect(new Set(list.map((x) => x.id)).size).toBe(list.length);
  });

  it("gives every maker at least two projects, all credited to a sample maker", () => {
    for (const m of makers) expect(projectsByMaker(m.id).length, m.id).toBeGreaterThanOrEqual(2);
    for (const c of caseStudies) {
      expect(isSampleMaker(c.makerId), c.id).toBe(true);
    }
  });

  it("points only at assets, templates and scenes that exist", () => {
    for (const c of caseStudies) {
      for (const id of c.assetsUsed) expect(assetById(id), `${c.id} -> ${id}`).toBeTruthy();
      if (c.templateId) expect(templateById(c.templateId), `${c.id} -> ${c.templateId}`).toBeTruthy();
      for (const p of c.panels) if (p.scene) expect(mockupScenes as readonly string[], `${c.id} scene ${p.scene}`).toContain(p.scene);
    }
    for (const t of brandTemplates) for (const s of t.scenes) expect(mockupScenes as readonly string[]).toContain(s);
    for (const a of assets) expect(makers.some((m) => m.id === a.makerId), a.id).toBe(true);
  });

  it("derives where an asset is used from the projects, in both directions", () => {
    for (const a of assets) {
      expect(a.usedIn.sort()).toEqual(projectsUsing(a.id).map((p) => p.id).sort());
      for (const p of projectsUsing(a.id)) expect(assetsIn(p).map((x) => x.id)).toContain(a.id);
    }
    expect(assets.some((a) => a.usedIn.length > 0)).toBe(true);
  });

  it("covers every kind of work the owner named, and every theme", () => {
    const kinds = new Set(caseStudies.map((c) => c.kind));
    for (const k of ["brand-identity", "packaging", "campaign", "presentation", "motion", "editorial", "spatial", "photography", "lettering"] as const)
      expect(kinds.has(k), k).toBe(true);
    const themes = new Set(caseStudies.flatMap((c) => c.themes));
    for (const t of caseStudyThemes) expect(themes.has(t), t).toBe(true);
    for (const k of kinds) expect(caseStudyKinds).toContain(k);
  });

  it("tells a story: every project has a brief, an idea, an outcome and enough panels", () => {
    for (const c of caseStudies) {
      for (const part of Object.values(c.story)) expect(part.length, c.id).toBeGreaterThan(40);
      expect(c.panels.length, c.id).toBeGreaterThanOrEqual(3);
      expect(["hero", "wordmark-pattern", "motion", "type", "logo"], c.id).toContain(c.panels[0].kind);
      expect(c.process.length, c.id).toBeGreaterThan(15);
    }
  });

  it("states AI help for every project and labels generated work", () => {
    for (const c of caseStudies) expect(["none", "assisted", "generated"]).toContain(c.aiHelp);
    const generated = caseStudies.filter((c) => c.aiHelp === "generated");
    expect(generated.length).toBeGreaterThan(0);
    for (const c of generated) expect(c.process, c.id).toMatch(/generated|AI/i);
    for (const c of caseStudies.filter((x) => x.aiHelp === "assisted")) expect(c.process, c.id).toMatch(/AI/);
  });

  it("makes every sharing rule clear: free, with credit, on request or not shared", () => {
    for (const a of assets) {
      expect(a.sharing.terms.length).toBeGreaterThan(10);
      if (a.sharing.mode === "free-with-credit") expect(a.sharing.requiresCredit, a.id).toBe(true);
      expect(a.howToUse.length, a.id).toBeGreaterThanOrEqual(2);
    }
    expect(new Set(assets.map((a) => a.sharing.mode)).size).toBeGreaterThanOrEqual(3);
  });

  it("describes every client plainly and makes no cultural or sacred claim", () => {
    const text = JSON.stringify([caseStudies, assets]);
    expect(text).not.toMatch(/sacred|ceremon|ritual|holy|tribe|ancestral|indigenous|heritage of/i);
    const real = /\b(nike|adidas|apple|google|coca-cola|pepsi|starbucks|ikea|netflix|spotify|amazon|disney|samsung|toyota)\b/i;
    expect(text).not.toMatch(real);
    for (const c of caseStudies) {
      expect(c.client.what.length, c.id).toBeGreaterThan(10);
      expect(c.client.what, c.id).not.toMatch(/\b(invented|fictional|imagined|made-up)\b/i);
    }
  });

  it("offers premade templates for the branding work the owner named", () => {
    const kinds = new Set(brandTemplates.map((t) => t.kind));
    for (const k of ["brand-board", "logo-presentation", "packaging-set", "stationery", "social-kit", "deck", "motion-sting", "ui-kit"])
      expect(kinds.has(k as never), k).toBe(true);
    expect(projectById("tidewater-coop")?.templateId).toBe("logo-on-products");
  });
});
