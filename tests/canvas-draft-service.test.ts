import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { commands, newProject } from "../src/creative/contracts";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
vi.mock("../server/creative/assistant", () => ({ draftCreativeProposal: vi.fn() }));
import { executeCreative } from "../server/creative/service";

const id = "11111111-2222-4333-8444-555555555555";
const request = {
  projectId: id,
  board: { id: "phone", width: 390, height: 844 },
  elements: [
    { id: "card", type: "rectangle", x: 14, y: 650, width: 300, height: 120, strokeColor: "#edeae3", backgroundColor: "transparent" },
    { id: "button", type: "rectangle", x: 164, y: 690, width: 100, height: 36, text: "Other options" },
  ],
  marks: [
    { kind: "ellipse", anchor: { id: "button", kind: "rectangle" }, x: 150, y: 680, width: 130, height: 56 },
    { kind: "text", note: "Dropdown", anchor: null, x: 420, y: 700, width: 90, height: 30 },
  ],
};
const reply = (content: unknown) => new Response(JSON.stringify({ choices: [{ message: { content: typeof content === "string" ? content : JSON.stringify(content) } }] }), { status: 200 });
const saved = () => query.mock.calls.some((c) => c[0] === "creative_save");

describe("Copilot drafts a change from the marks on a board", () => {
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

  it("sends the marks, their notes and the anchored elements, and returns the edits without saving anything", async () => {
    const fetchMock = vi.fn(async () => reply({ rationale: "Open a list under the button", edits: [{ id: "button", set: { backgroundColor: "#c7fe02" } }], adds: [{ type: "rectangle", x: 164, y: 600, width: 150, height: 80, backgroundColor: "#101315" }] }));
    vi.stubGlobal("fetch", fetchMock);
    const r = await executeCreative("h", "canvas.draft", request);
    expect(r.ok).toBe(true);
    expect(r.ok && r.draft?.edits).toEqual([{ id: "button", set: { backgroundColor: "#c7fe02" } }]);
    expect(r.ok && r.draft?.adds).toHaveLength(1);
    const sent = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, { body: string }])[1].body);
    const prompt = JSON.parse(sent.messages[1].content);
    expect(prompt.marks[1].note).toBe("Dropdown");
    expect(prompt.marks[0].anchor.id).toBe("button");
    expect(sent.messages[0].content).toMatch(/#c7fe02/);
    expect(saved()).toBe(false);
  });

  it("drops edits to elements that are not on the board and colours outside the brand", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply({ rationale: "r", edits: [{ id: "ghost", set: { x: 1 } }, { id: "card", set: { backgroundColor: "#ff00aa", x: 40 } }] })));
    const r = await executeCreative("h", "canvas.draft", request);
    expect(r.ok && r.draft?.edits).toEqual([{ id: "card", set: { x: 40 } }]);
  });

  it("keeps text edits out while Words is off, unless the request asks for them", async () => {
    const reply1 = () => reply({ rationale: "r", edits: [{ id: "button", set: { text: "More", x: 170 } }] });
    vi.stubGlobal("fetch", vi.fn(async () => reply1()));
    const off = await executeCreative("h", "canvas.draft", request);
    expect(off.ok && off.draft?.edits).toEqual([{ id: "button", set: { x: 170 } }]);
    vi.stubGlobal("fetch", vi.fn(async () => reply1()));
    const asked = await executeCreative("h", "canvas.draft", { ...request, request: "change the text on the button to More" });
    expect(asked.ok && asked.draft?.edits).toEqual([{ id: "button", set: { text: "More", x: 170 } }]);
    doc.aiAllow = { words: true, layout: false, look: true, images: true };
    vi.stubGlobal("fetch", vi.fn(async () => reply1()));
    const on = await executeCreative("h", "canvas.draft", request);
    expect(on.ok && on.draft?.edits).toEqual([{ id: "button", set: { text: "More" } }]);
  });

  it("refuses, saying what is off, when every part of the draft needs a switch that is off", async () => {
    doc.aiAllow = { words: false, layout: false, look: true, images: true };
    vi.stubGlobal("fetch", vi.fn(async () => reply({ rationale: "r", edits: [{ id: "button", set: { x: 170, text: "More" } }] })));
    const r = await executeCreative("h", "canvas.draft", request);
    expect(r.ok === false && r.code).toBe("AI_NOT_ALLOWED");
    expect(r.ok === false && r.message).toMatch(/off/);
  });

  it("refuses without calling the model when the assistant is off", async () => {
    doc.aiApply = "off";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const r = await executeCreative("h", "canvas.draft", request);
    expect(r.ok === false && r.code).toBe("AI_OFF");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("says nothing was changed when the model is unavailable, unreadable or has nothing to change", async () => {
    for (const body of [() => new Response("{}", { status: 500 }), () => reply("I cannot do that"), () => reply({ rationale: "r", edits: [] })]) {
      vi.stubGlobal("fetch", vi.fn(async () => body()));
      const r = await executeCreative("h", "canvas.draft", request);
      expect(r.ok === false && r.code).toBe("AI_UNAVAILABLE");
      expect(r.ok === false && r.message).toMatch(/Nothing was changed/);
    }
    vi.unstubAllEnvs();
    vi.stubEnv("INFERHUB_API_KEY", "");
    const none = await executeCreative("h", "canvas.draft", request);
    expect(none.ok === false && none.code).toBe("AI_UNAVAILABLE");
    expect(saved()).toBe(false);
  });

  it("needs at least one mark and rejects unknown fields", () => {
    expect(commands["canvas.draft"].safeParse(request).success).toBe(true);
    expect(commands["canvas.draft"].safeParse({ ...request, marks: [] }).success).toBe(false);
    expect(commands["canvas.draft"].safeParse({ ...request, extra: 1 }).success).toBe(false);
  });
});
