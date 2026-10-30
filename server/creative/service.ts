import {
  commands,
  creativeFailure,
  newProject,
  ratioOf,
  publicProject,
  recordHandEdit,
  recordVersion,
  historyStep,
  stepVersion,
  type CreativeReply,
  type CreativeVerb,
  type ProjectRecord,
  type Workspace,
  type Suggestion,
  type Project,
  type StarterKey,
  type MemberRole,
  type TeamMember,
  type Art,
} from "@/creative/contracts";
import { takeSticker } from "./stickers";
import { draftCanvasChange } from "./canvasDraft";
import { draftChanges, limitDraft, type DraftRequest as CanvasDraftRequest } from "@/creative/canvasDraft";
import { draftVector } from "./canvasVector";
import { pictureBytesValid, scenePictures, type PictureType } from "@/creative/canvasImages";
import { canvasOrigins } from "@/creative/canvasOrigins";
import { keepVersion, listVersions, type VersionKind } from "@/creative/canvasVersions";
import type { VectorRequest } from "@/creative/canvasVector";
import type { DraftRequest } from "@/creative/canvasDraft";
import { asReference, works, motionForWork } from "@/creative/catalog";
import { isCommentableId } from "@/creative/commentTargets";
import { isAskableBoard } from "@/creative/boardRequests";
import { isIdeaTarget } from "@/creative/ideaCards";
import { hostedBoardAccess, hostedBoardOfComment } from "./boards";
import { MAX_COVER_BYTES, signCover, sniffImage, verifyCover } from "./eventCovers";
import { FileStoreError, uploadFile } from "../utils/octoFiles";
import { checkLibraryLayers } from "@/creative/libraryArt";
import { checkVisualLayers } from "@/creative/visuals/check";
import { isAiLocked, lockedLayerChanges } from "@/creative/layers";
import { aiAllowLabel, aiAllowOf, allowForRequest, limitPatch, type AiAllow } from "@/creative/aiAllow";
import { truthfulReason } from "@/creative/suggestionSummary";
import { assistedAfterAi, assistedAfterHand, marksAfterAi, marksAfterHand } from "@/creative/aiMarks";
import { createHash } from "node:crypto";
import { eventsForCommand, logServerEvents, type EventContext } from "./events";
import { creativeQuery } from "./store";
import { newToken, sha256Hex } from "../utils/session";
import { draftCreativeProposal } from "./assistant";
import { chooseSpecialist, type SpecialistId } from "@/creative/specialists";
/**
 * Who made a change when it was not the signed-in person using the screen, for
 * example "claude-code" for an agent harness connected through MCP. Only plain
 * text is kept: control characters go, spaces collapse, and it stops at 40
 * characters. Anything else (nothing, a number, only blanks) means "the
 * person", so the screen behaves exactly as before.
 */
export function actorLabel(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const text = raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40)
    .trim();
  return text || undefined;
}
/**
 * The only write service for the new UI and its optional command console.
 * `actor` is optional: when a caller other than the screen supplies one (the
 * MCP server does), history entries and comments name it instead of the person.
 */
export async function executeCreative(
  hash: string,
  verb: string,
  raw: unknown,
  actor?: unknown,
  context?: EventContext,
): Promise<CreativeReply> {
  const reply = lighten(verb, await runCommand(hash, verb, raw, actor));
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  await logServerEvents(hash, context, eventsForCommand(verb, input, reply, actorLabel(actor)));
  return reply;
}

/**
 * The saved canvas scene can be about 1 MB. Only opening a project (`project.get`) sends it; the project list
 * and every other reply carry a marker instead, so the workspace stays light.
 */
const lean = (r: ProjectRecord): ProjectRecord =>
  r.document.canvas?.scene
    ? {
        ...r,
        document: {
          ...r.document,
          canvas: { at: r.document.canvas.at, scene: "", ...(r.document.canvas.origins ? { origins: r.document.canvas.origins } : {}), ...(r.document.canvas.versions ? { versions: listVersions(r.document.canvas.versions) } : {}) },
        },
      }
    : r;
/** Opening a project sends its scene but not the older scenes kept as versions. */
const unversioned = (r: ProjectRecord): ProjectRecord =>
  r.document.canvas?.versions ? { ...r, document: { ...r.document, canvas: { ...r.document.canvas, versions: listVersions(r.document.canvas.versions) } } } : r;
function lighten(verb: string, reply: CreativeReply): CreativeReply {
  if (!reply.ok) return reply;
  if (verb === "project.get") return reply.project ? { ...reply, project: unversioned(reply.project) } : reply;
  return {
    ...reply,
    ...(reply.project ? { project: lean(reply.project) } : {}),
    ...(reply.workspace ? { workspace: { ...reply.workspace, projects: reply.workspace.projects.map(lean) } } : {}),
  };
}

