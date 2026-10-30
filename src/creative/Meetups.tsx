import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowSquareOut,
  CalendarBlank,
  CalendarPlus,
  Check,
  Compass,
  FilmStrip,
  LinkSimple,
  ListPlus,
  Lock,
  MapPin,
  MegaphoneSimple,
  PencilSimple,
  Plus,
  ShareNetwork,
  Ticket,
  Trash,
  UploadSimple,
  Users,
  VideoCamera,
  X,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { makerById } from "./makers";
import { byDate, meetups, nearYou, type MeetupFormat } from "./meetupList";
import { caseStudies, projectById, projectsByMaker } from "./portfolio";
import { ProjectCover } from "./portfolio/Visuals";
import { Artwork, Avatar, BackButton, Empty, Header } from "./primitives";
import { useCreative } from "./context";
import { needsVideoLink, SCHEDULE_MAX, type HostedEvent } from "./contracts";
import { artToCover, coverUrl, fileToCover } from "./eventCover";
import { cleanSchedule, countGoing, hasTimelessRow, nextRowTime } from "./eventSchedule";
import {
  addToCalendar,
  ATTENDEES,
  EventCover,
  EventPrimary,
  FORMAT,
  FormatIcon,
  KIND,
  hostedChanged,
  hostOf,
  isGoing,
  joinLabel,
  joinTarget,
  pad,
  useEvents,
  useGoing,
  useSharedEvents,
  useWash,
  useWhen,
  type EventItem,
} from "./eventShared";
import { EventReel, FormatTag } from "./EventReel";
import { ShareSheet } from "./ShareSheet";
import "./events.css";
import "./eventReel.css";

// The tests and other screens read these from here.
export { joinLabel, joinTarget, joinWindow, nextGoing, hostedChanged, type EventItem } from "./eventShared";

/** The format filter in `?format=`; anything unknown is "all". */
export const formatParam = (raw: string | null): "all" | MeetupFormat => (raw === "in-person" || raw === "online" || raw === "hybrid" ? raw : "all");

export type HostField = "title" | "date" | "time" | "venue" | "city" | "link" | "schedule";
/** Required fields a hosted event still lacks, in the order they appear on the form. */
export function missingFields(e: HostedEvent): HostField[] {
  const [date, time] = e.startsAt.split("T");
  const out: HostField[] = [];
  if (!e.title.trim()) out.push("title");
  if (!date) out.push("date");
  if (!time) out.push("time");
  if (e.format !== "online") {
    if (!e.venue.trim()) out.push("venue");
    if (!e.city.trim()) out.push("city");
  }
  // Online and hybrid events need a video link people can open.
  if (needsVideoLink(e) || (e.format !== "in-person" && !/^https:\/\/\S+$/.test(e.link))) out.push("link");
  // A schedule row with words but no time would be lost on save.
  if (hasTimelessRow(e.schedule)) out.push("schedule");
  return out;
}

/** The host takes their event down: a trash icon, then a yes or no beside it. Afterwards, back to Hosting. */
function RemoveEvent({ id, disabled = false }: { id: string; disabled?: boolean }) {
  const { run } = useCreative();
  const navigate = useNavigate();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (busy) return;
    setBusy(true);
    const r = await run("event.remove", { id });
    setBusy(false);
    setAsking(false);
    if (!r.ok) return;
    hostedChanged();
    toast.success("Event taken down");
    navigate("/events?view=hosting", { replace: true });
  }
  if (asking)
    return (
      <span
        className="event-cancel event-remove"
        role="group"
        aria-label="Delete event?"
        onKeyDown={(k) => k.key === "Escape" && setAsking(false)}
        onBlur={(ev) => !busy && !ev.currentTarget.contains(ev.relatedTarget) && setAsking(false)}
      >
        <Trash size={18} aria-hidden="true" />
        <span>Delete event?</span>
        <button type="button" className="icon-button event-cancel-yes" aria-label="Yes, delete" title="Yes, delete" disabled={busy} onClick={() => void remove()}>
          {busy ? <span className="spinner" aria-hidden="true" /> : <Check size={18} />}
        </button>
        <button type="button" className="icon-button" aria-label="No" title="No" disabled={busy} onClick={() => setAsking(false)} autoFocus>
          <X size={18} />
        </button>
      </span>
    );
  return (
    <button type="button" className="icon-pill danger" onClick={() => setAsking(true)} disabled={disabled} title="Delete event" aria-label="Delete event">
      <Trash size={18} />
    </button>
  );
}

