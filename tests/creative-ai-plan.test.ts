import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { newProject, recordVersion, type ProjectRecord } from "../src/creative/contracts";
import { asReference } from "../src/creative/catalog";
import { addImageLayer } from "../src/creative/layers";
import {
  applyDesignPlan,
  designPlanSchema,
  findLayer,
  uniqueLayerName,
  type DesignPlan,
} from "../server/creative/plan";
import { SYSTEM_PROMPT, buildDesignContext, describePlacement } from "../server/creative/context";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

function project() {
  const p = newProject(crypto.randomUUID(), "Plan", "A quiet poster about scale");
  p.references.push(asReference("tidal-lines", "Keep the flowing lines"));
  let layers = addImageLayer(p.art, { asset: "mineral" }, "Paper texture");
  layers = addImageLayer({ ...p.art, layers }, { asset: "blue-hour" }, "Sunset reflection photo");
  layers = addImageLayer({ ...p.art, layers }, { asset: "folded-paper" }, "Folded paper");
  p.art.layers = layers;
  return p;
}
const plan = (over: Partial<DesignPlan>): DesignPlan =>
  designPlanSchema.parse({ rationale: "A bolder composition from the references.", cites: ["x"], patch: {}, ...over });

describe("design plan: schema", () => {
  it("accepts layer patches, new layers and effects", () => {
    const parsed = designPlanSchema.safeParse({
      rationale: "Pull the horizon low and let the sun sit large.",
      cites: ["a"],
      patch: { color: "#F1C3A6" },
      layerPatches: [{ layer: "Paper texture", y: 30, blend: "multiply", mask: { shape: "ellipse", feather: 10, invert: false } }],
      addLayers: [{ asset: "mineral", name: "Paper texture overlay", opacity: 0.35, blend: "overlay" }],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects what could escape into CSS, unknown assets and lock changes", () => {
    const base = { rationale: "A bolder composition from the references.", cites: ["a"], patch: {} };
    for (const bad of [
      { layerPatches: [{ layer: "A", shadow: "0 0 9px url(https://evil.test)" }] },
      { layerPatches: [{ layer: "A", aiLock: false }] },
      { addLayers: [{ asset: "../../etc/passwd", name: "x" }] },
      { addLayers: [{ asset: "mineral", name: "x", mediaId: crypto.randomUUID() }] },
      { layerPatches: [{ x: 5 }] },
    ])
      expect(designPlanSchema.safeParse({ ...base, ...bad }).success).toBe(false);
  });
});

describe("design plan: applying it", () => {
  it("changes several layers at once by name", () => {
    const p = project();
    const out = applyDesignPlan(p, plan({
      layerPatches: [
        { layer: "paper texture", opacity: 0.4 },
        { layer: "Sunset reflection photo", y: 30, shadow: "soft" },
      ],
    }));
    const layers = out.patch.layers!;
    expect(layers.find((l) => l.name === "Paper texture")!.opacity).toBe(0.4);
    expect(layers.find((l) => l.name === "Sunset reflection photo")).toMatchObject({ y: 30, shadow: "soft" });
    expect(layers.find((l) => l.name === "Folded paper")).toEqual(p.art.layers.find((l) => l.name === "Folded paper"));
    expect(out.changed).toBe(true);
  });

  it("stays on the focused layers and says what it left alone", () => {
    const p = project();
    const focus = [p.art.layers[1].id];
    const out = applyDesignPlan(p, plan({
      layerPatches: [{ layer: "Sunset reflection photo", opacity: 0.5 }, { layer: "Paper texture", opacity: 0.1 }],
      patch: { title: "Ignored" },
      addLayers: [{ asset: "mineral", name: "New" }],
    }), focus);
    const layers = out.patch.layers!;
    expect(layers[1].opacity).toBe(0.5);
    expect(layers[0].opacity).toBe(1);
    expect(out.patch.title).toBeUndefined();
    expect(layers).toHaveLength(3);
    expect(out.notes.join(" ")).toMatch(/Paper texture.*outside the layers you focused/);
    expect(out.notes.join(" ")).toMatch(/title is outside/);
    expect(out.notes.join(" ")).toMatch(/New layers were skipped/);
  });

  it("works on several focused layers and on the title and background together", () => {
    const p = project();
    const focus = [p.art.layers[0].id, p.art.layers[2].id, "title"];
    const out = applyDesignPlan(p, plan({
      layerPatches: [{ layer: "Paper texture", rotation: 10 }, { layer: "Folded paper", rotation: -10 }, { layer: "Sunset reflection photo", rotation: 5 }],
      patch: { color: "#F1C3A6", backgroundOpacity: 0.5 },
    }), focus);
    const layers = out.patch.layers!;
    expect([layers[0].rotation, layers[1].rotation, layers[2].rotation]).toEqual([10, 0, -10]);
    expect(out.patch.color).toBe("#F1C3A6");
    expect(out.patch.backgroundOpacity).toBeUndefined();
  });

  it("never touches a hand-only layer, even with no focus, and says so", () => {
    const p = project();
    p.art.layers[0].aiLock = true;
    const out = applyDesignPlan(p, plan({ layerPatches: [{ layer: "Paper texture", opacity: 0.1 }, { layer: "Folded paper", opacity: 0.2 }] }));
    const layers = out.patch.layers!;
    expect(layers[0].opacity).toBe(1);
    expect(layers[2].opacity).toBe(0.2);
    expect(out.notes[0]).toBe('Left "Paper texture" alone because you locked it to hand-only.');
  });

  it("adds named layers with clear unique names up to the limit", () => {
    const p = project();
    const out = applyDesignPlan(p, plan({
      addLayers: [
        { asset: "mineral", name: "Paper texture", x: 0, y: 0, width: 100, height: 100, opacity: 0.3, blend: "overlay" },
        { asset: "tidal-lines", name: "Tide lines" },
      ],
    }));
    const layers = out.patch.layers!;
    expect(layers.map((l) => l.name)).toEqual(["Paper texture", "Sunset reflection photo", "Folded paper", "Paper texture 2", "Tide lines"]);
    expect(layers[3]).toMatchObject({ asset: "mineral", opacity: 0.3, blend: "overlay", width: 100 });
    const full = project();
    for (let i = 0; i < 9; i++) full.art.layers = addImageLayer(full.art, { asset: "mineral" }, `L${i}`);
    expect(full.art.layers).toHaveLength(12);
    const capped = applyDesignPlan(full, plan({ addLayers: [{ asset: "mineral", name: "One too many" }] }));
    expect(capped.changed).toBe(false);
    expect(capped.notes[0]).toMatch(/holds 12 layers/);
  });

  it("skips unknown and ambiguous names instead of guessing", () => {
    const p = project();
    p.art.layers[1].name = "Paper texture";
    const out = applyDesignPlan(p, plan({ layerPatches: [{ layer: "Paper texture", opacity: 0.1 }, { layer: "Missing layer", opacity: 0.1 }] }));
    expect(out.changed).toBe(false);
    expect(out.notes).toEqual([
      'More than one layer is called "Paper texture", so it was skipped.',
      'There is no layer called "Missing layer", so it was skipped.',
    ]);
    expect(findLayer(p.art.layers, p.art.layers[0].id)).toBe(p.art.layers[0]);
    expect(uniqueLayerName(p.art.layers, "Fresh")).toBe("Fresh");
  });
});

describe("design context for the model", () => {
  it("describes the composition by name and in plain words", () => {
    const p = project();
    p.art.layers[0].aiLock = true;
    p.art.layers[1].shadow = "soft";
    const ctx = buildDesignContext(p, { intent: "make it calmer", targets: [p.art.layers[1].id] });
    expect(ctx.layersTopToBottom.map((l) => l.name)).toEqual(["Folded paper", "Sunset reflection photo", "Paper texture"]);
    expect(ctx.layersTopToBottom.find((l) => l.name === "Paper texture")!.handOnly).toBe(true);
    expect(ctx.layersTopToBottom.find((l) => l.name === "Sunset reflection photo")).toMatchObject({ inFocus: true });
    expect(ctx.layersTopToBottom.find((l) => l.name === "Sunset reflection photo")!.state).toContain("soft shadow");
    expect(ctx.focus).toEqual(["Sunset reflection photo"]);
    expect(ctx.references[0].reason).toBe("Keep the flowing lines");
    expect(ctx.assetsYouMayAdd.length).toBeGreaterThan(10);
    expect(describePlacement({ x: 0, y: 0, width: 100, height: 100 })).toContain("fills the canvas");
    expect(describePlacement({ x: 5, y: 70, width: 20, height: 20 })).toMatch(/^bottom left, small/);
  });

  it("tells the model what the artist decided and turned down", () => {
    const p = project();
    (p as unknown as { decisions: unknown[] }).decisions = [{ title: "Keep the field pale", reason: "gives the figure scale" }];
    p.proposals.push({ id: "a", intent: "stripes for the sky", rationale: "Stripes compete", cites: [], patch: {}, baseVersion: 1, status: "declined", provenance: "" });
    const ctx = buildDesignContext(p, { intent: "x" });
    expect(ctx.artistHasDecided).toEqual([{ kept: "Keep the field pale", because: "gives the figure scale" }]);
    expect(ctx.artistTurnedDown).toEqual([{ asked: "stripes for the sky", proposed: "Stripes compete" }]);
    expect(ctx.focus).toBe("the whole composition is open");
  });

  it("gives the model freedom, not a box", () => {
    expect(SYSTEM_PROMPT).toMatch(/be bold/i);
    expect(SYSTEM_PROMPT).toMatch(/several layers at once/);
    expect(SYSTEM_PROMPT).toMatch(/Add layers from assetsYouMayAdd/);
    expect(SYSTEM_PROMPT).toMatch(/name every new layer plainly/);
    expect(SYSTEM_PROMPT).toMatch(/handOnly/);
    expect(SYSTEM_PROMPT).not.toMatch(/Never add layers/);
    expect(SYSTEM_PROMPT).not.toMatch(/edit ONLY that target/);
  });
});

describe("proposals through the command service", () => {
  let record: ProjectRecord;
  beforeEach(() => {
    const doc = project();
    record = { id: crypto.randomUUID(), revision: 1, owner: true, document: doc };
    doc.id = record.id;
    query.mockReset();
    query.mockImplementation(async (name: string, args: unknown[]) => {
      if (name === "creative_open") return { person: { name: "Guest", mode: "explorer" }, projects: [structuredClone(record)] };
      if (name === "creative_get") return structuredClone(record);
      if (name === "creative_save") {
        record = { id: record.id, revision: record.revision + 1, owner: true, document: structuredClone(args[3]) } as ProjectRecord;
        return structuredClone(record);
      }
      throw new Error("Unexpected storage call: " + name);
    });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("proposes one preset change across several focused layers and skips a locked one", async () => {
    record.document.art.layers[2].aiLock = true;
    const ids = record.document.art.layers.map((l) => l.id);
    const out = await executeCreative("authorized", "proposal.request", { projectId: record.id, intent: "make it smaller", targets: ids });
    expect(out.ok).toBe(true);
    const proposal = record.document.proposals[0];
    expect(proposal.targets).toEqual(ids);
    const layers = proposal.patch.layers!;
    expect(layers[0].width).toBeCloseTo(44);
    expect(layers[1].width).toBeCloseTo(44);
    expect(layers[2].width).toBe(55);
  });

  it("refuses a focus made only of hand-only layers", async () => {
    record.document.art.layers[0].aiLock = true;
    record.document.art.layers[1].aiLock = true;
    const out = await executeCreative("authorized", "proposal.request", {
      projectId: record.id,
      intent: "make it smaller",
      targets: [record.document.art.layers[0].id, record.document.art.layers[1].id],
    });
    expect(out).toMatchObject({ ok: false, code: "LAYER_LOCKED" });
  });

  it("lets a model plan change several layers and add a named layer, keeping hand-only ones", async () => {
    vi.stubEnv("INFERHUB_API_KEY", "test-key");
    record.document.art.layers[0].aiLock = true;
    const refId = record.document.references[0].id;
    const reply = {
      rationale: "Bring the horizon low and add a paper layer, as in the saved reference.",
      cites: [refId],
      patch: {},
      layerPatches: [{ layer: "Paper texture", opacity: 0.1 }, { layer: "Sunset reflection photo", y: 30, blend: "multiply" }],
      addLayers: [{ asset: "mineral", name: "Grain overlay", opacity: 0.3, blend: "overlay" }],
    };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(reply) } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const out = await executeCreative("authorized", "proposal.request", { projectId: record.id, intent: "make it bolder, with a grain texture" });
    vi.unstubAllGlobals();
    expect(out.ok).toBe(true);
    const sent = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, { body: string }])[1].body);
    // The brief is the same plus one designer line (specialists.ts).
    expect(sent.messages[0].content.split("\n").filter((l: string) => !l.startsWith("DESIGNER:")).join("\n")).toBe(SYSTEM_PROMPT);
    expect(sent.messages[0].content).toContain("DESIGNER: you are working as the");
    expect(JSON.parse(sent.messages[1].content[0].text).layersTopToBottom.map((l: { name: string }) => l.name)).toContain("Paper texture");
    const proposal = record.document.proposals[0];
    const layers = proposal.patch.layers!;
    expect(layers.map((l) => l.name)).toEqual(["Paper texture", "Sunset reflection photo", "Folded paper", "Grain overlay"]);
    expect(layers[0].opacity).toBe(1);
    expect(layers[1]).toMatchObject({ y: 30, blend: "multiply" });
    expect(proposal.notes).toContain('Left "Paper texture" alone because you locked it to hand-only.');
    // Part of the reply was left out, so the explanation names only what lands.
    expect(proposal.rationale).toBe("Layer “Sunset reflection photo”, new picture “Grain overlay”.");
    expect(proposal.modelReason).toBe(reply.rationale);
  });
});

