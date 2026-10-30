import { recolourPixels } from "./visuals/colour";
import { visualFile, type VisualColours } from "./visuals/types";

/**
 * Draws a library picture recoloured, as a PNG data URL. Ink pictures come out with a transparent ground, so they sit
 * on whatever is behind them; duotones are mapped from the shadow colour to the highlight colour.
 */
export async function bakeVisual(id: string, colours: VisualColours, max = 512): Promise<{ dataURL: string; width: number; height: number }> {
  const img = new Image();
  img.decoding = "async";
  img.src = visualFile(id);
  await img.decode();
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * k));
  const height = Math.max(1, Math.round(img.naturalHeight * k));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d")!;
  g.drawImage(img, 0, 0, width, height);
  const px = g.getImageData(0, 0, width, height);
  recolourPixels(px.data, colours);
  g.putImageData(px, 0, 0);
  return { dataURL: canvas.toDataURL("image/png"), width, height };
}
