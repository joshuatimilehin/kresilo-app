/**
 * Settings for the MCP process, read from environment variables so a harness
 * config file can set them and no secret ever lives in the repository.
 *
 *   KRESILO_URL            where the running app is (default http://localhost:8080)
 *   KRESILO_SESSION        the guest session token: the value of the app's
 *                          HttpOnly cookie, or the whole "name=value" pair.
 *                          Leave it out and the first call opens a fresh guest
 *                          workspace instead.
 *   KRESILO_COOKIE_NAME    cookie name if the app was started with a different
 *                          KRESILO_COOKIE_NAME (default kresilo_guest)
 *   KRESILO_ACTOR          who to record in history (default mcp)
 *   KRESILO_TIMEOUT_MS     per-request wait, 1 000 to 300 000 (default 90 000;
 *                          a model-written proposal can take a while)
 */
export interface McpConfig {
  baseUrl: string;
  /** Cookie value only (no name, no "="). Empty when a fresh guest should be opened. */
  session: string;
  cookieName: string;
  actor: string;
  timeoutMs: number;
}

export const DEFAULT_URL = "http://localhost:8080";
export const DEFAULT_ACTOR = "mcp";
export const DEFAULT_COOKIE_NAME = "kresilo_guest";

function text(value: string | undefined): string {
  return (value ?? "").trim();
}

/** Accepts "token", "kresilo_guest=token" and a pasted "a=b; kresilo_guest=token". */
export function parseSession(raw: string, cookieName: string): string {
  const value = text(raw);
  if (!value) return "";
  if (!value.includes("=")) return value;
  for (const part of value.split(";")) {
    const at = part.indexOf("=");
    if (at < 0) continue;
    if (part.slice(0, at).trim() === cookieName) return part.slice(at + 1).trim();
  }
  return "";
}

/** Same rules the app applies: plain text, no control characters, 40 characters. */
export function cleanActor(raw: string): string {
  return (
    raw
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f\u007f]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 40)
      .trim() || DEFAULT_ACTOR
  );
}

export function loadConfig(env: Record<string, string | undefined>): McpConfig {
  const cookieName = text(env.KRESILO_COOKIE_NAME) || DEFAULT_COOKIE_NAME;
  const url = text(env.KRESILO_URL) || DEFAULT_URL;
  let baseUrl: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      throw new Error("protocol");
    baseUrl = parsed.origin + parsed.pathname.replace(/\/+$/, "");
  } catch {
    throw new Error(
      `KRESILO_URL must be an http or https address such as ${DEFAULT_URL}.`,
    );
  }
  const timeout = Number(text(env.KRESILO_TIMEOUT_MS) || 90_000);
  return {
    baseUrl,
    session: parseSession(env.KRESILO_SESSION ?? "", cookieName),
    cookieName,
    actor: cleanActor(env.KRESILO_ACTOR ?? ""),
    timeoutMs: Number.isFinite(timeout)
      ? Math.min(Math.max(timeout, 1_000), 300_000)
      : 90_000,
  };
}
