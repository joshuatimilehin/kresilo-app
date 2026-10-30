import { defineHandler } from "nitro";
import { setResponseHeader, setResponseStatus } from "nitro/h3";
import { z } from "zod";
import { creativeSession } from "../../creative/session";
import { creativeQuery } from "../../creative/store";
import { renderMotion } from "../../creative/motion";
import { uploadFile } from "../../utils/octoFiles";
import { isSameOrigin, rateLimit } from "../../utils/session";
import type { ProjectRecord } from "@/creative/contracts";
/**
 * Stores a rendered loop in Octo's file store and keeps only its id in
 * `kresilo_demo`. If the file store or the owner-applied migration is not there
 * yet, it falls back to the older row-based save so rendering keeps working.
 */
async function saveLoop(hash: string, projectId: string, mediaId: string, buffer: Buffer) {
  try {
    const fileId = await uploadFile({ name: "Evening study.mp4", mimeType: "video/mp4", bytes: buffer });
    await creativeQuery("creative_media_save_file", [
      hash,
      projectId,
      mediaId,
      "video/mp4",
      fileId,
      "Evening study.mp4",
      buffer.length,
    ]);
    return;
  } catch (e) {
    if (process.env.NODE_ENV !== "production")
      console.warn("File store save failed, using rows:", e instanceof Error ? e.message.slice(0, 200) : "error");
  }
  await creativeQuery("creative_media_save", [hash, projectId, mediaId, "video/mp4", buffer.toString("base64"), "Evening study.mp4"]);
}
async function renderJob(hash: string, record: ProjectRecord, id: string) {
  try {
    const buffer = await renderMotion(record.document, hash),
      mediaId = crypto.randomUUID();
    await saveLoop(hash, record.id, mediaId, buffer);
    await creativeQuery("creative_motion_finish", [hash, id, mediaId]);
  } catch (e) {
    if (process.env.NODE_ENV !== "production")
      console.warn(
        "Motion render failed:",
        e instanceof Error ? e.message.slice(0, 1600) : "Render error",
      );
    await creativeQuery("creative_motion_finish", [hash, id, null]).catch(
      () => {},
    );
  }
}
export default defineHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  if (!isSameOrigin(event)) {
    setResponseStatus(event, 403);
    return { ok: false, message: "This request was not allowed." };
  }
  if (!rateLimit(event, "motion")) {
    setResponseStatus(event, 429);
    return {
      ok: false,
      message: "Please wait before rendering another video.",
    };
  }
  try {
    const text = await event.req.text();
    if (text.length > 1000) throw new Error("INVALID_INPUT");
    const input = z
      .object({ projectId: z.string().uuid() })
      .strict()
      .parse(JSON.parse(text));
    const hash = await creativeSession(event);
    const record = await creativeQuery<ProjectRecord>("creative_get", [
      hash,
      input.projectId,
    ]);
    const id = crypto.randomUUID();
    await creativeQuery("creative_motion_start", [hash, record.id, id]);
    void renderJob(hash, record, id);
    return { ok: true, jobId: id, state: "running" };
  } catch (e) {
    setResponseStatus(event, 503);
    return {
      ok: false,
      message:
        e instanceof Error && e.message === "RENDER_BUSY"
          ? "This project already has a video rendering. Try again in a moment."
          : "The video could not be started. Your artwork and settings are saved.",
    };
  }
});
