import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { newProject, commands, type ProjectRecord } from "../src/creative/contracts";
import { DEFAULT_SPECIALIST, chooseSpecialist, specialistById, specialistIds, specialists } from "../src/creative/specialists";
import { designerForTemplate, designerMap, templatesFor } from "../src/creative/specialistMap";
import { brandTemplates } from "../src/creative/portfolio/templates";
import { designStyles } from "../src/creative/openDesign/styles";
import { visualCategories, type Visual } from "../src/creative/visuals/types";
import { SYSTEM_PROMPT, specialistPrompt, systemPromptFor, visualCatalogue } from "../server/creative/context";

const pick = (request: string, brief = "", style?: string) => chooseSpecialist(brief, request, { brief, art: { style } }).id;

describe("which designer the brief and request choose", () => {
  it("has the four designers, each with an icon and rules for layout, hierarchy, type, palette and motion", () => {
    expect(specialistIds).toEqual(["ui", "brand", "illustration", "motion"]);
    for (const s of specialists) {
      expect(s.name.length).toBeGreaterThan(1);
      for (const k of ["layout", "hierarchy", "type", "palette", "motion"] as const) expect(s.rules[k].length, `${s.id} ${k}`).toBeGreaterThan(30);
      expect(Object.values(s.rules).join(" ").split(/\s+/).length, s.id).toBeLessThan(150);
    }
  });

  it.each([
    ["a sign-in screen with a big button", "ui"],
    ["design the onboarding flow for my app", "ui"],
    ["a logo and brand board for Harbour Coffee", "brand"],
    ["business cards and a letterhead", "brand"],
    ["draw a hand-drawn fox with a leafy pattern", "illustration"],
    ["add a sticker of a bicycle", "illustration"],
    ["animate it with a slow drift and loop", "motion"],
    ["ease the title in over three seconds", "motion"],
  ])("reads %s as %s", (request, id) => {
    expect(pick(request)).toBe(id);
  });

  it("lets an action beat a subject: an animated logo is Motion, a logo alone is Brand identity", () => {
    expect(pick("animate my logo")).toBe("motion");
    expect(pick("make my logo bigger")).toBe("brand");
  });

  it("weighs the request above the brief", () => {
    expect(pick("animate the title", "A brand identity for a bakery")).toBe("motion");
    expect(pick("make it bolder", "A brand identity and logo for a bakery")).toBe("brand");
  });

  it("falls to Illustration when nothing points anywhere", () => {
    expect(pick("make it nicer")).toBe(DEFAULT_SPECIALIST);
    expect(pick("")).toBe("illustration");
  });

  it("matches whole words only", () => {
    expect(pick("the snapshot is fine")).toBe(DEFAULT_SPECIALIST);
    expect(pick("an appetising dish")).toBe(DEFAULT_SPECIALIST);
  });

  it("follows a template named in the request to the designer mapped to it", () => {
    expect(pick("start from the packaging set")).toBe("brand");
    expect(pick("use the UI kit starter")).toBe("ui");
    expect(pick("the motion sting please")).toBe("motion");
    expect(chooseSpecialist("", "like the album cover template", {}).because).toContain("album cover template");
  });

  it("lets a chosen style tip a close call, but never makes a designer win alone", () => {
    expect(pick("make it nicer", "", "neon")).toBe(DEFAULT_SPECIALIST);
    expect(chooseSpecialist("", "a picture of a fox", { art: { style: "doodle" } }).because).toContain("doodle style");
  });

  it("is deterministic and explains itself", () => {
    const a = chooseSpecialist("", "animate the logo", {});
    expect(chooseSpecialist("", "animate the logo", {})).toEqual(a);
    expect(a.because).toContain("animat");
  });
});

describe("what each designer adds to the prompt", () => {
  it("adds one DESIGNER line naming the designer and its five rules, and only that", () => {
    const base = SYSTEM_PROMPT.split("\n");
    for (const s of specialists) {
      const lines = systemPromptFor(s.id).split("\n");
      expect(lines.length).toBe(base.length + 1);
      const added = lines.filter((l) => !base.includes(l));
      expect(added).toHaveLength(1);
      expect(added[0]).toContain(`working as the ${s.name} designer`);
      for (const r of Object.values(s.rules)) expect(added[0]).toContain(r);
      expect(added[0]).toContain("MOTION (only when the request asks for motion)");
      // It sits before the focus and hands-off rules, so those still read last.
      expect(lines.indexOf(added[0])).toBeLessThan(lines.findIndex((l) => l.startsWith("FOCUS AND HANDS-OFF")));
    }
  });

  it("gives each designer different words", () => {
    expect(new Set(specialists.map((s) => specialistPrompt(s.id))).size).toBe(4);
  });

  it("adds nothing for a missing or unknown designer", () => {
    for (const bad of [undefined, null, "", "poster", "<script>"]) {
      expect(specialistPrompt(bad)).toBe("");
      expect(systemPromptFor(bad)).toBe(SYSTEM_PROMPT);
    }
  });

  it("never loosens the rules above it", () => {
    for (const s of specialists) {
      const prompt = systemPromptFor(s.id);
      expect(prompt).toContain("ONLY WHEN ASKED: set motion only when the request asks");
      expect(specialistPrompt(s.id)).toContain("every rule above, the artist's switches and the focus still decide");
    }
  });
});

