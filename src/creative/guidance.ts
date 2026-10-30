/** Small pure helpers for plain-language guidance copy. No browser or server imports. */

export function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export type PromptGate = {
  ok: boolean;
  /** Plain sentence shown beside the disabled send button. Empty when ok. */
  reason: string;
};

/**
 * Says whether a typed prompt can be sent, and if not, why in plain words.
 * References make suggestions better and are cited when there are any, but
 * they are not required: a project started from an idea alone can ask too.
 */
export function promptGate(input: { targetExists: boolean; intent: string }): PromptGate {
  if (!input.targetExists)
    return { ok: false, reason: "Choose an image in Layers first, then describe the change." };
  if (!input.intent.trim()) return { ok: false, reason: "Describe the change you want, then send." };
  return { ok: true, reason: "" };
}

/**
 * A project name from the idea: the subject, not the request. "A poster for a
 * rooftop jazz night in Lisbon, warm and loud" becomes "Rooftop jazz night in
 * Lisbon".
 */
export const nameFromIdea = (idea: string) => {
  const subject = idea
    .trim()
    .replace(/\s+/g, " ")
    .split(/[,.;:!?\n–—-]/)[0]
    .replace(/^(?:please\s+)?(?:(?:make|design|create|draw|build)\s+(?:me\s+)?)?/i, "")
    .replace(/^(?:an?|the|my|our)\s+(?:\w+\s+){0,2}?(?:poster|flyer|logo|identity|brand|cover|card|post|story|stories|banner|label|menu|sign|deck|page|invite|invitation)s?\s+(?:for|about|of|announcing)\s+/i, "")
    .replace(/^(?:an?|the)\s+/i, "")
    .trim();
  const words = subject.split(" ").slice(0, 6).join(" ");
  return words ? words[0].toUpperCase() + words.slice(1) : "Untitled";
};

