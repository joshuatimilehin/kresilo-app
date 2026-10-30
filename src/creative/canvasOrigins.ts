import type { PartOrigins } from "./aiMarks";
import type { AuthorshipSummary } from "./authorship";

/**
 * Where the AI worked on a canvas project, for the "Where AI helped" story on a published post. Every element on a
 * board is one part (a board itself, the marks and the drafts are not). Copilot's additions and edits, the layers
 * Make clean produces and the library's pictures carry an `ai` tag with the element's version when the AI made it.
 * A part is AI-generated while it is as the AI left it, and AI-assisted once the artist has changed it since;
 * everything else is by hand. The same rule the artwork used, so the two read alike.
 */
export type AiSource = "copilot" | "vector" | "library";
export type AiTag = { made: "generated"; source: AiSource; version: number };

/** The tag an element gets when the AI makes or changes it; `version` is the element's version right after. */
export const aiTag = (source: AiSource, version: number): { ai: AiTag } => ({ ai: { made: "generated", source, version } });

type Part = { type?: string; isDeleted?: boolean; version?: number; customData?: unknown };
const isBoard = (e: Part) => e.type === "frame" || e.type === "magicframe";

export function originOf(e: Part): "hand" | "assisted" | "generated" {
  const ai = (e.customData as { ai?: Partial<AiTag> } | undefined)?.ai;
  if (!ai || ai.made !== "generated") return "hand";
  return typeof ai.version === "number" && typeof e.version === "number" && e.version > ai.version ? "assisted" : "generated";
}

/** The parts of a saved scene's design list, counted; null when the scene cannot be read. */
export function canvasOrigins(scene: string): PartOrigins | null {
  try {
    const elements = (JSON.parse(scene) as { elements?: Part[] }).elements;
    if (!Array.isArray(elements)) return null;
    const out: PartOrigins = { hand: 0, assisted: 0, generated: 0 };
    for (const e of elements) {
      if (!e || e.isDeleted || isBoard(e)) continue;
      const o = originOf(e);
      if (o === "hand") out.hand++;
      else if (o === "assisted") out.assisted++;
      else out.generated++;
    }
    return out;
  } catch {
    return null;
  }
}

export const CANVAS_ORIGINS_BASIS =
  "Each element on a board is one part; boards, marks and drafts are not. A part is AI-generated when Copilot added or changed it, or it came from the AI-made library or Make clean, and the artist has not changed it since; AI-assisted when the artist changed it after an AI change; by hand otherwise. It does not measure effort, time or pixels.";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The summary shown above the parts bar for a canvas project: counts of parts, labelled an estimate, with its basis. */
export function canvasSummary(o: PartOrigins): AuthorshipSummary {
  const total = o.hand + o.assisted + o.generated;
  if (!total)
    return { total, hand: 0, aiAssisted: 0, aiGenerated: 0, sentence: "Estimate: nothing has been made on the canvas yet, so there is nothing to attribute.", basis: CANVAS_ORIGINS_BASIS };
  const parts = [`${o.hand} by hand`];
  if (o.assisted) parts.push(`${o.assisted} AI-assisted (changed by the artist after AI)`);
  if (o.generated) parts.push(`${o.generated} AI-generated`);
  const ai = o.assisted + o.generated;
  const lead = !ai ? "no AI was used" : !o.hand ? "every part used AI" : "the artist worked by hand and with AI";
  return { total, hand: o.hand, aiAssisted: o.assisted, aiGenerated: o.generated, sentence: `Estimate from ${plural(total, "part", "parts")} on the canvas: ${parts.join(", ")}; ${lead}.`, basis: CANVAS_ORIGINS_BASIS };
}
