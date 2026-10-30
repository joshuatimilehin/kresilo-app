import { describe, expect, it } from "vitest";
import { createResponseGate, reconcileWorkspace } from "../src/creative/context";
import { newProject, type ProjectRecord, type Workspace } from "../src/creative/contracts";

function record(id: string, revision: number): ProjectRecord {
  return { id, revision, owner: true, document: newProject(id, `Project revision ${revision}`) };
}
function workspace(projects: ProjectRecord[], name = "Guest"): Workspace {
  return { person: { id: "guest", name, account: false, taste: [], following: [], mode: "guided" }, projects };
}

describe("saved response ordering", () => {
  it("keeps the later saved revision when an earlier project response finishes last", () => {
    const current = workspace([record("one", 4)]);
    const result = reconcileWorkspace(current, undefined, record("one", 3));
    expect(result.projects[0]).toBe(current.projects[0]);
    expect(reconcileWorkspace(current, undefined, record("one", 5)).projects[0].revision).toBe(5);
  });

  it("keeps new projects and newer revisions when a stale full snapshot arrives", () => {
    const current = workspace([record("one", 4), record("new", 1)], "Updated name");
    const result = reconcileWorkspace(current, workspace([record("one", 2)], "Old name"), undefined, false);
    expect(result.person.name).toBe("Updated name");
    expect(result.projects.map(({ id, revision }) => [id, revision])).toEqual([["one", 4], ["new", 1]]);
  });

  it("accepts fresh metadata while preserving the newest saved project document", () => {
    const result = reconcileWorkspace(workspace([record("one", 4)]), workspace([record("one", 3)], "New name"));
    expect(result.person.name).toBe("New name");
    expect(result.projects[0].revision).toBe(4);
  });

  it("does not mix projects between different guest identities", () => {
    const current = workspace([record("private", 4)]);
    const next = { ...workspace([]), person: { ...current.person, id: "another-guest" } };
    expect(reconcileWorkspace(current, next, undefined, false)).toBe(current);
    expect(reconcileWorkspace(current, next)).toBe(next);
  });
});

describe("browser session response isolation", () => {
  it("redacts a late project response after a fresh guest replaces the account", () => {
    const gate = createResponseGate();
    gate.receive(gate.begin(1), { ok: true, workspace: workspace([record("private", 4)]) });
    const edit = gate.begin(2);
    const next = { ...workspace([]), person: { ...workspace([]).person, id: "new-guest" } };
    gate.receive(gate.begin(3), { ok: true, workspace: next });
    expect(gate.receive(edit, { ok: true, project: record("private", 5), url: "/studio/private" })).toEqual({
      ok: false, code: "SESSION_CHANGED", message: expect.any(String),
    });
  });

  it("prevents an old workspace snapshot from switching identity back", () => {
    const gate = createResponseGate();
    gate.receive(gate.begin(1), { ok: true, workspace: workspace([]) });
    const oldRefresh = gate.begin(2);
    const next = { ...workspace([]), person: { ...workspace([]).person, id: "new-guest" } };
    gate.receive(gate.begin(3), { ok: true, workspace: next });
    expect(gate.receive(oldRefresh, { ok: true, workspace: workspace([record("private", 4)]) })).toMatchObject({ ok: false, code: "SESSION_CHANGED" });
    const current = { ok: true as const, project: record("new-project", 1) };
    expect(gate.receive(gate.begin(4), current)).toBe(current);
  });

  it("does not expose old-session network or authorization failures", () => {
    const gate = createResponseGate();
    gate.receive(gate.begin(1), { ok: true, workspace: workspace([]) });
    const pending = gate.begin(2);
    const next = { ...workspace([]), person: { ...workspace([]).person, id: "new-guest" } };
    gate.receive(gate.begin(3), { ok: true, workspace: next });
    expect(gate.receive(pending, { ok: false, code: "NETWORK", message: "Old request failed" })).toMatchObject({ code: "SESSION_CHANGED" });
  });

  it("permits same-identity replies to reconcile independently by saved revision", () => {
    const gate = createResponseGate();
    gate.receive(gate.begin(1), { ok: true, workspace: workspace([]) });
    const earlier = gate.begin(2), later = gate.begin(3);
    const latest = gate.receive(later, { ok: true, project: record("one", 5) });
    const previous = gate.receive(earlier, { ok: true, project: record("one", 4) });
    expect(latest.ok && previous.ok).toBe(true);
    if (latest.ok && previous.ok)
      expect(reconcileWorkspace(workspace([latest.project]), undefined, previous.project).projects[0].revision).toBe(5);
  });
});
