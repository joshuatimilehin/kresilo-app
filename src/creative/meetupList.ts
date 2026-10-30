/**
 * Community events run by makers: workshops, talks, portfolio reviews, markets
 * and live jams (a jam opens a shared board). The picture is the cover of the
 * case study the event grows out of. "Near you" matches the city or area on a
 * person's profile. (Named meetups, not events: events.ts is the usage log.)
 */
import type { ScheduleRow } from "./contracts";

export type MeetupKind = "workshop" | "talk" | "review" | "market" | "jam";
/** Where it happens: in a room, online, or both at once. */
export type MeetupFormat = "in-person" | "online" | "hybrid";

export type Meetup = {
  id: string;
  title: string;
  kind: MeetupKind;
  hostId: string;
  /** City, as on a maker's profile; empty for online-only. */
  city: string;
  area: string;
  /** True when people can take part online (online and hybrid events). */
  online: boolean;
  format: MeetupFormat;
  /** What happens, in the host's words. */
  about: string;
  venue: string;
  /** Local start time as ISO, and length in minutes. */
  startsAt: string;
  minutes: number;
  /** The case study whose cover pictures the event. */
  projectId: string;
  /** For a jam: the open board people join. */
  boardId?: string;
  spots: number;
  going: number;
  featured?: boolean;
  /** The running order, soonest first; the schedule slide and the event page's tracklist. */
  schedule?: ScheduleRow[];
};

