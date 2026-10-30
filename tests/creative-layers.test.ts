import { afterEach, describe, expect, it, vi } from "vitest";
import { artPatch, commands, newProject, recordVersion } from "../src/creative/contracts";
import { addImageLayer, moveLayer } from "../src/creative/layers";
import { draftCreativeProposal } from "../server/creative/assistant";

afterEach(() => vi.unstubAllEnvs());
function fixture() {
  const p = newProject(crypto.randomUUID(), "A layered collage");
  p.references.push({
    id: "source",
    workId: "mineral-notes",
    title: "Mineral notes",
    creator: "Ayo",
    source: "/work/mineral-notes",
    reason: "Texture",
    asset: "mineral",
    tags: ["texture"],
  });
  p.art.layers = addImageLayer(p.art, { asset: "mineral" }, "Mineral texture");
  return p;
}
describe("layered artwork", () => {
  it("bounds motion pace and preserves older motion settings", () => {
    const input = { projectId: crypto.randomUUID(), revision: 1, seconds: 4, movement: "cut", loop: true };
    expect(commands["motion.configure"].safeParse(input).success).toBe(true);
    expect(commands["motion.configure"].safeParse({ ...input, beat: .25 }).success).toBe(true);
    expect(commands["motion.configure"].safeParse({ ...input, beat: .01 }).success).toBe(false);
  });
  it("keeps nested version snapshots immutable and restores source ordering", () => {
    const p = fixture();
    recordVersion(p, "Added layer");
    p.art.layers[0].x = 60;
    expect(p.versions[1].art.layers[0].x).toBe(15);
    p.art.layers = addImageLayer(p.art, { asset: "blue-hour" }, "Blue hour");
    const original = structuredClone(p.art.layers);
    expect(moveLayer(p.art, original[0].id, 1).map((l) => l.name)).toEqual([
      "Blue hour",
      "Mineral texture",
    ]);
    expect(p.art.layers).toEqual(original);
  });
  it("rejects ambiguous sources, executable filters, duplicate IDs and oversized layer arrays", () => {
    const layer = fixture().art.layers[0];
    expect(
      artPatch.safeParse({
        layers: [{ ...layer, mediaId: crypto.randomUUID() }],
      }).success,
    ).toBe(false);
    expect(
      artPatch.safeParse({
        layers: [{ ...layer, filter: "url(https://evil.test)" }],
      }).success,
    ).toBe(false);
    expect(artPatch.safeParse({ layers: [layer, layer] }).success).toBe(false);
    expect(
      artPatch.safeParse({
        layers: Array.from({ length: 13 }, () => ({
          ...layer,
          id: crypto.randomUUID(),
        })),
      }).success,
    ).toBe(false);
  });
  it("proposes a focused layer change without mutating artwork or unrelated layers", async () => {
    vi.stubEnv("INFERHUB_API_KEY", "");
    const p = fixture();
    p.art.layers = addImageLayer(p.art, { asset: "blue-hour" }, "Blue hour");
    const before = structuredClone(p.art);
    const q = await draftCreativeProposal(
      p,
      "make it smaller and move left, opacity 50%",
      "hash",
      p.art.layers[0].id,
    );
    expect(p.art).toEqual(before);
    expect(q.patch.layers[0]).toMatchObject({
      width: 44,
      height: 36,
      x: 5,
      opacity: 0.5,
    });
    expect(q.patch.layers[1]).toEqual(before.layers[1]);
    expect(q.patch).not.toHaveProperty("asset");
    expect(q.provenance).toContain("no model called");
  });
  it("does not disguise unsupported requests as a successful arbitrary edit", async () => {
    vi.stubEnv("INFERHUB_API_KEY", "");
    const p = fixture();
    await expect(
      draftCreativeProposal(
        p,
        "remove the person from the photograph",
        "hash",
        p.art.layers[0].id,
      ),
    ).rejects.toThrow("UNSUPPORTED_PROMPT");
    await expect(
      draftCreativeProposal(p, "hide it", "hash", "missing-layer"),
    ).rejects.toThrow("INVALID_TARGET");
  });
});
