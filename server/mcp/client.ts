/**
 * The MCP process's only way to reach Kresilo: the running app's /api/creative
 * route, the same door the screen uses. Nothing here touches storage, so there
 * is exactly one write path and one place that checks sessions and rules.
 *
 * The session is a cookie sent as a header. It is never logged, never put in a
 * tool result, and never written anywhere.
 */
import { creativeFailure, type CreativeReply } from "../../src/creative/contracts";
import type { McpConfig } from "./config";

/** What the tools need from the app. Tests replace this with an in-memory fake. */
export interface CommandClient {
  readonly baseUrl: string;
  command(verb: string, input?: unknown): Promise<CreativeReply>;
  /** Returns, and forgets, plain-language notes about the session since the last call. */
  takeNotes(): string[];
}

const failure = (code: string, message: string): CreativeReply => creativeFailure(code, message);

export class KresiloClient implements CommandClient {
  private cookie: string;
  private notes: string[] = [];
  readonly baseUrl: string;

  constructor(
    private readonly config: McpConfig,
    private readonly doFetch: typeof fetch = fetch,
  ) {
    this.cookie = config.session;
    this.baseUrl = config.baseUrl;
  }

  takeNotes(): string[] {
    const notes = this.notes;
    this.notes = [];
    return notes;
  }

  async command(verb: string, input: unknown = {}): Promise<CreativeReply> {
    // Only workspace.get may open a guest workspace, so open one first when no
    // session was configured and the harness did not start with list_projects.
    if (!this.cookie && verb !== "workspace.get") {
      const opened = await this.send("workspace.get", {});
      if (!opened.ok) return opened;
    }
    return this.send(verb, input);
  }

  private async send(verb: string, input: unknown): Promise<CreativeReply> {
    let response: Response;
    try {
      response = await this.doFetch(`${this.baseUrl}/api/creative`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          "user-agent": "kresilo-mcp",
          ...(this.cookie ? { cookie: `${this.config.cookieName}=${this.cookie}` } : {}),
        },
        // `actor` rides beside the command, never inside its strict input.
        body: JSON.stringify({ verb, input, actor: this.config.actor }),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "TimeoutError";
      return failure(
        timedOut ? "TIMEOUT" : "APP_UNREACHABLE",
        timedOut
          ? `Kresilo did not answer within ${Math.round(this.config.timeoutMs / 1000)} seconds. The change may still have been saved; call get_project to check.`
          : `Could not reach Kresilo at ${this.baseUrl}. Start the app (pnpm dev) or set KRESILO_URL.`,
      );
    }
    this.remember(response);
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return failure(
        "BAD_RESPONSE",
        `Kresilo answered ${response.status} without a JSON body. Check that KRESILO_URL points at the app.`,
      );
    }
    if (!body || typeof (body as { ok?: unknown }).ok !== "boolean")
      return failure("BAD_RESPONSE", `Kresilo answered ${response.status} in an unexpected shape.`);
    return body as CreativeReply;
  }

  /** Keeps a session the app hands back (a new guest, or a renewal after expiry). */
  private remember(response: Response): void {
    const headers = response.headers as Headers & { getSetCookie?: () => string[] };
    const lines = headers.getSetCookie?.() ?? [headers.get("set-cookie") ?? ""];
    for (const line of lines) {
      const match = new RegExp(`^\\s*${escapeRegExp(this.config.cookieName)}=([^;]+)`).exec(line);
      if (!match || match[1] === this.cookie) continue;
      const replaced = Boolean(this.cookie);
      this.cookie = match[1];
      this.notes.push(
        replaced
          ? "The earlier session had ended, so a new guest workspace was opened. Projects from the old session are not in it."
          : "No session was configured, so a new guest workspace was opened for this connection. Use invite_project to share a project with a person.",
      );
    }
  }
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
