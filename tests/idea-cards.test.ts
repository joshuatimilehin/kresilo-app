import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { commands } from "../src/creative/contracts";
import { caseStudies } from "../src/creative/portfolio";
import { openBoards } from "../src/creative/openBoards";
import { boardIdeaTarget, caseIdeaTarget, checkIdea, clamp01, IDEA_MAX, isIdeaTarget, openToIdeas, parseIdeas, spotOf } from "../src/creative/ideaCards";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

const root = join(__dirname, "..");
const sql = readFileSync(join(root, "db", "migrations", "015_idea_cards.sql"), "utf8");
const store = readFileSync(join(root, "server", "creative", "store.ts"), "utf8");
const idea = { target: "b-abcdef12", panel: 0, x: 0.25, y: 0.5, text: "Try a warmer red" };

describe("idea cards", () => {
  beforeEach(() => {
    query.mockReset();
    query.mockImplementation(async (name: string) => (name === "creative_open" ? { person: { name: "Ayo" }, projects: [] } : {}));
  });

  it("are strict about their input", () => {
    expect(commands["idea.add"].safeParse(idea).success).toBe(true);
    expect(commands["idea.add"].safeParse({ ...idea, x: 1.2 }).success).toBe(false);
    expect(commands["idea.add"].safeParse({ ...idea, panel: 20 }).success).toBe(false);
    expect(commands["idea.add"].safeParse({ ...idea, text: " " }).success).toBe(false);
    expect(commands["idea.add"].safeParse({ ...idea, text: "x".repeat(IDEA_MAX + 1) }).success).toBe(false);
    expect(commands["idea.add"].safeParse({ ...idea, target: "../etc" }).success).toBe(false);
    expect(commands["idea.add"].safeParse({ ...idea, picture: "not-a-reference" }).success).toBe(false);
    expect(commands["idea.add"].safeParse({ ...idea, authorId: "someone" }).success).toBe(false);
    expect(commands["idea.answer"].safeParse({ id: "11111111-1111-4111-8111-111111111111", decision: "accept" }).success).toBe(true);
    expect(commands["idea.answer"].safeParse({ id: "11111111-1111-4111-8111-111111111111", decision: "delete" }).success).toBe(false);
  });

  it("pin an idea for the signed-in person on a hosted board, a curated board or a case study", async () => {
    for (const target of [idea.target, boardIdeaTarget(openBoards[0].id), caseIdeaTarget(caseStudies[0].id)]) {
      query.mockClear();
      expect((await executeCreative("h", "idea.add", { ...idea, target })).ok, target).toBe(true);
      const call = query.mock.calls.find((c) => c[0] === "creative_idea_add")!;
      expect([call[1][0], call[1][2], call[1][3], call[1][4], call[1][5], call[1][6]]).toEqual(["h", target, 0, 0.25, 0.5, "Try a warmer red"]);
    }
  });

  it("refuse a target that is not there, and a picture this server did not sign", async () => {
    expect((await executeCreative("h", "idea.add", { ...idea, target: "case-no-such-case" })).ok).toBe(false);
    expect((await executeCreative("h", "idea.add", { ...idea, picture: "11111111-1111-4111-8111-111111111111." + "0".repeat(32) })).ok).toBe(false);
    expect(query.mock.calls.some((c) => c[0] === "creative_idea_add")).toBe(false);
  });

  it("are answered, and taken back, through the session", async () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect((await executeCreative("h", "idea.answer", { id, decision: "reply", reply: "Which red?" })).ok).toBe(true);
    expect(query.mock.calls.find((c) => c[0] === "creative_idea_answer")![1]).toEqual(["h", id, "reply", "Which red?"]);
    expect((await executeCreative("h", "idea.remove", { id })).ok).toBe(true);
    expect(query.mock.calls.find((c) => c[0] === "creative_idea_remove")![1]).toEqual(["h", id]);
  });
});

describe("where an idea may sit", () => {
  it("names real things only", () => {
    expect(isIdeaTarget(caseIdeaTarget(caseStudies[0].id))).toBe(true);
    expect(isIdeaTarget(boardIdeaTarget(openBoards[0].id))).toBe(true);
    expect(isIdeaTarget("b-abcdef12")).toBe(true);
    expect(isIdeaTarget("case-nope")).toBe(false);
    expect(isIdeaTarget("board-nope")).toBe(false);
    expect(isIdeaTarget("Board-X")).toBe(false);
  });

  it("is open to everyone on curated projects that have an open board, and private on the rest", () => {
    expect(openToIdeas(boardIdeaTarget(openBoards[0].id))).toBe(true);
    expect(openToIdeas(caseIdeaTarget(openBoards[0].projectId))).toBe(true);
    const closed = caseStudies.find((c) => !openBoards.some((b) => b.projectId === c.id));
    expect(closed).toBeDefined();
    expect(openToIdeas(caseIdeaTarget(closed!.id))).toBe(false);
    expect(openToIdeas("b-abcdef12")).toBe(false);
  });
});

describe("the spot of an idea", () => {
  it("is a fraction of the picture, kept inside it", () => {
    const box = { left: 100, top: 50, width: 200, height: 100 };
    expect(spotOf(200, 100, box)).toEqual({ x: 0.5, y: 0.5 });
    expect(spotOf(0, 0, box)).toEqual({ x: 0, y: 0 });
    expect(spotOf(900, 900, box)).toEqual({ x: 1, y: 1 });
    expect(clamp01(NaN)).toBe(0);
  });

  it("needs a note within the limit", () => {
    expect(checkIdea("  Bigger label ")).toEqual({ ok: true, text: "Bigger label" });
    expect(checkIdea("   ").ok).toBe(false);
    expect(checkIdea("x".repeat(IDEA_MAX + 1)).ok).toBe(false);
  });

  it("trusts only a well-formed ideas reply", () => {
    expect(parseIdeas(undefined)).toEqual({ host: false, public: false, ideas: [], credits: [] });
    const good = { id: "a", text: "t", x: 0.1, y: 0.2 };
    expect(parseIdeas({ host: true, public: true, ideas: [good, { id: 1 }], credits: [{ name: "Ann", ideas: 2 }, 5] })).toEqual({ host: true, public: true, ideas: [good], credits: [{ name: "Ann", ideas: 2 }] });
  });
});

describe("migration 015", () => {
  it("is additive and keeps its runtime objects in kresilo_demo", () => {
    expect(sql).not.toMatch(/DROP |TRUNCATE|DELETE FROM/i);
    expect(sql.match(/CREATE TABLE IF NOT EXISTS (\S+)/g)!.every((t) => t.includes("kresilo_demo."))).toBe(true);
  });

  it("lets only a board's host accept, decline or reply, and keeps declined ideas from the public", () => {
    expect(sql.slice(sql.indexOf("creative_idea_answer"))).toMatch(/b\.host_id=v_person AND b\.closed_at IS NULL/);
    expect(sql).toMatch(/v_open AND c\.state IN \('open','accepted'\)/);
    expect(sql).toMatch(/c\.author_id=v_person OR v_person=v_host/);
  });

  it("is reachable only through the allowlisted storage functions", () => {
    for (const fn of ["creative_idea_add", "creative_ideas_list", "creative_idea_answer", "creative_idea_remove"]) {
      expect(sql).toContain(`kresilo_demo.${fn}(`);
      expect(store).toContain(fn);
    }
  });
});
