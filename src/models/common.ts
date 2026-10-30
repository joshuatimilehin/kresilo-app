import { z } from "zod";

/**
 * Shared building blocks for every planned model. Nothing here is imported by
 * the running application. See src/models/README.md for the folder rules.
 */

export const modelStatuses = ["planned", "live"] as const;
export type ModelStatus = (typeof modelStatuses)[number];

/** GitHub issues that own a model. Anything else is rejected by the registry test. */
export const allowedIssues = [
  35, 36, 37, 38, 39, 40, 41, 43, 44, 47, 48, 49, 50, 51, 52, 53,
] as const;
export type ModelIssue = (typeof allowedIssues)[number];

/** Where a model's records are kept. Additive only; kresilo_research is never listed. */
export const storageKinds = [
  "project-document", // inside the project JSON in kresilo_demo.creative_projects.document
  "publication-document", // inside kresilo_demo.creative_publications.document
  "new-table", // a new kresilo_demo table (owner-run migration)
  "extend-table", // additive columns on an existing kresilo_demo table
  "embedded", // a value object stored inside another model
] as const;
export type StorageKind = (typeof storageKinds)[number];

export type ModelStorage = { kind: StorageKind; location: string };

export const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/**
 * Stored documents carry `schemaVersion`. A reader accepts any document whose
 * MAJOR matches the model, so additive (minor) changes never break old data;
 * a breaking change bumps the major and ships a migration.
 */
export const schemaVersionFor = (version: string) => {
  const major = version.split(".")[0];
  return z
    .string()
    .regex(
      new RegExp(`^${major}\\.\\d+\\.\\d+$`),
      `schemaVersion must be ${major}.x.y`,
    );
};

export type ModelDefinition<T extends z.ZodTypeAny = z.ZodTypeAny> = {
  name: string;
  version: string;
  status: ModelStatus;
  issue: ModelIssue;
  storage: ModelStorage;
  /** Repository path of the file that defines the model. */
  file: string;
  schema: T;
  /** A valid sample, used by the registry test and as living documentation. */
  example: unknown;
  /** An invalid sample that the schema must reject. */
  invalidExample: unknown;
};

export const defineModel = <T extends z.ZodTypeAny>(
  def: ModelDefinition<T>,
): ModelDefinition<T> => def;

export const uuid = z.string().uuid();
export const isoTime = z.string().datetime({ offset: true });
export const hex64 = z
  .string()
  .regex(/^[a-f0-9]{64}$/, "Expected a SHA-256 hex digest");
export const slug = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  .max(60);
export const languageCode = z
  .string()
  .regex(
    /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/,
    "Expected a BCP 47 style code, for example pt-BR",
  );
export const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i);
export const httpsUrl = z.string().url().max(500).startsWith("https://");

export const text = (max: number) => z.string().trim().min(1).max(max);
export const label = text(80);
export const sentence = text(300);
export const paragraph = text(1000);

export const visibilities = ["private", "community"] as const;
export const visibility = z.enum(visibilities);

/** The three origins of any piece of work. AI work is never recorded as "hand". */
export const origins = ["hand", "ai-assisted", "ai-generated"] as const;
export const origin = z.enum(origins);

/** Roles are credit, not access. Fixed list; whether it grows is an open owner decision. */
export const roles = ["lead", "design", "type", "motion", "feedback"] as const;
export const role = z.enum(roles);

/** A pointer to a stored record, so nothing on a page exists without one. */
export const recordKinds = [
  "reference",
  "decision",
  "version",
  "authorship-event",
  "credit",
  "asset",
  "proposal",
  "layer",
] as const;
export const recordRef = z
  .object({ kind: z.enum(recordKinds), id: z.string().min(1).max(60) })
  .strict();

/** Fixed ids used by example fixtures only. */
export const sampleIds = {
  a: "00000000-0000-4000-8000-000000000001",
  b: "00000000-0000-4000-8000-000000000002",
  c: "00000000-0000-4000-8000-000000000003",
  d: "00000000-0000-4000-8000-000000000004",
} as const;
export const sampleTime = "2026-10-22T09:00:00.000Z";
export const sampleHash = "a".repeat(64);
