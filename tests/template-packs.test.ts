import { describe, expect, it } from "vitest";
import { packs } from "../src/creative/packs/data";
import { packLayout } from "../src/creative/packs/layouts";
import { MAX_LAYERS, MAX_MARKS } from "../src/creative/packs/kit";
import { DESKTOP_KINDS, PHONE_KINDS, formatOf } from "../src/creative/packs/types";
import { artPatch, formatRatio, type Mark } from "../src/creative/contracts";
import { visualById } from "../src/creative/visuals/library";
import { brandTemplates, templateById } from "../src/creative/portfolio";
import { LAYOUT_VARIANTS, hasLayout, templateLayout } from "../src/creative/portfolio/layouts";
import { padFour } from "../src/creative/portfolio/useInStudio";

const A = ["#102030", "#aa3344", "#eef2f5", "#33aa88"];
const B = ["#201408", "#2255cc", "#fff4d6", "#cc8822"];
const BRANDS = ["A", "Harbour & Co.", "Twenty four characters x", "Supercalifragilistic"];

const everyLayout = function* (palettes: string[][] = [A], brands = ["Harbour & Co."]) {
  for (const pack of packs)
    for (let v = 0; v < pack.layouts.length; v++)
      for (const palette of palettes)
        for (const brand of brands) yield { pack, v, palette, brand, art: packLayout(pack.id, { brand, palette }, v)! };
};

const coloursOf = (art: NonNullable<ReturnType<typeof packLayout>>) => {
  const out = new Set<string>([art.canvasColor!, art.color]);
  for (const m of art.marks ?? []) {
    if (m.kind === "text") out.add(m.color);
    if (m.kind === "shape") {
      out.add(m.stroke);
      if (m.fill !== "none") out.add(m.fill);
    }
  }
  for (const l of art.layers ?? []) {
    if (l.visual) out.add(l.visual.ink);
    if (l.visual?.ground) out.add(l.visual.ground);
  }
  return out;
};

