import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { briefStartArt, groundForBrief, newProject, type ProjectRecord } from "../src/creative/contracts";
import { titleFromBrief } from "../src/creative/guidance";
import { allowForRequest, asksForImages, asksForMotion, asksForWords } from "../src/creative/aiAllow";
import { works } from "../src/creative/catalog";
import { applyDesignPlan, clearOfTitle, designPlanSchema, type DesignPlan } from "../server/creative/plan";
import { buildDesignContext, SYSTEM_PROMPT, titleBottom } from "../server/creative/context";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

const BRIEF = "A poster for my friend's bakery opening on Saturday, warm and hand-drawn, with the name Crumb & Co";
const ASK = "Make it a warm cream bakery poster: title Crumb & Co and 'Opening Saturday 9am' underneath";
const plan = (over: Partial<DesignPlan>): DesignPlan => designPlanSchema.parse({ rationale: "A clear first draft from the brief.", cites: [], patch: {}, ...over });

describe("a title from the brief", () => {
  it("takes the named thing first", () => {
    expect(titleFromBrief(BRIEF)).toBe("Crumb & Co");
    expect(titleFromBrief("A label for a hot sauce called Ember Bay, loud and red")).toBe("Ember Bay");
    expect(titleFromBrief('Flyer for the "Night Owls" reading club')).toBe("Night Owls");
  });

  it("otherwise keeps a short phrase, never the whole sentence", () => {
    expect(titleFromBrief("A poster for my friend's bakery opening on Saturday, warm and hand-drawn")).toBe("My friend's bakery opening");
    expect(titleFromBrief("A poster for a rooftop jazz night in Lisbon, warm and loud")).toBe("Rooftop jazz night in Lisbon");
    expect(titleFromBrief("   ")).toBe("Untitled");
  });
});

describe("a project started from a brief", () => {
  it("starts on a plain ground in a fitting colour with no caption and no catalogue photo", () => {
    const p = newProject(crypto.randomUUID(), BRIEF);
    expect(p.title).toBe("Crumb & Co");
    expect(p.art).toMatchObject({ title: "Crumb & Co", caption: "", captionVisible: false, backgroundOpacity: 0 });
    expect(p.art.canvasColor).toBe(groundForBrief(BRIEF).canvasColor);
    expect(p.art.canvasColor).toBe("#F3E6D0");
    expect(works.some((w) => w.asset === p.art.asset)).toBe(false);
    expect(p.motion.movement).toBe("still");
    expect(p.versions[0].art).toEqual(p.art);
  });

  it("keeps templates as they were", () => {
    const p = newProject(crypto.randomUUID(), BRIEF, "Evening study", "evening-poster");
    expect(p.art).toMatchObject({ asset: "after-light", caption: "SALT FLATS /\nEVENING STUDY" });
    expect(briefStartArt("A quiet note").canvasColor).toBe("#F2F0EB");
  });
});

describe("what one request asks for", () => {
  it("reads explicit words, motion and pictures from the request", () => {
    expect(asksForWords(ASK)).toBe(true);
    expect(asksForWords("Put 'Opening Saturday 9am' at the bottom")).toBe(true);
    expect(asksForWords("make it bolder")).toBe(false);
    expect(asksForWords("my friend's bakery feels too dark")).toBe(false);
    expect(asksForMotion(ASK)).toBe(false);
    expect(asksForMotion("animate it with a slow drift")).toBe(true);
    expect(asksForImages(ASK)).toBe(false);
    expect(asksForImages("add a paper grain texture")).toBe(true);
  });

  it("allows words for that request only, and for the first draft from the brief", () => {
    const p = { brief: BRIEF };
    expect(allowForRequest(p, ASK).words).toBe(true);
    expect(allowForRequest(p, BRIEF).words).toBe(true);
    expect(allowForRequest(p, "make it bolder").words).toBe(false);
    expect(allowForRequest({ ...p, aiAllow: { look: false } }, ASK)).toMatchObject({ words: true, look: false });
  });

  it("tells the model words are on when the request asks for them", () => {
    const p = newProject(crypto.randomUUID(), BRIEF);
    expect(buildDesignContext(p, { intent: ASK }).artistAllows).toBe("The artist allows every kind of change.");
    expect(buildDesignContext(p, { intent: "make it bolder" }).artistAllows).toMatch(/Do not change: words/);
    expect(SYSTEM_PROMPT).toMatch(/set motion only when the request asks for motion/i);
    expect(SYSTEM_PROMPT).toMatch(/addMarks, placed clear of the title/);
  });
});

