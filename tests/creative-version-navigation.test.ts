import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  commands,
  currentVersion,
  historyStep,
  newProject,
  recordHandEdit,
  recordVersion,
  stepVersion,
  versionNavigation,
  type ProjectRecord,
  type Suggestion,
} from "../src/creative/contracts";
import { addImageLayer } from "../src/creative/layers";
import { authorshipSteps } from "../src/creative/authorship";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

describe("saved artwork undo and redo", () => {
  it("walks multiple edits backward and forward across fresh JSON reads", () => {
    let p = newProject(crypto.randomUUID(), "Version navigation");
    const original = structuredClone(p.art);
    p.art.layers = addImageLayer(p.art, { asset: "mineral" }, "Texture");
    p.motion = { ...p.motion, movement: "cut", beat: .25 };
    recordVersion(p, "Add texture and motion");
    const layered = structuredClone(p.art);
    p.art.layers[0].rotation = 30;
    recordVersion(p, "Rotate texture");
    const snapshots = structuredClone(p.versions);
    expect(stepVersion(p, "undo")).toBe(true);
    expect(p.art).toEqual(layered);
    p = JSON.parse(JSON.stringify(p));
    expect(stepVersion(p, "undo")).toBe(true);
    expect(p.art).toEqual(original);
    expect(stepVersion(p, "undo")).toBe(false);
    expect(stepVersion(p, "redo")).toBe(true);
    expect(p.art).toEqual(layered);
    expect(p.motion.movement).toBe("cut");
    expect(p.motion.beat).toBe(.25);
    expect(stepVersion(p, "redo")).toBe(true);
    expect(p.art.layers[0].rotation).toBe(30);
    expect(stepVersion(p, "redo")).toBe(false);
    expect(p.versions.slice(0, snapshots.length)).toEqual(snapshots);
    p.art.layers[0].x = 80;
    expect(p.versions.at(-1).art.layers[0].x).not.toBe(80);
  });

  it("clears redo after a new edit but preserves the abandoned versions", () => {
    const p = newProject(crypto.randomUUID(), "Branch history");
    p.art.size = 22;
    recordVersion(p, "Larger title");
    const abandoned = p.versions.at(-1).id;
    stepVersion(p, "undo");
    p.art.size = 15;
    recordVersion(p, "Different size");
    expect(versionNavigation(p).redo).toEqual([]);
    expect(stepVersion(p, "redo")).toBe(false);
    expect(p.versions.some((v) => v.id === abandoned)).toBe(true);
    stepVersion(p, "undo");
    expect(p.art.size).not.toBe(22);
  });

  it("supports older projects and makes a restored version undoable", () => {
    const p = newProject(crypto.randomUUID(), "Legacy project");
    p.art.title = "Second";
    recordVersion(p, "Second title");
    delete p.versionNavigation;
    expect(versionNavigation(p).undo).toEqual([p.versions[0].id]);
    expect(stepVersion(p, "undo")).toBe(true);
    p.art = structuredClone(p.versions[1].art);
    p.motion = { ...p.versions[1].motion };
    recordVersion(p, "Restored version 2");
    expect(stepVersion(p, "undo")).toBe(true);
    expect(p.art).toEqual(p.versions[0].art);
  });

  it("requires a revision for both navigation commands", () => {
    for (const verb of ["version.undo", "version.redo"] as const) {
      const input = { projectId: crypto.randomUUID(), revision: 1 };
      expect(commands[verb].safeParse(input).success).toBe(true);
      expect(commands[verb].safeParse({ projectId: input.projectId }).success).toBe(false);
    }
  });
});

