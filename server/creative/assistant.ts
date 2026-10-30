import { z } from "zod";
import {
  layerAdjustment,
  type ImageLayer,
  type Project,
  type Suggestion,
  historyStep,
} from "@/creative/contracts";
import { isAiLocked } from "@/creative/layers";
import { applyDesignPlan, readPlan } from "./plan";
import { buildDesignContext, systemPromptFor } from "./context";
import type { SpecialistId } from "@/creative/specialists";
import { assetMime, assets } from "@/creative/catalog";
import { readFile } from "node:fs/promises";
import { creativeQuery } from "./store";
import { resolve } from "node:path";

type LayerChange = z.infer<typeof layerAdjustment>;
/** The plain-words changes the preset prompt controls understand, for one layer. */
function ruleLayerChange(layer: ImageLayer, text: string): LayerChange {
  const change: LayerChange = {};
  const filter = /gr[ae]y|black and white/.test(text)
    ? "grayscale"
    : /warm/.test(text)
      ? "warm"
      : /cool/.test(text)
        ? "cool"
        : /no filter|original colo[u]?r|remove filter/.test(text)
          ? "none"
          : undefined;
  const opacity = text.match(
    /(?:opacity|transparent|transparency)\s*(?:to|at|of)?\s*(\d+(?:\.\d+)?)\s*%?/,
  );
  const hide = /\bhide\b/.test(text),
    show = /\bshow\b/.test(text);
  if (/smaller|shrink/.test(text)) {
    change.width = Math.max(5, layer.width * 0.8);
    change.height = Math.max(5, layer.height * 0.8);
  }
  if (/bigger|larger|enlarge/.test(text)) {
    change.width = Math.min(200, layer.width * 1.2);
    change.height = Math.min(200, layer.height * 1.2);
  }
  if (/\bleft\b/.test(text)) change.x = Math.max(-100, layer.x - 10);
  if (/\bright\b/.test(text)) change.x = Math.min(100, layer.x + 10);
  if (/\bup\b|higher/.test(text)) change.y = Math.max(-100, layer.y - 10);
  if (/\bdown\b|lower/.test(text)) change.y = Math.min(100, layer.y + 10);
  if (/cent(?:er|re)/.test(text)) {
    change.x = (100 - (change.width ?? layer.width)) / 2;
    change.y = (100 - (change.height ?? layer.height)) / 2;
  }
  const rotate = text.match(/rotat\w*\s*(?:by|to)?\s*(-?\d+)/);
  if (rotate) change.rotation = Math.max(-180, Math.min(180, Number(rotate[1])));
  if (opacity) change.opacity = Math.max(0, Math.min(1, Number(opacity[1]) / 100));
  if (filter) change.filter = filter;
  if (hide || show) change.visible = !hide;
  return change;
}