describe("the plan keeps to the request", () => {
  it("drops motion, new pictures and a background swap nobody asked for", () => {
    const p = newProject(crypto.randomUUID(), BRIEF);
    const out = applyDesignPlan(p, plan({
      patch: { color: "#4A2E1C", asset: "mineral" },
      addLayers: [{ asset: "mineral", name: "Plaster texture", opacity: 0.3 }],
      motion: { movement: "drift", seconds: 8 },
    }), [], { intent: ASK });
    expect(out.motion).toBeUndefined();
    expect(out.patch).toEqual({ color: "#4A2E1C" });
  });

  it("keeps motion and pictures when they are asked for", () => {
    const p = newProject(crypto.randomUUID(), BRIEF);
    const out = applyDesignPlan(p, plan({
      addLayers: [{ asset: "mineral", name: "Paper grain texture", opacity: 0.3 }],
      motion: { movement: "drift", seconds: 8 },
    }), [], { intent: "add a paper grain texture and a slow drift animation" });
    expect(out.motion).toEqual({ movement: "drift", seconds: 8 });
    expect(out.patch.layers?.map((l) => l.name)).toEqual(["Paper grain texture"]);
  });

  it("keeps a new ground colour, and says when a picture hides it", () => {
    const p = newProject(crypto.randomUUID(), BRIEF);
    expect(applyDesignPlan(p, plan({ patch: { canvasColor: "#EFE2C8" } }), [], { intent: ASK })).toMatchObject({ patch: { canvasColor: "#EFE2C8" }, notes: [] });
    const covered = newProject(crypto.randomUUID(), BRIEF, "Evening study", "evening-poster");
    expect(applyDesignPlan(covered, plan({ patch: { canvasColor: "#EFE2C8" } }), [], { intent: ASK }).notes[0]).toMatch(/behind the background picture/);
  });

  it("places new text clear of the title", () => {
    const p = newProject(crypto.randomUUID(), BRIEF);
    const out = applyDesignPlan(p, plan({
      patch: { title: "Crumb & Co" },
      addMarks: [{ kind: "text", name: "Opening time", text: "Opening Saturday 9am", x: 7, y: 10, width: 80, height: 8, size: 5 }],
    }), [], { intent: ASK });
    const line = out.patch.marks!.find((m) => m.name === "Opening time")!;
    expect(line.y).toBeGreaterThanOrEqual(titleBottom({ ...p.art, title: "Crumb & Co" }));
    const box = { y: 90, height: 8 };
    clearOfTitle(box, { top: 60, bottom: 95 });
    expect(box.y).toBe(51);
  });
});

