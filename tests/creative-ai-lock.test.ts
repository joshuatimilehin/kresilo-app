import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  artPatch,
  imageLayerSchema,
  layerAdjustment,
  newProject,
  type ProjectRecord,
} from "../src/creative/contracts";
import { asReference } from "../src/creative/catalog";
import { addImageLayer, isAiLocked, lockedLayerChanges } from "../src/creative/layers";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

let records: Map<string, ProjectRecord>;
let record: ProjectRecord;
let layerA: string;
let layerB: string;

beforeEach(() => {
  records = new Map();
  const doc = newProject(crypto.randomUUID(), "Locks", "A study");
  doc.references.push(asReference("tidal-lines", "Keep the flowing lines"));
  doc.art.layers = addImageLayer(doc.art, { asset: "mineral" }, "Mineral");
  doc.art.layers = addImageLayer(doc.art, { asset: "blue-hour" }, "Blue hour");
  layerA = doc.art.layers[0].id;
  layerB = doc.art.layers[1].id;
  record = { id: crypto.randomUUID(), revision: 1, owner: true, document: doc };
  record.document.id = record.id;
  records.set(record.id, record);
  query.mockReset();
  query.mockImplementation(async (name: string, args: unknown[]) => {
    if (name === "creative_open") return { person: { name: "Guest", mode: "explorer" }, projects: [...records.values()] };
    if (name === "creative_get") return structuredClone(records.get(String(args[1])));
    if (name === "creative_save") {
      const current = records.get(String(args[1]));
      if (current && current.revision !== args[2]) throw new Error("CONFLICT");
      const next = { id: String(args[1]), revision: Number(args[2]) + 1, owner: true, document: structuredClone(args[3]) } as ProjectRecord;
      records.set(next.id, next);
      return structuredClone(next);
    }
    throw new Error("Unexpected storage call");
  });
});

const current = () => records.get(record.id)!;
const lock = (id: string, on = true) =>
  executeCreative("authorized", "artwork.edit", {
    projectId: record.id,
    revision: current().revision,
    patch: { layers: current().document.art.layers.map((l) => (l.id === id ? { ...l, aiLock: on } : l)) },
  });

describe("hand-only lock: schema", () => {
  it("lets a person set the lock and keeps older layers valid", () => {
    const layer = current().document.art.layers[0];
    expect(isAiLocked(layer)).toBe(false);
    expect(imageLayerSchema.safeParse({ ...layer, aiLock: true }).success).toBe(true);
    expect(imageLayerSchema.safeParse({ ...layer, aiLock: "yes" }).success).toBe(false);
    expect(artPatch.safeParse({ layers: [{ ...layer, aiLock: true }] }).success).toBe(true);
  });

  it("does not let an AI adjustment set or clear a lock", () => {
    expect(layerAdjustment.safeParse({ opacity: 0.5 }).success).toBe(true);
    expect(layerAdjustment.safeParse({ aiLock: false }).success).toBe(false);
    expect(layerAdjustment.safeParse({ aiLock: true }).success).toBe(false);
  });
});

describe("hand-only lock: what a patch may change", () => {
  it("names a locked layer that a patch changes or removes", () => {
    const art = structuredClone(current().document.art);
    art.layers[0].aiLock = true;
    const changed = { layers: art.layers.map((l, i) => (i === 0 ? { ...l, opacity: 0.4 } : l)) };
    expect(lockedLayerChanges(art, changed)).toEqual(["Mineral"]);
    expect(lockedLayerChanges(art, { layers: art.layers.slice(1) })).toEqual(["Mineral"]);
    const cleared = { layers: art.layers.map((l, i) => (i === 0 ? { ...l, aiLock: false } : l)) };
    expect(lockedLayerChanges(art, cleared)).toEqual(["Mineral"]);
  });

  it("allows changes to other layers and patches without layers", () => {
    const art = structuredClone(current().document.art);
    art.layers[0].aiLock = true;
    const other = { layers: art.layers.map((l, i) => (i === 1 ? { ...l, opacity: 0.4 } : l)) };
    expect(lockedLayerChanges(art, other)).toEqual([]);
    expect(lockedLayerChanges(art, { title: "New" })).toEqual([]);
    expect(lockedLayerChanges(art, { layers: art.layers })).toEqual([]);
  });
});

describe("hand-only lock: the command service", () => {
  it("lets a person lock a layer and still edit it by hand", async () => {
    expect((await lock(layerA)).ok).toBe(true);
    expect(isAiLocked(current().document.art.layers[0])).toBe(true);
    const edit = await executeCreative("authorized", "artwork.edit", {
      projectId: record.id,
      revision: current().revision,
      patch: { layers: current().document.art.layers.map((l) => (l.id === layerA ? { ...l, opacity: 0.3 } : l)) },
    });
    expect(edit.ok).toBe(true);
    expect(current().document.art.layers[0].opacity).toBe(0.3);
  });

  it("refuses to ask for a proposal on a locked layer and says why", async () => {
    await lock(layerA);
    const refused = await executeCreative("authorized", "proposal.request", {
      projectId: record.id,
      intent: "make it smaller",
      target: layerA,
    });
    expect(refused).toMatchObject({ ok: false, code: "LAYER_LOCKED" });
    expect(refused.ok === false && refused.message).toMatch(/locked to hand-only/i);
    expect(current().document.proposals).toHaveLength(0);
  });

  it("still proposes for an unlocked layer next to a locked one", async () => {
    await lock(layerA);
    const ok = await executeCreative("authorized", "proposal.request", {
      projectId: record.id,
      intent: "make it smaller",
      target: layerB,
    });
    expect(ok.ok).toBe(true);
    expect(current().document.proposals).toHaveLength(1);
  });

  it("refuses to approve a proposal that would change a layer locked since", async () => {
    const asked = await executeCreative("authorized", "proposal.request", {
      projectId: record.id,
      intent: "make it smaller",
      target: layerA,
    });
    expect(asked.ok).toBe(true);
    const proposal = current().document.proposals[0];
    // The lock arrives without a new version (for example from older saved data).
    current().document.art.layers[0].aiLock = true;
    const accepted = await executeCreative("authorized", "proposal.accept", {
      projectId: record.id,
      proposalId: proposal.id,
    });
    expect(accepted).toMatchObject({ ok: false, code: "LAYER_LOCKED" });
    expect(accepted.ok === false && accepted.message).toContain("Mineral");
    expect(current().document.proposals[0].status).toBe("proposed");
    expect(current().document.art.layers[0].width).toBe(55);
  });
});
