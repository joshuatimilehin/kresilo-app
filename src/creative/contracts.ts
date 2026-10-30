import { z } from "zod";
import { libraryArtSchema } from "./libraryArt";
import { visualRefSchema } from "./visuals/schema";
import { culturalContextSchema, cleanCulture, type CulturalContext } from "./culture";
import { disclosureSchema, publicStory, type Disclosure, type PublicStory } from "./publicStory";
import { lineFromBrief, titleFromBrief } from "./guidance";
import { specialistIds, type SpecialistId } from "./specialists";
import { draftRequest, type DraftOps } from "./canvasDraft";
import { vectorRequest, type VectorResult } from "./canvasVector";
import { MAX_PICTURE_BASE64, PICTURE_TYPES } from "./canvasImages";
import { VERSION_KINDS, type CanvasVersion } from "./canvasVersions";
export const assetKeys = [
  "after-light",
  "mineral",
  "culture-type",
  "dusk-study",
  "folded-paper",
  "quiet-type",
  "market-rhythm",
  "blue-hour",
  "soft-structures",
  "moving-colour",
  "tidal-lines",
  "chrome-orbit",
  "red-interval",
  "garden-grid",
  "night-signal",
  "paper-orbit",
  "plain-paper",
  "portrait-leap",
  "portrait-shades",
  "anime-rooftop",
  "anime-rain",
  "vinyl-dusk",
  "vinyl-bloom",
] as const;
export type AssetKey = (typeof assetKeys)[number];
const short = z.string().trim().min(1).max(160);
const uuid = z.string().uuid();
export const blendModes = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "soft-light",
  "hard-light",
  "difference",
] as const;
export const layerShadows = ["none", "soft", "hard"] as const;
export const layerMaskShapes = ["none", "ellipse", "rounded", "brush"] as const;
const edge = z.number().min(0).max(80);
/**
 * Non-destructive effects. Every value is a bounded number, a boolean or a
 * closed word, so nothing a person or a model returns can become executable
 * CSS. All are optional so layers saved before these existed still parse.
 */
const layerEffects = {
  crop: z
    .object({ top: edge, right: edge, bottom: edge, left: edge })
    .strict()
    .refine(
      (c) => c.top + c.bottom <= 90 && c.left + c.right <= 90,
      "Crop must leave part of the image visible",
    )
    .optional(),
  mask: z
    .object({
      shape: z.enum(layerMaskShapes),
      feather: z.number().min(0).max(40),
      invert: z.boolean(),
      /** Brush strokes, in percent of the layer; painted areas show (or hide, when inverted). */
      strokes: z
        .array(
          z
            .object({
              size: z.number().min(1).max(40),
              points: z.array(z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)])).min(1).max(200),
            })
            .strict(),
        )
        .max(40)
        .optional(),
    })
    .strict()
    .optional(),
  shadow: z.enum(layerShadows).optional(),
  blend: z.enum(blendModes).optional(),
  flipX: z.boolean().optional(),
  flipY: z.boolean().optional(),
  adjust: z
    .object({
      brightness: z.number().min(0).max(2),
      contrast: z.number().min(0).max(2),
      saturation: z.number().min(0).max(2),
      blur: z.number().min(0).max(20),
      /** A warm (positive) or cool (negative) tint. Absent means none. */
      warmth: z.number().min(-1).max(1).optional(),
      /** Film grain from none (0) to strong (1). Absent means none. */
      grain: z.number().min(0).max(1).optional(),
    })
    .strict()
    .optional(),
};
/**
 * What a layer is for, in one word. Optional, so layers saved before roles
 * existed still parse. The plain-language labels live in `layerNames.ts`.
 */
export const layerRoles = [
  "background",
  "subject",
  "texture",
  "type",
  "ornament",
  "overlay",
  "shape",
  "other",
] as const;
export type LayerRole = (typeof layerRoles)[number];
export const imageLayerSchema = z
  .object({
    id: uuid,
    name: short,
    role: z.enum(layerRoles).optional(),
    asset: z.enum(assetKeys).optional(),
    mediaId: uuid.optional(),
    x: z.number().min(-100).max(100),
    y: z.number().min(-100).max(100),
    width: z.number().min(5).max(200),
    height: z.number().min(5).max(200),
    opacity: z.number().min(0).max(1),
    rotation: z.number().min(-180).max(180),
    visible: z.boolean(),
    filter: z.enum(["none", "grayscale", "warm", "cool"]).default("none"),
    ...layerEffects,
    /**
     * Hand-only. When true, no AI proposal may change or remove this layer.
     * Deliberately absent from `layerAdjustment`, so a proposal can never set
     * or clear a lock; only a person's own edit can.
     */
    aiLock: z.boolean().optional(),
    /** Layers with the same group move and select together (issue #53). */
    group: z.string().regex(/^[a-z0-9]{4,12}$/).optional(),
    /** Drawn from a library asset or a template scene instead of a photo (see libraryArt.ts). */
    libraryArt: libraryArtSchema.optional(),
    /**
     * A picture from Kresilo's visual library, recoloured to the colours stored
     * here (see visuals/types.ts). Like library art it uses a placeholder
     * `asset`; the picture comes from `visual.id`.
     */
    visual: visualRefSchema.optional(),
  })
  .strict()
  .refine(
    (v) => Boolean(v.asset) !== Boolean(v.mediaId),
    "Choose one image source",
  );
export type ImageLayer = z.infer<typeof imageLayerSchema>;
export const layerAdjustment = z
  .object({
    x: z.number().min(-100).max(100).optional(),
    y: z.number().min(-100).max(100).optional(),
    width: z.number().min(5).max(200).optional(),
    height: z.number().min(5).max(200).optional(),
    opacity: z.number().min(0).max(1).optional(),
    rotation: z.number().min(-180).max(180).optional(),
    visible: z.boolean().optional(),
    filter: z.enum(["none", "grayscale", "warm", "cool"]).optional(),
    ...layerEffects,
  })
  .strict();
/**
 * How the title is set. Only two fonts are offered because only these two are
 * embedded in the motion export too, so what you set is what plays back.
 */
