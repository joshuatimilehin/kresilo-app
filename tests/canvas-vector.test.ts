import { describe, expect, it } from "vitest";
import { MAX_LAYERS, VECTOR_PALETTE, VECTOR_MAX_CHARS, brandColor, cleanVector, vectorRequest } from "../src/creative/canvasVector";

const box = { width: 560, height: 450 };
const card = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 450">
  <defs><linearGradient id="g1"><stop offset="0" stop-color="#ff6b4a"/><stop offset="1" stop-color="#f0a82b"/></linearGradient></defs>
  <rect width="560" height="450" fill="#f4efe3"/>
  <g id="card-back"><rect x="190" y="200" width="270" height="160" rx="14" fill="#c8ff00"/></g>
  <g id="card-front"><rect x="90" y="96" width="290" height="170" rx="14" fill="#0b0d0f"/></g>
  <g id="logo-mark"><rect x="112" y="116" width="30" height="30" rx="9" fill="url(#g1)"/></g>
  <g id="name"><text x="112" y="196" font-family="Georgia" font-size="38" fill="#fff">Mara &amp; Vance</text></g>
  <g id="title"><text x="112" y="218" font-family="Courier New" font-size="10" fill="#ccff00">CREATIVE DIRECTOR</text></g>
  <g id="contact"><text x="112" y="240" font-size="10" fill="#eee">mara@kresilo.design</text></g>
