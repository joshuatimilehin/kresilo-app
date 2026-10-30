import { beforeEach, describe, expect, it, vi } from "vitest";
import { newProject, type ProjectRecord } from "../src/creative/contracts";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";
import { putSticker, resetStickers, startSticker, stickerPrompt, stickerStatus } from "../server/creative/stickers";

const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
let record: ProjectRecord;
beforeEach(() => {
  resetStickers();
  const document = newProject(crypto.randomUUID(), "A jazz poster", "Jazz");
  record = { id: document.id, revision: 1, owner: true, document };
  query.mockReset();
  query.mockImplementation(async (name: string, args: unknown[]) => {
    if (name === "creative_open") return { person: { name: "Ayo Bello" }, projects: [record] };
    if (name === "creative_get") return structuredClone(record);
    if (name === "creative_media_save_once") return { id: args[2] };
    if (name === "creative_save") {
      record = { id: record.id, revision: record.revision + 1, owner: true, document: structuredClone(args[3]) as ProjectRecord["document"] };
      return structuredClone(record);
    }
    throw new Error("Unexpected storage call");
  });
});

describe("the sticker maker", () => {
  it("places a finished sticker as an AI-marked layer, credited as AI-generated", async () => {
    const id = crypto.randomUUID();
    putSticker({ id, hash: "h", projectId: record.id, prompt: "a crow in sunglasses", status: "ready", at: Date.now(), contentType: "image/png", base64: PNG });
    const r = await executeCreative("h", "sticker.place", { projectId: record.id, jobId: id });
    expect(r.ok).toBe(true);
    const doc = r.ok && r.project ? r.project.document : record.document;
    const layer = doc.art.layers!.at(-1)!;
    expect(layer.name).toBe("Sticker: a crow in sunglasses");
    expect(doc.art.aiMarks).toContain(layer.id);
    expect(doc.references.at(-1)).toMatchObject({ creator: "AI-generated", mediaId: layer.mediaId });
    // A job is placed once.
    expect((await executeCreative("h", "sticker.place", { projectId: record.id, jobId: id })).ok).toBe(false);
  });

  it("keeps jobs to their own session and project", async () => {
    const id = crypto.randomUUID();
    putSticker({ id, hash: "someone-else", projectId: record.id, prompt: "x", status: "ready", at: Date.now(), contentType: "image/png", base64: PNG });
    expect(stickerStatus(id, "h")).toBeNull();
    expect((await executeCreative("h", "sticker.place", { projectId: record.id, jobId: id })).ok).toBe(false);
  });

  it("refuses to start without an image service, and asks for a clean die-cut sticker", () => {
    vi.stubEnv("INFERHUB_API_KEY", "");
    expect(startSticker("h", record.id, "a fox")).toMatchObject({ ok: false, code: "AI_UNAVAILABLE" });
    vi.unstubAllEnvs();
    expect(stickerPrompt("a fox")).toMatch(/die-cut vinyl sticker of a fox/);
    expect(stickerPrompt("a fox")).toMatch(/no religious or sacred symbols/i);
  });

  it("asks a busy image service again and finishes when it answers", async () => {
    vi.useFakeTimers();
    vi.stubEnv("INFERHUB_API_KEY", "test-only");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: [{ b64_json: PNG }] }) });
    vi.stubGlobal("fetch", fetchMock);
    const started = startSticker("h", record.id, "a fox");
    expect("job" in started).toBe(true);
    const id = "job" in started ? started.job.id : "";
    await vi.advanceTimersByTimeAsync(31_000);
    expect(stickerStatus(id, "h")?.status).toBe("ready");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
});
