import { Link } from "react-router-dom";
import { Play } from "@phosphor-icons/react";
import { Artwork } from "../primitives";
import { afterLightArt, assets } from "../catalog";
import {
  lineageCaption,
  workLineage,
  type ProfileWork,
  type WorkLineage,
} from "../profile";

/** First work large, the rest in a grid. Lineage line only when it is known. */
export function PostsPanel({
  works,
  firstName,
  lineage = workLineage,
}: {
  works: readonly ProfileWork[];
  firstName: string;
  lineage?: Readonly<Record<string, WorkLineage>>;
}) {
  if (!works.length)
    return <p className="maker-empty">{firstName} has no posts yet.</p>;
  return (
    <ul className="maker-posts" data-count={Math.min(works.length, 3)}>
      {works.map((w, i) => {
        const caption = lineageCaption(lineage[w.id]);
        return (
          <li className={`maker-post ${i === 0 ? "lead" : ""}`} key={w.id}>
            <Link
              className="maker-post-media"
              to={`/work/${w.id}`}
              tabIndex={-1}
              aria-hidden="true"
            >
              {w.id === "after-light" ? (
                <Artwork art={{ ...afterLightArt, size: 22 }} />
              ) : (
                <img src={assets[w.asset]} alt="" loading="lazy" />
              )}
              {w.motionSrc && (
                <span className="maker-post-motion">
                  <Play size={12} weight="fill" /> Motion
                </span>
              )}
            </Link>
            <div className="maker-post-copy">
              <h3>
                <Link to={`/work/${w.id}`}>{w.title}</Link>
              </h3>
              <ul className="maker-tags" aria-label="Disciplines">
                {w.tags.slice(0, 4).map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
              {caption && <p className="maker-post-lineage">{caption}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
