import { describe, expect, it } from "vitest";
import {
  commands,
  newProject,
  type CreativeReply,
  type ImageLayer,
  type ProjectRecord,
} from "../src/creative/contracts";
import { asReference } from "../src/creative/catalog";
import type { CommandClient } from "../server/mcp/client";
import { toInputSchema, withOptionalRevision } from "../server/mcp/schema";
import { buildTools, callTool, type ToolResult } from "../server/mcp/tools";

type Call = { verb: string; input: Record<string, unknown> };

function fakeClient(
  handler: (verb: string, input: Record<string, unknown>, calls: Call[]) => CreativeReply,
  notes: string[] = [],
) {
  const calls: Call[] = [];
  const client: CommandClient = {
    baseUrl: "http://app.test",
    async command(verb, input) {
      const call = { verb, input: input as Record<string, unknown> };
      calls.push(call);
      return handler(verb, call.input, calls);
    },
    takeNotes: () => notes.splice(0),
  };
  return { client, calls };
}

const layer = (name: string, extra: Partial<ImageLayer> = {}): ImageLayer => ({
  id: crypto.randomUUID(),
  name,
  asset: "tidal-lines",
  x: 10,
  y: 10,
  width: 40,
  height: 40,
  opacity: 1,
  rotation: 0,
  visible: true,
  filter: "none",
  ...extra,
});

function record(revision = 3, layers: ImageLayer[] = []): ProjectRecord {
  const document = newProject(crypto.randomUUID(), "A quiet poster", "Quiet");
  document.references.push(asReference("tidal-lines", "Keep the flowing lines")!);
  if (layers.length) document.art.layers = layers;
  return { id: document.id, revision, owner: true, document };
}

const tools = buildTools();
const run = async (client: CommandClient, name: string, args: unknown) =>
  callTool(tools, name, args, { client });
const body = (result: ToolResult) => JSON.parse(result.content[0].text);

describe("schema conversion", () => {
  it("turns a command into strict JSON Schema without references", () => {
    const json = toInputSchema(commands["project.create"]);
    expect(json).toMatchObject({
      type: "object",
      required: ["brief"],
      additionalProperties: false,
    });
    expect((json.properties as Record<string, unknown>).template).toMatchObject({
      enum: ["evening-poster", "material-study", "culture-cover"],
    });
    expect(json.$schema).toBeUndefined();
    expect(JSON.stringify(toInputSchema(commands["artwork.edit"]))).not.toContain("$ref");
  });

  it("makes revision optional yet still strict and positive", () => {
    const schema = withOptionalRevision(commands["version.undo"]);
    const projectId = crypto.randomUUID();
    expect(schema.safeParse({ projectId }).success).toBe(true);
    expect(schema.safeParse({ projectId, revision: 2 }).success).toBe(true);
    expect(schema.safeParse({ projectId, revision: 0 }).success).toBe(false);
    expect(schema.safeParse({ projectId, extra: true }).success).toBe(false);
    expect(toInputSchema(schema).required).toEqual(["projectId"]);
    // The original command is untouched.
    expect(commands["version.undo"].safeParse({ projectId }).success).toBe(false);
  });
});

