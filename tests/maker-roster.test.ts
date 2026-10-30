import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  AREAS,
  DISCIPLINES,
  REQUIRED_DISCIPLINES,
  isSampleMaker,
  makerById,
  makerDisclaimer,
  makerInitials,
  makers,
  makersByDiscipline,
  makersByRegion,
} from "../src/creative/makers";
import { creatorFor, creators, works } from "../src/creative/catalog";

/**
 * The sample roster is a PROPOSAL (docs/maker-roster.md). These tests keep every
 * maker labelled, unique, global and free of real names. The deny lists are
 * deliberately small: they catch obvious slips, they do not replace the owner's
 * name check.
 */

const SHIPPED_IDS = [
  "ayo-bello",
  "nia-mensah",
  "marina-costa",
  "ren-sato",
  "leila-haddad",
  "ines-duarte",
];

// Real brands and well-known living or historic artists and designers.
const DENIED_NAMES = [
  "nike",
  "adidas",
  "apple",
  "google",
  "adobe",
  "figma",
  "canva",
  "pantone",
  "kodak",
  "fujifilm",
  "leica",
  "hasselblad",
  "nikon",
  "canon",
  "sony",
  "ikea",
  "muji",
  "chanel",
  "gucci",
  "vogue",
  "instagram",
  "behance",
  "helvetica",
  "futura",
  "bauhaus",
  "sagmeister",
  "paula scher",
  "jony ive",
  "kusama",
  "murakami",
  "hokusai",
  "picasso",
  "warhol",
  "banksy",
  "basquiat",
  "kahlo",
  "leibovitz",
  "mccurry",
  "tillmans",
  "abloh",
  "peter saville",
  "david carson",
  "olafur eliasson",
  "ansel adams",
];

// Words that would signal a sacred or ceremonial motif.
const SACRED =
  /\b(sacred|holy|ceremon\w*|ritual\w*|shrine|temple|mandala|totem|prayer|altar|spiritual|relic)\b/i;

const mentions = (text: string) => {
  const lower = text.toLowerCase();
  return DENIED_NAMES.filter((n) =>
    new RegExp(`(^|[^a-z])${n}([^a-z]|$)`).test(lower),
  );
};

describe("sample maker roster", () => {
  it("holds the eighteen first makers, twelve more by region and four more practices, with no repeated id or place", () => {
    expect(makers).toHaveLength(34);
    expect(new Set(makers.map((m) => m.id)).size).toBe(makers.length);
    expect(new Set(makers.map((m) => m.place)).size).toBe(makers.length);
    expect(makers.slice(0, 6).map((m) => m.id)).toEqual(SHIPPED_IDS);
  });

  it("marks every maker as a sample", () => {
    for (const m of makers) {
      expect(m.sample, m.id).toBe(true);
      expect(isSampleMaker(m), m.id).toBe(true);
      expect(isSampleMaker(m.id), m.id).toBe(true);
    }
    expect(isSampleMaker("not-a-maker")).toBe(false);
  });

  it("has unique ids and unique names", () => {
    const ids = makers.map((m) => m.id);
    const names = makers.map((m) => m.name.toLowerCase());
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
    for (const id of ids) expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });

  it("covers every world area, with a place and languages for each maker", () => {
    for (const area of AREAS)
      expect(makersByRegion(area).length, area).toBeGreaterThan(0);
    for (const region of [
      "East Asia",
      "South Asia",
      "Southeast Asia",
      "Central Asia",
      "West Africa",
      "East Africa",
      "North Africa",
      "Northern Europe",
      "Eastern Europe",
      "Southern Europe",
      "North America",
      "Latin America",
      "Caribbean",
      "Oceania",
    ] as const)
      expect(makersByRegion(region).length, region).toBeGreaterThan(0);
    for (const m of makers) {
      expect(m.place, m.id).toMatch(/\S, \S/);
      expect(m.languages.length, m.id).toBeGreaterThan(0);
      expect(m.voice.length, m.id).toBeGreaterThan(3);
    }
  });

  it("covers the required disciplines and spreads career stages", () => {
    for (const d of REQUIRED_DISCIPLINES)
      expect(makersByDiscipline(d).length, d).toBeGreaterThan(0);
    for (const m of makers) expect(DISCIPLINES).toContain(m.discipline);
    expect(new Set(makers.map((m) => m.stage)).size).toBe(3);
  });

  it("includes one two-person collective and one studio team", () => {
    const collectives = makers.filter((m) => m.kind === "collective");
    expect(collectives).toHaveLength(1);
    expect(collectives[0].members).toHaveLength(2);
    const studios = makers.filter((m) => m.kind === "organization");
    expect(studios.map((m) => m.id)).toEqual(["half-landing"]);
    expect(studios[0].members?.length).toBeGreaterThanOrEqual(5);
    expect(studios[0].members?.length).toBeLessThanOrEqual(8);
    for (const name of studios[0].members ?? []) expect(name, name).toMatch(/^\S+ \S+$/);
    expect(makers.filter((m) => m.kind === "individual" && m.members)).toEqual(
      [],
    );
  });

  it("keeps every bio short and free of sample wording", () => {
    for (const m of makers) {
      expect(m.bio, m.id).not.toMatch(/sample|demo/i);
      const sentences = m.bio.split(/(?<=[.!?])\s+/);
      expect(sentences.length, m.id).toBeGreaterThanOrEqual(1);
      expect(sentences.length, m.id).toBeLessThanOrEqual(3);
    }
    expect(makerDisclaimer(makers[0])).toMatch(/fictional/i);
  });

  it("names no real brand or real artist, and no sacred or ceremonial motif", () => {
    for (const m of makers) {
      const text = [
        m.name,
        m.bio,
        m.influences,
        m.voice,
        ...(m.members ?? []),
      ].join(" ");
      expect(mentions(text), m.id).toEqual([]);
      expect(text, m.id).not.toMatch(SACRED);
    }
  });

  it("looks up makers by id and discipline", () => {
    expect(makerById("mira-kesavan")?.discipline).toBe("colour grading");
    expect(makersByDiscipline("retouching").map((m) => m.id)).toEqual([
      "hana-zerrouki",
    ]);
  });

  it("builds an initials mark for makers without a portrait", () => {
    expect(makerInitials("Mira Kesavan")).toBe("MK");
    expect(makerInitials("Rook & Delaney")).toBe("RD");
    for (const m of makers)
      expect(makerInitials(m.name).length).toBeGreaterThan(0);
  });
});

