import { partOrigins, type PartOrigins } from "./aiMarks";
import { canvasOrigins, canvasSummary } from "./canvasOrigins";
import { z } from "zod";
import {
  authorshipSteps,
  authorshipSummary,
  versionPath,
  type AuthorshipStep,
  type AuthorshipSummary,
} from "./authorship";
import {
  buildLineage,
  hiddenReasons,
  redactReasons,
  type LineageEntry,
} from "./lineage";
import type { Project } from "./contracts";

/**
 * The designer's disclosure choices for a published post. Defaults: reasons
 * on, declined directions off, authorship strip on.
 */
export const disclosureSchema = z
  .object({
    reasons: z.boolean().default(true),
    declined: z.boolean().default(false),
    authorship: z.boolean().default(true),
    /** Whether viewers of a community post may comment. Open unless the owner closes it; the owner can change it after publishing. */
    comments: z.boolean().default(true),
    /** The maker marks the work as culturally sensitive and says they may share it. */
    sensitive: z.boolean().default(false),
    /** Reference ids whose reason stays private even when reasons are on. */
    hideReasonFor: z.array(z.string().uuid()).max(40).default([]),
  })
  .strict();
export type Disclosure = z.infer<typeof disclosureSchema>;
export const defaultDisclosure: Disclosure = disclosureSchema.parse({});

export type PublicDecision = {
  title: string;
  reason: string;
  version: number;
  /** Titles of the references this decision relied on. */
  relied: string[];
};
/** A direction the designer turned down. Public pages never name the model or provider that suggested it. */
export type PublicDeclined = { intent: string; rationale: string };
/** An authorship step as the public sees it: no model id, provider or tool name. */
export type PublicStep = Omit<AuthorshipStep, "tool">;

/** The public-safe story fields added to a publication. No ids, notes or prompts beyond these. */
export type PublicStory = {
  lineage: LineageEntry[];
  decisions: PublicDecision[];
  /** Present only when the designer chose to show declined directions. */
  declined?: PublicDeclined[];
  /** Present only when the designer chose to show the authorship strip. */
  authorship?: { steps: PublicStep[]; summary: AuthorshipSummary; parts?: PartOrigins; /** The parts are elements on a canvas, not layers of the artwork. */ canvas?: boolean };
  disclosure: { reasons: boolean; declined: boolean; authorship: boolean; comments: boolean; sensitive: boolean };
};

/**
 * Who made a step, as a public page says it. AI is named only as "AI": never
 * a model id or provider, which stay inside the studio.
 */
export function publicCredit(origin: AuthorshipStep["origin"], creator: string): string {
  if (origin === "hand") return `Made by ${creator}`;
  if (origin === "ai-assisted") return `Suggested by AI, approved by ${creator}`;
  return `Made with AI, kept by ${creator}`;
}

/**
 * Strips the tool name from a stored post before it is served. Posts published
 * before model ids were kept out still carry them; readers never receive them.
 */
export function withoutTools<T>(post: T): T {
  if (!post || typeof post !== "object") return post;
  const p = post as { authorship?: { steps?: object[] }; declined?: object[] };
  const strip = (list?: object[]) => list?.map((x) => Object.fromEntries(Object.entries(x).filter(([k]) => k !== "tool")));
  return {
    ...post,
    ...(p.authorship?.steps ? { authorship: { ...p.authorship, steps: strip(p.authorship.steps) } } : {}),
    ...(p.declined ? { declined: strip(p.declined) } : {}),
  };
}

export function publicStory(
  p: Project,
  disclosure: Partial<Disclosure> = {},
): PublicStory {
  const d = disclosureSchema.parse(disclosure),
    options = { showReasons: d.reasons, hideReasonFor: d.hideReasonFor },
    private_ = hiddenReasons(p, options),
    titleOf = new Map(
      [...p.references, ...(p.referenceArchive ?? [])].map((r) => [r.id, r.title]),
    );
  // A decision's rationale can quote a reference's saved reason; hide it too.
  const safe = (text: string) => redactReasons(text, private_);
  // Only what is in the published artwork: a decision whose version was undone is left out.
  const onPath = new Set(versionPath(p).map((v) => v.number));
  return {
    lineage: buildLineage(p, options),
    decisions: p.decisions.filter((x) => onPath.has(x.version)).map((x) => ({
      title: safe(x.title),
      reason: safe(x.reason),
      version: x.version,
      relied: x.cites.map((id) => titleOf.get(id)).filter((t): t is string => Boolean(t)),
    })),
    ...(d.declined
      ? {
          declined: p.proposals
            .filter((q) => q.status === "declined")
            .map((q) => ({
              intent: safe(q.intent),
              rationale: safe(q.rationale),
            })),
        }
      : {}),
    ...(d.authorship
      ? (() => {
          const steps: PublicStep[] = authorshipSteps(p).map(({ tool: _tool, ...s }) => ({
            ...s,
            summary: safe(s.summary),
          }));
          // A project made on the canvas counts the elements on its boards; any other counts the artwork's parts.
          const onCanvas = p.canvas ? (p.canvas.origins ?? (p.canvas.scene ? canvasOrigins(p.canvas.scene) : null)) : null;
          if (onCanvas) return { authorship: { steps, summary: canvasSummary(onCanvas), parts: onCanvas, canvas: true } };
          return { authorship: { steps, summary: authorshipSummary(steps), parts: partOrigins(p.art) } };
        })()
      : {}),
    disclosure: {
      reasons: d.reasons,
      declined: d.declined,
      authorship: d.authorship,
      comments: d.comments,
      sensitive: d.sensitive,
    },
  };
}
