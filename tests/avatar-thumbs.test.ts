import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { avatarSrc } from "../src/creative/avatar";
import { makers } from "../src/creative/makers";

describe("avatars use tiny copies of portraits", () => {
  it("every maker portrait photo has its small copy, and drawn marks are left alone", () => {
    for (const m of makers) {
      if (!m.portrait) continue;
      const small = avatarSrc(m.portrait);
      if (/portrait/.test(m.portrait)) {
        expect(small, m.id).toMatch(/^\/assets\/kresilo\/p\/[^?]*\.jpg(\?.*)?$/);
        expect(existsSync(`public${small.split("?")[0]}`), `${m.id}: run scripts/portrait-thumbs.sh`).toBe(true);
      } else expect(small, m.id).toBe(m.portrait);
    }
    expect(avatarSrc("/assets/kresilo/ren-mark.svg")).toBe("/assets/kresilo/ren-mark.svg");
    // A versioned portrait address still gets its tiny copy, and keeps the version.
    expect(avatarSrc("/assets/kresilo/gen/portrait--neema-waweru.jpg?v=5795adc8")).toBe("/assets/kresilo/p/portrait--neema-waweru.jpg?v=5795adc8");
  });
});
