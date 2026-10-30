import { z } from "zod";
import {
  defineModel,
  isoTime,
  label,
  role,
  sampleIds,
  sampleTime,
  schemaVersionFor,
  uuid,
} from "./common";

export const version = "0.1.0";

export const creditKinds = ["made-by", "referenced-work", "made-with"] as const;
export const creditStatuses = [
  "pending",
  "confirmed",
  "declined",
  "withdrawn",
] as const;

/**
 * One line of credit on a project, in one of three kinds kept apart:
 * made-by (owner and confirmed collaborators, with roles), referenced-work
 * (makers whose work was kept as a reference) and made-with (tools, never
 * given a role). Observed today: credits are rebuilt from references at
 * publish time and have no roles or confirmation.
 */
export const creditSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    id: uuid,
    projectId: uuid,
    kind: z.enum(creditKinds),
    displayName: label,
    personId: uuid.optional(),
    makerId: uuid.optional(),
    /** Source work for referenced-work, as stored on the reference. */
    sourceWorkId: z.string().max(60).optional(),
    /** Tool for made-with, for example "Copilot (prototype guidance)". */
    tool: label.optional(),
    roles: z.array(role).max(5),
    /** A name is published only while status is "confirmed" (made-by). */
    status: z.enum(creditStatuses),
    confirmedAt: isoTime.optional(),
    sample: z.boolean(),
  })
  .strict()
  .superRefine((c, ctx) => {
    const bad = (message: string) =>
      ctx.addIssue({ code: "custom", message });
    if (new Set(c.roles).size !== c.roles.length) bad("Roles must be unique");
    if (c.kind === "made-by") {
      if (c.roles.length === 0) bad("made-by needs at least one role");
      if (!c.personId && !c.makerId) bad("made-by names a person or maker");
      if (c.status === "confirmed" && !c.confirmedAt) bad("confirmed needs confirmedAt");
    } else if (c.roles.length > 0) {
      bad("Only made-by credits carry roles");
    }
    if (c.kind === "made-with" && !c.tool) bad("made-with names its tool");
    if (c.kind === "referenced-work" && !c.sourceWorkId)
      bad("referenced-work names its source work");
  });
export type Credit = z.infer<typeof creditSchema>;

export const model = defineModel({
  name: "Credit",
  version,
  status: "planned",
  issue: 36,
  storage: { kind: "project-document", location: "Project.credits[]" },
  file: "src/models/credit.ts",
  schema: creditSchema,
  example: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    projectId: sampleIds.b,
    kind: "made-by",
    displayName: "Ayo Bello",
    personId: sampleIds.c,
    roles: ["lead", "design"],
    status: "confirmed",
    confirmedAt: sampleTime,
    sample: true,
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    projectId: sampleIds.b,
    kind: "made-with",
    displayName: "Copilot",
    roles: ["lead"],
    status: "confirmed",
    sample: false,
  },
});
