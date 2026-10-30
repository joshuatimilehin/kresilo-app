import { cleanData, type StoredEvent } from "@/creative/events";
import { creativeQuery } from "./store";
import type { CreativeReply, Project } from "@/creative/contracts";

/**
 * Server-side usage logging. It records what the command service did, so the
 * trail is complete even if the screen never reports. Logging must never break
 * the app: every failure here is swallowed.
 */
export type EventContext = { device?: string; session?: string; build?: string };

export type ServerEvent = {
  kind: string;
  projectId?: string;
  actor?: string;
  data?: Record<string, unknown>;
};

const uuidLike = (v?: string) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : undefined);

export async function logServerEvents(hash: string, ctx: EventContext | undefined, events: ServerEvent[]): Promise<void> {
  if (!events.length) return;
  try {
    await creativeQuery("creative_event_log", [
      hash,
      events.map((e) => ({
        kind: e.kind,
        source: "server",
        actor: e.actor ?? "person",
        project: e.projectId,
        session: uuidLike(ctx?.session),
        device: uuidLike(ctx?.device),
        build: ctx?.build,
        data: cleanData(e.data),
      })),
    ]);
  } catch {
    /* the log is best effort */
  }
}

const READ_ONLY = new Set(["workspace.get", "project.get"]);
export const isLogged = (verb: string) => !READ_ONLY.has(verb);

/** What to log about one command and its reply: a plain row, plus a richer one for AI requests. */
export function eventsForCommand(
  verb: string,
  input: Record<string, unknown>,
  reply: CreativeReply,
  actor: string | undefined,
): ServerEvent[] {
  if (!isLogged(verb)) return [];
  const projectId = typeof input.projectId === "string" ? input.projectId : undefined;
  const who = actor ? `mcp:${actor}` : "person";
  const events: ServerEvent[] = [];
  if (reply.ok === true) {
    events.push({
      kind: "command.ok",
      projectId,
      actor: who,
      data: { verb, ...(input.group ? { group: true } : {}), ...(typeof input.revision === "number" ? { revision: input.revision } : {}) },
    });
  } else {
    events.push({ kind: "command.fail", projectId, actor: who, data: { verb, code: (reply as { code: string }).code, message: (reply as { message: string }).message } });
  }
  if (verb === "proposal.request") {
    const focus = Array.isArray(input.targets) ? input.targets.length : input.target ? 1 : 0;
    if (reply.ok === true && reply.project) {
      const q = (reply.project.document as Project).proposals.at(-1);
      const patch = (q?.patch ?? {}) as Record<string, unknown>;
      events.push({
        kind: "ai.result",
        projectId,
        actor: "copilot",
        data: {
          intent: String(input.intent ?? ""),
          outcome: q?.status === "approved" ? "applied" : "proposed",
          focus,
          textChanged: Boolean(patch.title || patch.caption),
          colourChanged: Boolean(patch.color),
          layers: Array.isArray(patch.layers) ? (patch.layers as unknown[]).length : 0,
          model: (q?.provenance ?? "").split("·")[0].trim(),
          rationale: (q?.rationale ?? "").slice(0, 300),
        },
      });
    } else if (reply.ok === false) {
      events.push({
        kind: "ai.result",
        projectId,
        actor: "copilot",
        data: { intent: String(input.intent ?? ""), outcome: "failed", code: (reply as { code: string }).code, focus },
      });
    }
  }
  if (verb === "proposal.accept" || verb === "proposal.reject")
    events.push({ kind: "ai.decision", projectId, actor: who, data: { decision: verb === "proposal.accept" ? "accept" : "decline", ok: reply.ok } });
  return events;
}

export type { StoredEvent };
