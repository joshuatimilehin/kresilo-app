import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { commands, creativeFailure } from "../src/creative/contracts";
import { works } from "../src/creative/catalog";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

const work = works[0].id;
const comment = "11111111-2222-4333-8444-555555555555";
const sql = readFileSync(join(__dirname, "..", "db", "migrations", "010_work_comments.sql"), "utf8");
const store = readFileSync(join(__dirname, "..", "server", "creative", "store.ts"), "utf8");

describe("work comment commands", () => {
  beforeEach(() => {
    query.mockReset();
    query.mockImplementation(async (name: string) => {
      if (name === "creative_open") return { person: { name: "Ayo Bello" }, projects: [] };
      return {};
    });
  });

  it("are strict about their input", () => {
    expect(commands["work.comment.add"].safeParse({ workId: work, text: "Nice" }).success).toBe(true);
    expect(commands["work.comment.add"].safeParse({ workId: work, text: "  " }).success).toBe(false);
    expect(commands["work.comment.add"].safeParse({ workId: work, text: "x".repeat(1001) }).success).toBe(false);
    expect(commands["work.comment.add"].safeParse({ workId: "Not An Id", text: "Nice" }).success).toBe(false);
    expect(commands["work.comment.add"].safeParse({ workId: work, text: "Nice", author: "Someone else" }).success).toBe(false);
    expect(commands["work.comment.remove"].safeParse({ workId: work, commentId: "nope" }).success).toBe(false);
  });

  it("adds through the storage function with a fresh id, never trusting a client name", async () => {
    const r = await executeCreative("h", "work.comment.add", { workId: work, text: "  Lovely  " });
    expect(r.ok).toBe(true);
    const call = query.mock.calls.find((c) => c[0] === "creative_work_comment_add")!;
    expect(call[1]).toHaveLength(4);
    expect(call[1][0]).toBe("h");
    expect(call[1][1]).toBe(work);
    expect(call[1][2]).toMatch(/^[0-9a-f-]{36}$/);
    expect(call[1][3]).toBe("Lovely");
  });

  it("refuses a work that is not in the catalog without touching storage", async () => {
    const r = await executeCreative("h", "work.comment.add", { workId: "no-such-work", text: "Hi" });
    expect(r).toEqual(creativeFailure("NOT_FOUND"));
    expect(query.mock.calls.some((c) => c[0] === "creative_work_comment_add")).toBe(false);
  });

  it("removes through the storage function and reports a flood plainly", async () => {
    expect((await executeCreative("h", "work.comment.remove", { workId: work, commentId: comment })).ok).toBe(true);
    expect(query.mock.calls.find((c) => c[0] === "creative_work_comment_remove")![1]).toEqual(["h", work, comment]);
    query.mockImplementation(async (name: string) => {
      if (name === "creative_open") return { person: { name: "Ayo" }, projects: [] };
      throw new Error("RATE_LIMITED");
    });
    const flood = await executeCreative("h", "work.comment.add", { workId: work, text: "Hi" });
    expect(flood.ok === false && flood.message).toMatch(/Wait a minute/);
  });
});

describe("migration 010", () => {
  it("is additive and keeps comments in kresilo_demo", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS kresilo_demo\.creative_work_comments/);
    expect(sql).not.toMatch(/\b(DROP|TRUNCATE|DELETE FROM)\b/i);
    expect(sql).not.toMatch(/kresilo_research/);
  });

  it("lets only the author remove a comment, and limits floods", () => {
    const remove = sql.slice(sql.indexOf("creative_work_comment_remove"));
    expect(remove).toMatch(/person_id=v_person/);
    expect(sql).toMatch(/RATE_LIMITED/);
    expect(sql).toMatch(/LIMIT_REACHED/);
  });

  it("is reachable only through the allowlisted storage functions", () => {
    for (const fn of ["creative_work_comments_list", "creative_work_comment_add", "creative_work_comment_remove"]) {
      expect(sql).toContain(`kresilo_demo.${fn}(`);
      expect(store).toContain(fn);
    }
  });
});
