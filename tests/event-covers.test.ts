import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { commands, hostedEventSchema } from "../src/creative/contracts";
import { coverCrop, fitWithin } from "../src/creative/eventCover";
const { query, upload } = vi.hoisted(() => ({ query: vi.fn(), upload: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
vi.mock("../server/utils/octoFiles", async (original) => ({ ...(await original<object>()), uploadFile: upload }));
import { executeCreative } from "../server/creative/service";
import { signCover, sniffImage, verifyCover } from "../server/creative/eventCovers";

const FILE = "0f8fad5b-d9cb-469f-a165-70867728950e";
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...new Array(40).fill(1)]);
const PNG = Buffer.from("89504e470d0a1a0a" + "00".repeat(30), "hex");

const event = {
  id: "h-ab12cd34",
  title: "Riso zine night",
  format: "online",
  startsAt: "2026-11-30T18:00",
  minutes: 120,
  city: "",
  venue: "",
  link: "https://meet.example.com/riso",
  spots: 30,
  about: "",
  projectId: "harbour-hours",
};

describe("event cover references", () => {
  beforeEach(() => vi.stubEnv("KRESILO_COVER_SECRET", "test-secret"));
  afterEach(() => vi.unstubAllEnvs());

  it("sign a file id so only this server can point the public route at a file", () => {
    const ref = signCover(FILE)!;
    expect(ref.startsWith(`${FILE}.`)).toBe(true);
    expect(hostedEventSchema.safeParse({ ...event, cover: ref }).success).toBe(true);
    expect(verifyCover(ref)).toBe(FILE);
  });

  it("refuse a forged, altered or unsigned reference", () => {
    const ref = signCover(FILE)!;
    expect(verifyCover(`${FILE}.${"0".repeat(32)}`)).toBeNull();
    expect(verifyCover(ref.replace(FILE, "1f8fad5b-d9cb-469f-a165-70867728950e"))).toBeNull();
    expect(verifyCover(FILE)).toBeNull();
    expect(verifyCover("../../etc/passwd")).toBeNull();
    vi.stubEnv("KRESILO_COVER_SECRET", "another-secret");
    expect(verifyCover(ref)).toBeNull();
  });

  it("cannot sign without a secret", () => {
    vi.stubEnv("KRESILO_COVER_SECRET", "");
    vi.stubEnv("OCTO_API_KEY", "");
    expect(signCover(FILE)).toBeNull();
  });

  it("knows a picture by its bytes, not its name", () => {
    expect(sniffImage(JPEG)).toBe("image/jpeg");
    expect(sniffImage(PNG)).toBe("image/png");
    expect(sniffImage(Buffer.from("RIFF0000WEBPVP8 ", "ascii"))).toBe("image/webp");
    expect(sniffImage(Buffer.from("<svg onload=alert(1)>", "utf8"))).toBeNull();
  });
});

describe("the event.cover command", () => {
  beforeEach(() => {
    vi.stubEnv("KRESILO_COVER_SECRET", "test-secret");
    query.mockReset();
    upload.mockReset();
    query.mockImplementation(async (name: string) => (name === "creative_open" ? { person: { name: "Ayo" }, projects: [] } : {}));
    upload.mockResolvedValue(FILE);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("keeps a real picture and answers a signed reference", async () => {
    const r = await executeCreative("h", "event.cover", { contentType: "image/jpeg", base64: JPEG.toString("base64") });
    expect(r.ok && r.cover).toBe(signCover(FILE));
    expect(upload.mock.calls[0][0].mimeType).toBe("image/jpeg");
  });

  it("refuses bytes that are not the picture they claim to be", async () => {
    const r = await executeCreative("h", "event.cover", { contentType: "image/png", base64: JPEG.toString("base64") });
    expect(r.ok).toBe(false);
    expect(upload).not.toHaveBeenCalled();
  });

  it("only takes jpeg, png and webp", () => {
    expect(commands["event.cover"].safeParse({ contentType: "image/svg+xml", base64: JPEG.toString("base64") }).success).toBe(false);
    expect(commands["event.cover"].safeParse({ contentType: "image/jpeg", base64: "not base64!!" }).success).toBe(false);
  });

  it("publishes an event only with a cover this server signed", async () => {
    expect((await executeCreative("h", "event.publish", { event: { ...event, cover: signCover(FILE) } })).ok).toBe(true);
    const forged = await executeCreative("h", "event.publish", { event: { ...event, cover: `${FILE}.${"a".repeat(32)}` } });
    expect(forged.ok).toBe(false);
    expect(query.mock.calls.filter((c) => c[0] === "creative_hosted_save")).toHaveLength(1);
  });
});

describe("online events need a video link", () => {
  it("refuses to publish an online or hybrid event without one", () => {
    expect(commands["event.publish"].safeParse({ event: { ...event, link: "" } }).success).toBe(false);
    expect(commands["event.publish"].safeParse({ event: { ...event, format: "hybrid", city: "Lisbon", venue: "Back room", link: "" } }).success).toBe(false);
    expect(commands["event.publish"].safeParse({ event: { ...event, format: "in-person", city: "Lisbon", venue: "Back room", link: "" } }).success).toBe(true);
  });
});

describe("drawing a cover", () => {
  it("draws large pictures down and leaves small ones", () => {
    expect(fitWithin(4000, 3000)).toEqual({ w: 1400, h: 1050 });
    expect(fitWithin(3000, 6000)).toEqual({ w: 700, h: 1400 });
    expect(fitWithin(800, 600)).toEqual({ w: 800, h: 600 });
  });

  it("crops to fill a box edge to edge, centred", () => {
    expect(coverCrop(200, 100, 100, 100)).toEqual({ sx: 50, sy: 0, sw: 100, sh: 100 });
    expect(coverCrop(100, 200, 100, 100)).toEqual({ sx: 0, sy: 50, sw: 100, sh: 100 });
  });
});

describe("wrapLines", () => {
  const width = (s: string) => s.length * 10;
  it("wraps words to the box and keeps explicit line breaks", async () => {
    const { wrapLines } = await import("../src/creative/eventCover");
    expect(wrapLines("Crumb & Co", 1000, width)).toEqual(["Crumb & Co"]);
    expect(wrapLines("Crumb & Co", 70, width)).toEqual(["Crumb &", "Co"]);
    expect(wrapLines("Opening\nSaturday", 1000, width)).toEqual(["Opening", "Saturday"]);
  });
  it("never loses a word that is wider than the box", async () => {
    const { wrapLines } = await import("../src/creative/eventCover");
    expect(wrapLines("Supercalifragilistic day", 50, width)).toEqual(["Supercalifragilistic", "day"]);
  });
});

describe("containBox", () => {
  it("fits a portrait poster inside a square, centred", async () => {
    const { containBox } = await import("../src/creative/eventCover");
    expect(containBox(1050, 1400, 1400)).toEqual({ x: 175, y: 0, w: 1050, h: 1400 });
  });
  it("fits a wide frame with bars above and below", async () => {
    const { containBox } = await import("../src/creative/eventCover");
    expect(containBox(1400, 788, 1400)).toEqual({ x: 0, y: 306, w: 1400, h: 788 });
  });
});
