import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowClockwise,
  CalendarBlank,
  ChatCircleDots,
  CheckCircle,
  ClockCounterClockwise,
  DoorOpen,
  Eye,
  EyeSlash,
  FilmStrip,
  GlobeHemisphereWest,
  HandWaving,
  Hourglass,
  PaperPlaneRight,
  PenNib,
  Stack,
  TextAa,
  Check,
  Trash,
  X,
  XCircle,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { memberRoles as memberRoleList, type MemberRole } from "./contracts";
import { creatorFor } from "./catalog";
import { boardCommentId } from "./commentTargets";
import { checkComment, COMMENT_MAX, type PostComments } from "./postComments";
import { boardEvent, isLive, lastActive, openBoardById, openBoards, type BoardActivity, type OpenBoard } from "./openBoards";
import { canJoinIn, isHostedBoardId, type BoardPlace, type HostedBoard } from "./boardRequests";
import { useBoardsState, useIdeas } from "./boardsData";
import { boardIdeaTarget, pictureUrl } from "./ideaCards";
import { IdeaPinButton, IdeaShelf, IdeaSpot } from "./IdeaPins";
import type { Art } from "./contracts";
import { projectById } from "./portfolio";
import { PanelVisual, ProjectCover } from "./portfolio/Visuals";
import { Avatar, BackButton, Empty, Header, SaveToggle } from "./primitives";
import { useCreative } from "./context";
import { useT } from "./locale";
import "./boards.css";

export const ROLE_ICON: Record<MemberRole, typeof PenNib> = {
  Design: PenNib,
  Type: TextAa,
  Motion: FilmStrip,
  Feedback: ChatCircleDots,
};
const DID_ICON: Record<BoardActivity["what"], typeof Stack> = {
  layer: Stack,
  comment: ChatCircleDots,
  version: ClockCounterClockwise,
  approve: CheckCircle,
};

/** "3 min ago", in the reader's language. */
export function useAgo() {
  const { locale } = useT();
  const fmt = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "narrow" });
  return (minutes: number) => (minutes < 60 ? fmt.format(-minutes, "minute") : fmt.format(-Math.round(minutes / 60), "hour"));
}

function Faces({ ids }: { ids: string[] }) {
  return (
    <span className="board-faces">
      {ids.slice(0, 4).map((id) => (
        <Avatar key={id} id={id} />
      ))}
      {ids.length > 4 && <span className="board-faces-more">+{ids.length - 4}</span>}
    </span>
  );
}

function Wanted({ roles }: { roles: MemberRole[] }) {
  const { t } = useT();
  return (
    <span className="board-wanted" aria-label={`${t("boards.wanted")}: ${roles.map((r) => t(`boards.role.${r}`)).join(", ")}`}>
      {roles.map((r) => {
        const I = ROLE_ICON[r];
        return (
          <i key={r} title={t(`boards.role.${r}`)}>
            <I size={15} />
          </i>
        );
      })}
    </span>
  );
}

/** Live while its jam runs; otherwise when someone last worked on it. */
function LiveBadge({ board }: { board: OpenBoard }) {
  const { t } = useT();
  const ago = useAgo();
  const live = isLive(board);
  return (
    <span className="board-live" data-live={live || undefined}>
      <i aria-hidden="true" />
      {live ? t("boards.live") : ago(lastActive(board))}
    </span>
  );
}

/** An open board as a card: its picture, who is on it, and the roles it wants. */
export function OpenBoardCard({ board }: { board: OpenBoard }) {
  const project = projectById(board.projectId);
  return (
    <article className="board-card">
      <Link to={`/boards/${board.id}`} className="board-card-media">
        {project && <ProjectCover project={project} small />}
        <LiveBadge board={board} />
      </Link>
      <div className="board-card-row">
        <Link to={`/boards/${board.id}`}>
          <strong>{board.title}</strong>
        </Link>
        <Wanted roles={board.wanted} />
      </div>
      <div className="board-card-row">
        <Faces ids={board.members} />
      </div>
    </article>
  );
}

