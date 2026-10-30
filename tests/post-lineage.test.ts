import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  authorshipSteps,
  authorshipSummary,
  toolFromProvenance,
} from "../src/creative/authorship";
import { buildLineage } from "../src/creative/lineage";
import {
  commands,
  newProject,
  publicProject,
  recordVersion,
  type Project,
  type ProjectRecord,
  type Suggestion,
} from "../src/creative/contracts";
import { asReference } from "../src/creative/catalog";

const ID = () => crypto.randomUUID();
const PRESET =
  "Prototype guidance · preset prompt controls · no model called · review before applying";
const FALLBACK =
  "Prototype guidance · no usable model response · no artwork changed";
const MODEL =
  "acme-model-1 · project references and saved reasons · review before applying";

function proposal(p: Project, over: Partial<Suggestion> = {}): Suggestion {
  return {
    id: ID(),
    intent: "Quieter title",
    rationale: "A quieter title gives the reference room.",
    cites: [p.references[0]?.id ?? ID()],
    patch: { size: 19 },
    baseVersion: p.versions.length,
    status: "proposed",
    provenance: MODEL,
    ...over,
  };
}
/** Mirrors what proposal.accept does in the command service. */
function approve(p: Project, q: Suggestion) {
  p.art = { ...p.art, ...q.patch };
  recordVersion(p, q.intent);
  p.decisions.push({
    id: ID(),
    title: q.intent,
    reason: q.rationale,
    cites: q.cites,
    version: p.versions.length,
  });
  q.status = "approved";
}
function base(): Project {
  const p = newProject(ID(), "A private brief about grief", "Study");
  p.references.push(asReference("tidal-lines", "Keep the flowing lines")!);
  return p;
}
const hand = (
  p: Project,
  patch: Partial<Project["art"]> = { color: "#222222" },
) => {
  p.art = { ...p.art, ...patch };
  recordVersion(p, "Edited by hand");
};

describe("authorship: classifying each saved version", () => {
  it("treats the start of the project as nothing to attribute", () => {
    expect(authorshipSteps(base())).toEqual([]);
  });

  it("labels the person's own edits as hand, with no tool", () => {
    const p = base();
    hand(p);
    p.motion = { ...p.motion, movement: "rise" };
    recordVersion(p, "Adjusted motion");
    const steps = authorshipSteps(p);
    expect(steps.map((s) => s.origin)).toEqual(["hand", "hand"]);
    expect(steps.every((s) => s.tool === undefined)).toBe(true);
    expect(steps[0].summary).toBe("Changed the colour");
    expect(steps[1].summary).toBe("Adjusted the motion");
    expect(steps.map((s) => [s.step, s.version])).toEqual([
      [1, 2],
      [2, 3],
    ]);
  });

  it("labels an approved proposal AI-assisted and names the model", () => {
    const p = base();
    const q = proposal(p);
    p.proposals.push(q);
    approve(p, q);
    const [s] = authorshipSteps(p);
    expect(s).toMatchObject({
      origin: "ai-assisted",
      tool: "acme-model-1",
      summary: "Quieter title",
      version: 2,
    });
  });

  it("names the preset controls and the rule-based fallback", () => {
    expect(toolFromProvenance(PRESET)).toBe("Preset prompt controls");
    expect(toolFromProvenance(FALLBACK)).toBe("Copilot rules");
    expect(toolFromProvenance(MODEL)).toBe("acme-model-1");
    expect(toolFromProvenance("")).toBe("Unknown AI tool");
    expect(toolFromProvenance(undefined)).toBe("Unknown AI tool");
  });

  it("labels a proposal that added layers AI-generated", () => {
    const p = base();
    const layer = {
      id: ID(),
      name: "New",
      asset: "mineral" as const,
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      opacity: 1,
      rotation: 0,
      visible: true,
      filter: "none" as const,
    };
    const q = proposal(p, {
      intent: "Add texture",
      patch: { layers: [layer] },
      provenance: PRESET,
    });
    p.proposals.push(q);
    approve(p, q);
    expect(authorshipSteps(p)[0]).toMatchObject({
      origin: "ai-generated",
      tool: "Preset prompt controls",
    });
  });

  it("labels a change applied with no review AI-generated, even without a proposal record", () => {
    const p = base();
    p.art = { ...p.art, size: 20 };
    recordVersion(p, "AI applied: Make the title smaller");
    const [s] = authorshipSteps(p);
    expect(s.origin).toBe("ai-generated");
    expect(s.tool).toBe("Unknown AI tool");
    expect(s.summary).toBe("Make the title smaller");
    // With its proposal on file the tool is named.
    p.proposals.push(
      proposal(p, {
        intent: "Make the title smaller",
        status: "approved",
        provenance: PRESET,
      }),
    );
    expect(authorshipSteps(p)[0].tool).toBe("Preset prompt controls");
  });

  it("never labels an approved proposal as hand, and keeps order", () => {
    const p = base();
    hand(p);
    const q = proposal(p);
    p.proposals.push(q);
    approve(p, q);
    hand(p, { x: 10 });
    const steps = authorshipSteps(p);
    expect(steps.map((s) => s.origin)).toEqual(["hand", "ai-assisted", "hand"]);
    expect(steps.map((s) => s.version)).toEqual([2, 3, 4]);
  });

  it("skips declined proposals and undo, redo and restore steps", () => {
    const p = base();
    p.proposals.push(proposal(p, { status: "declined" }));
    hand(p);
    recordVersion(p, "Undo to version 1");
    recordVersion(p, "Redo to version 2");
    expect(authorshipSteps(p)).toHaveLength(1);
    // Restoring the start takes the hand edit out of the artwork, so it is not credited.
    recordVersion(p, "Restored version 1");
    expect(authorshipSteps(p)).toHaveLength(0);
  });
});