export const titleFonts = ["poster", "sans"] as const;
export const titleAligns = ["left", "center", "right"] as const;
export const titleTypeSchema = z
  .object({
    font: z.enum(titleFonts),
    italic: z.boolean(),
    weight: z.number().int().min(400).max(900),
    align: z.enum(titleAligns),
    /** Line height as a multiple of the type size. */
    lineHeight: z.number().min(0.7).max(1.6),
    /** Letter spacing in hundredths of an em (-8 to 20). */
    tracking: z.number().min(-8).max(20),
  })
  .strict();
export type TitleType = z.infer<typeof titleTypeSchema>;
/** The look every title had before type controls existed. */
export const defaultTitleType: TitleType = {
  font: "poster",
  italic: true,
  weight: 400,
  align: "left",
  lineHeight: 0.78,
  tracking: -4,
};
/**
 * Text and shapes drawn on the artwork (issue #53). They sit above the image
 * layers and below the title. Every value is bounded or from a closed list, so
 * nothing a person (or a model) sends can become arbitrary CSS.
 */
const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
const markBase = {
  id: uuid,
  name: short.max(60),
  x: z.number().min(-20).max(100),
  y: z.number().min(-20).max(100),
  width: z.number().min(2).max(120),
  height: z.number().min(2).max(120),
  rotation: z.number().min(-180).max(180),
  opacity: z.number().min(0).max(1),
  visible: z.boolean(),
};
export const textMarkSchema = z
  .object({
    ...markBase,
    kind: z.literal("text"),
    text: z.string().trim().min(1).max(80),
    color: hex,
    /** Size in hundredths of the canvas width. */
    size: z.number().min(2).max(40),
    font: z.enum(titleFonts),
    italic: z.boolean(),
    weight: z.number().int().min(400).max(900),
    align: z.enum(titleAligns),
  })
  .strict();
export const shapeKinds = ["rectangle", "ellipse", "line"] as const;
export const shapeMarkSchema = z
  .object({
    ...markBase,
    kind: z.literal("shape"),
    shape: z.enum(shapeKinds),
    /** A colour, or "none" for an outline only. */
    fill: z.union([hex, z.literal("none")]),
    stroke: hex,
    strokeWidth: z.number().min(0).max(20),
    /** Corner rounding of a rectangle, in percent. */
    radius: z.number().min(0).max(50),
  })
  .strict();
/**
 * A freehand drawing: strokes drawn by hand on the canvas. Points are percent
 * of the canvas width (x) and height (y); a stroke's size is in hundredths of
 * the canvas width. One drawing holds many strokes, so drawing does not use up
 * the twelve text and shape layers.
 */
export const pathMarkSchema = z
  .object({
    ...markBase,
    kind: z.literal("path"),
    strokes: z
      .array(
        z
          .object({
            points: z.array(z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)])).min(1).max(300),
            color: hex,
            size: z.number().min(0.2).max(10),
          })
          .strict(),
      )
      .min(1)
      .max(60),
  })
  .strict();
export const markSchema = z.discriminatedUnion("kind", [textMarkSchema, shapeMarkSchema, pathMarkSchema]);
export type TextMark = z.infer<typeof textMarkSchema>;
export type ShapeMark = z.infer<typeof shapeMarkSchema>;
export type PathMark = z.infer<typeof pathMarkSchema>;
export type Mark = z.infer<typeof markSchema>;
export const MAX_MARKS = 12;
/** Longest saved canvas scene, in characters of JSON. A saved project document is refused above 2 MB, and the scene shares it. */
export const CANVAS_SCENE_MAX = 1_000_000;
/** Longest board snapshot, in characters of its PNG data URL. */
export const SNAPSHOT_MAX = 180_000;
/** Canvas shapes. Poster is the original 3:4 and the default. */
export const artFormats = ["poster", "story", "square", "wide"] as const;
export type ArtFormat = (typeof artFormats)[number];
/** Width divided by height. */
export const formatRatio: Record<ArtFormat, number> = { poster: 3 / 4, story: 9 / 16, square: 1, wide: 16 / 9 };
export const ratioOf = (art: { format?: ArtFormat; snapshot?: { width: number; height: number } }) =>
  art.snapshot ? art.snapshot.width / art.snapshot.height : formatRatio[art.format ?? "poster"];
export const artPatch = z
  .object({
    title: z.string().trim().min(1).max(70).optional(),
    caption: z.string().trim().max(80).optional(),
    color: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i)
      .optional(),
    size: z.number().min(12).max(45).optional(),
    x: z.number().min(0).max(65).optional(),
    y: z.number().min(0).max(80).optional(),
    asset: z.enum(assetKeys).optional(),
    backgroundMediaId: uuid.nullable().optional(),
    backgroundOpacity: z.number().min(0).max(1).optional(),
    backgroundFilter: z.enum(["none", "grayscale", "warm", "cool"]).optional(),
    titleVisible: z.boolean().optional(),
    titleType: titleTypeSchema.optional(),
    format: z.enum(artFormats).optional(),
    style: z.string().regex(/^[a-z0-9-]{1,40}$/).nullable().optional(),
    /** The plain colour behind everything; shows wherever the photo is see-through or off. */
    canvasColor: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i)
      .optional(),
    marks: z
      .array(markSchema)
      .max(MAX_MARKS)
      .refine((v) => new Set(v.map((m) => m.id)).size === v.length, "Mark IDs must be unique")
      .optional(),
    captionVisible: z.boolean().optional(),
    /** Parts the assistant changed and the artist has not touched since; set by the server (see aiMarks.ts). */
    aiMarks: z.array(z.string().max(60)).max(40).optional(),
    /** Parts the artist edited after an AI change; set by the server (see aiMarks.ts). */
    aiAssisted: z.array(z.string().max(60)).max(40).optional(),
    layers: z
      .array(imageLayerSchema)
      .max(12)
      .refine(
        (v) => new Set(v.map((l) => l.id)).size === v.length,
        "Layer IDs must be unique",
      )
      .optional(),
  })
  .strict();
