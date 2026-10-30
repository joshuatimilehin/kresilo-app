import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { CheckCircle, ChatCircleDots, Check, ImageSquare, Lightbulb, MapPinPlus, PaperPlaneRight, Trash, X, XCircle } from "@phosphor-icons/react";
import { useCreative } from "./context";
import { useT } from "./locale";
import { checkIdea, IDEA_MAX, pictureUrl, spotOf, type Idea, type IdeaList } from "./ideaCards";
import "./ideas.css";

const STATE_ICON = { open: Lightbulb, accepted: CheckCircle, declined: XCircle } as const;

/** The icon button that turns pinning on for a picture. */
export function IdeaPinButton({ on, onClick, className = "" }: { on: boolean; onClick: () => void; className?: string }) {
  const { t } = useT();
  return (
    <button type="button" className={`idea-toggle ${className}`} aria-pressed={on} title={t("ideas.pin")} aria-label={t("ideas.pin")} onClick={onClick}>
      <MapPinPlus size={22} weight={on ? "fill" : "regular"} />
    </button>
  );
}

/** An idea's card: who, what, its picture, the host's reply, and what the host or its author can do with it. */
function IdeaBody({ idea, host, onChange }: { idea: Idea; host: boolean; onChange: () => void }) {
  const { run } = useCreative();
  const { t, date } = useT();
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const Icon = STATE_ICON[idea.state];
  async function answer(decision: "accept" | "decline" | "reply") {
    setBusy(true);
    const r = await run("idea.answer", { id: idea.id, decision, ...(decision === "reply" ? { reply } : {}) });
    setBusy(false);
    if (!r.ok) return;
    setReply("");
    setReplying(false);
    onChange();
  }
  async function remove() {
    setBusy(true);
    const r = await run("idea.remove", { id: idea.id });
    setBusy(false);
    if (r.ok) onChange();
  }
  return (
    <article className="idea-body" data-state={idea.state}>
      <header>
        <i aria-hidden="true">{idea.author.trim().charAt(0).toUpperCase() || "?"}</i>
        <strong>{idea.author}</strong>
        <time dateTime={idea.at}>{date(idea.at)}</time>
        <span className="idea-state" title={t(`ideas.${idea.state}`)} role="img" aria-label={t(`ideas.${idea.state}`)}>
          <Icon size={20} weight={idea.state === "open" ? "regular" : "fill"} />
        </span>
      </header>
      <p>{idea.text}</p>
      {idea.picture && <img src={pictureUrl(idea.picture)} alt="" loading="lazy" />}
      {idea.reply && (
        <p className="idea-reply">
          <ChatCircleDots size={16} aria-hidden="true" />
          {idea.reply}
        </p>
      )}
      <footer>
        {host && idea.state !== "accepted" && (
          <button type="button" title={t("ideas.accept")} aria-label={t("ideas.accept")} disabled={busy} onClick={() => void answer("accept")}>
            <Check size={20} weight="bold" />
          </button>
        )}
        {host && idea.state !== "declined" && (
          <button type="button" title={t("ideas.decline")} aria-label={t("ideas.decline")} disabled={busy} onClick={() => void answer("decline")}>
            <X size={20} weight="bold" />
          </button>
        )}
        {host && (
          <button type="button" title={t("ideas.reply")} aria-label={t("ideas.reply")} aria-pressed={replying} onClick={() => setReplying((v) => !v)}>
            <ChatCircleDots size={20} />
          </button>
        )}
        {(host || idea.mine) && (
          <button type="button" title={t("ideas.remove")} aria-label={t("ideas.remove")} disabled={busy} onClick={() => void remove()}>
            <Trash size={20} />
          </button>
        )}
      </footer>
      {host && replying && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (reply.trim()) void answer("reply");
          }}
        >
          <input aria-label={t("ideas.reply")} placeholder={t("ideas.reply")} value={reply} maxLength={IDEA_MAX} onChange={(e) => setReply(e.target.value)} autoFocus />
          <button type="submit" title={t("ideas.send")} aria-label={t("ideas.send")} disabled={busy || !reply.trim()}>
            <PaperPlaneRight size={20} weight="fill" />
          </button>
        </form>
      )}
    </article>
  );
}

