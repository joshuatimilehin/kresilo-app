import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { commands, competitionSchema } from "../src/creative/contracts";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";
import {
  canEnter,
  castVote,
  leaderOf,
  phaseOf,
  rankEntries,
  seedCompetitions,
  seedEntryMaker,
  seedView,
  timeLeft,
  voteVerdict,
  winnerOf,
  type Vote,
} from "../src/creative/competitionRules";
import { makerById } from "../src/creative/makers";
import { projectById } from "../src/creative/portfolio";

const sql = readFileSync(join(__dirname, "..", "db", "migrations", "016_competitions.sql"), "utf8");
const store = readFileSync(join(__dirname, "..", "server", "creative", "store.ts"), "utf8");
const uuid = "3f2a1b6c-9d4e-4f70-8a11-6cb0f0e2d111";
const competition = {
  id: "c-ab12cd34",
  title: "One light",
  prompt: "Make a poster lit by a single source.",
  rules: ["One poster"],
  opensAt: "2026-11-01T08:00:00.000Z",
  closesAt: "2026-11-30T18:00:00.000Z",
  projectId: "harbour-hours",
};
const T = (iso: string) => Date.parse(iso);

describe("competition phases", () => {
  it("are soon, open, ended and closed by the dates and the host", () => {
    expect(phaseOf(competition, "open", T("2026-10-31T00:00:00Z"))).toBe("soon");
    expect(phaseOf(competition, "open", T("2026-11-15T00:00:00Z"))).toBe("open");
    expect(phaseOf(competition, "open", T("2026-11-30T18:00:00Z"))).toBe("ended");
    expect(phaseOf(competition, "closed", T("2026-11-15T00:00:00Z"))).toBe("closed");
  });

  it("show the time left as one short figure", () => {
    expect(timeLeft(competition.closesAt, T("2026-11-17T18:00:00Z"))).toBe("13d");
    expect(timeLeft(competition.closesAt, T("2026-11-30T12:00:00Z"))).toBe("6h");
    expect(timeLeft(competition.closesAt, T("2026-11-30T17:30:00Z"))).toBe("30m");
    expect(timeLeft(competition.closesAt, T("2026-11-30T18:00:00Z"))).toBeNull();
  });
});

describe("voting rules", () => {
  const authors: Record<string, string> = { "e-1": "ana", "e-2": "bo" };
  const cast = (votes: Vote[], entry: string, voter: string, on = true, phase: "open" | "ended" | "closed" | "soon" = "open") =>
    castVote(votes, { entry, voter, on }, { phase, authorOf: (e) => authors[e] });

  it("take one vote per person per entry", () => {
    const first = cast([], "e-1", "bo");
    expect(first).toEqual({ ok: true, votes: [{ entry: "e-1", voter: "bo" }] });
    const again = first.ok ? cast(first.votes, "e-1", "bo") : first;
    expect(again).toEqual({ ok: false, code: "already" });
    const other = first.ok ? cast(first.votes, "e-1", "cy") : first;
    expect(other.ok && other.votes.length).toBe(2);
  });

  it("refuse a vote on your own entry", () => {
    expect(cast([], "e-1", "ana")).toEqual({ ok: false, code: "own" });
    expect(voteVerdict({ phase: "open", isAuthor: true, voted: false, on: true })).toBe("own");
  });

  it("can be taken back, once", () => {
    const votes = [{ entry: "e-1", voter: "bo" }];
    expect(cast(votes, "e-1", "bo", false)).toEqual({ ok: true, votes: [] });
    expect(cast([], "e-1", "bo", false)).toEqual({ ok: false, code: "none" });
  });

  it("are refused unless the competition is open", () => {
    for (const phase of ["soon", "ended", "closed"] as const) expect(cast([], "e-1", "bo", true, phase)).toEqual({ ok: false, code: "closed" });
  });

  it("keeps the same rules in the database", () => {
    const vote = sql.slice(sql.indexOf("creative_competition_vote("));
    expect(vote).toMatch(/v_author=v_person THEN RETURN kresilo_demo\._err\('OWN_ENTRY'\)/);
    expect(vote).toMatch(/status='open' AND now\(\)>=c\.opens_at AND now\(\)<c\.closes_at/);
    expect(vote).toMatch(/ON CONFLICT DO NOTHING/);
    expect(sql).toMatch(/PRIMARY KEY \(entry_id, voter_id\)/);
  });
});