/** A board a person hosts, as a card: the picture they chose, the roles it wants and who is on it. */
export function HostedBoardCard({ board }: { board: HostedBoard }) {
  return (
    <article className="board-card">
      <Link to={`/boards/${board.id}`} className="board-card-media">
        <img src={pictureUrl(board.doc.cover)} alt="" loading="lazy" />
      </Link>
      <div className="board-card-row">
        <Link to={`/boards/${board.id}`}>
          <strong>{board.doc.title}</strong>
        </Link>
        <Wanted roles={board.doc.wanted} />
      </div>
      <div className="board-card-row">
        <Initials names={[board.hostName, ...board.members]} />
      </div>
    </article>
  );
}

/** People without a portrait, as initials. */
function Initials({ names }: { names: string[] }) {
  return (
    <span className="board-faces">
      {names.slice(0, 4).map((n, i) => (
        <span key={i} className="creator-avatar creator-initials" role="img" aria-label={n}>
          {n.trim().charAt(0).toUpperCase() || "?"}
        </span>
      ))}
      {names.length > 4 && <span className="board-faces-more">+{names.length - 4}</span>}
    </span>
  );
}

export function OpenBoardsGrid({ limit }: { limit?: number }) {
  const now = new Date();
  const { boards: hosted } = useBoardsState();
  // Live boards first, then the most recently worked on.
  const live = [...openBoards]
    .sort((a, b) => Number(isLive(b, now)) - Number(isLive(a, now)) || lastActive(a) - lastActive(b))
    .slice(0, limit);
  const people = hosted.slice(0, limit);
  return (
    <div className="board-grid">
      {people.map((b) => (
        <HostedBoardCard key={b.id} board={b} />
      ))}
      {live.slice(0, limit === undefined ? undefined : Math.max(0, limit - people.length)).map((b) => (
        <OpenBoardCard key={b.id} board={b} />
      ))}
    </div>
  );
}

/**
 * Your place on one board, from the server: none, asked, in or declined.
 * Asking writes a real request; a curated board's host is fictional, so it
 * stays "asked" there, and a hosted board's host answers from their own page.
 */
function useBoardPlace(id: string, hostName: string) {
  const { run } = useCreative();
  const { t } = useT();
  const { placeOn, refresh, ready } = useBoardsState();
  const place = placeOn(id);
  const [busy, setBusy] = useState(false);
  // When the host lets you in while you are on the page, say so once.
  const seen = useRef<BoardPlace | null>(null);
  useEffect(() => {
    if (!ready) return;
    if (seen.current === "asked" && place === "in") toast.success(t("boards.letIn", { name: hostName }));
    seen.current = place;
  }, [place, ready, hostName, t]);
  async function ask() {
    setBusy(true);
    const r = await run("board.ask", { id });
    if (r.ok) await refresh();
    setBusy(false);
  }
  return { place, ask, busy, ready, refresh };
}

/** Where you stand on a board, as one control: ask, waiting, in, or declined with a way to ask again. */
function PlaceControl({ place, onAsk, busy, mine = false }: { place: BoardPlace; onAsk: () => void; busy: boolean; mine?: boolean }) {
  const { t } = useT();
  if (mine || place === "in")
    return (
      <span className="pill outline board-joined">
        <Check size={18} weight="bold" />
        {t("boards.joined")}
      </span>
    );
  if (place === "asked")
    return (
      <span className="pill outline board-joined" role="status">
        <Hourglass size={18} />
        {t("boards.asked")}
      </span>
    );
  if (place === "declined")
    return (
      <span className="board-state-pills">
        <span className="pill outline board-joined" role="status">
          <XCircle size={18} />
          {t("boards.declined")}
        </span>
        <button type="button" className="icon-button" title={t("boards.askAgain")} aria-label={t("boards.askAgain")} disabled={busy} onClick={onAsk}>
          <ArrowClockwise size={20} />
        </button>
      </span>
    );
  return (
    <button type="button" className="pill acid" onClick={onAsk} disabled={busy} aria-busy={busy}>
      <HandWaving size={18} />
      {t("boards.ask")}
    </button>
  );
}

