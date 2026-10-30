import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { assets, works } from "./catalog";
import { collectionById, collectionWorks } from "./collections";
import { openBoardById } from "./openBoards";
import { OpenBoardCard } from "./Boards";
import { projectById } from "./portfolio";
import { ProjectCover } from "./portfolio/Visuals";
import { Artwork, WorkVisual } from "./primitives";
import type { Publication } from "./contracts";

/** One saved thing, resolved from its key ("work:id", "case:id" and so on); anything no longer listed is skipped. */
export type SavedItem =
  | { kind: "work"; work: (typeof works)[number] }
  | { kind: "board"; board: NonNullable<ReturnType<typeof openBoardById>> }
  | { kind: "case"; project: NonNullable<ReturnType<typeof projectById>> }
  | { kind: "post"; id: string }
  | { kind: "collection"; collection: NonNullable<ReturnType<typeof collectionById>> };

export function resolveSaved(keys: readonly string[]): SavedItem[] {
  return keys.flatMap((key): SavedItem[] => {
    const [kind, id] = key.split(":");
    if (kind === "work") {
      const work = works.find((w) => w.id === id);
      return work ? [{ kind: "work" as const, work }] : [];
    }
    if (kind === "board") {
      const board = openBoardById(id);
      return board ? [{ kind: "board" as const, board }] : [];
    }
    if (kind === "case") {
      const project = projectById(id);
      return project ? [{ kind: "case" as const, project }] : [];
    }
    if (kind === "post") return id ? [{ kind: "post" as const, id }] : [];
    const collection = collectionById(id);
    return collection ? [{ kind: "collection" as const, collection }] : [];
  });
}

/** A published post someone saved: its artwork and title, read fresh. A post taken down is not shown. */
function SavedPost({ id }: { id: string }) {
  const [post, setPost] = useState<Publication | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    void fetch(`/api/publication/${id}`)
      .then((r) => r.json())
      .then((r) => live && setPost(r.ok ? r.publication : null))
      .catch(() => live && setPost(null));
    return () => {
      live = false;
    };
  }, [id]);
  if (!post) return null;
  return (
    <Link to={`/p/${id}`} className="me-saved-post">
      <Artwork art={post.art} />
      <strong>{post.art.title.split("\n").join(" ")}</strong>
    </Link>
  );
}

/** Saved things as cards, the same on your profile and on a public moodboard. */
export function SavedItems({ items }: { items: readonly SavedItem[] }) {
  return (
    <div className="me-saved">
      {items.map((item) =>
        item.kind === "work" ? (
          <article key={`w-${item.work.id}`} className="me-saved-work">
            <WorkVisual work={item.work} linked />
            <strong>{item.work.title}</strong>
          </article>
        ) : item.kind === "board" ? (
          <OpenBoardCard key={`b-${item.board.id}`} board={item.board} />
        ) : item.kind === "case" ? (
          <Link key={`p-${item.project.id}`} to={`/case/${item.project.id}`} className="me-saved-case">
            <ProjectCover project={item.project} small />
            <strong>{item.project.title}</strong>
          </Link>
        ) : item.kind === "post" ? (
          <SavedPost key={`p-${item.id}`} id={item.id} />
        ) : (
          <Link key={`c-${item.collection.id}`} to={`/collections/${item.collection.id}`} className="me-saved-collection">
            <span className="me-saved-stack">
              {collectionWorks(item.collection)
                .slice(0, 4)
                .map((w) => (
                  <img key={w.id} src={assets[w.asset]} alt="" loading="lazy" />
                ))}
            </span>
            <strong>{item.collection.title}</strong>
          </Link>
        ),
      )}
    </div>
  );
}