describe("entering", () => {
  it("is for others, once, and only while open", () => {
    expect(canEnter("open", { isHost: false, hasEntry: false })).toBe(true);
    expect(canEnter("open", { isHost: true, hasEntry: false })).toBe(false);
    expect(canEnter("open", { isHost: false, hasEntry: true })).toBe(false);
    expect(canEnter("ended", { isHost: false, hasEntry: false })).toBe(false);
    expect(canEnter("closed", { isHost: false, hasEntry: false })).toBe(false);
  });

  it("keeps the same rules in the database", () => {
    const enter = sql.slice(sql.indexOf("creative_competition_enter("), sql.indexOf("creative_competition_withdraw("));
    expect(enter).toMatch(/v_host=v_person THEN RETURN kresilo_demo\._err\('FORBIDDEN'\)/);
    expect(enter).toMatch(/pu\.audience='community' AND pu\.withdrawn_at IS NULL AND pr\.owner_id=v_person/);
    expect(enter).toMatch(/ALREADY_ENTERED/);
    expect(sql).toMatch(/UNIQUE INDEX IF NOT EXISTS creative_competition_entries_one_each/);
  });
});

describe("closing and the winner", () => {
  const entries = [
    { id: "a", votes: 3 },
    { id: "b", votes: 7 },
    { id: "c", votes: 7 },
  ];
  it("ranks by votes and keeps entry order on a tie", () => {
    expect(rankEntries(entries).map((e) => e.id)).toEqual(["b", "c", "a"]);
    expect(leaderOf(entries)?.id).toBe("b");
    expect(leaderOf([])).toBeUndefined();
  });

  it("confirms the host's pick, else the leader", () => {
    expect(winnerOf(entries, "a")?.id).toBe("a");
    expect(winnerOf(entries, "gone")?.id).toBe("b");
    expect(winnerOf(entries)?.id).toBe("b");
  });

  it("is the host's alone, final, and by votes unless picked", () => {
    const close = sql.slice(sql.indexOf("creative_competition_close("), sql.indexOf("creative_competition_enter("));
    expect(close).toMatch(/v_host<>v_person THEN RETURN kresilo_demo\._err\('FORBIDDEN'\)/);
    expect(close).toMatch(/v_status='closed' THEN RETURN kresilo_demo\._err\('COMPETITION_CLOSED'\)/);
    expect(close).toMatch(/ORDER BY \(SELECT count\(\*\) FROM kresilo_demo\.creative_competition_votes/);
    expect(close).toMatch(/status='closed', winner_entry=v_winner/);
  });
});

describe("the commands", () => {
  beforeEach(() => {
    query.mockReset();
    query.mockImplementation(async (name: string) => (name === "creative_open" ? { person: { name: "Ayo" }, projects: [] } : {}));
  });

  it("are strict about their input", () => {
    expect(competitionSchema.safeParse(competition).success).toBe(true);
    expect(competitionSchema.safeParse({ ...competition, closesAt: competition.opensAt }).success).toBe(false);
    expect(competitionSchema.safeParse({ ...competition, rules: Array(7).fill("x") }).success).toBe(false);
    expect(competitionSchema.safeParse({ ...competition, id: "h-ab12cd34" }).success).toBe(false);
    expect(commands["competition.publish"].safeParse({ competition, host: "me" }).success).toBe(false);
    expect(commands["competition.vote"].safeParse({ entryId: uuid, on: true }).success).toBe(true);
    expect(commands["competition.vote"].safeParse({ entryId: "x", on: true }).success).toBe(false);
    expect(commands["competition.close"].safeParse({ id: competition.id }).success).toBe(true);
    expect(commands["competition.enter"].safeParse({ id: competition.id, publicationId: uuid, authorId: uuid }).success).toBe(false);
  });

  it("reach their storage functions with the session and nothing else", async () => {
    expect((await executeCreative("h", "competition.publish", { competition })).ok).toBe(true);
    expect((await executeCreative("h", "competition.enter", { id: competition.id, publicationId: uuid })).ok).toBe(true);
    expect((await executeCreative("h", "competition.vote", { entryId: uuid, on: true })).ok).toBe(true);
    expect((await executeCreative("h", "competition.withdraw", { entryId: uuid })).ok).toBe(true);
    expect((await executeCreative("h", "competition.close", { id: competition.id, winner: uuid })).ok).toBe(true);
    const calls = Object.fromEntries(query.mock.calls.filter((c) => String(c[0]).startsWith("creative_competition")).map((c) => [c[0], c[1]]));
    expect(calls.creative_competition_save).toEqual(["h", competition]);
    expect(calls.creative_competition_enter).toEqual(["h", competition.id, uuid]);
    expect(calls.creative_competition_vote).toEqual(["h", uuid, true]);
    expect(calls.creative_competition_withdraw).toEqual(["h", uuid]);
    expect(calls.creative_competition_close).toEqual(["h", competition.id, uuid]);
  });

  it("answer a refused vote with a plain reason", async () => {
    query.mockImplementation(async (name: string) => {
      if (name === "creative_open") return { person: { name: "Ayo" }, projects: [] };
      throw new Error("OWN_ENTRY");
    });
    const r = await executeCreative("h", "competition.vote", { entryId: uuid, on: true });
    expect(r).toMatchObject({ ok: false, code: "OWN_ENTRY" });
  });

  it("are reachable only through the allowlisted storage functions", () => {
    for (const fn of ["list", "save", "close", "enter", "withdraw", "vote"]) {
      expect(sql).toContain(`kresilo_demo.creative_competition_${fn}(`);
      expect(store).toContain(`creative_competition_${fn}`);
    }
  });

  it("is additive", () => {
    expect(sql).not.toMatch(/DROP |TRUNCATE|DELETE FROM kresilo_demo\.creative_(?!competition_votes)/i);
    expect(sql.match(/CREATE TABLE/g)?.length).toBe(3);
  });
});

describe("the curated competitions", () => {
  it("number at least four open ones and one closed with a winner", () => {
    const now = T("2026-10-24T12:00:00Z");
    const views = seedCompetitions.map(seedView);
    expect(views.filter((v) => phaseOf(v, v.status, now) === "open").length).toBeGreaterThanOrEqual(4);
    const closed = views.filter((v) => v.status === "closed");
    expect(closed.length).toBeGreaterThanOrEqual(1);
    for (const v of closed) expect(v.winner).toBeTruthy();
  });

  it("have roster hosts who never enter their own, real covers and valid ids", () => {
    for (const s of seedCompetitions) {
      expect(makerById(s.hostId)).toBeTruthy();
      expect(projectById(s.projectId)).toBeTruthy();
      expect(s.id).toMatch(/^c-[a-z0-9]{6,16}$/);
      expect(Date.parse(s.closesAt)).toBeGreaterThan(Date.parse(s.opensAt));
      expect(s.entries.length).toBeGreaterThanOrEqual(3);
      for (const e of s.entries) {
        expect(projectById(e.projectId)).toBeTruthy();
        expect(seedEntryMaker(e)).not.toBe(s.hostId);
      }
      if (s.winner) expect(leaderOf(s.entries)?.id).toBe(s.winner);
    }
    expect(new Set(seedCompetitions.map((s) => s.id)).size).toBe(seedCompetitions.length);
  });
});
