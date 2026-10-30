/**
 * Octo REST transport contract.
 *
 * These tests stub `fetch`, so they prove the URL, headers, body shape,
 * positional bindings and response parsing this app sends and reads. They make
 * no claim about live authentication or about the remote service itself.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertDemoStatement,
  jsonFromReply,
  runQuery,
  StoragePolicyError,
  type OctoReply,
} from "../server/utils/octoClient";

const TEST_KEY = "octo-test-key-not-a-secret";
const QUERY_URL =
  "https://octodb.design-bakery.com/api/workspaces/4a3b41e7-2e43-4485-9167-29426d53ccba/query";

function stubFetch(payload: unknown, init: { ok?: boolean; status?: number } = {}) {
  const fetchMock = vi.fn(async () => ({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.ok === false ? "Unauthorized" : "OK",
    text: async () => (typeof payload === "string" ? payload : JSON.stringify(payload)),
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function lastBody(fetchMock: ReturnType<typeof stubFetch>) {
  const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  return { url: call[0], init: call[1], json: JSON.parse(String(call[1].body)) as { sql: string; params: unknown[] } };
}

beforeEach(() => {
  process.env.OCTO_API_KEY = TEST_KEY;
  delete process.env.OCTO_BASE_URL;
});

afterEach(() => {
  delete process.env.OCTO_API_KEY;
  delete process.env.OCTO_BASE_URL;
  vi.unstubAllGlobals();
});

describe("verified request contract", () => {
  it("POSTs { sql, params: [...] } to the fixed workspace query URL", async () => {
    const fetchMock = stubFetch({ columns: ["result"], rows: [{ result: { ok: true, data: {} } }], rowCount: 1, truncated: false });

    const reply = await runQuery("SELECT kresilo_demo.get_project($1::text, $2::uuid) AS result", [
      "a".repeat(64),
      "3f2a1b6c-9d4e-4f70-8a11-6cb0f0e2d111",
    ]);

    expect(reply.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const { url, init, json } = lastBody(fetchMock);
    expect(url).toBe(QUERY_URL);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).authorization).toBe(`Bearer ${TEST_KEY}`);
    expect((init.headers as Record<string, string>)["content-type"]).toBe("application/json");

    // body keys are exactly the supported contract — never { query, params: object }
    expect(Object.keys(json).sort()).toEqual(["params", "sql"]);
    expect(Array.isArray(json.params)).toBe(true);
    expect(json.params).toEqual(["a".repeat(64), "3f2a1b6c-9d4e-4f70-8a11-6cb0f0e2d111"]);
    expect(json.sql).toContain("$1::text");
    expect(json.sql).toContain("$2::uuid");
  });

  it("serialises jsonb bindings as strings, positionally", async () => {
    const fetchMock = stubFetch({ columns: ["result"], rows: [{ result: { ok: true, data: {} } }], rowCount: 1 });

    await runQuery(
      "SELECT kresilo_demo.add_decision($1::text, $2::uuid, $3::text, $4::text, $5::jsonb) AS result",
      ["hash", "3f2a1b6c-9d4e-4f70-8a11-6cb0f0e2d111", "Title", "Reason", JSON.stringify(["ref-horizon", "ref-note"])],
    );

    const { json } = lastBody(fetchMock);
    expect(typeof json.params[4]).toBe("string");
    expect(json.params[4]).toBe('["ref-horizon","ref-note"]');
  });

  it("honours OCTO_BASE_URL but never a caller-supplied workspace", async () => {
    process.env.OCTO_BASE_URL = "https://octo.internal.example/";
    const fetchMock = stubFetch({ rows: [{ result: { ok: true } }], rowCount: 1 });

    await runQuery("SELECT kresilo_demo.get_project($1::text, $2::uuid) AS result", ["h", "p"]);

    const { url } = lastBody(fetchMock);
    expect(url).toBe("https://octo.internal.example/api/workspaces/4a3b41e7-2e43-4485-9167-29426d53ccba/query");
  });

  it("reads { columns, rows, rowCount, truncated } and parses the jsonb value", async () => {
    stubFetch({
      columns: ["result"],
      rows: [{ result: { ok: true, data: { id: "x" } } }],
      rowCount: 1,
      truncated: false,
    });
    const reply: OctoReply = await runQuery("SELECT kresilo_demo.get_project($1::text, $2::uuid) AS result", ["h", "p"]);
    expect(reply.ok).toBe(true);
    if (!reply.ok) return;
    expect(reply.result.columns).toEqual(["result"]);
    expect(reply.result.rowCount).toBe(1);
    expect(reply.result.truncated).toBe(false);
    expect(reply.result.rows[0]).toBeTypeOf("object");

    const parsed = jsonFromReply(reply);
    expect(parsed.ok).toBe(true);
  });

  it("accepts a jsonb value that arrives as text", async () => {
    stubFetch({ rows: [{ result: '{"ok":true,"data":{"id":"x"}}' }], rowCount: 1 });
    const reply = await runQuery("SELECT kresilo_demo.get_project($1::text, $2::uuid) AS result", ["h", "p"]);
    const parsed = jsonFromReply(reply);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value).toEqual({ ok: true, data: { id: "x" } });
  });
});

describe("kresilo_demo statement guard", () => {
  const params = ["h", "p"];

  it("accepts a single kresilo_demo function SELECT", () => {
    expect(() => assertDemoStatement("SELECT kresilo_demo.get_project($1::text, $2::uuid) AS result", params)).not.toThrow();
  });

  it("refuses statements that leave the demo schema", () => {
    expect(() => assertDemoStatement("SELECT public.get_project($1::text, $2::uuid)", params)).toThrow(StoragePolicyError);
    expect(() => assertDemoStatement("SELECT kresilo_research.events($1::text)", params)).toThrow(StoragePolicyError);
    expect(() => assertDemoStatement("SELECT pg_catalog.pg_backend_pid()", [])).toThrow(StoragePolicyError);
  });

  it("refuses anything that is not one function SELECT", () => {
    expect(() => assertDemoStatement("DELETE FROM kresilo_demo.sessions", [])).toThrow(StoragePolicyError);
    expect(() => assertDemoStatement("SELECT kresilo_demo.get_project($1) ; DROP TABLE kresilo_demo.projects", ["h"])).toThrow(StoragePolicyError);
    expect(() => assertDemoStatement("SELECT kresilo_demo.get_project($1) -- tail", ["h"])).toThrow(StoragePolicyError);
  });

  it("refuses named bindings and params that do not match $n", () => {
    expect(() => assertDemoStatement("SELECT kresilo_demo.get_project($hash, $project)", params)).toThrow(StoragePolicyError);
    expect(() => assertDemoStatement("SELECT kresilo_demo.get_project($1)", params)).toThrow(StoragePolicyError);
    expect(() => assertDemoStatement("SELECT kresilo_demo.get_project($1, $3)", params)).toThrow(StoragePolicyError);
  });

  it("never sends a rejected statement", async () => {
    const fetchMock = stubFetch({ rows: [], rowCount: 0 });
    const reply = await runQuery("DELETE FROM kresilo_demo.history_events", []);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(reply.ok).toBe(false);
    if (!("code" in reply)) return;
    expect(reply.code).toBe("STORAGE_POLICY");
  });
});

describe("failure envelopes", () => {
  it("reports STORAGE_SETUP_REQUIRED without a key, and leaks nothing", async () => {
    delete process.env.OCTO_API_KEY;
    const fetchMock = stubFetch({ rows: [], rowCount: 0 });

    const reply = await runQuery("SELECT kresilo_demo.get_project($1::text, $2::uuid) AS result", ["h", "p"]);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(reply.ok).toBe(false);
    if (!("code" in reply)) return;
    expect(reply.code).toBe("STORAGE_SETUP_REQUIRED");
    expect(reply.message).not.toContain("/");
    expect(reply.message.toLowerCase()).not.toContain("select ");
    expect(reply.message).not.toContain(TEST_KEY);
  });

  it("redacts the credential out of provider error text", async () => {
    stubFetch({ error: { message: `bearer ${TEST_KEY} rejected for select kresilo_demo.get_project` } }, { ok: false, status: 401 });

    const reply = await runQuery("SELECT kresilo_demo.get_project($1::text, $2::uuid) AS result", ["h", "p"]);

    expect(reply.ok).toBe(false);
    if (!("code" in reply)) return;
    expect(reply.code).toBe("STORAGE_ERROR");
    expect(reply.message).not.toContain(TEST_KEY);
    expect(reply.message).toContain("[redacted]");
  });

  it("treats an unparseable body and an empty row set as storage errors", async () => {
    stubFetch("not json at all");
    const bad = await runQuery("SELECT kresilo_demo.get_project($1::text, $2::uuid) AS result", ["h", "p"]);
    expect(bad.ok).toBe(false);

    stubFetch({ rows: [{ other: 1 }], rowCount: 1 });
    const missing = await runQuery("SELECT kresilo_demo.get_project($1::text, $2::uuid) AS result", ["h", "p"]);
    expect(missing.ok).toBe(true);
    if (!missing.ok) return;
    expect(jsonFromReply(missing).ok).toBe(false);
  });
});
