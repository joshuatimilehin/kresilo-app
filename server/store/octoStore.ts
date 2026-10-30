/**
 * Octo-backed session bootstrap for the live creative workspace.
 *
 * It exposes only sessionLive and ensureGuest. The older proposal, decision and
 * version write methods were removed so that /api/creative is the only project
 * write path. Each call is exactly one parameterised SELECT of a kresilo_demo
 * function; there is no hand-built SQL and no trust in client-supplied
 * ownership: the session hash travels server-side only.
 *
 * ensure_guest() answers { ok: true, data: { alreadyExisted, snapshot } } where
 * snapshot is the get_project envelope. Failures are
 * { ok: false, code: "<StoreFailure>" } with no data.
 */
import type {
  ApprovalRecord,
  DecisionItem,
  HistoryEvent,
  PosterModel,
  PreviewSelection,
  ProjectSummary,
  ProposalItem,
  ReferenceItem,
  StudioSnapshot,
  VersionRecord,
} from "@/domain/types";
import { COST_LABEL_DB } from "@/domain/types";
import { PREVIEW_SECTIONS } from "@/domain/types";
import type {
  StoreFailure,
  StoreResult,
} from "@/domain/store";
import { buildGuestSeed, artworkForReference } from "@/domain/poster";
import { jsonFromReply, runQuery, type OctoFailureCode, type QueryFn } from "../utils/octoClient";

/* ------------------------------------------------------------- mapping --- */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX = /^#[0-9a-f]{6}$/i;

interface FnEnvelope<T = unknown> {
  ok?: unknown;
  code?: unknown;
  data?: T;
}

const KNOWN_CODES: StoreFailure[] = [
  "SESSION_INVALID",
  "FORBIDDEN",
  "NOT_FOUND",
  "PROPOSAL_CLOSED",
  "REASON_REQUIRED",
  "DUPLICATE_REFERENCE",
  "IDEMPOTENCY_CONFLICT",
  "LIMIT_REACHED",
  "INVALID_INPUT",
  "STORAGE_ERROR",
  "STORAGE_SETUP_REQUIRED",
];

function fail(code: StoreFailure, message?: string): StoreResult<never> {
  return { ok: false, code, message };
}

/** An unknown code from SQL is never forwarded as a "known" failure shape. */
function asFailureCode(value: unknown): StoreFailure {
  const text = typeof value === "string" ? value : "";
  return (KNOWN_CODES as string[]).includes(text) ? (text as StoreFailure) : "STORAGE_ERROR";
}

function transportCode(code: OctoFailureCode): StoreFailure {
  return code === "STORAGE_SETUP_REQUIRED" ? "STORAGE_SETUP_REQUIRED" : "STORAGE_ERROR";
}

function array<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function strings(value: unknown): string[] {
  return array<unknown>(value).map((v) => String(v ?? "")).filter(Boolean);
}