export type Art = {
  title: string;
  caption?: string;
  color: string;
  size: number;
  x: number;
  y: number;
  asset: AssetKey;
  backgroundMediaId?: string | null;
  backgroundOpacity?: number;
  backgroundFilter?: ImageLayer["filter"];
  titleVisible?: boolean;
  titleType?: TitleType;
  format?: ArtFormat;
  canvasColor?: string;
  /** The Open Design style the project follows (openDesign/styles.ts), if any. */
  style?: string | null;
  marks?: Mark[];
  captionVisible?: boolean;
  aiMarks?: string[];
  aiAssisted?: string[];
  layers?: ImageLayer[];
  /** A picture of the canvas's cover board. When set, the artwork is drawn from it (see Artwork) instead of the layers. */
  snapshot?: ArtSnapshot;
};
/** The cover board of the Studio canvas as a PNG data URL, with its size. Saved by `canvas.cover`. */
export type ArtSnapshot = { image: string; width: number; height: number; at: string };
export const motionMovements = [
  "drift",
  "rise",
  "still",
  "cut",
  "type",
  "collage",
  "zoom",
  "pan",
  "pop",
  "float",
  "spin",
  "glitch",
  "wipe",
  "pulse",
] as const;
/** Movements that keep time with the pace (beat) setting. */
export const beatMovements: readonly (typeof motionMovements)[number][] = ["cut", "type", "collage", "glitch", "pulse"];
export type Motion = {
  seconds: number;
  beat?: number;
  movement: (typeof motionMovements)[number];
  loop: boolean;
};
export type Reference = {
  id: string;
  workId: string;
  title: string;
  creator: string;
  source: string;
  reason: string;
  asset: AssetKey;
  tags: string[];
  mediaId?: string;
  contentType?: string;
};
export const teamRoles = ["Lead", "Design", "Type", "Motion", "Feedback"] as const;
export type TeamRole = (typeof teamRoles)[number];
/** Exactly one person leads a project, the owner, so invited people hold the other roles. */
export const memberRoles = ["Design", "Type", "Motion", "Feedback"] as const;
export type MemberRole = (typeof memberRoles)[number];
/**
 * A person the owner has invited to a project. Roles describe credit; access
 * (edit or comment) is set separately so a credit never silently grants
 * permission. The owner is the Lead and is not stored here.
 */
