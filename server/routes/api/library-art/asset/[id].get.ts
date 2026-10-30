import { defineHandler } from "nitro";
import { getRouterParam, setResponseHeader, setResponseStatus } from "nitro/h3";
import { renderLibraryArt } from "../../../../creative/libraryArt";

/** The cover drawing of a sample asset library, as an image a layer can use. */
export default defineHandler((event) => {
  const id = getRouterParam(event, "id") ?? "";
  const svg = /^[a-z0-9-]{1,60}$/.test(id) ? renderLibraryArt({ kind: "asset", id }) : null;
  if (!svg) {
    setResponseStatus(event, 404);
    return "";
  }
  setResponseHeader(event, "content-type", "image/svg+xml; charset=utf-8");
  setResponseHeader(event, "cache-control", "public, max-age=3600");
  setResponseHeader(event, "x-content-type-options", "nosniff");
  return svg;
});
