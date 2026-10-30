import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  bySession,
  cleanData,
  clientEventSchema,
  describeEvent,
  eventBatchSchema,
  eventKinds,
  reportText,
  type StoredEvent,
} from "../src/creative/events";
import { eventsForCommand, isLogged } from "../server/creative/events";
import { newProject, type ProjectRecord } from "../src/creative/contracts";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

const id = "11111111-2222-4333-8444-555555555555";
const stored = (over: Partial<StoredEvent> = {}): StoredEvent => ({
  id: 1,
  at: "2026-10-22T20:00:00.000Z",
  kind: "page.view",
  source: "client",
  actor: "person",
  projectId: null,
  sessionId: id,
  deviceId: id,
  data: {},
  ...over,
});

describe("what the screen may send", () => {
  it("accepts a closed list of kinds and short values only", () => {
    expect(clientEventSchema.safeParse({ kind: "studio.panel", data: { panel: "text" } }).success).toBe(true);
    expect(clientEventSchema.safeParse({ kind: "keylogger" }).success).toBe(false);
    expect(clientEventSchema.safeParse({ kind: "page.view", extra: 1 }).success).toBe(false);
    expect(clientEventSchema.safeParse({ kind: "page.view", data: { "bad key": "x" } }).success).toBe(false);
    expect(clientEventSchema.safeParse({ kind: "page.view", data: { path: "x".repeat(401) } }).success).toBe(false);
    expect(clientEventSchema.safeParse({ kind: "page.view", data: { nested: { a: 1 } } }).success).toBe(false);
  });

  it("needs a device and a session and caps a batch at fifty events", () => {
    const events = Array.from({ length: 50 }, () => ({ kind: "page.view" as const }));
    expect(eventBatchSchema.safeParse({ device: id, session: id, events }).success).toBe(true);
    expect(eventBatchSchema.safeParse({ device: id, session: id, events: [...events, events[0]] }).success).toBe(false);
    expect(eventBatchSchema.safeParse({ session: id, events }).success).toBe(false);
    expect(eventBatchSchema.safeParse({ device: "nope", session: id, events }).success).toBe(false);
  });

  it("cleans values: keeps twelve short ones, cuts long text, drops objects and odd keys", () => {
    const out = cleanData({ a: "x".repeat(900), b: 2, c: true, d: { x: 1 }, "e f": 1, g: NaN, ...Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`k${i}`, i])) });
    expect(out.a).toHaveLength(400);
    expect(out.b).toBe(2);
    expect(out.d).toBeUndefined();
    expect(out["e f"]).toBeUndefined();
    expect(Object.keys(out).length).toBeLessThanOrEqual(12);
  });

  it("has a description for every kind", () => {
    for (const kind of eventKinds) expect(describeEvent({ kind, data: {}, actor: "person" }).length, kind).toBeGreaterThan(3);
  });
});

describe("reading the log", () => {
  it("describes an AI request and its result in plain words, including what it touched", () => {
    expect(describeEvent({ kind: "ai.request", actor: "person", data: { intent: "add glitters everywhere", focus: "Background" } })).toBe("Asked the AI: “add glitters everywhere” (on Background)");
    const text = describeEvent({ kind: "ai.result", actor: "copilot", data: { outcome: "applied", textChanged: true, layers: 1, model: "ali/qwen", rationale: "Adds sparkle." } });
    expect(text).toContain("applied right away");
    expect(text).toContain("changes your words");
    expect(text).toContain("Adds sparkle.");
    expect(describeEvent({ kind: "ai.result", actor: "copilot", data: { outcome: "failed", code: "UNSUPPORTED_PROMPT" } })).toContain("nothing changed (UNSUPPORTED_PROMPT)");
  });

  it("groups by visit, newest visit first, each in time order, and builds a pasteable report", () => {
    const a1 = stored({ id: 1, sessionId: "a", at: "2026-10-22T20:00:00.000Z" });
    const a2 = stored({ id: 2, sessionId: "a", at: "2026-10-22T20:01:00.000Z", kind: "ai.request", data: { intent: "x" } });
    const b1 = stored({ id: 3, sessionId: "b", at: "2026-10-22T21:00:00.000Z" });
    const groups = bySession([a2, b1, a1]);
    expect(groups.map((g) => g.session)).toEqual(["b", "a"]);
    expect(groups[1].events.map((e) => e.id)).toEqual([1, 2]);
    const report = reportText([a2, a1], new Date("2026-10-22T22:00:00Z"));
    expect(report.split("\n")[0]).toContain("activity report");
    expect(report).toContain("20:00:00 [screen] Opened");
    expect(report.indexOf("20:00:00")).toBeLessThan(report.indexOf("20:01:00"));
  });
});

