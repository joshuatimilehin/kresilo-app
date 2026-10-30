import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  commands,
  newProject,
  publicProject,
  recordVersion,
  stepVersion,
  type Project,
  type Suggestion,
} from "../src/creative/contracts";
import { authorshipSteps, authorshipSummary, versionPath } from "../src/creative/authorship";
import { publicCredit, withoutTools } from "../src/creative/publicStory";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

const sql = readFileSync(join(__dirname, "..", "db", "migrations", "012_publication_withdraw.sql"), "utf8");
const store = readFileSync(join(__dirname, "..", "server", "creative", "store.ts"), "utf8");
const pub = "11111111-2222-4333-8444-555555555555";
const MODEL = "ali/qwen3.8-omni-flash · project references and saved reasons · review before applying";

function approveAi(p: Project, intent: string, patch: Partial<Project["art"]>) {
  const q: Suggestion = {
    id: crypto.randomUUID(),
    intent,
    rationale: `Because ${intent.toLowerCase()} suits it.`,
    cites: [],
    patch,
    baseVersion: p.versions.length,
    status: "approved",
    provenance: MODEL,
  };
  p.proposals.push(q);
  p.art = { ...p.art, ...patch };
  recordVersion(p, intent);
  p.decisions.push({ id: crypto.randomUUID(), title: q.intent, reason: q.rationale, cites: [], version: p.versions.length });
}
function byHand(p: Project, patch: Partial<Project["art"]>) {
  p.art = { ...p.art, ...patch };
  recordVersion(p, "Edited by hand");
}

describe("the published story follows the published version", () => {
  it("leaves an undone AI change out of decisions and authorship", () => {
    const p = newProject(crypto.randomUUID(), "A bakery poster for Crumb & Co", "Crumb & Co");
    byHand(p, { color: "#222222" });
    approveAi(p, "Warmer colours", { color: "#aa5500" });
    stepVersion(p, "undo");
    expect(versionPath(p).map((v) => v.number)).toEqual([1, 2]);
    const out = publicProject(p, "A bakery poster for Crumb & Co", "Ayo");
    expect(out.decisions).toEqual([]);
    expect(out.authorship?.steps.map((s) => s.origin)).toEqual(["hand"]);
    expect(out.authorship?.summary.sentence).not.toContain("every saved step used AI");
    expect(out.authorship?.summary.sentence).toContain("no AI was used");
  });

  it("drops a branch left behind by an edit after undo, and keeps it once redone", () => {
    const p = newProject(crypto.randomUUID(), "Branching", "Branching");
    approveAi(p, "Bigger title", { size: 30 });
    stepVersion(p, "undo");
    stepVersion(p, "redo");
    expect(authorshipSteps(p).map((s) => s.origin)).toEqual(["ai-assisted"]);
    stepVersion(p, "undo");
    byHand(p, { x: 20 });
    expect(authorshipSteps(p).map((s) => s.origin)).toEqual(["hand"]);
    expect(authorshipSummary(authorshipSteps(p)).aiAssisted).toBe(0);
  });

  it("says what changed instead of repeating the brief", () => {
    const brief = "A bakery poster for Crumb & Co";
    const p = newProject(crypto.randomUUID(), brief, "Crumb & Co");
    approveAi(p, brief, { color: "#aa5500", size: 41 });
    const [step] = publicProject(p, brief, "Ayo").authorship!.steps;
    expect(step.summary).not.toBe(brief);
    expect(step.summary).toMatch(/^Changed the colour and type size/);
  });
});