export type TeamMember = {
  id: string;
  name: string;
  roles: MemberRole[];
  access: "edit" | "comment";
  /** Published pages name only people whose credit is confirmed. */
  credit: "pending" | "confirmed" | "declined";
  state: "invited" | "revoked";
  invitedAt: string;
  expiresAt: string;
};
export type Suggestion = {
  id: string;
  intent: string;
  rationale: string;
  cites: string[];
  patch: z.infer<typeof artPatch>;
  baseVersion: number;
  status: "proposed" | "approved" | "declined";
  /** A declined suggestion the artist asked the assistant to stop learning from. */
  forgotten?: boolean;
  provenance: string;
  target?: string;
  targets?: string[];
  motion?: Partial<Motion>;
  /** Kinds of change the artist's switches kept out of this suggestion (see aiAllow.ts). */
  blocked?: ("words" | "layout" | "look" | "images")[];
  /** Plain sentences about parts of the reply that were left out (locked layers, limits), shown with the suggestion. */
  notes?: string[];
  /** The model's own rationale, kept on the record when part of its reply was left out and `rationale` names what actually changes. */
  modelReason?: string;
  /** The designer (specialists.ts) the model worked as. Set only when a model was called with that designer's guidance; never the model's name. */
  specialist?: SpecialistId;
};
export type Project = {
  id: string;
  title: string;
  brief: string;
  art: Art;
  /** The infinite canvas: one Excalidraw scene as JSON. Saved by `canvas.save` without a history entry. */
  canvas?: { scene: string; at: string; /** Parts by hand, AI-assisted and AI-generated, counted when the scene is saved (see canvasOrigins.ts). */ origins?: { hand: number; assisted: number; generated: number }; /** Earlier scenes, newest first (see canvasVersions.ts); the app only receives them without their scenes. */ versions?: CanvasVersion[] };
  motion: Motion;
  references: Reference[];
  referenceArchive?: Reference[];
  proposals: Suggestion[];
  team?: TeamMember[];
  /** "auto": a proposal is applied the moment it is made (and can be undone). Default "ask". */
  aiApply?: "off" | "ask" | "auto";
  /** What the assistant may change (words off by default); see aiAllow.ts. */
  aiAllow?: Partial<Record<"words" | "layout" | "look" | "images", boolean>>;
  /**
   * Undo and redo stacks of version ids. `at` is the version on the canvas now
   * (the latest when absent); `moves` counts undo/redo steps, so a proposal made
   * before one is stale. Undo and redo never add a saved version.
   */
  versionNavigation?: { undo: string[]; redo: string[]; at?: string; moves?: number };
  versions: {
    id: string;
    number: number;
    /** The version this one was made from, when that was not the one before it (an edit after undo). */
    parent?: string;
    art: Art;
    motion: Motion;
    note: string;
    at: string;
  }[];
  history: { id: string; summary: string; at: string; actor: string }[];
  comments: {
    id: string;
    text: string;
    author: string;
    at: string;
    resolved: boolean;
  }[];
  decisions: {
    id: string;
    title: string;
    reason: string;
    cites: string[];
    version: number;
  }[];
  mode: "guided" | "explorer" | "advanced";
};
export type ProjectRecord = {
  id: string;
  revision: number;
  document: Project;
  owner: boolean;
};
/** A hosted event's own cover: an Octo file id and its signature. */
export const EVENT_COVER_REF = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[0-9a-f]{32}$/;
/** One line of an event's schedule: a clock time ("19:30") and what happens then. */
export const scheduleRowSchema = z.object({ time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), label: z.string().trim().min(1).max(60) }).strict();
export type ScheduleRow = { time: string; label: string };
/** The most rows an event's schedule holds. */
export const SCHEDULE_MAX = 12;
/** An event a person hosts: kept on their profile (see Meetups.tsx). */
export const hostedEventSchema = z
  .object({
    id: z.string().regex(/^h-[a-z0-9]{6,16}$/),
    title: z.string().trim().min(1).max(80),
    format: z.enum(["in-person", "online", "hybrid"]),
    /** Local start, "2026-11-14T14:00". */
    startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
    minutes: z.number().int().min(15).max(720),
    city: z.string().trim().max(60),
    venue: z.string().trim().max(120),
    link: z.union([z.literal(""), z.string().url().max(300).regex(/^https:\/\//)]),
    spots: z.number().int().min(1).max(5000),
    about: z.string().trim().max(800),
    /** The case study whose cover pictures the event, when it has no picture of its own. */
    projectId: z.string().regex(/^[a-z0-9-]{1,80}$/),
    /** The host's own picture: a signed reference the "event.cover" command returns (see server/creative/eventCovers.ts). */
    cover: z.string().regex(EVENT_COVER_REF).optional(),
    /** The running order, time and label per row (migration 013 gives it its own column). */
    schedule: z.array(scheduleRowSchema as unknown as z.ZodType<ScheduleRow>).max(SCHEDULE_MAX).optional(),
  })
  .strict();
export type HostedEvent = z.infer<typeof hostedEventSchema>;
/** Online and hybrid events need a video link before they are published. */
export const needsVideoLink = (e: Pick<HostedEvent, "format" | "link">) => e.format !== "in-person" && !e.link;
/** What the "event.publish" command accepts: a well-formed event with a link wherever people join online. */
export const publishableEventSchema = hostedEventSchema.refine((e) => !needsVideoLink(e), { message: "Add a video link.", path: ["link"] });
/** A competition's id: "c-" and a short lowercase code. */
export const COMPETITION_ID = /^c-[a-z0-9]{6,16}$/;
/** A competition a host sets: a prompt, a window to enter and vote in, and a few short rules (migration 016). */
export const competitionSchema = z
  .object({
    id: z.string().regex(COMPETITION_ID),
    title: z.string().trim().min(1).max(80),
    prompt: z.string().trim().min(1).max(400),
    rules: z.array(z.string().trim().min(1).max(120)).max(6),
    /** Instants (ISO, UTC): entries and votes are taken from opensAt until closesAt. */
    opensAt: z.string().datetime(),
    closesAt: z.string().datetime(),
    /** The case study whose cover pictures the competition, when it has no picture of its own. */
    projectId: z.string().regex(/^[a-z0-9-]{1,80}$/),
    cover: z.string().regex(EVENT_COVER_REF).optional(),
  })
  .strict()
  .refine((c) => Date.parse(c.closesAt) > Date.parse(c.opensAt), { message: "The deadline comes after the start.", path: ["closesAt"] });
export type Competition = {
  id: string;
  title: string;
  prompt: string;
  rules: string[];
  opensAt: string;
  closesAt: string;
  projectId: string;
  cover?: string;
};
export type Person = {
  id: string;
  name: string;
  account: boolean;
  taste: string[];
  following: string[];
  /** Works, collections and open boards this person bookmarked, as "work:id", "collection:id" or "board:id". */
  saved?: string[];
  /** Named boards this person files saved things into (moodboards.ts); each item is also in `saved`. */
  moodboards?: { id: string; name: string; public: boolean; items: string[] }[];
  /** Events this person said they are going to (meetupList.ts ids). */
  going?: string[];
  /** Events this person hosts. */
  hosting?: HostedEvent[];
  mode: "guided" | "explorer" | "advanced";
  location?: string;
  influences?: string;
  analytics?: boolean;
};
export type Workspace = {
  person: Person;
  projects: ProjectRecord[];
  googleReady?: boolean;
};
export const commands = {
  "workspace.get": z.object({}).strict(),
  "project.create": z
    .object({
      brief: z.string().trim().min(1).max(600),
      title: short.optional(),
      template: z
        .enum(["evening-poster", "material-study", "culture-cover"])
        .optional(),
      sourceWorkId: short.optional(),
      reason: z.string().trim().min(1).max(600).optional(),
    })
    .strict(),
  "project.get": z.object({ projectId: uuid }).strict(),
  "project.rename": z.object({ projectId: uuid, revision: z.number().int().positive(), title: short }).strict(),
  /** How AI changes are applied: ask first (the default), or apply right away with undo. */
  "project.ai": z
    .object({
      projectId: uuid,
      revision: z.number().int().positive(),
      /** "off": hand-only, the assistant does nothing; "ask": suggestions wait; "auto": they apply at once. */
      apply: z.enum(["off", "ask", "auto"]).optional(),
      /** What the assistant may change; see aiAllow.ts. */
      allow: z
        .object({ words: z.boolean(), layout: z.boolean(), look: z.boolean(), images: z.boolean() })
        .partial()
        .strict()
        .optional(),
    })
    .strict(),
  "reference.remove": z.object({ projectId: uuid, revision: z.number().int().positive(), referenceId: uuid }).strict(),
  "reference.restore": z.object({ projectId: uuid, revision: z.number().int().positive(), referenceId: uuid }).strict(),
  "reference.copy": z.object({ projectId: uuid, revision: z.number().int().positive(), sourceProjectId: uuid, referenceId: uuid }).strict(),
  /** Places a finished sticker job (server/creative/stickers.ts) on the canvas, marked as AI-generated. */
  "sticker.place": z.object({ projectId: uuid, jobId: uuid }).strict(),
  /** Saves the infinite canvas scene (Excalidraw JSON). A save is not an edit of the artwork, so it adds no history entry. */
  /** Copilot reads a board's marks and answers with a draft: edits to show beside the board. Saves nothing. */
  "canvas.draft": draftRequest.extend({ projectId: uuid }).strict(),
  /** A rough sketch, card or wireframe on the canvas, redrawn as clean on-brand SVG layers. Saves nothing. */
  "canvas.vector": vectorRequest.extend({ projectId: uuid }).strict(),
  /** The cover board of the canvas as a picture, so cards, previews and posts can show it. Adds no history entry. */
  "canvas.cover": z
    .object({
      projectId: uuid,
      revision: z.number().int().positive(),
      image: z.string().startsWith("data:image/png;base64,iVBORw0KGgo").regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/).max(SNAPSHOT_MAX),
      width: z.number().int().min(8).max(4000),
      height: z.number().int().min(8).max(4000),
    })
    .strict(),
  /** A picture added to the canvas, stored as project media (outside the scene) and answered with its id. Private to the project. */
  "canvas.image": z
    .object({
      projectId: uuid,
      contentType: z.enum(PICTURE_TYPES),
      base64: z.string().min(16).max(MAX_PICTURE_BASE64).regex(/^[A-Za-z0-9+/]+={0,2}$/),
    })
    .strict(),
  /** Keeps the scene as it is now as a version of the canvas, labelled by what is about to happen to it. */
  "canvas.version": z.object({ projectId: uuid, revision: z.number().int().positive(), kind: z.enum(VERSION_KINDS), scene: z.string().min(2).max(CANVAS_SCENE_MAX) }).strict(),
  /** Answers with a kept version's scene so the canvas can go back to it. Changes nothing. */
  "canvas.restore": z.object({ projectId: uuid, versionId: z.string().min(1).max(64) }).strict(),
  "canvas.save": z.object({ projectId: uuid, revision: z.number().int().positive(), scene: z.string().min(2).max(CANVAS_SCENE_MAX) }).strict(),
  "media.import": z
    .object({
      projectId: uuid,
      name: short,
      contentType: z.enum([
        "image/jpeg",
        "image/png",
        "image/webp",
        "video/mp4",
      ]),
      base64: z
        .string()
        .min(16)
        .max(6000000)
        .regex(/^[A-Za-z0-9+/]+={0,2}$/),
      reason: z.string().trim().min(1).max(600),
    })
    .strict(),
  "reference.carry": z
    .object({
      projectId: uuid,
      workId: short,
      reason: z.string().trim().min(1).max(600),
    })
    .strict(),
  "artwork.edit": z
    .object({
      projectId: uuid,
      revision: z.number().int().positive(),
      patch: artPatch,
      /** A canvas move, saved quietly: joins the previous hand edit's history step if it was moments ago. */
      group: z.boolean().optional(),
    })
    .strict(),
  "proposal.request": z
    .object({
      projectId: uuid,
      intent: z.string().trim().min(1).max(600),
      target: z.string().max(60).optional(),
      /** Focus: edit only these layers (ids, or title, caption, background). Empty means the whole composition. */
      targets: z.array(z.string().max(60)).max(14).optional(),
      /** The designer to work as (specialists.ts). Left out, Auto reads the brief and the request. */
      specialist: z.enum(specialistIds).optional(),
    })
    .strict(),
  "proposal.accept": z.object({ projectId: uuid, proposalId: uuid }).strict(),
  "proposal.reject": z.object({ projectId: uuid, proposalId: uuid }).strict(),
  /** Stop the assistant learning from a suggestion the artist turned down. */
  "proposal.forget": z.object({ projectId: uuid, proposalId: uuid }).strict(),
  "version.restore": z.object({ projectId: uuid, versionId: uuid }).strict(),
  "version.undo": z
    .object({ projectId: uuid, revision: z.number().int().positive() })
    .strict(),
  "version.redo": z
    .object({ projectId: uuid, revision: z.number().int().positive() })
    .strict(),
  "motion.configure": z
    .object({
      projectId: uuid,
      revision: z.number().int().positive(),
      seconds: z.number().int().min(2).max(12),
      movement: z.enum(motionMovements),
      loop: z.boolean(),
      beat: z.number().min(0.25).max(0.75).optional(),
    })
    .strict(),
  "comment.add": z
    .object({ projectId: uuid, text: z.string().trim().min(1).max(1000) })
    .strict(),
  "comment.resolve": z.object({ projectId: uuid, commentId: uuid }).strict(),
  "profile.update": z
    .object({
      name: short.optional(),
      taste: z.array(z.string().max(40)).max(12).optional(),
      following: z.array(z.string().max(60)).max(30).optional(),
      saved: z
        .array(z.string().regex(/^(work|collection|board|case|post):[a-z0-9-]{1,80}$/))
        .max(200)
        .optional(),
      moodboards: z
        .array(
          z
            .object({
              id: z.string().regex(/^m-[a-z0-9-]{1,40}$/),
              name: z.string().trim().min(1).max(40),
              public: z.boolean(),
              items: z.array(z.string().regex(/^(work|collection|board|case|post):[a-z0-9-]{1,80}$/)).max(200),
            })
            .strict(),
        )
        .max(12)
        .optional(),
      going: z.array(z.string().regex(/^[a-z0-9-]{1,80}$/)).max(100).optional(),
      hosting: z.array(hostedEventSchema).max(20).optional(),
      mode: z.enum(["guided", "explorer", "advanced"]).optional(),
      location: z.string().max(100).optional(),
      influences: z.string().max(300).optional(),
      /** Whether this person's usage is recorded (default on). */
      analytics: z.boolean().optional(),
    })
    .strict(),
  "project.invite": z.object({ projectId: uuid }).strict(),
  /** A viewer's comment on a published post (not the private board comments). */
  "post.comment.add": z
    .object({ publicationId: uuid, text: z.string().trim().min(1).max(1000) })
    .strict(),
  "post.comment.remove": z.object({ publicationId: uuid, commentId: uuid }).strict(),
  /** The maker takes their published post down (migration 012). Others then get NOT_FOUND. */
  "publication.withdraw": z.object({ publicationId: uuid }).strict(),
  /** The maker opens or closes comments on their community post after publishing. */
  "publication.comments": z.object({ publicationId: uuid, open: z.boolean() }).strict(),
  /** A viewer's comment on a sample work in the reel, or on a case study (`case-<id>`) or open board (`board-<id>`); see commentTargets.ts. */
  "work.comment.add": z
    .object({ workId: z.string().regex(/^[a-z0-9-]{1,80}$/), text: z.string().trim().min(1).max(1000) })
    .strict(),
  "work.comment.remove": z.object({ workId: z.string().regex(/^[a-z0-9-]{1,80}$/), commentId: uuid }).strict(),
  /** Follow or stop following a person, or a roster maker (migration 017). Repeating either is harmless. */
  "follow.set": z.object({ id: z.string().regex(/^[a-z0-9-]{1,60}$/), on: z.boolean() }).strict(),
  /** Moves the follows kept in the profile (roster makers) to the server, once. */
  "follow.migrate": z.object({}).strict(),
  /** An event a person hosts, published for everyone (migration 011). */
  "event.publish": z.object({ event: publishableEventSchema }).strict(),
  /** A picture the host chose for their event's cover: stored once, served to everyone, answered with its reference. */
  "event.cover": z
    .object({
      contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
      base64: z
        .string()
        .min(16)
        .max(2_000_000)
        .regex(/^[A-Za-z0-9+/]+={0,2}$/),
    })
    .strict(),
  "event.remove": z.object({ id: z.string().regex(/^h-[a-z0-9]{6,16}$/) }).strict(),
  /** Going to, or no longer going to, an event someone hosts. */
  "event.going": z.object({ id: z.string().regex(/^h-[a-z0-9]{6,16}$/), on: z.boolean() }).strict(),
  /** A competition a person hosts (migration 016), and what happens in it. */
  "competition.publish": z.object({ competition: competitionSchema }).strict(),
  /** The host closes it. With no winner given, the most-voted entry wins. */
  "competition.close": z.object({ id: z.string().regex(COMPETITION_ID), winner: uuid.optional() }).strict(),
  /** A published community project of your own goes in. */
  "competition.enter": z.object({ id: z.string().regex(COMPETITION_ID), publicationId: uuid }).strict(),
  "competition.withdraw": z.object({ entryId: uuid }).strict(),
  /** One vote per person per entry; none on your own. */
  "competition.vote": z.object({ entryId: uuid, on: z.boolean() }).strict(),
  /** The owner opens a board on their project: its picture (an "event.cover" reference), the roles it wants, and whether ideas show to everyone (migration 014). */
  "board.open": z
    .object({
      projectId: uuid,
      cover: z.string().regex(EVENT_COVER_REF),
      wanted: z.array(z.enum(memberRoles)).min(1).max(4),
      ideasPublic: z.boolean(),
    })
    .strict(),
  "board.close": z.object({ id: z.string().regex(/^b-[a-z0-9]{6,16}$/) }).strict(),
  /** Ask to join an open board: a curated one (an id from openBoards.ts) or one a person hosts. */
  "board.ask": z.object({ id: z.string().regex(/^[a-z0-9-]{1,80}$/) }).strict(),
  /** The host lets a person in, or declines them. */
  "board.answer": z.object({ id: z.string().regex(/^b-[a-z0-9]{6,16}$/), personId: uuid, accept: z.boolean() }).strict(),
  /** A pinned idea on a spot of a project's picture (migration 015); see ideaCards.ts for the targets. */
  "idea.add": z
    .object({
      target: z.string().regex(/^(b-[a-z0-9]{6,16}|board-[a-z0-9-]{1,80}|case-[a-z0-9-]{1,80})$/),
      panel: z.number().int().min(0).max(19),
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      text: z.string().trim().min(1).max(280),
      picture: z.string().regex(EVENT_COVER_REF).optional(),
    })
    .strict(),
  "idea.answer": z
    .object({ id: uuid, decision: z.enum(["accept", "decline", "reply"]), reply: z.string().trim().max(280).optional() })
    .strict(),
  "idea.remove": z.object({ id: uuid }).strict(),
  "team.add": z
    .object({
      projectId: uuid,
      name: short,
      roles: z.array(z.enum(memberRoles)).min(1).max(3),
      access: z.enum(["edit", "comment"]),
    })
    .strict(),
  "team.update": z
    .object({
      projectId: uuid,
      memberId: uuid,
      roles: z.array(z.enum(memberRoles)).min(1).max(3).optional(),
      access: z.enum(["edit", "comment"]).optional(),
    })
    .strict(),
  "team.revoke": z.object({ projectId: uuid, memberId: uuid }).strict(),
  /** The owner records the answer a person gave about being credited. */
  "team.credit": z
    .object({
      projectId: uuid,
      memberId: uuid,
      credit: z.enum(["confirmed", "declined"]),
    })
    .strict(),
  "project.join": z.object({ token: z.string().min(32).max(128) }).strict(),
  "publication.create": z
    .object({
      projectId: uuid,
      revision: z.number().int().positive(),
      audience: z.enum(["private", "community"]),
      description: z.string().trim().max(600),
      disclosure: disclosureSchema.optional(),
      /** Written by the maker; no AI path fills it. */
      culture: culturalContextSchema.optional(),
    })
    .strict(),
} as const;
export type CreativeVerb = keyof typeof commands;
export type CommandInput<V extends CreativeVerb> = z.infer<
  (typeof commands)[V]
>;
export type Publication = {
  id: string;
  title: string;
  description: string;
  art: Art;
  motion: Motion;
  creator: string;
  /** The person who published it, when the page that read it could say. */
  authorId?: string;
  /** Cultural context in the maker's own words, when they wrote any. */
  culture?: CulturalContext;
  /** Confirmed collaborators, when there are any. */
  team?: { name: string; roles: string[] }[];
  audience: "private" | "community";
  credits: { title: string; creator: string; source: string }[];
} & Partial<PublicStory>;
export type CreativeReply =
  | {
      ok: true;
      workspace?: Workspace;
      project?: ProjectRecord;
      url?: string;
      publication?: Publication;
      /** From "event.cover": the reference to put on the event. */
      cover?: string;
      /** From "canvas.draft": Copilot's edits to a board, to show as a draft. */
      draft?: DraftOps;
      /** From "canvas.vector": the cleaned SVG, split into named layers. */
      vector?: VectorResult;
      /** From "canvas.image": the stored picture's media id. */
      mediaId?: string;
      /** From "canvas.restore": the kept scene. */
      scene?: string;
    }
  | { ok: false; code: string; message: string };
export const creativeFailure = (
  code: string,
  message?: string,
): CreativeReply => ({
  ok: false,
  code,
  message:
    message ??
    {
      CONFLICT:
        "The project changed in another tab. Refresh before trying again.",
      FORBIDDEN: "You do not have access to this project.",
      SESSION_INVALID: "Your session ended. Reload to start again.",
      PROPOSAL_STALE:
        "The artwork changed after this suggestion. Ask for a fresh proposal.",
      PROPOSAL_CLOSED: "This proposal has already been decided.",
      COMMENTS_CLOSED: "The maker has not opened comments on this post.",
      COMPETITION_CLOSED: "This competition is not taking entries or votes.",
      OWN_ENTRY: "You cannot vote for your own entry.",
      ALREADY_ENTERED: "You already have an entry here.",
      SELF_FOLLOW: "You cannot follow yourself.",
      RATE_LIMITED: "That is a lot of comments at once. Wait a minute and try again.",
      ASSET_NOT_SHARED:
        "The maker has not shared this set for use. Ask them first.",
      AI_OFF: "The assistant is off for this project.",
      AI_NOT_ALLOWED: "That change is turned off for the assistant.",
      AI_UNAVAILABLE: "The assistant could not answer just now. Try again in a moment; nothing was changed.",
      LAYER_LOCKED:
        "This layer is locked to hand-only edits, so AI cannot change it. Unlock it in the Layers panel to ask for a change.",
      STORAGE_SETUP_REQUIRED:
        "Saved work is unavailable until storage is connected.",
      STORAGE_ERROR: "We could not confirm this save. Refresh before retrying.",
      UNSUPPORTED_PROMPT:
        "The prototype could not interpret this change. Try ‘make it smaller’, ‘move left’, ‘opacity 50%’, ‘rotate 15’, ‘grayscale’, or use the layer controls. No artwork was changed.",
      INVALID_TARGET:
        "This layer is no longer available. Select a layer and try again.",
    }[code] ??
    "This action could not be completed.",
});
export const starters = {
  "evening-poster": {
    title: "Evening study",
    brief: "A quiet evening poster, with soft colour and slow movement.",
    art: {
      title: "After\nlight",
      caption: "SALT FLATS /\nEVENING STUDY",
      asset: "after-light",
      color: "#FFF7E3",
      size: 34,
      x: 6,
      y: 6,
    },
  },
  "material-study": {
    title: "Material study",
    brief: "An editorial study in paper, warm light and soft texture.",
    art: {
      title: "Soft\nforms",
      caption: "MATERIAL NOTES /\nA STUDY IN LIGHT",
      asset: "folded-paper",
      color: "#29251F",
      size: 30,
      x: 7,
      y: 8,
    },
  },
  "culture-cover": {
    title: "Culture cover",
    brief:
      "A graphic cover with rhythm, layered print and a little room to breathe.",
    art: {
      title: "New\nrhythm",
      caption: "CULTURE STUDY /\nMAKE IT YOUR OWN",
      asset: "quiet-type",
      color: "#392B53",
      size: 28,
      x: 7,
      y: 8,
    },
  },
} satisfies Record<string, { title: string; brief: string; art: Art }>;
export type StarterKey = keyof typeof starters;
/**
 * A plain ground that fits the brief: a canvas colour and a title ink that
 * reads on it. The first rule whose words appear in the brief wins.
 */
const grounds: { when: RegExp; canvasColor: string; color: string; accent: string }[] = [
  { when: /\b(night|dark|neon|midnight|club|noir|moody|after hours)\b/i, canvasColor: "#16181D", color: "#F4EFE6", accent: "#E0A458" },
  { when: /\b(warm|cream|bakery|bread|cake|pastry|caf[eé]|coffee|paper|hand[- ]drawn|craft|autumn|harvest|peach|cosy|cozy)\b/i, canvasColor: "#F3E6D0", color: "#3B2A1E", accent: "#C2603A" },
  { when: /\b(cool|blue|ocean|sea|winter|ice|calm|rain)\b/i, canvasColor: "#DCE6EE", color: "#1D2F45", accent: "#4F7FA8" },
  { when: /\b(green|garden|plant|nature|forest|spring|botanical|leaf)\b/i, canvasColor: "#E2EADB", color: "#21402B", accent: "#6F9A4E" },
  { when: /\b(pink|love|valentine|floral|blush|wedding)\b/i, canvasColor: "#F6E2E1", color: "#5A1F2B", accent: "#C9506A" },
  { when: /\b(bold|loud|red|sale|festival|party|jazz|gig|concert)\b/i, canvasColor: "#D9412B", color: "#FFF4E6", accent: "#FFC94A" },
];
const plainGround = { canvasColor: "#F2F0EB", color: "#1C1C1C", accent: "#D9412B" };
export function groundForBrief(brief: string): { canvasColor: string; color: string } {
  const { canvasColor, color } = grounds.find((g) => g.when.test(brief)) ?? plainGround;
  return { canvasColor, color };
}
/** A third colour for a brief's ground: a small accent that sits with the ground and the title ink. */
export const accentForBrief = (brief: string) => (grounds.find((g) => g.when.test(brief)) ?? plainGround).accent;
/** A title size that fits the poster: long names get smaller. */
export const titleSizeFor = (title: string) => Math.max(12, Math.min(30, Math.round(220 / Math.max(1, title.length))));
/**
 * A project started from a brief alone: the brief's own title, no caption and
 * a plain ground, never another maker's picture. The background photo key is
 * kept (the format needs one) but fully hidden, and it is not a catalogue work.
 */
export function briefStartArt(brief: string, title = titleFromBrief(brief)): Art {
  const name = title.slice(0, 70);
  const ground = groundForBrief(brief);
  const size = titleSizeFor(name);
  return {
    title: name,
    caption: "",
    captionVisible: false,
    asset: "plain-paper",
    backgroundOpacity: 0,
    ...ground,
    size,
    x: 7,
    y: 8,
    marks: briefStartMarks(brief, name, { size, y: 8, ink: ground.color, accent: accentForBrief(brief) }),
  };
}
/**
 * The first layout around a brief's title: a thin accent rule under the
 * title and, when the brief says what the piece is for, that phrase as a
 * supporting line at the foot of the poster (lineFromBrief). Nothing is
 * invented: a brief with nothing more to say gets the rule alone.
 */
export function briefStartMarks(
  brief: string,
  title: string,
  at: { size: number; y: number; ink: string; accent: string },
): Mark[] {
  // Where the title ends, in % of a 3:4 poster's height, allowing for the
  // widest wrap (the same estimate the assistant is given, server/creative/context.ts).
  const perLine = Math.max(1, Math.floor(93 / (at.size * 0.5)));
  const lines = title.split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / perLine)), 0);
  const titleBottom = at.y + lines * at.size * defaultTitleType.lineHeight * formatRatio.poster + 2;
  // Fields in the schema's order, so a copy that went through the schema compares equal.
  const marks: Mark[] = [
    {
      id: crypto.randomUUID(),
      name: "Accent rule",
      x: 7,
      y: Math.round(Math.min(70, titleBottom + 1)),
      width: 18,
      height: 2,
      rotation: 0,
      opacity: 1,
      visible: true,
      kind: "shape",
      shape: "line",
      fill: "none",
      stroke: at.accent,
      strokeWidth: 4,
      radius: 0,
    },
  ];
  const line = lineFromBrief(brief, title);
  if (line)
    marks.push({
      id: crypto.randomUUID(),
      name: "Supporting line",
      x: 7,
      y: 85,
      width: 86,
      height: 6,
      rotation: 0,
      opacity: 1,
      visible: true,
      kind: "text",
      text: line.slice(0, 80),
      color: at.ink,
      size: 4.5,
      font: "sans",
      italic: false,
      weight: 500,
      align: "left",
    });
  return marks;
}
/**
 * A new project. With a template it starts from that starter; without one it
 * starts from the brief (briefStartArt) and stays still until motion is asked for.
 */
