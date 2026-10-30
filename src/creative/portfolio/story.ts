import { makerById } from "../makers";
import { caseKindLabel, projectsByMaker } from "./index";
import type { CasePanel, CaseStudy } from "./types";

/**
 * A maker's story: their latest projects told slide by slide, from the same
 * records the case study pages use, so nothing is written twice and no two
 * makers get the same caption.
 */
export type StorySlide = {
  id: string;
  project: CaseStudy;
  /** The panel to draw behind the caption. */
  panel: CasePanel;
  /** There was no picture left for this slide: show the words alone and do not draw `panel`. */
  textOnly?: boolean;
  label: string;
  title: string;
  text: string;
};

export const STORY_PROJECTS = 2;

const pick = (p: CaseStudy, kinds: CasePanel["kind"][], fallbackIndex: number): CasePanel =>
  p.panels.find((x) => kinds.includes(x.kind)) ?? p.panels[Math.min(fallbackIndex, p.panels.length - 1)];

export function makerStorySlides(makerId: string): StorySlide[] {
  const projects = projectsByMaker(makerId).slice(0, STORY_PROJECTS);
  return projects.flatMap((p) => [
    {
      id: `${p.id}-cover`,
      project: p,
      panel: p.panels[0],
      label: `${caseKindLabel[p.kind]} · ${p.year}`,
      title: p.title,
      text: p.tagline,
    },
    {
      id: `${p.id}-brief`,
      project: p,
      panel: pick(p, ["logo", "type", "palette"], 1),
      label: "The brief",
      title: p.client.name,
      text: p.story.brief,
    },
    {
      id: `${p.id}-idea`,
      project: p,
      panel: pick(p, ["mockup", "series", "device", "slides"], 2),
      label: "The idea",
      title: p.tagline,
      text: p.story.idea,
    },
    {
      id: `${p.id}-outcome`,
      project: p,
      panel: p.panels[p.panels.length - 1],
      label: "What came of it",
      title: p.title,
      text: p.story.outcome,
    },
  ]);
}

export const storyCoverTitle = (makerId: string) => {
  const m = makerById(makerId);
  const first = projectsByMaker(makerId)[0];
  return first ? `Behind ${first.title}` : `${m?.name ?? "Maker"}'s story`;
};

/**
 * One project told slide by slide, for the sideways row of a work: the brief,
 * the idea, every captioned panel, then what came of it. Every slide gets its
 * own picture and none repeats the cover (the first card of the row); a slide
 * left without a picture is marked `textOnly` and shown as words alone, never
 * as a picture seen before.
 */
export function projectSlides(p: CaseStudy): StorySlide[] {
  const kind = `${caseKindLabel[p.kind]} · ${p.year}`;
  const cover = p.panels[0];
  const rest = p.panels.slice(1);
  const spare = rest.filter((x) => !x.caption);
  const slide = (id: string, panel: CasePanel | undefined, label: string, title: string, text: string): StorySlide => ({
    id: `${p.id}-${id}`,
    project: p,
    panel: panel ?? cover,
    ...(panel ? {} : { textOnly: true }),
    label,
    title,
    text,
  });
  return [
    slide("brief", spare[0], "The brief", p.client.name, p.story.brief),
    slide("idea", spare[1], "The idea", p.tagline, p.story.idea),
    ...p.panels
      .map((panel, i) => ({ panel, i }))
      .filter(({ panel, i }) => i > 0 && panel.caption)
      .map(({ panel, i }) => slide(`panel-${i}`, panel, kind, p.title, panel.caption ?? "")),
    slide("outcome", spare[2], "What came of it", p.title, p.story.outcome),
  ];
}
