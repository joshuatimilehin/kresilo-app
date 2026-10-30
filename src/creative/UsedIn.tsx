import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usedIn, type UsedInEntry } from "./lineage";

/** Published community posts that credit this work, each linking back to the post. Hidden when there are none. */
export function UsedIn({ workId }: { workId: string }) {
  const [posts, setPosts] = useState<UsedInEntry[]>([]);
  useEffect(() => {
    let live = true;
    void fetch("/api/community")
      .then((r) => r.json())
      .then((r) => live && r.ok && setPosts(usedIn(r.publications, workId)))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [workId]);
  if (!posts.length) return null;
  return (
    <section className="used-in" aria-labelledby="used-in-h">
      <h2 id="used-in-h" className="eyebrow">USED IN</h2>
      <ul>
        {posts.map((p) => (
          <li key={p.id}>
            <Link to={`/p/${p.id}`}>{p.title}</Link> <small>by {p.creator}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
