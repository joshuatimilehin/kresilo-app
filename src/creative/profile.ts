/**
 * Pure selection logic for the maker profile (`/people/:id`).
 * Everything the page decides (which tab is open, which works, stories and
 * shorts a maker has, counts and tile captions) lives here so it can be
 * tested without a browser. The React components stay thin.
 */
import type { AssetKey } from "./contracts";

export const PROFILE_TABS = ["projects", "assets", "posts", "stories", "shorts"] as const;
export type ProfileTab = (typeof PROFILE_TABS)[number];
export const DEFAULT_TAB: ProfileTab = "projects";

export const TAB_LABELS: Record<ProfileTab, string> = {
  projects: "Projects",
  assets: "Assets",
  posts: "Studies",
  stories: "Stories",
  shorts: "Shorts",
};

export type ProfileWork = {
  id: string;
  title: string;
  creatorId: string;
  asset: AssetKey;
  tags: string[];
  motionSrc?: string;
};

export type ProfilePerson = {
  id: string;
  name: string;
  location: string;
  portrait?: string;
};

function isTab(value: string | null | undefined): value is ProfileTab {
  return !!value && (PROFILE_TABS as readonly string[]).includes(value);
}

/** Which tab the URL asks for. Anything missing or unknown falls back to Posts. */
export function tabFromSearch(
  search: string | URLSearchParams | null | undefined,
): ProfileTab {
  const params =
    typeof search === "string"
      ? new URLSearchParams(search)
      : (search ?? new URLSearchParams());
  const value = params.get("tab");
  return isTab(value) ? value : DEFAULT_TAB;
}

/** The profile URL for a tab. Posts is the default, so it keeps the plain URL. */
export function tabHref(personId: string, tab: ProfileTab): string {
  const base = `/people/${encodeURIComponent(personId)}`;
  return tab === DEFAULT_TAB ? base : `${base}?tab=${tab}`;
}

/** Roving-focus keyboard model for the tab list: arrows wrap, Home/End jump. */
/** The tab an arrow, Home or End key moves to, among the tabs shown. */
export function nextTab(current: ProfileTab, key: string, tabs: readonly ProfileTab[] = PROFILE_TABS): ProfileTab | null {
  const index = tabs.indexOf(current);
  const last = tabs.length - 1;
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return tabs[index === last ? 0 : index + 1];
    case "ArrowLeft":
    case "ArrowUp":
      return tabs[index === 0 ? last : index - 1];
    case "Home":
      return tabs[0];
    case "End":
      return tabs[last];
    default:
      return null;
  }
}

export const tabId = (tab: ProfileTab) => `profile-tab-${tab}`;
export const panelId = (tab: ProfileTab) => `profile-panel-${tab}`;

export function makerWorks<W extends ProfileWork>(
  personId: string,
  all: readonly W[],
): W[] {
  return all.filter((w) => w.creatorId === personId);
}

/** Only works that have a motion loop can appear as a short. */
export function makerShorts<W extends ProfileWork>(
  personId: string,
  all: readonly W[],
): (W & { motionSrc: string })[] {
  return makerWorks(personId, all).filter(
    (w): w is W & { motionSrc: string } => !!w.motionSrc,
  );
}

export type StoryCover = {
  /** The story route is `/stories/:id` and is keyed by the maker. */
  id: string;
  title: string;
  byline: string;
  image: string;
  slideCount: number;
};

/** The story viewer opens on the maker's process-desk photo when one exists. */
const PROCESS_DESK = "/assets/kresilo/process-desk.webp";
const PROCESS_DESK_MAKER = "ayo-bello";
export const STORY_SLIDE_COUNT = 3;

/**
 * Today every maker has one process story, built from their first work.
 * A maker with no works has no story: the viewer needs at least one work.
 * `assetUrl` maps a work's asset key to its image URL.
 */
export function makerStories(
  person: Pick<ProfilePerson, "id" | "name">,
  own: readonly ProfileWork[],
  assetUrl: (asset: AssetKey) => string,
): StoryCover[] {
  const first = own[0];
  if (!first) return [];
  return [
    {
      id: person.id,
      title: "Behind the Reference",
      byline: `${person.name} · Process story`,
      image:
        person.id === PROCESS_DESK_MAKER ? PROCESS_DESK : assetUrl(first.asset),
      slideCount: STORY_SLIDE_COUNT,
    },
  ];
}

export type TabCounts = Record<ProfileTab, number>;

export function tabCounts(
  posts: readonly unknown[],
  stories: readonly unknown[],
  shorts: readonly unknown[],
  projects: readonly unknown[] = [],
  assets: readonly unknown[] = [],
): TabCounts {
  return {
    projects: projects.length,
    assets: assets.length,
    posts: posts.length,
    stories: stories.length,
    shorts: shorts.length,
  };
}

export function tabLabel(tab: ProfileTab, counts: TabCounts): string {
  return `${TAB_LABELS[tab]} ${counts[tab]}`;
}

export type WorkLineage = { references?: number; usedIn?: number };
/**
 * Lineage counts are only known once posts record their sources. Until then
 * this stays empty and tiles omit the line; numbers are never invented.
 */
export const workLineage: Readonly<Record<string, WorkLineage>> = {};

const count = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;
const known = (n: number | undefined): n is number =>
  typeof n === "number" && Number.isInteger(n) && n >= 0;

/** "Made from N references · Used in N posts", or null when nothing is known. */
export function lineageCaption(lineage?: WorkLineage): string | null {
  if (!lineage) return null;
  const parts: string[] = [];
  if (known(lineage.references))
    parts.push(
      `Made from ${count(lineage.references, "reference", "references")}`,
    );
  if (known(lineage.usedIn))
    parts.push(`Used in ${count(lineage.usedIn, "post", "posts")}`);
  return parts.length ? parts.join(" · ") : null;
}

/** Up to `limit` discipline tags, most common first, ties by first appearance. */
export function disciplines(own: readonly ProfileWork[], limit = 3): string[] {
  const seen = new Map<string, { n: number; order: number }>();
  own.forEach((w) =>
    w.tags.forEach((tag) => {
      const entry = seen.get(tag);
      if (entry) entry.n += 1;
      else seen.set(tag, { n: 1, order: seen.size });
    }),
  );
  return [...seen.entries()]
    .sort((a, b) => b[1].n - a[1].n || a[1].order - b[1].order)
    .slice(0, limit)
    .map(([tag]) => tag);
}

/** "Light · Colour · Photography" style line, capitalised for display. */
export function disciplineLine(own: readonly ProfileWork[]): string {
  return disciplines(own)
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(" · ");
}

/** First name(s) upright, last name italic. A single name is all upright. */
export function nameParts(name: string): { first: string; last: string } {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return { first: words[0] ?? "", last: "" };
  return { first: words.slice(0, -1).join(" "), last: words.at(-1) ?? "" };
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

/** Photographic portraits are raster images; the vector marks are not portraits. */
export function hasPortrait(portrait: string | undefined): boolean {
  return !!portrait && !/\.svg(\?|#|$)/i.test(portrait);
}

/** Hover and focus start a short only when motion is allowed. */
export function playsOnHover(reduceMotion: boolean): boolean {
  return !reduceMotion;
}
