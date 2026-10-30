import { beforeEach, describe, expect, it, vi } from "vitest";
import { newProject, type ProjectRecord } from "../src/creative/contracts";
import { asReference } from "../src/creative/catalog";
import {
  activityFeed,
  creditedMembers,
  daysLeft,
  reviewQueue,
  teamRows,
  workSplit,
} from "../src/creative/dashboard";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

let record: ProjectRecord;
let owner = true;
beforeEach(() => {
  vi.stubEnv("INFERHUB_API_KEY", "");
  owner = true;
  const document = newProject(crypto.randomUUID(), "A study", "Study");
  document.references.push(asReference("tidal-lines", "Keep the flowing lines")!);
  record = { id: document.id, revision: 1, owner: true, document };
  query.mockReset();
  query.mockImplementation(async (name: string, args: unknown[]) => {
    if (name === "creative_open") return { person: { name: "Ayo Bello", mode: "explorer" }, projects: [record] };
    if (name === "creative_get") return structuredClone({ ...record, owner });
    if (name === "creative_save") {
      record = { id: record.id, revision: record.revision + 1, owner, document: structuredClone(args[3]) as ProjectRecord["document"] };
      return structuredClone(record);
    }
    throw new Error("Unexpected storage call");
  });
});

const add = (over: Record<string, unknown> = {}) =>
  executeCreative("h", "team.add", { projectId: record.id, name: "Mina Okafor", roles: ["Type"], access: "comment", ...over });

describe("team commands", () => {
  it("invites a person for seven days with credit pending and records it in history", async () => {
    const r = await add();
    expect(r.ok).toBe(true);
    const m = record.document.team![0];
    expect(m).toMatchObject({ name: "Mina Okafor", roles: ["Type"], access: "comment", credit: "pending", state: "invited" });
    expect(Date.parse(m.expiresAt) - Date.parse(m.invitedAt)).toBe(7 * 24 * 3600 * 1000);
    expect(record.document.history.at(-1)).toMatchObject({ summary: "Invited a person to the project", actor: "Ayo Bello" });
  });

  it("keeps the Lead role for the owner and limits roles to three", async () => {
    expect((await add({ roles: ["Lead"] })).ok).toBe(false);
    expect((await add({ roles: ["Design", "Type", "Motion", "Feedback"] })).ok).toBe(false);
    expect((await add({ roles: [] })).ok).toBe(false);
    expect(record.document.team).toBeUndefined();
  });

  it("changes access separately from the role and revokes", async () => {
    await add();
    const id = record.document.team![0].id;
    await executeCreative("h", "team.update", { projectId: record.id, memberId: id, access: "edit" });
    expect(record.document.team![0]).toMatchObject({ access: "edit", roles: ["Type"] });
    await executeCreative("h", "team.update", { projectId: record.id, memberId: id, roles: ["Design", "Motion"] });
    expect(record.document.team![0]).toMatchObject({ access: "edit", roles: ["Design", "Motion"] });
    await executeCreative("h", "team.revoke", { projectId: record.id, memberId: id });
    expect(record.document.team![0].state).toBe("revoked");
  });

  it("records a person's answer about credit, and never publishes a pending or declined name", async () => {
    await add();
    await add({ name: "Ren Ito", roles: ["Motion"] });
    const [a, b] = record.document.team!;
    expect(creditedMembers(record.document)).toEqual([]);
    await executeCreative("h", "team.credit", { projectId: record.id, memberId: a.id, credit: "confirmed" });
    await executeCreative("h", "team.credit", { projectId: record.id, memberId: b.id, credit: "declined" });
    expect(creditedMembers(record.document).map((m) => m.name)).toEqual(["Mina Okafor"]);
    await executeCreative("h", "team.revoke", { projectId: record.id, memberId: a.id });
    expect(creditedMembers(record.document)).toEqual([]);
  });

  it("lets only the owner change the team and refuses unknown people", async () => {
    owner = false;
    expect((await add()).ok).toBe(false);
    owner = true;
    await add();
    owner = false;
    const id = record.document.team![0].id;
    for (const verb of ["team.revoke", "team.update", "team.credit"] as const) {
      const r = await executeCreative("h", verb, { projectId: record.id, memberId: id, credit: "confirmed", access: "edit" });
      expect(r.ok).toBe(false);
    }
    owner = true;
    const missing = await executeCreative("h", "team.revoke", { projectId: record.id, memberId: crypto.randomUUID() });
    expect(missing).toMatchObject({ ok: false, code: "NOT_FOUND" });
  });

  it("limits the team to twelve people", async () => {
    for (let i = 0; i < 12; i++) expect((await add({ name: `Person ${i}` })).ok).toBe(true);
    expect((await add({ name: "One too many" })).ok).toBe(false);
  });
});

