import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const ffmpeg = require("@ffmpeg-installer/ffmpeg").path;
const ffprobe = require("@ffprobe-installer/ffprobe").path;
const evidence = [];
for (const name of ["orbit-cuts", "type-rush", "signal-shuffle"]) {
  const file = fileURLToPath(
    new URL(`../public/assets/kresilo/${name}.mp4`, import.meta.url),
  );
  const meta = JSON.parse(
    execFileSync(
      ffprobe,
      ["-v", "error", "-show_streams", "-show_format", "-of", "json", file],
      { encoding: "utf8" },
    ),
  );
  const stream = meta.streams.find((s) => s.codec_type === "video");
  assert.equal(stream.codec_name, "h264");
  assert.equal(stream.width, 540);
  assert.equal(stream.height, 720);
  assert.ok(Math.abs(Number(meta.format.duration) - 4) < 0.1);
  const frames = [];
  for (const [index, at] of (name === "type-rush"
    ? [0.08, 0.2, 0.36]
    : [0.08, 0.32, 0.58]
  ).entries()) {
    const bytes = execFileSync(
      ffmpeg,
      [
        "-v",
        "error",
        "-ss",
        String(at),
        "-i",
        file,
        "-frames:v",
        "1",
        "-f",
        "image2pipe",
        "-vcodec",
        "png",
        "pipe:1",
      ],
      { maxBuffer: 4 * 1024 * 1024 },
    );
    await writeFile(
      new URL(
        `../docs/qa/layered-workspace/${name}-frame-${index + 1}.png`,
        import.meta.url,
      ),
      bytes,
    );
    frames.push({
      at,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
  }
  assert.equal(
    new Set(frames.map((f) => f.sha256)).size,
    3,
    `${name} must have visibly changing frame samples`,
  );
  evidence.push({
    name,
    codec: stream.codec_name,
    width: stream.width,
    height: stream.height,
    duration: Number(meta.format.duration),
    fps: stream.r_frame_rate,
    frames,
  });
}
await writeFile(
  new URL(
    "../docs/qa/layered-workspace/fast-motion-acceptance.json",
    import.meta.url,
  ),
  JSON.stringify({ asOf: new Date().toISOString(), evidence }, null, 2) + "\n",
);
console.log(
  "All three original fast loops are four-second H.264 videos with three distinct decoded frame samples.",
);