describe("public pages never name a model or provider", () => {
  it("keeps model ids out of the public story", () => {
    const p = newProject(crypto.randomUUID(), "Poster", "Poster");
    approveAi(p, "Bigger title", { size: 30 });
    p.proposals.push({ ...p.proposals[0], id: crypto.randomUUID(), intent: "Try neon", status: "declined" });
    const out = publicProject(p, "About", "Ayo", { declined: true });
    const json = JSON.stringify(out);
    expect(json).not.toMatch(/qwen|ali\/|omni-flash/);
    expect(out.authorship?.steps[0]).not.toHaveProperty("tool");
    expect(out.declined?.[0]).toEqual({ intent: "Try neon", rationale: expect.any(String) });
  });

  it("strips model ids from posts published before they were kept out", () => {
    const old = {
      title: "Old",
      authorship: { steps: [{ step: 1, origin: "ai-assisted", tool: "ali/qwen3.8-omni-flash", summary: "x" }], summary: {} },
      declined: [{ intent: "Neon", rationale: "Loud", tool: "ali/qwen3.8-omni-flash" }],
    };
    const served = withoutTools(old);
    expect(JSON.stringify(served)).not.toContain("qwen");
    expect(served.authorship.steps[0]).toMatchObject({ origin: "ai-assisted", summary: "x" });
    expect(withoutTools({ title: "No story" })).toEqual({ title: "No story" });
  });

  it("credits a step to AI and the person who approved it", () => {
    expect(publicCredit("ai-assisted", "Ayo")).toBe("Suggested by AI, approved by Ayo");
    expect(publicCredit("hand", "Ayo")).toBe("Made by Ayo");
    expect(publicCredit("ai-generated", "Ayo")).toMatch(/^Made with AI/);
    const page = readFileSync(join(__dirname, "..", "src", "creative", "PublishedPost.tsx"), "utf8");
    expect(page).not.toMatch(/\.tool\b/);
  });
});

describe("withdrawing a post and changing its comments", () => {
  beforeEach(() => {
    query.mockReset();
    query.mockImplementation(async (name: string) => (name === "creative_open" ? { person: { name: "Ayo" }, projects: [] } : {}));
  });

  it("are strict about their input", () => {
    expect(commands["publication.withdraw"].safeParse({ publicationId: pub }).success).toBe(true);
    expect(commands["publication.withdraw"].safeParse({ publicationId: "nope" }).success).toBe(false);
    expect(commands["publication.withdraw"].safeParse({ publicationId: pub, owner: "x" }).success).toBe(false);
    expect(commands["publication.comments"].safeParse({ publicationId: pub, open: false }).success).toBe(true);
    expect(commands["publication.comments"].safeParse({ publicationId: pub, open: "yes" }).success).toBe(false);
  });

  it("go through their storage functions with the session", async () => {
    expect((await executeCreative("h", "publication.withdraw", { publicationId: pub })).ok).toBe(true);
    expect((await executeCreative("h", "publication.comments", { publicationId: pub, open: false })).ok).toBe(true);
    const calls = Object.fromEntries(query.mock.calls.filter((c) => String(c[0]).startsWith("creative_publication")).map((c) => [c[0], c[1]]));
    expect(calls.creative_publication_withdraw).toEqual(["h", pub]);
    expect(calls.creative_publication_comments).toEqual(["h", pub, false]);
  });

  it("report a post that is not theirs as not found", async () => {
    query.mockImplementation(async (name: string) => {
      if (name === "creative_open") return { person: { name: "Ayo" }, projects: [] };
      throw new Error("NOT_FOUND");
    });
    const r = await executeCreative("h", "publication.withdraw", { publicationId: pub });
    expect(r.ok).toBe(false);
    expect("code" in r && r.code).toBe("NOT_FOUND");
  });

  it("only the owner may withdraw or change comments, and withdrawn posts are gone for everyone", () => {
    for (const fn of ["creative_publication_withdraw", "creative_publication_comments"]) {
      const body = sql.slice(sql.indexOf(`kresilo_demo.${fn}(`));
      expect(body.slice(0, body.indexOf("END $$"))).toMatch(/pr\.owner_id=v_person/);
    }
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz/);
    expect(sql).toMatch(/SET withdrawn_at=now\(\)/);
    const pub = sql.slice(sql.indexOf("kresilo_demo.creative_public("));
    expect(pub.slice(0, pub.indexOf("$$;"))).toMatch(/withdrawn_at IS NULL/);
    const feed = sql.slice(sql.indexOf("kresilo_demo.creative_community("));
    expect(feed.slice(0, feed.indexOf("$$;"))).toMatch(/withdrawn_at IS NULL/);
    expect(sql).not.toMatch(/\bDROP\b|\bDELETE FROM kresilo_demo\.creative_publications/);
  });

  it("is reachable only through the allowlisted storage functions", () => {
    for (const fn of ["creative_publication_mine", "creative_publication_withdraw", "creative_publication_comments"]) {
      expect(sql).toContain(`kresilo_demo.${fn}(`);
      expect(store).toContain(fn);
    }
  });

  it("lets a person save a post", () => {
    expect(commands["profile.update"].safeParse({ saved: [`post:${pub}`] }).success).toBe(true);
    expect(commands["profile.update"].safeParse({ saved: ["post:../x"] }).success).toBe(false);
  });
});