export function newProject(
  id: string,
  brief: string,
  title?: string,
  template?: StarterKey,
): Project {
  const art: Art = template ? { ...starters[template].art } : briefStartArt(brief, title ?? titleFromBrief(brief));
  const motion: Motion = {
    seconds: template === "culture-cover" ? 4 : 6,
    movement: !template ? "still" : template === "culture-cover" ? "cut" : "drift",
    loop: true,
  };
  return {
    id,
    title: title ?? (template ? starters[template].title : titleFromBrief(brief)),
    brief,
    art,
    motion: { ...motion },
    references: [],
    proposals: [],
    versions: [
      {
        id: crypto.randomUUID(),
        number: 1,
        art: structuredClone(art),
        motion: { ...motion },
        note: "Started the project",
        at: new Date().toISOString(),
      },
    ],
    history: [],
    comments: [],
    decisions: [],
    mode: "explorer",
  };
}
export function versionNavigation(p: Project) {
  return {
    undo: [
      ...(p.versionNavigation?.undo ?? p.versions.slice(0, -1).map((v) => v.id)),
    ],
    redo: [...(p.versionNavigation?.redo ?? [])],
  };
}
/** The saved version shown on the canvas now: the latest, unless undo or redo moved back through history. */
export function currentVersion(p: Project) {
  const at = p.versionNavigation?.at;
  return (at ? p.versions.find((v) => v.id === at) : undefined) ?? p.versions.at(-1);
}
/**
 * A number that grows with every saved version and every undo or redo. A
 * proposal records it when it is made and is stale once it changes.
 */
