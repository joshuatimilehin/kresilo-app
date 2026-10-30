import { beforeEach, describe, expect, it, vi } from "vitest";
import { fixture } from "./visuals-fixture";

// The committed library is empty until the pipeline fills it; these tests use six visuals in its place.
vi.mock("../src/creative/visuals/library", () => ({
  visuals: fixture,
  visualById: (id: string, list = fixture) => list.find((v) => v.id === id),
}));
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));

import { imageLayerSchema, newProject, type ProjectRecord } from "../src/creative/contracts";
import { ADD_SHARE } from "../src/creative/portfolio/useInStudio";
import { formatRatio } from "../src/creative/contracts";
import { coloursOf, visualDefsFor, visualLayer } from "../src/creative/visuals/layer";
import { checkVisualLayers } from "../src/creative/visuals/check";
import { paletteFor } from "../src/creative/visuals/palette";
import { asksForImages, limitPatch, aiAllowOf } from "../src/creative/aiAllow";
import { changeSummary } from "../src/creative/suggestionSummary";
import { applyDesignPlan, designPlanSchema, newLayerEntry, readPlan, type DesignPlan } from "../server/creative/plan";
import { MAX_LISTED_VISUALS, SYSTEM_PROMPT, buildDesignContext, visualCatalogue, visualLine } from "../server/creative/context";
import { executeCreative } from "../server/creative/service";

const loaf = fixture[0];
const photo = fixture[3];

function project() {
  const p = newProject(crypto.randomUUID(), "A bakery opening on Saturday", "Crumb & Co");
  p.art.color = "#f3e6d0";
  p.art.canvasColor = "#4a2e1c";
  return p;
}
const plan = (over: Partial<DesignPlan>): DesignPlan =>
  designPlanSchema.parse({ rationale: "A hand-drawn loaf sits under the title.", cites: [], patch: {}, ...over });

describe("a visual layer", () => {
  it("is sized to fit, centred, at most 60% of the canvas either way", () => {
    for (const v of fixture)
      for (const format of ["poster", "story", "square", "wide"] as const) {
        const l = visualLayer(v, { ink: "#111111", ground: "#eeeeee" }, [], format);
        expect(l.width).toBeLessThanOrEqual(ADD_SHARE * 100 + 0.1);
        expect(l.height).toBeLessThanOrEqual(ADD_SHARE * 100 + 0.1);
        expect(l.x + l.width / 2).toBeCloseTo(50, 0);
        expect(l.y + l.height / 2).toBeCloseTo(50, 0);
        // The box has the picture's own shape on this canvas.
        const ratio = (l.width * formatRatio[format]) / l.height;
        const shape = { portrait: 3 / 4, landscape: 4 / 3, square: 1 }[v.shape];
        expect(ratio).toBeCloseTo(shape, 1);
      }
  });

  it("stores ink for an ink visual and ink and ground for a duotone, and passes the schema", () => {
    const palette = { ink: "#c03a2b", ground: "#102f34" };
    const a = visualLayer(loaf, palette, []);
    expect(a.visual).toEqual({ id: "hand-drawn-loaf", ink: "#c03a2b" });
    const b = visualLayer(photo, palette, []);
    expect(b.visual).toEqual({ id: "harbour-ferry-photo", ink: "#c03a2b", ground: "#102f34" });
    for (const l of [a, b]) expect(imageLayerSchema.safeParse(l).success).toBe(true);
    expect(coloursOf(a)).toEqual({ ink: "#c03a2b" });
    expect(coloursOf({})).toBeUndefined();
  });

  it("is named for its title, and made unique", () => {
    const first = visualLayer(loaf, { ink: "#111111", ground: "#fff" }, []);
    expect(first.name).toBe("Hand-drawn loaf");
    expect(visualLayer(loaf, { ink: "#111111", ground: "#fff" }, [first]).name).toBe("Hand-drawn loaf 2");
    expect(first.role).toBe("subject");
    expect(visualLayer(fixture[4], { ink: "#111111", ground: "#fff" }, []).role).toBe("texture");
  });

  it("rejects colours that are not hex, extra fields and bad ids", () => {
    const ok = visualLayer(loaf, { ink: "#111111", ground: "#fff" }, []);
    for (const visual of [{ id: "hand-drawn-loaf", ink: "red" }, { id: "hand-drawn-loaf", ink: "#111111", ground: "url(x)" }, { id: "../etc/passwd", ink: "#111111" }, { id: "x", ink: "#111111", extra: 1 }])
      expect(imageLayerSchema.safeParse({ ...ok, visual }).success).toBe(false);
  });

  it("brings its filter definition once per colour pair, for visible layers only", () => {
    const a = visualLayer(loaf, { ink: "#c03a2b", ground: "#000" }, []);
    const b = { ...a, id: crypto.randomUUID() };
    const hidden = { ...visualLayer(loaf, { ink: "#00ff00", ground: "#000" }, []), visible: false };
    const defs = visualDefsFor([a, b, hidden]);
    expect(defs.match(/<filter /g)).toHaveLength(1);
    expect(defs).toContain("kresilo-vis-c03a2b");
    expect(visualDefsFor([])).toBe("");
  });
});

