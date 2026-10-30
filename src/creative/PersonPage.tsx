import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Artwork, Empty, FollowToggle, Header } from "./primitives";
import { FollowCounts, useFollowCounts } from "./FollowCounts";
import type { Publication } from "./contracts";
import "./follows.css";

/** A published post as a tile: the artwork, opening the post. */
export function PostTile({ post }: { post: Publication }) {
  const title = post.art.title.split("\n").join(" ");
  return (
    <article className="post-tile">
      <Link to={`/p/${post.id}`} className="work-image" aria-label={`Open ${title}`}>
        <Artwork art={post.art} />
      </Link>
      <div className="work-caption">
        <Link to={`/p/${post.id}`}>
          <strong>{title}</strong>
        </Link>
        <Link to={post.authorId ? `/people/${post.authorId}` : "#"}>
          <span>{post.creator}</span>
        </Link>
      </div>
    </article>
  );
}

/** A person who is not on the roster: their name, who follows them and whom they follow, and what they published. */
export function PersonPage({ id }: { id: string }) {
  const [person, setPerson] = useState<{ name: string; posts: Publication[] } | null | undefined>();
  const counts = useFollowCounts(id);
  useEffect(() => {
    let live = true;
    void fetch(`/api/person/${id}`)
      .then((r) => r.json())
      .then((r) => live && setPerson(r.ok ? { name: r.name, posts: r.posts } : null))
      .catch(() => live && setPerson(null));
    return () => {
      live = false;
    };
  }, [id]);
  if (person === null)
    return (
      <>
        <Header />
        <Empty title="This creator is not here.">
          <Link to="/">Back home</Link>
        </Empty>
      </>
    );
  return (
    <div className="person-page">
      <Header />
      <main>
        {person ? (
          <>
            <section className="person-head">
              <span className="person-initial" aria-hidden="true">
                {person.name.trim().charAt(0).toUpperCase() || "?"}
              </span>
              <h1>{person.name}</h1>
              <FollowToggle personId={id} name={person.name} />
              <FollowCounts counts={counts} showFollowing />
            </section>
            <div className="work-grid project-feed">
              {person.posts.map((post) => (
                <PostTile key={post.id} post={post} />
              ))}
            </div>
          </>
        ) : (
          <span className="spinner" role="status" aria-label="Loading" />
        )}
      </main>
    </div>
  );
}