describe("authorship: the summary sentence", () => {
  it("counts steps, says estimate and shows its basis, with no percentage", () => {
    const p = base();
    hand(p);
    hand(p, { x: 9 });
    const q = proposal(p);
    p.proposals.push(q);
    approve(p, q);
    const s = authorshipSummary(authorshipSteps(p));
    expect(s).toMatchObject({
      total: 3,
      hand: 2,
      aiAssisted: 1,
      aiGenerated: 0,
    });
    expect(s.sentence).toContain("Estimate from 3 saved steps");
    expect(s.sentence).toContain("2 by hand");
    expect(s.sentence).toContain("1 AI-assisted");
    expect(s.sentence).not.toMatch(/%|percent/i);
    expect(s.basis).toMatch(/does not measure effort/);
  });

  it("says plainly when no AI was used, and when nothing was saved", () => {
    const p = base();
    hand(p);
    expect(authorshipSummary(authorshipSteps(p)).sentence).toContain(
      "no AI was used",
    );
    expect(authorshipSummary([]).sentence).toContain("nothing to attribute");
  });
});

describe("lineage", () => {
  it("lists kept references with creator, reason and a link only for known works", () => {
    const p = base();
    const own = asReference("tidal-lines", "x")!;
    own.workId = "not-in-catalog";
    own.title = "Elsewhere";
    p.references.push(own);
    const entries = buildLineage(p);
    expect(entries[0]).toMatchObject({
      title: "Tidal lines",
      workId: "tidal-lines",
      reason: "Keep the flowing lines",
      disclosed: true,
      removed: false,
    });
    expect(entries[0].creator).toBeTruthy();
    expect(entries[1].workId).toBeUndefined();
  });

  it("keeps archived references a decision relied on and drops the rest", () => {
    const p = base();
    const a = {
      ...p.references[0],
      id: ID(),
      workId: "tidal-lines-b",
      title: "Relied on",
    };
    const b = {
      ...p.references[0],
      id: ID(),
      workId: "tidal-lines-c",
      title: "Not relied on",
    };
    p.referenceArchive = [a, b];
    p.decisions.push({
      id: ID(),
      title: "t",
      reason: "r",
      cites: [a.id],
      version: 2,
    });
    expect(buildLineage(p).map((e) => [e.title, e.removed])).toEqual([
      ["Tidal lines", false],
      ["Relied on", true],
    ]);
  });

  it("hides a reason but never the creator credit", () => {
    const p = base();
    const entries = buildLineage(p, { hideReasonFor: [p.references[0].id] });
    expect(entries[0]).toMatchObject({ disclosed: false });
    expect(entries[0]).not.toHaveProperty("reason");
    expect(entries[0].creator).toBe(p.references[0].creator);
    const none = buildLineage(p, { showReasons: false });
    expect(none[0].disclosed).toBe(false);
    expect(JSON.stringify(none)).not.toContain("flowing lines");
  });

  it("never lists imported private files", () => {
    const p = base();
    p.references.push({
      ...p.references[0],
      id: ID(),
      workId: ID(),
      mediaId: ID(),
      reason: "secret",
    });
    expect(buildLineage(p)).toHaveLength(1);
  });
});

