/**
 * The tools a harness sees. Each one is a thin, typed wrapper over a command
 * in `commands` (src/creative/contracts.ts) sent through the app's single
 * /api/creative route, so every write passes the same checks and is recorded
 * in the same history as a change made on screen.
 *
 * A tool whose command does not exist in this build of the app is simply not
 * listed, so the list always matches what the app can actually do.
 */
import { z, type ZodObject, type ZodRawShape, type ZodTypeAny } from "zod";
import {
  commands,
  layerAdjustment,
  type CreativeReply,
  type ImageLayer,
  type ProjectRecord,
} from "../../src/creative/contracts";
import { works } from "../../src/creative/catalog";
import type { CommandClient } from "./client";
import { compactProject, compactWorkspace, proposalView } from "./format";
import {
  describeProperties,
  explainIssues,
  takesRevision,
  toInputSchema,
  withOptionalRevision,
  type JsonSchema,
} from "./schema";

export interface ToolContext {
  client: CommandClient;
}

export interface ToolResult {
  [key: string]: unknown;
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

type Args = Record<string, unknown>;
type Payload = Record<string, unknown> & { ok: boolean };

export interface ToolSpec {
  name: string;
  title: string;
  description: string;
  /** True when the tool never changes anything. */
  readOnly: boolean;
  /** Validates what the harness sends. */
  input: ZodTypeAny;
  /** The same shape as JSON Schema, for tools/list. */
  inputSchema: JsonSchema;
  run(args: Args, ctx: ToolContext): Promise<Payload>;
}

/* ----------------------------------------------------------- results ---- */

const HINTS: Record<string, string> = {
  CONFLICT:
    "The project changed since that revision. Call get_project, or leave revision out to use the latest.",
  SESSION_INVALID:
    "This session has ended. Call list_projects to open a new guest workspace, or set KRESILO_SESSION to a current session.",
  PROPOSAL_STALE:
    "The artwork changed after this proposal was made. Call request_proposal again.",
  PROPOSAL_CLOSED: "This proposal was already decided. Call get_project to see where things stand.",
  REASON_REQUIRED:
    "Call add_reference first: a proposal needs a saved reference and the reason it matters.",
  NOT_FOUND: "Check the ids with get_project (or list_works for workId values).",
  FORBIDDEN: "This session cannot see that project. Check the id with list_projects.",
  LIMIT_REACHED: "A limit for this project was reached. Create a new project or review what is waiting.",
  RATE_LIMITED: "Too many calls in a minute. Wait a little, then retry.",
  APP_UNREACHABLE: "Is the app running, and does KRESILO_URL point at it?",
  STORAGE_SETUP_REQUIRED: "The app has no storage connected yet; it needs to be set up by whoever runs it.",
};

export function failurePayload(code: string, message: string): Payload {
  return { ok: false, code, message, ...(HINTS[code] ? { hint: HINTS[code] } : {}) };
}

type Failed = Extract<CreativeReply, { ok: false }>;
// The app compiles without strict null checks, which stops `!reply.ok` from narrowing; this guard does.
const isFail = (reply: CreativeReply): reply is Failed => !reply.ok;

function failureFrom(reply: Failed): Payload {
  return failurePayload(reply.code, reply.message);
}

/** The text a harness reads back: compact JSON, never pretty-printed. */
export function toResult(payload: Payload, notes: string[] = []): ToolResult {
  const body = notes.length ? { ...payload, notes } : payload;
  return {
    content: [{ type: "text", text: JSON.stringify(body) }],
    ...(payload.ok ? {} : { isError: true }),
  };
}

function projectPayload(record: ProjectRecord, extra: Record<string, unknown> = {}): Payload {
  return { ok: true, revision: record.revision, ...extra, project: compactProject(record) };
}

/* ---------------------------------------------------------- building ---- */

const PROJECT_NOTES = {
  projectId: "Project id from list_projects or create_project.",
  revision:
    "Project revision from your last result. Leave it out to use the latest; send it to be told if someone else changed the project meanwhile.",
};

interface CommandToolOptions {
  name: string;
  title: string;
  verb: string;
  description: string;
  readOnly?: boolean;
  notes?: Record<string, string>;
  /** Builds the result from the app's reply; defaults to the compact project. */
  shape?: (reply: Extract<CreativeReply, { ok: true }>, args: Args, ctx: ToolContext) => Payload;
}

async function latestRevision(
  ctx: ToolContext,
  projectId: unknown,
): Promise<{ revision: number } | { failure: Payload }> {
  const read = await ctx.client.command("project.get", { projectId });
  if (isFail(read)) return { failure: failureFrom(read) };
  if (!read.project) return { failure: failurePayload("BAD_RESPONSE", "The app did not return the project.") };
  return { revision: read.project.revision };
}

function commandTool(options: CommandToolOptions): ToolSpec | null {
  if (!Object.prototype.hasOwnProperty.call(commands, options.verb)) return null;
  const command = commands[options.verb as keyof typeof commands] as unknown as ZodObject<ZodRawShape>;
  const needsRevision = takesRevision(command);
  const input = needsRevision ? withOptionalRevision(command) : command;
  const inputSchema = describeProperties(toInputSchema(input), {
    ...(needsRevision || "projectId" in command.shape ? PROJECT_NOTES : {}),
    ...options.notes,
  });
  return {
    name: options.name,
    title: options.title,
    description: options.description,
    readOnly: options.readOnly ?? false,
    input,
    inputSchema,
    async run(args, ctx) {
      let revision = args.revision;
      const automatic = needsRevision && revision === undefined;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        if (automatic) {
          const latest = await latestRevision(ctx, args.projectId);
          if ("failure" in latest) return latest.failure;
          revision = latest.revision;
        }
        const reply = await ctx.client.command(options.verb, needsRevision ? { ...args, revision } : args);
        // Someone saved between the read and the write: read once more, then give up.
        if (isFail(reply) && reply.code === "CONFLICT" && automatic && attempt === 0) continue;
        if (isFail(reply)) return failureFrom(reply);
        return (options.shape ?? defaultShape)(reply, args, ctx);
      }
      return failurePayload("CONFLICT", "The project kept changing. Try again.");
    },
  };
}

