/**
 * Minimal Octo REST client. Server-only: the API key lives in this runtime's
 * environment and is never imported by, sent to, or returned from the browser
 * bundle. Nothing here logs the key, and there is no fallback database.
 *
 * Verified request contract (the only shape this workspace accepts):
 *   POST {OCTO_BASE_URL}/api/workspaces/{WORKSPACE_ID}/query
 *   headers:  authorization: Bearer <OCTO_API_KEY>, content-type: application/json
 *   body:     { "sql": "<single statement>", "params": [ ... ] }
 *   SQL uses positional bindings: $1, $2, ... — never named ones.
 *   response: { "columns": [...], "rows": [ {...} ], "rowCount": n, "truncated": bool }
 *
 * The workspace id is a fixed constant, not a caller-supplied value, and every
 * statement is guarded to a single SELECT of a kresilo_demo command. The
 * credential is a workspace credential: it is NOT limited to one SQL schema by
 * any provider setting, so that scoping is enforced here, in server code.
 */

const DEFAULT_BASE_URL = "https://octodb.design-bakery.com";
export const WORKSPACE_ID = "4a3b41e7-2e43-4485-9167-29426d53ccba";
export const DEMO_SCHEMA = "kresilo_demo";
const REQUEST_TIMEOUT_MS = 8_000;

export type OctoFailureCode =
  | "STORAGE_SETUP_REQUIRED"
  | "STORAGE_POLICY"
  | "STORAGE_ERROR"
  | "TIMEOUT"
  | "NETWORK";

export interface OctoQueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated: boolean;
}

export type OctoReply =
  | { ok: true; result: OctoQueryResult }
  | { ok: false; code: OctoFailureCode; message: string };

/** Injectable so contract tests can stub transport without touching the network. */
export type QueryFn = (sql: string, params?: readonly unknown[]) => Promise<OctoReply>;

interface RawOctoResponse {
  columns?: unknown;
  rows?: unknown;
  rowCount?: unknown;
  truncated?: unknown;
  error?: unknown;
  message?: unknown;
}

export function readCredentials(): { baseUrl: string; key: string } | null {
  const key = (process.env.OCTO_API_KEY ?? "").trim();
  if (!key) return null;
  const baseUrl = (process.env.OCTO_BASE_URL ?? "").trim() || DEFAULT_BASE_URL;
  return { baseUrl: baseUrl.replace(/\/+$/, ""), key };
}

/** True only when this runtime holds its own storage credential. */
export function storageConfigured(): boolean {
  return readCredentials() !== null;
}

/** Removes the key and trims text before it travels anywhere. */
export function redactFor(text: string): string {
  return redact(text);
}

function redact(text: string): string {
  const key = (process.env.OCTO_API_KEY ?? "").trim();
  const withoutKey = key ? text.split(key).join("[redacted]") : text;
  // Never echo SQL, file paths or credentials back towards a browser.
  return withoutKey.replace(/\s+/g, " ").slice(0, 200);
}

export class StoragePolicyError extends Error {}

/**
 * Guards the only statements this server is allowed to run: one SELECT of a
 * kresilo_demo function, with positional bindings matching the params array.
 * Throws StoragePolicyError rather than sending anything unsafe.
 */