/** A new idea: a short note and, if wanted, a small picture. */
function Composer({ target, panel, spot, onClose, onSent }: { target: string; panel: number; spot: { x: number; y: number }; onClose: () => void; onSent: () => void }) {
  const { run } = useCreative();
  const { t } = useT();
  const [text, setText] = useState("");
  const [picture, setPicture] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  async function attach(chosen: File | undefined) {
    if (!chosen || busy) return;
    setBusy(true);
    try {
      // Drawing the picture down is only needed here, so it loads then.
      const { fileToCover } = await import("./eventCover");
      const r = await run("event.cover", await fileToCover(chosen));
      if (r.ok && r.cover) setPicture(r.cover);
    } catch {
      toast.error(t("ideas.pictureFailed"));
    }
    setBusy(false);
  }
  async function send() {
    const check = checkIdea(text);
    if (!check.ok || busy) return;
    setBusy(true);
    const r = await run("idea.add", { target, panel, x: spot.x, y: spot.y, text: check.text, ...(picture ? { picture } : {}) });
    setBusy(false);
    if (r.ok) onSent();
  }
  return (
    <form
      className="idea-composer"
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
    >
      <textarea aria-label={t("ideas.add")} placeholder={t("ideas.add")} value={text} maxLength={IDEA_MAX} rows={3} autoFocus onChange={(e) => setText(e.target.value)} />
      {picture && (
        <span className="idea-attached">
          <img src={pictureUrl(picture)} alt="" />
          <button type="button" title={t("ideas.remove")} aria-label={t("ideas.remove")} onClick={() => setPicture(null)}>
            <X size={14} weight="bold" />
          </button>
        </span>
      )}
      <div className="idea-composer-bar">
        <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void attach(e.target.files?.[0]).then(() => (e.target.value = ""))} />
        <button type="button" title={t("ideas.picture")} aria-label={t("ideas.picture")} disabled={busy} onClick={() => file.current?.click()}>
          <ImageSquare size={22} />
        </button>
        <button type="button" title={t("ideas.close")} aria-label={t("ideas.close")} onClick={onClose}>
          <X size={22} />
        </button>
        <button type="submit" className="idea-send" title={t("ideas.send")} aria-label={t("ideas.send")} disabled={busy || !text.trim()}>
          <PaperPlaneRight size={22} weight="fill" />
        </button>
      </div>
    </form>
  );
}

/** A sheet that floats above everything, outside any zoomed or clipped picture. */
function Sheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return createPortal(
    <div className="idea-sheet-scrim" onClick={onClose}>
      <div className="idea-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/**
 * A picture people can pin ideas on. Its ideas show as small marks at their
 * spots; while `pinning`, a tap on the picture drops a new one and opens the
 * composer. Spots are fractions of the picture's own box, so they land on the
 * same place at any size.
 */
export function IdeaSpot({
  target,
  panel,
  list,
  pinning,
  onPinned,
  onChange,
  children,
}: {
  target: string;
  panel: number;
  list: IdeaList;
  pinning: boolean;
  onPinned: () => void;
  onChange: () => void;
  children: ReactNode;
}) {
  const { t } = useT();
  const box = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const here = list.ideas.filter((i) => i.panel === panel);
  const shown = here.find((i) => i.id === open);
  return (
    <div className="idea-spot" ref={box} data-pinning={pinning || undefined}>
      {children}
      <div className="idea-pins">
        {here.map((i) => {
          const Icon = STATE_ICON[i.state];
          return (
            <button
              key={i.id}
              type="button"
              className="idea-pin"
              data-state={i.state}
              style={{ left: `${i.x * 100}%`, top: `${i.y * 100}%` }}
              title={`${i.author}: ${i.text.slice(0, 60)}`}
              aria-label={`${i.author}: ${i.text.slice(0, 60)}`}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(i.id);
              }}
            >
              <Icon size={16} weight="fill" />
            </button>
          );
        })}
        {draft && <span className="idea-pin" data-state="draft" style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%` }} aria-hidden="true" />}
      </div>
      {pinning && (
        <button
          type="button"
          className="idea-capture"
          aria-label={t("ideas.pin")}
          onClick={(e) => {
            e.stopPropagation();
            const rect = box.current?.getBoundingClientRect();
            if (rect) setDraft(spotOf(e.clientX, e.clientY, rect));
          }}
        />
      )}
      {draft && (
        <Sheet onClose={() => setDraft(null)}>
          <Composer
            target={target}
            panel={panel}
            spot={draft}
            onClose={() => setDraft(null)}
            onSent={() => {
              setDraft(null);
              onPinned();
              onChange();
            }}
          />
        </Sheet>
      )}
      {shown && (
        <Sheet onClose={() => setOpen(null)}>
          <IdeaBody
            idea={shown}
            host={list.host}
            onChange={() => {
              setOpen(null);
              onChange();
            }}
          />
        </Sheet>
      )}
    </div>
  );
}

/** Every idea on a project, with the host's answers, and the people whose ideas were accepted. */
export function IdeaShelf({ list, onChange }: { list: IdeaList; onChange: () => void }) {
  const { t } = useT();
  if (!list.ideas.length && !list.credits.length) return null;
  return (
    <section className="idea-shelf" aria-label={t("ideas.title")}>
      <Lightbulb size={20} aria-hidden="true" />
      {list.credits.length > 0 && (
        <ul className="idea-credits">
          {list.credits.map((c) => (
            <li key={c.name} title={t("ideas.credit", { name: c.name })}>
              <i aria-hidden="true">{c.name.trim().charAt(0).toUpperCase() || "?"}</i>
              <span>{c.name}</span>
              {c.ideas > 1 && <b>{c.ideas}</b>}
            </li>
          ))}
        </ul>
      )}
      <div className="idea-list">
        {list.ideas.map((i) => (
          <IdeaBody key={i.id} idea={i} host={list.host} onChange={onChange} />
        ))}
      </div>
    </section>
  );
}
