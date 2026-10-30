import { describe, expect, it, vi } from "vitest";
import { KresiloClient } from "../server/mcp/client";
import { loadConfig, parseSession } from "../server/mcp/config";

const TOKEN = "t".repeat(43);

function config(extra: Record<string, string> = {}) {
  return loadConfig({ KRESILO_URL: "http://app.test:8080/", ...extra });
}

type Init = RequestInit & { headers: Record<string, string> };

function reply(body: unknown, init: { status?: number; cookies?: string[] } = {}) {
  const headers = new Headers({ "content-type": "application/json" });
  for (const cookie of init.cookies ?? []) headers.append("set-cookie", cookie);
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status: init.status ?? 200,
    headers,
  });
}

describe("configuration", () => {
  it("has working defaults and trims the address", () => {
    expect(loadConfig({})).toMatchObject({
      baseUrl: "http://localhost:8080",
      actor: "mcp",
      cookieName: "kresilo_guest",
      session: "",
    });
    expect(config().baseUrl).toBe("http://app.test:8080");
  });

  it("accepts the session as a bare token, a pair, or a pasted cookie header", () => {
    expect(parseSession(TOKEN, "kresilo_guest")).toBe(TOKEN);
    expect(parseSession(`kresilo_guest=${TOKEN}`, "kresilo_guest")).toBe(TOKEN);
    expect(parseSession(`theme=dark; kresilo_guest=${TOKEN}`, "kresilo_guest")).toBe(TOKEN);
    expect(parseSession("other=1", "kresilo_guest")).toBe("");
    expect(config({ KRESILO_SESSION: TOKEN }).session).toBe(TOKEN);
  });

  it("keeps the actor to plain, short text and falls back to mcp", () => {
    expect(config({ KRESILO_ACTOR: "  claude-code\n" }).actor).toBe("claude-code");
    expect(config({ KRESILO_ACTOR: "x".repeat(100) }).actor).toHaveLength(40);
    expect(config({ KRESILO_ACTOR: "   " }).actor).toBe("mcp");
  });

  it("rejects an address that is not http(s) and bounds the timeout", () => {
    expect(() => loadConfig({ KRESILO_URL: "file:///etc" })).toThrow(/http or https/);
    expect(() => loadConfig({ KRESILO_URL: "nonsense" })).toThrow(/http or https/);
    expect(config({ KRESILO_TIMEOUT_MS: "5" }).timeoutMs).toBe(1000);
    expect(config({ KRESILO_TIMEOUT_MS: "abc" }).timeoutMs).toBe(90000);
  });
});

describe("HTTP client", () => {
  it("posts the command with the actor beside it and the session as a cookie", async () => {
    const fetchMock = vi.fn(async () => reply({ ok: true }));
    const client = new KresiloClient(config({ KRESILO_SESSION: TOKEN, KRESILO_ACTOR: "codex" }), fetchMock);
    const input = { projectId: "p" };
    expect(await client.command("project.get", input)).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, Init];
    expect(url).toBe("http://app.test:8080/api/creative");
    expect(init.method).toBe("POST");
    expect(init.headers.cookie).toBe(`kresilo_guest=${TOKEN}`);
    expect(JSON.parse(String(init.body))).toEqual({ verb: "project.get", input, actor: "codex" });
  });

  it("uses the configured cookie name", async () => {
    const fetchMock = vi.fn(async () => reply({ ok: true }));
    const client = new KresiloClient(config({ KRESILO_SESSION: TOKEN, KRESILO_COOKIE_NAME: "other" }), fetchMock);
    await client.command("project.get", {});
    expect((fetchMock.mock.calls[0] as unknown as [string, Init])[1].headers.cookie).toBe(`other=${TOKEN}`);
  });

  it("opens a guest workspace first when no session is set, and keeps the cookie it is given", async () => {
    const fresh = "n".repeat(43);
    const fetchMock = vi.fn(async (_url: string, init: Init) => {
      const verb = JSON.parse(String(init.body)).verb;
      return verb === "workspace.get"
        ? reply({ ok: true, workspace: {} }, { cookies: [`kresilo_guest=${fresh}; Path=/; HttpOnly; SameSite=Lax`] })
        : reply({ ok: true });
    });
    const client = new KresiloClient(config(), fetchMock as unknown as typeof fetch);
    await client.command("project.get", { projectId: "p" });
    const calls = fetchMock.mock.calls.map((c) => JSON.parse(String(c[1].body)).verb);
    expect(calls).toEqual(["workspace.get", "project.get"]);
    expect(fetchMock.mock.calls[1][1].headers.cookie).toBe(`kresilo_guest=${fresh}`);
    const notes = client.takeNotes();
    expect(notes).toHaveLength(1);
    expect(notes[0]).toContain("new guest workspace");
    expect(notes.join(" ")).not.toContain(fresh);
    expect(client.takeNotes()).toEqual([]);
  });

  it("says so when an ended session was replaced", async () => {
    const fresh = "r".repeat(43);
    const fetchMock = vi.fn(async () =>
      reply({ ok: true, workspace: {} }, { cookies: [`kresilo_guest=${fresh}; Path=/`] }),
    );
    const client = new KresiloClient(config({ KRESILO_SESSION: TOKEN }), fetchMock);
    await client.command("workspace.get", {});
    expect(client.takeNotes()[0]).toContain("had ended");
  });

  it("returns the app's own refusal unchanged, whatever the status", async () => {
    const fetchMock = vi.fn(async () =>
      reply({ ok: false, code: "SESSION_INVALID", message: "Your session ended." }, { status: 503 }),
    );
    const client = new KresiloClient(config({ KRESILO_SESSION: TOKEN }), fetchMock);
    expect(await client.command("project.get", {})).toEqual({
      ok: false,
      code: "SESSION_INVALID",
      message: "Your session ended.",
    });
  });

  it("turns network failures, timeouts and non-JSON answers into clear failures", async () => {
    const down = new KresiloClient(config({ KRESILO_SESSION: TOKEN }), vi.fn(async () => {
      throw new TypeError("fetch failed");
    }));
    expect(await down.command("project.get", {})).toMatchObject({ ok: false, code: "APP_UNREACHABLE" });

    const slow = new KresiloClient(config({ KRESILO_SESSION: TOKEN }), vi.fn(async () => {
      throw Object.assign(new Error("timed out"), { name: "TimeoutError" });
    }));
    expect(await slow.command("project.get", {})).toMatchObject({ ok: false, code: "TIMEOUT" });

    const html = new KresiloClient(config({ KRESILO_SESSION: TOKEN }), vi.fn(async () => reply("<html>nope</html>", { status: 502 })));
    expect(await html.command("project.get", {})).toMatchObject({ ok: false, code: "BAD_RESPONSE" });

    const odd = new KresiloClient(config({ KRESILO_SESSION: TOKEN }), vi.fn(async () => reply({ hello: 1 })));
    expect(await odd.command("project.get", {})).toMatchObject({ ok: false, code: "BAD_RESPONSE" });
  });

  it("never puts the session in a failure message", async () => {
    const down = new KresiloClient(config({ KRESILO_SESSION: TOKEN }), vi.fn(async () => {
      throw new TypeError(`fetch failed for cookie ${TOKEN}`);
    }));
    expect(JSON.stringify(await down.command("project.get", {}))).not.toContain(TOKEN);
  });
});
