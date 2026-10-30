import { WORKSPACE_ID, readCredentials, redactFor } from "./octoClient";

/**
 * Octo's files API (stored in Octo's R2 bucket). Server-only, like the query
 * client: the key never reaches the browser, the workspace is the fixed
 * constant, and nothing here logs the key.
 *
 * Observed contract (October 22, 2026, tested with a 53-byte file):
 *   POST /api/files/upload  { workspaceId, name, mimeType, data, dataEncoding: "base64" } -> 201 { id, ... }
 *   GET  /api/files/content?workspaceId=&fileId=   -> 200 with the bytes
 * Octo does not honour Range requests, so ranges are served by this app.
 */
export const MAX_LOOP_BYTES = 12 * 1024 * 1024;
const TIMEOUT_MS = 30_000;

export class FileStoreError extends Error {
  constructor(
    readonly code: "STORAGE_SETUP_REQUIRED" | "TOO_LARGE" | "STORAGE_ERROR",
    message: string = code,
  ) {
    super(message);
  }
}

async function call(path: string, init: RequestInit): Promise<Response> {
  const creds = readCredentials();
  if (!creds) throw new FileStoreError("STORAGE_SETUP_REQUIRED");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${creds.baseUrl}${path}`, {
      ...init,
      headers: { ...(init.headers as Record<string, string>), authorization: `Bearer ${creds.key}` },
      signal: controller.signal,
    });
  } catch (error) {
    throw new FileStoreError("STORAGE_ERROR", redactFor(String(error)));
  } finally {
    clearTimeout(timer);
  }
}

/** Stores bytes in Octo's file store and returns the file id. */
export async function uploadFile(file: { name: string; mimeType: string; bytes: Uint8Array }): Promise<string> {
  if (file.bytes.length > MAX_LOOP_BYTES) throw new FileStoreError("TOO_LARGE");
  const res = await call("/api/files/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      workspaceId: WORKSPACE_ID,
      name: file.name.slice(0, 120),
      mimeType: file.mimeType,
      data: Buffer.from(file.bytes).toString("base64"),
      dataEncoding: "base64",
    }),
  });
  if (!res.ok) throw new FileStoreError("STORAGE_ERROR", `upload answered ${res.status}`);
  const body = (await res.json()) as { id?: unknown };
  if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id)) throw new FileStoreError("STORAGE_ERROR", "no file id");
  return body.id;
}

/** Reads a stored file's bytes. */
export async function readFile(fileId: string): Promise<Buffer> {
  if (!/^[0-9a-f-]{36}$/i.test(fileId)) throw new FileStoreError("STORAGE_ERROR", "bad file id");
  const res = await call(
    `/api/files/content?workspaceId=${encodeURIComponent(WORKSPACE_ID)}&fileId=${encodeURIComponent(fileId)}`,
    { method: "GET" },
  );
  if (!res.ok) throw new FileStoreError("STORAGE_ERROR", `read answered ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** A small in-memory cache so a seeking player does not re-download the loop for every range. */
const cache = new Map<string, Buffer>();
const CACHE_LIMIT_BYTES = 48 * 1024 * 1024;
export async function readFileCached(fileId: string): Promise<Buffer> {
  const hit = cache.get(fileId);
  if (hit) {
    cache.delete(fileId);
    cache.set(fileId, hit);
    return hit;
  }
  const bytes = await readFile(fileId);
  cache.set(fileId, bytes);
  let total = [...cache.values()].reduce((n, b) => n + b.length, 0);
  for (const key of cache.keys()) {
    if (total <= CACHE_LIMIT_BYTES || key === fileId) break;
    total -= cache.get(key)!.length;
    cache.delete(key);
  }
  return bytes;
}
