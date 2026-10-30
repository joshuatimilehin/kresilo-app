/**
 * Turns the app's own zod command schemas into the JSON Schema an MCP tool
 * advertises. The zod objects in src/creative/contracts.ts stay the single
 * source of truth: the tool list changes when they change, and the same
 * schemas validate what a harness sends before anything leaves this process.
 */
import { z, type ZodObject, type ZodRawShape, type ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export type JsonSchema = Record<string, unknown>;

/** JSON Schema for a zod schema, with every shared piece written out in place (no $ref). */
export function toInputSchema(schema: ZodTypeAny): JsonSchema {
  const json = zodToJsonSchema(schema, {
    target: "jsonSchema7",
    $refStrategy: "none",
  }) as JsonSchema;
  delete json.$schema;
  return json;
}

/**
 * Makes `revision` optional on a command that takes one. A harness that leaves
 * it out gets the project's current revision filled in just before the call;
 * a harness that sends it keeps the app's normal "someone else changed this"
 * protection.
 */
export function withOptionalRevision<T extends ZodRawShape>(
  schema: ZodObject<T>,
): ZodObject<T> {
  const revision = schema.shape["revision"] as ZodTypeAny | undefined;
  if (!revision) return schema;
  return schema.extend({ revision: revision.optional() } as unknown as Partial<T>);
}

/** True when the command's input has a `revision` field. */
export function takesRevision(schema: ZodObject<ZodRawShape>): boolean {
  return "revision" in schema.shape;
}

/** Adds a plain-language description to named properties, at any depth one level down. */
export function describeProperties(
  json: JsonSchema,
  notes: Record<string, string>,
): JsonSchema {
  const properties = json.properties as Record<string, JsonSchema> | undefined;
  if (!properties) return json;
  for (const [name, note] of Object.entries(notes)) {
    if (properties[name]) properties[name] = { ...properties[name], description: note };
  }
  return json;
}

/** One line per problem, naming the field, so an agent can fix every mistake in one retry. */
export function explainIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, 8)
    .map((issue) => {
      const where = issue.path.length ? issue.path.join(".") : "input";
      return `${where}: ${issue.message}`;
    })
    .join("; ");
}
