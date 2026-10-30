import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { assets as libraryAssets, brandTemplates } from "../src/creative/portfolio";
import { checkLibraryLayers, libraryArtSchema, libraryArtUrl, sceneFromQuery, type LibraryArt } from "../src/creative/libraryArt";
import {
  ADD_SHARE,
  assetLayer,
  brandProblem,
  canUseAsset,
  fitBox,
  shelfOf,
  studioAssets,
  templateStartArt,
  withAssetLayer,
} from "../src/creative/portfolio/useInStudio";
import { artFormats, formatRatio, imageLayerSchema, newProject } from "../src/creative/contracts";
import { renderLibraryArt } from "../server/creative/libraryArt";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

const shared = libraryAssets.find((a) => canUseAsset(a))!;
const unshared = libraryAssets.find((a) => !canUseAsset(a))!;
const withScenes = brandTemplates.find((t) => t.scenes.length > 0)!;

describe("placing a library asset", () => {
  it("knows which sets their makers share for use", () => {
    expect(shared).toBeTruthy();
    expect(unshared).toBeTruthy();
    expect(["on-request", "not-shared"]).toContain(unshared.sharing.mode);
  });

  it("builds a valid layer that is drawn from the library, with a unique name", () => {
    const first = assetLayer(shared);
    expect(imageLayerSchema.safeParse(first).success).toBe(true);
    expect(first.libraryArt).toEqual({ kind: "asset", id: shared.id });
    expect(assetLayer(shared, [first]).name).not.toBe(first.name);
  });

  it("previews exactly the layers that will be saved", () => {
    const art = newProject(crypto.randomUUID(), "A brief", "Title", "culture-cover").art;
    const next = withAssetLayer(art, shared);
    expect(next.layers).toHaveLength((art.layers?.length ?? 0) + 1);
    expect(next.layers?.at(-1)?.libraryArt).toEqual({ kind: "asset", id: shared.id });
  });

  it("refuses a set that is not shared, and credits one that is", () => {
    expect(checkLibraryLayers([{ libraryArt: { kind: "asset", id: unshared.id } }]).ok).toBe(false);
    const ok = checkLibraryLayers([{ libraryArt: { kind: "asset", id: shared.id } }, { libraryArt: { kind: "asset", id: shared.id } }]);
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.credits).toHaveLength(1);
      expect(ok.credits[0].workId).toBe(`lib:${shared.id}`);
      expect(ok.credits[0].reason).toContain(shared.sharing.terms.slice(0, 20));
    }
    expect(checkLibraryLayers([{ libraryArt: { kind: "asset", id: "no-such-set" } }]).ok).toBe(false);
  });
});

describe("starting from a template", () => {
  it("checks the brand name", () => {
    expect(brandProblem("")).toBeTruthy();
    expect(brandProblem("x".repeat(25))).toBeTruthy();
    expect(brandProblem("<script>")).toBeTruthy();
    expect(brandProblem("Harbour & Co.")).toBeNull();
  });

  it("draws every product scene for the brand and colours, as valid layers", () => {
    const base = newProject(crypto.randomUUID(), "A brief", "Title", "culture-cover").art;
    const art = templateStartArt(withScenes, base, { brand: "Harbour & Co.", palette: ["#111111", "#222222", "#eeeeee", "#444444"] });
    expect(art.title).toBe("Harbour & Co.");
    expect(art.layers).toHaveLength(Math.min(4, withScenes.scenes.length));
    for (const l of art.layers ?? []) {
      expect(imageLayerSchema.safeParse(l).success).toBe(true);
      expect(l.libraryArt?.kind).toBe("scene");
    }
    expect(checkLibraryLayers(art.layers).ok).toBe(true);
  });

  it("round-trips a scene through its URL and refuses tampering", () => {
    const scene = { kind: "scene", template: withScenes.id, scene: withScenes.scenes[0], brand: "Harbour", palette: ["#111111", "#222222", "#eeeeee", "#444444"] } as LibraryArt;
    expect(libraryArtSchema.safeParse(scene).success).toBe(true);
    const q = Object.fromEntries(new URL(libraryArtUrl(scene), "http://x").searchParams);
    expect(sceneFromQuery(q)).toEqual(scene);
    expect(sceneFromQuery({ ...q, t: "no-such-template" })).toBeNull();
    expect(sceneFromQuery({ ...q, b: "<b>" })).toBeNull();
    expect(sceneFromQuery({ ...q, p: "zzzzzz-1-2-3" })).toBeNull();
  });

  it("renders assets and scenes as standalone SVG", () => {
    expect(renderLibraryArt({ kind: "asset", id: shared.id })).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    expect(renderLibraryArt({ kind: "asset", id: "no-such-set" })).toBeNull();
  });
});

