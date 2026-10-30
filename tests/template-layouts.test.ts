import { describe, expect, it } from "vitest";
import { brandTemplates } from "../src/creative/portfolio";
import { initialsOf, LAYOUT_VARIANTS, templateLayout, tones } from "../src/creative/portfolio/layouts";
import { paletteChoices, templateStartArt } from "../src/creative/portfolio/useInStudio";
import { artPatch, newProject } from "../src/creative/contracts";

describe("editable templates", () => {
  it("every layout, in every colour set, is a patch the server accepts", () => {
    for (const id of Object.keys(LAYOUT_VARIANTS)) {
      const t = brandTemplates.find((b) => b.id === id)!;
      expect(t, id).toBeDefined();
      for (const c of paletteChoices(t))
        for (let v = 0; v < LAYOUT_VARIANTS[id]; v++)
          for (const brand of ["A", "Harbour & Co.", "Twenty four characters x"]) {
            const art = templateStartArt(t, newProject(crypto.randomUUID(), "T", "t").art, { brand, palette: c.palette }, v);
            const { title, titleVisible, titleType, marks, layers, color, size, x, y, asset, backgroundFilter, backgroundOpacity, captionVisible, format, canvasColor } = art;
            const parsed = artPatch.safeParse({ title, titleVisible, titleType, marks, layers, color, size, x, y, asset, backgroundFilter, backgroundOpacity, captionVisible, format, canvasColor });
            expect(parsed.success, `${id} ${v} ${brand} ${c.name}: ${parsed.error?.message}`).toBe(true);
          }
    }
  });

  it("gives every layer a fresh id each time, so two projects never share one", () => {
    const a = templateLayout("story-series", { brand: "X", palette: ["#000000", "#ffffff", "#ff0000", "#00ff00"] })!;
    const b = templateLayout("story-series", { brand: "X", palette: ["#000000", "#ffffff", "#ff0000", "#00ff00"] })!;
    expect(a.marks![0].id).not.toBe(b.marks![0].id);
  });

  it("reads any palette as dark, light and two accents, and takes initials from the brand", () => {
    expect(tones(["#8b5cf8", "#111111", "#f2f1ed", "#c7fe02"])).toEqual({ dark: "#111111", light: "#f2f1ed", a: "#8b5cf8", b: "#c7fe02" });
    expect(initialsOf("Harbour & Co.")).toBe("HC");
    expect(initialsOf("kresilo")).toBe("KR");
  });

  it("makes album covers square and anime posters portrait", () => {
    const palette = ["#0d1b2a", "#f4a259", "#e0e1dd", "#7b2cbf"];
    for (let v = 0; v < 3; v++) {
      expect(templateLayout("album-cover", { brand: "Mira", palette }, v)!.format).toBe("square");
      expect(templateLayout("anime-poster", { brand: "Skyline", palette }, v)!.format).toBe("poster");
    }
  });

  it("leaves templates built from product scenes alone", () => {
    expect(templateLayout("logo-on-products", { brand: "X", palette: ["#000000"] })).toBeNull();
  });
});
