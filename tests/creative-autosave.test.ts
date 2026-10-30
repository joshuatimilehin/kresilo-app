import { beforeEach, describe, expect, it, vi } from "vitest";
import { GROUP_WINDOW_MS, commands, newProject, recordHandEdit, type ProjectRecord } from "../src/creative/contracts";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

const fresh = () => newProject(crypto.randomUUID(), "A study", "Study");

describe("grouping a burst of moves into one history step", () => {
  it("folds a quiet edit into the previous hand edit made moments ago", () => {
    const p = fresh();
    const t = Date.now();
    recordHandEdit(p, "Edited by hand", false, t);
    expect(p.versions).toHaveLength(2);
    p.art.x = 20;
    recordHandEdit(p, "Edited by hand", true, t + 3000);
    expect(p.versions).toHaveLength(2);
    expect(p.versions[1].art.x).toBe(20);
    p.art.x = 30;
    recordHandEdit(p, "Edited by hand", true, t + 6000);
    expect(p.versions).toHaveLength(2);
    expect(p.versions[1].art.x).toBe(30);
  });

  it("starts a new step after a pause, after another kind of step, or when not grouped", () => {
    const p = fresh();
    const t = Date.now();
    recordHandEdit(p, "Edited by hand", false, t);
    recordHandEdit(p, "Edited by hand", true, t + GROUP_WINDOW_MS + 1);
    expect(p.versions).toHaveLength(3);
    recordHandEdit(p, "Adjusted motion", false, t + GROUP_WINDOW_MS + 2);
    recordHandEdit(p, "Edited by hand", true, t + GROUP_WINDOW_MS + 3);
    expect(p.versions).toHaveLength(5);
    recordHandEdit(p, "Edited by hand", false, t + GROUP_WINDOW_MS + 4);
    expect(p.versions).toHaveLength(6);
  });

  it("never folds into the starting version", () => {
    const p = fresh();
    recordHandEdit(p, "Edited by hand", true, Date.now());
    expect(p.versions).toHaveLength(2);
    expect(p.versions[0].note).toBe("Started the project");
  });

  it("keeps undo going back past the whole burst", () => {
    const p = fresh();
    const t = Date.now();
    recordHandEdit(p, "Edited by hand", true, t);
    recordHandEdit(p, "Edited by hand", true, t + 1000);
    recordHandEdit(p, "Edited by hand", true, t + 2000);
    expect(p.versions).toHaveLength(2);
    expect(p.versionNavigation?.undo).toHaveLength(1);
  });
});

describe("artwork.edit with and without grouping", () => {
  let record: ProjectRecord;
  beforeEach(() => {
    vi.stubEnv("INFERHUB_API_KEY", "");
    const document = fresh();
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

  it("accepts the group flag and nothing else extra", () => {
    const base = { projectId: crypto.randomUUID(), revision: 1, patch: { x: 5 } };
    expect(commands["artwork.edit"].safeParse({ ...base, group: true }).success).toBe(true);
    expect(commands["artwork.edit"].safeParse({ ...base, group: "yes" }).success).toBe(false);
    expect(commands["artwork.edit"].safeParse({ ...base, quiet: true }).success).toBe(false);
  });

  it("makes one version for two quiet moves but two for two deliberate saves", async () => {
    await executeCreative("h", "artwork.edit", { projectId: record.id, revision: 1, patch: { x: 10 } });
    await executeCreative("h", "artwork.edit", { projectId: record.id, revision: record.revision, patch: { x: 20 }, group: true });
    await executeCreative("h", "artwork.edit", { projectId: record.id, revision: record.revision, patch: { x: 30 }, group: true });
    expect(record.document.versions).toHaveLength(2);
    expect(record.document.art.x).toBe(30);
    expect(record.document.versions[1].art.x).toBe(30);
    await executeCreative("h", "artwork.edit", { projectId: record.id, revision: record.revision, patch: { x: 40 } });
    await executeCreative("h", "artwork.edit", { projectId: record.id, revision: record.revision, patch: { x: 45 } });
    expect(record.document.versions.length).toBe(4);
  });
});
