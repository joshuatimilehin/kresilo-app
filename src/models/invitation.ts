import { z } from "zod";
import { accessLevels } from "./collaborator";
import {
  defineModel,
  hex64,
  isoTime,
  role,
  sampleHash,
  sampleIds,
  schemaVersionFor,
  uuid,
} from "./common";

export const version = "0.1.0";

export const invitationStates = [
  "pending",
  "accepted",
  "revoked",
  "expired",
] as const;

/**
 * An offer to join a project with a role and an access level. Only the hash of
 * the token is stored (observed: creative_invites.token_hash); the raw token
 * exists once, in the link. Observed today: seven-day expiry, no role, no
 * revoke, no visible state.
 */
export const invitationSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    tokenHash: hex64,
    projectId: uuid,
    invitedBy: uuid,
    roles: z.array(role).max(5),
    access: z.enum(accessLevels),
    state: z.enum(invitationStates),
    createdAt: isoTime,
    expiresAt: isoTime,
    usedBy: uuid.optional(),
    revokedAt: isoTime.optional(),
  })
  .strict()
  .superRefine((i, ctx) => {
    const bad = (message: string) => ctx.addIssue({ code: "custom", message });
    if (Date.parse(i.expiresAt) <= Date.parse(i.createdAt))
      bad("An invitation expires after it is created");
    if (i.state === "accepted" && !i.usedBy) bad("accepted needs usedBy");
    if (i.state === "revoked" && !i.revokedAt) bad("revoked needs revokedAt");
    if (new Set(i.roles).size !== i.roles.length) bad("Roles must be unique");
  });
export type Invitation = z.infer<typeof invitationSchema>;

export const model = defineModel({
  name: "Invitation",
  version,
  status: "planned",
  issue: 52,
  storage: {
    kind: "extend-table",
    location: "kresilo_demo.creative_invites (additive columns)",
  },
  file: "src/models/invitation.ts",
  schema: invitationSchema,
  example: {
    schemaVersion: "0.1.0",
    tokenHash: sampleHash,
    projectId: sampleIds.a,
    invitedBy: sampleIds.b,
    roles: ["motion"],
    access: "edit",
    state: "pending",
    createdAt: "2026-10-22T09:00:00.000Z",
    expiresAt: "2026-10-29T09:00:00.000Z",
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    tokenHash: "raw-token-in-the-clear",
    projectId: sampleIds.a,
    invitedBy: sampleIds.b,
    roles: [],
    access: "edit",
    state: "accepted",
    createdAt: "2026-10-22T09:00:00.000Z",
    expiresAt: "2026-10-21T09:00:00.000Z",
  },
});