function hexList(value: unknown): string[] {
  return strings(value).filter((s) => HEX.test(s));
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

/** Only accept a poster that really is the typed model. */
function asPoster(value: unknown): PosterModel | null {
  const poster = object(value);
  const palette = object(poster.palette);
  const composition = object(poster.composition);
  const typography = object(poster.typography);
  if (
    typeof poster.width !== "number" ||
    typeof poster.height !== "number" ||
    !Object.keys(palette).length ||
    !Object.keys(composition).length ||
    typeof typography.title !== "string"
  ) {
    return null;
  }
  return poster as unknown as PosterModel;
}

function mapReference(row: unknown, index: number): ReferenceItem | null {
  const r = object(row);
  const id = String(r.id ?? "");
  if (!id) return null;
  const kind = r.kind === "external-metadata" || r.kind === "guest" ? r.kind : "bundled";
  return {
    id,
    kind,
    name: String(r.name ?? ""),
    source: String(r.source ?? ""),
    reason: String(r.reason ?? ""),
    tags: strings(r.tags),
    swatches: hexList(r.swatches),
    // The SQL snapshot has no artwork column: trusted artwork ids are
    // reconstructed from the bundled seed/pack key table, never invented.
    artwork: artworkForReference(id),
    urlNote: r.urlNote ? String(r.urlNote) : null,
    position: Number(r.position ?? index + 1),
    addedAt: r.addedAt ? String(r.addedAt) : undefined,
  };
}

function mapProposal(row: unknown, index: number): ProposalItem {
  const p = object(row);
  const status = p.status === "approved" || p.status === "declined" ? p.status : "proposed";
  return {
    id: String(p.id ?? `proposal-${index}`),
    intent: String(p.intent ?? ""),
    status,
    rationale: String(p.rationale ?? ""),
    patch: object(p.patch) as ProposalItem["patch"],
    paletteBefore: object(p.paletteBefore) as ProposalItem["paletteBefore"],
    paletteAfter: object(p.paletteAfter) as ProposalItem["paletteAfter"],
    cites: strings(p.cites),
    costLabel: String(p.costLabel ?? COST_LABEL_DB),
    createdAt: p.createdAt ? String(p.createdAt) : undefined,
    updatedAt: p.updatedAt ? String(p.updatedAt) : undefined,
    appliedVersion: typeof p.appliedVersion === "number" ? p.appliedVersion : null,
  };
}

function mapDecision(row: unknown, index: number): DecisionItem {
  const d = object(row);
  const kind = d.kind === "accepted-proposal" || d.kind === "manual" ? d.kind : "seed";
  return {
    id: String(d.id ?? `decision-${index}`),
    title: String(d.title ?? ""),
    reason: String(d.reason ?? ""),
    kind,
    proposalId: d.proposalId ? String(d.proposalId) : null,
    sourceReferenceIds: strings(d.sourceReferenceIds),
    versionNumber: typeof d.versionNumber === "number" ? d.versionNumber : null,
    createdAt: d.createdAt ? String(d.createdAt) : undefined,
  };
}

function mapEvent(row: unknown, index: number): HistoryEvent {
  const h = object(row);
  return {
    id: typeof h.id === "number" ? h.id : index,
    verb: String(h.verb ?? ""),
    actor: String(h.actor ?? "guest"),
    summary: String(h.summary ?? ""),
    detail: object(h.detail),
    createdAt: h.createdAt ? String(h.createdAt) : undefined,
  };
}

function mapSelection(value: unknown): Partial<PreviewSelection> {
  const raw = object(value);
  const sections = array<unknown>(raw.sections)
    .map((s) => String(s))
    .filter((s): s is PreviewSelection["sections"][number] =>
      (PREVIEW_SECTIONS as readonly string[]).includes(s),
    );
  const out: Partial<PreviewSelection> = { sections };
  if (typeof raw.includeReferenceReasons === "boolean") out.includeReferenceReasons = raw.includeReferenceReasons;
  if (typeof raw.includePalette === "boolean") out.includePalette = raw.includePalette;
  if (typeof raw.includePosterGeometry === "boolean") out.includePosterGeometry = raw.includePosterGeometry;
  return out;
}

/**
 * Turns the literal `get_project` payload into the UI snapshot. A snapshot
 * without a real project id and a real poster is a storage failure, not an
 * empty board: connected mode must never render a project it cannot prove.
 */
export function mapSnapshot(value: unknown): StoreResult<StudioSnapshot> {
  const raw = object(value);
  const id = String(raw.id ?? "");
  const poster = asPoster(raw.poster);
  if (!UUID.test(id) || !poster) return fail("STORAGE_ERROR");

  const project: ProjectSummary = {
    id,
    title: String(raw.title ?? "Untitled project"),
    visibility: "private",
    poster,
    posterVersion: Number(raw.posterVersion ?? 1),
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
  };

  const references = array<unknown>(raw.references)
    .map(mapReference)
    .filter((r): r is ReferenceItem => r !== null);

  const versions = array<unknown>(raw.versions)
    .map((row, index): VersionRecord | null => {
      const v = object(row);
      const vp = asPoster(v.poster);
      if (!vp) return null;
      return {
        id: String(v.id ?? `version-${index}`),
        number: Number(v.number ?? index + 1),
        poster: vp,
        note: v.note ? String(v.note) : null,
        origin: v.origin === "proposal-approval" || v.origin === "manual-save" ? v.origin : "seed",
        createdAt: v.createdAt ? String(v.createdAt) : undefined,
      } satisfies VersionRecord;
    })
    .filter((v): v is VersionRecord => v !== null);

  return {
    ok: true,
    data: {
      project,
      references,
      proposals: array<unknown>(raw.proposals).map(mapProposal),
      approvals: array<unknown>(raw.approvals).map((row, index) => {
        const a = object(row);
        return {
          id: String(a.id ?? `approval-${index}`),
          proposalId: String(a.proposalId ?? ""),
          decisionId: a.decisionId ? String(a.decisionId) : null,
          versionId: a.versionId ? String(a.versionId) : null,
          createdAt: a.createdAt ? String(a.createdAt) : undefined,
        } satisfies ApprovalRecord;
      }),
      decisions: array<unknown>(raw.decisions).map(mapDecision),
      versions,
      history: array<unknown>(raw.history).map(mapEvent),
      previewSelection: mapSelection(raw.previewSelection),
    },
  };
}

/** Reads a `{ ok, code }` / `{ ok, data }` function envelope. */
function readEnvelope(value: unknown): StoreResult<unknown> {
  const env: FnEnvelope = object(value) as FnEnvelope;
  if (env.ok !== true) return fail(asFailureCode(env.code));
  return { ok: true, data: env.data };
}

/**
 * Re-emits a failure for the caller's own result type, preserving its code.
 * Every branch below discriminates with the `in` operator instead of `.ok`,
 * because this project compiles without strictNullChecks, where a boolean
 * discriminant check does not filter a union.
 */
function propagate(result: StoreResult<unknown>): StoreResult<never> {
  if ("code" in result) return { ok: false, code: result.code, message: result.message };
  return fail("STORAGE_ERROR");
}

/* --------------------------------------------------------------- store --- */

interface CommandData {
  /** the command function's own fields: proposalId, decisionId, alreadyApplied… */
  fields: Record<string, unknown>;
  snapshot: StudioSnapshot;
}

export class OctoStore {
  readonly mode = "connected" as const;

  private readonly query: QueryFn;

  constructor(query: QueryFn = runQuery) {
    this.query = query;
  }

  /** Runs one command function and returns its raw jsonb envelope. */
  private async raw(sql: string, params: readonly unknown[]): Promise<StoreResult<unknown>> {
    const reply = await this.query(sql, params);
    if ("code" in reply) return fail(transportCode(reply.code));
    const parsed = jsonFromReply(reply);
    if ("code" in parsed) return fail("STORAGE_ERROR");
    return { ok: true, data: parsed.value };
  }

  /** Reads the nested `snapshot` envelope a mutator writes under `data`. */
  private async command(sql: string, params: readonly unknown[]): Promise<StoreResult<CommandData>> {
    const outer = await this.raw(sql, params);
    if ("code" in outer) return propagate(outer);
    const envelope = readEnvelope(outer.data);
    if ("code" in envelope) return propagate(envelope);
    const fields = object(envelope.data);
    const inner = readEnvelope(fields.snapshot);
    if ("code" in inner) return propagate(inner);
    const snapshot = mapSnapshot(inner.data);
    if ("code" in snapshot) return propagate(snapshot);
    return { ok: true, data: { fields, snapshot: snapshot.data } };
  }

  /**
   * Reads the session's own liveness without touching its data. An expired
   * hash must never be renewed: the caller rotates to a fresh guest instead.
   */
  async sessionLive(hash: string): Promise<StoreResult<boolean>> {
    const reply = await this.query("SELECT kresilo_demo._session_live($1::text) AS result", [hash]);
    if ("code" in reply) return fail(transportCode(reply.code));
    const parsed = jsonFromReply(reply);
    if ("code" in parsed) return fail("STORAGE_ERROR");
    return { ok: true, data: parsed.value === true };
  }

  async ensureGuest(hash: string, expiresAt: string): Promise<StoreResult<StudioSnapshot>> {
    const command = await this.command("SELECT kresilo_demo.ensure_guest($1::text, $2::timestamptz, $3::jsonb) AS result", [
      hash,
      expiresAt,
      JSON.stringify(buildGuestSeed()),
    ]);
    if ("code" in command) return propagate(command);
    return { ok: true, data: command.data.snapshot };
  }
}
