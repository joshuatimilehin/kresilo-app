import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  ChatCircle,
  Heart,
  Info,
  ShareFat,
  StackPlus,
  X,
} from "@phosphor-icons/react";
import { useT } from "./locale";
import { afterLightArt, assets, works } from "./catalog";
import { CommentsSheet, fetchCommentCount } from "./Comments";
import { ShareSheet } from "./ShareSheet";
import { Artwork, Avatar, Credit, FollowToggle, SaveToggle, WorkVisual } from "./primitives";
import { collectionsFor } from "./collections";
import { UsedIn } from "./UsedIn";
import { PanelVisual } from "./portfolio/Visuals";
import { StoryTextCard } from "./StoryTextCard";
import { makerStorySlides, projectSlides, type StorySlide } from "./portfolio/story";
import { caseKindLabel, caseStudies, projectById, projectsByMaker } from "./portfolio";
import { ProjectCover } from "./portfolio/Visuals";
import "./reel.css";

type Work = (typeof works)[number];
type Card = { kind: "work"; work: Work } | { kind: "story"; slide: StorySlide; work: Work } | { kind: "next"; work: Work };

/** A deterministic shuffle so each new stretch of the reel is ordered differently. */
function reorder<T>(items: T[], seed: number): T[] {
  const out = items.slice();
  let x = seed * 9301 + 49297;
  for (let i = out.length - 1; i > 0; i--) {
    x = (x * 9301 + 49297) % 233280;
    const j = Math.floor((x / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The sideways row for one work: the work, then the story of the project it
 * comes from, then what to see next. A work without a project falls back to
 * the maker's other works and story.
 */
function cardsFor(work: Work): Card[] {
  const project = projectById(work.projectId);
  if (project)
    return [
      { kind: "work", work },
      ...projectSlides(project).map((slide) => ({ kind: "story" as const, slide, work })),
      { kind: "next", work },
    ];
  const own = works.filter((w) => w.creatorId === work.creatorId && w.id !== work.id);
  return [
    { kind: "work", work },
    ...own.map((w) => ({ kind: "work" as const, work: w })),
    ...makerStorySlides(work.creatorId).map((slide) => ({ kind: "story" as const, slide, work })),
  ];
}

const LIKED = "kresilo-liked";
function readLiked(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LIKED) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * Pinch, double-tap or ctrl-scroll to zoom; drag to look around while zoomed.
 * A single tap is passed on so the reel can show or hide its controls.
 */
export function ZoomStage({ children, onTap }: { children: ReactNode; onTap: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const live = useRef(view);
  live.current = view;
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let pinch: { d: number; s: number } | null = null;
    let pan: { x: number; y: number; vx: number; vy: number } | null = null;
    let lastTap = 0;
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const clamp = (s: number) => Math.min(4, Math.max(1, s));
    const start = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinch = { d: dist(e.touches), s: live.current.s };
        pan = null;
      } else if (e.touches.length === 1 && live.current.s > 1) {
        pan = { x: e.touches[0].clientX, y: e.touches[0].clientY, vx: live.current.x, vy: live.current.y };
      }
    };
    const move = (e: TouchEvent) => {
      if (pinch && e.touches.length === 2) {
        e.preventDefault();
        const s = clamp((pinch.s * dist(e.touches)) / pinch.d);
        setView((v) => (s === 1 ? { s: 1, x: 0, y: 0 } : { ...v, s }));
      } else if (pan && e.touches.length === 1) {
        e.preventDefault();
        setView((v) => ({ ...v, x: pan!.vx + e.touches[0].clientX - pan!.x, y: pan!.vy + e.touches[0].clientY - pan!.y }));
      }
    };
    const end = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch = null;
      if (e.touches.length === 0) {
        pan = null;
        const now = Date.now();
        if (now - lastTap < 280) {
          setView((v) => (v.s > 1 ? { s: 1, x: 0, y: 0 } : { s: 2.5, x: 0, y: 0 }));
          lastTap = 0;
        } else lastTap = now;
      }
    };
    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setView((v) => {
        const s = clamp(v.s * Math.exp(-e.deltaY / 200));
        return s === 1 ? { s: 1, x: 0, y: 0 } : { ...v, s };
      });
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end, { passive: true });
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("wheel", wheel);
    };
  }, []);
  return (
    <div
      ref={box}
      className="reel-zoom"
      data-zoomed={view.s > 1 || undefined}
      onClick={onTap}
      onDoubleClick={() => setView((v) => (v.s > 1 ? { s: 1, x: 0, y: 0 } : { s: 2.5, x: 0, y: 0 }))}
    >
      <div className="reel-zoom-inner" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})` }}>
        {children}
      </div>
    </div>
  );
}

/** Where a work's project leads: the maker's other projects, then similar ones by other makers. */
function NextCard({ work }: { work: Work }) {
  const project = projectById(work.projectId);
  if (!project) return null;
  const firstWork = (projectId: string) => works.find((w) => w.projectId === projectId);
  const to = (projectId: string) => {
    const w = firstWork(projectId);
    return w ? `/work/${w.id}` : `/case/${projectId}`;
  };
  const more = projectsByMaker(work.creatorId).filter((p) => p.id !== project.id).slice(0, 4);
  const similar = caseStudies
    .filter((p) => p.makerId !== work.creatorId && (p.kind === project.kind || p.themes.some((t) => project.themes.includes(t))))
    .sort((a, b) => Number(b.kind === project.kind) - Number(a.kind === project.kind))
    .slice(0, 4);
  const tile = (p: (typeof caseStudies)[number]) => (
    <Link key={p.id} to={to(p.id)} className="reel-next-tile">
      <span className="reel-next-media">
        <ProjectCover project={p} small />
      </span>
      <span className="reel-next-kind">{caseKindLabel[p.kind]}</span>
      <b>{p.title}</b>
    </Link>
  );
  return (
    <div className="reel-next">
      <Link to={`/case/${project.id}`} className="reel-next-case">
        <span className="reel-next-kind">{caseKindLabel[project.kind]}</span>
        <b>{project.title}</b>
        <span>
          Read the whole project <ArrowUpRight size={16} />
        </span>
      </Link>
      {more.length > 0 && (
        <section>
          <h3>More from {work.creator}</h3>
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

function CardVisual({ card }: { card: Card }) {
  if (card.kind === "next") return null;
  if (card.kind === "story") return card.slide.textOnly ? <StoryTextCard slide={card.slide} /> : <PanelVisual project={card.slide.project} panel={card.slide.panel} />;
  return card.work.id === "after-light" ? <Artwork art={afterLightArt} /> : <WorkVisual work={card.work} />;
}

/**
 * One work in the reel. Swipe sideways through the maker's other works and
 * their story; the controls follow whichever card is showing.
 */
function ReelSlide({
  work,
  shown,
  onTap,
  onKeep,
  liked,
  onLike,
  onInfo,
  onComments,
  counts,
  rowRef,
}: {
  work: Work;
  onComments: (workId: string) => void;
  counts: Record<string, number>;
  shown: boolean;
  onTap: () => void;
  onKeep: (work: Work, studio: boolean) => void;
  liked: string[];
  onLike: (id: string) => void;
  onInfo: (card: Card) => void;
  rowRef: (el: HTMLDivElement | null) => void;
}) {
  const { t } = useT();
  const cards = cardsFor(work);
  const [at, setAt] = useState(0);
  const row = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const sync = () => setAt(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener("scroll", sync, { passive: true });
    return () => el.removeEventListener("scroll", sync);
  }, []);
  const card = cards[Math.min(at, cards.length - 1)];
  const current = card.kind === "work" ? card.work : work;
  const [sharing, setSharing] = useState(false);
  const share = () => setSharing(true);
  return (
    <section className="reel-slide" data-work={work.id} aria-label={work.title}>
      <div
        className="reel-row"
        ref={(el) => {
          row.current = el;
          rowRef(el);
        }}
      >
        {cards.map((c) => (
          <div className="reel-card" key={c.kind === "work" ? c.work.id : c.kind === "next" ? `${c.work.id}-next` : c.slide.id}>
            {c.kind === "next" ? (
              <NextCard work={c.work} />
            ) : (
              <ZoomStage onTap={onTap}>
                <CardVisual card={c} />
              </ZoomStage>
            )}
          </div>
        ))}
      </div>
      <div className="reel-overlay" data-shown={shown}>
        {cards.length > 1 && (
          <div className="reel-dots" aria-hidden="true">
            {cards.map((c, i) => (
              <i key={i} data-on={i === at || undefined} data-story={c.kind !== "work" || undefined} />
            ))}
          </div>
        )}
        <div className="reel-byline">
          <span className="reel-who">
            <Link to={`/people/${current.creatorId}`} className="reel-maker">
              <Avatar id={current.creatorId} />
              <b>{current.creator}</b>
            </Link>
            <FollowToggle makerId={current.creatorId} name={current.creator} />
          </span>
          <strong>{card.kind === "story" ? card.slide.title : card.kind === "next" ? "What’s next" : current.title}</strong>
          {card.kind === "story" && (
            <p className="reel-story-text">
              <small>{card.slide.label}</small>
              {card.slide.text}
            </p>
          )}
        </div>
        <nav className="reel-rail" aria-label="Actions">
          <button
            type="button"
            title={t("reel.like")}
            aria-label={t("reel.like")}
            aria-pressed={liked.includes(current.id)}
            onClick={() => onLike(current.id)}
          >
            <Heart size={28} weight={liked.includes(current.id) ? "fill" : "regular"} />
          </button>
          <button type="button" title={t("reel.comments")} aria-label={t("reel.comments")} onClick={() => onComments(current.id)}>
            <ChatCircle size={28} />
            {(counts[current.id] ?? 0) > 0 && <i className="reel-count">{counts[current.id]}</i>}
          </button>
          <button type="button" title={t("share.share")} aria-label={t("share.share")} onClick={share}>
            <ShareFat size={28} />
          </button>
          <SaveToggle item={`work:${current.id}`} label={current.title} />
          <button type="button" title={t("reel.keep")} aria-label={t("reel.keep")} onClick={() => onKeep(current, false)}>
            <StackPlus size={28} />
          </button>
          <button type="button" title={t("reel.useInStudio")} aria-label={t("reel.useInStudio")} onClick={() => onKeep(current, true)}>
            <ArrowUpRight size={28} />
          </button>
          <button type="button" title={t("reel.about")} aria-label={t("reel.about")} onClick={() => onInfo(card)}>
            <Info size={28} />
          </button>
        </nav>
      </div>
      <ShareSheet open={sharing} onClose={() => setSharing(false)} title={current.title} url={`${location.origin}/work/${current.id}`} image={assets[current.asset]} />
    </section>
  );
}

/**
 * The work page as a reel: the work you opened, then more, without end. Up
 * and down moves between works; sideways moves through the maker's other
 * works and story. Controls hide when you stop touching and come back on a tap.
 */
export function WorkReel({ startId, onKeep }: { startId: string; onKeep: (work: Work, studio: boolean) => void }) {
  const navigate = useNavigate();
  const { t } = useT();
  const [first] = useState(startId);
  const [pages, setPages] = useState(1);
  const [shown, setShown] = useState(true);
  const [info, setInfo] = useState<Card | null>(null);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [activeId, setActiveId] = useState(first);
  const setCount = useCallback((id: string, n: number) => setCounts((c) => (c[id] === n ? c : { ...c, [id]: n })), []);
  const [liked, setLiked] = useState(readLiked);
  const scroller = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const rows = useRef(new Map<string, HTMLDivElement>());
  const active = useRef(first);
  const idle = useRef<number | undefined>(undefined);

  const start = works.find((w) => w.id === first) ?? works[0];
  const rest = works.filter((w) => w.id !== start.id);
  const list = [start, ...rest, ...Array.from({ length: pages - 1 }, (_, p) => reorder(works, p + 1)).flat()];

  const wake = useCallback(() => {
    setShown(true);
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => setShown(false), 4500);
  }, []);
  useEffect(() => {
    wake();
    return () => window.clearTimeout(idle.current);
  }, [wake]);

  // More works as the end comes near.
  useEffect(() => {
    const el = end.current;
    if (!el || !scroller.current) return;
    const io = new IntersectionObserver((e) => {
      if (e[0]?.isIntersecting) setPages((p) => Math.min(p + 1, 200));
    }, { root: scroller.current, rootMargin: "200% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Keep the address on the work in view, so a shared or reloaded link opens it.
  const ids = list.map((w) => w.id);
  const idsRef = useRef(ids);
  idsRef.current = ids;
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const sync = () => {
      const id = idsRef.current[Math.round(root.scrollTop / Math.max(1, root.clientHeight))];
      if (id && id !== active.current) {
        active.current = id;
        setActiveId(id);
        window.history.replaceState(window.history.state, "", `/work/${id}`);
        wake();
      }
    };
    root.addEventListener("scroll", sync, { passive: true });
    return () => root.removeEventListener("scroll", sync);
  }, [wake]);

  // The comment count for the work in view.
  useEffect(() => {
    if (counts[activeId] !== undefined) return;
    let live = true;
    void fetchCommentCount(activeId).then((n) => {
      if (live) setCount(activeId, n);
    });
    return () => {
      live = false;
    };
  }, [activeId, counts, setCount]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const root = scroller.current;
      if (!root || info || commentsFor || document.querySelector('[role="dialog"][data-state="open"]')) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        root.scrollBy({ top: (e.key === "ArrowDown" ? 1 : -1) * root.clientHeight, behavior: "smooth" });
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const slides = [...root.querySelectorAll<HTMLElement>(".reel-slide")];
        const i = Math.round(root.scrollTop / root.clientHeight);
        const row = slides[i]?.querySelector<HTMLElement>(".reel-row");
        row?.scrollBy({ left: (e.key === "ArrowRight" ? 1 : -1) * row.clientWidth, behavior: "smooth" });
      } else if (e.key === "Escape") back();
      else return;
      wake();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  function back() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate("/");
  }
  const like = (id: string) => {
    const next = liked.includes(id) ? liked.filter((x) => x !== id) : [...liked, id];
    setLiked(next);
    try {
      localStorage.setItem(LIKED, JSON.stringify(next));
    } catch {
      /* likes stay for this visit */
    }
    wake();
  };
  const infoWork = info?.kind === "work" ? info.work : info?.work;

  return (
    <div
      className="reel"
      // A moving mouse brings the controls back; a tap toggles them (see onTap).
      onPointerMove={(e) => {
        if (e.pointerType === "mouse") wake();
      }}
      // Using a control keeps them up.
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
        {list.map((w, i) => (
          <ReelSlide
            key={`${i}-${w.id}`}
            work={w}
            shown={shown}
            onTap={() => (shown ? setShown(false) : wake())}
            onKeep={onKeep}
            liked={liked}
            onLike={like}
            onInfo={(c) => {
              setCommentsFor(null);
              setInfo(c);
            }}
            onComments={(workId) => {
              setInfo(null);
              setCommentsFor(workId);
            }}
            counts={counts}
            rowRef={(el) => {
              if (el) rows.current.set(`${i}`, el);
              else rows.current.delete(`${i}`);
            }}
          />
        ))}
        <div ref={end} className="reel-end" aria-hidden="true" />
      </div>
      {commentsFor && <CommentsSheet targetId={commentsFor} onClose={() => setCommentsFor(null)} onCount={setCount} />}
      {info && infoWork && (
        <section className="reel-info" aria-label="About">
          <button type="button" className="reel-info-close" aria-label={t("common.close")} title={t("common.close")} onClick={() => setInfo(null)}>
            <X size={22} />
          </button>
          {info.kind === "story" ? (
            <>
              <span className="eyebrow">{info.slide.label}</span>
              <h2>{info.slide.title}</h2>
              <p>{info.slide.text}</p>
              <Link className="pill outline" to={`/case/${info.slide.project.id}`}>
                {info.slide.project.title}
                <ArrowUpRight size={18} />
              </Link>
            </>
          ) : (
            <>
              <h2>{infoWork.title}</h2>
              <Credit id={infoWork.creatorId} />
              <p>{infoWork.description}</p>
              {collectionsFor(infoWork.id).length > 0 && (
                <p className="reel-collections">
                  {collectionsFor(infoWork.id).map((c) => (
                    <Link key={c.id} className="pf-pill" to={`/collections/${c.id}`}>
                      {c.title}
                    </Link>
                  ))}
                </p>
              )}
              <UsedIn workId={infoWork.id} />
            </>
          )}
        </section>
      )}
    </div>
  );
}
