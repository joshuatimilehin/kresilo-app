/**
 * Competitions: a host sets a prompt and a deadline, people enter a published
 * project, people vote, and a winner is shown (migration 016). This file holds
 * the rules in one place, as pure functions, and the curated competitions that
 * fill Discover before anyone has hosted one. The database enforces the same
 * rules (db/migrations/016_competitions.sql); the screen uses these to show
 * only what will be accepted.
 */
import type { Art, Competition } from "./contracts";
import { makerById } from "./makers";
import { projectById } from "./portfolio";

/** soon: not open yet. open: taking entries and votes. ended: the deadline passed, the host has not closed it. closed: the host named the winner. */
export type Phase = "soon" | "open" | "ended" | "closed";

export function phaseOf(c: { opensAt: string; closesAt: string }, status: "open" | "closed", now: number): Phase {
  if (status === "closed") return "closed";
  if (now < Date.parse(c.opensAt)) return "soon";
  return now >= Date.parse(c.closesAt) ? "ended" : "open";
}

/** Entries and votes are taken only while a competition is open. */
export const takesEntries = (phase: Phase) => phase === "open";

/** The host cannot enter their own competition; a person has one live entry. */
export function canEnter(phase: Phase, o: { isHost: boolean; hasEntry: boolean }): boolean {
  return takesEntries(phase) && !o.isHost && !o.hasEntry;
}

export type VoteVerdict = "ok" | "closed" | "own" | "already" | "none";
/** Whether one vote may be cast (`on`) or taken back. Your own entry never takes your vote; a second vote for the same entry changes nothing. */
export function voteVerdict(o: { phase: Phase; isAuthor: boolean; voted: boolean; on: boolean }): VoteVerdict {
  if (!takesEntries(o.phase)) return "closed";
  if (o.isAuthor) return "own";
  if (o.on && o.voted) return "already";
  if (!o.on && !o.voted) return "none";
  return "ok";
}

export type Vote = { entry: string; voter: string };
/** Casts, or takes back, one vote in a ledger: one per person per entry, none on your own entry. */
export function castVote(
  votes: readonly Vote[],
  v: Vote & { on: boolean },
  o: { phase: Phase; authorOf: (entry: string) => string | undefined },
): { ok: true; votes: Vote[] } | { ok: false; code: Exclude<VoteVerdict, "ok"> } {
  const voted = votes.some((x) => x.entry === v.entry && x.voter === v.voter);
  const verdict = voteVerdict({ phase: o.phase, isAuthor: o.authorOf(v.entry) === v.voter, voted, on: v.on });
  if (verdict !== "ok") return { ok: false, code: verdict };
  return { ok: true, votes: v.on ? [...votes, { entry: v.entry, voter: v.voter }] : votes.filter((x) => !(x.entry === v.entry && x.voter === v.voter)) };
}

export type Ranked = { id: string; votes: number };
/** Most votes first; entries with the same count keep the order they came in. */
export const rankEntries = <T extends Ranked>(list: readonly T[]): T[] =>
  list.map((e, i) => [e, i] as const).sort((a, b) => b[0].votes - a[0].votes || a[1] - b[1]).map(([e]) => e);

/** The entry the host would confirm: the most-voted one, or none when nobody entered. */
export const leaderOf = <T extends Ranked>(list: readonly T[]): T | undefined => rankEntries(list)[0];

/** What closing does: the host's pick if it is a live entry, else the leader. */
export function winnerOf<T extends Ranked>(list: readonly T[], picked?: string): T | undefined {
  return (picked ? list.find((e) => e.id === picked) : undefined) ?? leaderOf(list);
}

/** The time left as one short figure: "3d", "5h", "12m"; null once it has passed. */
export function timeLeft(closesAt: string, now: number): string | null {
  const ms = Date.parse(closesAt) - now;
  if (!(ms > 0)) return null;
  const m = Math.ceil(ms / 60000);
  if (m >= 2880) return `${Math.floor(m / 1440)}d`;
  if (m >= 120) return `${Math.floor(m / 60)}h`;
  return `${m}m`;
}

/** One entry as "/api/competitions?id=" answers it: a published post of the author, with its votes. */
export type SharedEntry = { id: string; publicationId: string; title: string; art: Art; creator: string; votes: number; mine: boolean; youVoted: boolean };
/** A competition from the shared store; `entries` and `posts` come only when one is asked for. */
export type PublicCompetition = {
  competition: Competition;
  hostName: string;
  status: "open" | "closed";
  winner: string | null;
  entryCount: number;
  mine: boolean;
  myEntry: string | null;
  entries?: SharedEntry[] | null;
  /** Your own community posts you could still enter. */
  posts?: { id: string; title: string; art: Art }[] | null;
};

/** A competition as the screen shows it, whether curated or hosted. */
export type CompetitionView = {
  id: string;
  title: string;
  prompt: string;
  rules: string[];
  opensAt: string;
  closesAt: string;
  projectId: string;
  cover?: string;
  hostName: string;
  /** A maker's id when the host is one of the roster. */
  hostId?: string;
  status: "open" | "closed";
  winner: string | null;
  entryCount: number;
  mine: boolean;
  myEntry: string | null;
  /** Hosted in the shared store (takes entries and votes there); curated ones are shown with their own entries. */
  shared: boolean;
};

