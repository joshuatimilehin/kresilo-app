import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { commands, newProject } from "../src/creative/contracts";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
vi.mock("../server/creative/assistant", () => ({ draftCreativeProposal: vi.fn() }));
import { executeCreative } from "../server/creative/service";

const id = "11111111-2222-4333-8444-555555555555";
const request = { projectId: id, image: "data:image/png;base64,iVBORw0KGgo=", width: 560, height: 450, notes: ["Brand it"], request: "make it on-brand" };
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 450"><rect width="560" height="450" fill="#ffffff"/>${["card-back", "card-front", "logo", "name", "title"].map((n, i) => `<g id="${n}"><rect x="${i * 10}" y="10" width="40" height="30" fill="#c8ff00"/></g>`).join("")}</svg>`;
const reply = (content: string) => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
const saved = () => query.mock.calls.some((c) => c[0] === "creative_save");

describe("a rough sketch becomes clean SVG layers", () => {
  let doc: ReturnType<typeof newProject>;
  beforeEach(() => {
    doc = newProject(id, "A brief", "Canvas study", "culture-cover");
    query.mockReset();
    query.mockImplementation(async (name: string) => {
      if (name === "creative_open") return { person: { name: "Ayo" }, projects: [] };
      if (name === "creative_get") return { id, revision: 3, owner: true, document: doc };
      return {};
    });
    vi.stubEnv("INFERHUB_API_KEY", "test-key");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends the picture and notes, returns named on-brand layers and saves nothing", async () => {
    const fetchMock = vi.fn(async () => reply("```svg\n" + svg + "\n```"));
    vi.stubGlobal("fetch", fetchMock);
    const r = await executeCreative("h", "canvas.vector", request);
    expect(r.ok).toBe(true);
    const v = r.ok ? r.vector : undefined;
    expect(v?.layers.map((l) => l.name)).toEqual(["Background", "card back", "card front", "logo", "name", "title"]);
    expect(v?.svg).toContain('fill="#c7fe02"');
    expect(v?.svg).not.toContain("#ffffff");
    const sent = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, { body: string }])[1].body);
    expect(sent.messages[1].content[1]).toEqual({ type: "image_url", image_url: { url: request.image } });
    expect(JSON.parse(sent.messages[1].content[0].text).notes).toEqual(["Brand it"]);
    expect(sent.messages[0].content).toMatch(/#c7fe02/);
    expect(saved()).toBe(false);
  });

  it("strips anything executable from the model's SVG", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(svg.replace("</svg>", `<script>alert(1)</script><g id="x" onclick="y()"><rect width="1" height="1" href="http://evil"/></g></svg>`))));
    const r = await executeCreative("h", "canvas.vector", request);
    expect(r.ok && r.vector?.svg).not.toMatch(/script|onclick|href|evil/);
  });

  it("refuses without calling the model while Images is off", async () => {
    doc.aiAllow = { words: true, layout: true, look: true, images: false };
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const r = await executeCreative("h", "canvas.vector", request);
    expect(r.ok === false && r.code).toBe("AI_NOT_ALLOWED");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses without calling the model when the assistant is off", async () => {
    doc.aiApply = "off";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const r = await executeCreative("h", "canvas.vector", request);
    expect(r.ok === false && r.code).toBe("AI_OFF");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("says nothing was changed when the model fails or does not draw an SVG", async () => {
    for (const body of [() => new Response("{}", { status: 500 }), () => reply("I can't draw that"), () => reply("<svg></svg>")]) {
      vi.stubGlobal("fetch", vi.fn(async () => body()));
      const r = await executeCreative("h", "canvas.vector", request);
      expect(r.ok === false && r.code).toBe("AI_UNAVAILABLE");
      expect(r.ok === false && r.message).toMatch(/Nothing was changed/);
    }
    expect(saved()).toBe(false);
  });

  it("only accepts a PNG data URL and no extra fields", () => {
    expect(commands["canvas.vector"].safeParse(request).success).toBe(true);
    expect(commands["canvas.vector"].safeParse({ ...request, image: "https://example.com/x.png" }).success).toBe(false);
    expect(commands["canvas.vector"].safeParse({ ...request, extra: 1 }).success).toBe(false);
  });
});