async function runCommand(
  hash: string,
  verb: string,
  raw: unknown,
  actor?: unknown,
): Promise<CreativeReply> {
  try {
    if (!Object.prototype.hasOwnProperty.call(commands, verb))
      return creativeFailure("INVALID_INPUT", "Unknown action.");
    const result = commands[verb as CreativeVerb].safeParse(raw ?? {});
    if (!result.success)
      return creativeFailure("INVALID_INPUT", result.error.issues[0]?.message);
    const input = result.data as Record<string, unknown>;
    const workspace = await creativeQuery<Workspace>("creative_open", [hash]);
    const who = actorLabel(actor) ?? workspace.person.name;
    if (verb === "workspace.get") return { ok: true, workspace };
    if (verb === "profile.update")
      return {
        ok: true,
        workspace: await creativeQuery<Workspace>("creative_profile", [
          hash,
          input,
        ]),
      };
    if (verb === "project.join")
      return {
        ok: true,
        project: await creativeQuery<ProjectRecord>("creative_join", [
          hash,
          await sha256Hex(String(input.token)),
        ]),
      };
    if (verb === "post.comment.add") {
      await creativeQuery("creative_post_comment_add", [
        hash,
        input.publicationId,
        crypto.randomUUID(),
        String(input.text),
      ]);
      return { ok: true };
    }
    if (verb === "post.comment.remove") {
      await creativeQuery("creative_post_comment_remove", [
        hash,
        input.publicationId,
        input.commentId,
      ]);
      return { ok: true };
    }
    if (verb === "publication.withdraw") {
      await creativeQuery("creative_publication_withdraw", [hash, input.publicationId]);
      return { ok: true };
    }
    if (verb === "publication.comments") {
      await creativeQuery("creative_publication_comments", [hash, input.publicationId, input.open]);
      return { ok: true };
    }
    if (verb === "work.comment.add" || verb === "work.comment.remove") {
      // Works, case studies and open boards live in the bundle, so the database cannot check the id.
      const hosted = hostedBoardOfComment(String(input.workId));
      if (hosted) {
        // A board a person hosts: its host and the people they let in talk on it.
        const access = await hostedBoardAccess(hash, hosted);
        if (!access.exists) return creativeFailure("NOT_FOUND");
        if (!access.member) return creativeFailure("FORBIDDEN", "Ask to join this board first.");
      } else if (!isCommentableId(String(input.workId))) return creativeFailure("NOT_FOUND");
      if (verb === "work.comment.add")
        await creativeQuery("creative_work_comment_add", [hash, input.workId, crypto.randomUUID(), String(input.text)]);
      else await creativeQuery("creative_work_comment_remove", [hash, input.workId, input.commentId]);
      return { ok: true };
    }
    if (verb === "follow.set") {
      if (String(input.id).toLowerCase() === workspace.person.id) return creativeFailure("SELF_FOLLOW");
      await creativeQuery("creative_follow_set", [hash, input.id, input.on]);
      return { ok: true, workspace: await creativeQuery<Workspace>("creative_open", [hash]) };
    }
    if (verb === "follow.migrate") {
      await creativeQuery("creative_follow_migrate", [hash]);
      return { ok: true, workspace: await creativeQuery<Workspace>("creative_open", [hash]) };
    }
    if (verb === "event.publish") {
      const cover = (input.event as { cover?: string }).cover;
      if (cover && !verifyCover(cover)) return creativeFailure("INVALID_INPUT", "Choose the cover again.");
      await creativeQuery("creative_hosted_save", [hash, input.event]);
      return { ok: true };
    }
    if (verb === "event.cover") {
      const bytes = Buffer.from(String(input.base64), "base64");
      if (bytes.length > MAX_COVER_BYTES) return creativeFailure("INVALID_INPUT", "That picture is too large.");
      if (sniffImage(bytes) !== input.contentType) return creativeFailure("INVALID_INPUT", "This file does not match its image format.");
      let fileId: string;
      try {
        fileId = await uploadFile({ name: "Event cover", mimeType: String(input.contentType), bytes });
      } catch (error) {
        return creativeFailure(error instanceof FileStoreError && error.code === "STORAGE_SETUP_REQUIRED" ? error.code : "STORAGE_ERROR", "Could not keep that picture. Try again.");
      }
      const cover = signCover(fileId);
      return cover ? { ok: true, cover } : creativeFailure("STORAGE_SETUP_REQUIRED");
    }
    if (verb === "event.remove") {
      await creativeQuery("creative_hosted_remove", [hash, input.id]);
      return { ok: true };
    }
    if (verb === "event.going") {
      await creativeQuery("creative_hosted_going", [hash, input.id, input.on]);
      return { ok: true };
    }
    if (verb === "competition.publish") {
      const cover = (input.competition as { cover?: string }).cover;
      if (cover && !verifyCover(cover)) return creativeFailure("INVALID_INPUT", "Choose the cover again.");
      await creativeQuery("creative_competition_save", [hash, input.competition]);
      return { ok: true };
    }
    if (verb === "competition.close") {
      await creativeQuery("creative_competition_close", [hash, input.id, input.winner ?? null]);
      return { ok: true };
    }
    if (verb === "competition.enter") {
      await creativeQuery("creative_competition_enter", [hash, input.id, input.publicationId]);
      return { ok: true };
    }
    if (verb === "competition.withdraw") {
      await creativeQuery("creative_competition_withdraw", [hash, input.entryId]);
      return { ok: true };
    }
    if (verb === "competition.vote") {
      await creativeQuery("creative_competition_vote", [hash, input.entryId, input.on]);
      return { ok: true };
    }
    if (verb === "board.open") {
      if (!verifyCover(String(input.cover))) return creativeFailure("INVALID_INPUT", "Choose the picture again.");
      const owned = await creativeQuery<ProjectRecord>("creative_get", [hash, input.projectId]);
      if (!owned.owner) return creativeFailure("FORBIDDEN");
      await creativeQuery("creative_board_open", [
        hash,
        `b-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`,
        input.projectId,
        { title: owned.document.title.slice(0, 60), cover: input.cover, wanted: input.wanted },
        input.ideasPublic,
      ]);
      return { ok: true };
    }
    if (verb === "board.close") {
      await creativeQuery("creative_board_close", [hash, input.id]);
      return { ok: true };
    }
    if (verb === "board.ask") {
      // Curated boards are checked against the bundle; a hosted one by the database.
      if (!isAskableBoard(String(input.id))) return creativeFailure("NOT_FOUND");
      await creativeQuery("creative_board_ask", [hash, input.id]);
      return { ok: true };
    }
    if (verb === "board.answer") {
      await creativeQuery("creative_board_answer", [hash, input.id, input.personId, input.accept]);
      return { ok: true };
    }
    if (verb === "idea.add") {
      const target = String(input.target);
      if (!isIdeaTarget(target)) return creativeFailure("NOT_FOUND");
      const picture = input.picture as string | undefined;
      if (picture && !verifyCover(picture)) return creativeFailure("INVALID_INPUT", "Choose the picture again.");
      await creativeQuery("creative_idea_add", [hash, crypto.randomUUID(), target, input.panel, input.x, input.y, String(input.text), picture ?? null]);
      return { ok: true };
    }
    if (verb === "idea.answer") {
      await creativeQuery("creative_idea_answer", [hash, input.id, input.decision, (input.reply as string | undefined) ?? null]);
      return { ok: true };
    }
    if (verb === "idea.remove") {
      await creativeQuery("creative_idea_remove", [hash, input.id]);
      return { ok: true };
    }
    if (verb === "project.create") {
      const id = crypto.randomUUID(),
        p = newProject(
          id,
          String(input.brief),
          input.title ? String(input.title) : undefined,
          // A brief alone starts on a plain ground; a chosen work or template keeps its look.
          (input.template as StarterKey | undefined) ?? (input.sourceWorkId ? "evening-poster" : undefined),
        );
      p.mode = workspace.person.mode;
      if (input.sourceWorkId) {
        const ref = asReference(
          String(input.sourceWorkId),
          String(input.reason ?? "Starting image for this artwork"),
        );
        if (!ref)
          return creativeFailure(
            "NOT_FOUND",
            "This reference is no longer available.",
          );
        p.references.push(ref);
        p.art.asset = ref.asset;
        p.art.title = ref.title;
        p.art.caption = `STUDY / ${ref.creator}`.slice(0, 80);
        if (!input.title)
          p.title = /study$/i.test(ref.title) ? ref.title : `${ref.title} study`;
        p.versions[0].art = structuredClone(p.art);
        if (motionForWork[ref.workId]) {
          p.motion = { ...motionForWork[ref.workId] };
          p.versions[0].motion = { ...p.motion };
        }
      }
      return {
        ok: true,
        project: await creativeQuery<ProjectRecord>("creative_save", [
          hash,
          id,
          0,
          p,
        ]),
      };
    }
    const record = await creativeQuery<ProjectRecord>("creative_get", [
      hash,
      input.projectId,
    ]);
    const p = structuredClone(record.document);
    if (verb === "project.get") return { ok: true, project: record };
    if (verb === "project.invite") {
      const token = newToken();
      await creativeQuery("creative_invite", [
        hash,
        p.id,
        await sha256Hex(token),
      ]);
      return { ok: true, url: `/join/${token}` };
    }
    if (verb === "publication.create") {
      if (p.canvas?.scene && Object.keys(scenePictures(p.canvas.scene) ?? {}).length)
        return creativeFailure("INVALID_INPUT", "Pictures you added to the canvas are private. Remove them before sharing this project.");
      if (p.art.backgroundMediaId || p.art.layers?.some((l) => l.mediaId))
        return creativeFailure(
          "INVALID_INPUT",
          "Imported canvas images are private. Replace them with catalog images before sharing this prototype.",
        );
      if (input.revision !== record.revision)
        return creativeFailure("CONFLICT");
      const id = crypto.randomUUID();
      await creativeQuery("creative_publish", [
        hash,
        p.id,
        record.revision,
        id,
        input.audience,
        publicProject(
          p,
          String(input.description),
          workspace.person.name,
          input.disclosure as Parameters<typeof publicProject>[3],
          input.culture as Parameters<typeof publicProject>[4],
        ),
      ]);
      return { ok: true, url: `/p/${id}` };
    }
    if (verb === "canvas.cover") {
      if (input.revision !== record.revision) return creativeFailure("CONFLICT");
      p.art = {
        ...p.art,
        snapshot: { image: String(input.image), width: Number(input.width), height: Number(input.height), at: new Date().toISOString() },
        // The picture is the artwork now: no title or caption is drawn over it.
        titleVisible: false,
        captionVisible: false,
      };
      return {
        ok: true,
        project: await creativeQuery<ProjectRecord>("creative_save", [hash, p.id, record.revision, p]),
      };
    }
    if (verb === "canvas.draft") {
      if (p.aiApply === "off") return creativeFailure("AI_OFF");
      const { projectId: _project, ...request } = input as DraftRequest & { projectId: string };
      void _project;
      let drafted;
      try {
        drafted = await draftCanvasChange(request);
      } catch {
        return creativeFailure("AI_UNAVAILABLE", "Copilot could not make a change from these marks. Nothing was changed.");
      }
      // Keep only what the artist allows. Asking for words in so many words counts as turning them on for this request.
      const asked = request as CanvasDraftRequest;
      const allow = allowForRequest(p, [asked.request, ...asked.marks.map((m) => m.note)].filter(Boolean).join(" "));
      const limited = limitDraft(drafted, allow, new Map(asked.elements.map((e) => [e.id, e.type])));
      if (!draftChanges(limited.ops))
        return creativeFailure("AI_NOT_ALLOWED", `That needs ${limited.blocked.map((k) => aiAllowLabel[k]).join(" and ")}, which ${limited.blocked.length > 1 ? "are" : "is"} off.`);
      return { ok: true, draft: limited.ops };
    }
    if (verb === "canvas.vector") {
      if (p.aiApply === "off") return creativeFailure("AI_OFF");
      const { projectId: _project, ...request } = input as VectorRequest & { projectId: string };
      void _project;
      if (!aiAllowOf(p).images) return creativeFailure("AI_NOT_ALLOWED", `That needs ${aiAllowLabel.images}, which is off.`);
      try {
        return { ok: true, vector: await draftVector(request) };
      } catch {
        return creativeFailure("AI_UNAVAILABLE", "Copilot could not clean this up just now. Nothing was changed.");
      }
    }
    if (verb === "canvas.image") {
      const bytes = Buffer.from(String(input.base64), "base64");
      if (!pictureBytesValid(String(input.contentType) as PictureType, bytes))
        return creativeFailure("INVALID_INPUT", "This file does not match its image format.");
      const mediaId = crypto.randomUUID();
      // Same storage as an imported reference, so the same bytes are kept once and the owner's storage limit applies.
      try {
        await creativeQuery("creative_media_save_once", [hash, p.id, mediaId, String(input.contentType), input.base64, "canvas picture", createHash("sha256").update(bytes).digest("hex")]);
      } catch {
        await creativeQuery("creative_media_save", [hash, p.id, mediaId, String(input.contentType), input.base64, "canvas picture"]);
      }
      return { ok: true, mediaId };
    }
    if (verb === "canvas.version") {
      if (input.revision !== record.revision) return creativeFailure("CONFLICT");
      if (scenePictures(String(input.scene)) === null) return creativeFailure("INVALID_INPUT", "The canvas could not be read.");
      const kept = keepVersion(p.canvas?.versions ?? [], { id: crypto.randomUUID(), at: new Date().toISOString(), kind: input.kind as VersionKind, scene: String(input.scene) });
      if (!kept) return creativeFailure("TOO_LARGE", "This canvas is too big to keep a version of.");
      p.canvas = { scene: p.canvas?.scene ?? String(input.scene), at: p.canvas?.at ?? new Date().toISOString(), ...(p.canvas?.origins ? { origins: p.canvas.origins } : {}), versions: kept };
      return {
        ok: true,
        project: await creativeQuery<ProjectRecord>("creative_save", [hash, p.id, record.revision, p]),
      };
    }
    if (verb === "canvas.restore") {
      const version = p.canvas?.versions?.find((v) => v.id === input.versionId);
      return version ? { ok: true, scene: version.scene } : creativeFailure("NOT_FOUND");
    }
    if (verb === "canvas.save") {
      if (input.revision !== record.revision) return creativeFailure("CONFLICT");
      let scene: unknown;
      try {
        scene = JSON.parse(String(input.scene));
      } catch {
        return creativeFailure("INVALID_INPUT", "The canvas could not be read.");
      }
      const marks = (scene as { marks?: unknown } | null)?.marks;
      if (!scene || typeof scene !== "object" || !Array.isArray((scene as { elements?: unknown }).elements) || (marks !== undefined && !Array.isArray(marks)))
        return creativeFailure("INVALID_INPUT", "The canvas could not be read.");
      if (scenePictures(String(input.scene)) === null) return creativeFailure("INVALID_INPUT", "The pictures on this canvas could not be read.");
      p.canvas = { scene: String(input.scene), at: new Date().toISOString(), ...(canvasOrigins(String(input.scene)) ? { origins: canvasOrigins(String(input.scene))! } : {}), ...(p.canvas?.versions ? { versions: p.canvas.versions } : {}) };
      return {
        ok: true,
        project: await creativeQuery<ProjectRecord>("creative_save", [hash, p.id, record.revision, p]),
      };
    }
    const summaries: Record<string, string> = {
      "project.rename": "Renamed the project",
      "project.ai": "Changed how AI changes are applied",
      "reference.remove": "Removed a reference from the board; source retained in history",
      "reference.restore": "Restored a reference to the board",
      "reference.copy": "Copied a reference from another project",
      "media.import": "Imported a reference and its reason",
      "sticker.place": "Placed a sticker made with AI",
      "reference.carry": "Saved a reference and its reason",
      "artwork.edit": "Edited the artwork",
      "proposal.request": "Proposed a new direction",
      "proposal.accept": "Approved a proposal",
      "proposal.reject": "Kept the current artwork",
      "proposal.forget": "Asked the assistant to stop learning from a declined suggestion",
      "version.restore": "Restored an earlier version",
      "version.undo": "Undid an artwork change",
      "version.redo": "Redid an artwork change",
      "motion.configure": "Adjusted the motion",
      "comment.add": "Added a comment",
      "comment.resolve": "Resolved a comment",
      "team.add": "Invited a person to the project",
      "team.update": "Changed a collaborator's role or access",
      "team.revoke": "Revoked a collaborator's access",
      "team.credit": "Recorded a collaborator's answer about credit",
    };
    if (p.history.length >= 250 || p.versions.length >= 150)
      return creativeFailure(
        "LIMIT_REACHED",
        "This demo project has reached its history limit. Start a new project.",
      );
    switch (verb) {
      case "project.rename":
        if (input.revision !== record.revision) return creativeFailure("CONFLICT");
        p.title = String(input.title);
        break;
      case "project.ai":
        if (input.revision !== record.revision) return creativeFailure("CONFLICT");
        if (!input.apply && !input.allow) return creativeFailure("INVALID_INPUT", "Nothing to change.");
        if (input.apply) p.aiApply = input.apply === "auto" ? "auto" : input.apply === "off" ? "off" : "ask";
        if (input.allow) p.aiAllow = { ...aiAllowOf(p), ...(input.allow as Partial<AiAllow>) };
        break;
      case "reference.remove": {
        if (input.revision !== record.revision) return creativeFailure("CONFLICT");
        const ref = p.references.find((r) => r.id === input.referenceId);
        if (!ref) return creativeFailure("NOT_FOUND");
        if ((p.referenceArchive?.length ?? 0) >= 100) return creativeFailure("LIMIT_REACHED");
        p.referenceArchive = [...(p.referenceArchive ?? []), ref];
        p.references = p.references.filter((r) => r.id !== ref.id);
        break;
      }
      case "reference.copy": {
        if (input.revision !== record.revision) return creativeFailure("CONFLICT");
        const source = await creativeQuery<ProjectRecord>("creative_get", [hash, input.sourceProjectId]);
        const ref = source.document.references.find((r) => r.id === input.referenceId);
        if (!ref) return creativeFailure("NOT_FOUND");
        if (ref.mediaId) return creativeFailure("INVALID_INPUT", "Imported files stay in their original project. Import the file into the destination instead.");
        if (p.references.length >= 40) return creativeFailure("LIMIT_REACHED");
        if (p.references.some((r) => r.workId === ref.workId))
          return creativeFailure("INVALID_INPUT", "This reference is already saved in that project.");
        p.references.push({ ...structuredClone(ref), id: crypto.randomUUID() });
        break;
      }
      case "reference.restore": {
        if (input.revision !== record.revision) return creativeFailure("CONFLICT");
        const ref = p.referenceArchive?.find((r) => r.id === input.referenceId);
        if (!ref) return creativeFailure("NOT_FOUND");
        if (p.references.length >= 40) return creativeFailure("LIMIT_REACHED");
        if (p.references.some((r) => r.workId === ref.workId)) return creativeFailure("INVALID_INPUT", "This reference is already on the board.");
        p.references.push(ref);
        p.referenceArchive = p.referenceArchive.filter((r) => r.id !== ref.id);
        break;
      }
      case "media.import": {
        if (p.references.length >= 40) return creativeFailure("LIMIT_REACHED");
        const bytes = Buffer.from(String(input.base64), "base64");
        const type = String(input.contentType);
        const valid =
          type === "image/jpeg"
            ? bytes[0] === 255 && bytes[1] === 216
            : type === "image/png"
              ? bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a"
              : type === "image/webp"
                ? bytes.toString("ascii", 0, 4) === "RIFF" &&
                  bytes.toString("ascii", 8, 12) === "WEBP"
                : bytes.toString("ascii", 4, 8) === "ftyp";
        if (!valid)
          return creativeFailure(
            "INVALID_INPUT",
            "This file does not match its image or video format.",
          );
        const mediaId = crypto.randomUUID();
        // The same bytes imported again by one owner are stored once. Until the
        // owner applies migration 007 that function is missing, so the older
        // row save keeps uploads working (as the motion export does).
        try {
          await creativeQuery("creative_media_save_once", [
            hash,
            p.id,
            mediaId,
            type,
            input.base64,
            input.name,
            createHash("sha256").update(bytes).digest("hex"),
          ]);
        } catch {
          await creativeQuery("creative_media_save", [hash, p.id, mediaId, type, input.base64, input.name]);
        }
        p.references.push({
          id: crypto.randomUUID(),
          workId: mediaId,
          title: String(input.name),
          creator: workspace.person.name,
          source: "",
          reason: String(input.reason),
          asset: "dusk-study",
          tags: [],
          mediaId,
          contentType: type,
        });
        break;
      }
      case "sticker.place": {
        const job = takeSticker(String(input.jobId), hash, p.id);
        if (!job) return creativeFailure("NOT_FOUND", "That sticker is no longer waiting. Make it again.");
        if ((p.art.layers?.length ?? 0) >= 12) return creativeFailure("LIMIT_REACHED");
        if (p.references.length >= 40) return creativeFailure("LIMIT_REACHED");
        const mediaId = crypto.randomUUID();
        const name = `Sticker: ${job.prompt}`.slice(0, 60);
        try {
          await creativeQuery("creative_media_save_once", [
            hash,
            p.id,
            mediaId,
            job.contentType,
            job.base64,
            `${name}.png`,
            createHash("sha256").update(Buffer.from(job.base64, "base64")).digest("hex"),
          ]);
        } catch {
          await creativeQuery("creative_media_save", [hash, p.id, mediaId, job.contentType, job.base64, `${name}.png`]);
        }
        // The sticker is credited plainly as AI-generated, never as hand work.
        p.references.push({
          id: crypto.randomUUID(),
          workId: mediaId,
          title: name,
          creator: "AI-generated",
          source: "",
          reason: `Made from: ${job.prompt}`.slice(0, 600),
          asset: "dusk-study",
          tags: ["sticker", "ai-generated"],
          mediaId,
          contentType: job.contentType,
        });
        const layer = {
          id: crypto.randomUUID(),
          name,
          role: "ornament" as const,
          mediaId,
          x: 30,
          y: 35,
          width: 40,
          // Square on any canvas shape: height is the width times the canvas ratio.
          height: 40 * ratioOf(p.art),
          opacity: 1,
          rotation: 0,
          visible: true,
          filter: "none" as const,
        };
        p.art.layers = [...(p.art.layers ?? []), layer];
        p.art.aiMarks = [...new Set([...(p.art.aiMarks ?? []), layer.id])];
        break;
      }
      case "reference.carry": {
        if (p.references.length >= 40) return creativeFailure("LIMIT_REACHED");
        const ref = asReference(String(input.workId), String(input.reason));
        if (!ref) return creativeFailure("NOT_FOUND");
        if (p.references.some((r) => r.workId === ref.workId))
          return creativeFailure(
            "INVALID_INPUT",
            "This reference is already saved here.",
          );
        p.references.push(ref);
        break;
      }
      case "artwork.edit":
        if (input.revision !== record.revision)
          return creativeFailure("CONFLICT");
        {
          const next = { ...p.art, ...(input.patch as object) } as Art;
          // Only the server decides what carries an AI mark: a hand edit clears the parts it touched.
          const seen = { ...next, aiMarks: p.art.aiMarks, aiAssisted: p.art.aiAssisted };
          next.aiMarks = marksAfterHand(p.art, seen);
          next.aiAssisted = assistedAfterHand(p.art, seen);
          const mediaIds = [
            next.backgroundMediaId,
            ...(next.layers ?? []).map((l) => l.mediaId),
          ].filter(Boolean);
          if (
            mediaIds.some(
              (id) =>
                !p.references.some(
                  (r) => r.mediaId === id && r.contentType !== "video/mp4",
                ),
            )
          )
            return creativeFailure(
              "INVALID_INPUT",
              "Choose an image imported into this project.",
            );
          const library = checkLibraryLayers(next.layers);
          if (library.ok === false) return creativeFailure("ASSET_NOT_SHARED", library.message);
          // A picture from the visual library has to exist now (one already on the canvas stays).
          const visualsOk = checkVisualLayers(next.layers, p.art.layers);
          if (visualsOk.ok === false) return creativeFailure("INVALID_INPUT", visualsOk.message);
          for (const credit of library.credits) {
            if (p.references.some((r) => r.workId === credit.workId)) continue;
            if (p.references.length >= 40) return creativeFailure("LIMIT_REACHED");
            p.references.push({
              id: crypto.randomUUID(),
              asset: "dusk-study",
              ...credit,
            });
          }
          p.art = next;
          for (const asset of new Set(
            [next.asset, ...(next.layers ?? []).map((l) => l.asset)].filter(
              Boolean,
            ),
          )) {
            const work = works.find((w) => w.asset === asset);
            if (work && !p.references.some((r) => r.workId === work.id))
              p.references.push(
                asReference(work.id, "Placed on the canvas by hand"),
              );
          }
        }
        recordHandEdit(p, "Edited by hand", input.group === true);
        break;
      case "proposal.request": {
        // Hand-only: the artist turned the assistant off for this project.
        if (p.aiApply === "off") return creativeFailure("AI_OFF");
        if (p.proposals.filter((q) => q.status === "proposed").length >= 10)
          return creativeFailure(
            "LIMIT_REACHED",
            "Review an existing proposal first.",
          );
        const focus = [
          ...new Set(
            (input.targets as string[] | undefined)?.length
              ? (input.targets as string[])
              : input.target
                ? [String(input.target)]
                : [],
          ),
        ];
        // Locked layers are the artist's own to work on. A request aimed only
        // at them cannot go ahead; a wider focus simply leaves them alone.
        if (
          focus.length &&
          focus.every((id) => isAiLocked(p.art.layers?.find((l) => l.id === id)))
        )
          return creativeFailure("LAYER_LOCKED");
        const proposal: Suggestion = await draftCreativeProposal(
          p,
          String(input.intent),
          hash,
          focus.length === 1 ? focus[0] : undefined,
          focus.length > 1 ? focus : undefined,
          // The artist's pick, or Auto's reading of the brief and the request.
          (input.specialist as SpecialistId | undefined) ?? chooseSpecialist(p.brief ?? "", String(input.intent), p).id,
        );
        // Keep only the kinds of change the artist allows; a request that asks
        // for words (or the first draft from the brief) may change words.
        const limited = limitPatch(p.art, proposal.patch ?? {}, allowForRequest(p, String(input.intent)));
        if (limited.blocked.length) {
          proposal.patch = limited.patch;
          proposal.blocked = limited.blocked;
          if (!Object.keys(limited.patch).length && !proposal.motion)
            return creativeFailure(
              "AI_NOT_ALLOWED",
              `That needs ${limited.blocked.map((k) => aiAllowLabel[k]).join(" and ")}, which ${limited.blocked.length > 1 ? "are" : "is"} off.`,
            );
        }
        // With part of the reply left out, the explanation names what will
        // actually change; the model's own words stay on the record.
        const shown = truthfulReason({
          rationale: proposal.rationale,
          dropped: Boolean(limited.blocked.length || proposal.notes?.length),
          art: p.art,
          patch: proposal.patch,
          motion: proposal.motion,
        });
        if (shown !== proposal.rationale) {
          proposal.modelReason = proposal.rationale;
          proposal.rationale = shown;
        }
        p.proposals.push(proposal);
        // The artist chose to let AI changes land right away; undo is one tap.
        if (p.aiApply === "auto") approveProposal(p, proposal, true);
        break;
      }
      case "proposal.accept":
      case "proposal.reject": {
        const proposal = p.proposals.find((q) => q.id === input.proposalId);
        if (!proposal) return creativeFailure("NOT_FOUND");
        if (
          proposal.status ===
          (verb === "proposal.accept" ? "approved" : "declined")
        )
          return { ok: true, project: record };
        if (proposal.status !== "proposed")
          return creativeFailure("PROPOSAL_CLOSED");
        if (verb === "proposal.accept") {
          if (proposal.baseVersion !== historyStep(p))
            return creativeFailure("PROPOSAL_STALE");
          const failed = approveProposal(p, proposal, false);
          if (failed) return failed;
        } else proposal.status = "declined";
        break;
      }
      case "proposal.forget": {
        const proposal = p.proposals.find((q) => q.id === input.proposalId);
        if (!proposal || proposal.status !== "declined") return creativeFailure("NOT_FOUND");
        proposal.forgotten = true;
        break;
      }
      case "version.undo":
      case "version.redo": {
        if (input.revision !== record.revision)
          return creativeFailure("CONFLICT");
        if (!stepVersion(p, verb === "version.undo" ? "undo" : "redo"))
          return creativeFailure("INVALID_INPUT", "There is no artwork change to undo or redo.");
        break;
      }
      case "version.restore": {
        const version = p.versions.find((v) => v.id === input.versionId);
        if (!version) return creativeFailure("NOT_FOUND");
        p.art = structuredClone(version.art);
        p.motion = { ...version.motion };
        recordVersion(p, `Restored version ${version.number}`);
        break;
      }
      case "motion.configure":
        if (input.revision !== record.revision)
          return creativeFailure("CONFLICT");
        p.motion = {
          seconds: Number(input.seconds),
          movement: input.movement as typeof p.motion.movement,
          loop: Boolean(input.loop),
          beat: Number(input.beat ?? 0.5),
        };
        recordVersion(p, "Adjusted motion");
        break;
      case "comment.add":
        if (p.comments.length >= 100) return creativeFailure("LIMIT_REACHED");
        p.comments.push({
          id: crypto.randomUUID(),
          text: String(input.text),
          author: who,
          at: new Date().toISOString(),
          resolved: false,
        });
        break;
      case "comment.resolve": {
        const comment = p.comments.find((c) => c.id === input.commentId);
        if (!comment) return creativeFailure("NOT_FOUND");
        comment.resolved = true;
        break;
      }
      case "team.add": {
        if (!record.owner) return creativeFailure("FORBIDDEN");
        const team = p.team ?? [];
        if (team.filter((m) => m.state === "invited").length >= 12)
          return creativeFailure("LIMIT_REACHED");
        const now = Date.now();
        p.team = [
          ...team,
          {
            id: crypto.randomUUID(),
            name: String(input.name),
            roles: [...new Set(input.roles as MemberRole[])],
            access: input.access as TeamMember["access"],
            credit: "pending",
            state: "invited",
            invitedAt: new Date(now).toISOString(),
            expiresAt: new Date(now + 7 * 24 * 3600 * 1000).toISOString(),
          },
        ];
        break;
      }
      case "team.update":
      case "team.revoke":
      case "team.credit": {
        if (!record.owner) return creativeFailure("FORBIDDEN");
        const member = p.team?.find((m) => m.id === input.memberId);
        if (!member) return creativeFailure("NOT_FOUND");
        if (verb === "team.revoke") member.state = "revoked";
        else if (verb === "team.credit")
          member.credit = input.credit as TeamMember["credit"];
        else {
          if (input.roles) member.roles = [...new Set(input.roles as MemberRole[])];
          if (input.access) member.access = input.access as TeamMember["access"];
        }
        break;
      }
      default:
        return creativeFailure("INVALID_INPUT");
    }
    p.history.push({
      id: crypto.randomUUID(),
      summary: summaries[verb],
      at: new Date().toISOString(),
      actor: who,
    });
    return {
      ok: true,
      project: await creativeQuery<ProjectRecord>("creative_save", [
        hash,
        p.id,
        record.revision,
        p,
      ]),
    };
  } catch (error) {
    return creativeFailure(
      error instanceof Error ? error.message : "STORAGE_ERROR",
    );
  }
}

