import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, ChatCircle, ShareFat } from "@phosphor-icons/react";
import { useIdeas } from "./boardsData";
import { caseIdeaTarget } from "./ideaCards";
import { IdeaPinButton, IdeaSpot } from "./IdeaPins";
import { useT } from "./locale";
import { CommentsSheet, fetchCommentCount } from "./Comments";
import { caseCommentId } from "./commentTargets";
import { ShareSheet } from "./ShareSheet";
import { Avatar, FollowToggle, SaveToggle } from "./primitives";
import { ZoomStage } from "./WorkReel";
import { StoryTextCard } from "./StoryTextCard";
import { PanelVisual, ProjectCover } from "./portfolio/Visuals";
import { projectSlides, type StorySlide } from "./portfolio/story";
import { inWindow, reelProjects } from "./portfolio/feed";
import { artSrc } from "./portfolio/art";
import { caseKindLabel, caseStudies, projectById, projectsByMaker, type CaseStudy } from "./portfolio";
import { makerById } from "./makers";
import "./reel.css";

type Card = { kind: "cover" } | { kind: "story"; slide: StorySlide } | { kind: "next" };

/** A project's sideways row: its cover, then its story panel by panel, then where to go next. */
const cardsFor = (project: CaseStudy): Card[] => [
  { kind: "cover" },
  ...projectSlides(project).map((slide) => ({ kind: "story" as const, slide })),
  { kind: "next" },
];

/** The end of a project's row: the maker's other projects, then similar ones by other makers. */
function NextCard({ project }: { project: CaseStudy }) {
  const maker = makerById(project.makerId);
  const more = projectsByMaker(project.makerId).filter((p) => p.id !== project.id).slice(0, 4);
  const similar = caseStudies
    .filter((p) => p.makerId !== project.makerId && (p.kind === project.kind || p.themes.some((t) => project.themes.includes(t))))
    .sort((a, b) => Number(b.kind === project.kind) - Number(a.kind === project.kind))
    .slice(0, 4);
  const tile = (p: CaseStudy) => (
    <Link key={p.id} to={`/case/${p.id}`} className="reel-next-tile">
      <span className="reel-next-media">
        <ProjectCover project={p} small />
      </span>
      <span className="reel-next-kind">{caseKindLabel[p.kind]}</span>
      <b>{p.title}</b>
    </Link>
  );
  return (
    <div className="reel-next">
      <Link to={`/case/${project.id}/read`} className="reel-next-case">
        <span className="reel-next-kind">{caseKindLabel[project.kind]}</span>
        <b>{project.title}</b>
        <span>
          Read the whole project <ArrowUpRight size={16} />
        </span>
      </Link>
      {more.length > 0 && (
        <section>
          <h3>More from {maker?.name}</h3>
          <div className="reel-next-grid">{more.map(tile)}</div>
        </section>
      )}
      {similar.length > 0 && (
        <section>
          <h3>Similar projects</h3>
          <div className="reel-next-grid">{similar.map(tile)}</div>
        </section>
      )}
    </div>
  );
}

/** The slide you were on, kept for this visit so Back from the full page lands where you left. */
const SLIDE_KEY = "kresilo-reel-slide";
const readSlide = (id: string): number => {
  try {
    const v = JSON.parse(sessionStorage.getItem(SLIDE_KEY) ?? "null");
    return v && v.id === id && Number.isInteger(v.at) ? v.at : 0;
  } catch {
    return 0;
  }
};

