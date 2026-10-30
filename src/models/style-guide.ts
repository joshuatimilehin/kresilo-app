import { z } from "zod";
import {
  defineModel,
  hexColor,
  isoTime,
  label,
  sampleIds,
  sampleTime,
  schemaVersionFor,
  semverPattern,
  slug,
  uuid,
} from "./common";

export const version = "0.1.0";

export const guideSources = ["custom", "open-design"] as const;
export const fontRoles = ["display", "body", "mono"] as const;
export const checkKinds = [
  "palette-only",
  "font-allowlist",
  "min-contrast",
  "max-fonts",
] as const;

const tokenName = z.string().regex(/^[a-z][a-z0-9-]{0,23}$/);

/**
 * A per-project stylesheet and brand guideline in the shape of an Open Design
 * design-system package: a manifest, DESIGN.md prose rules, and tokens.
 * Observed (docs/open-design-spike.md, read-only inspection): a package is
 * `manifest.json` (id, category, provenance), `DESIGN.md` and `tokens.css`;
 * 153 bundled. Not run through Kresilo yet.
 *
 * Difference on purpose: Kresilo stores tokens as bounded data (hex colours,
 * safe font names, numbers) and compiles `tokens.css` when needed, so a
 * guide pulled in from outside can never inject executable CSS.
 */
export const styleGuideSchema = z
  .object({
    schemaVersion: schemaVersionFor(version),
    id: uuid,
    projectId: uuid,
    manifest: z
      .object({
        packageId: slug,
        title: label,
        category: label.optional(),
        packageVersion: z.string().regex(semverPattern),
        provenance: z
          .object({
            source: z.enum(guideSources),
            name: label.optional(),
            license: z.string().max(40).optional(),
            revision: z.string().max(40).optional(),
          })
          .strict(),
      })
      .strict(),
    /** The prose rules. Written by the designer or imported; shown to the Copilot as context. */
    designMd: z.string().trim().min(1).max(20000),
    tokens: z
      .object({
        colors: z.record(tokenName, hexColor).refine((c) => Object.keys(c).length >= 1 && Object.keys(c).length <= 24, "1 to 24 colours"),
        fonts: z
          .array(
            z
              .object({
                role: z.enum(fontRoles),
                family: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9 -]{0,59}$/),
              })
              .strict(),
          )
          .min(1)
          .max(4),
        typeScale: z.array(z.number().min(8).max(160)).min(1).max(10),
        spacing: z.array(z.number().min(0).max(200)).max(12),
        radius: z.number().min(0).max(64).optional(),
      })
      .strict(),
    /** Machine-checkable rules; a proposal that breaks one is flagged before approval. */
    checks: z
      .array(
        z
          .object({
            id: slug,
            kind: z.enum(checkKinds),
            severity: z.enum(["warn", "block"]),
          })
          .strict(),
      )
      .max(12),
    updatedAt: isoTime,
  })
  .strict();
export type StyleGuide = z.infer<typeof styleGuideSchema>;

export const model = defineModel({
  name: "StyleGuide",
  version,
  status: "planned",
  issue: 47,
  storage: { kind: "new-table", location: "kresilo_demo.style_guides" },
  file: "src/models/style-guide.ts",
  schema: styleGuideSchema,
  example: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    projectId: sampleIds.b,
    manifest: {
      packageId: "salt-flats",
      title: "Salt flats",
      packageVersion: "1.0.0",
      provenance: { source: "custom" },
    },
    designMd: "# Salt flats\nPale ground, one warm accent, generous space.",
    tokens: {
      colors: { ground: "#f2ede4", accent: "#c8553d" },
      fonts: [{ role: "display", family: "Fraunces" }],
      typeScale: [14, 18, 28, 48],
      spacing: [4, 8, 16, 32],
    },
    checks: [{ id: "palette", kind: "palette-only", severity: "warn" }],
    updatedAt: sampleTime,
  },
  invalidExample: {
    schemaVersion: "0.1.0",
    id: sampleIds.a,
    projectId: sampleIds.b,
    manifest: {
      packageId: "Bad Id",
      title: "x",
      packageVersion: "one",
      provenance: { source: "custom" },
    },
    designMd: "",
    tokens: {
      colors: { ground: "url(javascript:alert(1))" },
      fonts: [{ role: "display", family: "x; background:url(//evil)" }],
      typeScale: [],
      spacing: [],
    },
    checks: [],
    updatedAt: sampleTime,
  },
});