export async function draftCreativeProposal(
  p: Project,
  intent: string,
  hash: string,
  target?: string,
  targets?: string[],
  /** The designer the model works as (chosen by the artist, or by Auto). Recorded only when the model was called with it. */
  specialist?: SpecialistId,
): Promise<Suggestion> {
  // The artist's focus: one layer, several, or none (the whole composition).
  const focusIds = [...new Set(targets?.length ? targets : target ? [target] : [])];
  for (const id of focusIds)
    if (!p.art.layers?.some((l) => l.id === id) && !["background", "title", "caption"].includes(id))
      throw new Error("INVALID_TARGET");
  if (focusIds.length === 1) target = focusIds[0];
  else target = undefined;
  const layer = p.art.layers?.find((l) => l.id === target);
  const common = {
    id: crypto.randomUUID(),
    intent,
    baseVersion: historyStep(p),
    status: "proposed" as const,
    ...(target ? { target } : {}),
    ...(focusIds.length > 1 ? { targets: focusIds } : {}),
  };
  const key = process.env.INFERHUB_API_KEY;
  if (key) {
    try {
      const model = process.env.INFERHUB_OMNI_MODEL ?? "ali/qwen3.8-omni-flash";
      const images = await Promise.all(
        [...p.references]
          .filter((r) => r.mediaId || !assets[r.asset].endsWith(".svg"))
          .sort(
            (a, b) => Number(Boolean(b.mediaId)) - Number(Boolean(a.mediaId)),
          )
          .slice(0, 3)
          .map(async (r) => {
            if (r.mediaId) {
              const media = await creativeQuery<{
                contentType: string;
                base64: string;
              }>("creative_media_get", [hash, r.mediaId]);
              return media.contentType === "video/mp4"
                ? {
                    type: "video_url",
                    video_url: { url: "data:;base64," + media.base64 },
                  }
                : {
                    type: "image_url",
                    image_url: {
                      url: `data:${media.contentType};base64,${media.base64}`,
                    },
                  };
            }
            return {
              type: "image_url",
              image_url: {
                url:
                  `data:${assetMime(assets[r.asset])};base64,` +
                  (
                    await readFile(resolve("public", "." + assets[r.asset]))
                  ).toString("base64"),
              },
            };
          }),
      );
      const response = await fetch(
        `${process.env.INFERHUB_BASE_URL ?? "https://api.inferhub.dev/v1"}/chat/completions`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${key}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model,
            temperature: 0.35,
            enable_thinking: false,
            max_tokens: 2500,
            messages: [
              {
                role: "system",
                content: systemPromptFor(specialist),
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(
                      buildDesignContext(p, { intent, targets: focusIds, specialist }),
                    ),
                  },
                  ...images,
                ],
              },
            ],
          }),
          signal: AbortSignal.timeout(45000),
        },
      );
      if (!response.ok) throw new Error("PROVIDER_UNAVAILABLE");
      const body = await response.json();
      const content = body.choices?.[0]?.message?.content ?? "";
      const parsed = readPlan(JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, "")));
      if (!parsed.success) throw new Error("INVALID_PROPOSAL");
      // Citations may come back as a reference's id or its exact title. Ones
      // that match nothing are dropped; a reply whose every citation is made up
      // is refused, so an invented source is never shown.
      const asked = parsed.data.cites;
      parsed.data.cites = [
        ...new Set(
          asked
            .map((c) => p.references.find((r) => r.id === c || r.title.toLowerCase() === c.trim().toLowerCase())?.id)
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      if (asked.length && !parsed.data.cites.length) throw new Error("INVALID_PROPOSAL");
      const applied = applyDesignPlan(p, parsed.data, focusIds, { intent });
      if (!applied.changed && !applied.motion)
        throw new Error("INVALID_PROPOSAL");
      const rationale =
        p.references.reduce(
          (text, reference) =>
            text
              .split(reference.id)
              .join(reference.title)
              .split(reference.id.slice(0, 8))
              .join(reference.title),
          parsed.data.rationale,
        );
      // Notes travel on their own. When there are any, the command service
      // shows what actually changes in place of this text (suggestionSummary.ts).
      return {
        ...common,
        rationale,
        cites: parsed.data.cites,
        patch: applied.patch,
        ...(applied.notes.length ? { notes: applied.notes } : {}),
        ...(applied.motion ? { motion: applied.motion } : {}),
        ...(specialist ? { specialist } : {}),
        provenance: `${model} · ${p.references.length ? "project references and saved reasons" : "your brief and canvas"}${typeof body.usage?.cost === "number" ? ` · provider-reported $${body.usage.cost.toFixed(6)}` : ""}`,
      };
    } catch {
      // With a model configured, a failed reply is said plainly rather than
      // replaced by a canned change. Simple targeted asks still get the rules below.
      if (!target && focusIds.length < 2) throw new Error("AI_UNAVAILABLE");
    }
  }
  const ref =
    p.references.find((r) =>
      layer
        ? layer.mediaId
          ? r.mediaId === layer.mediaId
          : r.asset === layer.asset
        : target === "background"
          ? p.art.backgroundMediaId
            ? r.mediaId === p.art.backgroundMediaId
            : r.asset === p.art.asset
          : false,
    ) ?? p.references[0];
  // A project started from an idea alone has no reference to name yet.
  const source = (r: typeof ref) => (r ? ` Source: “${r.title}”, saved for “${r.reason}”.` : "");
  const citing = (r: typeof ref) => (r ? [r.id] : []);
  if (focusIds.length > 1) {
    const text = intent.toLowerCase();
    const changed = new Map<string, LayerChange>();
    for (const l of p.art.layers ?? [])
      if (focusIds.includes(l.id) && !isAiLocked(l)) {
        const c = ruleLayerChange(l, text);
        if (Object.keys(c).length) changed.set(l.id, c);
      }
    if (!changed.size) throw new Error("UNSUPPORTED_PROMPT");
    const names = (p.art.layers ?? [])
      .filter((l) => changed.has(l.id))
      .map((l) => l.name)
      .join(", ");
    return {
      ...common,
      patch: {
        layers: p.art.layers.map((l) =>
          changed.has(l.id) ? { ...l, ...changed.get(l.id) } : l,
        ),
      },
      rationale: `Proposed change to ${names}: ${intent}.${source(p.references[0])}`,
      cites: citing(p.references[0]),
      provenance:
        "Prototype guidance · preset prompt controls · no model called · review before applying",
    };
  }
  if (target) {
    const text = intent.toLowerCase();
    const patch: Suggestion["patch"] = {};
    const change: z.infer<typeof layerAdjustment> = {};
    const filter = /gr[ae]y|black and white/.test(text)
      ? "grayscale"
      : /warm/.test(text)
        ? "warm"
        : /cool/.test(text)
          ? "cool"
          : /no filter|original colo[u]?r|remove filter/.test(text)
            ? "none"
            : undefined;
    const opacity = text.match(
      /(?:opacity|transparent|transparency)\s*(?:to|at|of)?\s*(\d+(?:\.\d+)?)\s*%?/,
    );
    const hide = /\bhide\b/.test(text),
      show = /\bshow\b/.test(text);
    if (layer) {
      Object.assign(change, ruleLayerChange(layer, text));
      if (Object.keys(change).length)
        patch.layers = p.art.layers.map((l) =>
          l.id === target ? { ...l, ...change } : l,
        );
    } else if (target === "background") {
      if (filter) patch.backgroundFilter = filter;
      if (opacity)
        patch.backgroundOpacity = Math.max(
          0,
          Math.min(1, Number(opacity[1]) / 100),
        );
      if (hide || show) patch.backgroundOpacity = hide ? 0 : 1;
    } else {
      const quoted = intent.match(/["“]([^"”]+)["”]/)?.[1];
      if (target === "caption") {
        if (quoted) patch.caption = quoted.slice(0, 80);
        if (hide || show) patch.captionVisible = !hide;
      } else {
        if (quoted) patch.title = quoted.slice(0, 70);
        if (/small|quiet|minimal/.test(text))
          patch.size = Math.max(12, p.art.size - 5);
        if (/bigger|larger/.test(text))
          patch.size = Math.min(45, p.art.size + 5);
        if (/left/.test(text)) patch.x = Math.max(0, p.art.x - 5);
        if (/right/.test(text)) patch.x = Math.min(65, p.art.x + 5);
        if (/\bup\b/.test(text)) patch.y = Math.max(0, p.art.y - 5);
        if (/\bdown\b/.test(text)) patch.y = Math.min(80, p.art.y + 5);
        if (/warm/.test(text)) patch.color = "#F1C3A6";
        const hex = intent.match(/#[0-9a-f]{6}\b/i)?.[0];
        if (hex) patch.color = hex;
        if (hide || show) patch.titleVisible = !hide;
      }
    }
    if (!Object.keys(patch).length) throw new Error("UNSUPPORTED_PROMPT");
    return {
      ...common,
      patch,
      rationale: `Proposed change to ${layer?.name ?? target}: ${intent}.${source(ref)}`,
      cites: citing(ref),
      provenance:
        "Prototype guidance · preset prompt controls · no model called · review before applying",
    };
  }
  const warm = /warm|peach|sun|soft/i.test(intent),
    small = /small|quiet|minimal/i.test(intent);
  return {
    ...common,
    rationale: `${ref ? `Using “${ref.title}” because you saved it for “${ref.reason}”. ` : ""}${warm ? "A warmer title colour carries that light into the artwork." : "A quieter title gives the artwork more breathing room."}`,
    cites: citing(ref),
    patch: warm ? { color: "#F1C3A6" } : { size: small ? 19 : 23 },
    provenance:
      "Prototype guidance · no usable model response · no artwork changed",
  };
}
