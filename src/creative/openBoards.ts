import type { MemberRole } from "./contracts";
import { meetups, type Meetup } from "./meetupList";

/**
 * Open boards: projects whose team invites people in. These are run by the
 * fictional makers (meetupList.ts may open one with a live jam); each one builds on one of their case
 * studies, so its picture is that study's cover. A real person's board is a
 * database row (boardRequests.ts); asking to join either kind is a real request.
 */
export type BoardActivity = { who: string; what: "layer" | "comment" | "version" | "approve"; minutesAgo: number };

export type OpenBoard = {
  id: string;
  title: string;
  /** The sample maker who runs the board. */
  hostId: string;
  /** The case study the board continues; its cover is the board's picture. */
  projectId: string;
  members: string[];
  wanted: MemberRole[];
  tags: string[];
  activity: BoardActivity[];
};

export const openBoards: readonly OpenBoard[] = [
  {
    id: "harbour-hours-night-crossings",
    title: "Night crossings",
    hostId: "ayo-bello",
    projectId: "harbour-hours",
    members: ["ayo-bello", "nia-mensah", "kareem-lalchan"],
    wanted: ["Motion", "Type"],
    tags: ["campaign", "transport", "lagos"],
    activity: [
      { who: "nia-mensah", what: "layer", minutesAgo: 3 },
      { who: "ayo-bello", what: "comment", minutesAgo: 9 },
      { who: "kareem-lalchan", what: "version", minutesAgo: 41 },
    ],
  },
  {
    id: "loom-and-line-market-tags",
    title: "Market tags",
    hostId: "nia-mensah",
    projectId: "loom-and-line",
    members: ["nia-mensah", "ines-duarte"],
    wanted: ["Design", "Feedback"],
    tags: ["packaging", "textile"],
    activity: [
      { who: "ines-duarte", what: "approve", minutesAgo: 12 },
      { who: "nia-mensah", what: "layer", minutesAgo: 26 },
    ],
  },
  {
    id: "metro-moves-station-murals",
    title: "Station murals",
    hostId: "marina-costa",
    projectId: "metro-moves",
    members: ["marina-costa", "arief-pranata", "hana-zerrouki", "ren-sato"],
    wanted: ["Design"],
    tags: ["spatial", "illustration"],
    activity: [
      { who: "arief-pranata", what: "layer", minutesAgo: 1 },
      { who: "hana-zerrouki", what: "comment", minutesAgo: 5 },
      { who: "marina-costa", what: "version", minutesAgo: 18 },
    ],
  },
  {
    id: "lantern-books-reading-posters",
    title: "Reading posters",
    hostId: "leila-haddad",
    projectId: "lantern-books",
    members: ["leila-haddad", "radek-zawisza"],
    wanted: ["Type", "Feedback"],
    tags: ["editorial", "type"],
    activity: [
      { who: "radek-zawisza", what: "layer", minutesAgo: 22 },
      { who: "leila-haddad", what: "comment", minutesAgo: 35 },
    ],
  },
  {
    id: "monsoon-reel-rain-loops",
    title: "Rain loops",
    hostId: "mira-kesavan",
    projectId: "monsoon-reel",
    members: ["mira-kesavan", "dorian-voss", "elin-brandvold"],
    wanted: ["Motion"],
    tags: ["motion", "weather"],
    activity: [
      { who: "dorian-voss", what: "version", minutesAgo: 7 },
      { who: "elin-brandvold", what: "comment", minutesAgo: 14 },
    ],
  },
  {
    id: "plant-pantry-jar-labels",
    title: "Jar labels",
    hostId: "ximena-torrealba",
    projectId: "plant-pantry",
    members: ["ximena-torrealba", "wren-calloway"],
    wanted: ["Design", "Type"],
    tags: ["packaging", "food"],
    activity: [
      { who: "wren-calloway", what: "layer", minutesAgo: 4 },
      { who: "ximena-torrealba", what: "approve", minutesAgo: 30 },
    ],
  },
  {
    id: "neon-static-after-hours",
    title: "After hours",
    hostId: "dorian-voss",
    projectId: "neon-static",
    members: ["dorian-voss", "madina-yesenova"],
    wanted: ["Motion", "Feedback"],
    tags: ["motion", "night"],
    activity: [
      { who: "madina-yesenova", what: "comment", minutesAgo: 16 },
      { who: "dorian-voss", what: "layer", minutesAgo: 52 },
    ],
  },
  {
    id: "street-calendar-twelve-corners",
    title: "Twelve corners",
    hostId: "kareem-lalchan",
    projectId: "street-calendar",
    members: ["kareem-lalchan", "neema-waweru", "rook-and-delaney"],
    wanted: ["Design", "Type", "Motion"],
    tags: ["print", "culture"],
    activity: [
      { who: "neema-waweru", what: "layer", minutesAgo: 2 },
      { who: "rook-and-delaney", what: "version", minutesAgo: 11 },
      { who: "kareem-lalchan", what: "comment", minutesAgo: 27 },
    ],
  },
];

export const openBoardById = (id: string) => openBoards.find((b) => b.id === id);

/** Minutes since anyone last worked on the board. */
export const lastActive = (b: OpenBoard) => Math.min(...b.activity.map((a) => a.minutesAgo));

/** The live jam that opens this board, if it has one. */
export const boardEvent = (b: OpenBoard): Meetup | undefined => meetups.find((m) => m.boardId === b.id);

/**
 * A board is live only while the jam that opens it is running. Without a jam
 * (or outside it) the board shows when someone last worked on it.
 */
export function isLive(b: OpenBoard, now = new Date()): boolean {
  const m = boardEvent(b);
  if (!m) return false;
  const start = new Date(m.startsAt).getTime();
  return now.getTime() >= start && now.getTime() < start + m.minutes * 60000;
}
