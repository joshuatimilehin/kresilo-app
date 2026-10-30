import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Globe, MapPin, PencilSimple, SquaresFour, Ticket, VideoCamera, X } from "@phosphor-icons/react";
import { toast } from "sonner";
import { creatorFor } from "./catalog";
import type { Meetup, MeetupFormat, MeetupKind } from "./meetupList";
import { meetups } from "./meetupList";
import { projectById } from "./portfolio";
import { openBoardById } from "./openBoards";
import { ProjectCover } from "./portfolio/Visuals";
import { artSrc } from "./portfolio/art";
import { primaryAction, washFromId, washFromPalette, washFromPixels } from "./eventSchedule";
import { useCreative } from "./context";
import { useT } from "./locale";
import type { HostedEvent, Person } from "./contracts";
import { coverUrl } from "./eventCover";

/** What the events reel, the events list and the event page share: the event shape, where events come from, your place at one, dates in your language. */
export const KIND: Record<MeetupKind, string> = { workshop: "Workshop", talk: "Talk", review: "Review", market: "Market", jam: "Live jam" };
export const FORMAT: Record<MeetupFormat, string> = { "in-person": "In person", online: "Online", hybrid: "Hybrid" };
export const FormatIcon = ({ f, size = 16 }: { f: MeetupFormat; size?: number }) =>
  f === "online" ? <Globe size={size} aria-hidden="true" /> : f === "hybrid" ? <VideoCamera size={size} aria-hidden="true" /> : <MapPin size={size} aria-hidden="true" />;


/** The going list after registering for, or cancelling, one event. */
export const nextGoing = (list: string[], id: string, on: boolean) => (on ? [...list.filter((x) => x !== id), id].slice(-100) : list.filter((x) => x !== id));


/** Where "Join" takes a person who is going: the host's video link, else the jam's board. */
export function joinTarget(m: Pick<EventItem, "format" | "link" | "boardId">): { to: string; external: boolean } | null {
  if (m.format === "in-person") return null;
  if (m.link) return { to: m.link, external: true };
  if (m.boardId) return { to: `/boards/${m.boardId}`, external: false };
  return null;
}

/** Joining opens a quarter of an hour before the start and closes when the event ends. */
export const JOIN_EARLY_MINUTES = 15;
export function joinWindow(m: Pick<Meetup, "startsAt" | "minutes">, now: number): "soon" | "open" | "over" {
  const start = new Date(m.startsAt).getTime();
  if (now < start - JOIN_EARLY_MINUTES * 60000) return "soon";
  return now >= start + m.minutes * 60000 ? "over" : "open";
}

/** The time now, refreshed every half minute so Join opens on its own. */
export function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/** An event's picture: the host's own cover when it has one, else the case study it grows out of. */
export function EventCover({ m, small = false }: { m: { projectId: string; cover?: string }; small?: boolean }) {
  if (m.cover) return <img src={coverUrl(m.cover)} alt="" loading="lazy" decoding="async" />;
  const project = projectById(m.projectId);
  return project ? <ProjectCover project={project} small={small} /> : null;
}

/**
 * A curated event or one a person hosts, in one shape. `shared` events live
 * in the shared store (migration 011): everyone sees them, `hosted` marks
 * your own, and `youGo` says whether you are going.
 */
export type EventItem = Meetup & { hosted?: boolean; shared?: boolean; youGo?: boolean; link?: string; hostName?: string; cover?: string };

export type PublicHostedEvent = { event: HostedEvent; hostName: string; going: number; mine: boolean; youGo: boolean };

export const fromShared = ({ event: h, hostName, going, mine, youGo }: PublicHostedEvent): EventItem => ({
  id: h.id,
  title: h.title,
  kind: "talk",
  hostId: "",
  hostName: mine ? "You" : hostName,
  city: h.format === "online" ? "" : h.city,
  area: "",
  online: h.format !== "in-person",
  format: h.format,
  about: h.about,
  venue: h.format === "online" ? "Online" : h.venue,
  startsAt: h.startsAt,
  minutes: h.minutes,
  projectId: h.projectId,
  spots: h.spots,
  going,
  hosted: mine,
  shared: true,
  youGo,
  link: h.link,
  cover: h.cover,
  schedule: h.schedule,
});

