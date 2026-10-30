import { describe, expect, it } from "vitest";
import { MAX_VERSIONS, VERSIONS_BUDGET, keepVersion, listVersions, type CanvasVersion } from "../src/creative/canvasVersions";

const v = (n: number, scene = `{"n":${n}}`): CanvasVersion => ({ id: `v${n}`, at: "2026-10-26T10:00:00Z", kind: "manual", scene });

describe("canvas versions", () => {
  it("keeps the newest first", () => {
    const out = keepVersion([v(1)], v(2))!;
    expect(out.map((x) => x.id)).toEqual(["v2", "v1"]);
  });

  it("does not keep the same scene twice in a row", () => {
    expect(keepVersion([v(1, "same")], v(2, "same"))!.map((x) => x.id)).toEqual(["v1"]);
  });

  it("drops the oldest past the limit", () => {
    let kept: CanvasVersion[] = [];
    for (let i = 0; i < MAX_VERSIONS + 3; i++) kept = keepVersion(kept, v(i))!;
    expect(kept).toHaveLength(MAX_VERSIONS);
    expect(kept[0].id).toBe(`v${MAX_VERSIONS + 2}`);
  });

  it("drops the oldest until the scenes fit, and refuses one that never could", () => {
    const big = "x".repeat(Math.floor(VERSIONS_BUDGET / 2) + 1);
    const kept = keepVersion([v(1, big + "a")], v(2, big + "b"))!;
    expect(kept.map((x) => x.id)).toEqual(["v2"]);
    expect(keepVersion([], v(3, "y".repeat(VERSIONS_BUDGET + 1)))).toBeNull();
  });

  it("lists versions without their scenes", () => {
    expect(listVersions([v(1)])).toEqual([{ ...v(1), scene: "" }]);
    expect(listVersions(undefined)).toEqual([]);
  });
});
