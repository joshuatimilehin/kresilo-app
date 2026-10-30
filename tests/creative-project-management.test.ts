import { beforeEach, describe, expect, it, vi } from "vitest";
import { newProject, publicProject, type ProjectRecord } from "../src/creative/contracts";
import { asReference } from "../src/creative/catalog";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";
let records: Map<string, ProjectRecord>;
let source: ProjectRecord;
let target: ProjectRecord;
beforeEach(() => {
  records = new Map();
  source = { id: crypto.randomUUID(), revision: 1, owner: true, document: newProject(crypto.randomUUID(), "Source", "Source project") };
  source.document.id = source.id;
  source.document.references.push(asReference("tidal-lines", "Keep the flowing lines"));
  target = { id: crypto.randomUUID(), revision: 1, owner: true, document: newProject(crypto.randomUUID(), "Destination", "Destination project") };
  target.document.id = target.id;
  records.set(source.id, source); records.set(target.id, target);
  query.mockReset();
  query.mockImplementation(async (name: string, args: unknown[]) => {
    if (name === "creative_open") return { person: { name: "Guest", mode: "explorer" }, projects: [...records.values()] };
    if (name === "creative_get") {
      if (args[0] !== "authorized" || !records.has(String(args[1]))) throw new Error("FORBIDDEN");
      return structuredClone(records.get(String(args[1])));
    }
    if (name === "creative_save") {
      const current = records.get(String(args[1]));
      if (current && current.revision !== args[2]) throw new Error("CONFLICT");
      const next = { id: String(args[1]), revision: Number(args[2]) + 1, owner: true, document: structuredClone(args[3]) } as ProjectRecord;
      records.set(next.id, next); return structuredClone(next);
    }
    throw new Error("Unexpected storage call");
  });
});
describe("project identity and reference correction", () => {
  it("keeps an explicitly named reference project", async () => {
    const result = await executeCreative("authorized", "project.create", { title: "A specific name", brief: "A study", sourceWorkId: "tidal-lines", reason: "Its rhythm" });
    expect(result.ok && result.project.document.title).toBe("A specific name");
  });
  it("renames without changing artwork or immutable versions and rejects stale writes", async () => {
    const original = structuredClone(source.document);
    const result = await executeCreative("authorized", "project.rename", { projectId: source.id, revision: 1, title: "Renamed" });
    expect(result.ok && result.project.document.title).toBe("Renamed");
    expect(records.get(source.id).document.art).toEqual(original.art);
    expect(records.get(source.id).document.versions).toEqual(original.versions);
    expect(await executeCreative("authorized", "project.rename", { projectId: source.id, revision: 1, title: "Stale" })).toMatchObject({ ok: false, code: "CONFLICT" });
  });
  it("copies source and reason once with no change to either canvas", async () => {
    const original = structuredClone(target.document.art);
    const input = { projectId: target.id, revision: 1, sourceProjectId: source.id, referenceId: source.document.references[0].id };
    expect((await executeCreative("authorized", "reference.copy", input)).ok).toBe(true);
    const saved = records.get(target.id);
    expect(saved.document.references[0]).toMatchObject({ reason: "Keep the flowing lines", workId: "tidal-lines" });
    expect(saved.document.references[0].id).not.toBe(input.referenceId);
    expect(saved.document.art).toEqual(original);
    expect(records.get(source.id).document.references).toHaveLength(1);
    expect(await executeCreative("authorized", "reference.copy", { ...input, revision: saved.revision })).toMatchObject({ ok: false });
  });
  it("retains source attribution on remove and can restore after a fresh read", async () => {
    const referenceId = source.document.references[0].id;
    expect((await executeCreative("authorized", "reference.remove", { projectId: source.id, revision: 1, referenceId })).ok).toBe(true);
    const removed = structuredClone(records.get(source.id));
    expect(removed.document.references).toHaveLength(0);
    expect(removed.document.referenceArchive).toHaveLength(1);
    const published = publicProject(removed.document, "Public", "Guest");
    expect(published.credits).toHaveLength(1);
    expect(JSON.stringify(published)).not.toContain("Keep the flowing lines");
    expect((await executeCreative("authorized", "reference.restore", { projectId: source.id, revision: removed.revision, referenceId })).ok).toBe(true);
    expect(records.get(source.id).document.references).toHaveLength(1);
    expect(records.get(source.id).document.referenceArchive).toHaveLength(0);
  });
  it("checks source authorization and keeps imported media project-scoped", async () => {
    expect((await executeCreative("other-guest", "reference.copy", { projectId: target.id, revision: 1, sourceProjectId: source.id, referenceId: source.document.references[0].id })).ok).toBe(false);
    source.document.references[0].mediaId = crypto.randomUUID();
    expect((await executeCreative("authorized", "reference.copy", { projectId: target.id, revision: 1, sourceProjectId: source.id, referenceId: source.document.references[0].id })).ok).toBe(false);
    expect(records.get(target.id).document.references).toHaveLength(0);
  });
  it("never exposes removed or active private imported filenames in public credits", () => {
    const privateRef = { ...source.document.references[0], id: crypto.randomUUID(), title: "Confidential draft filename.png", mediaId: crypto.randomUUID() };
    source.document.references.push(privateRef);
    source.document.referenceArchive = [privateRef];
    const json = JSON.stringify(publicProject(source.document, "Public caption", "Guest"));
    expect(json).not.toContain("Confidential");
    expect(json).not.toContain(privateRef.mediaId);
    expect(JSON.parse(json).credits).toHaveLength(1);
  });
});
