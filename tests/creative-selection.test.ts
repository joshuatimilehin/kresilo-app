import { describe, expect, it } from "vitest";
import { alignSelection, distributeSelection, groupMates, isOneGroup, moveSelection, selectionBounds, toggleGroup } from "../src/creative/align";
import { imageLayerSchema, type Art, type ImageLayer } from "../src/creative/contracts";

const layer = (id: string, x: number, y: number, extra: Partial<ImageLayer> = {}): ImageLayer =>
  ({ id, name: id, asset: "dusk-study", x, y, width: 10, height: 10, rotation: 0, opacity: 1, visible: true, filter: "none", ...extra }) as ImageLayer;
const art = (layers: ImageLayer[]) => ({ title: "T", color: "#fff", size: 20, x: 0, y: 0, asset: "dusk-study", layers }) as Art;
const ids = ["a", "b", "c"];

describe("several layers at once", () => {
  const a = art([layer("a", 10, 10), layer("b", 40, 30), layer("c", 70, 20), layer("d", 5, 80)]);

  it("measures the shared box", () => {
    const s = selectionBounds(a.layers!.filter((l) => ids.includes(l.id)));
    expect(s.left).toBeCloseTo(10);
    expect(s.right).toBeCloseTo(80);
    expect(s.top).toBeCloseTo(10);
    expect(s.bottom).toBeCloseTo(40);
  });

  it("lines layers up on the shared box, leaving others alone", () => {
    const out = alignSelection(a, ids, "left");
    expect(out.filter((l) => ids.includes(l.id)).map((l) => l.x)).toEqual([10, 10, 10]);
    expect(out.find((l) => l.id === "d")?.x).toBe(5);
    expect(alignSelection(a, ids, "top").filter((l) => ids.includes(l.id)).map((l) => l.y)).toEqual([10, 10, 10]);
  });

  it("spreads three or more evenly and keeps the outer two", () => {
    const uneven = art([layer("a", 0, 0), layer("b", 10, 0), layer("c", 60, 0)]);
    const out = distributeSelection(uneven, ids, "x");
    expect(out.map((l) => l.x)).toEqual([0, 30, 60]);
    expect(distributeSelection(uneven, ["a", "b"], "x")).toEqual(uneven.layers);
  });

  it("spaces layers of different widths by equal gaps", () => {
    const mixed = art([layer("a", 0, 0), layer("b", 15, 0, { width: 40 }), layer("c", 80, 0)]);
    const out = distributeSelection(mixed, ids, "x");
    // span 0..90, widths 10 + 40 + 10 = 60, so each gap is 15
    expect(out.map((l) => l.x)).toEqual([0, 25, 80]);
  });

  it("moves the chosen layers together and stays inside the limits", () => {
    const out = moveSelection(a, ["a", "b"], 5, -3);
    expect(out.find((l) => l.id === "a")).toMatchObject({ x: 15, y: 7 });
    expect(out.find((l) => l.id === "c")).toMatchObject({ x: 70, y: 20 });
    expect(moveSelection(a, ["c"], 500, 0).find((l) => l.id === "c")?.x).toBe(100);
  });

  it("groups and ungroups, and a grouped layer brings its group", () => {
    const grouped = art(toggleGroup(a, ["a", "b"], () => "g1abcd"));
    expect(grouped.layers?.find((l) => l.id === "a")?.group).toBe("g1abcd");
    for (const l of grouped.layers ?? []) expect(imageLayerSchema.safeParse({ ...l, id: crypto.randomUUID() }).success).toBe(true);
    expect(isOneGroup(grouped, ["a", "b"])).toBe(true);
    expect(groupMates(grouped, "b").sort()).toEqual(["a", "b"]);
    expect(groupMates(grouped, "c")).toEqual(["c"]);
    const ungrouped = art(toggleGroup(grouped, ["a", "b"]));
    expect(ungrouped.layers?.some((l) => l.group)).toBe(false);
  });
});