describe("apply AI changes right away", () => {
  let record: ProjectRecord;
  beforeEach(() => {
    const doc = project();
    recordVersion(doc, "Added layers");
    record = { id: crypto.randomUUID(), revision: 1, owner: true, document: doc };
    doc.id = record.id;
    query.mockReset();
    query.mockImplementation(async (name: string, args: unknown[]) => {
      if (name === "creative_open") return { person: { name: "Guest", mode: "explorer" }, projects: [structuredClone(record)] };
      if (name === "creative_get") return structuredClone(record);
      if (name === "creative_save") {
        record = { id: record.id, revision: record.revision + 1, owner: true, document: structuredClone(args[3]) } as ProjectRecord;
        return structuredClone(record);
      }
      throw new Error("Unexpected storage call: " + name);
    });
  });
  const ask = (extra: Record<string, unknown> = {}) =>
    executeCreative("authorized", "proposal.request", { projectId: record.id, intent: "make it smaller", targets: [record.document.art.layers[0].id], ...extra });

  it("asks first by default", async () => {
    expect(record.document.aiApply).toBeUndefined();
    expect((await ask()).ok).toBe(true);
    expect(record.document.proposals[0].status).toBe("proposed");
    expect(record.document.art.layers[0].width).toBe(55);
  });

  it("applies a proposal the moment it is made, records it, and can be undone", async () => {
    expect((await executeCreative("authorized", "project.ai", { projectId: record.id, revision: record.revision, apply: "auto" })).ok).toBe(true);
    expect(record.document.aiApply).toBe("auto");
    expect((await ask()).ok).toBe(true);
    const doc = record.document;
    expect(doc.proposals[0].status).toBe("approved");
    expect(doc.art.layers[0].width).toBeCloseTo(44);
    expect(doc.versions.at(-1)!.note).toBe("AI applied: make it smaller");
    expect(doc.decisions.at(-1)!.title).toBe("make it smaller");
    const undone = await executeCreative("authorized", "version.undo", { projectId: record.id, revision: record.revision });
    expect(undone.ok).toBe(true);
    expect(record.document.art.layers[0].width).toBe(55);
  });

  it("still leaves a hand-only layer alone when applying right away", async () => {
    await executeCreative("authorized", "project.ai", { projectId: record.id, revision: record.revision, apply: "auto" });
    record.document.art.layers[0].aiLock = true;
    const out = await ask({ targets: record.document.art.layers.map((l) => l.id) });
    expect(out.ok).toBe(true);
    const layers = record.document.art.layers;
    expect(layers[0].width).toBe(55);
    expect(layers[1].width).toBeCloseTo(44);
  });

  it("switches back to asking first", async () => {
    await executeCreative("authorized", "project.ai", { projectId: record.id, revision: record.revision, apply: "auto" });
    await executeCreative("authorized", "project.ai", { projectId: record.id, revision: record.revision, apply: "ask" });
    expect((await ask()).ok).toBe(true);
    expect(record.document.proposals.at(-1)!.status).toBe("proposed");
    expect(await executeCreative("authorized", "project.ai", { projectId: record.id, revision: 99, apply: "auto" })).toMatchObject({ ok: false, code: "CONFLICT" });
  });
});
