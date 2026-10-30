import type { Art } from "./contracts";
import { brandTemplates } from "./portfolio/templates";
import { designerForTemplate, designerMap } from "./specialistMap";

/**
 * Studio's four specialist designers. Each is a short set of rules (layout,
 * hierarchy, type, palette, motion) that tunes the assistant's taste for one
 * kind of work. The person picks one, or leaves the assistant on Auto and
 * `chooseSpecialist` reads the brief and the request. The rules are Kresilo's
 * own words; the ideas were distilled from the skill notes in Open Design
 * (Apache-2.0, see THIRD_PARTY_NOTICES.md).
 *
 * Plain data plus pure functions, so the browser and the server pick the same
 * designer for the same words and it is tested without either. A designer
 * never widens what the assistant may do: the artist's switches, focus and
 * hand-only layers still decide what can change.
 */
export const specialistIds = ["ui", "brand", "illustration", "motion"] as const;
export type SpecialistId = (typeof specialistIds)[number];

export type DesignerRules = { layout: string; hierarchy: string; type: string; palette: string; motion: string };

export type Specialist = {
  id: SpecialistId;
  name: string;
  /** A Phosphor icon name; the Studio assistant maps it to the component. */
  icon: "DeviceMobile" | "Stamp" | "PenNib" | "FilmStrip";
  rules: DesignerRules;
  /**
   * Words in a request or brief that point to this designer. Whole words,
   * lower case; a trailing * allows any ending ("animat*"); a leading + marks
   * a strong signal that names the discipline itself.
   */
  signals: readonly string[];
};

export const specialists: readonly Specialist[] = [
  {
    id: "ui",
    name: "UI/UX",
    icon: "DeviceMobile",
    rules: {
      layout: "Build on a steady spacing scale in one column that holds at phone width; keep controls where people expect them and give every tap target room, at least 44 points.",
      hierarchy: "Put the one thing the person came to do first and everything else lower; show the primary action as the most obvious thing on the screen.",
      type: "One text face, two or three sizes, plain labels; never set body text small or over a busy picture.",
      palette: "A ground, an ink and one accent for the action; check that text stays readable on its ground.",
      motion: "Short, quiet movement that explains a change of state; nothing that delays a tap.",
    },
    signals: ["+app", "+apps", "+screen*", "+interface*", "+ui", "+ux", "+wireframe*", "+prototype*", "+dashboard*", "+onboarding", "+website*", "+checkout", "button*", "sign in", "sign-in", "login", "landing page", "navigation", "tap target*", "empty state*", "form", "toolbar", "menu", "mobile"],
  },
  {
    id: "brand",
    name: "Brand identity",
    icon: "Stamp",
    rules: {
      layout: "Lay it out on a calm grid with generous gutters: the mark large and alone first, then colour, then type, then the mark at work.",
      hierarchy: "One idea per piece; the name or mark wins at first glance and every other element belongs to the same system.",
      type: "One typeface or a single pair, the name spelled and cased exactly as given; check that the mark still reads when small.",
      palette: "Two or three colours used with discipline beat six used loosely; keep the same colours across every piece.",
      motion: "Restraint: a brand moves the same way every time, so use one gentle movement and repeat it.",
    },
    signals: ["+logo*", "+brand*", "+identity", "+wordmark*", "+monogram*", "+logotype*", "+stationery", "+letterhead*", "+packaging", "+lockup*", "+emblem*", "business card*", "style guide", "visual identity", "brand board", "mockup*", "colour palette", "color palette"],
  },
  {
    id: "illustration",
    name: "Illustration",
    icon: "PenNib",
    rules: {
      layout: "Give the picture a clear subject, a calm area for the title and edges that are cropped on purpose; scale the subject so it feels confident.",
      hierarchy: "The picture says it first and the words support it; if the picture and the title compete, make one of them smaller.",
      type: "Let the title sit quietly beside the artwork, in a face that suits its hand: chunky with brush, fine with line.",
      palette: "Draw colour from the picture itself, with one accent from it for the type; keep the pictures in one hand (line weight, grain).",
      motion: "A picture drifts or breathes slowly; never move it so much that its drawing is lost.",
    },
    signals: ["+illustrat*", "+draw*", "+sketch*", "+doodle*", "+sticker*", "+collage*", "+mascot*", "+character*", "picture*", "image*", "photo*", "pattern*", "texture*", "icon*", "scene*", "visual library", "painting", "line art", "hand-drawn", "background*", "poster", "cover"],
  },
  {
    id: "motion",
    name: "Motion",
    icon: "FilmStrip",
    rules: {
      layout: "Plan the first frame and the last frame as stills that both work, and leave room on the canvas for what moves in.",
      hierarchy: "Decide what moves first, what follows and what stays still; lead the eye to the one thing that matters and never move two things for attention at once.",
      type: "Keep text still long enough to read: at least a second for a short line; never move it so fast it blurs.",
      palette: "Keep the palette steady through the piece; let one accent colour arrive with the main movement.",
      motion: "Ease out for arrivals and ease in for exits; short durations for small changes, longer for big ones; one beat set once; a loop ends where it begins.",
    },
    signals: ["+motion", "+animat*", "+easing", "+bounce*", "+loop*", "+spin*", "+drift*", "+transition*", "+kinetic", "+sting*", "+reel*", "ease", "timing", "rhythm", "tempo", "fade*", "seconds", "video", "gif", "reveal*", "zoom*", "pan", "pulse*", "slow", "faster"],
  },
];