describe("tool list", () => {
  it("offers plain verbs for every command the harness may use", () => {
    const names = tools.map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "list_projects",
        "get_project",
        "create_project",
        "add_reference",
        "request_proposal",
        "accept_proposal",
        "decline_proposal",
        "edit_layer",
        "undo",
        "redo",
        "comment",
      ]),
    );
    expect(new Set(names).size).toBe(names.length);
    // set_ai_apply appears exactly when this build of the app has the command.
    expect(names.includes("set_ai_apply")).toBe(Object.prototype.hasOwnProperty.call(commands, "project.ai"));
  });

  it("derives inputs from the command schemas", () => {
    const keys = (name: string) =>
      Object.keys((tools.find((t) => t.name === name)!.inputSchema.properties ?? {}) as object).sort();
    expect(keys("create_project")).toEqual(Object.keys(commands["project.create"].shape).sort());
    expect(keys("add_reference")).toEqual(Object.keys(commands["reference.carry"].shape).sort());
    expect(keys("request_proposal")).toEqual(Object.keys(commands["proposal.request"].shape).sort());
    expect(keys("comment")).toEqual(Object.keys(commands["comment.add"].shape).sort());
    expect(keys("undo")).toEqual(Object.keys(commands["version.undo"].shape).sort());
  });

  it("marks reading tools read-only and gives every tool an object schema", () => {
    for (const t of tools) {
      expect(t.inputSchema.type).toBe("object");
      expect(t.description.length).toBeGreaterThan(20);
    }
    expect(tools.filter((t) => t.readOnly).map((t) => t.name).sort()).toEqual([
      "get_project",
      "list_projects",
      "list_works",
    ]);
  });
});

describe("argument validation", () => {
  it("names the bad field and sends nothing to the app", async () => {
    const { client, calls } = fakeClient(() => ({ ok: true }));
    const result = await run(client, "get_project", { projectId: "not-an-id" });
    expect(result.isError).toBe(true);
    expect(body(result)).toMatchObject({ ok: false, code: "INVALID_INPUT" });
    expect(body(result).message).toContain("projectId");
    expect(calls).toHaveLength(0);
  });

  it("reports every problem at once and rejects unknown keys", async () => {
    const { client } = fakeClient(() => ({ ok: true }));
    const result = await run(client, "comment", { projectId: "x", text: "", surprise: 1 });
    const message = body(result).message as string;
    expect(message).toContain("projectId");
    expect(message).toContain("text");
    expect(message).toMatch(/surprise|Unrecognized/);
  });

  it("checks layer edits against the layer rules", async () => {
    const { client, calls } = fakeClient(() => ({ ok: true }));
    const projectId = crypto.randomUUID();
    const tooOpaque = await run(client, "edit_layer", { projectId, layer: "a", changes: { opacity: 3 } });
    expect(body(tooOpaque).message).toContain("changes.opacity");
    const empty = await run(client, "edit_layer", { projectId, layer: "a", changes: {} });
    expect(body(empty).message).toContain("at least one");
    expect(calls).toHaveLength(0);
  });

  it("answers an unknown tool with the list of real ones", async () => {
    const { client } = fakeClient(() => ({ ok: true }));
    const result = await run(client, "publish_everything", {});
    expect(result.isError).toBe(true);
    expect(body(result)).toMatchObject({ code: "UNKNOWN_TOOL" });
    expect(body(result).message).toContain("get_project");
  });
});

describe("revisions", () => {
  it("fills in the latest revision when none is sent", async () => {
    const current = record(7);
    const { client, calls } = fakeClient((verb) =>
      verb === "project.get"
        ? { ok: true, project: current }
        : { ok: true, project: { ...current, revision: 8 } },
    );
    const result = await run(client, "undo", { projectId: current.id });
    expect(calls.map((c) => c.verb)).toEqual(["project.get", "version.undo"]);
    expect(calls[1].input).toEqual({ projectId: current.id, revision: 7 });
    expect(body(result)).toMatchObject({ ok: true, revision: 8 });
  });

  it("sends an explicit revision as given, with no extra read", async () => {
    const current = record(4);
    const { client, calls } = fakeClient(() => ({ ok: true, project: current }));
    await run(client, "redo", { projectId: current.id, revision: 4 });
    expect(calls.map((c) => c.verb)).toEqual(["version.redo"]);
    expect(calls[0].input.revision).toBe(4);
  });

  it("passes a stale explicit revision back with a way forward", async () => {
    const { client } = fakeClient(() => ({ ok: false, code: "CONFLICT", message: "changed" }));
    const result = await run(client, "undo", { projectId: crypto.randomUUID(), revision: 1 });
    expect(result.isError).toBe(true);
    expect(body(result)).toMatchObject({ code: "CONFLICT" });
    expect(body(result).hint).toContain("get_project");
  });

  it("re-reads once when someone saved between its read and its write", async () => {
    const current = record(2);
    let writes = 0;
    const { client, calls } = fakeClient((verb) => {
      if (verb === "project.get") return { ok: true, project: { ...current, revision: 2 + writes } };
      writes += 1;
      return writes === 1
        ? { ok: false, code: "CONFLICT", message: "changed" }
        : { ok: true, project: { ...current, revision: 4 } };
    });
    const result = await run(client, "undo", { projectId: current.id });
    expect(body(result)).toMatchObject({ ok: true, revision: 4 });
    expect(calls.map((c) => c.verb)).toEqual(["project.get", "version.undo", "project.get", "version.undo"]);
  });
});