describe("makers in the catalog", () => {
  it("lists every roster maker as a creator, labelled as a sample", () => {
    expect(creators.map((c) => c.id)).toEqual(makers.map((m) => m.id));
    for (const c of creators) expect(c.sample, c.id).toBe(true);
  });

  it("keeps the shipped makers' portraits and works working", () => {
    for (const id of SHIPPED_IDS) {
      expect(creatorFor(id)?.portrait, id).toMatch(/^\/assets\/kresilo\//);
      expect(
        works.some((w) => w.creatorId === id),
        id,
      ).toBe(true);
    }
  });

  it("only points at existing public artwork", () => {
    for (const m of makers)
      if (m.portrait) expect(existsSync(`public${m.portrait}`), m.id).toBe(true);
  });

  it("lets new makers exist without works, and shows a portrait only once its file exists", () => {
    const bare = creators.filter((c) => !SHIPPED_IDS.includes(c.id));
    expect(bare).toHaveLength(28);
    for (const c of bare) {
      if (c.portrait) expect(existsSync(`public${c.portrait.split("?")[0]}`), c.id).toBe(true);
      expect(works.filter((w) => w.creatorId === c.id)).toEqual([]);
    }
  });

  it("keeps every work tied to a roster maker with a matching name", () => {
    for (const w of works) {
      expect(makerById(w.creatorId), w.id).toBeDefined();
      expect(makerById(w.creatorId)?.name, w.id).toBe(w.creator);
    }
  });
});

describe("no sample or demo wording on working screens (the owner's call)", () => {
  const ui = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? ui(`${dir}/${e.name}`) : /\.tsx$/.test(e.name) ? [`${dir}/${e.name}`] : [],
    );

  it("shows no Sample badge and no sample or demo label in any component", () => {
    for (const f of ui("src/creative")) {
      const src = readFileSync(f, "utf8");
      expect(src, f).not.toContain("<SampleBadge");
      // Visible text and labels only: JSX text, alt, title, aria-label and plain strings.
      for (const m of src.matchAll(/(>[^<>{}]*<|"[^"\n]*"|`[^`\n]*`)/g))
        expect(m[0], `${f}: ${m[0]}`).not.toMatch(/\b(sample practice|sample collection|sample image|demo credits)\b/i);
    }
  });

  it("says once, in the site footer, that the makers are fictional", () => {
    expect(readFileSync("src/App.tsx", "utf8")).toContain("Makers and clients shown are fictional.");
    expect(makerDisclaimer(makers[0])).toMatch(/fictional/i);
  });

  it("falls back to initials when a maker has no portrait", () => {
    const src = readFileSync("src/creative/primitives.tsx", "utf8");
    const avatar = src.slice(src.indexOf("export function Avatar"), src.indexOf("export function Credit"));
    expect(avatar).toContain("makerInitials");
  });
});
