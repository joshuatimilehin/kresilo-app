import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  inkAlpha,
  INK_BLACK,
  INK_WHITE,
  luminanceOf,
  mapDuotone,
  mapInk,
  parseHex,
  recolourPixels,
  toHex,
  visualDefsMarkup,
  visualFilterId,
  visualFilterMarkup,
  visualMatrix,
} from "../src/creative/visuals/colour";
import { paletteFor } from "../src/creative/visuals/palette";
import { findVisuals, groupOfCategory, visualGroups } from "../src/creative/visuals/find";
import { visualCategories } from "../src/creative/visuals/types";
import { layerCss, layerStyle } from "../src/creative/layers";
import { designStyles } from "../src/creative/openDesign/styles";
import { newProject } from "../src/creative/contracts";
import { fixture } from "./visuals-fixture";

/** What an feColorMatrix does to one pixel (colour values 0..1), clamped like the filter. */
function applyMatrix(m: number[], [r, g, b, a]: number[]) {
  const row = (i: number) => Math.max(0, Math.min(1, m[i * 5] * r + m[i * 5 + 1] * g + m[i * 5 + 2] * b + m[i * 5 + 3] * a + m[i * 5 + 4]));
  return [row(0), row(1), row(2), row(3)];
}

describe("ink: black takes one colour, white disappears", () => {
  it("is opaque at black, clear at white, and ramps in between", () => {
    expect(inkAlpha(0)).toBe(1);
    expect(inkAlpha(INK_BLACK)).toBe(1);
    expect(inkAlpha(INK_WHITE)).toBe(0);
    expect(inkAlpha(1)).toBe(0);
    const mid = inkAlpha((INK_BLACK + INK_WHITE) / 2);
    expect(mid).toBeCloseTo(0.5, 5);
    // Darker is never less opaque.
    for (let l = 0; l < 1; l += 0.05) expect(inkAlpha(l)).toBeGreaterThanOrEqual(inkAlpha(l + 0.05));
  });

  it("maps luminance to the ink colour with that alpha", () => {
    expect(mapInk(0, "#c03a2b")).toEqual([192, 58, 43, 255]);
    expect(mapInk(1, "#c03a2b")).toEqual([192, 58, 43, 0]);
    expect(Math.abs(mapInk(0.56, "#000000")[3] - 128)).toBeLessThanOrEqual(1);
  });

  it("clears JPEG noise around a white ground", () => {
    // A white ground compressed as JPEG sits a little under 255.
    expect(mapInk(247 / 255, "#111111")[3]).toBe(0);
    expect(mapInk(250 / 255, "#111111")[3]).toBe(0);
  });
});

describe("duotone: shadows take ink, highlights take ground", () => {
  it("is the ink at black and the ground at white", () => {
    expect(mapDuotone(0, "#102f34", "#f3e6d0")).toEqual([16, 47, 52]);
    expect(mapDuotone(1, "#102f34", "#f3e6d0")).toEqual([243, 230, 208]);
  });

  it("blends greys linearly and clamps out-of-range luminance", () => {
    expect(mapDuotone(0.5, "#000000", "#ffffff")).toEqual([128, 128, 128]);
    expect(mapDuotone(-1, "#102f34", "#f3e6d0")).toEqual([16, 47, 52]);
    expect(mapDuotone(2, "#102f34", "#f3e6d0")).toEqual([243, 230, 208]);
  });

  it("allows a reversed pairing (light shadows, dark highlights)", () => {
    expect(mapDuotone(0, "#ffffff", "#000000")).toEqual([255, 255, 255]);
  });
});

