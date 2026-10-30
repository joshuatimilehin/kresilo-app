import { afterEach, describe, expect, it, vi } from "vitest";
import {
  commands,
  newProject,
  publicProject,
  recordVersion,
} from "../src/creative/contracts";
import { draftCreativeProposal } from "../server/creative/assistant";
const projectId = "00000000-0000-4000-8000-000000000001";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("creative command boundaries", () => {
  it("rejects client ownership claims and unknown fields", () => {
    expect(
      commands["project.create"].safeParse({
        brief: "A poster",
        owner: "someone-else",
      }).success,
    ).toBe(false);
    expect(
      commands["profile.update"].safeParse({ google_subject: "forged" })
        .success,
    ).toBe(false);
  });
  it("rejects empty reasons and executable artwork values", () => {
    expect(
      commands["reference.carry"].safeParse({
        projectId,
        workId: "after-light",
        reason: "   ",
      }).success,
    ).toBe(false);
    expect(
      commands["artwork.edit"].safeParse({
        projectId,
        revision: 1,
        patch: { color: "url(javascript:alert(1))" },
      }).success,
    ).toBe(false);
  });
  it("does not expose project internals in a publication", () => {
    // A title of its own: a project started from a brief alone takes its title from the brief.
    const p = newProject(projectId, "Private brief", "Evening study");
    // Words on the canvas are published as drawn, the first layout's line from
    // the brief included (the artist sees and can remove it); this checks what is behind them.
    p.art.marks = p.art.marks?.filter((m) => m.kind !== "text");
    p.references.push({
      id: "private-reference",
      workId: "after-light",
      title: "After light",
      creator: "Ayo Bello",
      source: "/work/after-light",
      reason: "Private saved reason",
      asset: "after-light",
      tags: ["light"],
    });
    p.comments.push({
      id: "private-comment",
      text: "Private comment",
      author: "You",
      at: "now",
      resolved: false,
    });
    // Saved reasons are shown by default (owner direction, Oct 22, 2026); the
    // designer can hide them, and the brief, comments and ids stay private.
    const published = publicProject(p, "Public caption", "You", {
      reasons: false,
    });
    const json = JSON.stringify(published);
    expect(json).not.toContain("Private");
    expect(json).not.toContain("private-reference");
    const withReasons = JSON.stringify(publicProject(p, "Public caption", "You"));
    expect(withReasons).toContain("Private saved reason");
    expect(withReasons).not.toContain("Private brief");
    expect(withReasons).not.toContain("Private comment");
    expect(withReasons).not.toContain("private-reference");
    expect(published.credits).toEqual([
      {
        title: "After light",
        creator: "Ayo Bello",
        source: "/work/after-light",
      },
    ]);
  });
  it("copies version snapshots so later edits cannot rewrite history", () => {
    const p = newProject(projectId, "A study");
    const first = structuredClone(p.versions[0]);
    p.art.title = "New words";
    recordVersion(p, "Manual edit");
    p.art.title = "Another edit";
    expect(p.versions[0]).toEqual(first);
    expect(p.versions[1].art.title).toBe("New words");
  });
});
describe("model grounding", () => {
  it.each(["cut", "type", "collage"])(
    "keeps a grounded %s motion proposal unapplied",
    async (movement) => {
      vi.stubEnv("INFERHUB_API_KEY", "test-only-not-a-real-key");
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue({
            ok: true,
            json: async () => ({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      rationale:
                        "The saved graphic rhythm supports a quicker sequence.",
                      cites: ["saved-reference"],
                      patch: {},
                      motion: { movement, seconds: 4, loop: true },
                    }),
                  },
                },
              ],
            }),
          }),
      );
      const p = newProject(projectId, "A graphic motion study");
      p.references.push({
        id: "saved-reference",
        workId: "different-angles",
        title: "Different angles",
        creator: "Ayo Bello",
        source: "/work/different-angles",
        reason: "Graphic rhythm",
        asset: "culture-type",
        tags: ["type"],
      });
      const before = structuredClone(p);
      const result = await draftCreativeProposal(
        p,
        "Make the rhythm faster",
        "test-hash",
      );
      expect(result.motion).toEqual({ movement, seconds: 4, loop: true });
      expect(result.provenance).not.toMatch(/^Prototype guidance/);
      expect(p).toEqual(before);
    },
  );
  it("refuses a reply whose only citation is made up, and changes nothing", async () => {
    vi.stubEnv("INFERHUB_API_KEY", "test-only-not-a-real-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  rationale: "A fabricated source supports this change.",
                  cites: ["not-in-project"],
                  patch: { color: "#123456" },
                }),
              },
            },
          ],
        }),
      }),
    );
    const p = newProject(projectId, "A light study");
    p.references.push({
      id: "saved-reference",
      workId: "after-light",
      title: "After light",
      creator: "Ayo Bello",
      source: "/work/after-light",
      reason: "Warm light",
      asset: "after-light",
      tags: ["light"],
    });
    const before = structuredClone(p.art);
    await expect(draftCreativeProposal(p, "A warmer title", "test-hash")).rejects.toThrow("AI_UNAVAILABLE");
    expect(p.art).toEqual(before);
  });
  it("accepts a citation given as the reference's title", async () => {
    vi.stubEnv("INFERHUB_API_KEY", "test-only-not-a-real-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ rationale: "Warmer title, as in After light.", cites: ["After light"], patch: { color: "#f1c3a6" } }) } }],
        }),
      }),
    );
    const p = newProject(projectId, "A light study");
    p.references.push({ id: "saved-reference", workId: "after-light", title: "After light", creator: "Ayo Bello", source: "/work/after-light", reason: "Warm light", asset: "after-light", tags: ["light"] });
    const suggestion = await draftCreativeProposal(p, "A warmer title", "test-hash");
    expect(suggestion.cites).toEqual(["saved-reference"]);
    expect(suggestion.patch).toMatchObject({ color: "#f1c3a6" });
  });
  it("keeps unavailable-model guidance separate from live-model claims", async () => {
    vi.stubEnv("INFERHUB_API_KEY", "");
    const p = newProject(projectId, "A study");
    p.references.push({
      id: "saved-reference",
      workId: "after-light",
      title: "After light",
      creator: "Ayo Bello",
      source: "/work/after-light",
      reason: "Quiet spacing",
      asset: "after-light",
      tags: [],
    });
    expect(
      (await draftCreativeProposal(p, "Smaller words", "test-hash")).provenance,
    ).toMatch(/^Prototype guidance/);
  });
});
