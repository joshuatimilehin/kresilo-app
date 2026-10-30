import { beforeEach, describe, expect, it, vi } from "vitest";
import { commands, creativeFailure } from "../src/creative/contracts";
import { disclosureSchema, defaultDisclosure } from "../src/creative/publicStory";
import { canRemove, checkComment, commentsState, COMMENT_MAX, type PostComment } from "../src/creative/postComments";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../server/creative/store", () => ({ creativeQuery: query }));
import { executeCreative } from "../server/creative/service";

const pub = "11111111-2222-4333-8444-555555555555";
const mine: PostComment = { id: "a", author: "Ayo", text: "Hi", at: "2026-10-22T12:00:00Z", mine: true };
const theirs: PostComment = { ...mine, id: "b", mine: false };

describe("when comments are open", () => {
  it("are open by default, can be closed, and are only on community posts", () => {
    expect(defaultDisclosure.comments).toBe(true);
    expect(disclosureSchema.parse({ comments: false }).comments).toBe(false);
    expect(commentsState("private", true).state).toBe("unavailable");
    expect(commentsState("community", false).state).toBe("closed");
    expect(commentsState("community", true).state).toBe("open");
    expect(commentsState("community", false).note).toMatch(/not opened comments/);
  });
});

describe("checking a comment", () => {
  it("trims, refuses empty and over-long text", () => {
    expect(checkComment("  Calm and warm.  ")).toEqual({ ok: true, text: "Calm and warm." });
    expect(checkComment("   ").ok).toBe(false);
    expect(checkComment("x".repeat(COMMENT_MAX + 1)).ok).toBe(false);
    expect(checkComment("x".repeat(COMMENT_MAX)).ok).toBe(true);
  });

  it("lets an author remove their own, and the maker remove any", () => {
    expect(canRemove(mine, false)).toBe(true);
    expect(canRemove(theirs, false)).toBe(false);
    expect(canRemove(theirs, true)).toBe(true);
  });
});

describe("post comment commands", () => {
  beforeEach(() => {
    query.mockReset();
    query.mockImplementation(async (name: string) => {
      if (name === "creative_open") return { person: { name: "Ayo Bello" }, projects: [] };
      return {};
    });
  });

  it("are strict about their input", () => {
    expect(commands["post.comment.add"].safeParse({ publicationId: pub, text: "Nice" }).success).toBe(true);
    expect(commands["post.comment.add"].safeParse({ publicationId: pub, text: "  " }).success).toBe(false);
    expect(commands["post.comment.add"].safeParse({ publicationId: pub, text: "x".repeat(1001) }).success).toBe(false);
    expect(commands["post.comment.add"].safeParse({ publicationId: pub, text: "Nice", author: "Someone else" }).success).toBe(false);
    expect(commands["post.comment.remove"].safeParse({ publicationId: pub, commentId: "nope" }).success).toBe(false);
  });

  it("adds through the storage function with a fresh id, never trusting a client name", async () => {
    const r = await executeCreative("h", "post.comment.add", { publicationId: pub, text: "  Lovely  " });
    expect(r.ok).toBe(true);
    const call = query.mock.calls.find((c) => c[0] === "creative_post_comment_add")!;
    expect(call[1][0]).toBe("h");
    expect(call[1][1]).toBe(pub);
    expect(call[1][2]).toMatch(/^[0-9a-f-]{36}$/);
    expect(call[1][3]).toBe("Lovely");
    expect(call[1]).toHaveLength(4);
  });

  it("reports a closed post and a flood as plain failures", async () => {
    query.mockImplementation(async (name: string) => {
      if (name === "creative_open") return { person: { name: "Ayo" }, projects: [] };
      throw new Error("COMMENTS_CLOSED");
    });
    const closed = await executeCreative("h", "post.comment.add", { publicationId: pub, text: "Hi" });
    expect(closed).toEqual(creativeFailure("COMMENTS_CLOSED"));
    expect(closed.ok === false && closed.message).toMatch(/not opened comments/);
    query.mockImplementation(async (name: string) => {
      if (name === "creative_open") return { person: { name: "Ayo" }, projects: [] };
      throw new Error("RATE_LIMITED");
    });
    const flood = await executeCreative("h", "post.comment.add", { publicationId: pub, text: "Hi" });
    expect(flood.ok === false && flood.message).toMatch(/Wait a minute/);
  });

  it("removes through the storage function", async () => {
    const commentId = "22222222-2222-4333-8444-555555555555";
    const r = await executeCreative("h", "post.comment.remove", { publicationId: pub, commentId });
    expect(r.ok).toBe(true);
    expect(query.mock.calls.find((c) => c[0] === "creative_post_comment_remove")![1]).toEqual(["h", pub, commentId]);
  });
});
