import data from "./library.json";
import type { Visual } from "./types";

/**
 * Kresilo's visual library: the pictures made ahead of time (see types.ts).
 * The list is written by the generation pipeline into library.json and
 * checked against public/assets/kresilo/visuals by scripts/visuals-manifest.ts;
 * nothing here edits it.
 */
export const visuals: Visual[] = data as Visual[];

/** One visual by id, or undefined. `list` is for tests; the app uses the library. */
export const visualById = (id: string, list: readonly Visual[] = visuals): Visual | undefined => list.find((v) => v.id === id);
