import { describe, expect, it } from "vitest";
import { designStyles, styleArtPatch, styleById, styleTitleFont } from "../src/creative/openDesign/styles";
import { buildDeck, deckFileName, deckLooks, artworkHtml, DECK_REMOTE } from "../src/creative/openDesign/decks";
import { artPatch, defaultTitleType, newProject } from "../src/creative/contracts";
import { buildDesignContext } from "../server/creative/context";

/** Names of companies, products and franchises Open Design ships styles for; none may reach Kresilo. */
const BRANDS =
  /\b(?:airbnb|airtable|apple|binance|bmw|bugatti|canva|cisco|claude|clickhouse|cloudflare|cohere|coinbase|composio|cursor|discord|duolingo|elevenlabs|expo|ferrari|figma|framer|github|hashicorp|huggingface|ibm|intercom|kraken|lamborghini|linear|lovable|mastercard|meta|minimax|mintlify|miro|mistral|mongodb|nike|notion|nvidia|ollama|openai|perplexity|pinterest|playstation|posthog|raycast|renault|replicate|resend|revolut|runway|sanity|sentry|shopify|slack|spacex|spotify|starbucks|stripe|supabase|superhuman|tesla|tetris|pacman|uber|vercel|vodafone|warp|webex|webflow|wechat|wired|wise|xiaohongshu|zapier|monocle|apartamento)\b/i;
/** Brand names that are never ordinary words, for checking prose. */
const BRANDS_IN_PROSE =
  /\b(?:airbnb|binance|bmw|bugatti|canva|coinbase|discord|duolingo|figma|github|huggingface|lamborghini|mastercard|mongodb|nvidia|openai|pinterest|playstation|shopify|spacex|spotify|starbucks|stripe|supabase|tesla|vercel|vodafone|webflow|wechat|xiaohongshu|zapier|monocle|apartamento)\b/i;

