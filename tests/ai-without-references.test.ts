import { beforeEach, describe, expect, it, vi } from "vitest";
import { newProject, type ProjectRecord, type TextMark } from "../src/creative/contracts";
import { newMark } from "../src/creative/marks";
import { applyDesignPlan, designPlanSchema } from "../server/creative/plan";
import { limitPatch, defaultAiAllow } from "../src/creative/aiAllow";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

let record: ProjectRecord;
beforeEach(() => {
  delete process.env.INFERHUB_API_KEY;
  const document = newProject(crypto.randomUUID(), "A rooftop jazz night poster", "Jazz night");
  record = { id: document.id, revision: 1, owner: true, document };
  query.mockReset();
  query.mockImplementation(async (name: string, args: unknown[]) => {
    if (name === "creative_open") return { person: { name: "Ayo Bello" }, projects: [record] };
    if (name === "creative_get") return structuredClone(record);
    if (name === "creative_save") {
      record = { id: record.id, revision: record.revision + 1, owner: true, document: structuredClone(args[3]) as ProjectRecord["document"] };
      return structuredClone(record);
    }
    throw new Error("Unexpected storage call");
  });
});

describe("the assistant starts from an idea alone", () => {
  it("answers a request on a project with no references, citing nothing", async () => {
    expect(record.document.references).toHaveLength(0);
    const r = await executeCreative("h", "proposal.request", { projectId: record.id, intent: "Make it warm and loud" });
    expect(r, JSON.stringify(r).slice(0, 300)).toMatchObject({ ok: true });
    const made = r.ok && r.project ? r.project.document.proposals.at(-1) : undefined;
    expect(made?.cites).toEqual([]);
    expect(made?.rationale).not.toMatch(/Source:|undefined/);
  });

  it("accepts a plan with no citations", () => {
    expect(designPlanSchema.safeParse({ rationale: "A bold first draft from the brief.", cites: [], patch: {} }).success).toBe(true);
  });
});

describe("the assistant edits text and shapes", () => {
  const headline = { ...(newMark("text", []) as TextMark), name: "Headline" };
  const art = { ...newProject(crypto.randomUUID(), "x", "y").art, marks: [headline] };

  it("changes a text layer by name and adds a shape", () => {
    const plan = designPlanSchema.parse({
      rationale: "Bigger headline in coral, with a band behind the date.",
      cites: [],
      patch: {},
      markPatches: [{ mark: "Headline", text: "Jazz on the roof", color: "#ff6b5b", size: 9 }],
      addMarks: [{ kind: "rectangle", name: "Date band", x: 0, y: 80, width: 100, height: 8, fill: "#111111" }],
    });
    const applied = applyDesignPlan({ art }, plan);
    const marks = applied.patch.marks!;
    expect(marks).toHaveLength(2);
    expect(marks[0]).toMatchObject({ kind: "text", text: "Jazz on the roof", color: "#ff6b5b", size: 9 });
    expect(marks[1]).toMatchObject({ kind: "shape", shape: "rectangle", name: "Date band", fill: "#111111" });
  });

  it("skips a name that is not there and drops fields that do not fit the kind", () => {
    const plan = designPlanSchema.parse({
      rationale: "Try a fill on the headline and edit a missing layer.",
      cites: [],
      patch: {},
      markPatches: [{ mark: "Headline", fill: "#000000", x: 12 }, { mark: "Nope", x: 5 }],
    });
    const applied = applyDesignPlan({ art }, plan);
    expect(applied.patch.marks![0]).not.toHaveProperty("fill");
    expect(applied.patch.marks![0].x).toBe(12);
    expect(applied.notes.join(" ")).toMatch(/no text or shape called "Nope"/);
  });

  it("keeps the words when words are off, but lets layout and look through", () => {
    const changed = [{ ...headline, text: "Rewritten", x: 40, color: "#123456" }];
    const { patch, blocked } = limitPatch(art, { marks: changed as typeof art.marks }, defaultAiAllow);
    expect(blocked).toContain("words");
    expect(patch.marks![0]).toMatchObject({ text: headline.text, x: 40, color: "#123456" });
  });
});

import { titleBottom } from "../server/creative/context";
describe("where the title ends", () => {
  it("grows with the number of wrapped lines", () => {
    const one = titleBottom({ title: "Jazz", size: 14, y: 6 });
    const two = titleBottom({ title: "Rooftop jazz night in Lisbon", size: 14, y: 6 });
    expect(one).toBeGreaterThan(6);
    expect(two).toBeGreaterThan(one);
    expect(two).toBeLessThanOrEqual(100);
  });
});
