import { describe, expect, it } from "vitest";
import {
  artPatch,
  blendModes,
  imageLayerSchema,
  layerAdjustment,
  newProject,
  type ImageLayer,
} from "../src/creative/contracts";
import { addImageLayer, layerCss, layerStyle } from "../src/creative/layers";

function baseLayer(): ImageLayer {
  const p = newProject(crypto.randomUUID(), "Effects");
  return addImageLayer(p.art, { asset: "mineral" }, "Mineral")[0];
}

describe("layer effects: schema", () => {
  it("keeps layers saved before effects existed valid and unchanged", () => {
    const layer = baseLayer();
    const parsed = imageLayerSchema.parse(layer);
    expect(parsed.crop).toBeUndefined();
    expect(parsed.mask).toBeUndefined();
    expect(parsed.shadow).toBeUndefined();
    expect(artPatch.safeParse({ layers: [layer] }).success).toBe(true);
  });

  it("accepts bounded effects on a layer and in an adjustment", () => {
    const effects = {
      crop: { top: 10, right: 0, bottom: 20, left: 5 },
      mask: { shape: "ellipse", feather: 12, invert: false },
      shadow: "soft",
      blend: "multiply",
      flipX: true,
      flipY: false,
      adjust: { brightness: 1.2, contrast: 0.9, saturation: 1, blur: 3 },
    } as const;
    expect(imageLayerSchema.safeParse({ ...baseLayer(), ...effects }).success).toBe(true);
    expect(layerAdjustment.safeParse(effects).success).toBe(true);
  });

  it("rejects values that could escape into CSS or break the picture", () => {
    const layer = baseLayer();
    const bad: Record<string, unknown>[] = [
      { shadow: "0 0 9px url(https://evil.test)" },
      { blend: "normal; background:url(https://evil.test)" },
      { mask: { shape: "polygon(0 0)", feather: 0, invert: false } },
      { mask: { shape: "ellipse", feather: 41, invert: false } },
      { mask: { shape: "ellipse", feather: 5, invert: false, image: "url(x)" } },
      { crop: { top: 81, right: 0, bottom: 0, left: 0 } },
      { crop: { top: 50, right: 0, bottom: 50, left: 0 } },
      { adjust: { brightness: 3, contrast: 1, saturation: 1, blur: 0 } },
      { adjust: { brightness: 1, contrast: 1, saturation: 1, blur: 21 } },
      { adjust: { brightness: 1, contrast: 1, saturation: 1 } },
      { flipX: "yes" },
    ];
    for (const effect of bad) {
      expect(imageLayerSchema.safeParse({ ...layer, ...effect }).success).toBe(false);
      expect(layerAdjustment.safeParse(effect).success).toBe(false);
    }
  });

  it("offers a closed list of blend modes", () => {
    expect(blendModes).toContain("multiply");
    expect(blendModes).not.toContain("plus-lighter" as never);
  });
});