export type SeedEntry = { id: string; projectId: string; votes: number };
export type SeedCompetition = {
  id: string;
  hostId: string;
  title: string;
  prompt: string;
  rules: string[];
  opensAt: string;
  closesAt: string;
  projectId: string;
  entries: SeedEntry[];
  /** Set when the host has closed it: the entry that won. */
  winner?: string;
};

/**
 * Five competitions from roster makers: four still open, one closed with a
 * winner. Their entries are case studies by other makers (never the host's).
 */
export const seedCompetitions: readonly SeedCompetition[] = [
  {
    id: "c-onelight",
    hostId: "ayo-bello",
    title: "One light",
    prompt: "Make a poster lit by a single source. Show us where the light comes from.",
    rules: ["One poster, your own work", "Credit anyone who helped", "Tell us how you made it"],
    opensAt: "2026-10-12T08:00:00.000Z",
    closesAt: "2026-11-21T18:00:00.000Z",
    projectId: "harbour-hours",
    entries: [
      { id: "e-onelight-1", projectId: "loom-and-line", votes: 41 },
      { id: "e-onelight-2", projectId: "tidewater-coop", votes: 58 },
      { id: "e-onelight-3", projectId: "monsoon-reel", votes: 33 },
      { id: "e-onelight-4", projectId: "slow-coast", votes: 47 },
    ],
  },
  {
    id: "c-lunchloop",
    hostId: "mira-kesavan",
    title: "A loop for lunch",
    prompt: "Five seconds that loop without a seam. Something to watch while the kettle boils.",
    rules: ["Five seconds or less", "Loops cleanly", "Your own footage or drawings"],
    opensAt: "2026-10-18T08:00:00.000Z",
    closesAt: "2026-12-05T18:00:00.000Z",
    projectId: "monsoon-reel",
    entries: [
      { id: "e-lunchloop-1", projectId: "night-shift-loop", votes: 29 },
      { id: "e-lunchloop-2", projectId: "neon-static", votes: 36 },
      { id: "e-lunchloop-3", projectId: "ligeiro-motion", votes: 24 },
      { id: "e-lunchloop-4", projectId: "metro-moves", votes: 31 },
    ],
  },
  {
    id: "c-foldonce",
    hostId: "ines-duarte",
    title: "Fold it once",
    prompt: "One sheet, one fold. Package something small and make the opening the best part.",
    rules: ["One sheet of paper or card", "Show it open and shut", "Name the paper"],
    opensAt: "2026-10-20T08:00:00.000Z",
    closesAt: "2026-12-19T18:00:00.000Z",
    projectId: "folded-almanac",
    entries: [
      { id: "e-foldonce-1", projectId: "lantern-books", votes: 18 },
      { id: "e-foldonce-2", projectId: "kopi-kecil", votes: 27 },
      { id: "e-foldonce-3", projectId: "seed-box", votes: 22 },
      { id: "e-foldonce-4", projectId: "plant-pantry", votes: 15 },
    ],
  },
  {
    id: "c-streetsigns",
    hostId: "radek-zawisza",
    title: "Signs of the street",
    prompt: "Letter the sign you wish your street had. Hand-made letters only.",
    rules: ["Hand lettering, no typefaces", "One sign", "Tell us the street"],
    opensAt: "2026-10-22T08:00:00.000Z",
    closesAt: "2027-01-09T18:00:00.000Z",
    projectId: "harbour-signage",
    entries: [
      { id: "e-streetsigns-1", projectId: "mercado-signs", votes: 12 },
      { id: "e-streetsigns-2", projectId: "street-calendar", votes: 9 },
      { id: "e-streetsigns-3", projectId: "hello-metro", votes: 14 },
      { id: "e-streetsigns-4", projectId: "cold-water-club", votes: 7 },
    ],
  },
  {
    id: "c-clothstory",
    hostId: "nia-mensah",
    title: "Cloth with a story",
    prompt: "Design a textile that remembers where it came from. Tell us the place.",
    rules: ["A repeat pattern", "Name the place it remembers", "Colours from the place"],
    opensAt: "2026-09-14T08:00:00.000Z",
    closesAt: "2026-10-12T18:00:00.000Z",
    projectId: "loom-and-line",
    winner: "e-clothstory-2",
    entries: [
      { id: "e-clothstory-1", projectId: "tidewater-coop", votes: 44 },
      { id: "e-clothstory-2", projectId: "slow-coast", votes: 63 },
      { id: "e-clothstory-3", projectId: "folded-almanac", votes: 51 },
      { id: "e-clothstory-4", projectId: "faces-of-the-market", votes: 38 },
    ],
  },
];

/** A curated competition in the shape the screen uses. */
export function seedView(s: SeedCompetition): CompetitionView {
  return {
    id: s.id,
    title: s.title,
    prompt: s.prompt,
    rules: s.rules,
    opensAt: s.opensAt,
    closesAt: s.closesAt,
    projectId: s.projectId,
    hostName: makerById(s.hostId)?.name ?? "A Kresilo member",
    hostId: s.hostId,
    status: s.winner ? "closed" : "open",
    winner: s.winner ?? null,
    entryCount: s.entries.length,
    mine: false,
    myEntry: null,
    shared: false,
  };
}

export const seedById = (id: string) => seedCompetitions.find((s) => s.id === id);
/** The maker whose case study an entry is. */
export const seedEntryMaker = (e: SeedEntry) => projectById(e.projectId)?.makerId;
