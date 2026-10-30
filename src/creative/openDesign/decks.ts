import meta from "./decks.json";
import studio from "./decks/studio.html?raw";
import monochrome from "./decks/monochrome.html?raw";
import signal from "./decks/signal.html?raw";
import grove from "./decks/grove.html?raw";
import broadside from "./decks/broadside.html?raw";
import { layerCss, titleStyle } from "../layers";
import { markStyle, drawingSvg } from "../marks";
import { ratioOf, type Art } from "../contracts";

/**
 * Decks from a project, in one of five Open Design looks (Zara Zhang's
 * MIT-licensed templates). Each template keeps its own fonts, colours, type
 * scale, entrance animations and navigation; Kresilo writes the slides from
 * the project: the artwork, the idea, the references and why they were kept,
 * the decisions, and a close. Rebuilt by scripts/open-design-decks.ts.
 */
export type DeckLook = (typeof meta)[number] & { shell: string };

const shells: Record<string, string> = { studio, monochrome, signal, grove, broadside };
export const deckLooks: readonly DeckLook[] = meta.map((m) => ({ ...m, shell: shells[m.id] }));
export const deckLookById = (id: string) => deckLooks.find((l) => l.id === id);

export type DeckContent = {
  title: string;
  brief: string;
  maker: string;
  date: string;
  /** The artwork, already resolved: every picture as a data URL. */
  art: Art;
  pictures: Record<string, string>;
  references: { title: string; creator: string; reason: string; picture: string }[];
  decisions: { title: string; reason: string }[];
  /** The poster face as a data URL, so the deck needs nothing from Kresilo to play. */
  posterFont: string;
};

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const css = (o: Record<string, string | number | undefined>) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${v}`)
    .join(";");

/** Where a picture of the artwork lives: a background asset, an upload, or a layer's own picture. */
export const pictureKey = (o: { asset?: string; mediaId?: string | null }) => (o.mediaId ? `media:${o.mediaId}` : `asset:${o.asset}`);

/** The artwork as static HTML, sized by its container, the same way the canvas draws it. */
export function artworkHtml(art: Art, pictures: Record<string, string>): string {
  // A project made on the Studio canvas is its cover picture; it has no layers to draw.
  if (art.snapshot) return `<div class="kres-art" style="aspect-ratio:${ratioOf(art)}"><img alt="" src="${art.snapshot.image}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></div>`;
  const bg = pictures[pictureKey({ asset: art.asset, mediaId: art.backgroundMediaId })];
  const layers = (art.layers ?? [])
    .filter((l) => l.visible && !l.libraryArt && !l.visual)
    .map((l) => {
      const src = pictures[pictureKey(l)];
      return src ? `<img alt="" src="${src}" style="position:absolute;object-fit:cover;left:${l.x}%;top:${l.y}%;width:${l.width}%;height:${l.height}%;${layerCss(l)}">` : "";
    })
    .join("");
  const marks = (art.marks ?? [])
    .filter((m) => m.visible)
    .map((m) => `<div style="position:absolute;${css(markStyle(m) as Record<string, string>)}">${m.kind === "text" ? escapeHtml(m.text) : m.kind === "path" ? drawingSvg(m) : ""}</div>`)
    .join("");
  const titleType = art.titleType ? css(titleStyle(art.titleType) as Record<string, string>) : "font-family:'Kresilo Poster',Georgia,serif;font-style:italic;font-weight:400;line-height:.78;letter-spacing:-.04em";
  const title =
    art.titleVisible === false
      ? ""
      : `<div style="position:absolute;left:${art.x}%;top:${art.y}%;max-width:93%;white-space:pre-line;font-size:${art.size}cqw;color:${art.color};${titleType}">${escapeHtml(art.title)}</div>`;
  return `<div class="kres-art" style="aspect-ratio:${ratioOf(art)};background:${art.canvasColor ?? "#173e43"}">${bg ? `<img alt="" src="${bg}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:${art.backgroundOpacity ?? 1}">` : ""}${layers}${marks}${title}</div>`;
}

const slide = (theme: "dark" | "light", inner: string) => `<section class="slide ${theme}"><div class="slide-body kres-body">${inner}</div></section>`;
const anim = (kind: string, delay: number) => `data-anim="${kind}" data-delay="${delay}"`;

/** The downloaded file's name says what it is: "<title> deck.html". */
export const deckFileName = (title: string) =>
  `${
    title
      .replace(/[^\p{L}\p{N} ._'(),&!-]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || "Kresilo"
  } deck.html`;

/**
 * Lets the page around the deck turn its slides: a message {kresilo: "next"}
 * or {kresilo: "prev"} becomes the arrow key the template already listens for.
 */
export const DECK_REMOTE = `<script>addEventListener("message",function(e){var k=e.data&&e.data.kresilo;if(k!=="next"&&k!=="prev")return;document.dispatchEvent(new KeyboardEvent("keydown",{key:k==="next"?"ArrowRight":"ArrowLeft",bubbles:true,cancelable:true}))});</script>`;