export const specialistById = (id: string | null | undefined): Specialist | undefined =>
  id ? specialists.find((s) => s.id === id) : undefined;

export const isSpecialistId = (id: unknown): id is SpecialistId => typeof id === "string" && (specialistIds as readonly string[]).includes(id);

/** What Auto picks when nothing in the words points anywhere. */
export const DEFAULT_SPECIALIST: SpecialistId = "illustration";

/** When two designers score the same, the one named first here wins: an action ("animate") beats a subject ("logo"). */
const TIE_ORDER: readonly SpecialistId[] = ["motion", "ui", "brand", "illustration"];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A signal as a pattern: whole words; a trailing * allows any ending. */
function pattern(cue: string): RegExp {
  const star = cue.endsWith("*");
  const body = escape(star ? cue.slice(0, -1) : cue).replace(/\s+/g, "\\s+");
  return new RegExp(`(?<![\\p{L}\\p{N}])${body}${star ? "[\\p{L}\\p{N}]*" : ""}(?![\\p{L}\\p{N}])`, "iu");
}
const compiled = new Map<string, RegExp>();
const matches = (text: string, cue: string) => {
  let re = compiled.get(cue);
  if (!re) compiled.set(cue, (re = pattern(cue)));
  return re.test(text);
};

/** The part of a project the choice looks at. */
export type ChooseProject = { brief?: string; art?: Partial<Pick<Art, "style">> };

export type SpecialistChoice = {
  id: SpecialistId;
  /** The signals behind the choice, in plain words. */
  because: string[];
};

/**
 * Which designer a request calls for. Each signal found in the request counts
 * twice and in the brief once; a strong signal counts three times as much. A
 * template named in the request (its name, from portfolio/templates.ts)
 * adds four to the designer mapped to it (specialistMap.ts). A style the
 * project has chosen adds one to a designer who favours it and already scored. With nothing to go on the answer is
 * Illustration. The same words always give the same answer.
 */
export function chooseSpecialist(brief: string, request: string, project?: ChooseProject): SpecialistChoice {
  const score = new Map<SpecialistId, number>();
  const because = new Map<SpecialistId, string[]>();
  const add = (id: SpecialistId, n: number, why: string) => {
    score.set(id, (score.get(id) ?? 0) + n);
    because.set(id, [...(because.get(id) ?? []), why]);
  };
  const asked = request.trim();
  const background = (project?.brief ?? brief).trim();
  const sources: [string, number][] = [];
  if (asked) sources.push([asked, 2]);
  if (background && background !== asked) sources.push([background, 1]);
  for (const s of specialists)
    for (const raw of s.signals) {
      const strong = raw.startsWith("+");
      const cue = strong ? raw.slice(1) : raw;
      for (const [text, weight] of sources) if (matches(text, cue)) add(s.id, weight * (strong ? 3 : 1), cue.replace(/\*$/, ""));
    }
  if (asked)
    for (const t of brandTemplates) if (matches(asked, t.name.toLowerCase())) add(designerForTemplate(t.id), 4, `${t.name.toLowerCase()} template`);
  const style = project?.art?.style;
  if (style) for (const id of specialistIds) if (score.has(id) && designerMap[id].styles.includes(style)) add(id, 1, `${style} style`);
  let id = DEFAULT_SPECIALIST;
  if (score.size) {
    let best = -1;
    for (const c of TIE_ORDER) {
      const n = score.get(c) ?? 0;
      if (n > best) {
        best = n;
        id = c;
      }
    }
  }
  return { id, because: [...new Set(because.get(id) ?? [])] };
}
