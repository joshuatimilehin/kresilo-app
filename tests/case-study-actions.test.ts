import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { commands, creativeFailure } from "../src/creative/contracts";
import { creatorFor, works } from "../src/creative/catalog";
import { caseStudies, projectById } from "../src/creative/portfolio";
import { caseCommentId, isCommentableId } from "../src/creative/commentTargets";
import { caseCommentSeeds, commentSeedsFor, workCommentSeeds } from "../src/creative/workCommentSeeds";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

const read = (...p: string[]) => readFileSync(join(__dirname, "..", ...p), "utf8");
const project = caseStudies[0];

describe("what can take comments", () => {
  it("accepts catalog works and case studies as case-<id>", () => {
    expect(isCommentableId(works[0].id)).toBe(true);
    expect(isCommentableId(caseCommentId(project.id))).toBe(true);
    for (const c of caseStudies) expect(isCommentableId(caseCommentId(c.id)), c.id).toBe(true);
  });

  it("refuses unknown, unprefixed and malformed ids", () => {
    expect(isCommentableId("case-no-such-project")).toBe(false);
    expect(isCommentableId("no-such-work")).toBe(false);
    expect(isCommentableId("case-")).toBe(false);
    expect(isCommentableId(`case-${project.id.toUpperCase()}`)).toBe(false);
    expect(isCommentableId(`case-${project.id}/../x`)).toBe(false);
    // A case study's bare id is not a target unless a work happens to share it.
    if (!works.some((w) => w.id === project.id)) expect(isCommentableId(project.id)).toBe(false);
  });

  it("keeps every case id inside the store's id rule", () => {
    for (const c of caseStudies) expect(caseCommentId(c.id)).toMatch(/^[a-z0-9-]{1,80}$/);
  });

  it("is the one check in both the route and the command service", () => {
    expect(read("server", "routes", "api", "work-comments", "[id].get.ts")).toContain("isCommentableId(id)");
    expect(read("server", "creative", "service.ts")).toContain("isCommentableId(");
  });
});

describe("case study comments through the work-comments store", () => {
  beforeEach(() => {
    query.mockReset();
    query.mockImplementation(async (name: string) => {
      if (name === "creative_open") return { person: { name: "Ayo Bello" }, projects: [] };
      return {};
    });
  });

  it("adds and removes with the case-<id> key", async () => {
    const id = caseCommentId(project.id);
    expect((await executeCreative("h", "work.comment.add", { workId: id, text: "Lovely" })).ok).toBe(true);
    const add = query.mock.calls.find((c) => c[0] === "creative_work_comment_add")!;
    expect(add[1][1]).toBe(id);
    const comment = "11111111-2222-4333-8444-555555555555";
    expect((await executeCreative("h", "work.comment.remove", { workId: id, commentId: comment })).ok).toBe(true);
    expect(query.mock.calls.find((c) => c[0] === "creative_work_comment_remove")![1]).toEqual(["h", id, comment]);
  });

  it("refuses a case study that does not exist without touching storage", async () => {
    const r = await executeCreative("h", "work.comment.add", { workId: "case-no-such-project", text: "Hi" });
    expect(r).toEqual(creativeFailure("NOT_FOUND"));
    expect(query.mock.calls.some((c) => c[0] === "creative_work_comment_add")).toBe(false);
  });
});

describe("saving a case study", () => {
  it("is a case:<id> entry in the person's Saved list", () => {
    expect(commands["profile.update"].safeParse({ saved: [`case:${project.id}`] }).success).toBe(true);
    expect(commands["profile.update"].safeParse({ saved: ["case:Not An Id"] }).success).toBe(false);
    expect(commands["profile.update"].safeParse({ saved: [`project:${project.id}`] }).success).toBe(false);
  });

  it("shows on the profile's Saved list", () => {
    // The saved cards are one shared piece, used by the profile and by a public moodboard.
    const cards = read("src", "creative", "SavedItems.tsx");
    expect(cards).toMatch(/kind === "case"/);
    expect(cards).toContain("me-saved-case");
    expect(read("src", "creative", "Workspace.tsx")).toContain("<SavedItems");
  });

  it("puts save, comments, share and follow on the case page", () => {
    const page = read("src", "creative", "portfolio", "Pages.tsx");
    const cas = page.slice(page.indexOf("export function CasePage"), page.indexOf("export function AssetPage"));
    expect(cas).toContain("<SaveToggle item={`case:${project.id}`}");
    expect(cas).toContain("<FollowToggle");
    expect(cas).toContain("<ShareSheet");
    expect(cas).toContain("/case/${project.id}");
    expect(cas).toContain("<CommentsSheet targetId={target}");
  });
});

describe("makers' words on case studies", () => {
  it("come from roster makers, never the project's own maker", () => {
    for (const [id, list] of Object.entries(caseCommentSeeds)) {
      const p = projectById(id);
      expect(p, id).toBeDefined();
      for (const c of list) {
        expect(creatorFor(c.by), `${id} ${c.by}`).toBeDefined();
        expect(c.by, id).not.toBe(p?.makerId);
        expect(c.text.length).toBeLessThan(200);
      }
    }
  });

  it("are found by comment target", () => {
    const [caseId, list] = Object.entries(caseCommentSeeds)[0];
    expect(commentSeedsFor(caseCommentId(caseId))).toBe(list);
    const [workId, words] = Object.entries(workCommentSeeds)[0];
    expect(commentSeedsFor(workId)).toBe(words);
    expect(commentSeedsFor("case-no-such-project")).toEqual([]);
  });
});