describe("what the server records for each command", () => {
  it("skips reads and records writes with their verb", () => {
    expect(isLogged("project.get")).toBe(false);
    expect(isLogged("workspace.get")).toBe(false);
    expect(isLogged("artwork.edit")).toBe(true);
    expect(eventsForCommand("project.get", {}, { ok: true }, undefined)).toEqual([]);
    const [e] = eventsForCommand("artwork.edit", { projectId: id, revision: 3, group: true }, { ok: true }, undefined);
    expect(e).toMatchObject({ kind: "command.ok", projectId: id, data: { verb: "artwork.edit", group: true, revision: 3 } });
  });

  it("records why a command failed, and who made it when an agent did", () => {
    const [e] = eventsForCommand("team.add", { projectId: id }, { ok: false, code: "FORBIDDEN", message: "No." }, "claude-code");
    expect(e).toMatchObject({ kind: "command.fail", actor: "mcp:claude-code", data: { verb: "team.add", code: "FORBIDDEN" } });
  });

  it("records an AI request that failed, with the prompt and the code", () => {
    const events = eventsForCommand("proposal.request", { projectId: id, intent: "apply glitter", targets: ["a", "b"] }, { ok: false, code: "UNSUPPORTED_PROMPT", message: "x" }, undefined);
    const ai = events.find((x) => x.kind === "ai.result");
    expect(ai).toMatchObject({ actor: "copilot", data: { intent: "apply glitter", outcome: "failed", code: "UNSUPPORTED_PROMPT", focus: 2 } });
  });

  it("records what an AI proposal touched", () => {
    const project = newProject(id, "A study", "Study");
    project.proposals.push({ id: crypto.randomUUID(), intent: "collapsing star", rationale: "Collapse the orbit.", cites: [], patch: { title: "Collapsing Star", layers: [{}] } as never, baseVersion: 1, status: "approved", provenance: "ali/qwen3.8 · project references" });
    const events = eventsForCommand("proposal.request", { projectId: id, intent: "collapsing star" }, { ok: true, project: { id, revision: 2, owner: true, document: project } as ProjectRecord }, undefined);
    const ai = events.find((x) => x.kind === "ai.result")!;
    expect(ai.data).toMatchObject({ outcome: "applied", textChanged: true, layers: 1, model: "ali/qwen3.8" });
  });
});

describe("logging never gets in the way", () => {
  beforeEach(() => {
    vi.stubEnv("INFERHUB_API_KEY", "");
    query.mockReset();
  });

  it("still answers when the log cannot be written", async () => {
    const document = newProject(id, "A study", "Study");
    const record: ProjectRecord = { id, revision: 1, owner: true, document };
    query.mockImplementation(async (name: string) => {
      if (name === "creative_open") return { person: { name: "Ayo" }, projects: [record] };
      if (name === "creative_get") return structuredClone(record);
      if (name === "creative_save") return { ...record, revision: 2 };
      throw new Error("table does not exist");
    });
    const r = await executeCreative("h", "project.rename", { projectId: id, revision: 1, title: "New" }, undefined, { device: id, session: id });
    expect(r.ok).toBe(true);
    expect(query.mock.calls.some((c) => c[0] === "creative_event_log")).toBe(true);
  });

  it("sends device and session with the events and records nothing for a read", async () => {
    const document = newProject(id, "A study", "Study");
    const record: ProjectRecord = { id, revision: 1, owner: true, document };
    query.mockImplementation(async (name: string) => {
      if (name === "creative_open") return { person: { name: "Ayo" }, projects: [record] };
      if (name === "creative_get") return structuredClone(record);
      if (name === "creative_save") return { ...record, revision: 2 };
      return { stored: 1 };
    });
    await executeCreative("h", "project.get", { projectId: id }, undefined, { device: id, session: id });
    expect(query.mock.calls.some((c) => c[0] === "creative_event_log")).toBe(false);
    await executeCreative("h", "project.rename", { projectId: id, revision: 1, title: "New" }, undefined, { device: id, session: "22222222-2222-4333-8444-555555555555" });
    const call = query.mock.calls.find((c) => c[0] === "creative_event_log")!;
    expect(call[1][1][0]).toMatchObject({ kind: "command.ok", source: "server", device: id, session: "22222222-2222-4333-8444-555555555555" });
  });
});