export function historyStep(p: Project) {
  return p.versions.length + (p.versionNavigation?.moves ?? 0);
}
export function recordVersion(p: Project, note: string) {
  const previous = p.versions.at(-1);
  const current = currentVersion(p);
  const navigation = versionNavigation(p);
  const moves = p.versionNavigation?.moves;
  p.versionNavigation = {
    undo: current ? [...navigation.undo, current.id] : navigation.undo,
    redo: [],
    ...(moves ? { moves } : {}),
  };
  p.versions.push({
    id: crypto.randomUUID(),
    number: p.versions.length + 1,
    ...(current && current.id !== previous?.id ? { parent: current.id } : {}),
    art: structuredClone(p.art),
    motion: { ...p.motion },
    note,
    at: new Date().toISOString(),
  });
}
/** A burst of moves counts as one history step if it follows another hand edit within this long. */
export const GROUP_WINDOW_MS = 20_000;

/**
 * Records a hand edit, folding it into the previous version when that was also
 * a hand edit made moments ago. Undo then goes back past the whole burst. When
 * in doubt (a different kind of step, or too long ago) it records a new version.
 */
export function recordHandEdit(p: Project, note: string, group: boolean, now = Date.now()) {
  const last = p.versions.at(-1);
  // Only fold into the version on the canvas, and never across an undo or redo.
  const onLatest = currentVersion(p)?.id === last?.id && !versionNavigation(p).redo.length;
  if (group && last && onLatest && p.versions.length > 1 && last.note === note && now - Date.parse(last.at) < GROUP_WINDOW_MS) {
    last.art = structuredClone(p.art);
    last.motion = { ...p.motion };
    last.at = new Date(now).toISOString();
    return;
  }
  recordVersion(p, note);
}
/**
 * Moves the canvas one step back or forward through saved versions. It changes
 * which version is current; it never adds one, so the version count only grows
 * for real changes.
 */
