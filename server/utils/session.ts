/**
 * Guest session handling. The browser holds only a random token in an
 * HttpOnly cookie; the database stores only its SHA-256 hash, so a stolen row
 * can never be replayed as a session and the token is unreadable even with
 * full schema access.
 *
 * Expiry is real: an expired hash is never renewed. The server rotates to a
 * fresh token (and therefore a fresh private project) instead of letting an
 * old credential reclaim the project it used to own. A client can never supply
 * a session hash or a project id as authority — only this cookie is trusted.
 */
import { getCookie, setCookie } from "nitro/h3";
import type { H3Event } from "nitro/h3";

function env(name: string, fallback: string): string {
  const value = (process.env[name] ?? "").trim();
  return value || fallback;
}

export function cookieName(): string {
  return env("KRESILO_COOKIE_NAME", "kresilo_guest");
}

export function sessionTtlHours(): number {
  const raw = Number(env("KRESILO_SESSION_TTL_HOURS", "24"));
  if (!Number.isFinite(raw)) return 24;
  return Math.min(Math.max(raw, 1), 720);
}

export function sessionTtlSeconds(): number {
  return sessionTtlHours() * 3600;
}

/** ISO instant `KRESILO_SESSION_TTL_HOURS` from now — the SQL caps renewal at 45 days. */
export function expiresAt(): string {
  return new Date(Date.now() + sessionTtlSeconds() * 1000).toISOString();
}

function cookieSecure(event: H3Event): boolean {
  const mode = env("KRESILO_COOKIE_SECURE", "auto").toLowerCase();
  if (mode === "true" || mode === "1") return true;
  if (mode === "false" || mode === "0") return false;
  const host = (event.headers.get("host") ?? "").split(":")[0];
  return !(host === "localhost" || host === "127.0.0.1" || host === "::1");
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function newToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export async function sha256Hex(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface GuestSession {
  token: string;
  hash: string;
  /** True when this call minted a replacement token and set the cookie. */
  rotated: boolean;
}

function tokenUsable(token: string | undefined): token is string {
  return typeof token === "string" && token.length >= 32 && token.length <= 128;
}

export function readToken(event: H3Event): string | null {
  const token = getCookie(event, cookieName());
  return tokenUsable(token) ? token : null;
}

/** Hashes an existing guest token. Does not decide whether it is still valid. */
export async function hashToken(token: string): Promise<string> {
  return sha256Hex(token);
}

/** Mints a fresh guest token, stores it in the HttpOnly cookie, and returns its hash. */
export async function rotateGuest(event: H3Event): Promise<GuestSession> {
  const token = newToken();
  setSessionToken(event, token);
  return { token, hash: await sha256Hex(token), rotated: true };
}

export function setSessionToken(event: H3Event, token: string): void {
  setCookie(event, cookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(event),
    path: "/",
    maxAge: sessionTtlSeconds(),
  });
}

/**
 * Cross-origin state-change guard. Only same-origin requests may write; the
 * HttpOnly cookie plus this check is what replaces a CSRF token here.
 */
export function isSameOrigin(event: H3Event): boolean {
  const method = event.method ?? "GET";
  if (method === "GET" || method === "HEAD") return true;
  const origin = event.headers.get("origin");
  if (!origin) return true; // same-origin fetch may omit it; the cookie still applies
  const host = event.headers.get("host");
  let originHost: string | null = null;
  try {
    originHost = new URL(origin).host;
  } catch {
    originHost = null;
  }
  return Boolean(originHost && originHost === host);
}

/* ------------------------------------------------------------- limits ---- */

export function maxBodyBytes(): number {
  const raw = Number(env("KRESILO_MAX_BODY_BYTES", "16384"));
  return Number.isFinite(raw) && raw > 0 ? Math.min(raw, 262_144) : 16_384;
}

const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;

function maxPerMinute(): number {
  const raw = Number(env("KRESILO_RATE_LIMIT_PER_MINUTE", "60"));
  return Number.isFinite(raw) && raw > 0 ? Math.min(raw, 1_000) : 60;
}

export function rateLimit(event: H3Event, bucket: string): boolean {
  const ip = event.node?.req?.socket?.remoteAddress ?? "unknown";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (hits.size > 5_000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    return true;
  }
  entry.count += 1;
  return entry.count <= maxPerMinute();
}
