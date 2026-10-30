import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChatCircle, PaperPlaneRight, Trash, X } from "@phosphor-icons/react";
import { useCreative } from "./context";
import { useT } from "./locale";
import { checkComment, COMMENT_MAX, type PostComments } from "./postComments";
import { creatorFor } from "./catalog";
import { commentSeedsFor } from "./workCommentSeeds";
import { Avatar, FollowToggle } from "./primitives";
import "./reel.css";

type ShownComment = PostComments["comments"][number] & { makerId?: string };

/** Other makers' words on a work or a case study, as comments. */
const seededComments = (targetId: string): ShownComment[] =>
  commentSeedsFor(targetId).map((c, i) => ({
    id: `seed-${targetId}-${i}`,
    author: creatorFor(c.by)?.name ?? c.by,
    makerId: c.by,
    text: c.text,
    at: new Date(Date.now() - c.daysAgo * 864e5).toISOString(),
    mine: false,
  }));

/** Stored comments plus the makers' words, for the count on a comments icon. */
export async function fetchCommentCount(targetId: string): Promise<number> {
  const seeds = commentSeedsFor(targetId).length;
  try {
    const r = await fetch(`/api/work-comments/${targetId}`).then((x) => x.json());
    return (r.ok ? r.comments.length : 0) + seeds;
  } catch {
    return seeds;
  }
}

/**
 * Comments on one work or case study (`case-<id>`): the list, a remove icon on
 * your own, and a one-line composer. Escape closes it.
 */
export function CommentsSheet({
  targetId,
  onClose,
  onCount,
}: {
  targetId: string;
  onClose: () => void;
  onCount: (id: string, n: number) => void;
}) {
  const { run } = useCreative();
  const { date, t } = useT();
  const [data, setData] = useState<PostComments | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const seeds = seededComments(targetId);
  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/work-comments/${targetId}`).then((x) => x.json());
      if (r.ok) {
        setData(r);
        onCount(targetId, r.comments.length + commentSeedsFor(targetId).length);
      }
    } catch {
      /* stored comments stay out if they cannot be read; makers' words still show */
    }
  }, [targetId, onCount]);
  const all: ShownComment[] = [...seeds, ...(data?.comments ?? [])].sort((a, b) => a.at.localeCompare(b.at));
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  return (
    <section className="reel-info reel-comments" aria-label="Comments">
      <header>
        <span>
          <ChatCircle size={22} />
          {all.length > 0 && <b>{all.length}</b>}
        </span>
        <button type="button" aria-label={t("common.close")} title={t("common.close")} onClick={onClose}>
          <X size={22} />
        </button>
      </header>
      {all.length > 0 && (
        <ul>
          {all.map((c) => (
            <li key={c.id}>
              {c.makerId ? <Avatar id={c.makerId} size="small" /> : <i aria-hidden="true">{c.author.trim().charAt(0).toUpperCase() || "?"}</i>}
              <div>
                <strong>{c.author}</strong>
                {c.makerId ? <FollowToggle makerId={c.makerId} name={c.author} /> : !c.mine && <FollowToggle personId={c.authorId} name={c.author} />}
                <time dateTime={c.at}>{date(c.at)}</time>
                <p>{c.text}</p>
              </div>
              {c.mine && (
                <button
                  type="button"
                  title={t("comments.remove")}
                  aria-label={t("comments.remove")}
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    const r = await run("work.comment.remove", { workId: targetId, commentId: c.id });
                    setBusy(false);
                    if (r.ok) await load();
                  }}
                >
                  <Trash size={18} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const check = checkComment(text);
          if (check.ok === false) return void toast.error(check.reason);
          setBusy(true);
          const r = await run("work.comment.add", { workId: targetId, text: check.text });
          setBusy(false);
          if (r.ok) {
            setText("");
            await load();
          }
        }}
      >
        <input aria-label={t("comments.add")} value={text} maxLength={COMMENT_MAX} onChange={(e) => setText(e.target.value)} />
        <button type="submit" aria-label={t("comments.post")} title={t("comments.post")} disabled={busy || !text.trim()}>
          <PaperPlaneRight size={20} weight="fill" />
        </button>
      </form>
    </section>
  );
}
