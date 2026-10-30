import { describe, expect, it } from "vitest";
import { applyDesignPlan, designPlanSchema, readPlan, type DesignPlan } from "../server/creative/plan";
import { SYSTEM_PROMPT, buildDesignContext } from "../server/creative/context";
import { packCatalogue, MAX_LISTED_PACKS, packLine } from "../src/creative/packs/catalogue";
import { packs } from "../src/creative/packs/data";
import { artPatch, newProject } from "../src/creative/contracts";
import { limitPatch, aiAllowOf } from "../src/creative/aiAllow";

const project = () => {
  const p = newProject(crypto.randomUUID(), "A morning ordering app for a neighbourhood cafe", "Daybreak");
  p.art.color = "#f3e6d0";
  p.art.canvasColor = "#1f3a4a";
  return p;
};
const plan = (over: Partial<DesignPlan>): DesignPlan => designPlanSchema.parse({ rationale: "Starts the whole piece from a ready layout.", cites: [], patch: {}, ...over });

describe("the assistant lists template packs", () => {
  it("shows a short, narrowed list, led by the packs that fit the brief", () => {
    const lines = packCatalogue({ brief: "An ordering app for a neighbourhood cafe, coffee and pickup", art: { title: "Daybreak" } }, "start a menu screen");
    expect(lines.length).toBeLessThanOrEqual(MAX_LISTED_PACKS);
    expect(lines[0]).toContain("p6-ui-cafe-order");
    for (const l of lines) expect(l.length).toBeLessThan(330);
    const bakery = packCatalogue({ brief: "Identity for a letterpress print shop: cards and stationery", art: { title: "Pressed" } }, "make a business card");
    expect(bakery[0]).toContain("p6-br-letterpress-shop");
    expect(packLine(packs[0])).toMatch(/^p6-ui-cafe-order: .* \[ui\] \| .* \| layouts: 0 welcome/);
  });

  it("is part of the design context and explained in the model's brief", () => {
    const ctx = buildDesignContext(project() as never, { intent: "start a cafe menu screen" });
    expect(ctx.packsYouMayStartFrom.length).toBeLessThanOrEqual(MAX_LISTED_PACKS);
    expect(SYSTEM_PROMPT).toContain("startFrom");
  });
});

describe("the assistant starts a project from a pack", () => {
  it("reads a reply with startFrom and rejects a malformed one", () => {
    const ok = readPlan({ rationale: "Starts the menu from the cafe pack.", cites: [], patch: {}, startFrom: { pack: "p6-ui-cafe-order", layout: 1 } });
    expect(ok.success && ok.data.startFrom).toEqual({ pack: "p6-ui-cafe-order", layout: 1 });
    expect(designPlanSchema.safeParse({ rationale: "Starts it from a layout.", cites: [], patch: {}, startFrom: { pack: "../x" } }).success).toBe(false);
  });

  it("replaces the composition with editable layers in the project's own colours", () => {
    const p = project();
    const out = applyDesignPlan(p, plan({ patch: { title: "Daybreak" }, startFrom: { pack: "p6-ui-cafe-order", layout: 1 } }), [], { intent: "start a menu screen from the cafe pack" });
    expect(out.changed).toBe(true);
    expect(out.patch.format).toBe("story");
    expect(out.patch.marks!.length).toBeGreaterThan(3);
    expect(out.patch.layers!.length).toBeGreaterThan(0);
    expect(artPatch.safeParse(out.patch).success).toBe(true);
    // Its ground is the project's canvas colour, its ink the title colour.
    expect(out.patch.canvasColor).toBe("#f3e6d0");
    const used = new Set(out.patch.marks!.flatMap((m) => (m.kind === "text" ? [m.color] : [])));
    expect(used.has("#1f3a4a")).toBe(true);
  });

  it("lets the artist's rules decide: no words, no new text; no images, no new pictures", () => {
    const p = project();
    const out = applyDesignPlan(p, plan({ startFrom: { pack: "p6-ui-cafe-order" } }), [], { intent: "start from the cafe pack" });
    const words = limitPatch(p.art, out.patch, aiAllowOf({ aiAllow: { words: false } }));
    expect(words.blocked).toContain("words");
    const fresh = (m: { id?: string }) => !(p.art.marks ?? []).some((o) => o.id === m.id);
    expect((words.patch.marks ?? []).filter((m) => m.kind === "text" && fresh(m))).toEqual([]);
    const images = limitPatch(p.art, out.patch, aiAllowOf({ aiAllow: { images: false } }));
    expect(images.blocked).toContain("images");
    expect((images.patch.layers ?? []).filter((l) => !(p.art.layers ?? []).some((o) => o.id === l.id))).toEqual([]);
  });

  it("does nothing, and says so, for an unknown pack, a focus, or a layer locked to hand-only", () => {
    const p = project();
    const unknown = applyDesignPlan(p, plan({ startFrom: { pack: "no-such-pack" } }), [], { intent: "start" });
    expect(unknown.changed).toBe(false);
    expect(unknown.notes.join(" ")).toContain("no-such-pack");
    const focused = applyDesignPlan(p, plan({ startFrom: { pack: "p6-ui-cafe-order" } }), ["title"], { intent: "start" });
    expect(focused.patch.marks).toBeUndefined();
    expect(focused.notes.join(" ")).toContain("focused");
    const locked = project();
    locked.art.layers = [{ id: crypto.randomUUID(), name: "Mine", asset: "dusk-study", x: 0, y: 0, width: 50, height: 50, opacity: 1, rotation: 0, visible: true, filter: "none", aiLock: true } as never];
    const kept = applyDesignPlan(locked, plan({ startFrom: { pack: "p6-ui-cafe-order" } }), [], { intent: "start" });
    expect(kept.patch.marks).toBeUndefined();
    expect(kept.notes.join(" ")).toContain("locked");
  });
});