/** The whole deck as one self-contained page. */
export function buildDeck(look: DeckLook, c: DeckContent): string {
  const e = escapeHtml;
  const art = artworkHtml(c.art, c.pictures);
  const slides = [
    slide(
      "dark",
      `<div class="kres-split"><div><span class="kicker label" ${anim("fade-in", 0)}>A Kresilo project · ${e(c.date)}</span><h1 class="display" ${anim("fade-up", 1)}>${e(c.title)}</h1><p class="lead" ${anim("fade-up", 2)}>${e(c.maker)}</p></div><div class="kres-art-wrap" ${anim("scale-in", 1)}>${art}</div></div>`,
    ),
    slide("light", `<div class="kres-center"><span class="kicker label" ${anim("fade-in", 0)}>The idea</span><h2 class="h1" ${anim("fade-up", 1)}>${e(c.brief)}</h2></div>`),
    ...c.references.slice(0, 3).map((r, i) =>
      slide(
        i % 2 ? "dark" : "light",
        `<div class="kres-split"><div class="kres-picture" ${anim("reveal-left", 0)}><img alt="" src="${r.picture}"></div><div><span class="kicker label" ${anim("fade-in", 1)}>Reference ${i + 1}</span><h2 class="h2" ${anim("fade-up", 1)}>${e(r.title)}</h2><p class="body" ${anim("fade-up", 2)}>Kept because ${e(r.reason)}</p><span class="caption" ${anim("fade-in", 3)}>${e(r.creator)}</span></div></div>`,
      ),
    ),
    ...(c.decisions.length
      ? [
          slide(
            "dark",
            `<div><span class="kicker label" ${anim("fade-in", 0)}>What we decided</span><ol class="kres-list">${c.decisions
              .slice(0, 4)
              .map((d, i) => `<li ${anim("fade-up", i + 1)}><h3 class="h3">${e(d.title)}</h3><p class="body">${e(d.reason)}</p></li>`)
              .join("")}</ol></div>`,
          ),
        ]
      : []),
    slide("dark", `<div class="kres-center kres-hero" ${anim("scale-in", 0)}>${art}</div>`),
    slide(
      "light",
      `<div class="kres-center"><h2 class="display" ${anim("fade-up", 0)}>${e(c.title)}</h2><span class="label" ${anim("fade-in", 1)}>Made with Kresilo · ${e(c.maker)}</span><span class="caption" ${anim("fade-in", 2)}>Look: ${e(look.name)}. ${e(look.credit)}.</span></div>`,
    ),
  ];
  const style = `<style>
@font-face{font-family:"Kresilo Poster";font-style:italic;font-weight:400 900;src:url(${c.posterFont}) format("truetype")}
.slide>.kres-body{grid-row:1/-1;align-self:stretch;display:flex;align-items:center;min-height:0;height:100%}
.kres-body>*{width:100%}
.kres-split{display:grid;grid-template-columns:1fr 1fr;gap:5vw;align-items:center}
.kres-center{display:grid;gap:2.4vh;justify-items:center;text-align:center;max-width:72vw;margin:0 auto}
.kres-art-wrap{display:flex;justify-content:center}
.kres-art{position:relative;container-type:inline-size;overflow:hidden;width:min(100%,calc(70vh * var(--kres-r,0.75)));max-height:70vh}
.kres-hero .kres-art{width:min(80vw,calc(78vh * var(--kres-r,0.75)));max-height:78vh}
.kres-picture{aspect-ratio:4/3;overflow:hidden;border-radius:4px}
.kres-picture img{width:100%;height:100%;object-fit:cover;display:block}
.kres-list{list-style:none;margin:3vh 0 0;padding:0;display:grid;grid-template-columns:repeat(2,1fr);gap:3vh 4vw}
.kres-list li{display:grid;gap:1vh;border-top:1px solid currentColor;padding-top:2vh}
@media (max-width:760px){.kres-split,.kres-list{grid-template-columns:1fr}.display{font-size:max(var(--sz-display),40px)}.h1{font-size:max(var(--sz-h1),28px)}.h2{font-size:max(var(--sz-h2),22px)}.h3{font-size:max(var(--sz-h3),17px)}.lead{font-size:max(var(--sz-lead),16px)}.body{font-size:max(var(--sz-body),14px)}.caption{font-size:max(var(--sz-caption),12px)}.label{font-size:max(var(--sz-label),10px)}}
@media (prefers-reduced-motion:reduce),print{[data-anim]{opacity:1!important;animation:none!important;transform:none!important}}
</style>`;
  return look.shell
    .replace("<!--KRESILO_TITLE-->", () => e(c.title))
    .replace("</head>", `${style.replace(/var\(--kres-r,0\.75\)/g, String(ratioOf(c.art)))}</head>`)
    .replace("<!--KRESILO_SLIDES-->", () => slides.join("\n"))
    .replace(/<\/body>(?![\s\S]*<\/body>)/, `${DECK_REMOTE}</body>`);
}