describe("layer effects: style", () => {
  it("produces the same style as before for a plain layer", () => {
    const layer = baseLayer();
    expect(layerStyle(layer)).toEqual({
      opacity: 1,
      transform: "rotate(0deg)",
      filter: "none",
    });
    expect(layerCss(layer)).toBe("opacity:1;transform:rotate(0deg);filter:none");
  });

  it("combines flips, filters, shadow and blend", () => {
    const style = layerStyle({
      ...baseLayer(),
      rotation: 15,
      filter: "grayscale",
      flipX: true,
      flipY: true,
      shadow: "hard",
      blend: "screen",
      adjust: { brightness: 1.2, contrast: 1, saturation: 0.5, blur: 4 },
    });
    expect(style.transform).toBe("rotate(15deg) scaleX(-1) scaleY(-1)");
    expect(style.filter).toBe(
      "grayscale(1) brightness(1.2) saturate(0.5) blur(4px) drop-shadow(8px 8px 0 rgba(0,0,0,.5))",
    );
    expect(style.mixBlendMode).toBe("screen");
  });

  it("crops and rounds with clip-path and masks an ellipse with a gradient", () => {
    const cropped = layerStyle({
      ...baseLayer(),
      crop: { top: 10, right: 0, bottom: 20, left: 5 },
      mask: { shape: "rounded", feather: 0, invert: false },
    });
    expect(cropped.clipPath).toBe("inset(10% 0% 20% 5% round 12%)");
    const feathered = layerStyle({
      ...baseLayer(),
      mask: { shape: "ellipse", feather: 20, invert: false },
    });
    expect(feathered.maskImage).toBe(
      "radial-gradient(ellipse closest-side at 50% 50%, #000 80%, transparent 100%)",
    );
    expect(feathered.WebkitMaskImage).toBe(feathered.maskImage);
    const inverted = layerStyle({
      ...baseLayer(),
      mask: { shape: "ellipse", feather: 0, invert: true },
    });
    expect(String(inverted.maskImage)).toContain("transparent 99.5%, #000 100%");
  });

  it("writes vendor-prefixed and camel-case keys as CSS text", () => {
    const css = layerCss({
      ...baseLayer(),
      blend: "overlay",
      mask: { shape: "ellipse", feather: 10, invert: false },
    });
    expect(css).toContain("mix-blend-mode:overlay");
    expect(css).toContain("-webkit-mask-image:radial-gradient(");
    expect(css).toContain(";mask-image:radial-gradient(");
    expect(css).not.toMatch(/[A-Z]/);
  });

  it("only ever emits characters a number, word or fixed template can produce", () => {
    const css = layerCss({
      ...baseLayer(),
      shadow: "soft",
      blend: "soft-light",
      crop: { top: 1, right: 2, bottom: 3, left: 4 },
      mask: { shape: "ellipse", feather: 7, invert: true },
      adjust: { brightness: 0.5, contrast: 1.5, saturation: 2, blur: 1 },
    });
    expect(css).not.toMatch(/url\(|expression|javascript|["'<>{}]/i);
  });
});

describe("photo adjustments: warmth and grain", () => {
  const adjust = (extra: Record<string, unknown>) => ({ brightness: 1, contrast: 1, saturation: 1, blur: 0, ...extra });

  it("keeps earlier adjustments valid and accepts bounded warmth and grain", () => {
    expect(layerAdjustment.safeParse({ adjust: adjust({}) }).success).toBe(true);
    expect(layerAdjustment.safeParse({ adjust: adjust({ warmth: -1, grain: 1 }) }).success).toBe(true);
    for (const bad of [{ warmth: 1.5 }, { warmth: -2 }, { grain: 2 }, { grain: -0.1 }, { sepia: 1 }])
      expect(layerAdjustment.safeParse({ adjust: adjust(bad) }).success, JSON.stringify(bad)).toBe(false);
  });

  it("adds nothing to the style when warmth and grain are absent or zero", async () => {
    const { layerStyle } = await import("../src/creative/layers");
    const plain = layerStyle({ ...baseLayer(), adjust: adjust({}) });
    expect(plain.filter).toBe("none");
    expect(layerStyle({ ...baseLayer(), adjust: adjust({ warmth: 0, grain: 0 }) }).filter).toBe("none");
  });

  it("writes a warm tint as sepia, a cool tint as a hue turn, and grain as a fixed filter id", async () => {
    const { layerStyle, warmthFilter, grainStep, grainFilterId } = await import("../src/creative/layers");
    expect(warmthFilter(1)).toBe("sepia(0.35) saturate(1.15)");
    expect(warmthFilter(-1)).toBe("hue-rotate(18deg) saturate(1.08)");
    expect(layerStyle({ ...baseLayer(), adjust: adjust({ warmth: 0.5, grain: 0.6 }) }).filter).toBe(
      "sepia(0.18) saturate(1.08) url(#kresilo-grain-3)",
    );
    expect([0, 0.1, 0.5, 1, undefined].map((g) => grainStep(g))).toEqual([0, 1, 3, 5, 0]);
    expect(grainFilterId(2)).toBe("kresilo-grain-2");
  });

  it("only ever references the five fixed grain filters", async () => {
    const { layerStyle, grainDefsMarkup } = await import("../src/creative/layers");
    for (const grain of [0.01, 0.25, 0.5, 0.75, 1]) {
      const filter = String(layerStyle({ ...baseLayer(), adjust: adjust({ grain }) }).filter);
      expect(filter).toMatch(/^url\(#kresilo-grain-[1-5]\)$/);
    }
    const defs = grainDefsMarkup();
    expect(defs.match(/<filter /g)).toHaveLength(5);
    expect(defs).not.toMatch(/<script|onload|href|javascript:/i);
  });
});