describe("publicProject: public-safe payload", () => {
  function story() {
    const p = base();
    p.comments.push({
      id: ID(),
      text: "PRIVATE COMMENT",
      author: "Friend",
      at: "",
      resolved: false,
    });
    p.history.push({
      id: ID(),
      summary: "PRIVATE HISTORY",
      at: "",
      actor: "Guest",
    });
    const q = proposal(p, {
      rationale:
        "Using “Tidal lines” because you saved it for “Keep the flowing lines”.",
    });
    const declined = proposal(p, {
      intent: "Try neon",
      rationale: "Neon is loud.",
      status: "declined",
      provenance: PRESET,
    });
    p.proposals.push(q, declined);
    hand(p);
    approve(p, q);
    return p;
  }

  it("carries lineage, decisions and authorship but no ids, notes or the brief", () => {
    const p = story();
    const out = publicProject(p, "About", "Guest");
    const json = JSON.stringify(out);
    for (const secret of [
      p.id,
      p.references[0].id,
      p.proposals[0].id,
      p.versions[1].id,
      p.decisions[0].id,
      "PRIVATE COMMENT",
      "PRIVATE HISTORY",
      "A private brief about grief",
    ])
      expect(json).not.toContain(secret);
    expect(out.lineage[0].title).toBe("Tidal lines");
    expect(out.decisions[0]).toMatchObject({
      title: "Quieter title",
      relied: ["Tidal lines"],
    });
    expect(out.authorship?.steps.map((s) => s.origin)).toEqual([
      "hand",
      "ai-assisted",
    ]);
    expect(out.disclosure).toEqual({
      reasons: true,
      declined: false,
      authorship: true,
      comments: true,
      sensitive: false,
    });
  });

  it("hides declined directions by default and shows them only when chosen", () => {
    const p = story();
    const off = publicProject(p, "About", "Guest");
    expect(off.declined).toBeUndefined();
    expect(JSON.stringify(off)).not.toContain("Try neon");
    const on = publicProject(p, "About", "Guest", { declined: true });
    expect(on.declined).toEqual([
      {
        intent: "Try neon",
        rationale: "Neon is loud.",
      },
    ]);
  });

  it("omits the strip when the designer turns it off", () => {
    const out = publicProject(story(), "About", "Guest", { authorship: false });
    expect(out.authorship).toBeUndefined();
    expect(out.disclosure.authorship).toBe(false);
  });

  it("redacts a hidden reason from the decision text that quotes it", () => {
    const p = story();
    const shown = publicProject(p, "About", "Guest");
    expect(JSON.stringify(shown.decisions)).toContain("Keep the flowing lines");
    const hiddenOne = publicProject(p, "About", "Guest", {
      hideReasonFor: [p.references[0].id],
    });
    expect(JSON.stringify(hiddenOne)).not.toContain("Keep the flowing lines");
    const none = publicProject(p, "About", "Guest", { reasons: false });
    expect(JSON.stringify(none)).not.toContain("Keep the flowing lines");
    expect(none.lineage[0].creator).toBeTruthy();
  });

  it("keeps the older credit list for existing readers", () => {
    const out = publicProject(story(), "About", "Guest");
    expect(out.credits).toEqual([
      expect.objectContaining({
        title: "Tidal lines",
        source: "/work/tidal-lines",
      }),
    ]);
  });
});

