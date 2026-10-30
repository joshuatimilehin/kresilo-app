import { describe, expect, it } from "vitest";
import {
  blendModes,
  layerAdjustment,
  layerMaskShapes,
  layerShadows,
} from "../src/creative/contracts";
import { model as activityEvent } from "../src/models/activity-event";
import { model as aiSettings } from "../src/models/ai-settings";
import { model as asset } from "../src/models/asset";
import { model as authorshipEvent } from "../src/models/authorship-event";
import { model as comment } from "../src/models/comment";
import { model as credit } from "../src/models/credit";
import { model as culturalContext } from "../src/models/cultural-context";
import { model as layerEffects, effectBlendModes, effectMaskShapes, effectShadows } from "../src/models/layer-effects";
import { model as lineageEdge } from "../src/models/lineage-edge";
import { model as maker } from "../src/models/maker";
import { model as shareCard } from "../src/models/share-card";
import { model as story } from "../src/models/story";
import { model as styleGuide } from "../src/models/style-guide";
import { model as tasteProfile } from "../src/models/taste-profile";

// Fixtures are edited loosely on purpose; the schemas under test do the strict checking.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rec = Record<string, any>;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const ok = (m: { schema: { safeParse: (v: unknown) => { success: boolean } } }, v: unknown) =>
  m.schema.safeParse(v).success;

describe("AuthorshipEvent rules", () => {
  const ai = authorshipEvent.example as Rec;
  it("never lets AI work be recorded as hand work", () => {
    expect(ok(authorshipEvent, { ...clone(ai), origin: "hand", tool: "by hand", proposalId: undefined })).toBe(true);
    expect(ok(authorshipEvent, { ...clone(ai), origin: "hand", tool: "by hand" })).toBe(false); // proposal behind it
    expect(ok(authorshipEvent, { ...clone(ai), origin: "hand", tool: "Copilot", proposalId: undefined })).toBe(false);
    expect(ok(authorshipEvent, { ...clone(ai), origin: "ai-generated", tool: "by hand" })).toBe(false);
  });
  it("records an unknown outside tool as AI, not hand", () => {
    expect(ok(authorshipEvent, { ...clone(ai), origin: "ai-assisted", tool: "unknown AI tool" })).toBe(true);
  });
  it("lets a correction point at an earlier event but not at itself", () => {
    expect(ok(authorshipEvent, { ...clone(ai), corrects: "00000000-0000-4000-8000-0000000000ff" })).toBe(true);
    expect(ok(authorshipEvent, { ...clone(ai), corrects: ai.id })).toBe(false);
  });
});

describe("credit, lineage, asset and sharing rules", () => {
  it("keeps tools out of 'made by' and roles out of 'made with'", () => {
    const c = credit.example as Rec;
    expect(ok(credit, { ...clone(c), kind: "made-with", roles: [], tool: "Copilot" })).toBe(true);
    expect(ok(credit, { ...clone(c), roles: [] })).toBe(false);
    expect(ok(credit, { ...clone(c), roles: ["lead", "lead"] })).toBe(false);
  });
  it("links sample works only to sample works", () => {
    const e = lineageEdge.example as Rec;
    expect(ok(lineageEdge, { ...clone(e), toSample: false })).toBe(false);
  });
  it("fails closed on media whose right is unknown", () => {
    const a = asset.example as Rec;
    const unknown = { ...clone(a), source: { kind: "import", right: "unknown" } };
    expect(ok(asset, { ...unknown, publishable: true })).toBe(false);
    expect(ok(asset, { ...unknown, publishable: false })).toBe(true);
  });
  it("always carries the authorship strip in a share card", () => {
    const s = shareCard.example as Rec;
    expect(ok(shareCard, { ...clone(s), includes: ["title", "art"] })).toBe(false);
  });
});

