import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_PICTURES, MAX_PICTURE_BASE64, pictureBytesValid, picturesSchema, scenePictures } from "../src/creative/canvasImages";
import { commands, newProject } from "../src/creative/contracts";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
vi.mock("../server/creative/assistant", () => ({ draftCreativeProposal: vi.fn() }));
import { executeCreative } from "../server/creative/service";

const id = "11111111-2222-4333-8444-555555555555";
const media = "99999999-aaaa-4bbb-8ccc-dddddddddddd";
const png = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");
const jpeg = Buffer.from("ffd8ffe000104a464946", "hex");
const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0, 0, 0, 0]), Buffer.from("WEBP")]);
/** Base64 with no padding, so it is a valid payload as it stands. */
const b64 = (buf: Buffer) => Buffer.concat([buf, Buffer.alloc((3 - (buf.length % 3)) % 3)]).toString("base64");
const sceneWith = (images?: unknown) => JSON.stringify({ elements: [{ id: "a", type: "frame" }], marks: [], drafts: [], ...(images === undefined ? {} : { images }) });
let doc: ReturnType<typeof newProject>;
const saved = () => query.mock.calls.some((c) => c[0] === "creative_save");

describe("pictures on the canvas", () => {
  it("accepts a list of at most 24 pictures of the three image types and nothing else", () => {
    const one = { f1: { mediaId: media, mimeType: "image/png" } };
    expect(picturesSchema.safeParse(one).success).toBe(true);
    expect(picturesSchema.safeParse({ f1: { mediaId: "nope", mimeType: "image/png" } }).success).toBe(false);
    expect(picturesSchema.safeParse({ f1: { mediaId: media, mimeType: "image/gif" } }).success).toBe(false);
    expect(picturesSchema.safeParse({ f1: { mediaId: media, mimeType: "image/png", extra: 1 } }).success).toBe(false);
    const many = Object.fromEntries(Array.from({ length: MAX_PICTURES + 1 }, (_, i) => [`f${i}`, { mediaId: media, mimeType: "image/png" }]));
    expect(picturesSchema.safeParse(many).success).toBe(false);
  });

  it("reads the pictures a scene remembers, and says when the list is bad", () => {
    expect(scenePictures(sceneWith())).toEqual({});
    expect(scenePictures(sceneWith({ f1: { mediaId: media, mimeType: "image/webp" } }))).toEqual({ f1: { mediaId: media, mimeType: "image/webp" } });
    expect(scenePictures(sceneWith("x"))).toBeNull();
    expect(scenePictures("not json")).toBeNull();
  });

  it("checks that the bytes match the stated type", () => {
    expect(pictureBytesValid("image/png", png)).toBe(true);
    expect(pictureBytesValid("image/jpeg", jpeg)).toBe(true);
    expect(pictureBytesValid("image/webp", webp)).toBe(true);
    expect(pictureBytesValid("image/png", jpeg)).toBe(false);
    expect(pictureBytesValid("image/jpeg", Buffer.from("<svg"))).toBe(false);
    expect(pictureBytesValid("image/webp", png)).toBe(false);
  });
});

describe("the canvas keeps pictures as project media", () => {
  beforeEach(() => {
    doc = newProject(id, "A brief", "Canvas study", "culture-cover");
    query.mockReset();
    query.mockImplementation(async (name: string, params: unknown[]) => {
      if (name === "creative_open") return { person: { name: "Ayo" }, projects: [] };
      if (name === "creative_get") return { id, revision: 3, owner: true, document: doc };
      if (name === "creative_save") return { id, revision: 4, owner: true, document: params[3] };
      return {};
    });
  });

  it("stores a picture once under its own id and returns it, without changing the project", async () => {
    const r = await executeCreative("h", "canvas.image", { projectId: id, contentType: "image/png", base64: b64(png) });
    expect(r.ok).toBe(true);
    const mediaId = r.ok ? r.mediaId : "";
    expect(mediaId).toMatch(/^[0-9a-f-]{36}$/);
    const call = query.mock.calls.find((c) => c[0] === "creative_media_save_once");
    expect(call?.[1][1]).toBe(id);
    expect(call?.[1][2]).toBe(mediaId);
    expect(call?.[1][6]).toMatch(/^[0-9a-f]{64}$/);
    expect(saved()).toBe(false);
  });

  it("refuses bytes that are not the stated image type, and types and sizes the command does not take", async () => {
    const wrong = await executeCreative("h", "canvas.image", { projectId: id, contentType: "image/png", base64: b64(jpeg) });
    expect(wrong.ok === false && wrong.code).toBe("INVALID_INPUT");
    expect(query.mock.calls.some((c) => c[0] === "creative_media_save_once")).toBe(false);
    const base = { projectId: id, contentType: "image/png", base64: b64(png) };
    expect(commands["canvas.image"].safeParse(base).success).toBe(true);
    expect(commands["canvas.image"].safeParse({ ...base, contentType: "image/svg+xml" }).success).toBe(false);
    expect(commands["canvas.image"].safeParse({ ...base, contentType: "video/mp4" }).success).toBe(false);
    expect(commands["canvas.image"].safeParse({ ...base, base64: "A".repeat(MAX_PICTURE_BASE64 + 4) }).success).toBe(false);
    expect(commands["canvas.image"].safeParse({ ...base, extra: 1 }).success).toBe(false);
  });

  it("saves a scene that lists its pictures and refuses a list it cannot read", async () => {
    const ok = await executeCreative("h", "canvas.save", { projectId: id, revision: 3, scene: sceneWith({ f1: { mediaId: media, mimeType: "image/png" } }) });
    expect(ok.ok).toBe(true);
    const bad = await executeCreative("h", "canvas.save", { projectId: id, revision: 3, scene: sceneWith({ f1: { mediaId: "x", mimeType: "image/png" } }) });
    expect(bad.ok === false && bad.code).toBe("INVALID_INPUT");
  });

  it("will not publish a project that has pictures people added on its canvas, and publishes one that does not", async () => {
    doc.canvas = { at: "t", scene: sceneWith({ f1: { mediaId: media, mimeType: "image/png" } }) };
    const refused = await executeCreative("h", "publication.create", { projectId: id, revision: 3, audience: "community", description: "A canvas." });
    expect(refused.ok === false && refused.code).toBe("INVALID_INPUT");
    expect(refused.ok === false && refused.message).toMatch(/private/);
    expect(query.mock.calls.some((c) => c[0] === "creative_publish")).toBe(false);
    doc.canvas = { at: "t", scene: sceneWith({}) };
    const fine = await executeCreative("h", "publication.create", { projectId: id, revision: 3, audience: "community", description: "A canvas." });
    expect(fine.ok === false ? fine.message : "").not.toMatch(/private/);
    expect(query.mock.calls.some((c) => c[0] === "creative_publish")).toBe(true);
  });
});