/** People waiting at the door of the boards you host: let them in or decline. Shows nothing when no one waits. */
export function BoardRequests({ board }: { board?: string }) {
  const { run } = useCreative();
  const { t } = useT();
  const { inbox, refresh } = useBoardsState();
  const [busy, setBusy] = useState("");
  const waiting = inbox.filter((i) => !board || i.board === board);
  if (!waiting.length) return null;
  async function answer(item: (typeof waiting)[number], accept: boolean) {
    setBusy(`${item.board}:${item.person}`);
    const r = await run("board.answer", { id: item.board, personId: item.person, accept });
    setBusy("");
    if (r.ok) await refresh();
  }
  return (
    <section className="board-requests" aria-label={t("boards.requests")}>
      <HandWaving size={20} aria-hidden="true" />
      <ul>
        {waiting.map((i) => (
          <li key={`${i.board}:${i.person}`}>
            <i aria-hidden="true">{i.name.trim().charAt(0).toUpperCase() || "?"}</i>
            <span>
              <strong>{i.name}</strong>
              {!board && <small>{i.title}</small>}
            </span>
            <button type="button" title={t("boards.accept")} aria-label={t("boards.accept")} disabled={busy === `${i.board}:${i.person}`} onClick={() => void answer(i, true)}>
              <Check size={18} weight="bold" />
            </button>
            <button type="button" title={t("boards.decline")} aria-label={t("boards.decline")} disabled={busy === `${i.board}:${i.person}`} onClick={() => void answer(i, false)}>
              <X size={18} weight="bold" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * On a project's team page: open a board on it so people can ask to join and
 * pin ideas. The roles it wants and whether ideas show to everyone are icon
 * choices; the board's picture is the project as it is now.
 */
export function OpenBoardControl({ projectId, art }: { projectId: string; art: Art }) {
  const { run } = useCreative();
  const { t } = useT();
  const { boards, refresh } = useBoardsState();
  const board = boards.find((b) => b.project === projectId);
  const [wanted, setWanted] = useState<MemberRole[]>(["Design"]);
  const [ideasPublic, setIdeasPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const ideasOn = board ? board.ideasPublic : ideasPublic;
  async function open() {
    setBusy(true);
    try {
      const { artToCover } = await import("./eventCover");
      const drawn = await artToCover(art);
      const cover = await run("event.cover", drawn);
      if (cover.ok && cover.cover) {
        const r = await run("board.open", { projectId, cover: cover.cover, wanted, ideasPublic });
        if (r.ok) await refresh();
      }
    } catch {
      toast.error(t("ideas.pictureFailed"));
    }
    setBusy(false);
  }
  async function setIdeas() {
    if (!board) return setIdeasPublic((v) => !v);
    setBusy(true);
    const r = await run("board.open", { projectId, cover: board.doc.cover, wanted: board.doc.wanted, ideasPublic: !board.ideasPublic });
    if (r.ok) await refresh();
    setBusy(false);
  }
  async function close() {
    if (!board) return;
    setBusy(true);
    const r = await run("board.close", { id: board.id });
    if (r.ok) await refresh();
    setBusy(false);
  }
  const ideasToggle = (
    <button type="button" aria-pressed={ideasOn} disabled={busy} title={t(ideasOn ? "boards.ideasShown" : "boards.ideasHidden")} aria-label={t(ideasOn ? "boards.ideasShown" : "boards.ideasHidden")} onClick={() => void setIdeas()}>
      {ideasOn ? <Eye size={20} /> : <EyeSlash size={20} />}
    </button>
  );
  if (board)
    return (
      <span className="board-open">
        <Link to={`/boards/${board.id}`} className="board-open-go" title={t("boards.openBoard")} aria-label={t("boards.openBoard")}>
          <GlobeHemisphereWest size={22} weight="fill" />
        </Link>
        {ideasToggle}
        <button type="button" disabled={busy} title={t("boards.closeBoard")} aria-label={t("boards.closeBoard")} onClick={() => void close()}>
          <X size={20} />
        </button>
      </span>
    );
  return (
    <span className="board-open">
      {memberRoleList.map((r) => {
        const I = ROLE_ICON[r];
        return (
          <button
            key={r}
            type="button"
            aria-pressed={wanted.includes(r)}
            title={t(`boards.role.${r}`)}
            aria-label={t(`boards.role.${r}`)}
            onClick={() => setWanted((cur) => (cur.includes(r) ? (cur.length > 1 ? cur.filter((x) => x !== r) : cur) : [...cur, r]))}
          >
            <I size={20} />
          </button>
        );
      })}
      {ideasToggle}
      <button type="button" className="board-open-go" disabled={busy} aria-busy={busy} title={t("boards.openBoard")} aria-label={t("boards.openBoard")} onClick={() => void open()}>
        <DoorOpen size={22} weight="fill" />
      </button>
    </span>
  );
}

/** The board's comments: the list, a remove icon on your own, and a one-line composer. */
function BoardComments({ boardId }: { boardId: string }) {
  const { run } = useCreative();
  const { date, t } = useT();
  const id = boardCommentId(boardId);
  const [data, setData] = useState<PostComments | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/work-comments/${id}`).then((x) => x.json());
      if (r.ok) setData(r);
    } catch {
      /* the list stays empty if it cannot be read */
    }
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);
  const comments = data?.comments ?? [];
  return (
    <section className="board-comments" aria-label={t("comments.title")}>
      <span className="board-comments-count">
        <ChatCircleDots size={20} aria-hidden="true" />
        {comments.length > 0 && <b>{comments.length}</b>}
      </span>
      {comments.length > 0 && (
        <ul>
          {comments.map((c) => (
            <li key={c.id}>
              <i aria-hidden="true">{c.author.trim().charAt(0).toUpperCase() || "?"}</i>
              <div>
                <strong>{c.author}</strong>
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
                    const r = await run("work.comment.remove", { workId: id, commentId: c.id });
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
          const r = await run("work.comment.add", { workId: id, text: check.text });
          setBusy(false);
          if (r.ok) {
            setText("");
            await load();
          }
        }}
      >
        <input aria-label={t("comments.add")} placeholder={t("comments.add")} value={text} maxLength={COMMENT_MAX} onChange={(e) => setText(e.target.value)} />
        <button type="submit" aria-label={t("comments.post")} title={t("comments.post")} disabled={busy || !text.trim()}>
          <PaperPlaneRight size={20} weight="fill" />
        </button>
      </form>
    </section>
  );
}

/** Who is on the board, what it wants, and the board's own people-icons shared by both kinds of board. */
function RolesWanted({ roles }: { roles: MemberRole[] }) {
  const { t } = useT();
  return (
    <div>
      <span className="eyebrow">{t("boards.wanted").toUpperCase()}</span>
      <ul className="open-board-roles">
        {roles.map((r) => {
          const I = ROLE_ICON[r];
          return (
            <li key={r}>
              <I size={20} />
              {t(`boards.role.${r}`)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** A board that is not there: closed, or never opened. */
function NoBoard() {
  const { t } = useT();
  return (
    <>
      <Header />
      <Empty title="This board is not open.">
        <Link to="/projects?view=open">{t("boards.open")}</Link>
      </Empty>
    </>
  );
}

/** One open board: its picture, team, the roles it wants and what just happened on it. Members also see the work and talk on it; anyone can pin an idea on it. */
export function OpenBoardPage() {
  const { id } = useParams();
  return isHostedBoardId(id ?? "") ? <HostedBoardPage id={id ?? ""} /> : <CuratedBoardPage id={id ?? ""} />;
}

function CuratedBoardPage({ id }: { id: string }) {
  const { t, date } = useT();
  const ago = useAgo();
  const board = openBoardById(id);
  const host = board ? creatorFor(board.hostId) : undefined;
  const place = useBoardPlace(id, host?.name ?? "");
  const target = boardIdeaTarget(id);
  const ideas = useIdeas(target, Boolean(board));
  const [pinning, setPinning] = useState(false);
  if (!board) return <NoBoard />;
  const project = projectById(board.projectId);
  const jam = boardEvent(board);
  const member = canJoinIn(place.place);
  const spot = (panel: number, child: ReactNode) => (
    <IdeaSpot target={target} panel={panel} list={ideas.list} pinning={pinning} onPinned={() => setPinning(false)} onChange={() => void ideas.refresh()}>
      {child}
    </IdeaSpot>
  );
  return (
    <>
      <Header />
      <main className="open-board">
        <nav className="open-board-bar">
          <BackButton fallback="/projects?view=open" />
          <LiveBadge board={board} />
          {jam && !isLive(board) && (
            <Link to={`/events/${jam.id}`} className="board-jam" title={jam.title}>
              <CalendarBlank size={16} aria-hidden="true" />
              {date(jam.startsAt)}
            </Link>
          )}
          <IdeaPinButton on={pinning} onClick={() => setPinning((v) => !v)} />
          <SaveToggle item={`board:${board.id}`} label={board.title} />
        </nav>
        <div className="open-board-media">{project && spot(0, <ProjectCover project={project} />)}</div>
        <header className="open-board-head">
          <div>
            <h1>{board.title}</h1>
            {host && (
              <Link to={`/people/${host.id}`} className="open-board-host">
                <Avatar id={host.id} />
                <span>{host.name}</span>
              </Link>
            )}
          </div>
          <PlaceControl place={place.place} onAsk={() => void place.ask()} busy={place.busy} />
        </header>
        {member && project && (
          <section className="board-work" aria-label={t("boards.work")}>
            {project.panels.slice(0, 4).map((panel, i) => (
              <figure key={i}>{spot(i + 1, <PanelVisual project={project} panel={panel} />)}</figure>
            ))}
          </section>
        )}
        {member && <BoardComments boardId={board.id} />}
        <IdeaShelf list={ideas.list} onChange={() => void ideas.refresh()} />
        <section className="open-board-facts">
          <RolesWanted roles={board.wanted} />
          <div>
            <span className="eyebrow">{t("boards.members").toUpperCase()}</span>
            <Faces ids={board.members} />
          </div>
          <div>
            <span className="eyebrow">{t("boards.activity").toUpperCase()}</span>
            <ol className="open-board-activity">
              {board.activity.map((a, i) => {
                const I = DID_ICON[a.what];
                return (
                  <li key={i}>
                    <Avatar id={a.who} />
                    <I size={16} aria-hidden="true" />
                    <span>
                      {creatorFor(a.who)?.name} {t(`boards.did.${a.what}`)}
                    </span>
                    <time>{ago(a.minutesAgo)}</time>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      </main>
    </>
  );
}

/** A board a person hosts: the host answers requests on it and ideas pinned on it; the people let in talk on it. */
function HostedBoardPage({ id }: { id: string }) {
  const { run } = useCreative();
  const { t } = useT();
  const state = useBoardsState();
  const board = state.boards.find((b) => b.id === id);
  const place = useBoardPlace(id, board?.hostName ?? "");
  const ideas = useIdeas(id, Boolean(board));
  const [pinning, setPinning] = useState(false);
  if (!state.ready) return <><Header /><main className="open-board"><span className="spinner" role="status" aria-label="Loading" /></main></>;
  if (!board) return <NoBoard />;
  const member = canJoinIn(board.place, board.mine);
  async function close() {
    const r = await run("board.close", { id });
    if (r.ok) await state.refresh();
  }
  return (
    <>
      <Header />
      <main className="open-board">
        <nav className="open-board-bar">
          <BackButton fallback="/projects?view=open" />
          {!board.mine && <IdeaPinButton on={pinning} onClick={() => setPinning((v) => !v)} />}
        </nav>
        <div className="hosted-board-media">
          <IdeaSpot target={id} panel={0} list={ideas.list} pinning={pinning} onPinned={() => setPinning(false)} onChange={() => void ideas.refresh()}>
            <img src={pictureUrl(board.doc.cover)} alt={board.doc.title} />
          </IdeaSpot>
        </div>
        <header className="open-board-head">
          <div>
            <h1>{board.doc.title}</h1>
            <span className="open-board-host">
              <Initials names={[board.hostName]} />
              <span>{board.hostName}</span>
            </span>
          </div>
          {board.mine ? (
            <button type="button" className="icon-button" title={t("boards.closeBoard")} aria-label={t("boards.closeBoard")} onClick={() => void close()}>
              <X size={20} />
            </button>
          ) : (
            <PlaceControl place={place.place} onAsk={() => void place.ask()} busy={place.busy} />
          )}
        </header>
        {board.mine && <BoardRequests board={id} />}
        {member && <BoardComments boardId={id} />}
        <IdeaShelf list={ideas.list} onChange={() => void ideas.refresh()} />
        <section className="open-board-facts">
          <RolesWanted roles={board.doc.wanted} />
          <div>
            <span className="eyebrow">{t("boards.members").toUpperCase()}</span>
            <Initials names={[board.hostName, ...board.members]} />
          </div>
        </section>
      </main>
    </>
  );
}
