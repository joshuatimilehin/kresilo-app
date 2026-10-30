import { beforeEach, describe, expect, it, vi } from "vitest";
import { newProject, type ProjectRecord } from "../src/creative/contracts";
import { asReference } from "../src/creative/catalog";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { actorLabel, executeCreative } from "../server/creative/service";

let record: ProjectRecord;
beforeEach(() => {
  vi.stubEnv("INFERHUB_API_KEY", "");
  const document = newProject(crypto.randomUUID(), "A study", "Study");
  document.references.push(asReference("tidal-lines", "Keep the flowing lines")!);
  record = { id: document.id, revision: 1, owner: true, document };
  document.id = record.id;
  query.mockReset();
  query.mockImplementation(async (name: string, args: unknown[]) => {
    if (name === "creative_open") return { person: { name: "Ayo Bello", mode: "explorer" }, projects: [record] };
    if (name === "creative_get") return structuredClone(record);
    if (name === "creative_save") {
      record = { id: record.id, revision: record.revision + 1, owner: true, document: structuredClone(args[3]) as ProjectRecord["document"] };
      return structuredClone(record);
    }
    throw new Error("Unexpected storage call");
  });
});

const lastHistory = () => record.document.history.at(-1)!;

describe("who made a change", () => {
  it("records the person's name when no actor is given, exactly as before", async () => {
    await executeCreative("h", "project.rename", { projectId: record.id, revision: 1, title: "Renamed" });
    expect(lastHistory()).toMatchObject({ summary: "Renamed the project", actor: "Ayo Bello" });
  });

  it("records the connected harness instead of the person", async () => {
    await executeCreative("h", "project.rename", { projectId: record.id, revision: 1, title: "Renamed" }, "claude-code");
    expect(lastHistory().actor).toBe("claude-code");
  });

  it("signs comments with the actor and keeps the person's name otherwise", async () => {
    await executeCreative("h", "comment.add", { projectId: record.id, text: "Looks calm." }, "codex");
    await executeCreative("h", "comment.add", { projectId: record.id, text: "Thanks." });
    expect(record.document.comments.map((c) => c.author)).toEqual(["codex", "Ayo Bello"]);
    expect(record.document.history.map((h) => h.actor)).toEqual(["codex", "Ayo Bello"]);
  });

  it("names the actor on the whole proposal flow, and a proposal alone changes nothing", async () => {
    const before = structuredClone(record.document.art);
    const asked = await executeCreative("h", "proposal.request", { projectId: record.id, intent: "A warmer, quieter title" }, "mcp");
    expect(asked.ok).toBe(true);
    expect(record.document.art).toEqual(before);
    expect(lastHistory()).toMatchObject({ summary: "Proposed a new direction", actor: "mcp" });
    const proposalId = record.document.proposals[0].id;
    await executeCreative("h", "proposal.accept", { projectId: record.id, proposalId }, "mcp");
    expect(lastHistory()).toMatchObject({ summary: "Approved a proposal", actor: "mcp" });
    expect(record.document.decisions).toHaveLength(1);
  });

  it("keeps the label plain and short, and ignores anything that is not text", async () => {
    expect(actorLabel("  claude   code\u0000\n")).toBe("claude code");
    expect(actorLabel("x".repeat(80))).toHaveLength(40);
    expect(actorLabel("   ")).toBeUndefined();
    expect(actorLabel(42)).toBeUndefined();
    expect(actorLabel({ name: "x" })).toBeUndefined();
    await executeCreative("h", "project.rename", { projectId: record.id, revision: 1, title: "Renamed" }, { name: "x" });
    expect(lastHistory().actor).toBe("Ayo Bello");
  });

  it("does not let the actor reach the command's own strict input", async () => {
    const result = await executeCreative("h", "project.rename", { projectId: record.id, revision: 1, title: "T", actor: "x" }, "mcp");
    expect(result).toMatchObject({ ok: false, code: "INVALID_INPUT" });
  });
});
