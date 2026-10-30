// Creates isolated QA guest records in the existing prototype runtime.
// Never prints cookies, credentials, private input or model responses.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

const base = process.env.KRESILO_TEST_URL ?? "http://127.0.0.1:8080";
function guest() {
  let cookie = "";
  async function request(path, body) {
    const response = await fetch(`${base}${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const set = response.headers.getSetCookie();
    if (set.length) cookie = set.map((c) => c.split(";")[0]).join("; ");
    return response;
  }
  const command = async (verb, input = {}) => {
    const result = await (
      await request("/api/creative", { verb, input })
    ).json();
    if (
      !result.ok &&
      !["CONFLICT", "FORBIDDEN", "INVALID_INPUT"].includes(result.code)
    )
      console.error(
        `Action failed: ${verb}: ${result.code}: ${result.message}`,
      );
    return result;
  };
  command.request = request;
  return command;
}
const run = guest();
const passed = [];
function check(condition, label) {
  assert.ok(condition, label);
  passed.push(label);
}
check((await run("workspace.get")).ok, "Open isolated guest workspace");
let r = await run("project.create", {
  brief: "QA isolated reference-to-canvas acceptance",
  sourceWorkId: "garden-grid",
  reason: "QA botanical geometry",
});
check(r.ok, "Create project from selected reference");
let p = r.project;
const id = p.id;
check(
  p.document.art.asset === "garden-grid" &&
    p.document.references[0].workId === "garden-grid",
  "Selected image and source travel together",
);
const firstLayer = {
  id: crypto.randomUUID(),
  name: "QA Market rhythm",
  asset: "market-rhythm",
  x: 15,
  y: 20,
  width: 55,
  height: 45,
  opacity: 1,
  rotation: 0,
  visible: true,
  filter: "none",
};
const secondLayer = {
  ...firstLayer,
  id: crypto.randomUUID(),
  name: "QA Tidal lines",
  asset: "tidal-lines",
  x: 45,
};
r = await run("artwork.edit", {
  projectId: id,
  revision: p.revision,
  patch: { layers: [firstLayer, secondLayer] },
});
check(r.ok, "Save two independent image layers");
p = r.project;
check(
  p.document.references.some((ref) => ref.workId === "market-rhythm") &&
    p.document.references.some((ref) => ref.workId === "tidal-lines"),
  "Layer assets retain reference credits",
);
const original = structuredClone(p.document.art);
const version = p.document.versions.at(-1);
r = await run("proposal.request", {
  projectId: id,
  intent:
    "Make this image layer smaller and move it left. Set its opacity to 50%.",
  target: firstLayer.id,
});
check(r.ok, "Request a targeted prompt proposal");
p = r.project;
check(
  JSON.stringify(p.document.art) === JSON.stringify(original),
  "Proposal leaves artwork unchanged before approval",
);
const q = p.document.proposals.at(-1);
check(
  q.patch.layers?.[0].width < original.layers[0].width &&
    q.patch.layers[0].opacity === 0.5,
  "Prompt targets requested layer size and opacity",
);
check(
  JSON.stringify(q.patch.layers[1]) === JSON.stringify(original.layers[1]) &&
    !q.patch.asset &&
    !q.patch.title,
  "Prompt preserves unrelated layer, title and background",
);
r = await run("proposal.accept", { projectId: id, proposalId: q.id });
check(r.ok, "Apply approved proposal");
p = r.project;
check(
  p.document.art.layers[0].opacity === 0.5,
  "Approval changes the selected layer",
);
const versionCount = p.document.versions.length;
r = await run("proposal.accept", { projectId: id, proposalId: q.id });
check(
  r.ok && r.project.document.versions.length === versionCount,
  "Repeated approval is idempotent",
);
r = await run("project.get", { projectId: id });
p = r.project;
check(
  p.document.art.layers[0].opacity === 0.5,
  "Fresh read preserves layers after approval",
);
r = await run("artwork.edit", {
  projectId: id,
  revision: 1,
  patch: { title: "Stale write" },
});
check(
  !r.ok && r.code === "CONFLICT",
  "Stale edits cannot overwrite saved artwork",
);
r = await run("version.restore", { projectId: id, versionId: version.id });
check(
  r.ok && JSON.stringify(r.project.document.art) === JSON.stringify(original),
  "Restore returns the exact layered snapshot",
);
p = r.project;
r = await run("artwork.edit", {
  projectId: id,
  revision: p.revision,
  patch: {
    layers: [
      secondLayer,
      { ...firstLayer, visible: false, filter: "grayscale" },
    ],
    backgroundFilter: "warm",
    backgroundOpacity: 0.8,
  },
});
check(
  r.ok &&
    !r.project.document.art.layers[1].visible &&
    r.project.document.art.backgroundFilter === "warm",
  "Layer order, visibility and background filters persist",
);
p = r.project;
r = await run("artwork.edit", {
  projectId: id,
  revision: p.revision,
  patch: { backgroundMediaId: crypto.randomUUID() },
});
check(!r.ok, "Foreign or unknown private media cannot be placed on canvas");
const media = await readFile(
  new URL("../public/assets/kresilo/mineral-texture.webp", import.meta.url),
);
r = await run("media.import", {
  projectId: id,
  name: "QA texture",
  reason: "QA private layer",
  contentType: "image/webp",
  base64: media.toString("base64"),
});
check(r.ok, "Import project-owned image");
p = r.project;
const mediaId = p.document.references.at(-1).mediaId;
r = await run("artwork.edit", {
  projectId: id,
  revision: p.revision,
  patch: { backgroundMediaId: mediaId },
});
check(
  r.ok && r.project.document.art.backgroundMediaId === mediaId,
  "Use imported image as canvas background",
);
p = r.project;
r = await run("publication.create", {
  projectId: id,
  revision: p.revision,
  audience: "private",
  description: "QA",
});
check(
  !r.ok && r.message.includes("private"),
  "Private canvas imports cannot leak through publication",
);
const other = guest();
await other("workspace.get");
r = await other("project.get", { projectId: id });
check(!r.ok, "A different guest cannot access the project");
let exportVerified = false;
if (process.env.KRESILO_TEST_EXPORT === "1") {
  r = await run("motion.configure", {
    projectId: id,
    revision: p.revision,
    seconds: 2,
    movement: "collage",
    loop: true,
    beat: 0.25,
  });
  check(
    r.ok && r.project.document.motion.beat === 0.25,
    "Save fast motion pace on layered artwork",
  );
  const job = await (
    await run.request("/api/motion", { projectId: id })
  ).json();
  check(job.ok, "Start layered video export with private background");
  let state;
  for (let i = 0; i < 90; i++) {
    state = await (await run.request(`/api/motion/${job.jobId}`)).json();
    if (state.state === "ready" || state.state === "failed" || !state.ok) break;
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  check(state.state === "ready", "Layered video export completes");
  const bytes = Buffer.from(
    await (await run.request(`/api/media/${state.mediaId}`)).arrayBuffer(),
  );
  check(
    bytes.toString("ascii", 4, 8) === "ftyp" && bytes.length > 1024,
    "Layered export returns a real MP4",
  );
  await writeFile(
    new URL("../docs/qa/layered-workspace/layered-export.mp4", import.meta.url),
    bytes,
  );
  exportVerified = true;
}
const evidence = {
  asOf: new Date().toISOString(),
  base,
  passed,
  promptMode: q.provenance.startsWith("Prototype")
    ? "labelled preset fallback"
    : "live model",
  promptProvenance: q.provenance,
  exportVerified,
  limitation:
    "No production deployment or native mobile claim. Private imported canvas media is not publishable.",
};
if (process.env.KRESILO_QA_OUTPUT)
  await writeFile(
    process.env.KRESILO_QA_OUTPUT,
    JSON.stringify(evidence, null, 2) + "\n",
  );
console.log(JSON.stringify(evidence, null, 2));