function defaultShape(reply: Extract<CreativeReply, { ok: true }>): Payload {
  if (reply.project) return projectPayload(reply.project);
  if (reply.workspace) return { ok: true, ...compactWorkspace(reply.workspace) };
  return { ok: true, ...(reply.url ? { url: reply.url } : {}) };
}

/* ------------------------------------------------------- layer editing ---- */

const editLayerInput = z
  .object({
    projectId: z.string().uuid(),
    revision: z.number().int().positive().optional(),
    layer: z.string().trim().min(1).max(160),
    changes: layerAdjustment.refine(
      (c) => Object.keys(c).length > 0,
      "Change at least one property",
    ),
  })
  .strict();

type Layer = ImageLayer & Record<string, unknown>;

function findLayer(layers: Layer[], wanted: string): Layer | Payload {
  const byId = layers.find((l) => l.id === wanted);
  if (byId) return byId;
  const byName = layers.filter((l) => l.name.toLowerCase() === wanted.toLowerCase());
  if (byName.length === 1) return byName[0];
  const list = layers.map((l) => ({ id: l.id, name: l.name }));
  return byName.length > 1
    ? { ...failurePayload("AMBIGUOUS_LAYER", `More than one layer is named "${wanted}". Use an id.`), layers: list }
    : {
        ...failurePayload(
          "NOT_FOUND",
          layers.length
            ? `No layer with that id or name. Layers in this project are listed here.`
            : "This project has no image layers. Use edit_artwork for the title, caption or background.",
        ),
        layers: list,
      };
}

function editLayerTool(): ToolSpec | null {
  if (!Object.prototype.hasOwnProperty.call(commands, "artwork.edit")) return null;
  return {
    name: "edit_layer",
    title: "Edit an image layer",
    description:
      "Change one image layer on the poster by id or name: position (x, y as % of the canvas, -100..100), size (width, height 5..200), opacity 0..1, rotation -180..180, visibility, filter (none, grayscale, warm, cool), flip, shadow, blend, and the crop, mask and adjust objects (send each whole). Only the properties you send change; the rest of the layer is kept. Saves a new version, so undo reverts it.",
    readOnly: false,
    input: editLayerInput,
    inputSchema: describeProperties(toInputSchema(editLayerInput), {
      ...PROJECT_NOTES,
      layer: "Layer id or name, as shown by get_project (art.layers).",
      changes: "Only the properties to change.",
    }),
    async run(args, ctx) {
      const read = await ctx.client.command("project.get", { projectId: args.projectId });
      if (isFail(read)) return failureFrom(read);
      if (!read.project) return failurePayload("BAD_RESPONSE", "The app did not return the project.");
      const layers = (read.project.document.art.layers ?? []) as Layer[];
      const found = findLayer(layers, String(args.layer));
      if ("ok" in found) return found as Payload;
      const next = layers.map((l) => (l.id === found.id ? { ...l, ...(args.changes as object) } : l));
      const reply = await ctx.client.command("artwork.edit", {
        projectId: args.projectId,
        revision: args.revision ?? read.project.revision,
        patch: { layers: next },
      });
      if (isFail(reply)) return failureFrom(reply);
      const saved = reply.project?.document.art.layers?.find((l) => l.id === found.id);
      return projectPayload(reply.project as ProjectRecord, { layer: saved });
    },
  };
}

