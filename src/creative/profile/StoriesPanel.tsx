import { Link } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import type { StoryCover } from "../profile";
import { ProjectCover } from "../portfolio/Visuals";
import type { CaseStudy } from "../portfolio";

export type ProjectStoryCover = { id: string; title: string; byline: string; slideCount: number; project: CaseStudy };

/** Landscape cover cards that open the existing full-bleed story viewer. */
export function StoriesPanel({
  stories,
  projectStories = [],
  firstName,
}: {
  stories: readonly StoryCover[];
  projectStories?: readonly ProjectStoryCover[];
  firstName: string;
}) {
  if (!stories.length && !projectStories.length)
    return <p className="maker-empty">{firstName} has no stories yet.</p>;
  return (
    <ul className="maker-stories">
      {projectStories.map((s) => (
        <li key={s.id}>
          <Link className="maker-story-card" to={`/stories/${s.id}`}>
            <span className="maker-story-art" aria-hidden="true">
              <ProjectCover project={s.project} small />
            </span>
            <span className="maker-story-bars" aria-hidden="true">
              {Array.from({ length: s.slideCount }, (_, i) => (
                <i key={i} className={i === 0 ? "on" : ""} />
              ))}
            </span>
            <span className="maker-story-copy">
              <small>{s.byline}</small>
              <strong>{s.title}</strong>
              <span>
                {s.slideCount} slides · Open story
                <ArrowRight size={18} aria-hidden="true" />
              </span>
            </span>
          </Link>
        </li>
      ))}
      {projectStories.length === 0 && stories.map((s) => (
        <li key={s.id}>
          <Link className="maker-story-card" to={`/stories/${s.id}`}>
            <img src={s.image} alt="" loading="lazy" />
            <span className="maker-story-bars" aria-hidden="true">
              {Array.from({ length: s.slideCount }, (_, i) => (
                <i key={i} className={i === 0 ? "on" : ""} />
              ))}
            </span>
            <span className="maker-story-copy">
              <small>{s.byline}</small>
              <strong>{s.title}</strong>
              <span>
                {s.slideCount} slides · Open story
                <ArrowRight size={18} aria-hidden="true" />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
