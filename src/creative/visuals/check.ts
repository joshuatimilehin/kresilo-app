import type { ImageLayer } from "../contracts";
import { visualById, visuals } from "./library";
import type { Visual } from "./types";

export type VisualCheck = { ok: true } | { ok: false; message: string };

/**
 * Checks the visuals of an artwork's layers against the library. Only visuals
 * that are new or changed in this edit have to exist, so a picture retired
 * from the library later never stops a project from saving; a visual that was
 * already on the canvas stays.
 */
export function checkVisualLayers(
  layers: readonly Pick<ImageLayer, "visual">[] | undefined,
  before: readonly Pick<ImageLayer, "visual">[] | undefined = [],
  list: readonly Visual[] = visuals,
): VisualCheck {
  const already = new Set((before ?? []).flatMap((l) => (l.visual ? [l.visual.id] : [])));
  for (const l of layers ?? []) {
    const id = l.visual?.id;
    if (!id || already.has(id)) continue;
    if (!visualById(id, list)) return { ok: false, message: "That picture is not in the Kresilo library." };
  }
  return { ok: true };
}