</svg>`;

describe("a model's SVG becomes safe, on-brand layers", () => {
  it("splits a card into named layers, background first, each drawn alone at the region's size", () => {
    const r = cleanVector(card, box)!;
    expect(r.layers.map((l) => l.name)).toEqual(["Background", "card back", "card front", "logo mark", "name", "title", "contact"]);
    expect(r.layers.length).toBeGreaterThanOrEqual(5);
    for (const l of r.layers) expect(l.svg).toContain('viewBox="0 0 560 450"');
    expect(r.width).toBe(560);
  });

  it("snaps every colour to the Kresilo palette", () => {
    const r = cleanVector(card, box)!;
    const colours = [...r.svg.matchAll(/(?:fill|stroke|stop-color)="(#[0-9a-f]{6})"/g)].map((m) => m[1]);
    expect(colours.length).toBeGreaterThan(5);
    for (const c of colours) expect(VECTOR_PALETTE).toContain(c);
    expect(r.layers[1].svg).toContain('fill="#c7fe02"'); // a near-lime becomes lime
    expect(r.layers[2].svg).toContain('fill="#0a0c0e"'); // near-black becomes ink
  });

  it("maps fonts to the brand families and keeps text safe", () => {
    const r = cleanVector(card, box)!;
    expect(r.layers.find((l) => l.name === "name")!.svg).toContain("Instrument Serif");
    expect(r.layers.find((l) => l.name === "name")!.svg).toContain("Mara &amp; Vance");
    expect(r.layers.find((l) => l.name === "title")!.svg).toContain("IBM Plex Mono");
    expect(r.layers.find((l) => l.name === "contact")!.svg).toContain("Inter");
  });

  it("carries shared gradients into every layer so each draws alone", () => {
    const r = cleanVector(card, box)!;
    expect(r.layers.find((l) => l.name === "logo mark")!.svg).toContain('<linearGradient id="g1">');
  });

  it("brandColor picks the nearest palette colour", () => {
    expect(brandColor("#ffffff")).toBe("#edeae3");
    expect(brandColor("rgb(139, 92, 246)")).toBe("#8b5cf8");
    expect(brandColor("#ff0000")).toBe("#c7fe02"); // a red is not turned into grey
    expect(brandColor("#2255ff")).toBe("#8b5cf8");
    expect(brandColor("#777777")).toBe("#8d9396");
    expect(brandColor("coral")).not.toBeNull();
    expect(brandColor("not a colour")).toBeNull();
  });
});

describe("anything executable or external is dropped", () => {
  const wrap = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><g id="a"><rect width="5" height="5" fill="#fff"/></g>${inner}</svg>`;

  it("removes scripts, event handlers, links, styles, images, foreign objects and use", () => {
    const evil = wrap(`<script>alert(1)</script><g id="b" onload="x()" onclick="y()"><rect width="9" height="9" fill="red" style="fill:url(http://x)" href="http://evil"/></g>
      <foreignObject><div>hi</div><rect width="1" height="1"/></foreignObject><image href="data:image/png;base64,AAAA"/><use href="http://evil#a"/><style>@import 'x'</style>
      <a href="javascript:alert(1)"><rect width="2" height="2"/></a><iframe src="x"></iframe>`);
    const r = cleanVector(evil, { width: 10, height: 10 })!;
    const all = r.svg;
    expect(all).not.toMatch(/script|onload|onclick|href|style|foreignObject|<image|<use|<a[ >]|iframe|javascript|http:\/\/(?!www\.w3\.org)/i);
    expect(r.layers.map((l) => l.name)).toEqual(["a", "b"]);
  });

  it("drops colours and attributes it cannot trust but keeps the shape", () => {
    const r = cleanVector(wrap(`<g id="c"><path d="M0 0L5 5" fill="url(http://x)" stroke="expression(1)" stroke-width="2"/></g>`), { width: 10, height: 10 })!;
    const layer = r.layers.find((l) => l.name === "c")!.svg;
    expect(layer).toContain('<path d="M0 0L5 5" stroke-width="2"/>');
  });

  it("draws a model that styles by class and style attribute, inlining only allowed properties", () => {
    const styled = `<svg xmlns="http://www.w3.org/2000/svg"><defs><style>.bg{fill:#0b0d0f}.dot{fill:#ff0000;stroke:#fff;stroke-width:3;behavior:url(x.htc);background:url(http://evil)} .x:hover{fill:red}</style></defs>
      <rect class="bg" width="10" height="10"/><g id="a"><circle class="dot" r="2" style="fill:#c8ff00;filter:url(#f);opacity:.5"/></g></svg>`;
    const r = cleanVector(styled, { width: 10, height: 10 })!;
    expect(r.layers[0].svg).toContain('<rect width="10" height="10" fill="#0a0c0e"/>');
    const a = r.layers.find((l) => l.name === "a")!.svg;
    expect(a).toContain('fill="#c7fe02"'); // the style attribute beats the class
    expect(a).toContain('stroke="#edeae3"');
    expect(a).toContain('stroke-width="3"');
    expect(a).toContain('opacity=".5"');
    expect(a).not.toMatch(/behavior|background|filter|evil|style|class/);
  });

  it("ignores at-rules and keeps nothing from a style block it cannot read", () => {
    const r = cleanVector(`<svg><defs><style>@import url(http://evil); .a{fill:#fff}</style></defs><g id="g"><rect class="a" width="1" height="1"/></g></svg>`, { width: 10, height: 10 })!;
    expect(r.svg).not.toMatch(/evil|@import|style/);
    expect(r.layers[0].svg).toContain("<rect");
  });

  it("names an unnamed group from its text or what it draws", () => {
    const r = cleanVector(`<svg><g><text x="1" y="1">Dashboard Overview</text></g><g><circle r="3"/></g><g><line x1="0" y1="0" x2="5" y2="5"/></g><g><rect width="4" height="4"/></g></svg>`, { width: 10, height: 10 })!;
    expect(r.layers.map((l) => l.name)).toEqual(["Dashboard Overview", "Shape", "Lines", "Panel"]);
  });

  it("refuses malformed, empty, oversized and nested-root documents", () => {
    expect(cleanVector("not svg", box)).toBeNull();
    expect(cleanVector('<svg xmlns="http://www.w3.org/2000/svg"><g id="a"><rect width="1" height="1"></g></svg>', box)).toBeNull();
    expect(cleanVector('<svg xmlns="http://www.w3.org/2000/svg"></svg>', box)).toBeNull();
    expect(cleanVector(`<svg>${"<g id='a'><rect width='1' height='1'/></g>".repeat(5)}${"x".repeat(VECTOR_MAX_CHARS)}</svg>`, box)).toBeNull();
    expect(cleanVector(`<svg>${"<g>".repeat(20)}${"</g>".repeat(20)}</svg>`, box)).toBeNull();
  });

  it("names layers uniquely and caps how many are kept", () => {
    const many = `<svg>${Array.from({ length: MAX_LAYERS + 6 }, () => `<g id="part"><rect width="1" height="1"/></g>`).join("")}</svg>`;
    const r = cleanVector(many, box)!;
    expect(r.layers).toHaveLength(MAX_LAYERS);
    expect(r.layers[0].name).toBe("part");
    expect(r.layers[1].name).toBe("part 2");
  });

  it("validates the request", () => {
    const ok = { image: "data:image/png;base64,AAAA", width: 300, height: 200 };
    expect(vectorRequest.safeParse(ok).success).toBe(true);
    expect(vectorRequest.safeParse({ ...ok, image: "data:text/html;base64,AAAA" }).success).toBe(false);
    expect(vectorRequest.safeParse({ ...ok, extra: 1 }).success).toBe(false);
    expect(vectorRequest.safeParse({ ...ok, width: 4 }).success).toBe(false);
  });
});