describe("results", () => {
  it("returns compact one-line JSON with the revision and without version snapshots", async () => {
    const current = record(5);
    const { client } = fakeClient(() => ({ ok: true, project: current }));
    const result = await run(client, "get_project", { projectId: current.id });
    const text = result.content[0].text;
    expect(text).not.toContain("\n");
    const parsed = body(result);
    expect(parsed).toMatchObject({ ok: true, revision: 5, project: { id: current.id, revision: 5, title: "Quiet" } });
    expect(parsed.project.references[0]).toMatchObject({ workId: "tidal-lines", reason: "Keep the flowing lines" });
    expect(parsed.project.versions).toEqual({ count: 1, latest: 1, current: 1, canUndo: false, canRedo: false });
    expect(JSON.stringify(parsed)).not.toContain('"versions":[');
  });

  it("lists projects without their documents", async () => {
    const a = record(2);
    const { client } = fakeClient(() => ({
      ok: true,
      workspace: { person: { id: "p", name: "Ayo", account: false, taste: [], following: [], mode: "explorer" }, projects: [a] },
    }));
    const parsed = body(await run(client, "list_projects", {}));
    expect(parsed.projects).toEqual([
      expect.objectContaining({ id: a.id, revision: 2, title: "Quiet", references: 1, proposalsWaiting: 0 }),
    ]);
    expect(parsed.person).toEqual({ name: "Ayo", mode: "explorer" });
  });

  it("adds session notes from the client", async () => {
    const { client } = fakeClient(() => ({ ok: true, project: record() }), ["A new guest workspace was opened."]);
    const parsed = body(await run(client, "get_project", { projectId: crypto.randomUUID() }));
    expect(parsed.notes).toEqual(["A new guest workspace was opened."]);
  });

  it("explains a failure with a hint and marks it as an error", async () => {
    const { client } = fakeClient(() => ({ ok: false, code: "REASON_REQUIRED", message: "Save a reference" }));
    const result = await run(client, "request_proposal", { projectId: crypto.randomUUID(), intent: "warmer" });
    expect(result.isError).toBe(true);
    expect(body(result).hint).toContain("add_reference");
  });

  it("shows the new proposal and says nothing changed yet", async () => {
    const current = record(2);
    const proposal = {
      id: crypto.randomUUID(),
      intent: "warmer",
      rationale: "Because of the saved light",
      cites: [current.document.references[0].id],
      patch: { color: "#F1C3A6" },
      baseVersion: 1,
      status: "proposed" as const,
      provenance: "Prototype guidance",
    };
    current.document.proposals.push(proposal);
    const { client, calls } = fakeClient(() => ({ ok: true, project: { ...current, revision: 3 } }));
    const parsed = body(
      await run(client, "request_proposal", { projectId: current.id, intent: "warmer", target: "title" }),
    );
    expect(calls[0].verb).toBe("proposal.request");
    expect(calls[0].input).toEqual({ projectId: current.id, intent: "warmer", target: "title" });
    expect(parsed.proposal).toMatchObject({ id: proposal.id, status: "proposed", patch: { color: "#F1C3A6" } });
    expect(parsed.next).toContain("Nothing has changed yet");
    expect(parsed.project.proposalsWaiting).toHaveLength(1);
  });
});

