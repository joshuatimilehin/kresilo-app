import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { commands, hostedEventSchema, SCHEDULE_MAX } from "../src/creative/contracts";
import { meetups } from "../src/creative/meetupList";
import { missingFields } from "../src/creative/Meetups";
import {
  cleanSchedule,
  countGoing,
  eventSlides,
  hasTimelessRow,
  nextRowTime,
  primaryAction,
  washFromId,
  washFromPalette,
  washFromPixels,
} from "../src/creative/eventSchedule";

const base = {
  id: "h-ab12cd34",
  title: "Riso zine night",
  format: "in-person" as const,
  startsAt: "2026-11-30T18:00",
  minutes: 120,
  city: "Lisbon",
  venue: "Back room",
  link: "",
  spots: 30,
  about: "",
  projectId: "harbour-hours",
};

describe("an event's schedule", () => {
  it("curated events carry schedules in time order, inside their own length", () => {
    const withRows = meetups.filter((m) => (m.schedule ?? []).length > 0);
    expect(withRows.length).toBeGreaterThanOrEqual(6);
    for (const m of withRows) {
      const rows = m.schedule!;
      expect(cleanSchedule(rows), m.id).toEqual(rows);
      expect(rows.length, m.id).toBeLessThanOrEqual(SCHEDULE_MAX);
      expect(rows[0].time, m.id).toBe(m.startsAt.slice(11, 16));
    }
  });

  it("keeps rows that have a time and a label, soonest first, equal times in the order written", () => {
    const rows = cleanSchedule([
      { time: "19:30", label: " Closing " },
      { time: "18:00", label: "Doors" },
      { time: "18:00", label: "Welcome" },
      { time: "", label: "No time" },
      { time: "25:00", label: "Not a time" },
      { time: "18:30", label: "   " },
    ]);
    expect(rows).toEqual([
      { time: "18:00", label: "Doors" },
      { time: "18:00", label: "Welcome" },
      { time: "19:30", label: "Closing" },
    ]);
    expect(cleanSchedule(undefined)).toEqual([]);
    expect(cleanSchedule(Array.from({ length: 20 }, (_, i) => ({ time: `10:${String(i).padStart(2, "0")}`, label: `Row ${i}` })))).toHaveLength(SCHEDULE_MAX);
  });

  it("starts a new row at the event's start, then a quarter of an hour after the last row", () => {
    expect(nextRowTime([], "2026-11-30T18:00")).toBe("18:00");
    expect(nextRowTime([{ time: "18:00" }, { time: "19:10" }], "2026-11-30T18:00")).toBe("19:25");
    expect(nextRowTime([{ time: "23:50" }], "2026-11-30T18:00")).toBe("23:59");
  });

  it("is checked by the command service and refused when malformed", () => {
    const ok = { ...base, schedule: [{ time: "18:00", label: "Doors" }] };
    expect(hostedEventSchema.safeParse(ok).success).toBe(true);
    expect(commands["event.publish"].safeParse({ event: ok }).success).toBe(true);
    expect(hostedEventSchema.safeParse({ ...base, schedule: [{ time: "6pm", label: "Doors" }] }).success).toBe(false);
    expect(hostedEventSchema.safeParse({ ...base, schedule: [{ time: "18:00", label: "" }] }).success).toBe(false);
    expect(hostedEventSchema.safeParse({ ...base, schedule: [{ time: "18:00", label: "x".repeat(61) }] }).success).toBe(false);
    expect(hostedEventSchema.safeParse({ ...base, schedule: [{ time: "18:00", label: "a", extra: 1 }] }).success).toBe(false);
    expect(hostedEventSchema.safeParse({ ...base, schedule: Array.from({ length: SCHEDULE_MAX + 1 }, () => ({ time: "18:00", label: "a" })) }).success).toBe(false);
    expect(hostedEventSchema.safeParse(base).success).toBe(true);
  });

  it("stops the host saving a row that has words but no time", () => {
    expect(hasTimelessRow([{ time: "", label: "Doors" }])).toBe(true);
    expect(hasTimelessRow([{ time: "18:00", label: "Doors" }, { time: "", label: "" }])).toBe(false);
    expect(missingFields({ ...base, schedule: [{ time: "", label: "Doors" }] })).toEqual(["schedule"]);
    expect(missingFields({ ...base, schedule: [{ time: "18:00", label: "Doors" }] })).toEqual([]);
  });
});