/** One event as a card: picture, kind, when, where. */
export function MeetupCard({ m }: { m: EventItem }) {
  const when = useWhen();
  return (
    <Link to={`/events/${m.id}`} className="meetup-card">
      <span className="meetup-card-media">
        <EventCover m={m} small />
      </span>
      <strong>{m.title}</strong>
      <span className="meetup-meta">
        <CalendarBlank size={14} aria-hidden="true" /> {when.short(m)}
      </span>
      <span className="meetup-meta">
        <FormatIcon f={m.format} size={14} />
        {m.format === "online" ? "Online" : m.format === "hybrid" ? `${m.city} · also online` : m.city}
      </span>
    </Link>
  );
}

/** One line of the dated list: time, title, host, where, who is going, and the picture. */
function EventRow({ m }: { m: EventItem }) {
  const when = useWhen();
  const { workspace } = useCreative();
  const host = hostOf(m);
  const going = isGoing(m, workspace?.person);
  return (
    <Link to={`/events/${m.id}`} className="event-row">
      <div className="event-row-body">
        <span className="event-row-time">{when.time(m)}</span>
        <strong>{m.title}</strong>
        <span className="event-row-host">
          {host.maker ? <Avatar id={host.id} size="small" /> : <span className="event-initial">{host.name.slice(0, 1)}</span>}
          {host.name}
        </span>
        <span className="event-row-where">
          <FormatIcon f={m.format} size={15} />
          {m.format === "online" ? "Online" : `${m.venue}${m.city ? ` · ${m.city}` : ""}`}
        </span>
        <span className="event-row-tags">
          {m.hosted ? (
            <span className="event-tag host">
              <MegaphoneSimple size={13} /> Hosting
            </span>
          ) : going ? (
            <span className="event-tag going">
              <Check size={13} /> Going
            </span>
          ) : (
            <span className="event-tag">
              <Users size={13} /> {m.going} going
            </span>
          )}
          {!m.hosted && <span className="event-tag">{KIND[m.kind]}</span>}
        </span>
      </div>
      <span className="event-row-media">
        <EventCover m={m} small />
      </span>
    </Link>
  );
}

