import { describe, expect, it } from "vitest";
import { buildProposalDraft } from "../src/domain/proposal";
import { SALT_FLATS_PACK, SEED_POSTER, SEED_REFERENCES } from "../src/domain/poster";
import type { ReferenceItem, StudioSnapshot } from "../src/domain/types";

function snapshotWith(references: ReferenceItem[]): StudioSnapshot {
  return {
    project: { id: "11111111-1111-4111-8111-111111111111", title: "Salt Flats Identity", visibility: "private", poster: SEED_POSTER, posterVersion: 1 },
    references,
    proposals: [],
    approvals: [],
    decisions: [],
    versions: [],
    history: [],
  };
}

/** A pack plate as it would be stored once a guest adds it with their own reason. */
function packReference(key: string, reason: string): ReferenceItem {
  const item = SALT_FLATS_PACK.find((p) => p.key === key)!;
  return {
    id: item.key,
    kind: "bundled",
    name: item.name,
    source: item.source,
    reason,
    tags: item.tags,
    swatches: item.swatches,
    artwork: item.artwork,
  };
}

function expectHonestCitations(snap: StudioSnapshot, intent: string) {
  const draft = buildProposalDraft(snap, intent);
  expect(draft).not.toBeNull();
  expect(draft!.cites.length).toBeGreaterThanOrEqual(1);
  for (const id of draft!.cites) {
    const ref = snap.references.find((r) => r.id === id);
    expect(ref, `cite ${id} must exist in project`).toBeTruthy();
    expect(draft!.rationale).toContain(ref!.reason);
  }
  return draft!;
}

describe("proposal citations", () => {
  it("every matched proposal cites an existing reference with its real saved reason", () => {
    const snap = snapshotWith([...SEED_REFERENCES]);
    const draft = expectHonestCitations(snap, "Make the poster quieter while keeping one warm note");
    expect(draft.cites.length).toBeGreaterThanOrEqual(1);
  });

  it("changing supplied reference context changes the cited rationale", () => {
    const custom: ReferenceItem = {
      id: "ref-custom-indigo", kind: "guest", name: "Indigo working note", source: "guest note",
      reason: "deep indigo stillness for late focus", tags: ["indigo", "focus"], swatches: ["#334155"], artwork: null,
    };
    const snap = snapshotWith([custom]);
    const draft = expectHonestCitations(snap, "make it feel indigo and focused for late work");
    expect(draft.cites).toContain("ref-custom-indigo");
    expect(draft.rationale).toContain("deep indigo stillness for late focus");
  });

  it("an unmatched request still has honest actual citations", () => {
    const snap = snapshotWith([...SEED_REFERENCES]);
    expectHonestCitations(snap, "zebra balloon parade in neon polka dots");
  });

  it("a newly added pack reference can participate", () => {
    const pack = packReference("pack-grid", "grid rhythm keeps the foot of the poster open");
    const snap = snapshotWith([pack]);
    const draft = expectHonestCitations(snap, "use the grid rhythm to keep it open");
    expect(draft.cites).toContain("pack-grid");
  });

  it("a newly added pack reference named in the request is cited even beside seed references", () => {
    const pack = packReference("pack-margin", "margin notes keep the type honest for live QA");
    const snap = snapshotWith([...SEED_REFERENCES, pack]);
    const draft = expectHonestCitations(snap, "Keep the margin note — margin notes keep the type honest");
    expect(draft.cites).toContain("pack-margin");
    expect(draft.rationale).toContain("margin notes keep the type honest for live QA");
  });

  it("no saved references => no proposal (cannot cite a source that is not present)", () => {
    expect(buildProposalDraft(snapshotWith([]), "make it quieter")).toBeNull();
  });
});
