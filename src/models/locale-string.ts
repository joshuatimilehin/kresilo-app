import { z } from "zod";
import {
  defineModel,
  isoTime,
  languageCode,
  paragraph,
  schemaVersionFor,
  uuid,
} from "./common";

export const version = "0.1.0";

export const localeSources = [
  "original",
  "machine-translation",
  "human-translation",
] as const;

/**
 * Text that stays in the language it was written in. A translation is a
 * separate LocaleString that points at the original and says how it was made.
 * A machine translation is labelled until a named person who reads the
 * language has checked it. Observed today: no language support at all
 * (`<html lang="en">`, no i18n library).
 */
export const localeStringSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    language: languageCode,
    direction: z.enum(["ltr", "rtl"]).default("ltr"),
    text: paragraph,
    source: z.enum(localeSources),
    /** Language of the original, when this is a translation. */
    translatedFrom: languageCode.optional(),
    reviewedBy: uuid.optional(),
    reviewedAt: isoTime.optional(),
  })
  .strict()
  .superRefine((s, ctx) => {
    const bad = (message: string) => ctx.addIssue({ code: "custom", message });
    if (s.source === "original" && s.translatedFrom)
      bad("An original is not translated from anything");
    if (s.source !== "original" && !s.translatedFrom)
      bad("A translation names the language it came from");
    if (s.reviewedBy && !s.reviewedAt) bad("A review has a time");
    if (s.source === "human-translation" && !s.reviewedBy)
      bad("A human translation names its translator as reviewedBy");
  });
export type LocaleString = z.infer<typeof localeStringSchema>;

export const model = defineModel({
  name: "LocaleString",
  version,
  status: "planned",
  issue: 49,
  storage: { kind: "embedded", location: "Story, CulturalContext, Maker and Deck text fields" },
  file: "src/models/locale-string.ts",
  schema: localeStringSchema,
  example: {
    schemaVersion: "0.1.0",
    language: "ar",
    direction: "rtl",
    text: "مرحبا",
    source: "original",
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    language: "English please",
    text: "Hello",
    source: "machine-translation",
  },
});