/** Events grouped by day, soonest first. */
function DatedList({ list }: { list: EventItem[] }) {
  const when = useWhen();
  const days: [string, EventItem[]][] = [];
  for (const m of byDate(list) as EventItem[]) {
    const d = when.day(m);
    const last = days[days.length - 1];
    if (last && last[0] === d) last[1].push(m);
    else days.push([d, [m]]);
  }
  return (
    <ol className="event-days">
      {days.map(([d, items]) => (
        <li key={d}>
          <h3 className="event-day">{d}</h3>
          <div className="event-day-list">
            {items.map((m) => (
              <EventRow key={m.id} m={m} />
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Discover's events row: what is coming up near you. */
export function MeetupsStrip() {
  const { workspace } = useCreative();
  const list = nearYou(meetups, workspace?.person.location).slice(0, 8);
  return (
    <section className="meetups-strip" aria-labelledby="meetups-h">
      <div className="gallery-heading">
        <h2 id="meetups-h">Events</h2>
        <Link to="/events">All events</Link>
      </div>
      <div className="meetups-row">
        {list.map((m) => (
          <MeetupCard key={m.id} m={m} />
        ))}
      </div>
    </section>
  );
}

type View = "discover" | "going" | "hosting";
const VIEWS: [View, typeof Compass, string][] = [
  ["discover", Compass, "Discover"],
  ["going", Ticket, "Going"],
  ["hosting", MegaphoneSimple, "Hosting"],
];
const FILTERS: ["all" | MeetupFormat, string][] = [
  ["all", "All"],
  ["in-person", "In person"],
  ["online", "Online"],
  ["hybrid", "Hybrid"],
];

/** `/events`: events as a reel; `?list=1` is the dated list of discover, the ones you're going to, and the ones you host. */
export function MeetupsPage() {
  const { all, mine, person, loading } = useEvents();
  const [params, setParams] = useSearchParams();
  const raw = params.get("view");
  const view: View = raw === "going" || raw === "hosting" ? raw : "discover";
  const filter = formatParam(params.get("format"));
  const asList = params.get("list") === "1";
  /** Tabs, the format filter and the list switch all live in the URL, so Back restores them. */
  const go = (v: View, f: "all" | MeetupFormat) => {
    const next: Record<string, string> = {};
    if (asList) next.list = "1";
    if (v !== "discover") next.view = v;
    if (f !== "all") next.format = f;
    setParams(next, { replace: true });
  };
  const location = person?.location;
  const going = all.filter((m) => isGoing(m, person));
  const shown = (nearYou(all, location) as EventItem[]).filter((m) => filter === "all" || m.format === filter);
  const featured = byDate(meetups.filter((m) => m.featured)).slice(0, 2);
  // The reel keeps its events in place while you register or cancel inside it.
  const reelIds = useMemo(
    () => {
      const pool = view === "going" ? byDate(going) : view === "hosting" ? byDate(mine) : nearYou(all, location);
      return (pool as EventItem[]).filter((m) => filter === "all" || m.format === filter).map((m) => m.id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view, filter, all.length, location],
  );
  if (!asList) {
    const byId = new Map(all.map((m) => [m.id, m]));
    return (
      <EventReel
        items={reelIds.flatMap((id) => byId.get(id) ?? [])}
        view={view}
        filter={filter}
        counts={{ going: going.length, hosting: mine.length }}
        onChange={go}
        startId={params.get("at") ?? undefined}
        loading={loading}
      />
    );
  }
  return (
    <>
      <Header />
      <main className="meetups-page">
        <div className="events-head">
          <h1>Events</h1>
          <Link className="icon-pill round" to="/events" title="Events reel" aria-label="Events reel">
            <FilmStrip size={22} />
          </Link>
          <Link className="pill acid" to="/events/new">
            <Plus size={18} />
            Host an event
          </Link>
        </div>
        <div className="events-bar">
          <div className="feed-tabs board-tabs" role="tablist" aria-label="Events">
            {VIEWS.map(([v, I, label]) => (
              <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => go(v, filter)}>
                <I size={18} weight={view === v ? "fill" : "regular"} />
                {label}
                {v === "going" && going.length > 0 && <span className="tab-count">{going.length}</span>}
                {v === "hosting" && mine.length > 0 && <span className="tab-count">{mine.length}</span>}
              </button>
            ))}
          </div>
          {view === "discover" && (
            <div className="events-chips" role="group" aria-label="Where">
              {FILTERS.map(([f, label]) => (
                <button key={f} type="button" className={`chip-button ${filter === f ? "on" : ""}`} aria-pressed={filter === f} onClick={() => go(view, f)}>
                  {f !== "all" && <FormatIcon f={f} size={15} />}
                  {label}
                </button>
              ))}
              {location && (
                <span className="events-near" title={location}>
                  <MapPin size={15} aria-hidden="true" /> {location.split(",")[0]}
                </span>
              )}
            </div>
          )}
        </div>
        {view === "discover" && (
          <>
            {filter === "all" && (
              <section aria-label="Featured" className="meetups-featured">
                {featured.map((m) => (
                  <MeetupCard key={m.id} m={m} />
                ))}
              </section>
            )}
            {shown.length ? <DatedList list={shown} /> : <Empty title="Nothing here yet.">{null}</Empty>}
          </>
        )}
        {view === "going" &&
          (going.length ? (
            <DatedList list={going} />
          ) : (
            <Empty title="No plans yet.">
              <button type="button" className="pill outline" onClick={() => go("discover", filter)}>
                <Compass size={18} />
                Find an event
              </button>
            </Empty>
          ))}
        {view === "hosting" &&
          (mine.length ? (
            <DatedList list={mine} />
          ) : (
            <Empty title="Host your first event.">
              <Link className="pill acid" to="/events/new">
                <Plus size={18} />
                Host an event
              </Link>
            </Empty>
          ))}
      </main>
    </>
  );
}

/** A tracklist row of an event's schedule on the album page. */
function Tracklist({ m }: { m: EventItem }) {
  const when = useWhen();
  const rows = m.schedule ?? [];
  if (!rows.length) return null;
  return (
    <ol className="ev-tracklist" aria-label="Schedule">
      {rows.map((r, i) => (
        <li key={`${r.time}-${i}`}>
          <i aria-hidden="true">{i + 1}</i>
          <span>{r.label}</span>
          <time>{when.clock(r.time)}</time>
        </li>
      ))}
    </ol>
  );
}

/** More from the host: their other events, then their projects. */
function HostShelf({ m, all }: { m: EventItem; all: EventItem[] }) {
  const host = hostOf(m);
  const events = all.filter((e) => e.id !== m.id && (m.hostId ? e.hostId === m.hostId : Boolean(m.hostName) && e.hostName === m.hostName));
  const projects = m.hostId ? projectsByMaker(m.hostId).filter((p) => p.id !== m.projectId) : [];
  if (!events.length && !projects.length) return null;
  return (
    <section className="ev-shelf" aria-label={host.name}>
      <h2>
        {host.maker ? <Avatar id={host.id} size="small" /> : <span className="event-initial">{host.name.slice(0, 1)}</span>}
        {host.name}
      </h2>
      <div className="ev-shelf-row">
        {events.map((e) => (
          <MeetupCard key={e.id} m={e} />
        ))}
        {projects.map((p) => (
          <Link key={p.id} to={`/case/${p.id}`} className="meetup-card">
            <span className="meetup-card-media">
              <ProjectCover project={p} small />
            </span>
            <strong>{p.title}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** `/events/:id`: one event as an album: the cover and its colour, the title, host and faces, one big button, the schedule as a tracklist, where and when, and more from the host. */
export function MeetupPage() {
  const { id } = useParams();
  const when = useWhen();
  const { all, loading } = useEvents(id?.startsWith("h-") ? id : undefined);
  const [sharing, setSharing] = useState(false);
  const m = all.find((e) => e.id === id);
  const going = useGoing(m);
  const wash = useWash(m ?? { id: id ?? "", projectId: "" });
  if (!m && loading)
    return (
      <>
        <Header />
        <span className="spinner" role="status" aria-label="Loading" />
      </>
    );
  if (!m)
    return (
      <>
        <Header />
        <Empty title="This event is not here.">
          <Link className="pill outline" to="/events">
            All events
          </Link>
        </Empty>
      </>
    );
  const host = hostOf(m);
  const maker = makerById(m.hostId);
  const joined = Boolean(m.hosted) || going.on;
  const count = countGoing(m, going.on);
  const faces = m.hosted ? [] : ATTENDEES.filter((x) => x !== m.hostId).slice(0, Math.min(4, count));
  const mapsUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${m.venue}, ${m.city}`)}`;
  const place = m.format === "online" ? FORMAT.online : m.venue;
  const city = `${maker?.place && !m.hosted && maker.place.includes(m.city) ? maker.place : m.city}${m.format === "hybrid" ? " · online" : ""}`;
  return (
    <>
      <Header />
      <main className="event-page ev-album" style={{ ["--wash" as string]: wash }}>
        <div className="ev-album-in">
          <nav className="open-board-bar">
            <BackButton fallback="/events" />
          </nav>
          <header className="ev-album-head">
            <div className="ev-album-cover">
              <EventCover m={m} />
            </div>
            <div className="ev-album-title">
              <FormatTag f={m.format} />
              <h1>{m.title}</h1>
              <div className="ev-album-who">
                {host.maker ? (
                  <Link to={`/people/${host.id}`} className="open-board-host">
                    <Avatar id={host.id} size="small" />
                    <span>{host.name}</span>
                  </Link>
                ) : (
                  <span className="open-board-host">
                    <span className="event-initial">{host.name.slice(0, 1)}</span>
                    <span>{host.name}</span>
                  </span>
                )}
                <span className="ev-album-going" title={`${count} / ${m.spots}`}>
                  {faces.map((f) => (
                    <Avatar key={f} id={f} size="small" />
                  ))}
                  <Users size={16} aria-hidden="true" />
                  {count}
                </span>
              </div>
            </div>
          </header>
          <div className="ev-album-actions">
            <EventPrimary m={m} going={going} size="page" />
            <button type="button" className="icon-pill round" onClick={() => addToCalendar(m)} title="Add to calendar" aria-label="Add to calendar">
              <CalendarPlus size={22} />
            </button>
            <button type="button" className="icon-pill round" onClick={() => setSharing(true)} title="Share" aria-label="Share">
              <ShareNetwork size={22} />
            </button>
            {m.boardId && (
              <Link to={`/boards/${m.boardId}`} className="icon-pill round" title="Board" aria-label="Board">
                <LinkSimple size={22} />
              </Link>
            )}
            {m.hosted && (
              <>
                {joinTarget(m) && (
                  <Link to={`/events/${m.id}/edit`} state={{ from: m.id }} className="icon-pill round" title="Edit" aria-label="Edit">
                    <PencilSimple size={22} />
                  </Link>
                )}
                <RemoveEvent id={m.id} />
              </>
            )}
          </div>
          <Tracklist m={m} />
          <ul className="ev-rows">
            <li>
              <span className="event-cal" aria-hidden="true">
                <small>{when.month(m)}</small>
                <b>{when.date(m)}</b>
              </span>
              <span>
                <strong>{when.day(m)}</strong>
                <small>{when.time(m)}</small>
              </span>
            </li>
            <li>
              <span className="event-pin" aria-hidden="true">
                <FormatIcon f={m.format} size={22} />
              </span>
              <span>
                <strong>{place}</strong>
                {m.format === "online" || city ? (
                  <small>
                    {m.format === "online" ? (
                      joined ? (
                        joinLabel(m)
                      ) : (
                        <Lock size={15} aria-label="Link after you register" />
                      )
                    ) : (
                      city
                    )}
                  </small>
                ) : null}
              </span>
              {m.format !== "online" && m.city && (
                <a className="ev-row-go" href={mapsUrl} target="_blank" rel="noreferrer" aria-label={`Directions to ${m.venue}`} title="Directions">
                  <MapPin size={22} weight="fill" />
                  <ArrowSquareOut size={14} />
                </a>
              )}
            </li>
          </ul>
          {m.format !== "online" && m.city && (
            <a className="event-map" href={mapsUrl} target="_blank" rel="noreferrer" aria-label={`Directions to ${m.venue}`}>
              <span className="event-map-pin">
                <MapPin size={26} weight="fill" />
              </span>
              <span className="event-map-label">
                {m.city}
                <ArrowSquareOut size={14} />
              </span>
            </a>
          )}
          {m.about && <p className="event-about">{m.about}</p>}
          <HostShelf m={m} all={all} />
        </div>
        <ShareSheet open={sharing} onClose={() => setSharing(false)} title={m.title} url={`${location.origin}/events/${m.id}`} />
      </main>
    </>
  );
}

const LENGTHS = [60, 90, 120, 180, 240, 480];
const newId = () => `h-${Math.random().toString(36).slice(2, 10)}`;
const tomorrow = () => {
  const d = new Date(Date.now() + 7 * 864e5);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * The cover the host picked: a picture of their own (already kept, so it has
 * a reference), one of their projects (drawn and kept when they publish), or
 * a maker's case study.
 */
export type CoverPick = { kind: "ref"; ref: string } | { kind: "own"; id: string } | { kind: "case"; id: string };

/** The cover a form starts on: the event's own picture, else your newest project for a new event, else its case study. */
export function defaultCover(e: Pick<HostedEvent, "cover" | "projectId">, isNew: boolean, ownProjectIds: string[]): CoverPick {
  if (e.cover) return { kind: "ref", ref: e.cover };
  if (isNew && ownProjectIds[0]) return { kind: "own", id: ownProjectIds[0] };
  return { kind: "case", id: e.projectId };
}

const samePick = (a: CoverPick, b: CoverPick) => a.kind === b.kind && (a.kind === "ref" ? a.ref === (b as { ref: string }).ref : a.id === (b as { id: string }).id);

/** `/events/new` and `/events/:id/edit`: host an event. */
export function HostEventPage() {
  const { id } = useParams();
  const { workspace, run } = useCreative();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const form = useRef<HTMLFormElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [tried, setTried] = useState(false);
  const shared = useSharedEvents(id);
  const editing = id ? shared?.find((h) => h.mine && h.event.id === id)?.event : undefined;
  const [e, setE] = useState<HostedEvent>(
    () =>
      editing ?? {
        id: newId(),
        title: "",
        format: "in-person",
        startsAt: `${tomorrow()}T18:00`,
        minutes: 120,
        city: workspace?.person.location?.split(",")[0] ?? "",
        venue: "",
        link: "",
        spots: 30,
        about: "",
        projectId: caseStudies[0]?.id ?? "harbour-hours",
      },
  );
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Your event arrives from the shared store a moment after the page opens.
  const loaded = useRef(false);
  useEffect(() => {
    if (editing && !loaded.current) {
      loaded.current = true;
      setE(editing);
    }
  }, [editing]);
  /** Your own projects, newest first as the workspace lists them. */
  const own = useMemo(() => (workspace?.projects ?? []).filter((p) => p.owner).slice(0, 5), [workspace]);
  const [picked, setPicked] = useState<CoverPick | null>(null);
  /** Pictures you uploaded on this visit, newest first, beside the one the event already has. */
  const [uploads, setUploads] = useState<string[]>([]);
  const pick = picked ?? defaultCover(e, !id, own.map((p) => p.id));
  const refs = [...new Set([...uploads, ...(e.cover ? [e.cover] : [])])].slice(0, 3);
  const firstCases = caseStudies.slice(0, Math.max(4, 11 - refs.length - own.length));
  const pickedCase = pick.kind === "case" && !firstCases.some((c) => c.id === pick.id) ? projectById(pick.id) : undefined;
  const curated = pickedCase ? [pickedCase, ...firstCases.slice(0, -1)] : firstCases;
  const ownPicked = pick.kind === "own" ? own.find((p) => p.id === pick.id) : undefined;
  const set = <K extends keyof HostedEvent>(k: K, v: HostedEvent[K]) => setE((old) => ({ ...old, [k]: v }));
  const [date, time] = e.startsAt.split("T");
  const needsPlace = e.format !== "online",
    needsLink = e.format !== "in-person";
  const missing = missingFields(e);
  /** After a press of Save, the empty required fields are outlined until filled. */
  const bad = (f: HostField) => (tried && missing.includes(f) ? true : undefined);
  /** Keeps a cover picture and answers its reference, or nothing if it could not be kept. */
  async function keep(picture: Promise<{ contentType: "image/jpeg"; base64: string }>): Promise<string | null> {
    const drawn = await picture.catch(() => null);
    if (!drawn) {
      toast.error("Could not read that picture.");
      return null;
    }
    const r = await run("event.cover", drawn);
    return r.ok && r.cover ? r.cover : null;
  }
  async function upload(chosen: File | undefined) {
    if (!chosen || uploading) return;
    setUploading(true);
    const ref = await keep(fileToCover(chosen));
    setUploading(false);
    if (!ref) return;
    setUploads((list) => [ref, ...list.filter((x) => x !== ref)]);
    setPicked({ kind: "ref", ref });
  }
  async function save() {
    if (busy) return;
    if (missing.length) {
      setTried(true);
      const first = form.current?.querySelector<HTMLElement>(`[data-field="${missing[0]}"]`);
      first?.focus({ preventScroll: true });
      first?.scrollIntoView({ block: "center" });
      return;
    }
    setBusy(true);
    let cover: string | undefined;
    let projectId = e.projectId;
    if (pick.kind === "ref") cover = pick.ref;
    else if (pick.kind === "case") projectId = pick.id;
    else if (ownPicked) {
      const ref = await keep(artToCover(ownPicked.document.art));
      if (!ref) return setBusy(false);
      cover = ref;
      setUploads((list) => [ref, ...list]);
      setPicked({ kind: "ref", ref });
    }
    const { cover: _old, schedule: _rows, ...rest } = e;
    void _old;
    void _rows;
    const schedule = cleanSchedule(e.schedule);
    const event: HostedEvent = { ...rest, projectId, ...(cover ? { cover } : {}), ...(schedule.length ? { schedule } : {}), title: e.title.trim(), city: needsPlace ? e.city.trim() : "", venue: needsPlace ? e.venue.trim() : "", link: needsLink ? e.link : "" };
    const r = await run("event.publish", { event });
    setBusy(false);
    if (r.ok) hostedChanged();
    // The form leaves history: Back from the event goes where you were before it.
    if (r.ok) {
      if (editing && from === e.id && (window.history.state?.idx ?? 0) > 0) navigate(-1);
      else navigate(`/events/${e.id}`, { replace: true });
    }
  }
  const choose = (p: CoverPick) => setPicked(p);
  return (
    <>
      <Header />
      <main className="host-page">
        <nav className="open-board-bar">
          <BackButton fallback="/events" />
        </nav>
        <form
          className="host-form"
          ref={form}
          noValidate
          onSubmit={(ev) => {
            ev.preventDefault();
            void save();
          }}
        >
          <div className="host-cover">
            {pick.kind === "ref" ? (
              <img src={coverUrl(pick.ref)} alt="" />
            ) : ownPicked ? (
              <Artwork art={ownPicked.document.art} />
            ) : (
              <EventCover m={{ projectId: pick.kind === "case" ? pick.id : e.projectId }} />
            )}
          </div>
          <div className="host-fields">
            <input className="host-title" value={e.title} onChange={(x) => set("title", x.target.value)} maxLength={80} placeholder="Event name" aria-label="Event name" required autoFocus={!editing} data-field="title" aria-invalid={bad("title")} />
            <div className="host-formats" role="radiogroup" aria-label="Where">
              {(["in-person", "online", "hybrid"] as MeetupFormat[]).map((f) => (
                <button key={f} type="button" role="radio" aria-checked={e.format === f} onClick={() => set("format", f)}>
                  <FormatIcon f={f} size={20} />
                  {FORMAT[f]}
                </button>
              ))}
            </div>
            <div className="host-row">
              <label data-invalid={bad("date")}>
                <CalendarBlank size={18} aria-hidden="true" />
                <input type="date" value={date} onChange={(x) => set("startsAt", `${x.target.value}T${time}`)} aria-label="Date" required data-field="date" aria-invalid={bad("date")} />
              </label>
              <label data-invalid={bad("time")}>
                <input type="time" value={time} onChange={(x) => set("startsAt", `${date}T${x.target.value}`)} aria-label="Start time" required data-field="time" aria-invalid={bad("time")} />
              </label>
              <label>
                <select value={e.minutes} onChange={(x) => set("minutes", Number(x.target.value))} aria-label="Length">
                  {LENGTHS.map((n) => (
                    <option key={n} value={n}>
                      {n < 60 ? `${n} min` : `${n / 60} h`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {needsPlace && (
              <div className="host-row">
                <label className="grow" data-invalid={bad("venue")}>
                  <MapPin size={18} aria-hidden="true" />
                  <input value={e.venue} onChange={(x) => set("venue", x.target.value)} maxLength={120} placeholder="Venue and address" aria-label="Venue and address" required data-field="venue" aria-invalid={bad("venue")} />
                </label>
                <label data-invalid={bad("city")}>
                  <input value={e.city} onChange={(x) => set("city", x.target.value)} maxLength={60} placeholder="City" aria-label="City" required data-field="city" aria-invalid={bad("city")} />
                </label>
              </div>
            )}
            {needsLink && (
              <label className="host-line" data-invalid={bad("link")}>
                <VideoCamera size={18} aria-hidden="true" />
                <input type="url" value={e.link} onChange={(x) => set("link", x.target.value.trim())} maxLength={300} placeholder="https:// video link" aria-label="Video link" required data-field="link" aria-invalid={bad("link")} />
              </label>
            )}
            <label className="host-line">
              <Users size={18} aria-hidden="true" />
              <input type="number" min={1} max={5000} value={e.spots} onChange={(x) => set("spots", Math.max(1, Math.min(5000, Number(x.target.value) || 1)))} aria-label="Spots" />
            </label>
            <div className="host-schedule" role="group" aria-label="Schedule">
              {(e.schedule ?? []).map((r, i) => (
                <div className="host-sched-row" key={i}>
                  <label data-invalid={bad("schedule") && !/^\d{2}:\d{2}$/.test(r.time) ? true : undefined}>
                    <input
                      type="time"
                      value={r.time}
                      onChange={(x) => set("schedule", (e.schedule ?? []).map((q, j) => (j === i ? { ...q, time: x.target.value } : q)))}
                      aria-label="Time"
                      data-field={!/^\d{2}:\d{2}$/.test(r.time) ? "schedule" : undefined}
                    />
                  </label>
                  <label className="grow">
                    <input
                      value={r.label}
                      onChange={(x) => set("schedule", (e.schedule ?? []).map((q, j) => (j === i ? { ...q, label: x.target.value } : q)))}
                      maxLength={60}
                      placeholder="What happens"
                      aria-label="What happens at this time"
                    />
                  </label>
                  <button type="button" className="icon-button" aria-label="Remove row" title="Remove row" onClick={() => set("schedule", (e.schedule ?? []).filter((_, j) => j !== i))}>
                    <Trash size={18} />
                  </button>
                </div>
              ))}
              {(e.schedule ?? []).length < SCHEDULE_MAX && (
                <button
                  type="button"
                  className="host-sched-add"
                  aria-label="Add a schedule row"
                  title="Add a schedule row"
                  onClick={() => set("schedule", [...(e.schedule ?? []), { time: nextRowTime(e.schedule ?? [], e.startsAt), label: "" }])}
                >
                  <ListPlus size={22} />
                </button>
              )}
            </div>
            <textarea value={e.about} onChange={(x) => set("about", x.target.value)} maxLength={800} placeholder="What happens" aria-label="What happens" rows={4} />
            <div className="host-covers" role="radiogroup" aria-label="Cover">
              <button type="button" className="host-cover-upload" aria-label="Upload a cover" title="Upload a cover" aria-busy={uploading} disabled={uploading || !workspace} onClick={() => file.current?.click()}>
                {uploading ? <span className="spinner" aria-hidden="true" /> : <UploadSimple size={22} />}
              </button>
              {refs.map((ref) => (
                <button key={ref} type="button" role="radio" aria-checked={samePick(pick, { kind: "ref", ref })} aria-label="Your picture" title="Your picture" onClick={() => choose({ kind: "ref", ref })}>
                  <img src={coverUrl(ref)} alt="" />
                </button>
              ))}
              {own.map((p) => (
                <button key={p.id} type="button" role="radio" className="host-cover-own" aria-checked={samePick(pick, { kind: "own", id: p.id })} aria-label={p.document.title} title={p.document.title} onClick={() => choose({ kind: "own", id: p.id })}>
                  <Artwork art={p.document.art} />
                </button>
              ))}
              {curated.map((c) => (
                <button key={c.id} type="button" role="radio" aria-checked={samePick(pick, { kind: "case", id: c.id })} aria-label={c.title} title={c.title} onClick={() => choose({ kind: "case", id: c.id })}>
                  <ProjectCover project={c} small />
                </button>
              ))}
              <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(x) => {
                void upload(x.target.files?.[0]);
                x.target.value = "";
              }} />
            </div>
            <div className="host-actions">
              {editing && <RemoveEvent id={e.id} disabled={busy} />}
              <button type="submit" className="pill acid" disabled={busy || uploading || !workspace}>
                {busy ? <span className="spinner" /> : editing ? <Check size={18} /> : <MegaphoneSimple size={18} />}
                {editing ? "Save" : "Publish event"}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}