describe("a visual must exist in the library", () => {
  it("checks new and changed visuals, and lets one already on the canvas stay", () => {
    const known = visualLayer(loaf, { ink: "#111111", ground: "#fff" }, []);
    const stray = { ...known, id: crypto.randomUUID(), visual: { id: "retired-picture", ink: "#111111" } };
    expect(checkVisualLayers([known], []).ok).toBe(true);
    expect(checkVisualLayers([stray], []).ok).toBe(false);
    // Already on the canvas before this edit: stays, even if the library no longer has it.
    expect(checkVisualLayers([stray], [stray]).ok).toBe(true);
    expect(checkVisualLayers([stray, known], [stray]).ok).toBe(true);
    expect(checkVisualLayers(undefined, undefined).ok).toBe(true);
  });

  describe("at command time on the server", () => {
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

    it("saves a known visual and refuses an unknown one", async () => {
      const layer = visualLayer(loaf, paletteFor({ art: record.document.art }), [], record.document.art.format);
      const ok = await executeCreative("authorized", "artwork.edit", { projectId: record.id, revision: record.revision, patch: { layers: [layer] } });
      expect(ok.ok).toBe(true);
      expect(record.document.art.layers?.[0].visual).toEqual({ id: "hand-drawn-loaf", ink: "#f3e6d0" });
      const stray = { ...layer, id: crypto.randomUUID(), name: "Stray", visual: { id: "no-such-picture", ink: "#111111" } };
      const refused = await executeCreative("authorized", "artwork.edit", { projectId: record.id, revision: record.revision, patch: { layers: [layer, stray] } });
      expect(refused).toMatchObject({ ok: false, code: "INVALID_INPUT" });
      expect(record.document.art.layers).toHaveLength(1);
    });

    it("can recolour a placed visual by hand", async () => {
      const layer = visualLayer(photo, paletteFor({ art: record.document.art }, "duotone"), []);
      await executeCreative("authorized", "artwork.edit", { projectId: record.id, revision: record.revision, patch: { layers: [layer] } });
      const recoloured = { ...layer, visual: { ...layer.visual!, ink: "#000000", ground: "#ffcc00" } };
      const out = await executeCreative("authorized", "artwork.edit", { projectId: record.id, revision: record.revision, patch: { layers: [recoloured] } });
      expect(out.ok).toBe(true);
      expect(record.document.art.layers?.[0].visual).toEqual({ id: "harbour-ferry-photo", ink: "#000000", ground: "#ffcc00" });
    });
  });
});

