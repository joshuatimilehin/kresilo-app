import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { CANVAS_SCENE_MAX, SNAPSHOT_MAX, commands, newProject, publicProject, ratioOf, type Publication } from "../src/creative/contracts";
import { Artwork } from "../src/creative/primitives";
import { previewCardSvg } from "../src/creative/share";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
vi.mock("../server/creative/assistant", () => ({ draftCreativeProposal: vi.fn() }));
import { executeCreative } from "../server/creative/service";

const id = "11111111-2222-4333-8444-555555555555";
// A 1x1 PNG: the data URL is real, so the same shape a browser export has.
const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const scene = JSON.stringify({ elements: [{ id: "a", type: "frame" }], marks: [], drafts: [] });
let doc: ReturnType<typeof newProject>;
const record = () => ({ id, revision: 3, owner: true, document: doc });
const savedDoc = () => query.mock.calls.find((c) => c[0] === "creative_save")?.[1][3];

describe("a canvas project gets a cover picture", () => {
  beforeEach(() => {
    doc = newProject(id, "A brief", "Canvas study", "culture-cover");
    query.mockReset();
    query.mockImplementation(async (name: string, params: unknown[]) => {
      if (name === "creative_open") return { person: { name: "Ayo" }, projects: [record(), { ...record(), id: "22222222-3333-4444-8555-666666666666", document: { ...doc, canvas: { at: "t", scene } } }] };
      if (name === "creative_get") return record();
      if (name === "creative_save") return { ...record(), revision: 4, document: params[3] };
      return {};
    });
  });

  it("stores the picture as the artwork, hides the old title and caption, and adds no history entry", async () => {
    const r = await executeCreative("h", "canvas.cover", { projectId: id, revision: 3, image: png, width: 390, height: 844 });
    expect(r.ok).toBe(true);
    const saved = savedDoc();
    expect(saved.art.snapshot).toMatchObject({ image: png, width: 390, height: 844 });
    expect(saved.art.titleVisible).toBe(false);
    expect(saved.art.captionVisible).toBe(false);
    expect(saved.history.length).toBe(doc.history.length);
  });

  it("refuses an older revision, a picture that is not a PNG, and one that is too large", async () => {
    const stale = await executeCreative("h", "canvas.cover", { projectId: id, revision: 2, image: png, width: 10, height: 10 });
    expect(stale.ok === false && stale.code).toBe("CONFLICT");
    expect(savedDoc()).toBeUndefined();
    const base = { projectId: id, revision: 3, image: png, width: 390, height: 844 };
    expect(commands["canvas.cover"].safeParse(base).success).toBe(true);
    for (const image of ["data:image/jpeg;base64,/9j/4AAQ", "data:image/png;base64,AAAA", "https://example.com/a.png", png + "<script>"])
      expect(commands["canvas.cover"].safeParse({ ...base, image }).success).toBe(false);
    expect(commands["canvas.cover"].safeParse({ ...base, image: "data:image/png;base64,iVBORw0KGgo" + "A".repeat(SNAPSHOT_MAX) }).success).toBe(false);
    expect(commands["canvas.cover"].safeParse({ ...base, extra: 1 }).success).toBe(false);
  });

  it("keeps the scene out of the project list and out of save replies, but sends it when a project is opened", async () => {
    const list = await executeCreative("h", "workspace.get", {});
    const withScene = list.ok ? list.workspace?.projects.find((p) => p.id.startsWith("2222")) : undefined;
    expect(withScene?.document.canvas).toEqual({ at: "t", scene: "" });
    doc.canvas = { at: "t", scene };
    const saved = await executeCreative("h", "canvas.save", { projectId: id, revision: 3, scene });
    expect(saved.ok && saved.project?.document.canvas?.scene).toBe("");
    const opened = await executeCreative("h", "project.get", { projectId: id });
    expect(opened.ok && opened.project?.document.canvas?.scene).toBe(scene);
  });

  it("keeps a scene below what a saved project can hold", () => {
    expect(CANVAS_SCENE_MAX + SNAPSHOT_MAX).toBeLessThan(2_000_000);
  });
});

describe("the artwork is drawn from the cover picture", () => {
  const snap = { image: png, width: 390, height: 844, at: "2026-10-26T00:00:00Z" };
  it("takes its shape from the picture", () => {
    expect(ratioOf({ snapshot: snap })).toBeCloseTo(390 / 844);
    expect(ratioOf({})).toBe(3 / 4);
  });

  it("shows only the picture, with no default poster, layers, title or caption", () => {
    const p = newProject(id, "A brief", "Canvas study");
    p.art.snapshot = snap;
    p.art.title = "Should not show";
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Artwork, { art: p.art })));
    expect(html).toContain(png);
    expect(html).toContain("aspect-ratio:0.46");
    expect(html).not.toMatch(/Should not show|art-title|art-caption|canvas-image-layer|\/assets\//);
  });

  it("draws the share card and the published post from it", () => {
    const p = newProject(id, "A brief", "Canvas study");
    p.art.snapshot = snap;
    const pub = { id, audience: "community", ...publicProject(p, "A canvas.", "Ayo Bello") } as Publication;
    expect(pub.art.snapshot?.image).toBe(png);
    expect(previewCardSvg(pub, "https://kresilo.design-bakery.com")).toContain(`href="${png}"`);
  });
});
