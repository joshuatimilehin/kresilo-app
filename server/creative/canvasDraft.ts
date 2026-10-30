import { readDraft, type DraftOps, type DraftRequest } from "@/creative/canvasDraft";

/**
 * Copilot on the Studio canvas: reads the marks a person drew on a board, and the elements they point at,
 * and answers with a small list of edits (see src/creative/canvasDraft.ts). The answer is a draft; nothing
 * is saved here. It uses the same provider settings as the artwork assistant (INFERHUB_*).
 */
const SYSTEM = `You are Kresilo Copilot, working on a design board.
The person drew marks on the board: circles, arrows, strokes and short handwritten notes. A circle or stroke points at the element under it (see "anchor"). A note says what they want. Make only the changes the marks ask for, on the elements they point at. Leave everything else exactly as it is.

You get JSON: the board's width and height, its elements (id, type, x, y, width, height, text, colours) and the marks (kind, note, anchor, position). All positions are relative to the board's top-left corner, in pixels.

Reply with JSON only, no prose and no code fence:
{"rationale": "one short sentence", "edits": [{"id": "<element id>", "set": {"x":0,"y":0,"width":0,"height":0,"backgroundColor":"","strokeColor":"","strokeWidth":0,"opacity":0,"text":"","fontSize":0}}], "adds": [{"type":"rectangle|ellipse|text|line|arrow","x":0,"y":0,"width":0,"height":0,"text":"","backgroundColor":"","strokeColor":""}], "removes": ["<element id>"]}

Rules:
- Only use ids you were given for edits and removes. Put only the properties you change in "set".
- Colours must be exactly one of #0a0c0e (ink), #101315 (soft ink), #edeae3 (ivory), #c7fe02 (lime), #8b5cf8 (violet) or "transparent".
- Keep everything inside the board. Centre means centring within the board's width.
- A note such as "dropdown" or "menu" means add a small list of rectangles with short text beside the element, not a rewrite of it.
- Keep it small: at most 10 edits, 8 adds and 5 removes.`;

export async function draftCanvasChange(req: DraftRequest): Promise<DraftOps> {
  const key = process.env.INFERHUB_API_KEY;
  if (!key) throw new Error("AI_UNAVAILABLE");
  const model = process.env.INFERHUB_OMNI_MODEL ?? process.env.INFERHUB_MODEL ?? "ali/qwen3.8-omni-flash";
  const response = await fetch(`${process.env.INFERHUB_BASE_URL ?? "https://api.inferhub.dev/v1"}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      enable_thinking: false,
      max_tokens: 1800,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: JSON.stringify(req) },
      ],
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new Error("AI_UNAVAILABLE");
  const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const ops = readDraft(body.choices?.[0]?.message?.content ?? "", new Set(req.elements.map((e) => e.id)), req.board);
  if (!ops) throw new Error("AI_UNAVAILABLE");
  return ops;
}
