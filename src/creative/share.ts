import type { Publication } from "./contracts";
import { assets } from "./catalog";

/**
 * Sharing a published post (issue #43). Pure strings, so the page, the link
 * preview and the preview image are tested without a browser or a server.
 *
 * The link people share is `/s/:id`. It answers with a small page that carries
 * the preview tags (title, description, image) for chat and social apps, then
 * sends a person on to the real post at `/p/:id`. Only a publication can be
 * shared; a project that was never published has no `/s` link, and a post
 * published as a private link stays unlisted and unembeddable.
 */

export const shareUrl = (origin: string, id: string) => `${origin}/s/${id}`;
export const postUrl = (origin: string, id: string) => `${origin}/p/${id}`;
export const embedUrl = (origin: string, id: string) => `${origin}/embed/${id}`;
export const cardUrl = (origin: string, id: string) => `${origin}/api/share-card/${id}`;

export const embedCode = (origin: string, id: string, title: string) =>
  `<iframe src="${escapeHtml(embedUrl(origin, id))}" title="${escapeHtml(title)}" width="560" height="420" style="border:0;max-width:100%" loading="lazy"></iframe>`;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type ShareActions = {
  /** Copy the shareable link. Always offered once a post exists. */
  link: boolean;
  /** Open the device's share sheet where the browser has one. */
  device: boolean;
  /** Copy embed code. Community posts only. */
  embed: boolean;
  /** Preview image for link cards. Community posts only. */
  card: boolean;
  /** Whether search engines and apps may list the post. */
  listed: boolean;
  /** One plain sentence about who can open the link. */
  note: string;
};

export function shareActions(audience: Publication["audience"]): ShareActions {
  return audience === "community"
    ? { link: true, device: true, embed: true, card: true, listed: true, note: "Anyone can open this post." }
    : {
        link: true,
        device: true,
        embed: false,
        card: false,
        listed: false,
        note: "Anyone with this link can open it. It is not listed, has no preview image and cannot be embedded.",
      };
}

export type ShareText = { title: string; description: string; lineage: string };

const trim = (text: string, max: number) =>
  text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;

/** What a link card says. Names every lineage creator as a sample practice, as the post does. */
export function shareText(pub: Publication): ShareText {
  const title = pub.art.title.split("\n").join(" ").trim() || pub.title;
  const from = pub.lineage?.find((l) => !l.removed) ?? pub.lineage?.[0];
  const lineage = from
    ? `Grew from ${from.title} by ${from.creator}`
    : "";
  const description = trim(
    [`Made by ${pub.creator}.`, lineage && `${lineage}.`, pub.description].filter(Boolean).join(" "),
    200,
  );
  return { title: trim(title, 90), description, lineage };
}

/** The small page a link preview reads. A person is sent on to the real post. */
export function sharePage(pub: Publication, origin: string, id: string): string {
  const t = shareText(pub);
  const actions = shareActions(pub.audience);
  const to = postUrl(origin, id);
  const tags = [
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="Kresilo" />`,
    `<meta property="og:title" content="${escapeHtml(t.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(t.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(shareUrl(origin, id))}" />`,
    ...(actions.card
      ? [
          `<meta property="og:image" content="${escapeHtml(cardUrl(origin, id))}" />`,
          `<meta property="og:image:type" content="image/svg+xml" />`,
          `<meta property="og:image:width" content="1200" />`,
          `<meta property="og:image:height" content="630" />`,
          `<meta name="twitter:card" content="summary_large_image" />`,
        ]
      : [`<meta name="twitter:card" content="summary" />`]),
    `<meta name="twitter:title" content="${escapeHtml(t.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(t.description)}" />`,
    ...(actions.listed ? [] : [`<meta name="robots" content="noindex, nofollow" />`]),
  ];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(t.title)} · Kresilo</title>
<link rel="canonical" href="${escapeHtml(to)}" />
<meta http-equiv="refresh" content="0; url=${escapeHtml(to)}" />
${tags.join("\n")}
</head>
<body><p><a href="${escapeHtml(to)}">Open ${escapeHtml(t.title)} on Kresilo</a></p></body>
</html>
`;
}

/** Wraps text into at most `lines` lines of about `per` characters, ending with an ellipsis if cut. */
const wrap = (text: string, per: number, lines: number): string[] => {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && `${line} ${word}`.length > per) {
      out.push(line);
      line = word;
    } else line = `${line} ${word}`.trim();
  }
  if (line) out.push(line);
  if (out.length <= lines) return out;
  const kept = out.slice(0, lines);
  kept[lines - 1] = `${kept[lines - 1].replace(/[.,;:]$/, "")}…`;
  return kept;
};

/**
 * The preview image: the work's background with its title, who made it and the
 * lineage strip. Only catalog images and the project's own board snapshot are used (imported media stays private),
 * and every piece of text is escaped. Some networks only accept PNG or JPEG
 * previews; turning this into a raster is not done here.
 */
export function previewCardSvg(pub: Publication, origin: string): string {
  const t = shareText(pub);
  const bg = pub.art.snapshot?.image ?? `${origin}${assets[pub.art.asset] ?? assets["after-light"]}`;
  const titleLines = wrap(t.title, 22, 2);
  const tspans = titleLines
    .map((l, i) => `<tspan x="72" dy="${i === 0 ? 0 : 82}">${escapeHtml(l)}</tspan>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeHtml(t.title)}">
<rect width="1200" height="630" fill="#0A0C0E"/>
<image href="${escapeHtml(bg)}" width="1200" height="630" preserveAspectRatio="xMidYMid slice" opacity="0.8"/>
<rect width="1200" height="630" fill="url(#shade)"/>
<defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.35" stop-color="#0A0C0E" stop-opacity="0"/><stop offset="1" stop-color="#0A0C0E" stop-opacity="0.92"/></linearGradient></defs>
<text x="72" y="${titleLines.length > 1 ? 340 : 400}" font-family="Georgia, 'Times New Roman', serif" font-size="72" fill="#F4F1EA">${tspans}</text>
<text x="72" y="520" font-family="Helvetica, Arial, sans-serif" font-size="28" fill="#D6FF3F">Made by ${escapeHtml(pub.creator)}</text>
${t.lineage ? `<text x="72" y="566" font-family="Helvetica, Arial, sans-serif" font-size="24" fill="#C9C6BE">${escapeHtml(trim(t.lineage, 80))}</text>` : ""}
<text x="1128" y="582" text-anchor="end" font-family="Georgia, serif" font-style="italic" font-size="34" fill="#F4F1EA">Kresilo</text>
</svg>
`;
}
