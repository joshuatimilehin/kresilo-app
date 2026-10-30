import type { Art, ImageLayer, Mark } from "./contracts";

/**
 * What the assistant may change in a project. The artist turns each on or off;
 * the command service keeps only the allowed parts of every suggestion, so a
 * request for "glitter" can no longer rewrite the title.
 *
 *  - words:  the title and caption text, their type, and showing or hiding them
 *  - layout: where things sit and how big they are (title and layers)
 *  - look:   colour, filters, opacity, adjustments, blending, shapes
 *  - images: adding, removing or swapping pictures (layers and the background)
 */
export const aiAllowKeys = ["words", "layout", "look", "images"] as const;
export type AiAllowKey = (typeof aiAllowKeys)[number];
export type AiAllow = Record<AiAllowKey, boolean>;

/** Words are off until the artist turns them on: their text is theirs. */
export const defaultAiAllow: AiAllow = { words: false, layout: true, look: true, images: true };

export const aiAllowOf = (p: { aiAllow?: Partial<AiAllow> }): AiAllow => ({ ...defaultAiAllow, ...p.aiAllow });

const ART_KEYS: Record<string, AiAllowKey> = {
  title: "words",
  caption: "words",
  titleType: "words",
  titleVisible: "words",
  captionVisible: "words",
  x: "layout",
  y: "layout",
  size: "layout",
  format: "layout",
  canvasColor: "look",
  color: "look",
  backgroundFilter: "look",
  backgroundOpacity: "look",
  asset: "images",
  backgroundMediaId: "images",
};

const LAYER_KEYS: Record<string, AiAllowKey> = {
  x: "layout",
  y: "layout",
  width: "layout",
  height: "layout",
  rotation: "layout",
  group: "layout",
  opacity: "look",
  filter: "look",
  adjust: "look",
  blend: "look",
  visible: "look",
  name: "words",
  role: "words",
  asset: "images",
  mediaId: "images",
  libraryArt: "images",
  visual: "images",
};

/** Text and shape layers: what each field counts as. Text and type are words. */
const MARK_KEYS: Record<string, AiAllowKey> = {
  x: "layout",
  y: "layout",
  width: "layout",
  height: "layout",
  rotation: "layout",
  size: "layout",
  text: "words",
  name: "words",
  font: "words",
  italic: "words",
  weight: "words",
  align: "words",
  color: "look",
  fill: "look",
  stroke: "look",
  strokeWidth: "look",
  radius: "look",
  opacity: "look",
  visible: "look",
  strokes: "look",
};
/** Adding or removing a text needs words; a shape or a drawing counts as look. */
const markKind = (m: Mark): AiAllowKey => (m.kind === "text" ? "words" : "look");

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Keeps only what the artist allows. Returns the trimmed patch and which kinds
 * of change were taken out. Unknown keys pass through unchanged.
 */
export function limitPatch(
  art: Art,
  patch: Partial<Art>,
  allow: AiAllow,
): { patch: Partial<Art>; blocked: AiAllowKey[] } {
  const blocked = new Set<AiAllowKey>();
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (key === "layers" || key === "marks") continue;
    const kind = ART_KEYS[key];
    if (kind && !allow[kind] && !same(value, (art as Record<string, unknown>)[key])) blocked.add(kind);
    else out[key] = value;
  }
  if (patch.layers) {
    const before = new Map((art.layers ?? []).map((l) => [l.id, l]));
    const proposed = new Map(patch.layers.map((l) => [l.id, l]));
    const layers: ImageLayer[] = [];
    for (const l of patch.layers) {
      const old = before.get(l.id);
      if (!old) {
        if (allow.images) layers.push(l);
        else blocked.add("images");
        continue;
      }
      const merged: Record<string, unknown> = { ...old };
      for (const [key, value] of Object.entries(l)) {
        const kind = LAYER_KEYS[key];
        if (kind && !allow[kind] && !same(value, (old as Record<string, unknown>)[key])) blocked.add(kind);
        else merged[key] = value;
      }
      layers.push(merged as ImageLayer);
    }
    // A layer the suggestion dropped is a removed picture.
    for (const old of art.layers ?? [])
      if (!proposed.has(old.id) && !allow.images) {
        blocked.add("images");
        layers.push(old);
      }
    if (!same(layers, art.layers ?? [])) out.layers = layers;
  }
  if (patch.marks) {
    const before = new Map((art.marks ?? []).map((m) => [m.id, m]));
    const proposed = new Set(patch.marks.map((m) => m.id));
    const marks: Mark[] = [];
    for (const m of patch.marks) {
      const old = before.get(m.id);
      if (!old) {
        if (allow[markKind(m)]) marks.push(m);
        else blocked.add(markKind(m));
        continue;
      }
      const merged: Record<string, unknown> = { ...old };
      for (const [key, value] of Object.entries(m)) {
        const kind = MARK_KEYS[key];
        if (kind && !allow[kind] && !same(value, (old as Record<string, unknown>)[key])) blocked.add(kind);
        else merged[key] = value;
      }
      marks.push(merged as Mark);
    }
    for (const old of art.marks ?? [])
      if (!proposed.has(old.id) && !allow[markKind(old)]) {
        blocked.add(markKind(old));
        marks.push(old);
      }
    if (!same(marks, art.marks ?? [])) out.marks = marks;
  }
  return { patch: out as Partial<Art>, blocked: aiAllowKeys.filter((k) => blocked.has(k)) };
}

