import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { commands, creativeFailure } from "../src/creative/contracts";
import { canFollow, isPersonId, mergeFollowing, splitFollowing, withFollow } from "../src/creative/follows";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";
import { withAuthors } from "../server/creative/follows";

const me = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const them = "11111111-2222-4333-8444-555555555555";
const sql = readFileSync(join(__dirname, "..", "db", "migrations", "017_follows.sql"), "utf8");
const store = readFileSync(join(__dirname, "..", "server", "creative", "store.ts"), "utf8");

describe("follow commands", () => {
  beforeEach(() => {
    query.mockReset();
    query.mockImplementation(async (name: string) => (name === "creative_open" ? { person: { id: me, name: "Ayo", following: [] }, projects: [] } : {}));
  });

  it("are strict about their input", () => {
    expect(commands["follow.set"].safeParse({ id: them, on: true }).success).toBe(true);
    expect(commands["follow.set"].safeParse({ id: "ayo-bello", on: false }).success).toBe(true);
    expect(commands["follow.set"].safeParse({ id: "Not An Id", on: true }).success).toBe(false);
    expect(commands["follow.set"].safeParse({ id: them }).success).toBe(false);
    expect(commands["follow.set"].safeParse({ id: them, on: true, follower: "someone" }).success).toBe(false);
    expect(commands["follow.migrate"].safeParse({}).success).toBe(true);
    expect(commands["follow.migrate"].safeParse({ ids: ["x"] }).success).toBe(false);
  });

  it("follows and unfollows through the storage function with the session, and answers with the fresh profile", async () => {
    const on = await executeCreative("h", "follow.set", { id: them, on: true });
    expect(on.ok).toBe(true);
    expect(on.ok && on.workspace?.person.id).toBe(me);
    expect((await executeCreative("h", "follow.set", { id: them, on: false })).ok).toBe(true);
    const calls = query.mock.calls.filter((c) => c[0] === "creative_follow_set").map((c) => c[1]);
    expect(calls).toEqual([
      ["h", them, true],
      ["h", them, false],
    ]);
  });

  it("repeating a follow or an unfollow is a plain success each time", async () => {
    for (const on of [true, true, false, false]) expect((await executeCreative("h", "follow.set", { id: "ayo-bello", on })).ok).toBe(true);
  });

  it("refuses to follow yourself without touching storage", async () => {
    const r = await executeCreative("h", "follow.set", { id: me, on: true });
    expect(r).toEqual(creativeFailure("SELF_FOLLOW"));
    expect(r.ok === false && r.message).toBe("You cannot follow yourself.");
    expect(query.mock.calls.some((c) => c[0] === "creative_follow_set")).toBe(false);
  });

  it("reports what storage refuses plainly", async () => {
    query.mockImplementation(async (name: string) => {
      if (name === "creative_open") return { person: { id: me, name: "Ayo", following: [] }, projects: [] };
      throw new Error("NOT_FOUND");
    });
    expect((await executeCreative("h", "follow.set", { id: them, on: true })).ok).toBe(false);
  });

  it("moves the follows kept in the profile to the server", async () => {
    const r = await executeCreative("h", "follow.migrate", {});
    expect(r.ok).toBe(true);
    expect(query.mock.calls.find((c) => c[0] === "creative_follow_migrate")![1]).toEqual(["h"]);
  });
});

