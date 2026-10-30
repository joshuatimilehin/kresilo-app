import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, X } from "@phosphor-icons/react";
import { Brand } from "../primitives";
import { PanelVisual } from "../portfolio/Visuals";
import type { StorySlide } from "../portfolio/story";
import { keepsOwnKeys, keyAction, step, swipeAction, tapAction } from "../storyNav";
import { useT } from "../locale";
import { dirOf } from "../i18n";

/**
 * A full-screen story. It moves three ways, all through the same rules in
 * storyNav: the keyboard (arrows, Home, End, Page keys, Escape closes), a
 * swipe or a tap on the picture, and visible Previous and Next buttons. The
 * progress bars are buttons too. The current slide is announced to screen
 * readers.
 */
export function StoryViewer({
  slides,
  closeTo,
  byline,
  viewHref,
}: {
  slides: readonly StorySlide[];
  closeTo: string;
  byline: ReactNode;
  viewHref: (slide: StorySlide) => string;
}) {
  const navigate = useNavigate();
  const { locale } = useT();
  const rtl = dirOf(locale) === "rtl";
  const [index, setIndex] = useState(0);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const slide = slides[index];

  const go = useCallback(
    (action: Parameters<typeof step>[2]) => {
      const next = step(index, slides.length, action);
      if (next.close) navigate(closeTo);
      else setIndex(next.index);
    },
    [index, slides.length, navigate, closeTo],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const own = keepsOwnKeys(e.target as HTMLElement | null);
      // Space moves forward unless a button or link has focus and wants it.
      const action = e.key === " " && !own ? (e.shiftKey ? "prev" : "next") : keyAction(e.key, rtl);
      if (!action) return;
      // Arrow keys on a focused button would scroll the page; here they move the story.
      if (own && (e.key === "Enter")) return;
      e.preventDefault();
      go(action);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, rtl]);

  const onDown = (e: PointerEvent<HTMLElement>) => {
    drag.current = { x: e.clientX, y: e.clientY };
    swiped.current = false;
  };
  const onUp = (e: PointerEvent<HTMLElement>) => {
    const start = drag.current;
    drag.current = null;
    if (!start) return;
    const action = swipeAction(e.clientX - start.x, e.clientY - start.y, rtl);
    if (action) {
      swiped.current = true;
      go(action);
      return;
    }
    // A tap: left third back, the rest forward.
    if (Math.abs(e.clientX - start.x) < 8 && Math.abs(e.clientY - start.y) < 8) {
      const rect = e.currentTarget.getBoundingClientRect();
      go(tapAction(e.clientX - rect.left, rect.width, rtl));
    }
  };

  if (!slide) return null;
  const last = index === slides.length - 1;
  return (
    <div className="sv-page" data-rtl={rtl || undefined}>
      <header className="sv-top">
        <Brand />
        <ol className="sv-progress" aria-label={`Story, ${slides.length} slides`}>
          {slides.map((s, i) => (
            <li key={s.id}>
              <button type="button" aria-label={`Slide ${i + 1} of ${slides.length}: ${s.title}`} aria-current={i === index ? "step" : undefined} className={i <= index ? "on" : ""} onClick={() => setIndex(i)} />
            </li>
          ))}
        </ol>
        <Link to={closeTo} className="icon-button" aria-label="Close story (Escape)">
          <X size={26} />
        </Link>
      </header>
      <main className="sv-stage">
        <div
          className="sv-visual"
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${slides.length}`}
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerCancel={() => (drag.current = null)}
        >
          <PanelVisual key={slide.id} project={slide.project} panel={slide.panel} />
        </div>
        <div className="sv-caption" key={slide.id} aria-live="polite">
          <span className="sv-byline">{byline}</span>
          <span className="eyebrow">{slide.label.toUpperCase()}</span>
          <h1>{slide.title}</h1>
          <p>{slide.text}</p>
          <div className="sv-actions">
            <Link className="pill acid" to={viewHref(slide)}>
              View project
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="sv-nav">
          <button type="button" className="icon-button" aria-label="Previous slide" disabled={index === 0} onClick={() => go("prev")}>
            <ArrowLeft size={26} />
          </button>
          <span className="sv-count" aria-hidden="true">{index + 1} / {slides.length}</span>
          <button type="button" className="icon-button" aria-label={last ? "Last slide" : "Next slide"} disabled={last} onClick={() => go("next")}>
            <ArrowRight size={26} />
          </button>
        </div>
      </main>
    </div>
  );
}