describe("template packs", () => {
  it("ship at least ten UI/UX and ten brand-identity packs with four to eight layouts each", () => {
    expect(packs.filter((p) => p.subtype === "ui-ux").length).toBeGreaterThanOrEqual(10);
    expect(packs.filter((p) => p.subtype === "brand-identity").length).toBeGreaterThanOrEqual(10);
    expect(new Set(packs.map((p) => p.id)).size).toBe(packs.length);
    for (const p of packs) {
      expect(p.layouts.length, p.id).toBeGreaterThanOrEqual(4);
      expect(p.layouts.length, p.id).toBeLessThanOrEqual(8);
      expect(p.palette, p.id).toHaveLength(4);
    }
  });

  it("gives UI packs phone and desktop screens, and brand packs the sheets a client is shown", () => {
    for (const p of packs.filter((p) => p.subtype === "ui-ux")) {
      const formats = new Set(p.layouts.map((l) => formatOf(l.kind)));
      expect(formats, p.id).toEqual(new Set(["story", "wide"]));
      for (const l of p.layouts) expect([...PHONE_KINDS, ...DESKTOP_KINDS] as string[], `${p.id} ${l.kind}`).toContain(l.kind);
    }
    for (const p of packs.filter((p) => p.subtype === "brand-identity"))
      for (const k of ["logo", "palette", "type", "card", "poster", "social"]) expect(p.layouts.map((l) => l.kind), p.id).toContain(k);
  });

  it("uses only ink pictures that are in the library, with their real shapes", () => {
    for (const p of packs) {
      expect(p.shapes, p.id).toHaveLength(p.pictures.length);
      p.pictures.forEach((id, i) => {
        const v = visualById(id);
        expect(v, `${p.id} ${id}`).toBeDefined();
        expect(v!.kind, id).toBe("ink");
        expect(v!.shape[0], id).toBe(p.shapes[i]);
      });
    }
  });

  it("makes every layout a patch the server accepts, within the 12-layer limits", () => {
    for (const { pack, v, brand, art } of everyLayout([A, B, pack0().palette], BRANDS)) {
      const { title, titleVisible, titleType, marks, layers, color, size, x, y, asset, backgroundFilter, backgroundOpacity, captionVisible, format, canvasColor } = art;
      const parsed = artPatch.safeParse({ title, titleVisible, titleType, marks, layers, color, size, x, y, asset, backgroundFilter, backgroundOpacity, captionVisible, format, canvasColor });
      expect(parsed.success, `${pack.id} ${v} ${brand}: ${parsed.error?.message}`).toBe(true);
      expect(marks!.length).toBeLessThanOrEqual(MAX_MARKS);
      expect(layers!.length).toBeLessThanOrEqual(MAX_LAYERS);
      expect(format).toBe(formatOf(pack.layouts[v].kind));
    }
  });

  it("keeps every mark, picture and title inside the canvas", () => {
    const tol = 0.15;
    const bad: string[] = [];
    for (const { pack, v, brand, art } of everyLayout([A], BRANDS)) {
      const where = `${pack.id}#${v} "${brand}"`;
      const boxes = [...(art.marks ?? []), ...(art.layers ?? [])] as { name: string; x: number; y: number; width: number; height: number; rotation: number }[];
      for (const b of boxes) {
        if (b.rotation) continue;
        if (b.x < -tol || b.y < -tol || b.x + b.width > 100 + tol || b.y + b.height > 100 + tol) bad.push(`${where} ${b.name} ${b.x},${b.y} ${b.width}x${b.height}`);
      }
      const lines = art.title.split("\n").length;
      if (art.y + lines * art.size * 0.95 * formatRatio[art.format!] > 101) bad.push(`${where} title ends at ${art.y + lines * art.size * 0.95 * formatRatio[art.format!]}`);
      if (art.size < 12) bad.push(`${where} title size ${art.size}`);
    }
    expect(bad).toEqual([]);
  });

  it("recolours: the same layout in another palette keeps its shape and shares no colour", () => {
    for (const pack of packs)
      for (let v = 0; v < pack.layouts.length; v++) {
        const a = packLayout(pack.id, { brand: "Harbour & Co.", palette: A }, v)!;
        const b = packLayout(pack.id, { brand: "Harbour & Co.", palette: B }, v)!;
        const same = (m: Mark[] | undefined) => (m ?? []).map((x) => `${x.name}|${x.x}|${x.y}|${x.width}|${x.height}`);
        expect(same(b.marks), `${pack.id} ${v}`).toEqual(same(a.marks));
        expect((b.layers ?? []).map((l) => `${l.name}|${l.x}|${l.y}`)).toEqual((a.layers ?? []).map((l) => `${l.name}|${l.x}|${l.y}`));
        const shared = [...coloursOf(a)].filter((c) => coloursOf(b).has(c));
        expect(shared, `${pack.id} ${v}`).toEqual([]);
      }
  });

  it("gives every layer a fresh id, so two projects never share one", () => {
    const p = packs[0];
    const a = packLayout(p.id, { brand: "X", palette: A }, 1)!;
    const b = packLayout(p.id, { brand: "X", palette: A }, 1)!;
    const ids = new Set([...(a.marks ?? []), ...(a.layers ?? []), ...(b.marks ?? []), ...(b.layers ?? [])].map((x) => x.id));
    expect(ids.size).toBe((a.marks?.length ?? 0) + (a.layers?.length ?? 0) + (b.marks?.length ?? 0) + (b.layers?.length ?? 0));
  });

  it("puts the brand name on the sheet and keeps words short enough for a text mark", () => {
    for (const { art, brand } of everyLayout([A], ["Harbour & Co."])) {
      for (const m of art.marks ?? []) if (m.kind === "text") expect(m.text.length).toBeLessThanOrEqual(80);
      void brand;
    }
  });

  it("shows up as templates: listed, with a layout for each, and not as a missing pack", () => {
    for (const p of packs) {
      const t = templateById(p.id)!;
      expect(t, p.id).toBeDefined();
      expect(hasLayout(p.id)).toBe(true);
      expect(LAYOUT_VARIANTS[p.id]).toBe(p.layouts.length);
      expect(templateLayout(p.id, { brand: "X", palette: padFour(t.palette) }, p.layouts.length + 1)).not.toBeNull();
    }
    expect(brandTemplates.length).toBeGreaterThanOrEqual(packs.length + 10);
    expect(packLayout("nothing", { brand: "X", palette: A })).toBeNull();
  });
});

function pack0() {
  return packs[0];
}
