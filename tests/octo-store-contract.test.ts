/**
 * OctoStore ↔ SQL envelope contract.
 *
 * Every reply here is built in the literal shape the applied migration returns
 * (see db/migrations/001_kresilo_demo.sql). The adapter must extract both
 * wrapper levels, must propagate inner failure codes, must serialise jsonb
 * bindings deliberately, and must refuse a snapshot without a real project id
 * and poster. Transport is stubbed: this proves parsing, not live auth.
 */
import { describe, expect, it } from "vitest";
import { OctoStore, mapSnapshot } from "../server/store/octoStore";
import type { OctoReply, QueryFn } from "../server/utils/octoClient";
import { PROJECT_ID, failingEnvelope, mutationEnvelope, okReply, projectEnvelope } from "./fixtures";
import { SEED_POSTER } from "../src/domain/poster";

const HASH = "b".repeat(64);

interface Recorded {
  sql: string;
  params: readonly unknown[];
}

function storeFor(replyFor: (call: Recorded) => OctoReply) {
  const calls: Recorded[] = [];
  const query: QueryFn = async (sql, params = []) => {
    const call = { sql, params };
    calls.push(call);
    return replyFor(call);
  };
  return { store: new OctoStore(query), calls };
}

const alwaysOk = (value: unknown) => () => okReply(value);

describe("ensure_guest", () => {
  it("unwraps data.snapshot, the second envelope, and maps a real project", async () => {
    const { store, calls } = storeFor(
      alwaysOk(mutationEnvelope({ alreadyExisted: true })),
    );

    const result = await store.ensureGuest(HASH, "2026-10-19T00:00:00.000Z");

    expect(calls[0].sql).toBe(
      "SELECT kresilo_demo.ensure_guest($1::text, $2::timestamptz, $3::jsonb) AS result",
    );
    expect(calls[0].params[0]).toBe(HASH);
    expect(calls[0].params[1]).toBe("2026-10-19T00:00:00.000Z");
    expect(typeof calls[0].params[2]).toBe("string");
    const seed = JSON.parse(String(calls[0].params[2])) as { title: string; poster: unknown; references: unknown[] };
    expect(seed.title).toBe("Salt Flats Identity");
    expect(seed.references.length).toBeGreaterThan(0);

    if (!result.ok) throw new Error(JSON.stringify(result));
    expect(result.data.project.id).toBe(PROJECT_ID);
    expect(result.data.project.poster).toEqual(SEED_POSTER);
    expect(result.data.references.length).toBe(5);
  });

  it("propagates an inner snapshot failure instead of masking it", async () => {
    const { store } = storeFor(alwaysOk({ ok: true, data: { alreadyExisted: true, snapshot: { ok: false, code: "SESSION_INVALID" } } }));
    const result = await store.ensureGuest(HASH, "2026-10-19T00:00:00.000Z");
    expect(result.ok).toBe(false);
    if (!("code" in result)) return;
    expect(result.code).toBe("SESSION_INVALID");
  });
});

describe("reference tiles survive the SQL shape", () => {
  it("reconstructs trusted bundled artwork from known keys and nothing else", async () => {
    const { store } = storeFor(alwaysOk(mutationEnvelope({ alreadyExisted: false })));
    const result = await store.ensureGuest(HASH, "2026-10-19T00:00:00.000Z");
    if (!result.ok) throw new Error(JSON.stringify(result));

    const byId = new Map(result.data.references.map((r) => [r.id, r]));
    expect(byId.get("ref-horizon")?.artwork).toBe("horizon");
    expect(byId.get("ref-patchwork")?.artwork).toBe("patchwork");
    expect(byId.get("ref-ground")?.artwork).toBe("cracked-ground");
    expect(byId.get("ref-contours")?.artwork).toBe("contours");
    expect(byId.get("ref-note")?.artwork).toBe("note");
    expect(byId.get("ref-horizon")?.reason).toBe("one figure gives scale");
  });
});

describe("reads", () => {
  it("sessionLive reads the plain boolean the helper returns", async () => {
    const { store } = storeFor(alwaysOk(true));
    const live = await store.sessionLive(HASH);
    expect(live.ok).toBe(true);
    if (!live.ok) return;
    expect(live.data).toBe(true);
  });

  it("an expired session is reported, not renewed", async () => {
    const { store } = storeFor(alwaysOk(false));
    const live = await store.sessionLive(HASH);
    if (!live.ok) throw new Error(JSON.stringify(live));
    expect(live.data).toBe(false);
  });
});

describe("failure and shape safety", () => {
  it("maps a transport failure to a safe storage code", async () => {
    const store = new OctoStore(async () => ({ ok: false, code: "STORAGE_SETUP_REQUIRED", message: "no key" }));
    const result = await store.ensureGuest(HASH, "2026-10-19T00:00:00.000Z");
    expect(result.ok).toBe(false);
    if (!("code" in result)) return;
    expect(result.code).toBe("STORAGE_SETUP_REQUIRED");
    expect(result.message).toBeUndefined();
  });

  it("refuses a snapshot without a real project id or poster", () => {
    const bad = projectEnvelope();
    bad.data.id = "preview-salt-flats";
    const asBadId = mapSnapshot(bad.data);
    expect(asBadId.ok).toBe(false);

    const noPoster = projectEnvelope();
    noPoster.data.poster = null;
    expect(mapSnapshot(noPoster.data).ok).toBe(false);
  });

  it("an unknown failure code from SQL becomes STORAGE_ERROR", async () => {
    const { store } = storeFor(alwaysOk({ ok: false, code: "SOMETHING_NEW" }));
    const result = await store.ensureGuest(HASH, "2026-10-19T00:00:00.000Z");
    expect(result.ok).toBe(false);
    if (!("code" in result)) return;
    expect(result.code).toBe("STORAGE_ERROR");
  });

  it("a failing storage envelope is never treated as success", async () => {
    const { store } = storeFor(alwaysOk(failingEnvelope("FORBIDDEN")));
    const result = await store.ensureGuest(HASH, "2026-10-19T00:00:00.000Z");
    expect(result.ok).toBe(false);
    if (!("code" in result)) return;
    expect(result.code).toBe("FORBIDDEN");
  });
});

describe("the older project write path stays closed", () => {
  it("OctoStore has no proposal, decision, version or reference write methods", () => {
    const store = new OctoStore(async () => okReply(true)) as unknown as Record<string, unknown>;
    for (const name of [
      "addReference",
      "createProposal",
      "editProposal",
      "approveProposal",
      "declineProposal",
      "addDecision",
      "saveVersion",
      "setPreviewSelection",
      "loadSnapshot",
      "listHistory",
    ]) {
      expect(store[name], name).toBeUndefined();
    }
  });
});
