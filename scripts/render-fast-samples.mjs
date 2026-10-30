// Render original gallery loops through the same trusted renderer as Studio.
import { createJiti } from "jiti";
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";
const jiti = createJiti(import.meta.url, {
  alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) },
});
const { newProject } = await jiti.import("../src/creative/contracts.ts");
const { renderMotion } = await jiti.import("../server/creative/motion.ts");
const { asReference, motionForWork } = await jiti.import(
  "../src/creative/catalog.ts",
);
for (const [work, file, title, frames] of [
  [
    "chrome-orbit",
    "orbit-cuts.mp4",
    "ORBIT /\nIN MOTION",
    ["chrome-orbit", "tidal-lines", "garden-grid"],
  ],
  ["red-interval", "type-rush.mp4", "NEW\nRHYTHM", ["red-interval"]],
  [
    "night-signal",
    "signal-shuffle.mp4",
    "MAKE\nSOME NOISE",
    ["night-signal", "red-interval", "garden-grid"],
  ],
]) {
  const p = newProject(crypto.randomUUID(), "Original fast gallery sample");
  p.references = frames.map((id) =>
    asReference(id, "Original sample composition"),
  );
  p.art = {
    ...p.art,
    asset: p.references[0].asset,
    title,
    caption: "KRESILO / ORIGINAL MOTION STUDY",
    size: work === "red-interval" ? 20 : work === "chrome-orbit" ? 19 : 22,
    y: work === "red-interval" ? 30 : 6,
    captionVisible: false,
  };
  p.motion = motionForWork[work];
  const bytes = await renderMotion(p);
  await writeFile(
    new URL(`../public/assets/kresilo/${file}`, import.meta.url),
    bytes,
  );
  console.log(
    `${file}: ${bytes.length} bytes, ${p.motion.seconds}s, beat ${p.motion.beat}s`,
  );
}
