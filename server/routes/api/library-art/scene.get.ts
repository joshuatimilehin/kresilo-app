import { defineHandler } from "nitro";
import { getQuery, setResponseHeader, setResponseStatus } from "nitro/h3";
import { renderLibraryArt } from "../../../creative/libraryArt";
import { sceneFromQuery } from "@/creative/libraryArt";

/** A template scene drawn for a brand name and four colours. Anything off returns 404. */
export default defineHandler((event) => {
  const art = sceneFromQuery(getQuery(event) as Record<string, unknown>);
  const svg = art ? renderLibraryArt(art) : null;
  if (!svg) {
    setResponseStatus(event, 404);
    return "";
  }
  setResponseHeader(event, "content-type", "image/svg+xml; charset=utf-8");
  setResponseHeader(event, "cache-control", "public, max-age=3600");
  setResponseHeader(event, "x-content-type-options", "nosniff");
  return svg;
});
