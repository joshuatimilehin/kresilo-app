import { z } from "zod";
import {
  defineModel,
  isoTime,
  role,
  sampleIds,
  sampleTime,
  schemaVersionFor,
  uuid,
} from "./common";

export const version = "0.1.0";

export const accessLevels = ["edit", "comment"] as const;

/**
 * A person on a project. Access (what they may do) and roles (what they are
 * credited as) are separate, so a credit never silently grants permission.
 * Observed today: kresilo_demo.creative_members holds only (project_id,
 * person_id); access is all-or-nothing.
 */
export const collaboratorSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    projectId: uuid,
    personId: uuid,
    access: z.enum(accessLevels),
    roles: z.array(role).max(5),
    /** The matching made-by Credit, once the person has been offered one. */
    creditId: uuid.optional(),
    invitedBy: uuid,
    joinedAt: isoTime,
    /** The Lead approves AI proposals; whether others may is an open owner decision. */
    mayApproveProposals: z.boolean(),
  })
  .strict()
  .superRefine((c, ctx) => {
    if (new Set(c.roles).size !== c.roles.length)
      ctx.addIssue({ code: "custom", message: "Roles must be unique" });
    if (c.access === "comment" && c.mayApproveProposals)
      ctx.addIssue({ code: "custom", message: "Comment-only access cannot approve" });
  });
export type Collaborator = z.infer<typeof collaboratorSchema>;

export const model = defineModel({
  name: "Collaborator",
  version,
  status: "planned",
  issue: 36,
  storage: {
    kind: "extend-table",
    location: "kresilo_demo.creative_members (additive columns)",
  },
  file: "src/models/collaborator.ts",
  schema: collaboratorSchema,
  example: {
    schemaVersion: "0.1.0",
    projectId: sampleIds.a,
    personId: sampleIds.b,
    access: "edit",
    roles: ["type"],
    invitedBy: sampleIds.c,
    joinedAt: sampleTime,
    mayApproveProposals: false,
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    projectId: sampleIds.a,
    personId: sampleIds.b,
    access: "comment",
    roles: ["feedback"],
    invitedBy: sampleIds.c,
    joinedAt: sampleTime,
    mayApproveProposals: true,
  },
});