describe("undo and redo never add saved versions", () => {
  it("moves the canvas through history while the version count stays the same", () => {
    const p = newProject(crypto.randomUUID(), "Count");
    p.art.size = 20;
    recordVersion(p, "Bigger");
    p.art.size = 24;
    recordVersion(p, "Bigger still");
    const count = p.versions.length;
    expect(stepVersion(p, "undo")).toBe(true);
    expect(stepVersion(p, "undo")).toBe(true);
    expect(stepVersion(p, "redo")).toBe(true);
    expect(p.versions).toHaveLength(count);
    expect(p.art.size).toBe(20);
    expect(currentVersion(p).number).toBe(2);
    expect(versionNavigation(p)).toEqual({ undo: [p.versions[0].id], redo: [p.versions[2].id] });
  });

  it("records an edit after undo as a new version that knows where it came from", () => {
    const p = newProject(crypto.randomUUID(), "Branch");
    p.art.size = 20;
    recordVersion(p, "Bigger");
    stepVersion(p, "undo");
    p.art.x = 12;
    recordVersion(p, "Edited by hand");
    expect(p.versions).toHaveLength(3);
    expect(p.versions[2].parent).toBe(p.versions[0].id);
    expect(currentVersion(p).id).toBe(p.versions[2].id);
    // Authorship compares the edit with the version it came from, and leaves the abandoned one out.
    expect(authorshipSteps(p).map((s) => s.summary)).toEqual(["Changed the title position"]);
    // Undo goes back to the version the edit was made from, not the abandoned one.
    stepVersion(p, "undo");
    expect(p.art.size).toBe(p.versions[0].art.size);
    // The edit is no longer in the artwork, so nothing is credited.
    expect(authorshipSteps(p)).toEqual([]);
  });

  it("never folds a quick move into a version that redo still needs", () => {
    const p = newProject(crypto.randomUUID(), "Fold");
    const t = Date.now();
    p.art.x = 10;
    recordHandEdit(p, "Edited by hand", false, t);
    stepVersion(p, "undo");
    p.art.x = 40;
    recordHandEdit(p, "Edited by hand", true, t + 1000);
    expect(p.versions).toHaveLength(3);
    expect(p.versions[1].art.x).toBe(10);
  });

  it("makes a proposal stale once undo or redo moves the canvas", () => {
    const p = newProject(crypto.randomUUID(), "Stale");
    recordVersion(p, "Second");
    const before = historyStep(p);
    stepVersion(p, "undo");
    expect(historyStep(p)).toBe(before + 1);
    stepVersion(p, "redo");
    expect(historyStep(p)).toBe(before + 2);
  });
});

describe("version.undo and version.redo through the command service", () => {
  let record: ProjectRecord;
  beforeEach(() => {
    vi.stubEnv("INFERHUB_API_KEY", "");
    const document = newProject(crypto.randomUUID(), "Service");
    record = { id: document.id, revision: 1, owner: true, document };
    query.mockReset();
    query.mockImplementation(async (name: string, args: unknown[]) => {
      if (name === "creative_open") return { person: { name: "Ayo" }, projects: [record] };
      if (name === "creative_get") return structuredClone(record);
      if (name === "creative_save") {
        record = { id: record.id, revision: record.revision + 1, owner: true, document: structuredClone(args[3]) as ProjectRecord["document"] };
        return structuredClone(record);
      }
      throw new Error("Unexpected storage call");
    });
  });
  const edit = (patch: Record<string, unknown>) =>
    executeCreative("h", "artwork.edit", { projectId: record.id, revision: record.revision, patch });
  const step = (verb: "version.undo" | "version.redo") =>
    executeCreative("h", verb, { projectId: record.id, revision: record.revision });

  it("keeps the version count for undo and redo and grows it only for real changes", async () => {
    await edit({ size: 20 });
    await edit({ size: 26 });
    expect(record.document.versions).toHaveLength(3);
    expect((await step("version.undo")).ok).toBe(true);
    expect((await step("version.undo")).ok).toBe(true);
    expect((await step("version.redo")).ok).toBe(true);
    expect(record.document.versions).toHaveLength(3);
    expect(record.document.art.size).toBe(20);
    // Every step is still in the project history and saved with a new revision.
    expect(record.document.history.map((h) => h.summary).slice(-3)).toEqual([
      "Undid an artwork change",
      "Undid an artwork change",
      "Redid an artwork change",
    ]);
    await edit({ size: 30 });
    expect(record.document.versions).toHaveLength(4);
    expect(versionNavigation(record.document).redo).toEqual([]);
  });

  it("still refuses a stale revision and an empty step", async () => {
    await edit({ size: 20 });
    expect(await executeCreative("h", "version.undo", { projectId: record.id, revision: record.revision - 1 })).toMatchObject({ ok: false, code: "CONFLICT" });
    expect((await step("version.redo")).ok).toBe(false);
    expect((await step("version.undo")).ok).toBe(true);
    expect((await step("version.undo")).ok).toBe(false);
  });

  it("refuses a proposal made before an undo", async () => {
    await edit({ size: 20 });
    const proposal: Suggestion = {
      id: crypto.randomUUID(),
      intent: "warmer",
      rationale: "r",
      cites: [],
      patch: { color: "#F1C3A6" },
      baseVersion: historyStep(record.document),
      status: "proposed",
      provenance: "test",
    };
    record.document.proposals.push(proposal);
    await step("version.undo");
    expect(await executeCreative("h", "proposal.accept", { projectId: record.id, proposalId: proposal.id })).toMatchObject({ ok: false, code: "PROPOSAL_STALE" });
    // One made after the undo applies, as a new version.
    const fresh = { ...proposal, id: crypto.randomUUID(), baseVersion: historyStep(record.document) };
    record.document.proposals.push(fresh);
    expect((await executeCreative("h", "proposal.accept", { projectId: record.id, proposalId: fresh.id })).ok).toBe(true);
    expect(record.document.versions).toHaveLength(3);
    expect(record.document.art.color).toBe("#F1C3A6");
  });
});
