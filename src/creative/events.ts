import { z } from "zod";

/**
 * The usage log: a flat, append-only record of what a person did, kept per
 * user, per session (one visit) and per device (a browser). It exists so that
 * when something looks wrong a person can say exactly what happened and a
 * developer can read the same trail. It never holds images, project content or
 * secrets, only short facts (which tool, which prompt, what came of it).
 *
 * The shape is deliberately flat so the same rows can move to an analytics
 * store (Octo's DuckDB lake, or a column store later) unchanged.
 */
export const eventKinds = [
  "page.view",
  "studio.panel",
  "studio.select",
  "studio.tool",
  "ai.request",
  "ai.result",
  "ai.decision",
  "command.ok",
  "command.fail",
  "asset.preview",
  "asset.use",
  "template.preview",
  "template.start",
  "share.copy",
  "story.step",
  "report.note",
  "error.ui",
] as const;
export type EventKind = (typeof eventKinds)[number];

const uuid = z.string().uuid();
const scalar = z.union([z.string().max(400), z.number(), z.boolean()]);

/** What the browser may send: a closed list of kinds and a small bag of short values. */
export const clientEventSchema = z
  .object({
    kind: z.enum(eventKinds),
    at: z.number().int().optional(),
    projectId: uuid.optional(),
    data: z.record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9]{0,23}$/), scalar).optional(),
  })
  .strict();
export type ClientEvent = z.infer<typeof clientEventSchema>;

export const eventBatchSchema = z
  .object({
    device: uuid,
    session: uuid,
    client: z
      .object({
        w: z.number().int().min(0).max(20000).optional(),
        h: z.number().int().min(0).max(20000).optional(),
        touch: z.boolean().optional(),
        lang: z.string().max(12).optional(),
        theme: z.enum(["dark", "light"]).optional(),
        reducedMotion: z.boolean().optional(),
        level: z.enum(["guided", "explorer", "advanced"]).optional(),
      })
      .strict()
      .optional(),
    events: z.array(clientEventSchema).min(1).max(50),
  })
  .strict();
export type EventBatch = z.infer<typeof eventBatchSchema>;

/** Keeps at most 12 short values, with long text cut, so a row stays small. */
export function cleanData(input: Record<string, unknown> | undefined): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(input ?? {}).slice(0, 12)) {
    if (!/^[a-zA-Z][a-zA-Z0-9]{0,23}$/.test(k)) continue;
    if (typeof v === "string") out[k] = v.slice(0, 400);
    else if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "boolean") out[k] = v;
  }
  return out;
}

export type StoredEvent = {
  id: number;
  at: string;
  kind: EventKind | string;
  source: "client" | "server";
  actor: string;
  projectId: string | null;
  sessionId: string | null;
  deviceId: string | null;
  data: Record<string, string | number | boolean>;
  client?: Record<string, unknown> | null;
};

const text = (v: unknown) => (typeof v === "string" ? v : v === undefined ? "" : String(v));

/** One plain line for an event, for the activity page and for copy-paste reports. */
export function describeEvent(e: Pick<StoredEvent, "kind" | "data" | "actor">): string {
  const d = e.data;
  switch (e.kind) {
    case "page.view":
      return `Opened ${text(d.path)}`;
    case "studio.panel":
      return `Studio: opened ${text(d.panel)}`;
    case "studio.select":
      return `Studio: selected ${text(d.layer)}`;
    case "studio.tool":
      return `Studio: used ${text(d.tool)}`;
    case "ai.request":
      return `Asked the AI: “${text(d.intent)}”${d.focus ? ` (on ${text(d.focus)})` : ""}`;
    case "ai.result": {
      const what = d.outcome === "failed" ? `nothing changed (${text(d.code)})` : d.outcome === "applied" ? "applied right away" : "proposed";
      const bits = [d.textChanged ? "changes your words" : "", Number(d.layers) ? `${d.layers} layer(s)` : "", d.model ? `by ${text(d.model)}` : ""].filter(Boolean);
      return `AI result: ${what}${bits.length ? `, ${bits.join(", ")}` : ""}${d.rationale ? ` — ${text(d.rationale)}` : ""}`;
    }
    case "ai.decision":
      return `${text(d.decision) === "accept" ? "Approved" : "Declined"} the AI proposal`;
    case "command.ok":
      return `Did: ${text(d.verb)}${d.group ? " (quiet move)" : ""}`;
    case "command.fail":
      return `Could not: ${text(d.verb)} (${text(d.code)})`;
    case "asset.preview":
      return `Previewed asset ${text(d.asset)}`;
    case "asset.use":
      return `Used asset ${text(d.asset)}`;
    case "template.preview":
      return `Previewed template ${text(d.template)}`;
    case "template.start":
      return `Started a project from template ${text(d.template)}`;
    case "share.copy":
      return `Copied a share link`;
    case "story.step":
      return `Story: ${text(d.action)} to slide ${text(d.slide)}`;
    case "report.note":
      return `Note: ${text(d.note)}`;
    case "error.ui":
      return `Screen error: ${text(d.message)}`;
    default:
      return e.kind;
  }
}

/** A compact report a person can paste to a developer: who, where, and the last steps in order. */
export function reportText(events: readonly StoredEvent[], now = new Date()): string {
  const ordered = [...events].sort((a, b) => a.at.localeCompare(b.at));
  const first = ordered[0];
  const header = [
    `Kresilo activity report, ${now.toISOString()}`,
    first ? `Device ${first.deviceId?.slice(0, 8) ?? "?"} · session ${first.sessionId?.slice(0, 8) ?? "?"}` : "No events",
    `${ordered.length} events`,
    "",
  ];
  return [
    ...header,
    ...ordered.map((e) => `${e.at.slice(11, 19)} ${e.source === "server" ? "[server]" : "[screen]"} ${describeEvent(e)}`),
  ].join("\n");
}

/** Groups events into sessions, newest session first, each in time order. */
export function bySession(events: readonly StoredEvent[]): { session: string; device: string; events: StoredEvent[] }[] {
  const map = new Map<string, StoredEvent[]>();
  for (const e of events) {
    const key = e.sessionId ?? "unknown";
    map.set(key, [...(map.get(key) ?? []), e]);
  }
  return [...map.entries()]
    .map(([session, list]) => {
      const sorted = [...list].sort((a, b) => a.at.localeCompare(b.at));
      return { session, device: sorted[0].deviceId ?? "unknown", events: sorted };
    })
    .sort((a, b) => b.events[b.events.length - 1].at.localeCompare(a.events[a.events.length - 1].at));
}
