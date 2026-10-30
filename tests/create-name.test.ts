import { describe, expect, it } from "vitest";
import { nameFromIdea } from "../src/creative/guidance";

describe("a project name from the idea", () => {
  it("keeps the subject and drops the request", () => {
    expect(nameFromIdea("A poster for a rooftop jazz night in Lisbon, warm and loud")).toBe("Rooftop jazz night in Lisbon");
    expect(nameFromIdea("Make me a logo for Kopi Kecil coffee")).toBe("Kopi Kecil coffee");
    expect(nameFromIdea("an Instagram story about our spring sale")).toBe("Our spring sale");
    expect(nameFromIdea("Night market noodles")).toBe("Night market noodles");
    expect(nameFromIdea("   ")).toBe("Untitled");
  });
});
