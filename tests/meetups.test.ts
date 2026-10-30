import { describe, expect, it } from "vitest";
import { meetups, nearYou } from "../src/creative/meetupList";
import { projectById } from "../src/creative/portfolio";
import { makerById } from "../src/creative/makers";
import { openBoardById } from "../src/creative/openBoards";
import { commands, hostedEventSchema, type HostedEvent } from "../src/creative/contracts";
import { defaultCover, formatParam, joinLabel, joinTarget, joinWindow, missingFields, nextGoing } from "../src/creative/Meetups";

describe("events", () => {
  it("are hosted by a real roster maker, pictured by one of their projects, with sane numbers", () => {
    const ids = new Set<string>();
    for (const m of meetups) {
      expect(ids.has(m.id), m.id).toBe(false);
      ids.add(m.id);
      expect(makerById(m.hostId), m.id).toBeDefined();
      expect(projectById(m.projectId)?.makerId, m.id).toBe(m.hostId);
      if (m.boardId) expect(openBoardById(m.boardId), m.id).toBeDefined();
      expect(m.going).toBeLessThanOrEqual(m.spots);
      expect(Number.isNaN(Date.parse(m.startsAt)), m.id).toBe(false);
      expect(m.online || m.city.length > 0, m.id).toBe(true);
    }
  });

  it("puts the person's own city first, then online events", () => {
    const list = nearYou(meetups, "Lima, Peru");
    expect(list[0].city).toBe("Lima");
    expect(list.some((m) => m.online)).toBe(true);
    expect(list.every((m) => m.city === "Lima" || m.online)).toBe(true);
  });

  it("shows everything when the profile has no city", () => {
    expect(nearYou(meetups, undefined)).toHaveLength(meetups.length);
  });

  it("say where they happen, and online-ness follows the format", () => {
    for (const m of meetups) {
      expect(["in-person", "online", "hybrid"], m.id).toContain(m.format);
      expect(m.online, m.id).toBe(m.format !== "in-person");
      expect(m.format === "online" || m.city.length > 0, m.id).toBe(true);
      expect(m.about.length, m.id).toBeGreaterThan(20);
    }
    expect(meetups.some((m) => m.format === "hybrid")).toBe(true);
  });
});

describe("hosting an event", () => {
  const event = {
    id: "h-ab12cd34",
    title: "Riso zine night",
    format: "hybrid",
    startsAt: "2026-11-30T18:00",
    minutes: 120,
    city: "Lisbon",
    venue: "Back room, 14 Rua das Flores",
    link: "https://meet.example.com/riso",
    spots: 30,
    about: "Print a two-colour zine together.",
    projectId: "harbour-hours",
  };
  it("keeps a well-formed event on the profile", () => {
    expect(hostedEventSchema.safeParse(event).success).toBe(true);
    expect(commands["profile.update"].safeParse({ hosting: [event] }).success).toBe(true);
  });
  it("refuses links that are not https, odd ids and empty titles", () => {
    expect(hostedEventSchema.safeParse({ ...event, link: "http://meet.example.com" }).success).toBe(false);
    expect(hostedEventSchema.safeParse({ ...event, link: "javascript:alert(1)" }).success).toBe(false);
    expect(hostedEventSchema.safeParse({ ...event, id: "evil id" }).success).toBe(false);
    expect(hostedEventSchema.safeParse({ ...event, title: "  " }).success).toBe(false);
    expect(hostedEventSchema.safeParse({ ...event, link: "" }).success).toBe(true);
  });
});

describe("the events page", () => {
  it("reads the format filter from the URL and falls back to all", () => {
    expect(formatParam("online")).toBe("online");
    expect(formatParam("in-person")).toBe("in-person");
    expect(formatParam("hybrid")).toBe("hybrid");
    expect(formatParam(null)).toBe("all");
    expect(formatParam("moon")).toBe("all");
  });

  it("registers once and cancels cleanly", () => {
    expect(nextGoing(["a"], "b", true)).toEqual(["a", "b"]);
    expect(nextGoing(["a", "b"], "b", true)).toEqual(["a", "b"]);
    expect(nextGoing(["a", "b"], "a", false)).toEqual(["b"]);
    expect(nextGoing(Array.from({ length: 100 }, (_, i) => `e${i}`), "new", true)).toHaveLength(100);
  });

  const base: HostedEvent = {
    id: "h-ab12cd34",
    title: "Riso zine night",
    format: "in-person",
    startsAt: "2026-11-30T18:00",
    minutes: 120,
    city: "",
    venue: "",
    link: "",
    spots: 30,
    about: "",
    projectId: "harbour-hours",
  };
  it("names the missing required fields in form order", () => {
    expect(missingFields(base)).toEqual(["venue", "city"]);
    expect(missingFields({ ...base, format: "hybrid", title: " ", link: "http://x" })).toEqual(["title", "venue", "city", "link"]);
    expect(missingFields({ ...base, format: "online" })).toEqual(["link"]);
    expect(missingFields({ ...base, format: "online", link: "https://meet.example.com/riso" })).toEqual([]);
    expect(missingFields({ ...base, venue: "Back room", city: "Lisbon" })).toEqual([]);
    expect(missingFields({ ...base, format: "online", startsAt: "T" })).toEqual(["date", "time", "link"]);
  });

  it("starts a new event on your newest project's cover, and an edited one on its own", () => {
    expect(defaultCover(base, true, ["p1", "p2"])).toEqual({ kind: "own", id: "p1" });
    expect(defaultCover(base, true, [])).toEqual({ kind: "case", id: "harbour-hours" });
    expect(defaultCover(base, false, ["p1"])).toEqual({ kind: "case", id: "harbour-hours" });
    const ref = `0f8fad5b-d9cb-469f-a165-70867728950e.${"a".repeat(32)}`;
    expect(defaultCover({ ...base, cover: ref }, false, ["p1"])).toEqual({ kind: "ref", ref });
  });
});

describe("joining an online event", () => {
  const jam = meetups.find((m) => m.id === "harbour-poster-jam")!;
  const review = meetups.find((m) => m.id === "portfolio-review-online")!;
  const room = { format: "online" as const, link: "https://meet.example.com/riso" };

  it("opens the host's video link, else the jam's board, and nothing in person", () => {
    expect(joinTarget(room)).toEqual({ to: room.link, external: true });
    expect(joinTarget({ ...jam, link: undefined })).toEqual({ to: "/boards/harbour-hours-night-crossings", external: false });
    expect(joinTarget({ format: "in-person", link: room.link })).toBeNull();
    expect(joinTarget(review)).toBeNull();
  });

  it("names where you join in a word", () => {
    expect(joinLabel(room)).toBe("meet.example.com");
    expect(joinLabel(jam)).toBe("Night crossings");
    expect(joinLabel(review)).toBe("Link from the host");
  });

  it("opens a quarter of an hour early and closes when the event ends", () => {
    const start = new Date(jam.startsAt).getTime();
    expect(joinWindow(jam, start - 16 * 60000)).toBe("soon");
    expect(joinWindow(jam, start - 14 * 60000)).toBe("open");
    expect(joinWindow(jam, start + (jam.minutes - 1) * 60000)).toBe("open");
    expect(joinWindow(jam, start + jam.minutes * 60000)).toBe("over");
  });
});
