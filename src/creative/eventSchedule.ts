import { SCHEDULE_MAX, type ScheduleRow } from "./contracts";

/**
 * What the events reel and the album page work out from an event, kept free of
 * React so tests can read it: the schedule's rows, the order of an event's
 * slides, which button is the primary one, and the colour wash taken from a
 * picture.
 */

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
export const isClock = (t: string) => CLOCK.test(t);

/** Rows with a time and a label, soonest first (rows at the same time keep the order they were written), at most SCHEDULE_MAX. */
export function cleanSchedule(rows: readonly { time: string; label: string }[] | undefined): ScheduleRow[] {
  return (rows ?? [])
    .map((r) => ({ time: r.time.trim(), label: r.label.trim().slice(0, 60) }))
    .filter((r) => isClock(r.time) && r.label)
    .map((r, i) => ({ r, i }))
    .sort((a, b) => a.r.time.localeCompare(b.r.time) || a.i - b.i)
    .map(({ r }) => r)
    .slice(0, SCHEDULE_MAX);
}

/** A row someone typed a label for but gave no usable time: the form must not drop it silently. */
export const hasTimelessRow = (rows: readonly { time: string; label: string }[] | undefined) => (rows ?? []).some((r) => r.label.trim() && !isClock(r.time.trim()));

const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const fromMinutes = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

/** The time a new row starts on: a quarter of an hour after the last row, else the event's start (never past 23:59). */
export function nextRowTime(rows: readonly { time: string }[], startsAt: string): string {
  const last = [...rows].map((r) => r.time).filter(isClock).sort().pop();
  const base = last ? toMinutes(last) + 15 : toMinutes(startsAt.slice(11, 16) || "18:00");
  return fromMinutes(Math.min(base, 23 * 60 + 59));
}

/** One screen of an event's sideways row. */
export type EventSlide = "cover" | "when" | "schedule" | "going" | "join";

/** An event's slides, in order: the schedule slide only appears when the host wrote one. */
export const eventSlides = (rows: number): EventSlide[] => (rows > 0 ? ["cover", "when", "schedule", "going", "join"] : ["cover", "when", "going", "join"]);

/** The one big button on an event: what it does for this person right now. */
export type PrimaryAction = "register" | "full" | "going" | "join" | "edit";
export function primaryAction(o: { hosted: boolean; going: boolean; full: boolean; canJoin: boolean; joinOpen: boolean }): PrimaryAction {
  // The host edits, unless there is a room to open.
  if (o.hosted) return o.canJoin ? "join" : "edit";
  if (o.going) return o.canJoin && o.joinOpen ? "join" : "going";
  return o.full ? "full" : "register";
}

/** How many are going once your own choice is counted. Shared events already count you; curated ones add you on top of their sample count. */
export function countGoing(m: { shared?: boolean; hosted?: boolean; youGo?: boolean; going: number }, on: boolean): number {
  if (m.shared) return m.going + (on === Boolean(m.youGo) ? 0 : on ? 1 : -1);
  return m.going + (on && !m.hosted ? 1 : 0);
}

const hexRgb = (hex: string): [number, number, number] | null => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

/** How much a colour has to say: saturated and neither near-black nor near-white. */
function vividness([r, g, b]: [number, number, number]): number {
  const max = Math.max(r, g, b) / 255,
    min = Math.min(r, g, b) / 255,
    light = (max + min) / 2;
  const sat = max === min ? 0 : (max - min) / (1 - Math.abs(2 * light - 1));
  return sat * (1 - Math.abs(light - 0.45) * 1.6);
}

/** The colour of a palette that carries the picture best, for the wash behind it. */
export function washFromPalette(colours: readonly string[]): string | null {
  let best: { hex: string; v: number } | null = null;
  for (const c of colours) {
    const rgb = hexRgb(c);
    if (!rgb) continue;
    const v = vividness(rgb);
    if (!best || v > best.v) best = { hex: toHex(...rgb), v };
  }
  return best?.hex ?? null;
}

/** The wash from a picture's pixels (RGBA, as a canvas gives them): the average, weighted toward vivid pixels. */
export function washFromPixels(data: ArrayLike<number>): string | null {
  let r = 0,
    g = 0,
    b = 0,
    w = 0;
  for (let i = 0; i + 3 < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const px: [number, number, number] = [data[i], data[i + 1], data[i + 2]];
    const weight = 0.1 + Math.max(0, vividness(px));
    r += px[0] * weight;
    g += px[1] * weight;
    b += px[2] * weight;
    w += weight;
  }
  return w ? toHex(r / w, g / w, b / w) : null;
}

/** A steady colour for an event with no picture to read: from its id. */
export function washFromId(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = h % 360;
  // HSL(hue, 45%, 40%) as hex.
  const s = 0.45,
    l = 0.4,
    a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return toHex(f(0) * 255, f(8) * 255, f(4) * 255);
}
