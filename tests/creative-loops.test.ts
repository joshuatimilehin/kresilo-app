import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { contentRange, parseRange } from "../src/creative/range";
import { FileStoreError, MAX_LOOP_BYTES, readFile, readFileCached, uploadFile } from "../server/utils/octoFiles";
import { WORKSPACE_ID } from "../server/utils/octoClient";

describe("byte ranges", () => {
  it("serves the whole file when there is no usable header", () => {
    expect(parseRange(null, 100)).toBeNull();
    expect(parseRange("", 100)).toBeNull();
    expect(parseRange("items=0-5", 100)).toBeNull();
    expect(parseRange("bytes=0-1,5-9", 100)).toBeNull();
  });

  it("parses start-end, open-ended and suffix ranges and clamps the end", () => {
    expect(parseRange("bytes=0-9", 100)).toEqual({ start: 0, end: 9 });
    expect(parseRange("bytes=90-", 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange("bytes=-10", 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange("bytes=50-5000", 100)).toEqual({ start: 50, end: 99 });
    expect(parseRange("bytes=-500", 100)).toEqual({ start: 0, end: 99 });
  });

  it("refuses ranges that start past the end or run backwards", () => {
    expect(parseRange("bytes=100-", 100)).toBe("invalid");
    expect(parseRange("bytes=9-3", 100)).toBe("invalid");
    expect(parseRange("bytes=-", 100)).toBe("invalid");
    expect(parseRange("bytes=-0", 100)).toBe("invalid");
  });

  it("writes the Content-Range header", () => {
    expect(contentRange({ start: 5, end: 14 }, 53)).toBe("bytes 5-14/53");
  });
});

const id = "f3d7bb3d-fd4c-4dc9-82c5-ddb2c8683a13";
let calls: { url: string; init?: RequestInit }[];
beforeEach(() => {
  calls = [];
  vi.stubEnv("OCTO_API_KEY", "secret-key-123");
  vi.stubEnv("OCTO_BASE_URL", "https://octo.test");
});
afterEach(() => vi.unstubAllGlobals());

const stubFetch = (respond: (url: string, init?: RequestInit) => Response) =>
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return respond(url, init);
  });

describe("Octo file store client", () => {
  it("uploads base64 JSON to the fixed workspace with the server key", async () => {
    stubFetch(() => new Response(JSON.stringify({ id }), { status: 201 }));
    const out = await uploadFile({ name: "loop.mp4", mimeType: "video/mp4", bytes: new Uint8Array([1, 2, 3]) });
    expect(out).toBe(id);
    expect(calls[0].url).toBe("https://octo.test/api/files/upload");
    const body = JSON.parse(String(calls[0].init?.body));
    expect(body).toMatchObject({ workspaceId: WORKSPACE_ID, name: "loop.mp4", mimeType: "video/mp4", data: "AQID", dataEncoding: "base64" });
    expect((calls[0].init?.headers as Record<string, string>).authorization).toBe("Bearer secret-key-123");
  });

  it("refuses a loop over the size cap without calling Octo", async () => {
    stubFetch(() => new Response("{}"));
    await expect(uploadFile({ name: "x.mp4", mimeType: "video/mp4", bytes: new Uint8Array(MAX_LOOP_BYTES + 1) })).rejects.toMatchObject({ code: "TOO_LARGE" });
    expect(calls).toHaveLength(0);
  });

  it("fails clearly when the key is missing, Octo errors, or no id comes back", async () => {
    vi.stubEnv("OCTO_API_KEY", "");
    await expect(readFile(id)).rejects.toMatchObject({ code: "STORAGE_SETUP_REQUIRED" });
    vi.stubEnv("OCTO_API_KEY", "secret-key-123");
    stubFetch(() => new Response("nope", { status: 500 }));
    await expect(uploadFile({ name: "x", mimeType: "video/mp4", bytes: new Uint8Array([1]) })).rejects.toBeInstanceOf(FileStoreError);
    stubFetch(() => new Response(JSON.stringify({ id: "not-an-id" }), { status: 201 }));
    await expect(uploadFile({ name: "x", mimeType: "video/mp4", bytes: new Uint8Array([1]) })).rejects.toMatchObject({ code: "STORAGE_ERROR" });
  });

  it("never lets the key into an error message", async () => {
    stubFetch(() => {
      throw new Error("connect failed for Bearer secret-key-123");
    });
    const err = await readFile(id).catch((e: Error) => e);
    expect(String((err as Error).message)).not.toContain("secret-key-123");
  });

  it("rejects an id that is not a file id before any request", async () => {
    stubFetch(() => new Response("x"));
    await expect(readFile("../../etc/passwd")).rejects.toBeInstanceOf(FileStoreError);
    expect(calls).toHaveLength(0);
  });

  it("reads a file once and serves repeat ranges from memory", async () => {
    stubFetch(() => new Response(new Uint8Array([9, 8, 7])));
    const a = await readFileCached(id);
    const b = await readFileCached(id);
    expect([...a]).toEqual([9, 8, 7]);
    expect(b).toBe(a);
    expect(calls.filter((c) => c.url.includes("/api/files/content"))).toHaveLength(1);
    expect(calls[0].url).toContain(`workspaceId=${WORKSPACE_ID}`);
  });
});
