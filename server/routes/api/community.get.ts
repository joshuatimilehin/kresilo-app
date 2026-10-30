import { defineHandler } from "nitro";
import { setResponseHeader } from "nitro/h3";
import { creativeQuery } from "../../creative/store";
import { withoutTools } from "@/creative/publicStory";
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  try {
    return {
      ok: true,
      publications: (await creativeQuery<unknown[]>("creative_community")).map(withoutTools),
    };
  } catch {
    return { ok: false, publications: [] };
  }
});
