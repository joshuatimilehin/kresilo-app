import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { CANVAS_ORIGINS_BASIS, aiTag, canvasOrigins, canvasSummary, originOf } from "../src/creative/canvasOrigins";
import { planAccept } from "../src/creative/canvasDraft";
import { newProject, publicProject } from "../src/creative/contracts";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
vi.mock("../server/creative/assistant", () => ({ draftCreativeProposal: vi.fn() }));
import { executeCreative } from "../server/creative/service";

const id = "11111111-2222-4333-8444-555555555555";
const el = (eid: string, type: string, version = 1, extra: Record<string, unknown> = {}) => ({ id: eid, type, x: 0, y: 0, width: 10, height: 10, version, versionNonce: 1, updated: 1, isDeleted: false, frameId: null, ...extra });
const ai = (source: "copilot" | "vector" | "library", version: number) => ({ customData: aiTag(source, version) });
const scene = (elements: unknown[]) => JSON.stringify({ elements, marks: [], drafts: [] });

describe("where the AI worked on a canvas", () => {
  it("is by hand unless the AI tagged it, generated while it is as the AI left it, assisted once the artist changed it", () => {
    expect(originOf(el("a", "rectangle"))).toBe("hand");
    expect(originOf(el("b", "image", 1, ai("library", 1)))).toBe("generated");
    expect(originOf(el("c", "rectangle", 3, ai("copilot", 3)))).toBe("generated");
    expect(originOf(el("d", "rectangle", 5, ai("copilot", 3)))).toBe("assisted");
    expect(originOf(el("e", "rectangle", 2, { customData: { ai: { made: "other" } } }))).toBe("hand");
  });

  it("counts the elements on the boards, not the boards, deleted elements or anything else", () => {
    const s = scene([el("f", "frame"), el("g", "magicframe"), el("a", "freedraw"), el("b", "text"), el("c", "image", 1, ai("vector", 1)), el("d", "rectangle", 4, ai("copilot", 2)), el("x", "rectangle", 1, { isDeleted: true })]);
    expect(canvasOrigins(s)).toEqual({ hand: 2, assisted: 1, generated: 1 });
    expect(canvasOrigins("not json")).toBeNull();
    expect(canvasOrigins(JSON.stringify({ nothing: true }))).toBeNull();
  });

  it("writes a plain estimate with its basis, and says so when there is nothing yet", () => {
    const sum = canvasSummary({ hand: 5, assisted: 2, generated: 1 });
    expect(sum.sentence).toBe("Estimate from 8 parts on the canvas: 5 by hand, 2 AI-assisted (changed by the artist after AI), 1 AI-generated; the artist worked by hand and with AI.");
    expect(sum).toMatchObject({ total: 8, hand: 5, aiAssisted: 2, aiGenerated: 1, basis: CANVAS_ORIGINS_BASIS });
    expect(canvasSummary({ hand: 3, assisted: 0, generated: 0 }).sentence).toMatch(/no AI was used/);
    expect(canvasSummary({ hand: 0, assisted: 0, generated: 2 }).sentence).toMatch(/every part used AI/);
    expect(canvasSummary({ hand: 0, assisted: 0, generated: 0 }).sentence).toMatch(/nothing has been made/);
  });

  it("tags what Copilot changes with the version it left it at, so a later edit shows as assisted", () => {
    const frame = el("phone", "frame", 1, { x: 0, y: 0, width: 390, height: 844 });
    const button = el("button", "rectangle", 1, { frameId: "phone", x: 20, y: 20 });
    const done = planAccept([frame, button] as unknown as ExcalidrawElement[], frame as unknown as ExcalidrawElement, { rationale: "r", edits: [{ id: "button", set: { backgroundColor: "#c7fe02" } }], adds: [], removes: [] });
    const changed = done.elements.find((e) => e.id === "button")!;
    const tag = (changed.customData as { ai: { made: string; source: string; version: number } }).ai;
    expect(tag).toEqual({ made: "generated", source: "copilot", version: changed.version });
    expect(originOf(changed)).toBe("generated");
    expect(originOf({ ...changed, version: changed.version + 1 })).toBe("assisted");
  });
});

describe("the published story counts a canvas project's parts", () => {
  const p = () => newProject(id, "A brief", "Canvas study", "culture-cover");

  it("uses the canvas parts, labelled as such, for a project made on the canvas", () => {
    const doc = p();
    doc.canvas = { at: "t", scene: scene([el("a", "freedraw"), el("b", "image", 1, ai("library", 1))]) };
    const pub = publicProject(doc, "d", "Ayo");
    expect(pub.authorship?.canvas).toBe(true);
    expect(pub.authorship?.parts).toEqual({ hand: 1, assisted: 0, generated: 1 });
    expect(pub.authorship?.summary.sentence).toMatch(/2 parts on the canvas/);
  });

  it("reads the stored counts when the scene is not at hand, and leaves other projects on the artwork's parts", () => {
    const lean = p();
    lean.canvas = { at: "t", scene: "", origins: { hand: 4, assisted: 1, generated: 2 } };
    expect(publicProject(lean, "d", "Ayo").authorship?.parts).toEqual({ hand: 4, assisted: 1, generated: 2 });
    const plain = publicProject(p(), "d", "Ayo");
    expect(plain.authorship?.canvas).toBeUndefined();
    expect(plain.authorship?.parts?.hand).toBeGreaterThan(0);
  });
});

describe("the canvas stores its counts with the scene", () => {
  beforeEach(() => {
    query.mockReset();
    const doc = newProject(id, "A brief", "Canvas study", "culture-cover");
    query.mockImplementation(async (name: string, params: unknown[]) => {
      if (name === "creative_open") return { person: { name: "Ayo" }, projects: [] };
      if (name === "creative_get") return { id, revision: 3, owner: true, document: doc };
      if (name === "creative_save") return { id, revision: 4, owner: true, document: params[3] };
      return {};
    });
  });

  it("counts on save and keeps the counts, not the scene, in the light project", async () => {
    const s = scene([el("a", "freedraw"), el("c", "image", 1, ai("vector", 1))]);
    const r = await executeCreative("h", "canvas.save", { projectId: id, revision: 3, scene: s });
    expect(r.ok && r.project?.document.canvas).toEqual({ at: expect.any(String), scene: "", origins: { hand: 1, assisted: 0, generated: 1 } });
    const saved = query.mock.calls.find((c) => c[0] === "creative_save")?.[1][3];
    expect(saved.canvas.origins).toEqual({ hand: 1, assisted: 0, generated: 1 });
    expect(saved.canvas.scene).toBe(s);
  });
});