describe("the slides of an event in the reel", () => {
  it("run cover, when and where, schedule, who is going, join", () => {
    expect(eventSlides(3)).toEqual(["cover", "when", "schedule", "going", "join"]);
  });
  it("leave out the schedule when the host wrote none", () => {
    expect(eventSlides(0)).toEqual(["cover", "when", "going", "join"]);
  });
  it("always start on the cover and end on join", () => {
    for (const n of [0, 1, 12]) {
      const s = eventSlides(n);
      expect(s[0]).toBe("cover");
      expect(s[s.length - 1]).toBe("join");
    }
  });
});

describe("the one big button", () => {
  const o = { hosted: false, going: false, full: false, canJoin: true, joinOpen: false };
  it("registers, then shows you are going, then joins once the room opens", () => {
    expect(primaryAction(o)).toBe("register");
    expect(primaryAction({ ...o, full: true })).toBe("full");
    expect(primaryAction({ ...o, going: true })).toBe("going");
    expect(primaryAction({ ...o, going: true, joinOpen: true })).toBe("join");
  });
  it("never joins an in-person event, and a full event still shows you are going", () => {
    expect(primaryAction({ ...o, going: true, joinOpen: true, canJoin: false })).toBe("going");
    expect(primaryAction({ ...o, going: true, full: true })).toBe("going");
  });
  it("lets the host open their room, else edit", () => {
    expect(primaryAction({ ...o, hosted: true })).toBe("join");
    expect(primaryAction({ ...o, hosted: true, canJoin: false })).toBe("edit");
  });
});

describe("counting who is going", () => {
  it("adds you on top of a curated event's count, and leaves the host out", () => {
    expect(countGoing({ going: 9 }, false)).toBe(9);
    expect(countGoing({ going: 9 }, true)).toBe(10);
    expect(countGoing({ going: 9, hosted: true }, true)).toBe(9);
  });
  it("trusts a shared event's count, which already holds you", () => {
    expect(countGoing({ going: 4, shared: true, youGo: true }, true)).toBe(4);
    expect(countGoing({ going: 4, shared: true, youGo: true }, false)).toBe(3);
    expect(countGoing({ going: 4, shared: true, youGo: false }, true)).toBe(5);
  });
});

describe("the colour wash", () => {
  it("takes the most vivid colour of a palette", () => {
    expect(washFromPalette(["#111111", "#f4f1ea", "#d9381e", "#777777"])).toBe("#d9381e");
    expect(washFromPalette([])).toBeNull();
    expect(washFromPalette(["nope"])).toBeNull();
  });
  it("leans toward the vivid pixels of a picture and ignores clear ones", () => {
    const px = (r: number, g: number, b: number, a = 255) => [r, g, b, a];
    const data = [...px(20, 20, 20), ...px(20, 20, 20), ...px(220, 40, 30), ...px(220, 40, 30), ...px(0, 255, 0, 0)];
    const wash = washFromPixels(data)!;
    const r = parseInt(wash.slice(1, 3), 16),
      g = parseInt(wash.slice(3, 5), 16);
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(100);
    expect(washFromPixels([0, 0, 0, 0])).toBeNull();
  });
  it("gives an event with no picture a steady colour of its own", () => {
    expect(washFromId("h-ab12cd34")).toBe(washFromId("h-ab12cd34"));
    expect(washFromId("h-ab12cd34")).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("migration 013", () => {
  const sql = readFileSync(join(__dirname, "..", "db", "migrations", "013_event_schedule.sql"), "utf8");
  it("only adds: a column with a default, then the two functions it changes", () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS schedule jsonb NOT NULL DEFAULT '\[\]'/);
    expect(sql).not.toMatch(/DROP TABLE|DROP COLUMN|DELETE FROM|TRUNCATE/i);
    expect(sql.match(/CREATE OR REPLACE FUNCTION kresilo_demo\.(\w+)/g)).toEqual([
      "CREATE OR REPLACE FUNCTION kresilo_demo.creative_hosted_list",
      "CREATE OR REPLACE FUNCTION kresilo_demo.creative_hosted_save",
    ]);
  });
  it("keeps the rules of 011: only the host changes an event, ten rows are not exceeded", () => {
    expect(sql).toMatch(/v_owner<>v_person THEN RETURN kresilo_demo\._err\('FORBIDDEN'\)/);
    expect(sql).toMatch(/jsonb_array_length\(v_rows\)>12/);
    expect(sql).toMatch(/p_event-'schedule'/);
  });
});
