// Isolated guest records in the existing prototype runtime; no credentials printed.
import assert from "node:assert/strict";
const base = process.env.KRESILO_TEST_URL ?? "http://127.0.0.1:8080";
let cookie = "";
async function run(verb, input = {}, isolated = false) {
  const response = await fetch(`${base}/api/creative`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(!isolated && cookie ? { cookie } : {}) },
    body: JSON.stringify({ verb, input }),
  });
  if (!isolated && response.headers.getSetCookie().length)
    cookie = response.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  return response.json();
}
let count = 0;
function check(value, message) { assert.ok(value, message); count++; }
check((await run("workspace.get")).ok, "Open guest");
let result = await run("project.create", { brief: "QA undo redo acceptance", sourceWorkId: "garden-grid", reason: "QA geometry" });
check(result.ok, "Create project");
let project = result.project;
const id = project.id;
const original = structuredClone(project.document.art);
const step = (verb, revision = project.revision) => run(verb, { projectId: id, revision });
check(!(await step("version.undo")).ok, "Initial undo is unavailable");
result = await run("artwork.edit", { projectId: id, revision: project.revision, patch: { title: "First edit" } });
check(result.ok, "Save first edit"); project = result.project;
const versionCount = project.document.versions.length;
result = await run("comment.add", { projectId: id, text: "QA history does not undo comments" });
check(result.ok && result.project.document.versions.length === versionCount, "Comment does not add artwork undo steps");
project = result.project;
const stale = project.revision;
result = await run("artwork.edit", { projectId: id, revision: project.revision, patch: { size: 22 } });
check(result.ok, "Save second edit"); project = result.project;
check((await step("version.undo", stale)).code === "CONFLICT", "Stale navigation rejected");
result = await step("version.undo"); check(result.ok, "Undo second edit"); project = result.project;
check(project.document.art.title === "First edit" && project.document.art.size === original.size, "Undo only the last saved change");
result = await run("project.get", { projectId: id }); project = result.project;
check(project.document.versionNavigation.redo.length === 1, "Redo survives a fresh read");
result = await step("version.redo"); check(result.ok, "Redo second edit"); project = result.project;
check(project.document.art.size === 22, "Redo restores the saved state");
result = await step("version.undo"); project = result.project;
result = await run("artwork.edit", { projectId: id, revision: project.revision, patch: { title: "New direction" } });
check(result.ok, "Edit after undo"); project = result.project;
check(!(await step("version.redo")).ok, "New edit clears redo");
check(project.document.versions.some((v) => v.art.title === "First edit" && v.art.size === 22), "Abandoned branch remains inspectable");
const branchArt = structuredClone(project.document.art);
result = await run("version.restore", { projectId: id, versionId: project.document.versions[0].id });
check(result.ok && JSON.stringify(result.project.document.art) === JSON.stringify(original), "Restore original version");
project = result.project;
result = await step("version.undo");
check(result.ok && JSON.stringify(result.project.document.art) === JSON.stringify(branchArt), "Undo an explicit version restore");
project = result.project;
result = await run("version.undo", { projectId: id, revision: project.revision }, true);
check(!result.ok, "Different guest cannot undo this project");
console.log(JSON.stringify({ checks: count, result: "passed", scope: "Existing guest runtime; saved edits, undo, redo, conflict, refresh, branch and isolation" }));
