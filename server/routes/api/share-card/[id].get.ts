import { defineHandler } from "nitro";
import { getRouterParam, setResponseHeader, setResponseStatus } from "nitro/h3";
import { creativeQuery } from "../../../creative/store";
import { previewCardSvg, shareActions } from "@/creative/share";
import { publicOrigin } from "../../../utils/origin";
import type { Publication } from "@/creative/contracts";

/** The preview image for a community post. A private-link post has none. */
export default defineHandler(async (event) => {
  const id = getRouterParam(event, "id") ?? "";
  const missing = () => {
    setResponseStatus(event, 404);
    setResponseHeader(event, "cache-control", "no-store");
    return "";
  };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return missing();
  try {
    const publication = await creativeQuery<Publication>("creative_public", [id]);
    if (!shareActions(publication.audience).card) return missing();
    setResponseHeader(event, "content-type", "image/svg+xml; charset=utf-8");
    setResponseHeader(event, "cache-control", "public, max-age=300");
    return previewCardSvg(publication, publicOrigin(event));
  } catch {
    return missing();
  }
});
