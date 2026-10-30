import { z } from "zod";
import { actorSchema } from "./actor";
import {
  defineModel,
  isoTime,
  origin,
  sampleIds,
  sampleTime,
  schemaVersionFor,
  sentence,
  uuid,
} from "./common";

export const version = "0.1.0";

export const activityKinds = [
  "edit",
  "proposal-requested",
  "proposal-approved",
  "proposal-declined",
  "comment",
  "comment-resolved",
  "invite",
  "join",
  "credit-confirmed",
  "version-restored",
  "publish",
] as const;

/**
 * One line in the collaboration dashboard's activity feed. Observed today:
 * Project.history[] holds { id, summary, at, actor } where actor is the
 * person's name, so an approved AI change looks like a hand edit. This record
 * keeps those four fields' meaning (`historyId` links the old row) and adds a
 * typed actor and the origin from the authorship record.
 */
export const activityEventSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    id: uuid,
    projectId: uuid,
    /** The legacy Project.history[] row this mirrors, while both exist. */
    historyId: uuid.optional(),
    at: isoTime,
    kind: z.enum(activityKinds),
    summary: sentence,
    actor: actorSchema,
    origin,
    authorshipEventId: uuid.optional(),
  })
  .strict()
  .superRefine((e, ctx) => {
    if (e.origin !== "hand" && !e.authorshipEventId)
      ctx.addIssue({
        code: "custom",
        message: "AI-origin activity points at its authorship event",
      });
  });
export type ActivityEvent = z.infer<typeof activityEventSchema>;

export const model = defineModel({
  name: "ActivityEvent",
  version,
  status: "planned",
  issue: 52,
  storage: { kind: "new-table", location: "kresilo_demo.activity_events" },
  file: "src/models/activity-event.ts",
  schema: activityEventSchema,
  example: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    projectId: sampleIds.b,
    at: sampleTime,
    kind: "proposal-approved",
    summary: "Approved: make the sun smaller",
    actor: { schemaVersion: "0.1.0", kind: "person", personId: sampleIds.c, label: "Ayo" },
    origin: "ai-assisted",
    authorshipEventId: sampleIds.d,
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    projectId: sampleIds.b,
    at: sampleTime,
    kind: "proposal-approved",
    summary: "Approved: make the sun smaller",
    actor: { schemaVersion: "0.1.0", kind: "person", personId: sampleIds.c, label: "Ayo" },
    origin: "ai-assisted",
  },
});
