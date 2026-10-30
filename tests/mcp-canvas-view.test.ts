import { describe, expect, it } from "vitest";
import { newProject } from "../src/creative/contracts";
import { compactProject } from "../server/mcp/format";

const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

describe("MCP view of a canvas project", () => {
  const doc = newProject(crypto.randomUUID(), "Brief", "Canvas study");
  doc.art = { ...doc.art, snapshot: { image, width: 390, height: 844, at: "2026-10-26T00:00:00Z" } };
  doc.canvas = { at: "2026-10-26T01:00:00Z", scene: "", origins: { hand: 4, assisted: 1, generated: 2 }, versions: [{ id: "v", at: "t", kind: "manual", scene: "" }] };
  const view = compactProject({ id: "p", revision: 3, owner: true, document: doc });

  it("says the cover picture exists and its size, without sending it", () => {
    expect(view.art.snapshot).toEqual({ width: 390, height: 844, at: "2026-10-26T00:00:00Z" });
    expect(JSON.stringify(view)).not.toContain(image);
  });

  it("summarises the canvas: when saved, where AI helped, versions kept", () => {
    expect(view.canvas).toEqual({ savedAt: "2026-10-26T01:00:00Z", parts: { hand: 4, assisted: 1, generated: 2 }, versions: 1 });
  });

  it("a project without a canvas is unchanged", () => {
    const plain = compactProject({ id: "p", revision: 1, owner: true, document: newProject(crypto.randomUUID(), "B", "T") });
    expect("canvas" in plain).toBe(false);
  });
});