describe("Open Design styles", () => {
  it("are generic, complete and credited", () => {
    expect(designStyles.length).toBeGreaterThanOrEqual(40);
    expect(new Set(designStyles.map((s) => s.id)).size).toBe(designStyles.length);
    for (const s of designStyles) {
      expect(`${s.id} ${s.name}`, s.id).not.toMatch(BRANDS);
      expect(`${s.summary} ${s.rules}`, s.id).not.toMatch(BRANDS_IN_PROSE);
      for (const c of Object.values(s.palette)) expect(c, s.id).toMatch(/^#[0-9a-f]{6}$/i);
      expect(s.fonts.display.length, s.id).toBeGreaterThan(1);
      expect(s.credit, s.id).toMatch(/Open Design \(Apache-2\.0\)/);
      expect(s.rules.length, s.id).toBeLessThanOrEqual(900);
    }
  });

  it("maps serif display type to the poster face and the rest to sans", () => {
    expect(styleTitleFont(styleById("kami")!)).toBe("poster");
    expect(styleTitleFont(styleById("neon")!)).toBe("sans");
  });

  it("applies its colours and title face in the same save, keeping how the title is set", () => {
    const neon = styleById("neon")!;
    const fresh = styleArtPatch(neon, {});
    expect(fresh).toEqual({ style: "neon", canvasColor: neon.palette.bg, color: neon.palette.fg, titleType: { ...defaultTitleType, font: "sans" } });
    const set = { ...defaultTitleType, weight: 700, align: "center" as const, italic: false };
    expect(styleArtPatch(styleById("kami")!, { titleType: set }).titleType).toEqual({ ...set, font: "poster" });
    expect(artPatch.safeParse(fresh).success).toBe(true);
  });

  it("is saved on the artwork and can be cleared", () => {
    expect(artPatch.safeParse({ style: "brutalism" }).success).toBe(true);
    expect(artPatch.safeParse({ style: null }).success).toBe(true);
    expect(artPatch.safeParse({ style: "Not An Id" }).success).toBe(false);
  });

  it("reaches the assistant when a project has one, with the real canvas shape", () => {
    const p = newProject(crypto.randomUUID(), "Night market", "a poster");
    expect(buildDesignContext(p, { intent: "warmer" }).style).toBe("none chosen");
    p.art = { ...p.art, style: "neon", format: "square" };
    const ctx = buildDesignContext(p, { intent: "warmer" });
    expect(ctx.style).toMatchObject({ name: "Neon", titleFace: "sans", palette: { accent: "#c084fc" } });
    expect(ctx.canvas).toMatch(/^A square, 1:1/);
  });
});

describe("Open Design decks", () => {
  const p = newProject(crypto.randomUUID(), "Night <market>", "a poster");
  const content = {
    title: `Night <script>alert(1)</script> market`,
    brief: "Posters for a night market, loud & warm.",
    maker: "Ayo Bello",
    date: "October 2026",
    art: p.art,
    pictures: {},
    references: [{ title: "After light", creator: "Ayo Bello", reason: "its quiet horizon", picture: "data:image/jpeg;base64,AA" }],
    decisions: [{ title: "Warm title", reason: "it carries the evening" }],
    posterFont: "data:font/ttf;base64,AA",
  };

  it("offers five MIT looks with shells ready for slides", () => {
    expect(deckLooks.map((l) => l.id)).toEqual(["studio", "monochrome", "signal", "grove", "broadside"]);
    for (const l of deckLooks) {
      expect(l.shell, l.id).toContain("<!--KRESILO_SLIDES-->");
      expect(l.shell, l.id).toContain('id="deck"');
      expect(l.credit).toMatch(/Zara Zhang \(MIT\)/);
    }
  });

  it("writes the project's slides, escaped, with nothing loaded from outside but the template's fonts", () => {
    for (const l of deckLooks) {
      const html = buildDeck(l, content);
      expect(html.match(/<section class="slide /g)?.length, l.id).toBe(6);
      expect(html, l.id).not.toContain("<script>alert(1)");
      expect(html, l.id).toContain("Night &lt;script&gt;");
      expect(html, l.id).toContain("Kept because its quiet horizon");
      const hosts = [...html.matchAll(/(?:src|href)="https?:\/\/([^/"]+)/g)].map((m) => m[1]);
      expect(hosts.every((h) => /^fonts\.(googleapis|gstatic)\.com$/.test(h)), `${l.id}: ${hosts}`).toBe(true);
    }
  });

  it("shows every slide's content without animation for reduced motion and print", () => {
    expect(buildDeck(deckLooks[0], content)).toMatch(/@media \(prefers-reduced-motion:reduce\),print\{\[data-anim\]\{opacity:1!important/);
  });

  it("turns slides from the page around it with next and previous messages", () => {
    for (const l of deckLooks) {
      const html = buildDeck(l, content);
      expect(html.split(DECK_REMOTE).length, l.id).toBe(2);
      expect(html.indexOf(DECK_REMOTE), l.id).toBeGreaterThan(html.lastIndexOf('id="deck"'));
      expect(html.trimEnd(), l.id).toMatch(/<\/script><\/body>\s*<\/html>$/);
    }
    const keys: string[] = [];
    const listeners: ((e: { data: unknown }) => void)[] = [];
    const run = new Function("addEventListener", "document", "KeyboardEvent", DECK_REMOTE.replace(/<\/?script>/g, ""));
    run(
      (_: string, f: (e: { data: unknown }) => void) => listeners.push(f),
      { dispatchEvent: (e: { key: string }) => keys.push(e.key) },
      class { key: string; constructor(_: string, o: { key: string }) { this.key = o.key; } },
    );
    for (const data of [{ kresilo: "next" }, { kresilo: "prev" }, { kresilo: "jump" }, "next", null]) listeners[0]({ data });
    expect(keys).toEqual(["ArrowRight", "ArrowLeft"]);
  });

  it("keeps slide text readable on a phone", () => {
    expect(buildDeck(deckLooks[0], content)).toMatch(/@media \(max-width:760px\)\{[^@]*\.display\{font-size:max\(var\(--sz-display\),40px\)\}[^@]*\.lead\{font-size:max\(var\(--sz-lead\),16px\)\}/);
  });

  it("keeps a title with dollar signs intact", () => {
    expect(buildDeck(deckLooks[0], { ...content, title: "Cheap $& cheerful $'" })).toContain("Cheap $&amp; cheerful $&#39;");
  });

  it("names the download after the project", () => {
    expect(deckFileName("Night market")).toBe("Night market deck.html");
    expect(deckFileName('a/b: "c"?')).toBe("a b c deck.html");
    expect(deckFileName("  ")).toBe("Kresilo deck.html");
  });

  it("rebuilds the artwork at the project's shape", () => {
    expect(artworkHtml({ ...p.art, format: "wide" }, {})).toContain(`aspect-ratio:${16 / 9}`);
  });

  it("draws a canvas project's cover picture instead of its empty layers", () => {
    const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    const html = artworkHtml({ ...p.art, snapshot: { image, width: 390, height: 844, at: "2026-10-26T00:00:00Z" } }, {});
    expect(html).toContain(`src="${image}"`);
    expect(html).toContain(`aspect-ratio:${390 / 844}`);
    expect(html).not.toContain(p.art.title);
  });
});