describe("the command accepts a designer", () => {
  const input = { projectId: crypto.randomUUID(), intent: "x" };
  it("takes one of the four, or none", () => {
    expect(commands["proposal.request"].safeParse(input).success).toBe(true);
    for (const id of specialistIds) expect(commands["proposal.request"].safeParse({ ...input, specialist: id }).success).toBe(true);
    expect(commands["proposal.request"].safeParse({ ...input, specialist: "critic" }).success).toBe(false);
  });
});

describe("designers, template packs and the visual library", () => {
  it("lists only templates, categories and styles that exist", () => {
    const ids = new Set(brandTemplates.map((t) => t.id));
    const styles = new Set(designStyles.map((s) => s.id));
    for (const id of specialistIds) {
      for (const t of designerMap[id].templates) expect(ids.has(t), `${id}: template ${t}`).toBe(true);
      for (const c of designerMap[id].visualCategories) expect(visualCategories, `${id}: ${c}`).toContain(c);
      for (const s of designerMap[id].styles) expect(styles.has(s), `${id}: style ${s}`).toBe(true);
    }
  });

  it("gives every template one designer, and unlisted ones to Brand identity", () => {
    const listed = specialistIds.flatMap((id) => designerMap[id].templates);
    expect(new Set(listed).size).toBe(listed.length);
    for (const t of brandTemplates) expect(specialistById(designerForTemplate(t.id)), t.id).toBeDefined();
    expect(designerForTemplate("a-future-pack")).toBe("brand");
    expect(specialistIds.flatMap((id) => templatesFor(id)).length).toBe(brandTemplates.length);
  });

  it("reaches every library category through at least one designer", () => {
    const reached = new Set(specialistIds.flatMap((id) => designerMap[id].visualCategories));
    for (const c of visualCategories) expect(reached.has(c), c).toBe(true);
  });

  it("lifts the designer's categories when a big library is narrowed", () => {
    const make = (i: number, category: Visual["category"]): Visual => ({
      id: `v-${i}`, kind: "ink", category, title: `Thing ${i}`, about: "A thing.", concepts: ["thing"], hand: "line", shape: "square",
    });
    const list = [...Array.from({ length: 30 }, (_, i) => make(i, "food and drink")), ...Array.from({ length: 5 }, (_, i) => make(100 + i, "tech and screens"))];
    const p = newProject(crypto.randomUUID(), "x", "y");
    expect(visualCatalogue(p, "x", list, 5)[0]).toMatch(/^v-0/);
    const lifted = visualCatalogue(p, "x", list, 5, designerMap.ui.visualCategories);
    expect(lifted.every((l) => l.startsWith("v-10"))).toBe(true);
  });
});

describe("the assistant speaks as the chosen designer", () => {
  const { query } = vi.hoisted(() => ({ query: vi.fn() }));
  vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
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
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const reply = { rationale: "Warmer ground.", cites: [], patch: { canvasColor: "#F3E6D0" } };
  const ask = async (extra: Record<string, unknown>, intent: string) => {
    const { executeCreative } = await import("../server/creative/service");
    vi.stubEnv("INFERHUB_API_KEY", "test-key");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(reply) } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const out = await executeCreative("h", "proposal.request", { projectId: record.id, intent, ...extra });
    const sent = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, { body: string }])[1].body);
    return { out, system: sent.messages[0].content as string, made: record.document.proposals.at(-1) };
  };

  it("uses the designer the artist picked, and records it on the suggestion", async () => {
    const { out, system, made } = await ask({ specialist: "motion" }, "a warmer ground");
    expect(out.ok).toBe(true);
    expect(system).toContain("working as the Motion designer");
    expect(made?.specialist).toBe("motion");
  });

  it("lets Auto read the request when none is picked", async () => {
    const { system, made } = await ask({}, "add a logo and a wordmark on a warmer ground");
    expect(system).toContain("working as the Brand identity designer");
    expect(made?.specialist).toBe("brand");
  });

  it("claims no designer when no model was called", async () => {
    const { executeCreative } = await import("../server/creative/service");
    const out = await executeCreative("h", "proposal.request", { projectId: record.id, intent: "make it warm", specialist: "ui" });
    expect(out.ok).toBe(true);
    expect(record.document.proposals.at(-1)?.specialist).toBeUndefined();
    expect(record.document.proposals.at(-1)?.provenance).toMatch(/no (usable )?model/i);
  });
});

describe("the designer who answered stays shown", () => {
  it("keeps the last request's designer after the box clears, until the next request or a pick", () => {
    const editor = readFileSync("src/creative/Editor.tsx", "utf8");
    expect(editor).toContain("setLastDesigner(designer)");
    expect(editor).toMatch(/pickedDesigner \?\? \(intent\.trim\(\) \|\| !lastDesigner \? chooseSpecialist\(/);
  });
});
