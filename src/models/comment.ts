import { z } from "zod";
import {
  defineModel,
  isoTime,
  label,
  sampleIds,
  sampleTime,
  schemaVersionFor,
  uuid,
} from "./common";

export const version = "0.1.0";

export const commentSpaces = ["board", "published", "maker-feedback"] as const;
export const commentTargets = [
  "layer",
  "version",
  "decision",
  "proposal",
  "reference",
] as const;

/**
 * The live comment is { id, text, author, at, resolved } inside
 * Project.comments (observed, src/creative/contracts.ts) and is private to the
 * board. This model keeps those five fields unchanged and adds the rest as
 * optional, so every stored comment still parses.
 */
export const commentSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    // The five live fields:
    id: uuid,
    text: z.string().trim().min(1).max(1000),
    author: label,
    at: isoTime,
    resolved: z.boolean(),
    // Additions (all optional):
    authorId: uuid.optional(),
    space: z.enum(commentSpaces).default("board"),
    target: z
      .object({ kind: z.enum(commentTargets), id: z.string().min(1).max(60) })
      .strict()
      .optional(),
    parentId: uuid.optional(),
    removedAt: isoTime.optional(),
  })
  .strict();
export type Comment = z.infer<typeof commentSchema>;

export const model = defineModel({
  name: "Comment",
  version,
  status: "planned",
  issue: 36,
  storage: { kind: "project-document", location: "Project.comments[]" },
  file: "src/models/comment.ts",
  schema: commentSchema,
  example: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    text: "The type feels too tight against the sun.",
    author: "Ayo",
    at: sampleTime,
    resolved: false,
    space: "board",
    target: { kind: "layer", id: sampleIds.b },
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    text: "",
    author: "Ayo",
    at: "yesterday",
    resolved: "no",
    reaction: "like",
  },
});
