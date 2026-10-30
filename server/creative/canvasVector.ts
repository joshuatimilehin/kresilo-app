import { cleanVector, type VectorRequest, type VectorResult } from "@/creative/canvasVector";

/**
 * Rough work to clean SVG: sends a picture of the marked region to the vision model, then makes what it
 * draws safe, on-brand and layered (src/creative/canvasVector.ts). Nothing is saved here. Same provider
 * settings as the artwork assistant (INFERHUB_*).
 */
const SYSTEM = `You are Kresilo's vector artist. You get a picture of a rough sketch, scribble or wireframe from a design canvas, and the person's notes. Redraw it as one clean SVG.

Rules:
- Reply with the SVG only: no prose, no code fence. Use viewBox="0 0 WIDTH HEIGHT" with the width and height you are given, and keep the sketch's proportions and layout.
- Every distinct part is its own top-level <g id="..."> layer with a short descriptive id: each card or panel, each logo or icon, each line or block of text, each chart or image area (background, card-back, card-front, logo, name, title, contact, chart, sidebar...). Never one group for a whole card. A sketch with several parts needs at least six layers. A full-size background rect may sit outside any group.
- A scribbled line of handwriting stands for text: draw it as real <text>, using a clear placeholder such as [Your name], [Title] or [email@studio.com] when it is illegible, never as a plain grey line.
- Style with presentation attributes directly on each element (fill="#...", stroke="#...", font-family="..."). No <style> block, no class names, no style attributes.
- Draw clean flat shapes: rect (with rx), circle, ellipse, line, path, text. Gradients are allowed (linearGradient inside <defs>). No images, no filters, no scripts, no external references.
- Colours must be exactly: #0a0c0e (ink), #101315, #16191c, #1a1e21, #2a3036 (soft ink surfaces), #8d9396 (muted), #edeae3 (ivory), #c7fe02 (lime accent), #8b5cf8 (violet accent).
- Fonts: font-family "Instrument Serif" for names and headlines, "Inter" for interface text, "IBM Plex Mono" for small labels.
- Text you can read in the sketch stays as written; never invent facts.
- Make it look designed: even spacing, aligned edges, one accent colour used sparingly.`;

export async function draftVector(req: VectorRequest): Promise<VectorResult> {
  const key = process.env.INFERHUB_API_KEY;
  if (!key) throw new Error("AI_UNAVAILABLE");
  const model = process.env.INFERHUB_OMNI_MODEL ?? process.env.INFERHUB_MODEL ?? "ali/qwen3.8-omni-flash";
  const width = Math.round(req.width);
  const height = Math.round(req.height);
  const response = await fetch(`${process.env.INFERHUB_BASE_URL ?? "https://api.inferhub.dev/v1"}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      enable_thinking: false,
      max_tokens: 7000,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: JSON.stringify({ width, height, notes: req.notes ?? [], request: req.request ?? "" }) },
            { type: "image_url", image_url: { url: req.image } },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(90000),
  });
  if (!response.ok) throw new Error("AI_UNAVAILABLE");
  const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = (body.choices?.[0]?.message?.content ?? "").replace(/^```(?:svg|xml)?\s*|\s*```$/g, "");
  const result = cleanVector(raw, { width, height });
  if (!result) throw new Error("AI_UNAVAILABLE");
  return result;
}