/** Events people host, read from the shared store; any change on this page reloads them everywhere. */
const HOSTED_CHANGED = "kresilo-hosted-changed";
export const hostedChanged = () => window.dispatchEvent(new Event(HOSTED_CHANGED));
export function useSharedEvents(id?: string) {
  const [list, setList] = useState<PublicHostedEvent[] | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/hosted-events${id ? `?id=${encodeURIComponent(id)}` : ""}`).then((x) => x.json());
      setList(r.ok ? (r.events as PublicHostedEvent[]) : []);
    } catch {
      setList([]);
    }
  }, [id]);
  useEffect(() => {
    void load();
    window.addEventListener(HOSTED_CHANGED, load);
    return () => window.removeEventListener(HOSTED_CHANGED, load);
  }, [load]);
  return list;
}

/** Every event the person can see: the ones people host and the curated ones. */
export function useEvents(id?: string) {
  const { workspace } = useCreative();
  const shared = useSharedEvents(id);
  return useMemo(() => {
    const person = workspace?.person;
    const hosted = (shared ?? []).map(fromShared);
    return { all: [...hosted, ...meetups] as EventItem[], mine: hosted.filter((m) => m.hosted), person, loading: shared === null };
  }, [workspace, shared]);
}

/** Whether you are going: shared events know it themselves, curated ones keep it on your profile. */
export const isGoing = (m: EventItem, person?: Person) => (m.shared ? Boolean(m.youGo) : Boolean(person?.going?.includes(m.id)));

/** Dates and times in the reader's language. */
export function useWhen() {
  const { locale } = useT();
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, o);
  return {
    day: (m: Meetup) => f({ weekday: "long", day: "numeric", month: "long" }).format(new Date(m.startsAt)),
    short: (m: Meetup) => `${f({ weekday: "short", day: "numeric", month: "short" }).format(new Date(m.startsAt))} · ${f({ hour: "2-digit", minute: "2-digit" }).format(new Date(m.startsAt))}`,
    time: (m: Meetup) => {
      const start = new Date(m.startsAt),
        end = new Date(start.getTime() + m.minutes * 60000),
        t = f({ hour: "2-digit", minute: "2-digit" });
      return `${t.format(start)} – ${t.format(end)}`;
    },
    /** A schedule row's clock time ("19:30") in the reader's style. */
    clock: (t: string) => f({ hour: "2-digit", minute: "2-digit" }).format(new Date(`2000-01-01T${t}:00`)),
    month: (m: Meetup) => f({ month: "short" }).format(new Date(m.startsAt)),
    date: (m: Meetup) => new Date(m.startsAt).getDate(),
  };
}

/** Faces shown beside the going count on community events. */
export const ATTENDEES = ["nia-mensah", "ayo-bello", "marina-costa", "kareem-lalchan", "nanami-hiraoka"];

export const hostOf = (m: EventItem) => {
  const c = creatorFor(m.hostId);
  return { id: m.hostId, name: m.hostName ?? c?.name ?? "Host", maker: Boolean(c) };
};

/** Your place at one event: shows the new state at once, and keeps it while it saves. */
export function useGoing(m: EventItem | undefined) {
  const { workspace, run } = useCreative();
  const list = workspace?.person.going ?? [];
  const id = m?.id ?? "";
  const saved = m ? isGoing(m, workspace?.person) : false;
  const [pending, setPending] = useState<boolean | null>(null);
  async function set(on: boolean) {
    if (pending !== null || !workspace || !m) return;
    setPending(on);
    if (m.shared) {
      const r = await run("event.going", { id, on });
      if (!r.ok) toast.error(on ? "That event is full." : "Could not cancel. Try again.");
      hostedChanged();
    } else await run("profile.update", { going: nextGoing(list, id, on) });
    setPending(null);
  }
  return { on: pending ?? saved, saving: pending !== null, ready: Boolean(workspace), set };
}


const washCache = new Map<string, string>();

/** The colour behind an event's picture: read from the picture's pixels once it loads, from the project's palette until then. */
export function useWash(m: { id: string; projectId: string; cover?: string }, enabled = true): string {
  const project = projectById(m.projectId);
  const src = !enabled ? undefined : m.cover ? coverUrl(m.cover) : artSrc(`panel:${m.projectId}:0`);
  const fallback = useMemo(() => washFromPalette(project?.palette ?? []) ?? washFromId(m.id), [project, m.id]);
  const [read, setRead] = useState<string | null>(() => (src ? (washCache.get(src) ?? null) : null));
  useEffect(() => {
    if (!src) return setRead(null);
    const known = washCache.get(src);
    if (known) return setRead(known);
    setRead(null);
    let live = true;
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 24;
        const c = canvas.getContext("2d", { willReadFrequently: true });
        c?.drawImage(img, 0, 0, 24, 24);
        const wash = c ? washFromPixels(c.getImageData(0, 0, 24, 24).data) : null;
        if (wash) washCache.set(src, wash);
        if (live && wash) setRead(wash);
      } catch {
        // A picture the canvas may not read keeps the palette's colour.
      }
    };
    img.src = src;
    return () => {
      live = false;
    };
  }, [src]);
  return read ?? fallback;
}

/** The one big round button on an event: Register, You're going, Join, or Edit for the host. Icon only; the name is its tooltip. */
export function EventPrimary({ m, going, size }: { m: EventItem; going: ReturnType<typeof useGoing>; size: "reel" | "page" }) {
  const now = useNow();
  const [asking, setAsking] = useState(false);
  const target = joinTarget(m);
  const full = !going.on && m.going >= m.spots;
  const action = primaryAction({
    hosted: Boolean(m.hosted),
    going: going.on,
    full,
    canJoin: Boolean(target),
    // The host can always open their own room.
    joinOpen: m.hosted ? true : joinWindow(m, now) === "open",
  });
  const cls = `ev-primary${size === "page" ? " ev-big" : ""}`;
  if (asking && going.on)
    return (
      <span
        className={`${cls} ev-ask`}
        role="group"
        aria-label="Cancel registration?"
        onKeyDown={(k) => k.key === "Escape" && setAsking(false)}
        onBlur={(ev) => !ev.currentTarget.contains(ev.relatedTarget) && setAsking(false)}
      >
        <button
          type="button"
          className="ev-ask-no"
          aria-label="Cancel registration"
          title="Cancel registration"
          onClick={() => {
            setAsking(false);
            void going.set(false);
          }}
        >
          <X size={size === "page" ? 30 : 26} weight="bold" />
        </button>
        <button type="button" className="ev-ask-keep" aria-label="Keep my place" title="Keep my place" onClick={() => setAsking(false)} autoFocus>
          <Check size={size === "page" ? 30 : 26} weight="bold" />
        </button>
      </span>
    );
  const icon = size === "page" ? 34 : 30;
  if (action === "edit")
    return (
      <Link className={cls} data-action="edit" to={`/events/${m.id}/edit`} state={{ from: m.id }} aria-label="Edit" title="Edit">
        <PencilSimple size={icon} />
      </Link>
    );
  if (action === "join" && target) {
    const Icon = target.external ? VideoCamera : SquaresFour;
    return target.external ? (
      <a className={cls} data-action="join" href={target.to} target="_blank" rel="noreferrer" aria-label="Join" title="Join">
        <Icon size={icon} weight="fill" />
      </a>
    ) : (
      <Link className={cls} data-action="join" to={target.to} aria-label="Join" title="Join">
        <Icon size={icon} weight="fill" />
      </Link>
    );
  }
  const label = action === "going" ? "You're going" : action === "full" ? "Full" : "Register";
  return (
    <button
      type="button"
      className={cls}
      data-action={action}
      aria-label={label}
      aria-pressed={action === "going"}
      aria-busy={going.saving}
      title={action === "going" ? "Cancel registration" : label}
      disabled={!going.ready || going.saving || action === "full"}
      onClick={() => (going.on ? setAsking(true) : void going.set(true))}
    >
      {action === "going" ? <Check size={icon} weight="bold" /> : <Ticket size={icon} weight={action === "full" ? "regular" : "fill"} />}
    </button>
  );
}

export const pad = (n: number) => String(n).padStart(2, "0");
const icsTime = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const icsText = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

/** Saves an .ics file the reader's calendar opens. */
export function addToCalendar(m: EventItem) {
  const start = new Date(m.startsAt),
    end = new Date(start.getTime() + m.minutes * 60000);
  const where = m.format === "online" ? m.link || "Online" : `${m.venue}${m.city ? `, ${m.city}` : ""}`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kresilo//Events//EN",
    "BEGIN:VEVENT",
    `UID:${m.id}@kresilo`,
    `DTSTAMP:${icsTime(new Date())}`,
    `DTSTART:${icsTime(start)}`,
    `DTEND:${icsTime(end)}`,
    `SUMMARY:${icsText(m.title)}`,
    `LOCATION:${icsText(where)}`,
    `DESCRIPTION:${icsText(`${m.about}\n${location.origin}/events/${m.id}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = `${m.id}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Where you join, in a word: the video link's site, the jam's board, or the host's link still to come. */
export function joinLabel(m: Pick<EventItem, "format" | "link" | "boardId">): string {
  const target = joinTarget(m);
  if (!target) return "Link from the host";
  if (!target.external) return openBoardById(m.boardId ?? "")?.title ?? "Board";
  try {
    return new URL(target.to).host;
  } catch {
    return "Video link";
  }
}