export const meetups: readonly Meetup[] = [
  {
    id: "sumi-roundels-kanazawa",
    title: "Brush marks on washi",
    kind: "workshop",
    hostId: "nanami-hiraoka",
    city: "Kanazawa",
    area: "Asia",
    online: false,
    format: "in-person",
    about:
      "Bring a brush you like and leave with twelve garden-window marks on handmade washi. Ink, paper and tea are on the table; the last hour is a quiet critique by the window.",
    venue: "Upstairs at a paper shop, Higashi Chaya",
    startsAt: "2026-11-14T14:00",
    minutes: 180,
    projectId: "hatsushimo-tea-house",
    spots: 12,
    going: 9,
    schedule: [
      { time: "14:00", label: "Tea and ink on the table" },
      { time: "14:30", label: "Warm-up: one stroke, twenty times" },
      { time: "15:15", label: "Twelve garden-window marks" },
      { time: "16:30", label: "Quiet critique by the window" },
    ],
    featured: true,
  },
  {
    id: "night-signs-tainan",
    title: "Night-market lettering walk",
    kind: "talk",
    hostId: "wei-chen-kao",
    city: "Tainan",
    area: "Asia",
    online: false,
    format: "in-person",
    about:
      "A slow walk past the hand-painted signs of the night market: who painted them, which brushes, and why the strokes lean the way they do. Sketchbooks welcome.",
    venue: "Meets at the north gate of the night market",
    startsAt: "2026-11-21T19:30",
    minutes: 90,
    projectId: "shuiyue-night-market-lights",
    spots: 25,
    going: 18,
    schedule: [
      { time: "19:30", label: "Meet at the north gate" },
      { time: "19:45", label: "The oldest painted sign" },
      { time: "20:30", label: "Brushes, paint and lean" },
      { time: "20:55", label: "Sketch one sign" },
    ],
  },
  {
    id: "harbour-poster-jam",
    title: "Night crossings poster jam",
    kind: "jam",
    hostId: "ayo-bello",
    city: "Lagos",
    area: "Africa",
    online: true,
    format: "online",
    about:
      "Two hours on one shared board: everyone makes a poster for a single ferry crossing, then we line them up as a timetable. Join from anywhere.",
    venue: "Online, on the open board",
    startsAt: "2026-11-08T18:00",
    minutes: 120,
    projectId: "harbour-hours",
    boardId: "harbour-hours-night-crossings",
    spots: 40,
    going: 27,
    schedule: [
      { time: "18:00", label: "Board opens" },
      { time: "18:15", label: "Pick a ferry crossing" },
      { time: "19:00", label: "Posters in progress" },
      { time: "19:45", label: "Line them up as a timetable" },
    ],
    featured: true,
  },
  {
    id: "block-print-jaipur",
    title: "Carve and print a border block",
    kind: "workshop",
    hostId: "ritika-dhabhai",
    city: "Jaipur",
    area: "Asia",
    online: false,
    format: "in-person",
    about:
      "Carve a small border block in the morning and print it along a length of cotton after lunch. Blocks, tools and dyes provided.",
    venue: "Print table, Sanganer",
    startsAt: "2026-11-29T10:00",
    minutes: 240,
    projectId: "neelgarh-linen",
    spots: 10,
    going: 10,
    schedule: [
      { time: "10:00", label: "Choose a border" },
      { time: "10:30", label: "Carve the block" },
      { time: "12:30", label: "Lunch" },
      { time: "13:30", label: "Print along the cotton" },
      { time: "15:30", label: "Dyes dry, wrap up" },
    ],
  },
  {
    id: "chicha-type-lima",
    title: "Fluorescent poster type, live",
    kind: "workshop",
    hostId: "lucero-huamani",
    city: "Lima",
    area: "Latin America and the Caribbean",
    online: false,
    format: "in-person",
    about:
      "Fluorescent lettering in the screen room: we draw one poster together, pull the prints live and hang them to dry before the band starts.",
    venue: "Screen room under the venue, Barranco",
    startsAt: "2026-12-05T17:00",
    minutes: 150,
    projectId: "bajo-nivel-posters",
    spots: 16,
    going: 11,
    schedule: [
      { time: "17:00", label: "Sketch the poster type" },
      { time: "17:45", label: "Pull the first prints" },
      { time: "18:45", label: "Hang them to dry" },
      { time: "19:15", label: "The band starts" },
    ],
    featured: true,
  },
  {
    id: "portfolio-review-online",
    title: "Portfolio review: identities",
    kind: "review",
    hostId: "kareem-lalchan",
    city: "",
    area: "",
    online: true,
    format: "online",
    about:
      "Bring one identity project. Ten minutes each: what works, what to cut and how to tell the story in three images.",
    venue: "Online, cameras optional",
    startsAt: "2026-11-11T16:00",
    minutes: 90,
    projectId: "street-calendar",
    spots: 8,
    going: 5,
    schedule: [
      { time: "16:00", label: "Hello and order of play" },
      { time: "16:10", label: "Ten minutes each" },
      { time: "17:15", label: "What to cut" },
      { time: "17:25", label: "Three images, one story" },
    ],
  },
  {
    id: "makers-market-dakar",
    title: "Makers' market and swap",
    kind: "market",
    hostId: "ibou-sarr",
    city: "Dakar",
    area: "Africa",
    online: false,
    format: "in-person",
    about:
      "Stalls for prints, cloth, stickers and zines in a tailoring courtyard. Swap a piece of your own for someone else's, or just come and look.",
    venue: "Courtyard of a tailoring studio, Médina",
    startsAt: "2026-12-12T11:00",
    minutes: 300,
    projectId: "six-yards",
    spots: 200,
    going: 64,
    schedule: [
      { time: "11:00", label: "Stalls open" },
      { time: "13:00", label: "Swap hour" },
      { time: "15:00", label: "Zine corner reading" },
      { time: "16:00", label: "Last call" },
    ],
  },
  {
    id: "station-murals-jam",
    title: "Station murals jam",
    kind: "jam",
    hostId: "marina-costa",
    city: "São Paulo",
    area: "Latin America and the Caribbean",
    online: true,
    format: "online",
    about:
      "A live jam on the station murals board: pick a wall, sketch a panel and see the whole platform come together by the end of the evening.",
    venue: "Online, on the open board",
    startsAt: "2026-11-18T20:00",
    minutes: 120,
    projectId: "metro-moves",
    boardId: "metro-moves-station-murals",
    spots: 30,
    going: 22,
    schedule: [
      { time: "20:00", label: "Pick a wall" },
      { time: "20:20", label: "Sketch your panel" },
      { time: "21:10", label: "Walk the whole platform" },
      { time: "21:50", label: "Last panel in" },
    ],
  },
  {
    id: "lacquer-layers-hanoi",
    title: "Lacquer layers, one panel a day",
    kind: "talk",
    hostId: "vu-bao-ngan",
    city: "Hanoi",
    area: "Asia",
    online: true,
    format: "hybrid",
    about:
      "How one lacquer panel grows a layer a day, shown with the real panels in the roastery and streamed for anyone who can't be there. Questions from both rooms.",
    venue: "A coffee roastery in Tây Hồ, and streamed live",
    startsAt: "2026-12-02T18:30",
    minutes: 75,
    projectId: "suong-som-harvest-posters",
    spots: 30,
    going: 17,
    schedule: [
      { time: "18:30", label: "Doors open and stream live" },
      { time: "18:40", label: "One layer a day" },
      { time: "19:10", label: "Panels up close" },
      { time: "19:30", label: "Questions from both rooms" },
    ],
  },
  {
    id: "packaging-review-addis",
    title: "Packaging review, bring a box",
    kind: "review",
    hostId: "mahlet-tesfaye",
    city: "Addis Ababa",
    area: "Africa",
    online: true,
    format: "hybrid",
    about:
      "Bring a box, a bag or a label. Feedback in the tasting room and over video, with coffee for everyone who comes in person.",
    venue: "Roastery tasting room, Bole, and on video",
    startsAt: "2026-11-26T15:00",
    minutes: 120,
    projectId: "tilet-roasters",
    spots: 14,
    going: 6,
    schedule: [
      { time: "15:00", label: "Coffee in the tasting room" },
      { time: "15:20", label: "Boxes on the table" },
      { time: "16:10", label: "Bags and labels on video" },
      { time: "16:50", label: "One thing to change" },
    ],
  },
];

export const meetupById = (id: string) => meetups.find((m) => m.id === id);

/** Soonest first. */
export const byDate = (list: readonly Meetup[]) => [...list].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

/**
 * Events near a person: in their city, else in their area, plus everything
 * online. With no location, everything shows.
 */
export function nearYou(list: readonly Meetup[], location: string | undefined, area?: string): Meetup[] {
  const where = (location ?? "").toLowerCase();
  if (!where.trim()) return byDate(list);
  const local = list.filter((m) => m.city && where.includes(m.city.toLowerCase()));
  const regional = area ? list.filter((m) => !local.includes(m) && m.area === area) : [];
  const online = list.filter((m) => m.online && !local.includes(m) && !regional.includes(m));
  return [...byDate(local), ...byDate(regional), ...byDate(online)];
}
