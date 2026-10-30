import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { assetById } from "@/creative/portfolio";
import { AssetCover, SceneArt } from "@/creative/portfolio/Visuals";
import type { LibraryArt } from "@/creative/libraryArt";

/**
 * Draws a library asset or a template scene as an SVG document. The same code
 * draws the portfolio pages, so what you preview is what a layer shows and
 * what the motion export uses. Pure text out; nothing here reads a file.
 */
export function renderLibraryArt(art: LibraryArt): string | null {
  const node =
    art.kind === "asset"
      ? (() => {
          const asset = assetById(art.id);
          return asset ? createElement(AssetCover, { asset, drawn: true }) : null;
        })()
      : createElement(SceneArt, { scene: art.scene, brand: art.brand, palette: art.palette });
  if (!node) return null;
  const svg = renderToStaticMarkup(node);
  // A standalone SVG document needs its namespace; fonts fall back to system serif and sans.
  return svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" ');
}
