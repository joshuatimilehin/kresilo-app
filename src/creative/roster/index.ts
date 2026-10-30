import type { Maker } from "../makers";
import type { CaseStudy } from "../portfolio/types";
import { looks as coreLooks } from "./looks";
import * as eastAsia from "./east-asia";
import * as southWestAsia from "./south-west-asia";
import * as latamAfrica from "./latam-africa";
import * as practices from "./practices";

/**
 * Makers added by region (and four practices the roster was missing), each with their case studies, the art direction
 * their pictures are generated in, and a brief for their portrait. The first
 * eighteen makers and their case studies stay in makers.ts and projects.ts.
 */
const regions = [eastAsia, southWestAsia, latamAfrica, practices];

// Portraits come from the generated-image list (catalog.ts), so a maker shows
// initials until their portrait file exists rather than a missing picture.
export const rosterMakers: Maker[] = regions.flatMap((r) => r.makers.map(({ portrait: _unused, ...m }) => m));
export const rosterCaseStudies: CaseStudy[] = regions.flatMap((r) => r.caseStudies);
export const allLooks: Record<string, string> = Object.assign({}, coreLooks, ...regions.map((r) => r.looks));
export const portraitPrompts: Record<string, string> = Object.assign({}, ...regions.map((r) => r.portraitPrompts));