describe("the bakery walk through the command service", () => {
  let record: ProjectRecord;
  const reply = (body: unknown) =>
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(body) } }] }), { status: 200 })));
  beforeEach(() => {
    vi.stubEnv("INFERHUB_API_KEY", "test-only-not-a-real-key");
    query.mockReset();
    query.mockImplementation(async (name: string, args: unknown[]) => {
      if (name === "creative_open") return { person: { name: "Guest", mode: "explorer" }, projects: [] };
      if (name === "creative_get") return structuredClone(record);
      if (name === "creative_save") {
        record = { id: String(args[1]), revision: (record?.revision ?? 0) + 1, owner: true, document: structuredClone(args[3]) } as ProjectRecord;
        return structuredClone(record);
      }
      throw new Error("Unexpected storage call: " + name);
    });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("creates the project from the brief, then follows the request: words in, no motion, no texture", async () => {
    const made = await executeCreative("h", "project.create", { brief: BRIEF, title: titleFromBrief(BRIEF) });
    expect(made.ok).toBe(true);
    expect(record.document.title).toBe("Crumb & Co");
    expect(record.document.art).toMatchObject({ title: "Crumb & Co", caption: "", backgroundOpacity: 0 });
    expect(record.document.references).toEqual([]);

    // A fixture of what the model sent back on the live walk, plus the words it should have kept.
    reply({
      rationale: "Warm cream ground, the name in deep brown, and the opening time underneath.",
      cites: [],
      patch: { title: "Crumb & Co", color: "#4A2E1C", canvasColor: "#F3E3C6" },
      addMarks: [
        { kind: "text", name: "Opening time", text: "Opening Saturday 9am", x: 7, y: 12, width: 80, height: 8, size: 5, color: "#4A2E1C" },
        { kind: "ellipse", name: "Loaf outline", x: 30, y: 50, width: 40, height: 20, fill: "#E08A3C" },
      ],
      addLayers: [{ asset: "mineral", name: "Plaster texture", opacity: 0.3, blend: "multiply" }],
      motion: { movement: "drift", seconds: 8, loop: true },
    });
    const asked = await executeCreative("h", "proposal.request", { projectId: record.id, intent: ASK });
    expect(asked.ok).toBe(true);
    const proposal = record.document.proposals.at(-1)!;
    expect(proposal.blocked).toBeUndefined();
    expect(proposal.motion).toBeUndefined();
    expect(proposal.patch.layers).toBeUndefined();
    expect(proposal.patch).toMatchObject({ color: "#4A2E1C", canvasColor: "#F3E3C6" });
    const text = proposal.patch.marks!.find((m) => m.name === "Opening time");
    expect(text).toMatchObject({ text: "Opening Saturday 9am" });
    // The texture and the motion were left out, so the reason names only what lands.
    expect(proposal.notes).toEqual([
      "Motion was left out because the request did not ask for it.",
      "Pictures were left out because the request did not ask for them.",
    ]);
    expect(proposal.rationale).toBe("Title colour, ground colour, new text “Opening Saturday 9am”, new ellipse “Loaf outline”.");
    expect(proposal.modelReason).toMatch(/^Warm cream ground/);
    expect(text!.y).toBeGreaterThanOrEqual(titleBottom(record.document.art));
    // The preview is the canvas with the patch: it differs from the canvas exactly where applying would.
    const preview = { ...record.document.art, ...proposal.patch };
    expect(preview).not.toEqual(record.document.art);
    const applied = await executeCreative("h", "proposal.accept", { projectId: record.id, proposalId: proposal.id });
    expect(applied.ok).toBe(true);
    expect(record.document.art).toMatchObject({ title: "Crumb & Co", canvasColor: "#F3E3C6" });
    expect(record.document.art.marks?.some((m) => m.kind === "text" && m.text === "Opening Saturday 9am")).toBe(true);
    expect(record.document.motion.movement).toBe("still");
  });

  it("lets the first draft from the brief set words while words are off", async () => {
    await executeCreative("h", "project.create", { brief: BRIEF });
    reply({ rationale: "The name large in brown on cream.", cites: [], patch: { title: "Crumb & Co.", color: "#4A2E1C" } });
    expect((await executeCreative("h", "proposal.request", { projectId: record.id, intent: BRIEF })).ok).toBe(true);
    expect(record.document.proposals.at(-1)!.patch).toEqual({ title: "Crumb & Co.", color: "#4A2E1C" });
  });

  it("still keeps words out of a request that does not ask for them, and says so", async () => {
    await executeCreative("h", "project.create", { brief: BRIEF });
    reply({ rationale: "A deeper brown for the name.", cites: [], patch: { title: "Crumb", color: "#4A2E1C" } });
    expect((await executeCreative("h", "proposal.request", { projectId: record.id, intent: "make it bolder" })).ok).toBe(true);
    const proposal = record.document.proposals.at(-1)!;
    expect(proposal.patch).toEqual({ color: "#4A2E1C" });
    expect(proposal.blocked).toEqual(["words"]);
  });

  it("carries notes about skipped parts with the suggestion", async () => {
    await executeCreative("h", "project.create", { brief: BRIEF });
    reply({
      rationale: "A deeper brown for the name, and a calmer photo.",
      cites: [],
      patch: { color: "#4A2E1C" },
      layerPatches: [{ layer: "Shop photo", opacity: 0.5 }],
    });
    expect((await executeCreative("h", "proposal.request", { projectId: record.id, intent: "make it calmer" })).ok).toBe(true);
    const proposal = record.document.proposals.at(-1)!;
    expect(proposal.notes).toEqual(['There is no layer called "Shop photo", so it was skipped.']);
  });
});