describe("the assistant adds a visual", () => {
  it("accepts a visual by id with optional colours, and an asset by name", () => {
    expect(newLayerEntry.safeParse({ visual: "hand-drawn-loaf" }).success).toBe(true);
    expect(newLayerEntry.safeParse({ visual: "hand-drawn-loaf", ink: "#c03a2b", ground: "#102f34", x: 30, y: 60, width: 30, height: 30 }).success).toBe(true);
    expect(newLayerEntry.safeParse({ asset: "mineral", name: "Paper" }).success).toBe(true);
    // One source only, assets need a name, and only a visual takes ink and ground.
    expect(newLayerEntry.safeParse({ visual: "hand-drawn-loaf", asset: "mineral" }).success).toBe(false);
    expect(newLayerEntry.safeParse({ asset: "mineral" }).success).toBe(false);
    expect(newLayerEntry.safeParse({}).success).toBe(false);
    expect(newLayerEntry.safeParse({ asset: "mineral", name: "x", ink: "#111111" }).success).toBe(false);
    expect(newLayerEntry.safeParse({ visual: "hand-drawn-loaf", ink: "red" }).success).toBe(false);
    expect(newLayerEntry.safeParse({ visual: "../../x" }).success).toBe(false);
  });

  it("reads a reply that says colour instead of ink", () => {
    const read = readPlan({ rationale: "A hand-drawn loaf sits under the title.", cites: [], patch: {}, addLayers: [{ visual: "hand-drawn-loaf", colour: "#c03a2b" }] });
    expect(read.success && read.data.addLayers?.[0]).toMatchObject({ visual: "hand-drawn-loaf", ink: "#c03a2b" });
  });

  it("places a known visual in the project's colours, named for its title", () => {
    const p = project();
    const out = applyDesignPlan(p, plan({ addLayers: [{ visual: "hand-drawn-loaf", x: 30, y: 55, width: 30, height: 30 }] }), [], { intent: "add a hand-drawn loaf under the title" });
    const layer = out.patch.layers!.at(-1)!;
    expect(layer).toMatchObject({ name: "Hand-drawn loaf", x: 30, y: 55, width: 30, height: 30 });
    expect(layer.visual).toEqual({ id: "hand-drawn-loaf", ink: "#f3e6d0" });
    expect(imageLayerSchema.safeParse(layer).success).toBe(true);
    expect(out.notes).toEqual([]);
    expect(out.changed).toBe(true);
  });

  it("uses the ink and ground it is given, and the plan's own new colours as the default", () => {
    const p = project();
    const given = applyDesignPlan(p, plan({ addLayers: [{ visual: "harbour-ferry-photo", ink: "#101820", ground: "#f2a900" }] }), [], { intent: "add a picture of the ferry" });
    expect(given.patch.layers!.at(-1)!.visual).toEqual({ id: "harbour-ferry-photo", ink: "#101820", ground: "#f2a900" });
    // The same plan sets a new canvas colour: the picture is coloured for that, not the old one.
    const moved = applyDesignPlan(p, plan({ patch: { canvasColor: "#f3e6d0", color: "#1b1b1b" }, addLayers: [{ visual: "hand-drawn-loaf" }] }), [], { intent: "cream background and add a loaf" });
    expect(moved.patch.layers!.at(-1)!.visual).toEqual({ id: "hand-drawn-loaf", ink: "#1b1b1b" });
  });

  it("replaces an ink colour that would vanish on the canvas, and says so", () => {
    const p = project();
    const out = applyDesignPlan(p, plan({ addLayers: [{ visual: "hand-drawn-loaf", ink: "#4a2e1d" }] }), [], { intent: "add a loaf" });
    expect(out.patch.layers!.at(-1)!.visual!.ink).toBe("#f3e6d0");
    expect(out.notes.join(" ")).toMatch(/would not show/);
  });

  it("drops an unknown id with a note and keeps the rest of the plan", () => {
    const p = project();
    const out = applyDesignPlan(p, plan({ patch: { color: "#ffffff" }, addLayers: [{ visual: "no-such-picture" }, { visual: "wheat-ear-linocut" }] }), [], { intent: "add a wheat ear" });
    expect(out.notes).toContain('There is no picture "no-such-picture" in the library, so it was left out.');
    expect(out.patch.layers!.map((l) => l.name)).toEqual(["Wheat ear linocut"]);
    expect(out.patch.color).toBe("#ffffff");
  });

  it("names two of the same picture apart, and stops at 12 layers", () => {
    const p = project();
    const two = applyDesignPlan(p, plan({ addLayers: [{ visual: "hand-drawn-loaf" }, { visual: "hand-drawn-loaf" }] }), [], { intent: "add two loaves" });
    expect(two.patch.layers!.map((l) => l.name)).toEqual(["Hand-drawn loaf", "Hand-drawn loaf 2"]);
    p.art.layers = Array.from({ length: 12 }, (_, i) => ({ ...visualLayer(loaf, { ink: "#111111", ground: "#fff" }, []), id: crypto.randomUUID(), name: `L${i}` }));
    const full = applyDesignPlan(p, plan({ addLayers: [{ visual: "hand-drawn-loaf" }] }), [], { intent: "add a loaf" });
    expect(full.notes.join(" ")).toMatch(/holds 12 layers/);
    expect(full.changed).toBe(false);
  });

  it("is left out when the request did not ask for a picture", () => {
    const p = project();
    const out = applyDesignPlan(p, plan({ addLayers: [{ visual: "hand-drawn-loaf" }] }), [], { intent: "make it bolder" });
    expect(out.patch.layers).toBeUndefined();
    expect(out.notes).toContain("Pictures were left out because the request did not ask for them.");
  });

  it("is left out when the artist focused on specific layers", () => {
    const p = project();
    p.art.layers = [visualLayer(loaf, { ink: "#111111", ground: "#fff" }, [])];
    const out = applyDesignPlan(p, plan({ addLayers: [{ visual: "wheat-ear-linocut" }] }), [p.art.layers[0].id], { intent: "add a wheat ear" });
    expect(out.notes.join(" ")).toMatch(/focused on specific layers/);
  });

  it("is blocked as an image when the artist turned images off", () => {
    const p = project();
    const out = applyDesignPlan(p, plan({ addLayers: [{ visual: "hand-drawn-loaf" }] }), [], { intent: "add a hand-drawn loaf" });
    const off = limitPatch(p.art, out.patch, { ...aiAllowOf({}), images: false });
    expect(off.blocked).toEqual(["images"]);
    expect(off.patch.layers).toBeUndefined();
    expect(limitPatch(p.art, out.patch, aiAllowOf({})).patch.layers).toHaveLength(1);
  });

  it("is summarised as a new picture by its title", () => {
    const p = project();
    const out = applyDesignPlan(p, plan({ addLayers: [{ visual: "hand-drawn-loaf" }] }), [], { intent: "add a hand-drawn loaf" });
    expect(changeSummary(p.art, out.patch)).toBe("New picture “Hand-drawn loaf”.");
  });

  it("arrives from a model reply through the whole command", async () => {
    const doc = project();
    let record: ProjectRecord = { id: crypto.randomUUID(), revision: 1, owner: true, document: doc };
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
    vi.stubEnv("INFERHUB_API_KEY", "test-key");
    const reply = {
      rationale: "A hand-drawn loaf under the title, in the cream of the title.",
      cites: [],
      patch: {},
      addLayers: [{ visual: "hand-drawn-loaf", x: 30, y: 55, width: 30, height: 30 }],
    };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(reply) } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const out = await executeCreative("authorized", "proposal.request", { projectId: record.id, intent: "a hand-drawn loaf under the title" });
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    expect(out.ok).toBe(true);
    const sent = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, { body: string }])[1].body);
    const context = JSON.parse(sent.messages[1].content[0].text);
    expect(context.visualsYouMayAdd).toHaveLength(6);
    expect(context.visualPalette.ink).toBe("#f3e6d0");
    const proposal = record.document.proposals[0];
    expect(proposal.patch.layers!.at(-1)!.visual).toEqual({ id: "hand-drawn-loaf", ink: "#f3e6d0" });
    expect(proposal.status).toBe("proposed");
  });
});