/* ---------------------------------------------------- catalogue lookup ---- */

const listWorksInput = z
  .object({
    query: z.string().trim().max(100).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  })
  .strict();

function listWorksTool(): ToolSpec {
  return {
    name: "list_works",
    title: "Browse the reference catalogue",
    description:
      "Find works in Kresilo's catalogue to save as references. Matches title, creator, tags and description (leave query out to list them all). Use a result's id as workId in add_reference.",
    readOnly: true,
    input: listWorksInput,
    inputSchema: describeProperties(toInputSchema(listWorksInput), {
      query: "Words to look for, for example \"light\" or \"print\".",
      limit: "How many to return (default 30).",
    }),
    async run(args) {
      const words = String(args.query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
      const hits = works.filter((w) => {
        const hay = `${w.title} ${w.creator} ${w.tags.join(" ")} ${w.description}`.toLowerCase();
        return words.every((word) => hay.includes(word));
      });
      return {
        ok: true,
        total: hits.length,
        works: hits.slice(0, Number(args.limit ?? 30)).map((w) => ({
          id: w.id,
          title: w.title,
          creator: w.creator,
          tags: w.tags,
          description: w.description,
          ...(w.motionSrc ? { motion: true } : {}),
        })),
      };
    },
  };
}

/* ------------------------------------------------------- joining a project ---- */

const joinInput = z
  .object({ invite: z.string().trim().min(32).max(400) })
  .strict();

function joinProjectTool(): ToolSpec | null {
  if (!Object.prototype.hasOwnProperty.call(commands, "project.join")) return null;
  return {
    name: "join_project",
    title: "Join a shared project",
    description:
      "Open a project a person shared with you. In Kresilo they choose Invite on the project, then paste you the link. The project then appears in list_projects.",
    readOnly: false,
    input: joinInput,
    inputSchema: describeProperties(toInputSchema(joinInput), {
      invite: "The invite link (…/join/<token>) or just the token after /join/.",
    }),
    async run(args, ctx) {
      const token = String(args.invite).replace(/^.*\/join\//, "").replace(/[/?#].*$/, "");
      const reply = await ctx.client.command("project.join", { token });
      if (isFail(reply)) return failureFrom(reply);
      return reply.project ? projectPayload(reply.project) : { ok: true };
    },
  };
}

/* ------------------------------------------------------------ the list ---- */

export function buildTools(): ToolSpec[] {
  const tools: (ToolSpec | null)[] = [
    commandTool({
      name: "list_projects",
      title: "List projects",
      verb: "workspace.get",
      readOnly: true,
      description:
        "List the projects in this Kresilo workspace (id, title, revision, how many references and proposals are waiting). Start here. With no session configured, the first call opens a fresh guest workspace.",
    }),
    commandTool({
      name: "get_project",
      title: "Read a project",
      verb: "project.get",
      readOnly: true,
      description:
        "Read one project: the current artwork (title, caption, colour, background and every image layer with its id), motion, saved references with the reason for each, proposals waiting for a decision, recent comments and history, and whether undo or redo is possible. The revision in the result is what later calls can name.",
    }),
    commandTool({
      name: "create_project",
      title: "Create a project",
      verb: "project.create",
      description:
        "Start a new poster project from a brief. Optionally pick a template, or start from a catalogue work (sourceWorkId from list_works) with the reason it matters. Returns the new project and its id.",
      notes: {
        brief: "What the piece is for, in a sentence or two.",
        template: "Starting look: evening-poster, material-study or culture-cover. Leave it out to start on a plain ground titled from the brief.",
        sourceWorkId: "A catalogue work id from list_works to start from.",
        reason: "Why that work matters for this project (used when sourceWorkId is set).",
      },
    }),
    commandTool({
      name: "add_reference",
      title: "Save a reference",
      verb: "reference.carry",
      description:
        "Save a catalogue work as a reference, with the reason it matters. A proposal needs at least one reference and is grounded in these reasons, so write the reason as the person's intent, not a caption. Find workId with list_works.",
      notes: {
        workId: "Catalogue work id from list_works.",
        reason: "Why this reference matters to this project.",
      },
    }),
    commandTool({
      name: "request_proposal",
      title: "Ask for a proposal",
      verb: "proposal.request",
      description:
        "Ask Kresilo's copilot to propose a change to the artwork, grounded in the saved references. Nothing changes until the proposal is accepted (unless the project is set to apply AI changes right away). Focus it with `targets` (several layer ids) or `target` (one layer id, or title, caption, background), whichever the schema offers, to limit what it may touch; otherwise it considers the whole composition. Returns the proposal with its rationale and exact patch.",
      notes: {
        intent: "What you want, in plain words, for example \"make the type quieter and warmer\".",
        target: "One layer id, or title, caption, background, to limit the change to.",
        targets: "Layer ids, or title, caption, background, to limit the change to. Leave out for the whole composition.",
      },
      shape(reply) {
        const record = reply.project as ProjectRecord;
        const latest = record.document.proposals.at(-1);
        const applied = latest?.status === "approved";
        return projectPayload(record, {
          proposal: latest ? proposalView(latest) : undefined,
          next: applied
            ? "This project applies AI changes right away, so it is already on the artwork. Call undo to revert it."
            : "Nothing has changed yet. Call accept_proposal to apply it or decline_proposal to keep the current artwork.",
        });
      },
    }),
    commandTool({
      name: "accept_proposal",
      title: "Accept a proposal",
      verb: "proposal.accept",
      description:
        "Apply a proposal to the artwork. This saves a new version and records the decision with its cited references. Accept when the person asked you to make the change; check with them first when it is a bigger call than they asked for.",
      notes: { proposalId: "Proposal id from request_proposal or get_project (proposalsWaiting)." },
    }),
    commandTool({
      name: "decline_proposal",
      title: "Decline a proposal",
      verb: "proposal.reject",
      description: "Keep the current artwork and close a proposal. Nothing on the artwork changes.",
      notes: { proposalId: "Proposal id from request_proposal or get_project (proposalsWaiting)." },
    }),
    editLayerTool(),
    commandTool({
      name: "edit_artwork",
      title: "Edit the artwork",
      verb: "artwork.edit",
      description:
        "Change the poster itself: title, caption, colour, type size and position, the catalogue background, visibility of the title and caption, or the whole layers array. For one image layer prefer edit_layer. Only the properties you send change. Saves a new version.",
    }),
    commandTool({
      name: "set_ai_apply",
      title: "Choose how AI changes land",
      verb: "project.ai",
      description:
        "Choose whether AI proposals wait for approval (ask) or are applied the moment they are made and can be undone (auto).",
      notes: { apply: "ask: wait for approval. auto: apply right away; undo reverts." },
    }),
    commandTool({
      name: "undo",
      title: "Undo",
      verb: "version.undo",
      description: "Step the artwork back to the previous version. The step itself is kept in history and redo can reverse it.",
    }),
    commandTool({
      name: "redo",
      title: "Redo",
      verb: "version.redo",
      description: "Step forward again after an undo.",
    }),
    commandTool({
      name: "comment",
      title: "Comment on a project",
      verb: "comment.add",
      description: "Leave a comment on the project. It is signed with this connection's actor name, so the person can tell it came from you.",
    }),
    commandTool({
      name: "invite_project",
      title: "Invite a person to a project",
      verb: "project.invite",
      description:
        "Make a link that lets a person open this project in their browser, for example one you created. Anyone with the link can join, so hand it only to the person it is for.",
      shape(reply, _args, ctx) {
        return { ok: true, url: reply.url ? `${ctx.client.baseUrl}${reply.url}` : undefined };
      },
    }),
    joinProjectTool(),
    listWorksTool(),
  ];
  return tools.filter((tool): tool is ToolSpec => tool !== null);
}

/* ---------------------------------------------------------- dispatch ---- */

export async function callTool(
  tools: ToolSpec[],
  name: string,
  rawArgs: unknown,
  ctx: ToolContext,
): Promise<ToolResult> {
  const tool = tools.find((t) => t.name === name);
  if (!tool)
    return toResult(
      failurePayload("UNKNOWN_TOOL", `There is no tool called "${name}". Available: ${tools.map((t) => t.name).join(", ")}.`),
    );
  const parsed = tool.input.safeParse(rawArgs ?? {});
  if (!parsed.success)
    return toResult({
      ok: false,
      code: "INVALID_INPUT",
      message: explainIssues(parsed.error),
      hint: `Fix these and call ${name} again; its input schema is in tools/list.`,
    });
  let payload: Payload;
  try {
    payload = await tool.run(parsed.data as Args, ctx);
  } catch (error) {
    payload = failurePayload("TOOL_ERROR", error instanceof Error ? error.message : "The call failed.");
  }
  return toResult(payload, ctx.client.takeNotes());
}