/**
 * Applies a proposal to the artwork: the one place that does it, whether the
 * artist approved it or chose to let AI changes land right away. A layer
 * locked since the proposal was made is still protected.
 */
function approveProposal(p: Project, proposal: Suggestion, automatic: boolean): CreativeReply | null {
  const locked = lockedLayerChanges(p.art, proposal.patch);
  if (locked.length)
    return creativeFailure(
      "LAYER_LOCKED",
      `This proposal changes ${locked.join(", ")}, which is locked to hand-only edits. Decline it, or unlock the layer first.`,
    );
  const before = p.art;
  p.art = { ...p.art, ...proposal.patch };
  const seen = { ...p.art, aiMarks: before.aiMarks, aiAssisted: before.aiAssisted };
  p.art.aiMarks = marksAfterAi(before, seen);
  p.art.aiAssisted = assistedAfterAi(before, seen);
  if (proposal.motion) p.motion = { ...p.motion, ...proposal.motion };
  recordVersion(p, automatic ? `AI applied: ${proposal.intent}` : proposal.intent);
  p.decisions.push({
    id: crypto.randomUUID(),
    title: proposal.intent,
    reason: proposal.rationale,
    cites: proposal.cites,
    version: p.versions.length,
  });
  proposal.status = "approved";
  return null;
}