function ProjectSlide({
  project,
  shown,
  onTap,
  onComments,
  count,
  opened,
  active,
}: {
  project: CaseStudy;
  opened?: boolean;
  /** The project in view: only it reads its ideas. */
  active?: boolean;
  shown: boolean;
  onTap: () => void;
  onComments: (id: string) => void;
  count: number;
}) {
  const { t } = useT();
  const cards = cardsFor(project);
  const [at, setAt] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [pinning, setPinning] = useState(false);
  const target = caseIdeaTarget(project.id);
  const ideas = useIdeas(target, Boolean(active));
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = row.current;
    if (!el) return;
    if (opened) {
      const back = readSlide(project.id);
      if (back > 0) el.scrollTo({ left: back * el.clientWidth });
    }
    const sync = () => {
      const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
      setAt(i);
      try {
        sessionStorage.setItem(SLIDE_KEY, JSON.stringify({ id: project.id, at: i }));
      } catch {
        /* the slide is just not remembered */
      }
    };
    el.addEventListener("scroll", sync, { passive: true });
    return () => el.removeEventListener("scroll", sync);
  }, [project.id, opened]);
  const card = cards[Math.min(at, cards.length - 1)];
  const maker = makerById(project.makerId);
  return (
    <section className="reel-slide" data-project={project.id} aria-label={project.title}>
      <div className="reel-row" ref={row}>
        {cards.map((c, i) => (
          <div className="reel-card" key={c.kind === "story" ? c.slide.id : `${project.id}-${c.kind}-${i}`}>
            {c.kind === "next" ? (
              <NextCard project={project} />
            ) : (
              <ZoomStage onTap={onTap}>
                {c.kind === "story" && c.slide.textOnly ? (
                  <StoryTextCard slide={c.slide} />
                ) : (
                  <IdeaSpot target={target} panel={i} list={ideas.list} pinning={pinning && i === at} onPinned={() => setPinning(false)} onChange={() => void ideas.refresh()}>
                    {c.kind === "story" ? <PanelVisual project={c.slide.project} panel={c.slide.panel} /> : <ProjectCover project={project} />}
                  </IdeaSpot>
                )}
              </ZoomStage>
            )}
          </div>
        ))}
      </div>
      <div className="reel-overlay" data-shown={shown}>
        <div className="reel-dots" aria-hidden="true">
          {cards.map((c, i) => (
            <i key={i} data-on={i === at || undefined} data-story={c.kind !== "cover" || undefined} />
          ))}
        </div>
        {card.kind !== "next" && (
          <div className="reel-byline">
            <span className="reel-who">
              <Link to={`/people/${project.makerId}`} className="reel-maker">
                <Avatar id={project.makerId} />
                <b>{maker?.name}</b>
              </Link>
              <FollowToggle makerId={project.makerId} name={maker?.name ?? ""} />
            </span>
            {card.kind === "cover" && (
            <span className="reel-kind">
              {caseKindLabel[project.kind]} · {project.year}
            </span>
          )}
          <Link to={`/case/${project.id}/read`} className="reel-title-link">
              <strong>{card.kind === "story" ? card.slide.title : project.title}</strong>
            </Link>
            {card.kind === "story" && !card.slide.textOnly && (
              <p className="reel-story-text">
                <small>{card.slide.label}</small>
                {card.slide.text}
              </p>
            )}
            {card.kind === "cover" && <p className="reel-story-text">{project.tagline}</p>}
          </div>
        )}
        <nav className="reel-rail" aria-label="Actions">
          <button type="button" title={t("reel.comments")} aria-label={t("reel.comments")} onClick={() => onComments(project.id)}>
            <ChatCircle size={28} />
            {count > 0 && <i className="reel-count">{count}</i>}
          </button>
          <button type="button" title={t("share.share")} aria-label={t("share.share")} onClick={() => setSharing(true)}>
            <ShareFat size={28} />
          </button>
          {card.kind !== "next" && !(card.kind === "story" && card.slide.textOnly) && <IdeaPinButton on={pinning} onClick={() => setPinning((v) => !v)} />}
          <SaveToggle item={`case:${project.id}`} label={project.title} />
          <Link to={`/case/${project.id}/read`} className="reel-open" title="Read the whole project" aria-label="Read the whole project">
            <span className="reel-open-thumb" aria-hidden="true">
              {card.kind === "story" && !card.slide.textOnly ? <PanelVisual project={card.slide.project} panel={card.slide.panel} /> : <ProjectCover project={project} small />}
            </span>
            <i className="reel-open-badge" aria-hidden="true">
              <ArrowUpRight size={12} weight="bold" />
            </i>
          </Link>
        </nav>
      </div>
      <ShareSheet
        open={sharing}
        onClose={() => setSharing(false)}
        title={project.title}
        url={`${typeof location === "undefined" ? "" : location.origin}/case/${project.id}`}
        image={artSrc(`panel:${project.id}:0`)}
      />
    </section>
  );
}

/**
 * A project opened as a reel, like a work: the project you opened, then more
 * without end. Up and down moves to the next project in Home's order;
 * sideways moves through the project's story and on to more like it. The
 * controls hide when you stop touching and come back on a tap.
 */
