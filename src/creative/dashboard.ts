import type { MemberRole, Project, Suggestion, TeamMember } from "./contracts";
import { authorshipSteps, authorshipSummary } from "./authorship";

/**
 * What the collaboration dashboard shows (issue #52). Everything here is
 * derived from records a project already keeps, plus its `team` roster; it is
 * asynchronous, with no presence ("who is here now"). Where a fact is read and
 * where it is inferred is stated beside each function.
 */

export type TeamRow = {
  id: string;
  name: string;
  roles: (MemberRole | "Lead")[];
  access: "edit" | "comment";
  credit: "confirmed" | "pending" | "declined";
  /** The invitation's state at `now`; the owner is always "owner". */
  invitation: "owner" | "invited" | "expired" | "revoked";
  expiresAt?: string;
  /** "Can edit" or "Can comment", spelled out for the owner. */
  accessLabel: string;
};

const DAY = 24 * 3600 * 1000;

export const accessLabel = (a: "edit" | "comment") =>
  a === "edit" ? "Can edit" : "Can comment only";

/** The owner first as Lead, then everyone invited. READ from `p.team`. */
export function teamRows(p: Project, ownerName: string, now = Date.now()): TeamRow[] {
  const rows: TeamRow[] = [
    {
      id: "owner",
      name: ownerName,
      roles: ["Lead"],
      access: "edit",
      credit: "confirmed",
      invitation: "owner",
      accessLabel: "Owns the project",
    },
  ];
  for (const m of p.team ?? []) {
    const expired = m.state === "invited" && Date.parse(m.expiresAt) < now;
    rows.push({
      id: m.id,
      name: m.name,
      roles: m.roles,
      access: m.access,
      credit: m.credit,
      invitation: m.state === "revoked" ? "revoked" : expired ? "expired" : "invited",
      expiresAt: m.expiresAt,
      accessLabel: accessLabel(m.access),
    });
  }
  return rows;
}

/** Days left on an invitation, or 0 when it is over. */
export function daysLeft(expiresAt: string, now = Date.now()) {
  return Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / DAY));
}

/** People who may be named on a published page: the owner and confirmed, not revoked, collaborators. */
export function creditedMembers(p: Project): TeamMember[] {
  return (p.team ?? []).filter((m) => m.credit === "confirmed" && m.state !== "revoked");
}

export type ActorKind = "you" | "collaborator" | "agent";
export type ActivityKind = "hand" | "ai-approved" | "ai-proposed" | "conversation" | "team" | "other";

export type ActivityEntry = {
  id: string;
  at: string;
  actor: string;
  actorKind: ActorKind;
  summary: string;
  /** How the action is classified; INFERRED from the action's wording, see `basis`. */
  kind: ActivityKind;
  label: string;
};

const kindFor = (summary: string): ActivityKind => {
  if (/^Approved a proposal/i.test(summary)) return "ai-approved";
  if (/^Proposed a new direction/i.test(summary)) return "ai-proposed";
  if (/comment/i.test(summary)) return "conversation";
  if (/collaborator|Invited a person|Recorded a collaborator/i.test(summary)) return "team";
  if (/^(Edited the artwork|Adjusted the motion|Imported|Renamed|Saved a reference|Removed a reference|Restored a reference|Copied a reference)/i.test(summary))
    return "hand";
  return "other";
};

export const activityLabel: Record<ActivityKind, string> = {
  hand: "By hand",
  "ai-approved": "AI proposal approved",
  "ai-proposed": "AI proposal made, not applied",
  conversation: "Conversation",
  team: "Team change",
  other: "Other",
};

export const activityBasis =
  "Each entry's actor is the name saved with it. Hand versus AI is read from the action: only an approved proposal counts as AI work, and a proposal waiting for approval has changed nothing.";

/**
 * Newest first. READ: id, time, actor, summary. INFERRED: whether the actor is
 * you, a collaborator or an agent (any other name, such as one an MCP harness
 * sends) and the hand/AI kind.
 */
export function activityFeed(
  p: Project,
  ownerName: string,
  limit = 40,
): ActivityEntry[] {
  const collaborators = new Set((p.team ?? []).map((m) => m.name.toLowerCase()));
  return [...p.history]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit)
    .map((h) => {
      const name = h.actor.toLowerCase();
      const actorKind: ActorKind =
        name === ownerName.toLowerCase()
          ? "you"
          : collaborators.has(name)
            ? "collaborator"
            : "agent";
      const kind = kindFor(h.summary);
      return {
        id: h.id,
        at: h.at,
        actor: h.actor,
        actorKind,
        summary: h.summary,
        kind,
        label: activityLabel[kind],
      };
    });
}

export type ReviewQueue = {
  openComments: Project["comments"];
  resolvedComments: Project["comments"];
  proposals: Suggestion[];
};

/** READ from `comments` and from proposals whose status is "proposed". */
export function reviewQueue(p: Project): ReviewQueue {
  return {
    openComments: p.comments.filter((c) => !c.resolved),
    resolvedComments: p.comments.filter((c) => c.resolved),
    proposals: p.proposals.filter((q) => q.status === "proposed"),
  };
}

export type WorkSplit = {
  /** Counts per actor kind from saved history entries; not a measure of effort. */
  perActor: { actor: string; kind: ActorKind; hand: number; aiApproved: number }[];
  /** The whole project, from the authorship record (#50). */
  project: ReturnType<typeof authorshipSummary>;
  basis: string;
};

export const splitBasis =
  "An estimate. It counts saved actions by whoever made them: an action is hand work, or an AI proposal that person approved. It does not measure effort, time or pixels.";

export function workSplit(p: Project, ownerName: string): WorkSplit {
  const rows = new Map<string, WorkSplit["perActor"][number]>();
  for (const h of activityFeed(p, ownerName, 250)) {
    if (h.kind !== "hand" && h.kind !== "ai-approved") continue;
    const row =
      rows.get(h.actor) ??
      { actor: h.actor, kind: h.actorKind, hand: 0, aiApproved: 0 };
    if (h.kind === "hand") row.hand += 1;
    else row.aiApproved += 1;
    rows.set(h.actor, row);
  }
  return {
    perActor: [...rows.values()],
    project: authorshipSummary(authorshipSteps(p)),
    basis: splitBasis,
  };
}