describe("edit_layer", () => {
  const setup = () => {
    const logo = layer("Logo mark");
    const wave = layer("Wave", { x: 50 });
    const current = record(6, [logo, wave]);
    const { client, calls } = fakeClient((verb, input) => {
      if (verb === "project.get") return { ok: true, project: current };
      const layers = (input.patch as { layers: ImageLayer[] }).layers;
      const saved = structuredClone(current);
      saved.revision = 7;
      saved.document.art.layers = layers;
      return { ok: true, project: saved };
    });
    return { logo, wave, current, client, calls };
  };

  it("changes only the named layer's properties through artwork.edit", async () => {
    const { logo, wave, current, client, calls } = setup();
    const parsed = body(
      await run(client, "edit_layer", { projectId: current.id, layer: "wave", changes: { opacity: 0.4, x: 60 } }),
    );
    expect(calls.map((c) => c.verb)).toEqual(["project.get", "artwork.edit"]);
    expect(calls[1].input).toMatchObject({ projectId: current.id, revision: 6 });
    const sent = (calls[1].input.patch as { layers: ImageLayer[] }).layers;
    expect(sent[0]).toEqual(logo);
    expect(sent[1]).toEqual({ ...wave, opacity: 0.4, x: 60 });
    expect(parsed).toMatchObject({ ok: true, revision: 7, layer: { id: wave.id, opacity: 0.4 } });
    // The patch the app receives is something the app's own rules accept.
    expect(commands["artwork.edit"].safeParse(calls[1].input).success).toBe(true);
  });

  it("finds a layer by id too", async () => {
    const { logo, current, client, calls } = setup();
    await run(client, "edit_layer", { projectId: current.id, layer: logo.id, changes: { visible: false } });
    expect((calls[1].input.patch as { layers: ImageLayer[] }).layers[0].visible).toBe(false);
  });

  it("lists the layers when the name matches nothing or several", async () => {
    const { current, client, calls } = setup();
    const missing = await run(client, "edit_layer", { projectId: current.id, layer: "nope", changes: { x: 1 } });
    expect(body(missing)).toMatchObject({ code: "NOT_FOUND" });
    expect(body(missing).layers).toHaveLength(2);
    expect(calls).toHaveLength(1);

    const twin = record(1, [layer("Same"), layer("same")]);
    const twins = fakeClient(() => ({ ok: true, project: twin }));
    const ambiguous = await run(twins.client, "edit_layer", { projectId: twin.id, layer: "SAME", changes: { x: 1 } });
    expect(body(ambiguous)).toMatchObject({ code: "AMBIGUOUS_LAYER" });
  });
});

describe("sharing and the catalogue", () => {
  it("returns an absolute invite link", async () => {
    const { client } = fakeClient(() => ({ ok: true, url: "/join/abc" }));
    const parsed = body(await run(client, "invite_project", { projectId: crypto.randomUUID() }));
    expect(parsed).toEqual({ ok: true, url: "http://app.test/join/abc" });
  });

  it("joins from a pasted link or a bare token", async () => {
    const token = "a".repeat(43);
    const current = record();
    const { client, calls } = fakeClient(() => ({ ok: true, project: current }));
    await run(client, "join_project", { invite: `http://localhost:8080/join/${token}?x=1` });
    await run(client, "join_project", { invite: token });
    expect(calls.map((c) => c.input)).toEqual([{ token }, { token }]);
  });

  it("filters the catalogue locally", async () => {
    const { client, calls } = fakeClient(() => ({ ok: true }));
    const all = body(await run(client, "list_works", { limit: 3 }));
    expect(all.works).toHaveLength(3);
    expect(all.total).toBeGreaterThan(3);
    const some = body(await run(client, "list_works", { query: "tidal" }));
    expect(some.works.map((w: { id: string }) => w.id)).toContain("tidal-lines");
    expect(calls).toHaveLength(0);
  });
});
