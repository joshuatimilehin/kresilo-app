import { defineHandler } from "nitro";
import { getRouterParam, setResponseHeader, setResponseStatus } from "nitro/h3";
import { creativeQuery } from "../../creative/store";
import { sharePage } from "@/creative/share";
import { publicOrigin } from "../../utils/origin";
import type { Publication } from "@/creative/contracts";

/** The link people share for a published post: preview tags, then on to the post. */
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "public, max-age=300");
  setResponseHeader(event, "content-type", "text/html; charset=utf-8");
  const id = getRouterParam(event, "id") ?? "";
  const missing = () => {
    setResponseStatus(event, 404);
    setResponseHeader(event, "cache-control", "no-store");
    return "<!doctype html><title>Not found</title><p>This post is not available.</p>";
  };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return missing();
  try {
    const publication = await creativeQuery<Publication>("creative_public", [id]);
    return sharePage(publication, publicOrigin(event), id);
  } catch {
    return missing();
  }
});
