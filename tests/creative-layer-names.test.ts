import { describe, expect, it } from "vitest";
import {
  artPatch,
  assetKeys,
  imageLayerSchema,
  layerRoles,
  newProject,
  type ImageLayer,
} from "../src/creative/contracts";
import { assetLayerNames } from "../src/creative/catalog";
import {
  addImageLayer,
  applyLayerEdit,
  isAiLocked,
  renameLayer,
  toggleLayerLock,
} from "../src/creative/layers";
import {
  describeLayer,
  layerRole,
  maxLayerNameLength,
  normalizeLayerName,
  positionWord,
  roleLabels,
  sizeWord,
  suggestLayerName,
  uniqueLayerName,
} from "../src/creative/layerNames";

const art = () => newProject(crypto.randomUUID(), "Names", "A study").art;
const withLayers = (a: ReturnType<typeof art>, ...assets: (typeof assetKeys)[number][]) => {
  for (const asset of assets) a.layers = addImageLayer(a, { asset });
  return a;
};

describe("layer roles and default names", () => {
  it("gives every asset key a plain 2 to 4 word name and a valid role", () => {
    for (const key of assetKeys) {
      const entry = assetLayerNames[key];
      expect(entry, key).toBeDefined();
      const words = entry.layerName.split(" ");
      expect(words.length).toBeGreaterThanOrEqual(2);
      expect(words.length).toBeLessThanOrEqual(4);
      expect(layerRoles).toContain(entry.role);
    }
    expect(Object.keys(assetLayerNames).sort()).toEqual([...assetKeys].sort());
    expect(new Set(Object.values(assetLayerNames).map((v) => v.layerName)).size).toBe(
      assetKeys.length,
    );
    for (const r of layerRoles) expect(roleLabels[r].label.length).toBeGreaterThan(0);
  });

  it("pre-names a layer from its asset and records the role", () => {
    for (const key of assetKeys) {
      const a = art();
      const [layer] = addImageLayer(a, { asset: key });
      expect(layer.name).toBe(assetLayerNames[key].layerName);
      expect(layer.role).toBe(assetLayerNames[key].role);
      expect(imageLayerSchema.safeParse(layer).success).toBe(true);
    }
  });

  it("keeps an imported image's own title and marks its role as other", () => {
    const a = art();
    const [layer] = addImageLayer(a, { mediaId: crypto.randomUUID() }, "My sketch");
    expect(layer.name).toBe("My sketch");
    expect(layer.role).toBe("other");
    expect(addImageLayer(art(), { mediaId: crypto.randomUUID() })[0].name).toBe("Imported image");
  });

  it("keeps names unique, preferring a position word and numbers only as a last resort", () => {
    const a = withLayers(art(), "paper-orbit", "paper-orbit", "paper-orbit");
    const names = a.layers.map((l) => l.name);
    expect(names[0]).toBe("Paper orbit shape");
    expect(names[1]).toBe("Paper orbit shape, centre");
    expect(names[2]).toBe("Paper orbit shape, medium");
    expect(new Set(names.map((n) => n.toLowerCase())).size).toBe(3);
    a.layers = addImageLayer(a, { asset: "paper-orbit" });
    expect(a.layers[3].name).toBe("Paper orbit shape, front");
    a.layers = addImageLayer(a, { asset: "paper-orbit" });
    expect(a.layers[4].name).toBe("Paper orbit shape 2");
    a.layers = addImageLayer(a, { asset: "paper-orbit" });
    expect(a.layers[5].name).toBe("Paper orbit shape 3");
  });

  it("compares names ignoring case and extra spaces", () => {
    expect(uniqueLayerName("  paper   TEXTURE ", ["Paper texture"], ["left"])).toBe(
      "paper TEXTURE, left",
    );
    expect(uniqueLayerName("Fresh name", ["Paper texture"])).toBe("Fresh name");
  });
});

describe("name tidying", () => {
  it("collapses spaces, drops control characters and caps the length", () => {
    expect(normalizeLayerName("  Big \n\t  sun  ")).toBe("Big sun");
    expect(normalizeLayerName("   ")).toBe("Image layer");
    expect(normalizeLayerName("x".repeat(400))).toHaveLength(maxLayerNameLength);
    const long = "y".repeat(maxLayerNameLength);
    expect(uniqueLayerName(long, [long]).length).toBeLessThanOrEqual(maxLayerNameLength);
    expect(uniqueLayerName(long, [long])).not.toBe(long);
  });
});

describe("position and size words", () => {
  const at = (x: number, y: number, width: number, height: number) => ({ x, y, width, height });
  it("names where the middle of a layer sits", () => {
    expect(positionWord(at(15, 20, 55, 45))).toBe("centre");
    expect(positionWord(at(0, 30, 30, 40))).toBe("left");
    expect(positionWord(at(70, 30, 30, 40))).toBe("right");
    expect(positionWord(at(30, 0, 40, 30))).toBe("top");
    expect(positionWord(at(30, 70, 40, 30))).toBe("bottom");
    expect(positionWord(at(0, 0, 30, 30))).toBe("top left");
    expect(positionWord(at(70, 70, 30, 30))).toBe("bottom right");
  });
  it("names how much of the canvas a layer covers", () => {
    expect(sizeWord(at(0, 0, 100, 100))).toBe("large");
    expect(sizeWord(at(15, 20, 55, 45))).toBe("medium");
    expect(sizeWord(at(10, 10, 25, 25))).toBe("small");
  });
});