export function assertDemoStatement(sql: string, params: readonly unknown[]): string {
  const statement = String(sql ?? "").trim().replace(/;+$/, "");
  if (!statement) throw new StoragePolicyError("empty statement");
  if (/--|\/\*|\*\//.test(statement)) throw new StoragePolicyError("comments are not accepted");
  if (statement.includes(";")) throw new StoragePolicyError("only one statement may be sent");
  if (!/^SELECT\s+kresilo_demo\.[a-z_]+\(/i.test(statement)) {
    throw new StoragePolicyError("only a SELECT of a kresilo_demo function is allowed");
  }
  for (const match of statement.matchAll(/[a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*/gi)) {
    if (!match[0].toLowerCase().startsWith(`${DEMO_SCHEMA}.`)) {
      throw new StoragePolicyError("statements may not leave the kresilo_demo schema");
    }
  }
  if (/\$[a-z_]/i.test(statement)) throw new StoragePolicyError("bindings must be positional");
  const positions = Array.from(statement.matchAll(/\$(\d+)/g), (m) => Number(m[1]));
  if (new Set(positions).size !== positions.length) {
    throw new StoragePolicyError("each positional binding must be used exactly once");
  }
  const highest = positions.reduce((max, p) => Math.max(max, p), 0);
  if (highest !== positions.length || positions.length !== params.length) {
    throw new StoragePolicyError("params must bind every $n in order");
  }
  return statement;
}

/** Runs one guarded, parameterised command. Never throws for a storage failure. */
export async function runQuery(sql: string, params: readonly unknown[] = []): Promise<OctoReply> {
  let statement: string;
  try {
    statement = assertDemoStatement(sql, params);
  } catch (err) {
    const message = err instanceof StoragePolicyError ? err.message : "statement rejected";
    return { ok: false, code: "STORAGE_POLICY", message };
  }

  const creds = readCredentials();
  if (!creds) {
    return { ok: false, code: "STORAGE_SETUP_REQUIRED", message: "Storage is not connected to this runtime." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${creds.baseUrl}/api/workspaces/${WORKSPACE_ID}/query`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${creds.key}`,
      },
      body: JSON.stringify({ sql: statement, params: params.slice() }),
      signal: controller.signal,
    });

    const text = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        code: "STORAGE_ERROR",
        message: redact(text || res.statusText || `storage answered ${res.status}`),
      };
    }

    let json: RawOctoResponse | null = null;
    try {
      json = JSON.parse(text) as RawOctoResponse;
    } catch {
      return { ok: false, code: "STORAGE_ERROR", message: "unreadable storage response" };
    }
    if (!json) return { ok: false, code: "STORAGE_ERROR", message: "unreadable storage response" };
    if (json.error) {
      const message =
        typeof json.error === "string" ? json.error : String((json.error as { message?: unknown })?.message ?? "");
      return { ok: false, code: "STORAGE_ERROR", message: redact(message || "storage rejected the statement") };
    }

    const rows = Array.isArray(json.rows) ? json.rows.filter((r): r is Record<string, unknown> => !!r && typeof r === "object") : [];
    return {
      ok: true,
      result: {
        columns: Array.isArray(json.columns) ? json.columns.map(String) : [],
        rows,
        rowCount: typeof json.rowCount === "number" ? json.rowCount : rows.length,
        truncated: json.truncated === true,
      },
    };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      code: aborted ? "TIMEOUT" : "NETWORK",
      message: redact(err instanceof Error ? err.message : "storage request failed"),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The command functions return one jsonb value; parse it defensively.
 * Narrowed with `in` rather than `.ok`: this project compiles without
 * strictNullChecks, where a boolean discriminant check does not filter a union.
 */
export function jsonFromReply(reply: OctoReply, column = "result"): { ok: true; value: unknown } | { ok: false; code: OctoFailureCode; message: string } {
  if ("code" in reply) return reply;
  if (reply.result.rowCount !== 1 || reply.result.rows.length !== 1) {
    return { ok: false, code: "STORAGE_ERROR", message: "storage returned an unexpected row count" };
  }
  const raw = reply.result.rows[0]?.[column];
  if (raw === undefined || raw === null) {
    return { ok: false, code: "STORAGE_ERROR", message: "storage returned no result value" };
  }
  if (typeof raw === "string") {
    try {
      return { ok: true, value: JSON.parse(raw) as unknown };
    } catch {
      return { ok: false, code: "STORAGE_ERROR", message: "storage returned unreadable json" };
    }
  }
  return { ok: true, value: raw };
}
