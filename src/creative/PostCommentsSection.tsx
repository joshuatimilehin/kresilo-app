import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useCreative } from "./context";
import { useT } from "./locale";
import {
  canRemove,
  checkComment,
  commentsState,
  COMMENT_MAX,
  type PostComments as Data,
} from "./postComments";
import { FollowToggle } from "./primitives";
import type { Publication } from "./contracts";

/** Comments on a community post, when the maker opened them. */
export function PostComments({ publication, id }: { publication: Publication; id: string }) {
  const { run } = useCreative();
  const { t, date } = useT();
  const [data, setData] = useState<Data | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/post-comments/${id}`).then((x) => x.json());
      if (r.ok) setData(r);
    } catch {
      /* the section stays hidden if the list cannot be read */
    }
  }, [id]);
  useEffect(() => {
    if (publication.audience === "community") void load();
  }, [publication.audience, load]);
  if (!data) return null;
  const { state } = commentsState(publication.audience, data.open);
  if (state === "unavailable") return null;
  if (state === "closed" && !data.comments.length) return null;
  return (
    <section className="post-section post-comments" aria-labelledby="post-comments-h">
      <span className="eyebrow">{t("comments.title").toUpperCase()}</span>
      <h2 id="post-comments-h">{state === "open" ? t("comments.openTitle") : t("comments.title")}</h2>
      <p className="muted">{state === "open" ? t("comments.openNote") : t("comments.closedNote")}</p>
      <ul className="post-comment-list">
        {data.comments.map((c) => (
          <li key={c.id}>
            <strong>{c.author}</strong>
            {!c.mine && <FollowToggle personId={c.authorId} name={c.author} />}
            <time dateTime={c.at}>{date(c.at)}</time>
            <p>{c.text}</p>
            {canRemove(c, data.canModerate) && (
              <button
                className="text-button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  const r = await run("post.comment.remove", { publicationId: id, commentId: c.id });
                  setBusy(false);
                  if (r.ok) await load();
                }}
              >
                {t("comments.remove")}
              </button>
            )}
          </li>
        ))}
      </ul>
      {state === "open" && (
        <form
          className="post-comment-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const check = checkComment(text);
            if (check.ok === false) return void toast.error(check.reason);
            setBusy(true);
            const r = await run("post.comment.add", { publicationId: id, text: check.text });
            setBusy(false);
            if (r.ok) {
              setText("");
              await load();
            }
          }}
        >
          <label>
            {t("comments.add")}
            <textarea value={text} maxLength={COMMENT_MAX} rows={3} onChange={(e) => setText(e.target.value)} />
          </label>
          <button className="pill outline" type="submit" disabled={busy || !text.trim()}>
            {t("comments.post")}
          </button>
        </form>
      )}
    </section>
  );
}
