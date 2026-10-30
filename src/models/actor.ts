import { z } from "zod";
import {
  defineModel,
  label,
  schemaVersionFor,
  uuid,
} from "./common";

export const version = "0.1.0";

export const actorKinds = [
  "person",
  "copilot",
  "mcp-agent",
  "import",
  "system",
] as const;

/**
 * Who performed an action. Today history stores only the person's name as a
 * string (observed: Project.history[].actor). A person is a real account or
 * guest; the Copilot, an MCP agent and an import are named, never "a person".
 */
export const actorSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    kind: z.enum(actorKinds),
    personId: uuid.optional(),
    label,
    /** Harness or client for an MCP agent, for example "Claude through MCP". */
    tool: label.optional(),
  })
  .strict()
  .superRefine((a, ctx) => {
    if (a.kind === "person" && !a.personId)
      ctx.addIssue({ code: "custom", message: "A person actor needs personId" });
    if (a.kind === "mcp-agent" && !a.tool)
      ctx.addIssue({ code: "custom", message: "An MCP actor names its tool" });
  });
export type Actor = z.infer<typeof actorSchema>;

export const model = defineModel({
  name: "Actor",
  version,
  status: "planned",
  issue: 41,
  storage: { kind: "embedded", location: "AuthorshipEvent.actor, ActivityEvent.actor" },
  file: "src/models/actor.ts",
  schema: actorSchema,
  example: {
    schemaVersion: "0.1.0",
    kind: "mcp-agent",
    label: "Claude",
    tool: "Claude through MCP",
  },
  invalidExample: { schemaVersion: "0.1.0", kind: "person", label: "Ayo" },
});
