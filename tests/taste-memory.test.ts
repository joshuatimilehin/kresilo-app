import { beforeEach, describe, expect, it, vi } from "vitest";
import { newProject, type Suggestion } from "../src/creative/contracts";
import { buildDesignContext } from "../server/creative/context";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

const id = "11111111-2222-4333-8444-555555555555";
const q = (pid: string, status: Suggestion["status"], extra: Partial<Suggestion> = {}): Suggestion =>
  ({ id: pid, intent: `ask ${pid.slice(-1)}`, rationale: "r", cites: [], patch: {}, baseVersion: 1, status, provenance: "t", ...extra }) as Suggestion;
const declined = "22222222-2222-4333-8444-555555555551";
const approved = "22222222-2222-4333-8444-555555555552";

describe("what the assistant learns from turned-down suggestions", () => {
  it("leaves forgotten suggestions out of the model's context", () => {
    const p = newProject(id, "b", "T", "culture-cover");
    p.proposals = [q(declined, "declined"), q("22222222-2222-4333-8444-555555555553", "declined", { forgotten: true })];
    const ctx = buildDesignContext(p, { intent: "x" });
    expect(ctx.artistTurnedDown.map((d) => d.asked)).toEqual(["ask 1"]);
  });

  describe("the forget command", () => {
    let saved: { proposals: Suggestion[] } | null;
    beforeEach(() => {
      saved = null;
      query.mockReset();
      query.mockImplementation(async (name: string, params: unknown[]) => {
        if (name === "creative_open") return { person: { name: "Ayo" }, projects: [] };
        if (name === "creative_get") {
          const p = newProject(id, "b", "T", "culture-cover");
          p.proposals = [q(declined, "declined"), q(approved, "approved")];
          return { id, revision: 1, owner: true, document: p };
        }
        if (name === "creative_save") {
          saved = params.find((x) => x && typeof x === "object" && "proposals" in (x as object)) as never;
          return { id, revision: 2, owner: true, document: saved };
        }
        return {};
      });
    });

    it("forgets a declined suggestion", async () => {
      expect((await executeCreative("h", "proposal.forget", { projectId: id, proposalId: declined })).ok).toBe(true);
      expect(saved?.proposals.find((x) => x.id === declined)?.forgotten).toBe(true);
    });

    it("refuses anything that was not declined", async () => {
      const r = await executeCreative("h", "proposal.forget", { projectId: id, proposalId: approved });
      expect(r.ok === false && r.code).toBe("NOT_FOUND");
    });
  });
});