describe("the command service", () => {
  const record = () => {
    const p = newProject("11111111-2222-4333-8444-555555555555", "A brief", "Title", "culture-cover");
    return { id: p.id, revision: 1, owner: true, document: p };
  };
  beforeEach(() => {
    query.mockReset();
    query.mockImplementation(async (name: string, params: unknown[]) => {
      if (name === "creative_open") return { person: { name: "Ayo" }, projects: [] };
      if (name === "creative_get") return record();
      if (name === "creative_save") return { ...record(), document: params[3] ?? params[2] };
      return {};
    });
  });

  it("refuses a layer from a set its maker has not shared", async () => {
    const r = await executeCreative("h", "artwork.edit", {
      projectId: record().id,
      revision: 1,
      patch: { layers: [{ ...assetLayer(unshared), id: crypto.randomUUID() }] },
    });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.code).toBe("ASSET_NOT_SHARED");
  });

  it("credits the maker when a shared set is placed", async () => {
    await executeCreative("h", "artwork.edit", { projectId: record().id, revision: 1, patch: { layers: [assetLayer(shared)] } });
    const save = query.mock.calls.find((c) => c[0] === "creative_save");
    const saved = JSON.stringify(save?.[1] ?? "");
    expect(saved).toContain(`lib:${shared.id}`);
  });
});

describe("Studio's assets", () => {
  const within = (b: Partial<Record<"x" | "y" | "width" | "height", number>>) => {
    const { x = NaN, y = NaN, width = NaN, height = NaN } = b;
    expect(width).toBeLessThanOrEqual(ADD_SHARE * 100 + 0.1);
    expect(height).toBeLessThanOrEqual(ADD_SHARE * 100 + 0.1);
    // Centred on the canvas.
    expect(Math.abs(x + width / 2 - 50)).toBeLessThan(0.2);
    expect(Math.abs(y + height / 2 - 50)).toBeLessThan(0.2);
  };

  it("are the makers' shared packs, each on a shelf, never unshared sets or templates", () => {
    const offered = studioAssets();
    expect(offered.length).toBeGreaterThan(0);
    for (const a of offered) {
      expect(canUseAsset(a)).toBe(true);
      expect(shelfOf(a)).toBeTruthy();
    }
    expect(offered.some((a) => a.id === unshared.id)).toBe(false);
    expect(offered.some((a) => a.type === "template-pack" || a.type === "motion-pack")).toBe(false);
    for (const s of ["textures", "patterns", "stickers", "icons"] as const) expect(offered.some((a) => shelfOf(a) === s)).toBe(true);
  });

  it("land centred and sized to fit, keeping their shape, on every canvas size", () => {
    for (const format of artFormats) {
      for (const aspect of [3 / 2, 4 / 3, 1, 9 / 16, 3]) {
        const b = fitBox(format, aspect);
        within(b);
        // Width and height are shares of the canvas's own width and height.
        const shape = (b.width * formatRatio[format]) / b.height;
        expect(Math.abs(shape - aspect) / aspect).toBeLessThan(0.05);
        // One side always reaches the limit.
        expect(Math.max(b.width, b.height)).toBeGreaterThan(ADD_SHARE * 100 - 0.2);
      }
    }
    within(fitBox("poster", Number.NaN));
  });

  it("never add a full-size layer, textures included", () => {
    for (const a of studioAssets()) {
      const l = assetLayer(a, [], "story");
      expect(imageLayerSchema.safeParse(l).success).toBe(true);
      within(l);
    }
  });

  it("no longer offer other makers' finished works as one-click backgrounds or layers", () => {
    const panel = readFileSync("src/creative/LayerPanel.tsx", "utf8");
    const shelf = readFileSync("src/creative/AssetShelf.tsx", "utf8");
    for (const src of [panel, shelf]) {
      expect(src).not.toMatch(/from "\.\/catalog"/);
      expect(src).not.toContain("Replace background with");
    }
    // Only an import can become the background, and only through its own button.
    expect(shelf.match(/backgroundMediaId/g)?.length).toBe(1);
    expect(shelf).not.toMatch(/save\(\{\s*asset:/);
  });

  it("More names every icon and drops the second back arrow and the poster grid", () => {
    const editor = readFileSync("src/creative/Editor.tsx", "utf8");
    const more = editor.slice(editor.indexOf('className="sx-more"'), editor.indexOf('className="sx-formats"'));
    expect(more.length).toBeGreaterThan(0);
    expect(more).not.toContain("ArrowLeft");
    const controls = more.match(/<(button|Link)\b[^>]*>/g) ?? [];
    expect(controls.length).toBeGreaterThanOrEqual(4);
    for (const tag of controls) {
      expect(tag).toMatch(/aria-label="[^"]+"/);
      expect(tag).toMatch(/title="[^"]+"/);
    }
    expect(editor).not.toContain("reference-backgrounds");
  });
});