describe("dashboard views", () => {
  const now = Date.parse("2026-10-22T12:00:00Z");

  it("lists the owner as Lead first and shows invitation state, expiry and access", async () => {
    await add();
    await add({ name: "Ren Ito", roles: ["Motion"], access: "edit" });
    await executeCreative("h", "team.revoke", { projectId: record.id, memberId: record.document.team![1].id });
    const soon = Date.parse(record.document.team![0].invitedAt) + 2 * 24 * 3600 * 1000;
    const rows = teamRows(record.document, "Ayo Bello", soon);
    expect(rows[0]).toMatchObject({ name: "Ayo Bello", roles: ["Lead"], invitation: "owner", credit: "confirmed" });
    expect(rows[1]).toMatchObject({ invitation: "invited", accessLabel: "Can comment only", credit: "pending" });
    expect(rows[2]).toMatchObject({ invitation: "revoked", accessLabel: "Can edit" });
    const later = Date.parse(record.document.team![0].invitedAt) + 9 * 24 * 3600 * 1000;
    expect(teamRows(record.document, "Ayo Bello", later)[1].invitation).toBe("expired");
    expect(daysLeft(record.document.team![0].expiresAt, soon)).toBe(5);
    expect(daysLeft(record.document.team![0].expiresAt, later)).toBe(0);
  });

  it("names each actor and whether it was a person, a collaborator or an agent", async () => {
    await add({ name: "Mina Okafor" });
    await executeCreative("h", "comment.add", { projectId: record.id, text: "Calm." }, "claude-code");
    await executeCreative("h", "project.rename", { projectId: record.id, revision: record.revision, title: "Renamed" });
    const feed = activityFeed(record.document, "Ayo Bello");
    const byActor = Object.fromEntries(feed.map((f) => [f.actor, f.actorKind]));
    expect(byActor["claude-code"]).toBe("agent");
    expect(byActor["Ayo Bello"]).toBe("you");
    const collab = { ...record.document, history: [...record.document.history, { id: "x", summary: "Added a comment", at: "2026-10-22T12:00:00.000Z", actor: "Mina Okafor" }] };
    expect(activityFeed(collab, "Ayo Bello").find((f) => f.actor === "Mina Okafor")?.actorKind).toBe("collaborator");
    void now;
  });

  it("classifies hand work, approved AI, proposals not applied and conversation", async () => {
    await executeCreative("h", "proposal.request", { projectId: record.id, intent: "A warmer, quieter title" }, "mcp");
    const proposed = activityFeed(record.document, "Ayo Bello");
    expect(proposed[0]).toMatchObject({ kind: "ai-proposed", label: "AI proposal made, not applied" });
    await executeCreative("h", "proposal.accept", { projectId: record.id, proposalId: record.document.proposals[0].id });
    await executeCreative("h", "project.rename", { projectId: record.id, revision: record.revision, title: "Renamed" });
    const kinds = activityFeed(record.document, "Ayo Bello").map((f) => f.kind);
    expect(kinds).toContain("ai-approved");
    expect(kinds).toContain("hand");
  });

  it("queues open comments and waiting proposals; approving removes the proposal and changes nothing before", async () => {
    await executeCreative("h", "comment.add", { projectId: record.id, text: "Try less blue." });
    await executeCreative("h", "proposal.request", { projectId: record.id, intent: "A warmer, quieter title" });
    const before = structuredClone(record.document.art);
    let q = reviewQueue(record.document);
    expect(q.openComments).toHaveLength(1);
    expect(q.proposals).toHaveLength(1);
    expect(record.document.art).toEqual(before);
    await executeCreative("h", "comment.resolve", { projectId: record.id, commentId: q.openComments[0].id });
    await executeCreative("h", "proposal.reject", { projectId: record.id, proposalId: q.proposals[0].id });
    q = reviewQueue(record.document);
    expect(q.openComments).toHaveLength(0);
    expect(q.resolvedComments).toHaveLength(1);
    expect(q.proposals).toHaveLength(0);
  });

  it("counts hand and approved-AI actions per actor, labelled an estimate with its basis", async () => {
    await executeCreative("h", "project.rename", { projectId: record.id, revision: 1, title: "One" });
    await executeCreative("h", "proposal.request", { projectId: record.id, intent: "A warmer, quieter title" }, "mcp");
    await executeCreative("h", "proposal.accept", { projectId: record.id, proposalId: record.document.proposals[0].id }, "mcp");
    const split = workSplit(record.document, "Ayo Bello");
    expect(split.perActor).toContainEqual({ actor: "Ayo Bello", kind: "you", hand: 1, aiApproved: 0 });
    expect(split.perActor).toContainEqual({ actor: "mcp", kind: "agent", hand: 0, aiApproved: 1 });
    expect(split.basis).toMatch(/^An estimate\./);
    expect(split.basis).toMatch(/does not measure effort/);
  });
});

describe("published credit", () => {
  it("names only collaborators who confirmed, with their roles", async () => {
    const { publicProject } = await import("../src/creative/contracts");
    await add();
    await add({ name: "Ren Ito", roles: ["Motion", "Design"] });
    await add({ name: "Sam Cole", roles: ["Feedback"] });
    const [a, b, c] = record.document.team!;
    await executeCreative("h", "team.credit", { projectId: record.id, memberId: a.id, credit: "confirmed" });
    await executeCreative("h", "team.credit", { projectId: record.id, memberId: b.id, credit: "confirmed" });
    await executeCreative("h", "team.revoke", { projectId: record.id, memberId: b.id });
    void c;
    const out = publicProject(record.document, "d", "Ayo Bello");
    expect(out.team).toEqual([{ name: "Mina Okafor", roles: ["Type"] }]);
  });
});
