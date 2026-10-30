import { z } from "zod";
import { defineModel, isoTime, schemaVersionFor, uuid } from "./common";

export const version = "0.1.0";

/** Same closed list as the live logger (src/creative/events.ts). */
export const usageEventKinds = [
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

/**
 * One row of the usage log: what a person did, tagged with the user, the
 * session (one visit) and the device (a browser), flat on purpose so it can be
 * exported to an analytics store unchanged. Short facts only: no images, no
 * artwork, no secrets. Recording can be turned off per person and a person can
 * delete their own rows. Live as of migration 009; this model describes it.
 */
export const usageEventSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    id: z.number().int().min(1),
    at: isoTime,
    personId: uuid,
    sessionId: uuid.optional(),
    deviceId: uuid.optional(),
    projectId: uuid.optional(),
    kind: z.enum(usageEventKinds),
    source: z.enum(["client", "server"]),
    actor: z.string().min(1).max(40),
    data: z.record(z.string(), z.union([z.string().max(400), z.number(), z.boolean()])),
    client: z
      .object({
        w: z.number().int().optional(),
        h: z.number().int().optional(),
        touch: z.boolean().optional(),
        lang: z.string().max(12).optional(),
        theme: z.enum(["dark", "light"]).optional(),
        reducedMotion: z.boolean().optional(),
        level: z.enum(["guided", "explorer", "advanced"]).optional(),
      })
      .strict()
      .optional(),
    build: z.string().max(20).optional(),
  })
  .strict();
export type UsageEvent = z.infer<typeof usageEventSchema>;

export const model = defineModel({
  name: "UsageEvent",
  version,
  status: "planned",
  issue: 52,
  storage: { kind: "new-table", location: "kresilo_demo.usage_events" },
  file: "src/models/usage-event.ts",
  schema: usageEventSchema,
  example: {
    schemaVersion: "0.1.0",
    id: 1,
    at: "2026-10-22T09:00:00.000Z",
    personId: "00000000-0000-4000-8000-000000000001",
    sessionId: "00000000-0000-4000-8000-000000000002",
    deviceId: "00000000-0000-4000-8000-000000000003",
    kind: "ai.result",
    source: "server",
    actor: "copilot",
    data: { intent: "add glitter", outcome: "failed", code: "UNSUPPORTED_PROMPT" },
    client: { w: 375, h: 812, touch: true, theme: "dark" },
    build: "0.1.0",
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    id: 0,
    at: "yesterday",
    kind: "keylogger",
    source: "browser",
    data: { nested: { a: 1 } },
  },
});
