/**
 * Kresilo prototype — shared domain contracts.
 * Imported by BOTH the browser bundle (src/) and the Nitro server (server/).
 * Contains no secrets, no SQL, no env access, no network code.
 */

export const PROTOTYPE_LABEL = "Interactive prototype";

/** ASCII form stored in the database (matches the DB CHECK constraint). */
export const COST_LABEL_DB = "0 credits - no external service called";
/** Editorial form shown in the UI. */
export const COST_LABEL_UI = "0 credits — no external service called";

export type StorageMode = "connected" | "preview";

export type ErrorCode =
  | "STORAGE_SETUP_REQUIRED"
  | "SESSION_INVALID"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "REASON_REQUIRED"
  | "PROPOSAL_CLOSED"
  | "DUPLICATE_REFERENCE"
  | "IDEMPOTENCY_CONFLICT"
  | "LIMIT_REACHED"
  | "RATE_LIMITED"
  | "STORAGE_ERROR"
  | "UNKNOWN_VERB"
  | "NETWORK";

/* --------------------------------------------------------------- poster --- */

export interface PosterPalette {
  /** poster ground */
  canvas: string;
  surface: string;
  /** horizon gradient, inner */
  horizonFrom: string;
  /** horizon gradient, outer */
  horizonTo: string;
  /** the one warm note */
  accent: string;
  /** headline colour */
  type: string;
  hairline: string;
}

export interface PosterComposition {
  /** the horizon disc: a crisp circle, lilac edge -> cream centre -> lilac edge */
  horizon: { cx: number; cy: number; r: number; figure: boolean };
  /** fine outer ring, top right */
  ring: { show: boolean; cx: number; cy: number; r: number };
  /** filled inner sun sitting inside (or instead of) the ring */
  sun: { show: boolean; cx: number; cy: number; r: number; tone: SunTone };
  rule: { show: boolean; y: number };
  caption: string;
}

export type SunTone = "ivory" | "accent";

export interface PosterTypography {
  eyebrow: string;
  title: string;
  titleSize: number;
  titleY: number;
  family: "serif-italic";
}

export interface PosterModel {
  width: number;
  height: number;
  label: string;
  palette: PosterPalette;
  composition: PosterComposition;
  typography: PosterTypography;
}

export type PartialDeep<T> = {
  [K in keyof T]?: T[K] extends object ? PartialDeep<T[K]> : T[K];
};

export interface PosterPatch {
  palette?: Partial<PosterPalette>;
  composition?: PartialDeep<PosterComposition>;
  typography?: Partial<PosterTypography>;
}

/* ------------------------------------------------------------- artefacts -- */

export type ReferenceKind = "bundled" | "external-metadata" | "guest";

export interface ReferenceItem {
  /** stable key, e.g. ref-horizon */
  id: string;
  kind: ReferenceKind;
  name: string;
  source: string;
  reason: string;
  tags: string[];
  swatches: string[];
  /** code-native artwork id for bundled tiles; never an external image */
  artwork?: HorizonArtwork | null;
  /** metadata only — the prototype never fetches this */
  urlNote?: string | null;
  position?: number;
  addedAt?: string;
}

export type HorizonArtwork =
  | "horizon"
  | "patchwork"
  | "cracked-ground"
  | "contours"
  | "note";

export type ProposalStatus = "proposed" | "approved" | "declined";

export interface ProposalItem {
  id: string;
  intent: string;
  status: ProposalStatus;
  rationale: string;
  patch: PosterPatch;
  paletteBefore: Partial<PosterPalette>;
  paletteAfter: Partial<PosterPalette>;
  cites: string[];
  costLabel: string;
  createdAt?: string;
  updatedAt?: string;
  appliedVersion?: number | null;
}

/** Which path produced a proposal: local rules or an external model call. */
export type ProposalSource = "prototype-guidance" | "model";

/** Output of proposal guidance, before it is handed to a store. */
export interface ProposalDraft {
  intent: string;
  rationale: string;
  patch: PosterPatch;
  paletteBefore: Partial<PosterPalette>;
  paletteAfter: Partial<PosterPalette>;
  cites: string[];
  source: ProposalSource;
  /** Model id, only when `source` is "model". */
  model?: string;
  costLabel: string;
}

/** What the Copilot can honestly claim in this runtime. */
export interface CopilotInfo {
  mode: "model" | "deterministic";
  model: string | null;
}

export interface ApprovalRecord {
  id: string;
  proposalId: string;
  decisionId?: string | null;
  versionId?: string | null;
  createdAt?: string;
}

export interface DecisionItem {
  id: string;
  title: string;
  reason: string;
  kind: "accepted-proposal" | "manual" | "seed";
  proposalId?: string | null;
  sourceReferenceIds: string[];
  versionNumber?: number | null;
  createdAt?: string;
}

export interface VersionRecord {
  id: string;
  number: number;
  poster: PosterModel;
  note?: string | null;
  origin: "seed" | "proposal-approval" | "manual-save";
  createdAt?: string;
}

export interface HistoryEvent {
  id: string | number;
  verb: string;
  actor: string;
  summary: string;
  detail: Record<string, unknown>;
  createdAt?: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  visibility: "private";
  poster: PosterModel;
  posterVersion: number;
  updatedAt?: string;
}

export interface StudioSnapshot {
  project: ProjectSummary;
  references: ReferenceItem[];
  proposals: ProposalItem[];
  approvals: ApprovalRecord[];
  decisions: DecisionItem[];
  versions: VersionRecord[];
  history: HistoryEvent[];
  /** private publish-preview picks, if the project has any */
  previewSelection?: Partial<PreviewSelection>;
}

/* ------------------------------------------------------------- commands --- */

export const VERBS = [
  "project.get",
  "reference.add",
  "proposal.create",
  "proposal.edit",
  "proposal.approve",
  "proposal.decline",
  "decision.add",
  "history.list",
  "version.save",
  "publish.preview",
] as const;

export type Verb = (typeof VERBS)[number];

export interface Actor {
  kind: "guest" | "preview-guest";
  projectId: string;
  /** Opaque session token. Server-only: never rendered, never logged. */
  sessionHash: string;
}

export interface CommandOk<T = Record<string, unknown>> {
  ok: true;
  verb: Verb;
  data: T;
}

export interface CommandErr {
  ok: false;
  verb: Verb;
  code: ErrorCode;
  message: string;
  issues?: string[];
}

export type CommandResult<T = Record<string, unknown>> = CommandOk<T> | CommandErr;

/** UI-safe narrowing: never reads fields that only exist on one branch. */
export function describeFailure(
  result: CommandResult,
): { code: ErrorCode; message: string; issues: string[] } | null {
  if (!("code" in result)) return null;
  return { code: result.code, message: result.message, issues: result.issues ?? [] };
}

/* ------------------------------------------------- publish preview picks -- */

export const PREVIEW_SECTIONS = [
  "intent",
  "references",
  "decisions",
  "history",
  "assets",
] as const;

export type PreviewSection = (typeof PREVIEW_SECTIONS)[number];

export interface PreviewSelection {
  sections: PreviewSection[];
  includeReferenceReasons: boolean;
  includePalette: boolean;
  includePosterGeometry: boolean;
}

export const DEFAULT_PREVIEW_SELECTION: PreviewSelection = {
  sections: ["intent", "references", "decisions"],
  includeReferenceReasons: true,
  includePalette: true,
  includePosterGeometry: false,
};