describe("suggestions and descriptions", () => {
  const place = (l: ImageLayer, box: Partial<ImageLayer>): ImageLayer => ({ ...l, ...box });

  it("suggests the asset name, with size and place only when they say something", () => {
    const a = withLayers(art(), "mineral");
    const [l] = a.layers;
    expect(suggestLayerName(l, a)).toBe("Teal plaster texture");
    expect(suggestLayerName(place(l, { x: 0, y: 0, width: 25, height: 25 }), a)).toBe(
      "Teal plaster texture, small, top left",
    );
    expect(suggestLayerName(place(l, { x: 0, y: 0, width: 100, height: 100 }), a)).toBe(
      "Teal plaster texture, large",
    );
    expect(suggestLayerName(place(l, { x: 70, y: 30, width: 30, height: 45 }), a)).toBe(
      "Teal plaster texture, right",
    );
  });

  it("avoids the names of other layers and ignores the layer's own current name", () => {
    const a = withLayers(art(), "mineral", "mineral");
    const [first, second] = a.layers;
    expect(suggestLayerName(first, a)).toBe("Teal plaster texture");
    expect(suggestLayerName(second, a)).toBe("Teal plaster texture, centre");
    expect(suggestLayerName(first, a, [])).toBe("Teal plaster texture");
  });

  it("falls back to the role for an image with no catalogue entry", () => {
    const a = art();
    a.layers = addImageLayer(a, { mediaId: crypto.randomUUID() }, "Scan 4");
    const l = a.layers[0];
    expect(suggestLayerName(l, a)).toBe("Imported image");
    expect(suggestLayerName({ ...l, role: "texture" }, a)).toBe("Texture");
  });

  it("describes a layer in plain words", () => {
    const a = withLayers(art(), "paper-orbit");
    const l = a.layers[0];
    expect(describeLayer(l)).toBe(
      "Paper orbit shape (shape layer), at the centre, medium size",
    );
    expect(
      describeLayer({ ...l, x: 0, y: 0, width: 25, height: 25, visible: false, role: "type" }),
    ).toBe(
      "Paper orbit shape (lettering layer), at the top left, small size, currently hidden",
    );
  });
});

describe("older layers and renaming", () => {
  it("accepts layers saved before roles existed and infers a role", () => {
    const old = {
      id: crypto.randomUUID(),
      name: "Mineral",
      asset: "mineral",
      x: 15,
      y: 20,
      width: 55,
      height: 45,
      opacity: 1,
      rotation: 0,
      visible: true,
      filter: "none",
    };
    const parsed = imageLayerSchema.parse(old);
    expect(parsed.role).toBeUndefined();
    expect(layerRole(parsed)).toBe("texture");
    expect(layerRole({ mediaId: crypto.randomUUID() } as ImageLayer)).toBe("other");
    expect(imageLayerSchema.safeParse({ ...old, role: "banner" }).success).toBe(false);
    expect(artPatch.safeParse({ layers: [old] }).success).toBe(true);
  });

  it("round-trips a rename through artPatch and keeps other layers untouched", () => {
    const a = withLayers(art(), "mineral", "blue-hour");
    const [first, second] = a.layers;
    const layers = renameLayer(a, first.id, "  Wall behind the arch ");
    const parsed = artPatch.parse({ layers });
    expect(parsed.layers?.[0].name).toBe("Wall behind the arch");
    expect(parsed.layers?.[0].role).toBe(first.role);
    expect(parsed.layers?.[1]).toEqual(second);
    expect(a.layers[0].name).toBe("Teal plaster texture");
  });

  it("makes a duplicate rename unique and cannot clash with itself", () => {
    const a = withLayers(art(), "mineral", "blue-hour");
    const [first, second] = a.layers;
    expect(renameLayer(a, second.id, "teal plaster texture")[1].name).toBe(
      "teal plaster texture, centre",
    );
    expect(renameLayer(a, first.id, "Teal plaster texture")[0].name).toBe("Teal plaster texture");
    expect(renameLayer(a, first.id, "   ")[0].name).toBe("Image layer");
    expect(applyLayerEdit(a, { ...first, role: "overlay", opacity: 0.5 })[0]).toMatchObject({
      name: "Teal plaster texture",
      role: "overlay",
      opacity: 0.5,
    });
    expect(renameLayer(a, "missing", "x")).toEqual(a.layers);
  });
});

describe("toggleLayerLock", () => {
  it("locks one layer and leaves the others untouched, then unlocks it again", () => {
    const a = withLayers(art(), "mineral", "blue-hour", "paper-orbit");
    const [first, second, third] = a.layers;
    const locked = toggleLayerLock(a, second.id);
    expect(locked).toHaveLength(3);
    expect(isAiLocked(locked[1])).toBe(true);
    expect(locked[0]).toBe(first);
    expect(locked[2]).toBe(third);
    expect(a.layers[1].aiLock).toBeUndefined();
    expect(artPatch.safeParse({ layers: locked }).success).toBe(true);
    const unlocked = toggleLayerLock({ ...a, layers: locked }, second.id);
    expect(isAiLocked(unlocked[1])).toBe(false);
    expect("aiLock" in unlocked[1]).toBe(false);
    expect(unlocked[1]).toEqual(second);
  });

  it("treats an explicit false as unlocked and ignores unknown ids", () => {
    const a = withLayers(art(), "mineral");
    a.layers[0] = { ...a.layers[0], aiLock: false };
    expect(toggleLayerLock(a, a.layers[0].id)[0].aiLock).toBe(true);
    expect(toggleLayerLock(a, "missing")).toEqual(a.layers);
    expect(toggleLayerLock(art(), "x")).toEqual([]);
  });
});
