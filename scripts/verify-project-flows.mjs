// Isolated QA guest in the existing runtime. No credentials or cookies printed.
import assert from "node:assert/strict";
const base = process.env.KRESILO_TEST_URL ?? "http://127.0.0.1:8080";
let cookie = "", checks = 0;
async function run(verb, input = {}, other = false) {
  const response = await fetch(`${base}/api/creative`, { method: "POST", headers: { "content-type": "application/json", ...(!other && cookie ? { cookie } : {}) }, body: JSON.stringify({ verb, input }) });
  if (!other && response.headers.getSetCookie().length) cookie = response.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  return response.json();
}
function check(value, message) { assert.ok(value, message); checks++; }
check((await run("workspace.get")).ok, "Open isolated QA guest");
let result = await run("project.create", { title: "Flow source", brief: "QA source assignment", sourceWorkId: "tidal-lines", reason: "QA flowing lines" });
check(result.ok && result.project.document.title === "Flow source", "Explicit name preserved with starting reference");
let source = result.project;
const initialArt = structuredClone(source.document.art), initialVersions = structuredClone(source.document.versions);
result = await run("project.create", { title: "Flow destination", brief: "QA destination" });
check(result.ok, "Create separate destination"); let target = result.project;
result = await run("project.rename", { projectId: source.id, revision: source.revision, title: "Flow source renamed" });
check(result.ok && result.project.document.title === "Flow source renamed", "Rename source"); source = result.project;
check(JSON.stringify(source.document.art) === JSON.stringify(initialArt) && JSON.stringify(source.document.versions) === JSON.stringify(initialVersions), "Rename leaves artwork and versions unchanged");
check((await run("project.rename", { projectId: source.id, revision: 1, title: "Stale name" })).code === "CONFLICT", "Stale rename rejected");
const referenceId = source.document.references[0].id;
const targetArt = JSON.stringify(target.document.art);
result = await run("reference.copy", { projectId: target.id, revision: target.revision, sourceProjectId: source.id, referenceId });
check(result.ok, "Copy reference to destination"); target = result.project;
check(target.document.references[0].reason === "QA flowing lines" && JSON.stringify(target.document.art) === targetArt, "Copy preserves reason and leaves canvas alone");
check(!(await run("reference.copy", { projectId: target.id, revision: target.revision, sourceProjectId: source.id, referenceId })).ok, "Duplicate copy rejected");
check(!(await run("reference.remove", { projectId: source.id, revision: source.revision, referenceId }, true)).ok, "Another guest cannot remove reference");
result = await run("reference.remove", { projectId: source.id, revision: source.revision, referenceId });
check(result.ok && result.project.document.references.length === 0, "Remove board reference"); source = result.project;
source = (await run("project.get", { projectId: source.id })).project;
check(source.document.referenceArchive[0].reason === "QA flowing lines" && JSON.stringify(source.document.art) === JSON.stringify(initialArt), "Archive persists with provenance and unchanged canvas");
result = await run("reference.restore", { projectId: source.id, revision: source.revision, referenceId });
check(result.ok && result.project.document.references[0].id === referenceId, "Restore archived source"); source = result.project;
const layerId = crypto.randomUUID();
result = await run("artwork.edit", { projectId: source.id, revision: source.revision, patch: { layers: [{ id: layerId, name: "Independent source", asset: "garden-grid", x: 15, y: 15, width: 35, height: 35, rotation: 0, opacity: 1, visible: true, filter: "none" }] } });
check(result.ok && result.project.document.art.asset === initialArt.asset, "Adding layer leaves background unchanged"); source = result.project;
source = (await run("project.get", { projectId: source.id })).project;
check(source.document.art.layers[0].id === layerId, "Layer persists after fresh read");
result = await run("version.undo", { projectId: source.id, revision: source.revision });
check(result.ok && !(result.project.document.art.layers?.length), "Undo added layer"); source = result.project;
result = await run("version.redo", { projectId: source.id, revision: source.revision });
check(result.ok && result.project.document.art.layers[0].id === layerId, "Redo returns layer");
console.log(JSON.stringify({ checks, result: "passed", scope: "Isolated existing Octo runtime guest: naming, reference correction, conflict, isolation, refresh, layer and versions" }));
