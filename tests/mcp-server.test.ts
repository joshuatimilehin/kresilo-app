/**
 * Whole-chain test: a real MCP client talks to the real MCP server over an
 * in-memory transport; the server uses the real HTTP client, whose fetch is
 * answered by the real command service on top of an in-memory stand-in for
 * storage. Only the network and the database are replaced.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { ProjectRecord } from "../src/creative/contracts";

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";
import { KresiloClient } from "../server/mcp/client";
import { loadConfig } from "../server/mcp/config";
import { createKresiloServer, INSTRUCTIONS } from "../server/mcp/server";

let projects: Map<string, ProjectRecord>;
let seenActors: unknown[];
let sessions: Set<string>;

/** What the /api/creative route does, minus Nitro: session from the cookie, then the service. */
async function app(_url: string, init: RequestInit): Promise<Response> {
  const headers = init.headers as Record<string, string>;
  const body = JSON.parse(String(init.body));
  seenActors.push(body.actor);
  const cookie = /kresilo_guest=([^;]+)/.exec(headers.cookie ?? "")?.[1];
  const out = new Headers({ "content-type": "application/json" });
  let hash = cookie && sessions.has(cookie) ? cookie : undefined;
  if (!hash) {
    if (body.verb !== "workspace.get")
      return new Response(JSON.stringify({ ok: false, code: "SESSION_INVALID", message: "Your session ended." }), { status: 503, headers: out });
    hash = "g".repeat(43);
    sessions.add(hash);
    out.append("set-cookie", `kresilo_guest=${hash}; Path=/; HttpOnly; SameSite=Lax`);
  }
  const result = await executeCreative(hash, body.verb, body.input, body.actor);
  return new Response(JSON.stringify(result), { status: 200, headers: out });
}

beforeEach(() => {
  vi.stubEnv("INFERHUB_API_KEY", "");
  projects = new Map();
  seenActors = [];
  sessions = new Set();
  query.mockReset();
  query.mockImplementation(async (name: string, args: unknown[]) => {
    if (name === "creative_open")
      return { person: { id: "p", name: "Ayo Bello", account: false, taste: [], following: [], mode: "explorer" }, projects: [...projects.values()] };
    if (name === "creative_get") {
      const found = projects.get(String(args[1]));
      if (!found) throw new Error("FORBIDDEN");
      return structuredClone(found);
    }
    if (name === "creative_save") {
      const current = projects.get(String(args[1]));
      if ((current?.revision ?? 0) !== args[2]) throw new Error("CONFLICT");
      const next = { id: String(args[1]), revision: Number(args[2]) + 1, owner: true, document: structuredClone(args[3]) } as ProjectRecord;
      projects.set(next.id, next);
      return structuredClone(next);
    }
    if (name === "creative_invite") return null;
    throw new Error("Unexpected storage call");
  });
});
afterEach(() => vi.unstubAllEnvs());

async function connect(env: Record<string, string> = {}) {
  const config = loadConfig({ KRESILO_URL: "http://app.test", KRESILO_ACTOR: "claude-code", ...env });
  const server = createKresiloServer(new KresiloClient(config, app as unknown as typeof fetch));
  const client = new Client({ name: "test-harness", version: "1.0.0" });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const result = await client.callTool({ name, arguments: args });
    const text = (result.content as { type: string; text: string }[])[0].text;
    return { isError: Boolean(result.isError), json: JSON.parse(text) };
  };
  return { client, server, call };
}

