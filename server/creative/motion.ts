import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join, dirname } from "node:path";
import { createRequire } from "node:module";
import { motionFrames, type Project, ratioOf } from "@/creative/contracts";
import { assetMime, assets } from "@/creative/catalog";
import { grainDefsMarkup, imageFilters, layerCss, titleCss } from "@/creative/layers";
import { drawingSvg, markCss } from "@/creative/marks";
import type { LibraryArt } from "@/creative/libraryArt";
import { visualDefsFor } from "@/creative/visuals/layer";
import { visualFile } from "@/creative/visuals/types";
import type { VisualRef } from "@/creative/visuals/schema";
import { renderLibraryArt } from "./libraryArt";
import { artFile, hasArt } from "@/creative/portfolio/art";
import { creativeQuery } from "./store";
const exec = promisify(execFile),
  require = createRequire(import.meta.url);
function escape(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
let rendering = false;
/** Fixed trusted template: no model HTML, shell interpolation or remote URLs. */
export async function renderMotion(p: Project, hash?: string): Promise<Buffer> {
  if (rendering) throw new Error("RENDER_BUSY");
  rendering = true;
  const dir = await mkdtemp(join(tmpdir(), "kresilo-motion-"));
  try {
    const a = p.art,
      m = p.motion;
    // 540 pixels wide; the height follows the artwork's format (an even number for the video encoder).
    const H = Math.round(540 / ratioOf(a) / 2) * 2;
    const keys = motionFrames(
      a.asset,
      p.references.filter((r) => !r.mediaId).map((r) => r.asset),
    );
    const [images, gsap, font, sans] = await Promise.all([
      Promise.all(
        keys.map((key) => readFile(resolve("public", "." + assets[key]))),
      ),
      readFile(require.resolve("gsap/dist/gsap.min.js"), "utf8"),
      readFile(resolve("public/assets/kresilo/bodoni-moda-italic.ttf")),
      readFile(resolve("public/assets/kresilo/inter-variable.ttf")),
    ]);
    const collage = m.movement === "collage";
    const beat = m.beat ?? 0.5;
    let animation = "";
    if (m.movement === "cut" || collage) {
      for (let t = 0, step = 0; t < m.seconds; t += beat, step++) {
        const i = step % 3;
        // Give each image its own non-zero tween so frame seeking evaluates
        // cuts consistently, including render workers that seek backwards.
        for (let frame = 0; frame < 3; frame++)
          animation += `tl.to('#frame${frame}',{opacity:${frame === i ? 1 : 0},scale:${collage ? 1 : [1.04, 1.12, 1.01][frame]},rotation:${collage ? [-8, 7, -4][frame] : 0},xPercent:${collage ? [-4, 5, -3][frame] : 0},yPercent:${collage ? [2, -3, 3][frame] : 0},duration:.001,ease:'none',lazy:false},${t});`;
        if (!collage)
          animation += `tl.to('#title',{scale:${[1, 0.94, 1.03][i]},xPercent:${[0, 3, -2][i]},duration:.001,ease:'none'},${t});`;
      }
    } else if (m.movement === "type") {
      for (let t = 0; t < m.seconds; t += beat * 2)
        a.title.split("\n").forEach((_, i) => {
          const at = t + i * beat * 0.2;
          animation += `tl.fromTo('#word${i}',{opacity:0,yPercent:70},{opacity:1,yPercent:0,duration:${beat * 0.32},ease:'back.out(1.5)'},${at}).to('#word${i}',{opacity:0,yPercent:-10,duration:${beat * 0.2}},${at + beat * 1.7});`;
        });
    } else if (m.movement === "zoom") {
      animation = `tl.fromTo('#art',{scale:1},{scale:1.18,duration:${m.seconds},ease:'none'},0).fromTo('#title',{opacity:0,yPercent:8},{opacity:1,yPercent:0,duration:${Math.min(1.2, m.seconds / 3)},ease:'power2.out'},0.2);`;
    } else if (m.movement === "pan") {
      animation = `tl.fromTo('#art',{scale:1.12,xPercent:-4},{scale:1.12,xPercent:4,duration:${m.seconds},ease:'sine.inOut'},0).fromTo('.image-layer',{xPercent:3},{xPercent:-3,duration:${m.seconds},ease:'sine.inOut'},0);`;
    } else if (m.movement === "pop") {
      animation = `tl.fromTo('.image-layer,.mark',{opacity:0,scale:.6},{opacity:1,scale:1,duration:.45,stagger:.16,ease:'back.out(1.8)'},0.1).fromTo('#title',{opacity:0,scale:.85},{opacity:1,scale:1,duration:.5,ease:'back.out(1.6)'},'>-0.1');`;
    } else if (m.movement === "float") {
      animation = `tl.fromTo('.image-layer,.mark',{yPercent:0},{yPercent:-4,duration:${m.seconds / 4},yoyo:true,repeat:3,ease:'sine.inOut',stagger:{each:.2}},0).fromTo('#title',{yPercent:0},{yPercent:-2,duration:${m.seconds / 4},yoyo:true,repeat:3,ease:'sine.inOut'},0);`;
    } else if (m.movement === "spin") {
      animation = `tl.fromTo('#art',{rotation:0,scale:1.06},{rotation:2,scale:1.06,duration:${m.seconds},ease:'none'},0).fromTo('#title,.mark',{opacity:0,rotation:-12,scale:.8},{opacity:1,rotation:0,scale:1,duration:.8,stagger:.12,ease:'back.out(1.6)'},0.1);`;
    } else if (m.movement === "glitch") {
      for (let t = 0, step = 0; t < m.seconds; t += beat, step++) {
        const x = [0, -2.5, 3, -1][step % 4],
          hue = [0, 40, -30, 0][step % 4];
        animation += `tl.to('#art',{xPercent:${x},filter:'hue-rotate(${hue}deg) saturate(${hue ? 1.6 : 1})',duration:.001,ease:'none'},${t}).to('#title',{xPercent:${-x * 1.4},duration:.001,ease:'none'},${t}).to('#art',{xPercent:0,filter:'none',duration:.001,ease:'none'},${t + beat * 0.25});`;
      }
    } else if (m.movement === "wipe") {
      animation = `tl.fromTo('#art',{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)',duration:${Math.min(1.6, m.seconds / 2)},ease:'power3.inOut'},0).fromTo('#title',{opacity:0,xPercent:-12},{opacity:1,xPercent:0,duration:.8,ease:'power3.out'},0.6);`;
    } else if (m.movement === "pulse") {
      for (let t = 0; t < m.seconds; t += beat)
        animation += `tl.fromTo('#art,.image-layer',{scale:1.05},{scale:1,duration:${beat * 0.9},ease:'power2.out'},${t});`;
    } else if (m.movement !== "still") {
      animation =
        m.movement === "rise"
          ? `tl.fromTo('#art',{scale:1.04,yPercent:1},{scale:1.04,yPercent:-1,duration:${m.seconds / 2},yoyo:true,repeat:1,ease:'sine.inOut'},0);`
          : `tl.fromTo('#art',{scale:1.015},{scale:1.07,duration:${m.seconds / 2},yoyo:true,repeat:1,ease:'sine.inOut'},0);`;
      animation += `tl.fromTo('#title',{yPercent:0},{yPercent:-3,duration:${m.seconds / 2},yoyo:true,repeat:1,ease:'sine.inOut'},0);`;
    }
    const imageSrc = (i: number) =>
      `data:${assetMime(assets[keys[i]])};base64,` +
      images[i].toString("base64");
    async function source(
      asset: keyof typeof assets | undefined,
      mediaId?: string | null,
      library?: LibraryArt | null,
      visual?: VisualRef | null,
    ) {
      if (visual) {
        // The picture is the library's black-and-white JPEG; the layer's own filter (see layerCss) recolours it.
        // The id is checked to be letters, digits and dashes by the layer schema, so it cannot leave the folder.
        return `data:image/jpeg;base64,${(await readFile(resolve("public", "." + visualFile(visual.id)))).toString("base64")}`;
      }
      if (library) {
        const picture = library.kind === "asset" && hasArt(`asset:${library.id}`) ? artFile(`asset:${library.id}`) : undefined;
        if (picture) return `data:image/jpeg;base64,${(await readFile(resolve("public", "." + picture))).toString("base64")}`;
        const svg = renderLibraryArt(library);
        if (!svg) throw new Error("Library art is not available");
        return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
      }
      if (mediaId) {
        if (!hash) throw new Error("Private media requires a session");
        const media = await creativeQuery<{
          contentType: string;
          base64: string;
        }>("creative_media_get", [hash, mediaId]);
        if (
          !["image/png", "image/jpeg", "image/webp"].includes(media.contentType)
        )
          throw new Error("Unsupported layer media");
        return `data:${media.contentType};base64,${media.base64}`;
      }
      const file = assets[asset ?? a.asset];
      return (
        `data:${assetMime(file)};base64,` +
        (await readFile(resolve("public", "." + file))).toString("base64")
      );
    }
    const backgroundSrc = await source(a.asset, a.backgroundMediaId);
    const layerHtml = (
      await Promise.all(
        (a.layers ?? [])
          .filter((l) => l.visible)
          .map(
            async (l) =>
              `<img class="image-layer" src="${await source(l.asset, l.mediaId, l.libraryArt, l.visual)}" style="left:${l.x}%;top:${l.y}%;width:${l.width}%;height:${l.height}%;${layerCss(l)}"/>`,
          ),
      )
    ).join("");
    const markHtml = (a.marks ?? [])
      .filter((k) => k.visible)
      .map((k) => `<div class="mark" style="${markCss(k)}">${k.kind === "text" ? escape(k.text) : k.kind === "path" ? drawingSvg(k) : ""}</div>`)
      .join("");
    const frames =
      m.movement === "cut" || collage
        ? keys
            .map(
              (_, i) =>
                `<img id="frame${i}" class="frame" src="${imageSrc(i)}"/>`,
            )
            .join("")
        : "";
    const title =
      m.movement === "type"
        ? a.title
            .split("\n")
            .map(
              (word, i) =>
                `<span class="word" id="word${i}">${escape(word)}</span>`,
            )
            .join("")
        : escape(a.title);
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Poster;src:url(data:font/ttf;base64,${font.toString("base64")}) format('truetype');font-style:italic}
@font-face{font-family:KresiloSans;src:url(data:font/ttf;base64,${sans.toString("base64")}) format('truetype');font-weight:100 900}
*{box-sizing:border-box}html,body{margin:0;width:540px;height:${H}px;overflow:hidden;background:${/^#[0-9a-f]{6}$/i.test(a.canvasColor ?? "") ? a.canvasColor : "#173e43"}}
#main{position:relative;width:540px;height:${H}px;overflow:hidden}
#art,.frame{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
#art{opacity:${m.movement === "cut" ? 0 : (a.backgroundOpacity ?? 1)};filter:${a.backgroundFilter && a.backgroundFilter !== "none" ? imageFilters[a.backgroundFilter] : `brightness(${collage ? 0.55 : 1})`}}
.image-layer{position:absolute;object-fit:cover}
.frame{opacity:0;${collage ? "inset:16%;width:68%;height:68%;box-shadow:0 15px 35px #0005;" : ""}}
#title{position:absolute;left:${a.x}%;top:${a.y}%;font-family:${m.movement === "type" ? "KresiloSans,Arial" : "Poster,serif"};font-style:${m.movement === "type" ? "normal" : "italic"};font-weight:${m.movement === "type" ? 900 : 400};font-size:${a.size * 5.4}px;line-height:${m.movement === "type" ? 0.85 : 0.78};letter-spacing:-.04em;white-space:pre-line;max-width:93%;color:${a.color};transform-origin:0 0;z-index:2}.word{display:block}
#title{display:${a.titleVisible === false ? "none" : "block"}}${a.titleType ? `#title{${titleCss(a.titleType)}}` : ""}
#caption{display:${a.captionVisible === false ? "none" : "block"};position:absolute;left:6%;top:49%;font:8.37px/1.9 Arial,sans-serif;letter-spacing:1.8px;color:#fff7e3;z-index:2}
</style></head><body><div id="main" data-composition-id="main" data-start="0" data-width="540" data-height="${H}" data-duration="${m.seconds}" data-fps="24">${(a.layers ?? []).some((l) => l.visible && l.adjust?.grain) ? grainDefsMarkup() : ""}${visualDefsFor(a.layers)}<img id="art" src="${backgroundSrc}"/>${frames}${layerHtml}${markHtml}<div id="title">${title}</div><div id="caption">${escape(
      a.caption ?? "SALT FLATS /\nEVENING STUDY",
    )
      .split("\n")
      .join(
        "<br>",
      )}</div><script src="./gsap.min.js"></script><script>window.__timelines={};const tl=gsap.timeline({paused:true});${animation}tl.to({}, {duration:${m.seconds}},0);window.__timelines.main=tl;</script></div></body></html>`;
    await writeFile(join(dir, "gsap.min.js"), gsap);
    await writeFile(join(dir, "index.html"), html);
    await writeFile(
      join(dir, "hyperframes.json"),
      JSON.stringify({
        name: "Evening study",
        width: 540,
        height: H,
        fps: 24,
      }),
    );
    const cli = join(
      dirname(require.resolve("hyperframes/package.json")),
      "bin/hyperframes.mjs",
    );
    await exec(
      process.execPath,
      [
        cli,
        "render",
        dir,
        "--output",
        join(dir, "Evening study.mp4"),
        "--workers",
        "2",
        "--quality",
        "standard",
        "--fps",
        "24",
      ],
      {
        timeout: 540000,
        maxBuffer: 1024 * 1024,
        env: {
          ...process.env,
          DO_NOT_TRACK: "1",
          HYPERFRAMES_TELEMETRY_DISABLED: "1",
          HYPERFRAMES_FFMPEG_PATH: require("@ffmpeg-installer/ffmpeg").path,
          HYPERFRAMES_FFPROBE_PATH: require("@ffprobe-installer/ffprobe").path,
        },
      },
    );
    const video = await readFile(join(dir, "Evening study.mp4"));
    if (video.length < 1024 || video.toString("ascii", 4, 8) !== "ftyp")
      throw new Error("INVALID_EXPORT");
    return video;
  } finally {
    rendering = false;
    await rm(dir, { recursive: true, force: true });
  }
}
