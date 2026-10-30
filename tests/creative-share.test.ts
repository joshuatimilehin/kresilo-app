import { describe, expect, it } from "vitest";
import { newProject, publicProject, type Publication } from "../src/creative/contracts";
import { asReference } from "../src/creative/catalog";
import {
  embedCode,
  escapeHtml,
  previewCardSvg,
  shareActions,
  sharePage,
  shareText,
  shareUrl,
} from "../src/creative/share";

const origin = "https://kristello.design-bakery.com";
const id = "11111111-2222-3333-4444-555555555555";

function publication(over: Partial<Publication> = {}): Publication {
  const p = newProject(crypto.randomUUID(), "An evening study", "Study");
  p.art.title = "After light\nin the market";
  p.references.push(asReference("tidal-lines", "Keep the flowing lines")!);
  return {
    id,
    audience: "community",
    ...publicProject(p, "A quiet poster about the hour after work.", "Ayo Bello"),
    ...over,
  } as Publication;
}

describe("share links and actions", () => {
  it("shares a clean /s link and builds embed code that is safe to paste", () => {
    expect(shareUrl(origin, id)).toBe(`${origin}/s/${id}`);
    const code = embedCode(origin, id, 'A "quoted" <title>');
    expect(code).toContain(`src="${origin}/embed/${id}"`);
    expect(code).not.toMatch(/<title>/);
    expect(code).toContain("&quot;quoted&quot;");
  });

  it("offers the full set for a community post and only the link for a private one", () => {
    expect(shareActions("community")).toMatchObject({ link: true, embed: true, card: true, listed: true });
    expect(shareActions("private")).toMatchObject({ link: true, embed: false, card: false, listed: false });
    expect(shareActions("private").note).toMatch(/not listed/);
  });
});

describe("link preview page", () => {
  it("carries the title, description and preview image for a community post, and sends people on to the post", () => {
    const html = sharePage(publication(), origin, id);
    expect(html).toContain('property="og:title" content="After light in the market"');
    expect(html).toContain(`property="og:image" content="${origin}/api/share-card/${id}"`);
    expect(html).toContain("summary_large_image");
    expect(html).toContain(`url=${origin}/p/${id}`);
    expect(html).not.toContain("noindex");
  });

  it("says where the work grew from", () => {
    const text = shareText(publication());
    expect(text.lineage).toMatch(/^Grew from .+ by [^()]+$/);
    expect(text.description).toContain("Made by Ayo Bello.");
    expect(text.description.length).toBeLessThanOrEqual(200);
  });

  it("keeps a private-link post unlisted, without a preview image", () => {
    const html = sharePage(publication({ audience: "private" }), origin, id);
    expect(html).toContain('content="noindex, nofollow"');
    expect(html).not.toContain("og:image");
    expect(html).toContain('name="twitter:card" content="summary"');
  });

  it("escapes anything a maker typed", () => {
    const html = sharePage(
      publication({ description: '"><script>alert(1)</script>', creator: "<b>x</b>" }),
      origin,
      id,
    );
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>x</b>");
    expect(escapeHtml(`a&b<c>"d'`)).toBe("a&amp;b&lt;c&gt;&quot;d&#39;");
  });
});

describe("preview image", () => {
  it("shows the title, the maker and the lineage over a catalog image", () => {
    const svg = previewCardSvg(publication(), origin);
    expect(svg).toContain('width="1200" height="630"');
    expect(svg).toContain("After light");
    expect(svg).toContain("Made by Ayo Bello");
    expect(svg).toContain("Grew from");
    expect(svg).toMatch(new RegExp(`href="${origin}/assets/kresilo/`));
  });

  it("escapes text and never embeds script or external styles", () => {
    const svg = previewCardSvg(publication({ creator: '<script>x</script>"' }), origin);
    expect(svg).not.toMatch(/<script|onload|javascript:/i);
    expect(svg).toContain("&lt;script&gt;");
  });

  it("wraps a long title onto two lines and cuts it with an ellipsis", () => {
    const pub = publication();
    pub.art.title = "A very long title that goes on and on and on and on and on about the market at night";
    const svg = previewCardSvg(pub, origin);
    expect(svg.match(/<tspan/g)?.length).toBe(2);
    expect(svg).toContain("…");
  });
});