describe("MCP over an in-memory transport", () => {
  it("initialises with instructions and lists typed tools", async () => {
    const { client } = await connect();
    expect(client.getServerVersion()).toMatchObject({ name: "kresilo" });
    expect(client.getInstructions()).toBe(INSTRUCTIONS);
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);
    expect(names).toEqual(expect.arrayContaining(["list_projects", "create_project", "request_proposal", "edit_layer", "undo", "comment"]));
    const create = tools.find((t) => t.name === "create_project")!;
    expect(create.inputSchema).toMatchObject({ type: "object", required: ["brief"], additionalProperties: false });
    expect(tools.find((t) => t.name === "get_project")!.annotations).toMatchObject({ readOnlyHint: true });
  });

  it("answers a bad argument with a readable error, not a protocol failure", async () => {
    const { call } = await connect();
    const bad = await call("get_project", { projectId: "nope" });
    expect(bad.isError).toBe(true);
    expect(bad.json.code).toBe("INVALID_INPUT");
    expect(seenActors).toHaveLength(0);
  });

  it("runs reference, reason, proposal, approval and edits, all signed with the actor", async () => {
    const { call } = await connect();

    const listed = await call("list_projects");
    expect(listed.json).toMatchObject({ ok: true, projects: [] });
    expect(listed.json.notes[0]).toContain("new guest workspace");

    const created = await call("create_project", { brief: "A quiet evening poster" });
    const projectId = created.json.project.id as string;
    expect(created.json.revision).toBe(1);

    const referenced = await call("add_reference", { projectId, workId: "tidal-lines", reason: "Keep the flowing lines" });
    expect(referenced.json.revision).toBe(2);

    const before = (await call("get_project", { projectId })).json.project.art;
    const proposed = await call("request_proposal", { projectId, intent: "A warmer, quieter title" });
    expect(proposed.json.revision).toBe(3);
    const proposal = proposed.json.proposal;
    expect(proposal.status).toBe("proposed");
    expect(proposal.rationale).toContain("Tidal lines");
    // Nothing changed on the artwork until it is accepted.
    expect((await call("get_project", { projectId })).json.project.art).toEqual(before);

    const accepted = await call("accept_proposal", { projectId, proposalId: proposal.id });
    expect(accepted.json.project.art).not.toEqual(before);
    expect(accepted.json.project.decisions).toBe(1);

    // Undo needs no revision; the server finds the latest.
    const undone = await call("undo", { projectId });
    expect(undone.json.project.art).toEqual(before);
    const redone = await call("redo", { projectId });
    expect(redone.json.project.art).toEqual(accepted.json.project.art);

    const placed = await call("edit_artwork", {
      projectId,
      patch: { layers: [{ id: crypto.randomUUID(), name: "Wave", asset: "tidal-lines", x: 10, y: 10, width: 40, height: 40, opacity: 1, rotation: 0, visible: true, filter: "none" }] },
    });
    expect(placed.json.ok).toBe(true);
    const moved = await call("edit_layer", { projectId, layer: "wave", changes: { opacity: 0.5, x: 30 } });
    expect(moved.json.layer).toMatchObject({ name: "Wave", opacity: 0.5, x: 30, width: 40 });

    await call("comment", { projectId, text: "The lines carry the light." });
    const declined = await call("request_proposal", { projectId, intent: "Something bolder" });
    const closed = await call("decline_proposal", { projectId, proposalId: declined.json.proposal.id });
    expect(closed.json.project.proposalsWaiting).toEqual([]);

    const final = (await call("get_project", { projectId })).json.project;
    expect(final.comments).toEqual([expect.objectContaining({ author: "claude-code", text: "The lines carry the light." })]);
    const stored = projects.get(projectId)!.document;
    // Every entry the harness made names the harness, never the person.
    expect(stored.history.length).toBeGreaterThan(8);
    expect(new Set(stored.history.map((h) => h.actor))).toEqual(new Set(["claude-code"]));
    expect(new Set(seenActors)).toEqual(new Set(["claude-code"]));
  });

  it("hands back an invite link a person can open in the browser", async () => {
    const { call } = await connect();
    await call("list_projects");
    const created = await call("create_project", { brief: "Shared" });
    const invited = await call("invite_project", { projectId: created.json.project.id });
    expect(invited.json.url).toMatch(/^http:\/\/app\.test\/join\/[A-Za-z0-9_-]{43}$/);
  });
});
