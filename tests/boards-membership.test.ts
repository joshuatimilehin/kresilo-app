import { beforeEach, describe, expect, it, vi } from "vitest";
import { boardEvent, isLive, openBoardById, openBoards } from "../src/creative/openBoards";
import { boardCommentId, caseCommentId, isCommentableId } from "../src/creative/commentTargets";
import { works } from "../src/creative/catalog";
import { caseStudies } from "../src/creative/portfolio";
import { creativeFailure } from "../src/creative/contracts";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

describe("open boards are live only while their jam runs", () => {
  const jamBoard = openBoardById("harbour-hours-night-crossings")!;
  const jam = boardEvent(jamBoard)!;
  const start = new Date(jam.startsAt).getTime();

  it("ties the jam boards to their events", () => {
    expect(jam.id).toBe("harbour-poster-jam");
    expect(boardEvent(openBoardById("loom-and-line-market-tags")!)).toBeUndefined();
  });

  it("is live during the jam and not before or after", () => {
    expect(isLive(jamBoard, new Date(start - 60000))).toBe(false);
    expect(isLive(jamBoard, new Date(start + 60000))).toBe(true);
    expect(isLive(jamBoard, new Date(start + jam.minutes * 60000))).toBe(false);
  });

  it("never calls a board without a jam live, however recent its activity", () => {
    for (const b of openBoards.filter((x) => !boardEvent(x))) expect(isLive(b, new Date(start + 60000)), b.id).toBe(false);
  });

  it("shows no board live on an ordinary day", () => {
    expect(openBoards.some((b) => isLive(b, new Date("2026-10-24T12:00")))).toBe(false);
  });
});

describe("what may be commented on", () => {
  it("accepts catalog works, case studies and open boards, and nothing else", () => {
    expect(isCommentableId(works[0].id)).toBe(true);
    expect(isCommentableId(caseCommentId(caseStudies[0].id))).toBe(true);
    expect(isCommentableId(boardCommentId(openBoards[0].id))).toBe(true);
    expect(isCommentableId("board-no-such-board")).toBe(false);
    expect(isCommentableId("case-no-such-case")).toBe(false);
    expect(isCommentableId("Board-X")).toBe(false);
    expect(isCommentableId("")).toBe(false);
  });

  it("keeps every board id within the table's id shape", () => {
    for (const b of openBoards) expect(boardCommentId(b.id)).toMatch(/^[a-z0-9-]{1,80}$/);
  });
});

describe("board comments through the work-comment commands", () => {
  beforeEach(() => {
    query.mockReset();
    query.mockImplementation(async (name: string) => (name === "creative_open" ? { person: { name: "Ayo" }, projects: [] } : {}));
  });

  it("store a comment on a real board", async () => {
    const id = boardCommentId("metro-moves-station-murals");
    expect((await executeCreative("h", "work.comment.add", { workId: id, text: "Panel three next" })).ok).toBe(true);
    expect(query.mock.calls.find((c) => c[0] === "creative_work_comment_add")![1].slice(0, 2)).toEqual(["h", id]);
  });

  it("refuse a board that does not exist without touching storage", async () => {
    expect(await executeCreative("h", "work.comment.add", { workId: "board-made-up", text: "Hi" })).toEqual(creativeFailure("NOT_FOUND"));
    expect(query.mock.calls.some((c) => c[0] === "creative_work_comment_add")).toBe(false);
  });
});