describe("a request that names a thing to add asks for a picture", () => {
  it("reads picture words and concrete things", () => {
    for (const yes of [
      "add a hand-drawn loaf",
      "a hand-drawn loaf under the title",
      "put a few stars in the corner",
      "add a small sun badge",
      "draw a ferry",
      "an illustration of a wheat field",
      "add an icon",
      "include a sticker",
      "add a paper grain texture",
      "put a couple of olives top left",
    ])
      expect(asksForImages(yes), yes).toBe(true);
  });

  it("does not read words, effects, colour or layout as pictures", () => {
    for (const no of [
      "make it bolder",
      "add a title that says Opening Saturday",
      "add a caption",
      "add a soft shadow",
      "add a bit of space under the title",
      "put a border round it",
      "add a thin line",
      "add a subtle glow",
      "put the title at the bottom",
      "change the colour to green",
      "my friend's bakery feels too dark",
    ])
      expect(asksForImages(no), no).toBe(false);
  });
});

describe("what the model is told about the library", () => {
  it("lists every visual compactly: id, about and six meanings", () => {
    const line = visualLine(loaf);
    expect(line).toBe("hand-drawn-loaf: A single round sourdough loaf with a scored cross, in… | bread, bakery, baking, breakfast, warmth, home-made");
    // A short sentence is kept whole; a title that is not the id is shown; a duotone says so.
    expect(visualLine({ ...fixture[2], about: "A record and sleeve." })).toContain(': A record and sleeve. | vinyl,');
    expect(visualLine(fixture[2])).toMatch(/^vinyl-record-line "Vinyl record line drawing": /);
    expect(visualLine(photo)).toMatch(/^harbour-ferry-photo "Harbour ferry at dusk" \(duotone\): /);
    expect(visualCatalogue(project(), "add a loaf")).toHaveLength(6);
  });

  it("costs about 30 to 40 tokens a visual, so 340 of them stay near 12k tokens", () => {
    // About four characters to a token for English text and dashes.
    const tokens = (s: string) => Math.ceil(s.length / 4);
    const each = fixture.map((v) => tokens(JSON.stringify(visualLine(v))));
    const mean = each.reduce((a, b) => a + b, 0) / each.length;
    expect(mean).toBeLessThan(42);
    expect(mean * 340).toBeLessThan(14000);
    for (const v of fixture) expect(visualLine(v).length).toBeLessThan(200);
  });

  it("narrows a very large library to the likeliest instead of sending it all", () => {
    const big = Array.from({ length: 1000 }, (_, i) => ({ ...fixture[i % 6], id: `v-${i}`, title: `Picture ${i}`, concepts: fixture[i % 6].concepts }));
    const p = project();
    const listed = visualCatalogue(p, "a ferry crossing the harbour", big);
    expect(listed).toHaveLength(MAX_LISTED_VISUALS);
    // Pictures sharing words with the request come first.
    expect(listed[0]).toContain("ferry");
    expect(visualCatalogue(p, "x", big, 50)).toHaveLength(50);
  });

  it("puts the library, the palette and the rules in the brief", () => {
    const p = project();
    const context = buildDesignContext(p, { intent: "add a hand-drawn loaf" });
    expect(context.visualsYouMayAdd.some((l) => l.startsWith("hand-drawn-loaf: "))).toBe(true);
    expect(context.visualPalette).toMatchObject({ ink: "#f3e6d0", duotone: { ink: "#4a2e1c", ground: "#f3e6d0" } });
    expect(SYSTEM_PROMPT).toMatch(/MEANING and CONTEXT, not by keywords/);
    expect(SYSTEM_PROMPT).toMatch(/at most 2 visuals per request unless more are asked for/);
    expect(SYSTEM_PROMPT).toMatch(/say so in the rationale and add nothing/);
    expect(SYSTEM_PROMPT).toMatch(/never use a poor match or a shape/);
    expect(SYSTEM_PROMPT).toMatch(/visualPalette/);
    // Earlier promises hold.
    expect(SYSTEM_PROMPT).toMatch(/Add layers from assetsYouMayAdd/);
  });

  it("describes a placed visual to the model by its colours", () => {
    const p = project();
    p.art.layers = [visualLayer(photo, { ink: "#101820", ground: "#f2a900" }, [])];
    const context = buildDesignContext(p, { intent: "x" });
    expect(context.layersTopToBottom[0].state.join(" ")).toContain("library picture harbour-ferry-photo, ink #101820, ground #f2a900");
  });
});
