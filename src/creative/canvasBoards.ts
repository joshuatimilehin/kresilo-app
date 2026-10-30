import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { isDraft, isMark } from "./canvasMarks";

/**
 * The board sizes a person can add to the Studio canvas: three device screens and the four artwork formats
 * the old editor offered (Poster 3:4, Story 9:16, Square, Wide 16:9), so work made in either shape still fits.
 */
export type BoardPreset = { id: string; name: string; width: number; height: number };
export const BOARD_PRESETS: readonly BoardPreset[] = [
  { id: "phone", name: "Phone", width: 390, height: 844 },
  { id: "tablet", name: "Tablet", width: 820, height: 1180 },
  { id: "desktop", name: "Desktop", width: 1440, height: 900 },
  { id: "poster", name: "Poster", width: 960, height: 1280 },
  { id: "story", name: "Story", width: 720, height: 1280 },
  { id: "square", name: "Square", width: 1080, height: 1080 },
  { id: "wide", name: "Wide", width: 1280, height: 720 },
];
export const BOARD_GAP = 80;

const isBoard = (e: ExcalidrawElement) => e.type === "frame" || e.type === "magicframe";

/** Where a new board goes: beside everything already on the canvas (drafts and pictures included), level with the top board. */
export function nextBoardSlot(elements: readonly ExcalidrawElement[]): { x: number; y: number } {
  const live = elements.filter((e) => !e.isDeleted && !isMark(e));
  const boards = live.filter((e) => isBoard(e) && !isDraft(e));
  if (!live.length) return { x: 0, y: 0 };
  const right = Math.max(...live.map((e) => Math.max(e.x, e.x + e.width)));
  const top = boards.length ? Math.min(...boards.map((e) => Math.min(e.y, e.y + e.height))) : Math.min(...live.map((e) => Math.min(e.y, e.y + e.height)));
  return { x: Math.round(right + BOARD_GAP), y: Math.round(top) };
}