/** Words a short title should not end on: "My friend's bakery opening on" reads unfinished. */
const TRAILING = /\s+(?:on|in|at|for|of|with|and|or|to|the|a|an|this|next|by|from|my|our|your)$/i;
const NAMED =
  /\b(?:with the name|by the name|under the name|the name is|named|called|titled|entitled|branded as|name it)\s+["“'‘]?([^,.;:!?\n"”’]+?)["”'’]?(?=$|[,.;:!?\n]|\s+(?:and|with|in|on|at|for|that|which|who|to)\b)/i;
const QUOTED = /(?:^|[\s(:])["“'‘]([^"”'’\n]{1,60})["”'’]/;

/**
 * The title a brief asks for. A named thing wins ("with the name Crumb & Co",
 * "called Kopi Kecil", a quoted title); otherwise a short phrase from the
 * subject, never the whole sentence.
 */
export const titleFromBrief = (brief: string) => {
  const text = brief.trim().replace(/\s+/g, " ");
  const named = (text.match(NAMED)?.[1] ?? text.match(QUOTED)?.[1] ?? "").trim();
  if (named && named.length <= 40 && named.split(" ").length <= 6) return named[0].toUpperCase() + named.slice(1);
  let phrase = nameFromIdea(text).split(" ").slice(0, 5).join(" ");
  while (TRAILING.test(phrase)) phrase = phrase.replace(TRAILING, "");
  return phrase || "Untitled";
};

/** How a piece should look, not what it is about: these never make a supporting line. */
const STYLE =
  "warm|cool|calm|bold|loud|soft|playful|minimal|minimalist|clean|simple|hand[- ]?drawn|hand[- ]?made|hand[- ]?lettered|retro|vintage|modern|gritty|grungy|moody|bright|quiet|elegant|cosy|cozy|fun|friendly|colou?rful|cheerful|rustic|classic|punchy|sleek|editorial|dreamy|pastel|dark|light|clear|crisp|airy|fresh|textured|painterly|lively|tasteful|big|small";
/** What is being made. "A ferry timetable app screen for…" keeps "ferry timetable" and drops "app screen". */
const FORMATS =
  "posters?|flyers?|logos?|identity|brand|covers?|cards?|posts?|story|stories|banners?|labels?|menus?|signs?|decks?|pages?|invites?|invitations?|screens?|apps?|websites?|sites?|layouts?|mockups?|ads?|adverts?|series|campaigns?|visuals?|graphics?|designs?|artworks?|illustrations?|leaflets?|brochures?|tickets?|thumbnails?";
/** Words that only say where a piece goes ("an Instagram story"), dropped with the format. */
const MEDIUM = "instagram|social|tiktok|facebook|linkedin|square|printed|print|mobile|phone|web|a3|a4|a5|digital|one-page|single";
const STYLE_WORD = new RegExp(`^(?:${STYLE}|${MEDIUM})$`, "i");
const FORMAT_WORD = new RegExp(`^(?:${FORMATS})$`, "i");
const ASK = /^(?:please\s+)?(?:(?:make|design|create|draw|build|do|i need|we need|i want|we want)\s+(?:me\s+|us\s+)?)?/i;
const ARTICLE = /^(?:an?|the|some)\s+/i;
const LEAD = new RegExp(
  `^((?:[\\w'’&-]+\\s+){0,4}?)(?:(?:${FORMATS})\\s+)+(for|about|of|announcing|showing|promoting|advertising|to promote|to announce)\\s+`,
  "i",
);
const ONLY_FORMAT = new RegExp(`^((?:[\\w'’&-]+\\s+){0,4}?)(?:${FORMATS})(?:\\s+(?:${FORMATS}))*$`, "i");
/** Style said at the end: "…in a warm hand-drawn style", "…, warm and hand-drawn". Single adjectives stay ("Festival of light"). */
const STYLE_TAIL = new RegExp(
  `\\s+(?:(?:in|with)\\s+an?\\s+)?(?:(?:${STYLE})\\s+)*(?:${STYLE})\\s+(?:style|feel|look|vibe|mood|colou?rs?|tones?|lettering)$|\\s+(?:${STYLE})\\s+(?:and|&)\\s+(?:${STYLE})$`,
  "i",
);
/** "my friend's", "our", "a client's": whose it is, which a poster does not say. */
const OWNER = /^(?:(?:my|our|your|his|her|their|an?)\s+(?:[\w-]+['’]s\s+)?|the\s+)/i;
const SIDE_CLAUSE = /^(?:with|and|in|using|but|that|which|so|to|like)\b/i;
const FILLER = new Set(["on", "in", "at", "for", "of", "with", "and", "or", "to", "the", "a", "an", "this", "next", "by", "from", "my", "our", "your", "&", "style", "feel", "look"]);
const contentWords = (s: string) =>
  s
    .toLowerCase()
    .replace(/['’]s\b/g, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w && !FILLER.has(w));
/** True when a phrase says what something is, not only how it looks or what kind of piece it is. */
const saysWhat = (s: string) =>
  s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .some((w) => w && !FILLER.has(w) && !STYLE_WORD.test(w) && !FORMAT_WORD.test(w));

/** The subject of one clause of a brief, or "" when the clause only says how it should look. */
function subjectOf(clause: string): string {
  let s = clause.trim().replace(ASK, "").replace(ARTICLE, "");
  const lead = s.match(LEAD) ?? s.match(ONLY_FORMAT);
  if (lead) {
    // Words before the format are kept when they name the subject ("ferry timetable"), not when they say where it goes or how it looks.
    const before = lead[1]
      .trim()
      .split(/\s+/)
      .filter((w) => w && !STYLE_WORD.test(w) && !FORMAT_WORD.test(w));
    const rest = s.slice(lead[0].length);
    s = (before.length ? [...before, lead[2] ?? "", rest] : [rest]).join(" ").replace(/\s+/g, " ").trim();
  }
  s = s.replace(OWNER, "");
  for (let i = 0; i < 3; i++) s = s.replace(STYLE_TAIL, "").replace(OWNER, "").trim();
  return saysWhat(s) ? s : "";
}

/**
 * A short supporting line for a first layout, taken from the brief's own
 * words and never invented: what the piece is for ("A poster for my friend's
 * bakery opening on Saturday, warm and hand-drawn, with the name Crumb & Co"
 * gives "Bakery opening on Saturday"). The request, whose it is, the name and
 * the style words go; "" when nothing sensible is left or it would only repeat
 * the title.
 */
export function lineFromBrief(brief: string, title = titleFromBrief(brief)): string {
  const text = brief.trim().replace(/\s+/g, " ").replace(new RegExp(NAMED.source, "ig"), "").replace(new RegExp(QUOTED.source, "g"), " ");
  let line = "";
  for (const clause of text.split(/[,.;:!?\n–—()]|\s-\s/)) {
    const c = clause.trim();
    if (!c || SIDE_CLAUSE.test(c)) continue;
    line = subjectOf(c);
    if (line) break;
  }
  if (!line) return "";
  let words = line.split(" ").slice(0, 8);
  while (words.join(" ").length > 48 && words.length > 1) words = words.slice(0, -1);
  line = words.join(" ");
  while (TRAILING.test(line)) line = line.replace(TRAILING, "");
  line = line.replace(/[\s&-]+$/, "");
  const said = contentWords(line);
  if (!said.length) return "";
  const titled = new Set(contentWords(title));
  // A line that mostly says the title again adds nothing.
  if (said.filter((w) => titled.has(w)).length / said.length >= 0.75) return "";
  return line[0].toUpperCase() + line.slice(1);
}
