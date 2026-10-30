import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { commands } from "../src/creative/contracts";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

const sql = readFileSync(join(__dirname, "..", "db", "migrations", "011_public_events.sql"), "utf8");
const store = readFileSync(join(__dirname, "..", "server", "creative", "store.ts"), "utf8");
const event = {
  id: "h-ab12cd34",
  title: "Riso zine night",
  format: "online",
  startsAt: "2026-11-30T18:00",
  minutes: 120,
  city: "",
  venue: "",
  link: "https://meet.example.com/riso",
  spots: 30,
  about: "Print a zine together.",
  projectId: "harbour-hours",
};

describe("public hosted events", () => {
  beforeEach(() => {
    query.mockReset();
    query.mockImplementation(async (name: string) => (name === "creative_open" ? { person: { name: "Ayo" }, projects: [] } : {}));
  });

  it("are strict about their input", () => {
    expect(commands["event.publish"].safeParse({ event }).success).toBe(true);
    expect(commands["event.publish"].safeParse({ event: { ...event, link: "javascript:alert(1)" } }).success).toBe(false);
    expect(commands["event.publish"].safeParse({ event, hostId: "someone" }).success).toBe(false);
    expect(commands["event.remove"].safeParse({ id: "../etc" }).success).toBe(false);
    expect(commands["event.going"].safeParse({ id: event.id, on: true }).success).toBe(true);
    expect(commands["event.going"].safeParse({ id: event.id, on: "yes" }).success).toBe(false);
  });

  it("publish, take down and going go through their storage functions with the session", async () => {
    expect((await executeCreative("h", "event.publish", { event })).ok).toBe(true);
    expect((await executeCreative("h", "event.remove", { id: event.id })).ok).toBe(true);
    expect((await executeCreative("h", "event.going", { id: event.id, on: true })).ok).toBe(true);
    const calls = Object.fromEntries(query.mock.calls.filter((c) => String(c[0]).startsWith("creative_hosted")).map((c) => [c[0], c[1]]));
    expect(calls.creative_hosted_save).toEqual(["h", event]);
    expect(calls.creative_hosted_remove).toEqual(["h", event.id]);
    expect(calls.creative_hosted_going).toEqual(["h", event.id, true]);
  });

  it("only the host may change or remove an event, and full events take no one new", () => {
    expect(sql).toMatch(/v_owner<>v_person THEN RETURN kresilo_demo\._err\('FORBIDDEN'\)/);
    expect(sql.slice(sql.indexOf("creative_hosted_remove"))).toMatch(/host_id=v_person/);
    expect(sql).toMatch(/>=v_spots THEN RETURN kresilo_demo\._err\('LIMIT_REACHED'\)/);
  });

  it("is reachable only through the allowlisted storage functions", () => {
    for (const fn of ["creative_hosted_list", "creative_hosted_save", "creative_hosted_remove", "creative_hosted_going"]) {
      expect(sql).toContain(`kresilo_demo.${fn}(`);
      expect(store).toContain(fn);
    }
  });
});
