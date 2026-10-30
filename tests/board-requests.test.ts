import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { commands, creativeFailure } from "../src/creative/contracts";
import { canJoinIn, isAskableBoard, isHostedBoardId, parseBoards, placeOf } from "../src/creative/boardRequests";
import { openBoards } from "../src/creative/openBoards";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

const root = join(__dirname, "..");
const sql = readFileSync(join(root, "db", "migrations", "014_board_requests.sql"), "utf8");
const store = readFileSync(join(root, "server", "creative", "store.ts"), "utf8");
const person = "11111111-1111-4111-8111-111111111111";

describe("a request to join is a real request", () => {
  beforeEach(() => {
    query.mockReset();
    query.mockImplementation(async (name: string) => (name === "creative_open" ? { person: { name: "Ayo" }, projects: [] } : {}));
  });

  it("is strict about its input", () => {
    expect(commands["board.ask"].safeParse({ id: "loom-and-line-market-tags" }).success).toBe(true);
    expect(commands["board.ask"].safeParse({ id: "../x" }).success).toBe(false);
    expect(commands["board.answer"].safeParse({ id: "b-abcdef12", personId: person, accept: true }).success).toBe(true);
    expect(commands["board.answer"].safeParse({ id: "loom-and-line-market-tags", personId: person, accept: true }).success).toBe(false);
    expect(commands["board.answer"].safeParse({ id: "b-abcdef12", personId: person, accept: "yes" }).success).toBe(false);
    expect(commands["board.close"].safeParse({ id: "b-abcdef12" }).success).toBe(true);
  });

  it("asking a curated board writes a request for the signed-in person, with no timer to accept it", async () => {
    const id = openBoards[0].id;
    expect((await executeCreative("h", "board.ask", { id })).ok).toBe(true);
    expect(query.mock.calls.find((c) => c[0] === "creative_board_ask")![1]).toEqual(["h", id]);
  });

  it("refuses a board that is neither curated nor shaped like a hosted one, without touching storage", async () => {
    expect(await executeCreative("h", "board.ask", { id: "made-up-board" })).toEqual(creativeFailure("NOT_FOUND"));
    expect(query.mock.calls.some((c) => c[0] === "creative_board_ask")).toBe(false);
  });

  it("lets the host answer through the session, and passes the database's refusal on", async () => {
    expect((await executeCreative("h", "board.answer", { id: "b-abcdef12", personId: person, accept: true })).ok).toBe(true);
    expect(query.mock.calls.find((c) => c[0] === "creative_board_answer")![1]).toEqual(["h", "b-abcdef12", person, true]);
    query.mockImplementation(async (name: string) => {
      if (name === "creative_open") return { person: { name: "Ayo" }, projects: [] };
      throw new Error("FORBIDDEN");
    });
    expect((await executeCreative("h", "board.answer", { id: "b-abcdef12", personId: person, accept: true })).ok).toBe(false);
  });

  it("opens a board only with a picture this server signed", async () => {
    const forged = "11111111-1111-4111-8111-111111111111." + "0".repeat(32);
    const r = await executeCreative("h", "board.open", { projectId: person, cover: forged, wanted: ["Design"], ideasPublic: true });
    expect(r.ok).toBe(false);
    expect(query.mock.calls.some((c) => c[0] === "creative_board_open")).toBe(false);
  });
});

describe("a hosted board's talk is for its host and the people let in", () => {
  const board = (mine: boolean, place: string) => [{ id: "b-abcdef12", mine, place, doc: { title: "T", cover: "c", wanted: ["Design"] }, members: [] }];
  const asWho = (mine: boolean, place: string) =>
    query.mockImplementation(async (name: string) => {
      if (name === "creative_open") return { person: { name: "Ayo" }, projects: [] };
      if (name === "creative_boards_list") return board(mine, place);
      return {};
    });
  beforeEach(() => query.mockReset());

  it("refuses a comment from someone who has not been let in", async () => {
    for (const place of ["none", "asked", "declined"]) {
      asWho(false, place);
      const r = await executeCreative("h", "work.comment.add", { workId: "board-b-abcdef12", text: "Hi" });
      expect(r.ok, place).toBe(false);
    }
    expect(query.mock.calls.some((c) => c[0] === "creative_work_comment_add")).toBe(false);
  });

  it("takes a comment from a member and from the host", async () => {
    for (const [mine, place] of [[false, "in"], [true, "none"]] as const) {
      query.mockReset();
      asWho(mine, place);
      expect((await executeCreative("h", "work.comment.add", { workId: "board-b-abcdef12", text: "Hi" })).ok).toBe(true);
      expect(query.mock.calls.some((c) => c[0] === "creative_work_comment_add")).toBe(true);
    }
  });
});