describe("who is followed", () => {
  it("reads the server's follows and the profile's older ones together, once each", () => {
    expect(mergeFollowing([them, "ayo-bello"], ["Ayo-Bello", "ines-ferreira"])).toEqual([them, "ayo-bello", "ines-ferreira"]);
    expect(mergeFollowing([], [])).toEqual([]);
  });

  it("splits roster makers from people", () => {
    const isMaker = (id: string) => id === "ayo-bello";
    expect(splitFollowing(["ayo-bello", them, "gone-maker"], isMaker)).toEqual({ makers: ["ayo-bello"], people: [them] });
  });

  it("changes the list once however often a follow or unfollow repeats", () => {
    expect(withFollow(withFollow(["a"], them, true), them, true)).toEqual([them, "a"]);
    expect(withFollow(withFollow([them, "a"], them, false), them, false)).toEqual(["a"]);
  });

  it("offers a follow button next to anyone but the viewer", () => {
    expect(canFollow(me, them)).toBe(true);
    expect(canFollow(me, "ayo-bello")).toBe(true);
    expect(canFollow(me, me)).toBe(false);
    expect(canFollow(me, undefined)).toBe(false);
    expect(canFollow(undefined, them)).toBe(true);
    expect(isPersonId(them)).toBe(true);
    expect(isPersonId("ayo-bello")).toBe(false);
  });
});

describe("authors of posts and comments", () => {
  beforeEach(() => {
    query.mockReset();
  });

  it("adds the author's id where the server knows it", async () => {
    query.mockResolvedValue({ c1: them });
    const out = await withAuthors([{ id: "c1", text: "Hi" }, { id: "c2", text: "Seed" }]);
    expect(query).toHaveBeenCalledWith("creative_authors", [["c1", "c2"]]);
    expect(out).toEqual([{ id: "c1", text: "Hi", authorId: them }, { id: "c2", text: "Seed" }]);
  });

  it("leaves the list as it is when authors cannot be read, as before the migration", async () => {
    query.mockImplementation(async () => {
      throw new Error("STORAGE_ERROR");
    });
    expect(await withAuthors([{ id: "c1" }])).toEqual([{ id: "c1" }]);
    expect(await withAuthors([])).toEqual([]);
  });
});

describe("migration 017", () => {
  it("is additive, keyed by follower and followed, and never lets anyone follow themselves", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS kresilo_demo\.creative_follows/);
    expect(sql).toMatch(/PRIMARY KEY \(follower, followed\)/);
    expect(sql).toMatch(/followed <> follower::text/);
    expect(sql).not.toMatch(/DROP |TRUNCATE|DELETE FROM kresilo_demo\.creative_people/i);
  });

  it("follows idempotently, refuses self and unknown people, and drops the old profile copy", () => {
    expect(sql).toMatch(/ON CONFLICT DO NOTHING/);
    expect(sql).toMatch(/_err\('SELF_FOLLOW'\)/);
    expect(sql).toMatch(/_err\('NOT_FOUND'\)/);
    expect(sql).toMatch(/_err\('SESSION_INVALID'\)/);
    expect(sql).toMatch(/jsonb_set\(profile,'\{following\}'/);
  });

  it("moves the profile's follows into the table and empties the profile list", () => {
    const fn = sql.slice(sql.indexOf("creative_follow_migrate"), sql.indexOf("creative_follows_mine"));
    expect(fn).toMatch(/INSERT INTO kresilo_demo\.creative_follows/);
    expect(fn).toMatch(/jsonb_set\(profile,'\{following\}','\[\]'/);
  });

  it("builds the feed from community posts that are not withdrawn, by followed people only, never the viewer's own", () => {
    const fn = sql.slice(sql.indexOf("creative_following_feed"), sql.indexOf("creative_authors"));
    expect(fn).toMatch(/audience='community' AND pu\.withdrawn_at IS NULL/);
    expect(fn).toMatch(/pr\.owner_id::text IN \(SELECT followed FROM kresilo_demo\.creative_follows WHERE follower=v_person\)/);
    expect(fn).toMatch(/pr\.owner_id<>v_person/);
  });

  it("is reachable only through the store's allow-list", () => {
    for (const name of [
      "creative_follow_set",
      "creative_follow_migrate",
      "creative_follows_mine",
      "creative_follow_counts",
      "creative_person_public",
      "creative_following_feed",
      "creative_authors",
    ]) {
      expect(sql).toContain(`FUNCTION kresilo_demo.${name}(`);
      expect(store).toContain(name);
    }
  });
});