describe("culture, makers and stories", () => {
  it("never accepts AI-authored cultural context", () => {
    const c = culturalContext.example as Rec;
    expect(ok(culturalContext, { ...clone(c), aiDrafted: true })).toBe(false);
    expect(ok(culturalContext, { ...clone(c), authoredBy: "copilot" })).toBe(false);
  });
  it("holds back an unchecked machine translation from the public", () => {
    const c = clone(culturalContext.example) as Rec;
    c.entries[0].text = {
      schemaVersion: "0.1.0",
      language: "pt",
      direction: "ltr",
      text: "Impresso com tinta de soja.",
      source: "machine-translation",
      translatedFrom: "en",
    };
    expect(ok(culturalContext, { ...c, visibility: "private" })).toBe(true);
    expect(ok(culturalContext, { ...c, visibility: "community" })).toBe(false);
  });
  it("keeps sample makers unclaimable and checked", () => {
    const m = maker.example as Rec;
    expect(ok(maker, { ...clone(m), personId: "00000000-0000-4000-8000-0000000000aa" })).toBe(false);
    expect(ok(maker, { ...clone(m), respectCheck: undefined })).toBe(false);
    expect(
      ok(maker, {
        ...clone(m),
        respectCheck: { nameChecked: false, likenessChecked: true, decision: "approved" },
      }),
    ).toBe(false);
  });
  it("requires the authorship slide before a story is public", () => {
    const s = story.example as Rec;
    expect(ok(story, { ...clone(s), visibility: "community" })).toBe(false);
    const withStrip = clone(s);
    withStrip.visibility = "community";
    withStrip.slides.push({
      id: "00000000-0000-4000-8000-0000000000bb",
      order: 1,
      kind: "authorship",
      record: { kind: "authorship-event", id: "00000000-0000-4000-8000-0000000000cc" },
    });
    expect(ok(story, withStrip)).toBe(true);
  });
});

describe("AI control, taste and activity rules", () => {
  it("ties auto-apply to a level that allows it, and AI off to every step", () => {
    const s = aiSettings.example as Rec;
    expect(ok(aiSettings, { ...clone(s), apply: "auto", level: "assist" })).toBe(true);
    expect(ok(aiSettings, { ...clone(s), apply: "auto", level: "suggest" })).toBe(false);
    expect(ok(aiSettings, { ...clone(s), level: "off", perStep: { motion: "assist" } })).toBe(false);
  });
  it("keeps a taste profile private", () => {
    const t = tasteProfile.example as Rec;
    expect(ok(tasteProfile, { ...clone(t), visibility: "community" })).toBe(false);
  });
  it("points AI-origin activity at its authorship event", () => {
    const a = activityEvent.example as Rec;
    expect(ok(activityEvent, { ...clone(a), authorshipEventId: undefined })).toBe(false);
    expect(ok(activityEvent, { ...clone(a), origin: "hand", authorshipEventId: undefined })).toBe(true);
  });
});

describe("StyleGuide safety", () => {
  it("accepts only hex colours and safe font names, so no CSS can ride in", () => {
    const g = styleGuide.example as Rec;
    const withColor = clone(g);
    withColor.tokens.colors.ground = "red; background:url(//evil)";
    expect(ok(styleGuide, withColor)).toBe(false);
    const withFont = clone(g);
    withFont.tokens.fonts[0].family = "Fraunces; } body { display:none";
    expect(ok(styleGuide, withFont)).toBe(false);
  });
});

describe("Comment stays compatible with the live shape", () => {
  it("parses a comment saved today (id, text, author, at, resolved)", () => {
    const live = {
      id: "00000000-0000-4000-8000-000000000001",
      text: "Looks good",
      author: "Ayo",
      at: "2026-10-22T09:00:00.000Z",
      resolved: false,
    };
    const r = comment.schema.safeParse({ schemaVersion: "0.1.0", ...live });
    expect(r.success).toBe(true);
    if (r.success) expect((r.data as { space: string }).space).toBe("board");
  });
});

describe("LayerEffects (live) matches src/creative/contracts.ts", () => {
  it("uses the same closed lists", () => {
    expect([...effectBlendModes]).toEqual([...blendModes]);
    expect([...effectShadows]).toEqual([...layerShadows]);
    expect([...effectMaskShapes]).toEqual([...layerMaskShapes]);
  });
  const { schemaVersion: _v, layerId: _l, ...effects } = layerEffects.example as Rec;
  const { schemaVersion: _iv, layerId: _il, ...badEffects } = layerEffects.invalidExample as Rec;
  it("agrees with the app contract on a valid and an invalid effect set", () => {
    expect(layerAdjustment.safeParse(effects).success).toBe(true);
    expect(ok(layerEffects, layerEffects.example)).toBe(true);
    expect(layerAdjustment.safeParse(badEffects).success).toBe(false);
    expect(ok(layerEffects, layerEffects.invalidExample)).toBe(false);
  });
});
