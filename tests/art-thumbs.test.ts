import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generatedArt } from "../src/creative/portfolio/generated";
import { artThumb, artSrc } from "../src/creative/portfolio/art";
import { caseStudies } from "../src/creative/portfolio";

describe("project covers have small copies for cards", () => {
  it("every project cover has a thumbnail file, and only covers do", () => {
    for (const p of caseStudies) {
      const key = `panel:${p.id}:0`;
      if (!generatedArt.has(key)) continue;
      const url = artThumb(key)!;
      expect(url, p.id).toMatch(/\/gen\/t\/panel--.*--0\.jpg\?v=/);
      expect(existsSync(`public${url.split("?")[0]}`), `${p.id} has no thumbnail: run scripts/art-thumbs.sh`).toBe(true);
    }
    const other = [...generatedArt.keys()].find((k) => k.startsWith("panel:") && !k.endsWith(":0"))!;
    expect(artThumb(other)).toBe(artSrc(other));
  });
});