describe("publication.create: disclosure choices", () => {
  it("accepts the choices, fills defaults and rejects unknown keys", () => {
    const input = {
      projectId: ID(),
      revision: 1,
      audience: "private",
      description: "x",
    };
    const schema = commands["publication.create"];
    const ok = schema.safeParse({ ...input, disclosure: { declined: true } });
    expect(ok.success && ok.data.disclosure).toEqual({
      reasons: true,
      declined: true,
      authorship: true,
      comments: true,
      sensitive: false,
      hideReasonFor: [],
    });
    expect(schema.safeParse(input).success).toBe(true);
    expect(
      schema.safeParse({ ...input, disclosure: { extra: 1 } }).success,
    ).toBe(false);
    expect(
      schema.safeParse({ ...input, disclosure: { hideReasonFor: ["nope"] } })
        .success,
    ).toBe(false);
  });
});

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

describe("publication.create: the command service", () => {
  let record: ProjectRecord;
  let published: unknown[];
  beforeEach(() => {
    const doc = base();
    const q = proposal(doc);
    doc.proposals.push(q);
    approve(doc, q);
    record = { id: doc.id, revision: 3, owner: true, document: doc };
    published = [];
    query.mockReset();
    query.mockImplementation(async (name: string, args: unknown[]) => {
      if (name === "creative_open")
        return {
          person: { name: "Guest", mode: "explorer" },
          projects: [record],
        };
      if (name === "creative_get") return structuredClone(record);
      if (name === "creative_publish") {
        published = args;
        return { id: args[3] };
      }
      throw new Error(`Unexpected storage call ${name}`);
    });
  });

  it("stores the story with default choices", async () => {
    const r = await executeCreative("h", "publication.create", {
      projectId: record.id,
      revision: 3,
      audience: "private",
      description: "About",
    });
    expect(r.ok && r.url).toMatch(/^\/p\//);
    const doc = published[5] as ReturnType<typeof publicProject>;
    expect(doc.disclosure).toEqual({
      reasons: true,
      declined: false,
      authorship: true,
      comments: true,
      sensitive: false,
    });
    expect(doc.authorship?.steps[0]).toMatchObject({ origin: "ai-assisted" });
    // The public story never names the model or provider that made a suggestion.
    expect(doc.authorship?.steps[0]).not.toHaveProperty("tool");
    expect(JSON.stringify(doc)).not.toContain("acme-model-1");
    expect(doc.lineage[0].reason).toBe("Keep the flowing lines");
  });

  it("honours the designer's choices", async () => {
    const r = await executeCreative("h", "publication.create", {
      projectId: record.id,
      revision: 3,
      audience: "community",
      description: "About",
      disclosure: { reasons: false, authorship: false, declined: true },
    });
    expect(r.ok).toBe(true);
    const doc = published[5] as ReturnType<typeof publicProject>;
    expect(doc.authorship).toBeUndefined();
    expect(doc.declined).toEqual([]);
    expect(doc.lineage[0].disclosed).toBe(false);
    expect(JSON.stringify(doc)).not.toContain("Keep the flowing lines");
  });
});

describe("Used in on a source work", () => {
  const post = (over: Record<string, unknown>) => ({
    id: crypto.randomUUID(),
    creator: "Ayo",
    art: { title: "After light\nin the market" },
    ...over,
  });
  it("lists community posts that credit the work, from stored lineage or the credit link", async () => {
    const { usedIn } = await import("../src/creative/lineage");
    const a = post({ lineage: [{ workId: "tidal-lines", source: "/work/tidal-lines" }] });
    const b = post({ credits: [{ source: "/work/tidal-lines" }] });
    const other = post({ lineage: [{ workId: "mineral", source: "/work/mineral" }] });
    const out = usedIn([a, b, other], "tidal-lines");
    expect(out.map((o) => o.id)).toEqual([a.id, b.id]);
    expect(out[0]).toMatchObject({ title: "After light in the market", creator: "Ayo" });
  });

  it("never lists a private post or one without an id, and finds nothing for an unused work", async () => {
    const { usedIn } = await import("../src/creative/lineage");
    const lineage = [{ workId: "tidal-lines", source: "/work/tidal-lines" }];
    expect(usedIn([post({ lineage, audience: "private" })], "tidal-lines")).toEqual([]);
    expect(usedIn([post({ lineage, id: undefined })], "tidal-lines")).toEqual([]);
    expect(usedIn([post({ lineage })], "never-cited")).toEqual([]);
  });
});