describe("the states a person sees", () => {
  it("knows a hosted board id and what may be asked", () => {
    expect(isHostedBoardId("b-abcdef12")).toBe(true);
    expect(isHostedBoardId("board-abc")).toBe(false);
    expect(isAskableBoard(openBoards[0].id)).toBe(true);
    expect(isAskableBoard("b-abcdef12")).toBe(true);
    expect(isAskableBoard("nope")).toBe(false);
  });

  it("keeps curated board ids clear of the hosted shape", () => {
    for (const b of openBoards) expect(isHostedBoardId(b.id), b.id).toBe(false);
  });

  it("reads a place from the server's answer, and nothing else counts", () => {
    expect(placeOf({ a: "asked", b: "in", c: "declined" }, "a")).toBe("asked");
    expect(placeOf({ a: "asked", b: "in", c: "declined" }, "b")).toBe("in");
    expect(placeOf({ a: "asked", b: "in", c: "declined" }, "c")).toBe("declined");
    expect(placeOf({}, "a")).toBe("none");
    expect(placeOf({ a: "banana" as never }, "a")).toBe("none");
  });

  it("lets only the host and people let in see the work", () => {
    expect(canJoinIn("none")).toBe(false);
    expect(canJoinIn("asked")).toBe(false);
    expect(canJoinIn("declined")).toBe(false);
    expect(canJoinIn("in")).toBe(true);
    expect(canJoinIn("none", true)).toBe(true);
  });

  it("trusts only a well-formed boards reply", () => {
    expect(parseBoards(null)).toEqual({ boards: [], places: {}, inbox: [] });
    expect(parseBoards({ boards: [{ id: "x" }, { id: "b-abcdef12", doc: { title: "T" } }], places: { a: "in" }, inbox: [{ board: "b-abcdef12", person: "p" }, 3] })).toEqual({
      boards: [{ id: "b-abcdef12", doc: { title: "T" } }],
      places: { a: "in" },
      inbox: [{ board: "b-abcdef12", person: "p" }],
    });
  });
});

describe("migration 014", () => {
  it("is additive and keeps its runtime objects in kresilo_demo", () => {
    expect(sql).not.toMatch(/DROP |TRUNCATE|DELETE FROM/i);
    expect(sql.match(/CREATE TABLE IF NOT EXISTS (\S+)/g)!.every((t) => t.includes("kresilo_demo."))).toBe(true);
  });

  it("lets only the host answer, never the host's own request, and a decline can ask again", () => {
    expect(sql).toMatch(/host_id=v_host AND closed_at IS NULL\) THEN RETURN kresilo_demo\._err\('FORBIDDEN'\)/);
    expect(sql).toMatch(/v_host=v_person THEN RETURN kresilo_demo\._err\('FORBIDDEN'\)/);
    expect(sql).toMatch(/v_row\.state<>'declined' THEN RETURN/);
    expect(sql).toMatch(/v_row\.asks>=5 THEN RETURN kresilo_demo\._err\('LIMIT_REACHED'\)/);
  });

  it("is reachable only through the allowlisted storage functions", () => {
    for (const fn of ["creative_board_open", "creative_board_close", "creative_boards_list", "creative_board_ask", "creative_board_answer", "creative_board_places"]) {
      expect(sql).toContain(`kresilo_demo.${fn}(`);
      expect(store).toContain(fn);
    }
  });
});
