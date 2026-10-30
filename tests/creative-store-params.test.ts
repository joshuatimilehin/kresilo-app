import { describe, expect, it, vi } from "vitest";

const calls: { sql: string; params: readonly unknown[] }[] = [];
vi.mock("../server/utils/octoClient", () => ({
  runQuery: async (sql: string, params: readonly unknown[] = []) => {
    calls.push({ sql, params });
    return { ok: true, result: { columns: ["result"], rows: [{ result: { ok: true, data: { stored: 1, recording: true } } }], rowCount: 1, truncated: false } };
  },
  jsonFromReply: (reply: { ok: boolean; result: { rows: { result: unknown }[] } }) => ({ value: reply.result.rows[0].result }),
}));

describe("creative store parameters", () => {
  it("sends lists as JSON text, since the workspace reads a bare array as a Postgres array", async () => {
    const { creativeQuery } = await import("../server/creative/store");
    const events = [{ kind: "page.view", at: 1, data: { path: "/" } }];
    const out = await creativeQuery<{ stored: number }>("creative_event_log", ["hash", events]);
    expect(out.stored).toBe(1);
    expect(calls[0].sql).toBe("SELECT kresilo_demo.creative_event_log($1,$2) AS result");
    expect(calls[0].params).toEqual(["hash", JSON.stringify(events)]);
  });

  it("leaves text, numbers, null and objects as they are", async () => {
    const { creativeQuery } = await import("../server/creative/store");
    calls.length = 0;
    const input = { name: "Ayo" };
    await creativeQuery("creative_profile", ["hash", input]);
    await creativeQuery("creative_events_list", ["hash", null, 50]);
    expect(calls[0].params).toEqual(["hash", input]);
    expect(calls[1].params).toEqual(["hash", null, 50]);
  });
});