describe("the SVG filter does what the maths does", () => {
  const greys = [0, 0.1, 0.18, 0.4, 0.6, 0.85, 0.94, 1];
  it("ink matrix matches mapInk on grey pixels", () => {
    const colours = { ink: "#c03a2b" };
    const m = visualMatrix(colours);
    for (const l of greys) {
      const [r, g, b, a] = applyMatrix(m, [l, l, l, 1]);
      const want = mapInk(l, colours.ink);
      expect(Math.round(r * 255)).toBe(want[0]);
      expect(Math.round(g * 255)).toBe(want[1]);
      expect(Math.round(b * 255)).toBe(want[2]);
      expect(Math.abs(a * 255 - want[3])).toBeLessThan(1.01);
    }
  });

  it("duotone matrix matches mapDuotone on grey pixels", () => {
    const colours = { ink: "#102f34", ground: "#f3e6d0" };
    const m = visualMatrix(colours);
    for (const l of greys) {
      const out = applyMatrix(m, [l, l, l, 1]);
      const want = mapDuotone(l, colours.ink, colours.ground);
      for (let i = 0; i < 3; i++) expect(Math.abs(out[i] * 255 - want[i])).toBeLessThan(1.01);
      expect(out[3]).toBe(1);
    }
  });

  it("pixel mapping for covers agrees with both", () => {
    const px = (l: number) => Uint8ClampedArray.from([l, l, l, 255]);
    const ink = px(0);
    recolourPixels(ink, { ink: "#c03a2b" });
    expect([...ink]).toEqual([192, 58, 43, 255]);
    const white = px(255);
    recolourPixels(white, { ink: "#c03a2b" });
    expect(white[3]).toBe(0);
    const duo = px(255);
    recolourPixels(duo, { ink: "#102f34", ground: "#f3e6d0" });
    expect([...duo]).toEqual([243, 230, 208, 255]);
    const grey = px(128);
    recolourPixels(grey, { ink: "#000000", ground: "#ffffff" });
    expect([...grey]).toEqual([128, 128, 128, 255]);
  });

  it("builds one filter per colour pair, with ids derived from the hex", () => {
    expect(visualFilterId({ ink: "#C03A2B" })).toBe("kresilo-vis-c03a2b");
    expect(visualFilterId({ ink: "#102f34", ground: "#F3E6D0" })).toBe("kresilo-vis-102f34-f3e6d0");
    const defs = visualDefsMarkup([{ ink: "#c03a2b" }, { ink: "#C03A2B" }, { ink: "#102f34", ground: "#f3e6d0" }]);
    expect(defs.match(/<filter /g)).toHaveLength(2);
    expect(defs).toContain('color-interpolation-filters="sRGB"');
    expect(defs.startsWith("<svg width=\"0\" height=\"0\"")).toBe(true);
    expect(visualDefsMarkup([])).toBe("");
  });

  it("never puts anything but a validated colour into markup", () => {
    expect(visualFilterMarkup({ ink: '#000"><script>' })).toBe("");
    expect(visualFilterMarkup({ ink: "#000000", ground: "red" })).toBe("");
    expect(visualDefsMarkup([{ ink: "javascript:1" }])).toBe("");
  });
});

describe("a visual layer's CSS is the same on the canvas and in the export", () => {
  const layer = {
    ...newProject(crypto.randomUUID(), "b", "T").art.layers?.[0],
    id: crypto.randomUUID(),
    name: "Loaf",
    asset: "dusk-study" as const,
    visual: { id: "hand-drawn-loaf", ink: "#c03a2b" },
    x: 10,
    y: 10,
    width: 40,
    height: 40,
    opacity: 1,
    rotation: 0,
    visible: true,
    filter: "none" as const,
  };

  it("recolours first, then applies the layer's other effects, and keeps the picture whole", () => {
    const style = layerStyle({ ...layer, shadow: "soft", adjust: { brightness: 1.1, contrast: 1, saturation: 1, blur: 0 } });
    expect(String(style.filter).startsWith("url(#kresilo-vis-c03a2b) ")).toBe(true);
    expect(String(style.filter)).toContain("drop-shadow");
    expect(style.objectFit).toBe("contain");
    expect(layerCss(layer)).toContain("filter:url(#kresilo-vis-c03a2b)");
    expect(layerCss(layer)).toContain("object-fit:contain");
  });

  it("leaves other layers exactly as they were", () => {
    const { visual: _v, ...plain } = layer;
    const style = layerStyle(plain);
    expect(style.filter).toBe("none");
    expect(style.objectFit).toBeUndefined();
  });
});

