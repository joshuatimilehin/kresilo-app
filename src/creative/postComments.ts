import type { Publication } from "./contracts";

/**
 * Comments on a published post (issue #36). They are separate from the private
 * board comments: viewers of a community post write them, only when the maker
 * opened comments while publishing. The author removes their own; the maker
 * removes any on their post. Names come from the commenter's profile, never
 * from the text.
 */
export type PostComment = {
  id: string;
  author: string;
  text: string;
  at: string;
  /** True for the signed-in viewer's own comments. */
  mine: boolean;
  /** Who wrote it, when the server could say; a follow button needs it. */
  authorId?: string;
};
export type PostComments = {
  open: boolean;
  canModerate: boolean;
  comments: PostComment[];
};

export type CommentsState = "open" | "closed" | "unavailable";

/** Whether this post takes comments, and one sentence saying why not when it does not. */
export function commentsState(
  audience: Publication["audience"],
  open: boolean,
): { state: CommentsState; note: string } {
  if (audience !== "community")
    return { state: "unavailable", note: "Comments are only on community posts." };
  if (!open) return { state: "closed", note: "The maker has not opened comments on this post." };
  return { state: "open", note: "Comments are public. Be kind; the maker can remove any comment." };
}

export const COMMENT_MAX = 1000;

/** The text to send, or why it cannot be sent. */
export function checkComment(text: string): { ok: true; text: string } | { ok: false; reason: string } {
  const t = text.trim();
  if (!t) return { ok: false, reason: "Write something first." };
  if (t.length > COMMENT_MAX) return { ok: false, reason: `Keep it under ${COMMENT_MAX} characters.` };
  return { ok: true, text: t };
}

/** Who may remove a comment. */
export const canRemove = (c: PostComment, canModerate: boolean) => c.mine || canModerate;
