import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveSaved } from "../src/creative/SavedItems";

describe("public moodboards", () => {
  it("resolves saved keys, and skips what is no longer listed", () => {
    const items = resolveSaved(["case:harbour-hours", "work:nope", "post:abc", "case:missing", "collection:nope"]);
    expect(items.map((i) => i.kind)).toEqual(["case", "post"]);
  });

  it("reads only public boards, through its own allowlisted function and route", () => {
    const sql = readFileSync("db/migrations/018_public_moodboards.sql", "utf8");
    expect(sql).toContain("coalesce((b->>'public')::boolean,false)");
    expect(sql).toContain("RETURN kresilo_demo._err('NOT_FOUND')");
    expect(sql.split("\n").filter((l) => !l.startsWith("--")).join("\n")).not.toMatch(/\b(INSERT|UPDATE|DELETE|DROP)\b/i);
    expect(readFileSync("server/creative/store.ts", "utf8")).toContain("creative_moodboard_get");
    expect(readFileSync("server/routes/api/moodboards/[person]/[board].get.ts", "utf8")).toContain("creative_moodboard_get");
    expect(readFileSync("src/App.tsx", "utf8")).toContain('path="/moodboards/:person/:board"');
  });
});