export function ProjectReel({ startId }: { startId: string }) {
  const navigate = useNavigate();
  const { t } = useT();
  const [first] = useState(startId);
  const [stretches, setStretches] = useState(1);
  const [shown, setShown] = useState(true);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [activeId, setActiveId] = useState(first);
  const [near, setNear] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const active = useRef(first);
  const idle = useRef<number | undefined>(undefined);
  const list = reelProjects(first, stretches);
  const setCount = useCallback((id: string, n: number) => setCounts((c) => (c[id] === n ? c : { ...c, [id]: n })), []);

  const wake = useCallback(() => {
    setShown(true);
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => setShown(false), 4500);
  }, []);
  useEffect(() => {
    wake();
    return () => window.clearTimeout(idle.current);
  }, [wake]);

  // More projects as the end comes near.
  useEffect(() => {
    const el = end.current;
    if (!el || !scroller.current) return;
    const io = new IntersectionObserver(
      (e) => {
        if (e[0]?.isIntersecting) setStretches((n) => Math.min(n + 1, 200));
      },
      { root: scroller.current, rootMargin: "200% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Keep the address on the project in view, so a shared or reloaded link opens it.
  const ids = list.map((p) => p.id);
  const idsRef = useRef(ids);
  idsRef.current = ids;
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const sync = () => {
      const index = Math.round(root.scrollTop / Math.max(1, root.clientHeight));
      setNear((n) => (n === index ? n : index));
      const id = idsRef.current[index];
      if (id && id !== active.current) {
        active.current = id;
        setActiveId(id);
        window.history.replaceState(window.history.state, "", `/case/${id}`);
        wake();
      }
    };
    root.addEventListener("scroll", sync, { passive: true });
    return () => root.removeEventListener("scroll", sync);
  }, [wake]);

  // The comment count for the project in view.
  useEffect(() => {
    if (counts[activeId] !== undefined) return;
    let live = true;
    void fetchCommentCount(caseCommentId(activeId)).then((n) => {
      if (live) setCount(activeId, n);
    });
    return () => {
      live = false;
    };
  }, [activeId, counts, setCount]);

  function back() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate("/");
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const root = scroller.current;
      if (!root || commentsFor || document.querySelector('[role="dialog"][data-state="open"]')) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        root.scrollBy({ top: (e.key === "ArrowDown" ? 1 : -1) * root.clientHeight, behavior: "smooth" });
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const slides = [...root.querySelectorAll<HTMLElement>(".reel-slide")];
        const row = slides[Math.round(root.scrollTop / root.clientHeight)]?.querySelector<HTMLElement>(".reel-row");
        row?.scrollBy({ left: (e.key === "ArrowRight" ? 1 : -1) * row.clientWidth, behavior: "smooth" });
      } else if (e.key === "Escape") back();
      else return;
      wake();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  return (
    <div
      className="reel"
      onPointerMove={(e) => {
        if (e.pointerType === "mouse") wake();
      }}
      onClickCapture={(e) => {
        if ((e.target as HTMLElement).closest("button, a")) wake();
      }}
    >
      <div className="reel-top" data-shown={shown}>
        <button type="button" className="reel-icon" aria-label={t("common.back")} title={t("common.back")} onClick={back}>
          <ArrowLeft size={24} />
        </button>
      </div>
      <div className="reel-scroller" ref={scroller}>
        {list.map((p, i) =>
          !inWindow(i, near) ? (
            <section key={`${i}-${p.id}`} className="reel-slide" data-project={p.id} aria-hidden="true" />
          ) : (
          <ProjectSlide
            key={`${i}-${p.id}`}
            project={p}
            shown={shown}
            onTap={() => (shown ? setShown(false) : wake())}
            onComments={setCommentsFor}
            count={counts[p.id] ?? 0}
            opened={i === 0}
            active={p.id === activeId}
          />
          ),
        )}
        <div ref={end} className="reel-end" aria-hidden="true" />
      </div>
      {commentsFor && <CommentsSheet targetId={caseCommentId(commentsFor)} onClose={() => setCommentsFor(null)} onCount={(_, n) => setCount(commentsFor, n)} />}
    </div>
  );
}

const CasePage = lazy(() => import("./portfolio/Pages").then((m) => ({ default: m.CasePage })));

/** `/case/:id`: the project as a reel. An unknown project shows the page's own "not here" message. */
export function CaseReel() {
  const { id = "" } = useParams();
  return projectById(id) ? (
    <ProjectReel key={id} startId={id} />
  ) : (
    <Suspense fallback={null}>
      <CasePage />
    </Suspense>
  );
}