export const aiAllowLabel: Record<AiAllowKey, string> = {
  words: "Words",
  layout: "Layout",
  look: "Look",
  images: "Add images",
};

/** One line for the model: what it may and may not touch. */
export function aiAllowRule(allow: AiAllow): string {
  const on = aiAllowKeys.filter((k) => allow[k]).map((k) => aiAllowLabel[k].toLowerCase());
  const off = aiAllowKeys.filter((k) => !allow[k]).map((k) => aiAllowLabel[k].toLowerCase());
  return off.length
    ? `The artist allows changes to: ${on.join(", ") || "nothing"}. Do not change: ${off.join(", ")}.`
    : "The artist allows every kind of change.";
}

/**
 * What one request asks for, read from the person's own words. A request that
 * names its words (a title, a quoted line, "text", "caption", "headline"...) may
 * change words for that request even while the words switch is off; motion and
 * new pictures happen only when asked for.
 */
const WORDS_ASK =
  /\b(?:titles?|retitle|rename|text|caption|headlines?|heading|subheading|subtitle|words?|wording|lines?|tagline|slogan|lettering|says?|saying|reads?|spell|write|named?|called)\b/i;
const QUOTED_ASK = /(?:^|[\s(:])["“'‘][^"”'’\n]{1,80}["”'’]/;
export const asksForWords = (intent: string) => WORDS_ASK.test(intent) || QUOTED_ASK.test(intent);
export const asksForMotion = (intent: string) =>
  /\b(?:motion|animat\w*|movement|moving|drift\w*|loop\w*|zoom\w*|pan|panning|spin\w*|bounce\w*|pulse\w*|fade\w*|seconds?|tempo|beat|rhythm|faster|slower|speed|pace|video|gif|reel|mp4)\b/i.test(intent);
const PICTURE_WORDS =
  /\b(?:textures?|grain|patterns?|photos?|photograph\w*|images?|pictures?|backgrounds?|backdrop|layers?|overlays?|assets?|stickers?|collage|draw\w*|illustrat\w*|icons?|clip ?art|doodles?|sketch\w*|scribbles?|silhouettes?|emblems?|visuals?)\b|\bhand[- ]?(?:drawn|painted|inked)\b/i;
/** "add a loaf", "put a few stars", "include an old key": a request that names a concrete thing to place. */
const ADD_A_THING =
  /\b(?:add|put|place|insert|include|draw|give me)\s+(?:in\s+|on\s+)?(?:a few|a couple of|a|an|some|one|two|three)\s+((?:(?:small|big|large|little|tiny|simple|cute|nice|old|vintage|rustic|fresh|warm|golden|round|slight|subtle|soft|bold|thin|thick|strong|gentle|light|dark|extra|bit of|touch of|hint of)\s+)*)([a-z][a-z-]+)/i;
/** Words that follow "add a" but are not pictures: words, effects, colour and layout. */
const NOT_A_PICTURE = new Set(
  "title titles caption captions text line lines heading headline subtitle tagline slogan word words quote sentence paragraph label shadow shadows border outline stroke colour color tint hue blur glow gradient filter effect effects contrast brightness space margin padding gap bit touch hint more less mask crop rectangle square circle ellipse shape shapes box button frame bar divider rule underline highlight emphasis feel sense mood vibe twist pop layout grid column row".split(" "),
);
export const asksForImages = (intent: string) => {
  if (PICTURE_WORDS.test(intent)) return true;
  const named = ADD_A_THING.exec(intent)?.[2]?.toLowerCase();
  return Boolean(named) && !NOT_A_PICTURE.has(named!);
};

const sameWords = (a: string, b: string) => a.trim().replace(/\s+/g, " ").toLowerCase() === b.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * The switches for one request: the project's own, with words on when the
 * request asks for words or is the project's brief (the first draft from the
 * person's own words).
 */
export function allowForRequest(p: { aiAllow?: Partial<AiAllow>; brief?: string }, intent: string): AiAllow {
  const allow = aiAllowOf(p);
  if (!allow.words && (asksForWords(intent) || (p.brief?.trim() && sameWords(p.brief, intent)))) allow.words = true;
  return allow;
}
