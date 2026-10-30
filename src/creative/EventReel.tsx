import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowSquareOut,
  ArrowUpRight,
  CalendarPlus,
  CirclesFour,
  Compass,
  Lock,
  ListBullets,
  MapPin,
  MegaphoneSimple,
  PencilSimple,
  Plus,
  ShareFat,
  SlidersHorizontal,
  Ticket,
  Users,
} from "@phosphor-icons/react";
import { useT } from "./locale";
import { ShareSheet } from "./ShareSheet";
import { Avatar } from "./primitives";
import { ZoomStage } from "./WorkReel";
import { countGoing, eventSlides, type EventSlide } from "./eventSchedule";
import {
  addToCalendar,
  ATTENDEES,
  EventCover,
  EventPrimary,
  FORMAT,
  FormatIcon,
  hostOf,
  joinLabel,
  useGoing,
  useWash,
  useWhen,
  type EventItem,
} from "./eventShared";
import type { MeetupFormat } from "./meetupList";
import "./reel.css";
import "./eventReel.css";

export type EventView = "discover" | "going" | "hosting";
export type EventFilter = "all" | MeetupFormat;

const VIEW_ICONS = [
  ["discover", Compass, "Discover"],
  ["going", Ticket, "Going"],
  ["hosting", MegaphoneSimple, "Hosting"],
] as const;
const FILTER_ICONS: [EventFilter, string][] = [
  ["all", "All"],
  ["in-person", FORMAT["in-person"]],
  ["online", FORMAT.online],
  ["hybrid", FORMAT.hybrid],
];

