/**
 * Shared fixtures for the contract suite. Everything here mirrors the literal
 * shapes produced by db/migrations/001_kresilo_demo.sql, so the tests fail if
 * the adapter starts guessing a flattened shape again.
 */
import type { OctoReply } from "../server/utils/octoClient";
import { SEED_POSTER, SEED_REFERENCES } from "../src/domain/poster";
import type { StudioSnapshot } from "../src/domain/types";

export const PROJECT_ID = "3f2a1b6c-9d4e-4f70-8a11-6cb0f0e2d111";

/** One row, one jsonb `result` column — the shape Octo answers with. */
export function okReply(value: unknown): OctoReply {
  return {
    ok: true,
    result: {
      columns: ["result"],
      rows: [{ result: value }],
      rowCount: 1,
      truncated: false,
    },
  };
}

/**
 * The failure envelope a command function answers with: `ok:false` plus a code,
 * and never a data payload. Wrapped in `okReply(...)` it is a transport-level
 * success carrying a storage-level refusal.
 */
export function failingEnvelope(code: string): { ok: false; code: string } {
  return { ok: false, code };
}

/** The exact `get_project()` payload: { ok: true, data: <DbSnapshot> }. */
export function projectEnvelope(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    data: {
      id: PROJECT_ID,
      title: "Salt Flats Identity",
      visibility: "private",
      poster: SEED_POSTER,
      posterVersion: 1,
      updatedAt: "2026-10-18T00:00:00.000Z",
      references: SEED_REFERENCES.map((r) => ({
        id: r.id,
        dbId: "0a1b2c3d-0000-4000-8000-00000000000" + r.position,
        kind: r.kind,
        name: r.name,
        source: r.source,
        reason: r.reason,
        tags: r.tags,
        swatches: r.swatches,
        urlNote: null,
        position: r.position,
        addedAt: "2026-10-18T00:00:00.000Z",
      })),
      proposals: [],
      approvals: [],
      decisions: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          title: "Keep a single human figure for scale",
          reason: "A tiny silhouette holds the horizon at real size.",
          kind: "seed",
          proposalId: null,
          sourceReferenceIds: ["ref-horizon", "ref-note"],
          versionNumber: 1,
          createdAt: "2026-10-18T00:00:00.000Z",
        },
      ],
      versions: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          number: 1,
          poster: SEED_POSTER,
          note: "Seeded Salt Flats poster v4",
          origin: "seed",
          createdAt: "2026-10-18T00:00:00.000Z",
        },
      ],
      history: [
        {
          id: 7,
          verb: "project.seed",
          actor: "guest",
          summary: "Seeded private Salt Flats project for a new guest",
          detail: { posterVersion: 1 },
          createdAt: "2026-10-18T00:00:00.000Z",
        },
      ],
      previewSelection: {},
      ...overrides,
    },
  };
}

/** The exact mutator payload: { ok:true, data:{ ...ids, snapshot: <get_project envelope> } }. */
export function mutationEnvelope(extra: Record<string, unknown> = {}, overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    data: { ...extra, snapshot: projectEnvelope(overrides) },
  };
}

/** A StudioSnapshot for the guidance/service tests, straight from the seed data. */
export function studioSnapshot(referenceOverrides: Array<Partial<{ id: string; name: string; reason: string; tags: string[] }>> = []): StudioSnapshot {
  const references = SEED_REFERENCES.map((r, i) => {
    const override = referenceOverrides[i] ?? {};
    return {
      ...r,
      ...override,
      tags: override.tags ?? r.tags,
      position: r.position ?? i + 1,
    };
  });
  return {
    project: {
      id: PROJECT_ID,
      title: "Salt Flats Identity",
      visibility: "private",
      poster: SEED_POSTER,
      posterVersion: 1,
    },
    references,
    proposals: [],
    approvals: [],
    decisions: [],
    versions: [],
    history: [],
  };
}