export function stepVersion(p: Project, direction: "undo" | "redo") {
  const navigation = versionNavigation(p);
  const target = p.versions.find((v) => v.id === navigation[direction].at(-1));
  const current = currentVersion(p);
  if (!target || !current) return false;
  navigation[direction].pop();
  navigation[direction === "undo" ? "redo" : "undo"].push(current.id);
  p.art = structuredClone(target.art);
  p.motion = { ...target.motion };
  p.versionNavigation = {
    ...navigation,
    at: target.id,
    moves: (p.versionNavigation?.moves ?? 0) + 1,
  };
  return true;
}
export function publicProject(
  p: Project,
  description: string,
  creator: string,
  disclosure?: Partial<Disclosure>,
  culture?: CulturalContext,
) {
  return {
    ...publicStory(p, disclosure),
    title: p.title,
    description,
    art: p.art,
    motion: p.motion,
    creator,
    ...(cleanCulture(culture ?? {}) ? { culture: cleanCulture(culture ?? {}) } : {}),
    /** Only people who confirmed their credit and still have access. */
    team: (p.team ?? [])
      .filter((m) => m.credit === "confirmed" && m.state !== "revoked")
      .map((m) => ({ name: m.name, roles: m.roles })),
    credits: [...new Map([...p.references, ...(p.referenceArchive ?? [])].filter((r) => !r.mediaId).map((r) => [r.workId, r])).values()].map((r) => ({
      title: r.title,
      creator: r.creator,
      source: r.source,
    })),
  };
}

export function motionFrames(
  asset: AssetKey,
  frames: AssetKey[] = [],
): AssetKey[] {
  const chosen = [...new Set([asset, ...frames])].slice(0, 3);
  while (chosen.length < 3) chosen.push(asset);
  return chosen;
}