const mapsUrl = (m: EventItem) => `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${m.venue}, ${m.city}`)}`;

/** The icon tag for where an event happens; it stays on every slide. */
export function FormatTag({ f }: { f: MeetupFormat }) {
  return (
    <span className="ev-tag" data-format={f} title={FORMAT[f]}>
      <FormatIcon f={f} size={18} />
      {FORMAT[f]}
    </span>
  );
}

function SlideBody({ slide, m, count, joined, wash }: { slide: EventSlide; m: EventItem; count: number; joined: boolean; wash: string }) {
  const when = useWhen();
  const host = hostOf(m);
  const faces = m.hosted ? [] : ATTENDEES.filter((x) => x !== m.hostId).slice(0, Math.min(5, count));
  const room = joinLabel(m);
  if (slide === "when")
    return (
      <div className="ev-card">
        <span className="ev-cal-big" aria-hidden="true">
          <small>{when.month(m)}</small>
          <b>{when.date(m)}</b>
        </span>
        <strong className="ev-line">{when.day(m)}</strong>
        <span className="ev-sub">{when.time(m)}</span>
        <span className="ev-where">
          <FormatIcon f={m.format} size={30} />
          <span>
            <b>{m.format === "online" ? FORMAT.online : m.venue}</b>
            {m.format !== "online" && m.city && <small>{m.city}</small>}
          </span>
        </span>
        <span className="ev-where-tools">
          {m.format !== "online" && m.city && (
            <a className="ev-chip" href={mapsUrl(m)} target="_blank" rel="noreferrer" aria-label={`Directions to ${m.venue}`} title="Directions">
              <MapPin size={22} weight="fill" />
              <ArrowSquareOut size={14} />
            </a>
          )}
          {m.format !== "in-person" &&
            (joined ? (
              <span className="ev-chip" title={room}>
                {room}
              </span>
            ) : (
              <span className="ev-chip" aria-label="Link after you register" title="Link after you register">
                <Lock size={20} />
              </span>
            ))}
        </span>
      </div>
    );
  if (slide === "schedule")
    return (
      <div className="ev-card">
        <ol className="ev-track" style={{ ["--n" as string]: (m.schedule ?? []).length }}>
          {(m.schedule ?? []).map((r, i) => (
            <li key={`${r.time}-${i}`}>
              <time>{when.clock(r.time)}</time>
              <span>{r.label}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  if (slide === "going") {
    const left = Math.max(0, m.spots - count);
    return (
      <div className="ev-card">
        <span className="ev-faces-big" aria-label={`${count} going`}>
          {faces.map((f) => (
            <Avatar key={f} id={f} />
          ))}
          {faces.length === 0 && <Users size={64} aria-hidden="true" />}
        </span>
        <strong className="ev-count">{count}</strong>
        <span
          className="ev-spots"
          role="img"
          aria-label={left ? `${left} spots left` : "Full"}
          title={left ? `${left} spots left` : "Full"}
          style={{ ["--fill" as string]: `${Math.min(100, (count / Math.max(1, m.spots)) * 100)}%` }}
        >
          <i />
        </span>
        <span className="ev-sub">
          <Users size={18} aria-hidden="true" /> {count} / {m.spots}
        </span>
      </div>
    );
  }
  if (slide === "join")
    return (
      <div className="ev-card ev-join-card" style={{ ["--wash" as string]: wash }}>
        {host.maker ? (
          <Link to={`/people/${host.id}`} className="ev-host">
            <Avatar id={host.id} />
            <b>{host.name}</b>
          </Link>
        ) : (
          <span className="ev-host">
            <span className="event-initial big">{host.name.slice(0, 1)}</span>
            <b>{host.name}</b>
          </span>
        )}
        <span className="ev-hub" aria-hidden="true" />
      </div>
    );
  return null;
}

/** One event: its cover, then when and where, schedule, who is going and join, sideways. */
function EventSlideRow({ m, shown, near, onTap }: { m: EventItem; shown: boolean; near: boolean; onTap: () => void }) {
  const slides = eventSlides((m.schedule ?? []).length);
  const [at, setAt] = useState(0);
  const [sharing, setSharing] = useState(false);
  const row = useRef<HTMLDivElement>(null);
  const going = useGoing(m);
  const wash = useWash(m, near);
  const host = hostOf(m);
  const count = countGoing(m, going.on);
  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const sync = () => setAt(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener("scroll", sync, { passive: true });
    return () => el.removeEventListener("scroll", sync);
  }, [near]);
  const slide = slides[Math.min(at, slides.length - 1)];
  // Only the events beside the one in view are drawn; the others keep their place as empty screens.
  if (!near) return <section className="reel-slide ev-slide" data-event={m.id} aria-label={m.title} style={{ ["--wash" as string]: wash }} />;
  return (
    <section className="reel-slide ev-slide" data-event={m.id} data-slide={slide} aria-label={m.title} style={{ ["--wash" as string]: wash }}>
      <div className="reel-row" ref={row}>
        {slides.map((s) => (
          <div className="reel-card" key={s}>
            {s === "cover" ? (
              <ZoomStage onTap={onTap}>
                <div className="ev-cover-pic">
                  <EventCover m={m} />
                </div>
              </ZoomStage>
            ) : (
              <div className="ev-tap" onClick={onTap}>
                <SlideBody slide={s} m={m} count={count} joined={Boolean(m.hosted) || going.on} wash={wash} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="reel-overlay ev-overlay" data-shown={shown}>
        <div className="ev-frame">
          <div className="reel-dots" aria-hidden="true">
            {slides.map((s, i) => (
              <i key={s} data-on={i === at || undefined} data-story={s !== "cover" || undefined} />
            ))}
          </div>
          <div className="reel-byline ev-byline">
            {host.maker ? (
              <Link to={`/people/${host.id}`} className="reel-maker">
                <Avatar id={host.id} />
                <b>{host.name}</b>
              </Link>
            ) : (
              <span className="reel-maker">
                <span className="event-initial big">{host.name.slice(0, 1)}</span>
                <b>{host.name}</b>
              </span>
            )}
            <strong>{m.title}</strong>
          </div>
          <nav className="reel-rail ev-rail" aria-label="Actions">
            <button type="button" title="Share" aria-label="Share" onClick={() => setSharing(true)}>
              <ShareFat size={28} />
            </button>
            <button type="button" title="Add to calendar" aria-label="Add to calendar" onClick={() => addToCalendar(m)}>
              <CalendarPlus size={28} />
            </button>
            {m.hosted && (
              <Link to={`/events/${m.id}/edit`} state={{ from: m.id }} className="reel-icon" title="Edit" aria-label="Edit">
                <PencilSimple size={28} />
              </Link>
            )}
            <Link to={`/events/${m.id}`} className="reel-icon" title="Open the event page" aria-label="Open the event page">
              <ArrowUpRight size={28} />
            </Link>
          </nav>
        </div>
      </div>
      <div className="ev-persist">
        <div className="ev-frame">
          <FormatTag f={m.format} />
          <span className="ev-primary-slot">
            <EventPrimary m={m} going={going} size="reel" />
          </span>
        </div>
      </div>
      <ShareSheet open={sharing} onClose={() => setSharing(false)} title={m.title} url={`${typeof location === "undefined" ? "" : location.origin}/events/${m.id}`} />
    </section>
  );
}

/**
 * Events as a reel, like projects: swipe up for the next event, sideways
 * through its slides. The format tag and the big button stay on every slide;
 * the rest of the controls hide when you stop touching and come back on a tap.
 * Your own view (Discover, Going, Hosting), the format filter, the dated list
 * and Host an event sit in the corner.
 */
export function EventReel({
  items,
  view,
  filter,
  counts,
  onChange,
  startId,
  loading,
}: {
  items: EventItem[];
  view: EventView;
  filter: EventFilter;
  counts: { going: number; hosting: number };
  onChange: (view: EventView, filter: EventFilter) => void;
  startId?: string;
  loading?: boolean;
}) {
  const navigate = useNavigate();
  const { t } = useT();
  const [shown, setShown] = useState(true);
  const [menu, setMenu] = useState(false);
  const [index, setIndex] = useState(() => Math.max(0, items.findIndex((e) => e.id === startId)));
  const scroller = useRef<HTMLDivElement>(null);
  const active = useRef(startId ?? items[0]?.id);
  const idle = useRef<number | undefined>(undefined);

  const wake = useCallback(() => {
    setShown(true);
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => setShown(false), 4500);
  }, []);
  useEffect(() => {
    wake();
    return () => window.clearTimeout(idle.current);
  }, [wake]);

  // A shared link opens on its event; the address follows the event in view.
  const ids = items.map((e) => e.id);
  const idsRef = useRef(ids);
  idsRef.current = ids;
  const startKey = useRef(false);
  useLayoutEffect(() => {
    const root = scroller.current;
    if (!root || startKey.current || !startId) return;
    const i = ids.indexOf(startId);
    if (i > 0) {
      startKey.current = true;
      root.scrollTop = i * root.clientHeight;
    }
  });
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const sync = () => {
      const at = Math.round(root.scrollTop / Math.max(1, root.clientHeight));
      setIndex(at);
      const id = idsRef.current[at];
      if (id && id !== active.current) {
        active.current = id;
        const q = new URLSearchParams(window.location.search);
        q.set("at", id);
        window.history.replaceState(window.history.state, "", `/events?${q}`);
        wake();
      }
    };
    root.addEventListener("scroll", sync, { passive: true });
    return () => root.removeEventListener("scroll", sync);
  }, [wake]);

  function back() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate("/");
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const root = scroller.current;
      if (!root || document.querySelector('[role="dialog"][data-state="open"]')) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        root.scrollBy({ top: (e.key === "ArrowDown" ? 1 : -1) * root.clientHeight, behavior: "smooth" });
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const slides = [...root.querySelectorAll<HTMLElement>(".reel-slide")];
        const row = slides[Math.round(root.scrollTop / root.clientHeight)]?.querySelector<HTMLElement>(".reel-row");
        row?.scrollBy({ left: (e.key === "ArrowRight" ? 1 : -1) * row.clientWidth, behavior: "smooth" });
      } else if (e.key === "Escape") {
        if (menu) setMenu(false);
        else back();
      } else return;
      wake();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const filtered = view !== "discover" || filter !== "all";
  const empty = !items.length && !loading;
  return (
    <div
      className="reel ev-reel"
      onPointerMove={(e) => {
        if (e.pointerType === "mouse") wake();
      }}
      onClickCapture={(e) => {
        if ((e.target as HTMLElement).closest("button, a")) wake();
      }}
    >
      <div className="reel-top ev-top" data-shown={shown || menu}>
        <button type="button" className="reel-icon" aria-label={t("common.back")} title={t("common.back")} onClick={back}>
          <ArrowLeft size={24} />
        </button>
        <span className="ev-top-end">
          <button type="button" className="reel-icon" aria-label="Filter events" title="Filter events" aria-expanded={menu} data-on={filtered || undefined} onClick={() => setMenu((v) => !v)}>
            <SlidersHorizontal size={24} />
          </button>
          <Link to="/events?list=1" className="reel-icon" aria-label="List of events" title="List of events">
            <ListBullets size={24} />
          </Link>
          <Link to="/events/new" className="reel-icon ev-host-add" aria-label="Host an event" title="Host an event">
            <Plus size={24} weight="bold" />
          </Link>
        </span>
        {menu && (
          <div className="ev-menu" role="group" aria-label="Filter events" onKeyDown={(k) => k.key === "Escape" && setMenu(false)}>
            <div role="radiogroup" aria-label="Events">
              {VIEW_ICONS.map(([v, I, label]) => (
                <button key={v} type="button" role="radio" aria-checked={view === v} aria-label={label} title={label} onClick={() => onChange(v, filter)}>
                  <I size={24} weight={view === v ? "fill" : "regular"} />
                  {v === "going" && counts.going > 0 && <i className="reel-count">{counts.going}</i>}
                  {v === "hosting" && counts.hosting > 0 && <i className="reel-count">{counts.hosting}</i>}
                </button>
              ))}
            </div>
            <div role="radiogroup" aria-label="Where">
              {FILTER_ICONS.map(([f, label]) => (
                <button key={f} type="button" role="radio" aria-checked={filter === f} aria-label={label} title={label} onClick={() => onChange(view, f)}>
                  {f === "all" ? <CirclesFour size={24} weight={filter === f ? "fill" : "regular"} /> : <FormatIcon f={f} size={24} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {empty ? (
        <div className="ev-empty">
          {view === "hosting" ? <MegaphoneSimple size={72} /> : view === "going" ? <Ticket size={72} /> : <Compass size={72} />}
          {view === "discover" ? (
            filter !== "all" && (
              <button type="button" className="ev-empty-go" aria-label="All events" title="All events" onClick={() => onChange("discover", "all")}>
                <CirclesFour size={28} />
              </button>
            )
          ) : view === "hosting" ? (
            <Link to="/events/new" className="ev-empty-go" aria-label="Host an event" title="Host an event">
              <Plus size={28} weight="bold" />
            </Link>
          ) : (
            <button type="button" className="ev-empty-go" aria-label="Find an event" title="Find an event" onClick={() => onChange("discover", filter)}>
              <Compass size={28} />
            </button>
          )}
        </div>
      ) : (
        <div className="reel-scroller" ref={scroller}>
          {items.map((m, i) => (
            <EventSlideRow key={m.id} m={m} shown={shown} near={Math.abs(i - index) <= 1} onTap={() => (menu ? setMenu(false) : shown ? setShown(false) : wake())} />
          ))}
        </div>
      )}
    </div>
  );
}
