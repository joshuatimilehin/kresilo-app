import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Pause, Play } from "@phosphor-icons/react";
import { ProjectCover } from "../portfolio/Visuals";
import type { CaseStudy } from "../portfolio";
import { useT } from "../locale";
import { dirOf } from "../i18n";
import { useCreative } from "../context";
import { assets } from "../catalog";
import { playsOnHover, type ProfileWork } from "../profile";

type Short = ProfileWork & { motionSrc: string };

/**
 * A reel of vertical motion cards: videos where a work has a loop, and a drawn
 * card for each motion project. It moves by keyboard (arrows, Home, End when the
 * reel has focus), by the Previous and Next buttons, and by swipe or trackpad
 * (it is a normal scrolling row that snaps card by card).
 */
export function ShortsPanel({
  shorts,
  motionProjects = [],
  firstName,
}: {
  shorts: readonly Short[];
  motionProjects?: readonly CaseStudy[];
  firstName: string;
}) {
  const { reduceMotion } = useCreative();
  const { locale } = useT();
  const rtl = dirOf(locale) === "rtl";
  const row = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const measure = useCallback(() => {
    const el = row.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth - 2;
    const pos = Math.abs(el.scrollLeft);
    setEdge({ start: pos <= 2, end: pos >= max });
  }, []);
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, shorts.length, motionProjects.length]);
  const move = (direction: 1 | -1) => {
    const el = row.current;
    if (!el) return;
    const card = el.querySelector("li")?.getBoundingClientRect().width ?? 270;
    el.scrollBy({ left: direction * (rtl ? -1 : 1) * (card + 22), behavior: reduceMotion ? "auto" : "smooth" });
  };
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "ArrowRight") move(1);
    else if (e.key === "ArrowLeft") move(-1);
    else if (e.key === "Home") row.current?.scrollTo({ left: 0 });
    else if (e.key === "End") row.current?.scrollTo({ left: rtl ? -99999 : 99999 });
    else return;
    e.preventDefault();
  };
  if (!shorts.length && !motionProjects.length)
    return <p className="maker-empty">{firstName} has no shorts yet.</p>;
  return (
    <div className="maker-reel" role="region" aria-label={`${firstName}'s shorts`} tabIndex={0} onKeyDown={onKey}>
      <ul className="maker-shorts" ref={row} onScroll={measure}>
        {shorts.map((s) => (
          <li key={s.id}>
            <ShortCard short={s} />
          </li>
        ))}
        {motionProjects.map((p) => (
          <li key={p.id}>
            <figure className="maker-short">
              <Link className="maker-short-frame maker-short-drawn" to={`/case/${p.id}`} aria-label={`Open ${p.title}, motion project`}>
                <ProjectCover project={p} small />
              </Link>
              <figcaption>
                <Link to={`/case/${p.id}`}>{p.title}</Link>
                <span>Motion project</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <div className="maker-reel-nav">
        <button type="button" className="icon-button" aria-label="Previous shorts" disabled={edge.start} onClick={() => move(-1)}>
          <ArrowLeft size={22} />
        </button>
        <button type="button" className="icon-button" aria-label="Next shorts" disabled={edge.end} onClick={() => move(1)}>
          <ArrowRight size={22} />
        </button>
      </div>
    </div>
  );
}

function ShortCard({ short }: { short: Short }) {
  const { reduceMotion } = useCreative();
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const play = () => {
    void video.current?.play().catch(() => setPlaying(false));
  };
  const toggle = () => {
    if (video.current?.paused) play();
    else video.current?.pause();
  };
  useEffect(() => {
    if (reduceMotion) video.current?.pause();
  }, [reduceMotion]);
  return (
    <figure
      className="maker-short"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse" && playsOnHover(reduceMotion)) play();
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") video.current?.pause();
      }}
    >
      <div className="maker-short-frame">
        <video
          ref={video}
          src={short.motionSrc}
          poster={assets[short.asset]}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={`${short.title}, original motion loop`}
          onClick={toggle}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
        <button
          type="button"
          className="maker-short-toggle"
          aria-label={`${playing ? "Pause" : "Play"} ${short.title}`}
          aria-pressed={playing}
          onClick={toggle}
        >
          {playing ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
        </button>
      </div>
      <figcaption>
        <Link to={`/work/${short.id}`}>{short.title}</Link>
        <span>Motion loop</span>
      </figcaption>
    </figure>
  );
}