describe("paletteFor", () => {
  const art = (over: Record<string, unknown> = {}) => ({ style: null as string | null, color: "#f1c3a6", canvasColor: "#102f34", ...over });

  it("uses the title colour for ink and the canvas colour for the ground", () => {
    const p = paletteFor({ art: art() });
    expect(p).toMatchObject({ ink: "#f1c3a6", ground: "#102f34" });
    expect(p.swatches).toEqual(["#f1c3a6", "#102f34"]);
  });

  it("offers the Style's foreground, accent, background and surface", () => {
    const s = designStyles[0];
    const p = paletteFor({ art: art({ style: s.id }) });
    for (const c of [s.palette.fg, s.palette.accent, s.palette.bg, s.palette.surface]) expect(p.swatches).toContain(c.toLowerCase());
    expect(p.swatches.length).toBeLessThanOrEqual(4);
  });

  it("swaps a lost ink for one that shows against the canvas", () => {
    const p = paletteFor({ art: art({ color: "#112f35" }) });
    expect(contrastRatio(p.ink, p.ground)).toBeGreaterThanOrEqual(2);
    const light = paletteFor({ art: art({ color: "#f2f1ed", canvasColor: "#f2f1ec" }) });
    expect(contrastRatio(light.ink, light.ground)).toBeGreaterThanOrEqual(2);
  });

  it("puts the darker colour in the shadows of a duotone", () => {
    const p = paletteFor({ art: art() }, "duotone");
    expect(luminanceOf(parseHex(p.ink))).toBeLessThan(luminanceOf(parseHex(p.ground)));
    expect(p.ink).toBe("#102f34");
    expect(p.ground).toBe("#f1c3a6");
  });

  it("falls back to the default canvas when none is set", () => {
    expect(paletteFor({ art: art({ canvasColor: undefined }) }).ground).toBe("#173e43");
    expect(toHex(parseHex("#173E43"))).toBe("#173e43");
  });
});

describe("finding visuals by hand", () => {
  it("puts every category in exactly one of six groups", () => {
    expect(visualGroups).toHaveLength(6);
    for (const c of visualCategories) expect(visualGroups.filter((g) => (g.categories as readonly string[]).includes(c))).toHaveLength(1);
    expect(groupOfCategory("food and drink")).toBe("food");
  });

  it("searches title and meanings, every word, titles first", () => {
    expect(findVisuals(fixture, { query: "bread" }).map((v) => v.id)).toEqual(["hand-drawn-loaf", "wheat-ear-linocut"]);
    expect(findVisuals(fixture, { query: "loaf" })[0].id).toBe("hand-drawn-loaf");
    expect(findVisuals(fixture, { query: "ferr" }).map((v) => v.id)).toEqual(["harbour-ferry-photo"]);
    expect(findVisuals(fixture, { query: "bread bakery" }).map((v) => v.id)).toEqual(["hand-drawn-loaf"]);
    expect(findVisuals(fixture, { query: "zzz" })).toEqual([]);
    expect(findVisuals(fixture, { query: "" })).toHaveLength(6);
  });

  it("narrows by group", () => {
    expect(findVisuals(fixture, { group: "food" }).map((v) => v.id)).toEqual(["hand-drawn-loaf"]);
    expect(findVisuals(fixture, { group: "marks" }).map((v) => v.id)).toEqual(["paper-grain-texture", "sun-badge-stamp"]);
    expect(findVisuals(fixture, { group: "nature", query: "bread" }).map((v) => v.id)).toEqual(["wheat-ear-linocut"]);
  });
});

describe("the filter keeps a picture's own transparency", () => {
  it("clips the result to the source alpha, so a fitted image's empty strip stays empty", () => {
    for (const c of [{ ink: "#3b2a1e" }, { ink: "#3b2a1e", ground: "#f3e3c6" }]) {
      expect(visualFilterMarkup(c)).toContain('<feComposite in="v" in2="SourceAlpha" operator="in"/>');
    }
  });
});
