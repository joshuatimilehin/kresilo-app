import { describe, expect, it } from "vitest";
import { newProject } from "../src/creative/contracts";
import { asReference } from "../src/creative/catalog";
import { journeySteps, levelName, nextStep, storyCheck } from "../src/creative/journey";

const fresh = () => newProject(crypto.randomUUID(), "A poster for the evening market", "Study");

describe("the path from goal to story", () => {
  it("starts with the goal done and the reference next", () => {
    const steps = journeySteps(fresh());
    expect(steps.map((s) => s.id)).toEqual(["goal", "reference", "change", "decide", "story", "publish"]);
    expect(steps[0].done).toBe(true);
    expect(nextStep(steps).id).toBe("reference");
  });

  it("ticks steps from stored records only, and never ticks the publish destination", () => {
    const p = fresh();
    p.references.push(asReference("tidal-lines", "Keep the flowing lines")!);
    expect(journeySteps(p)[1].done).toBe(true);
    p.proposals.push({ id: crypto.randomUUID(), intent: "Quieter", rationale: "r", cites: [], patch: {}, baseVersion: 1, status: "proposed", provenance: "Prototype guidance" });
    let steps = journeySteps(p);
    expect(steps.find((s) => s.id === "change")!.done).toBe(true);
    expect(steps.find((s) => s.id === "decide")!.done).toBe(false);
    expect(nextStep(steps).id).toBe("decide");
    p.proposals[0].status = "approved";
    steps = journeySteps(p);
    expect(steps.find((s) => s.id === "decide")!.done).toBe(true);
    expect(steps.at(-1)!.done).toBeNull();
    expect(nextStep(journeySteps(p)).id).toBe("story");
  });

  it("names the levels the way the owner does", () => {
    expect(levelName).toEqual({ guided: "Beginner", explorer: "Casual", advanced: "Expert" });
  });
});

describe("the story check", () => {
  it("is met only by stored records", () => {
    const p = fresh();
    expect(storyCheck(p).filter((c) => c.met).map((c) => c.id)).toEqual(["goal", "authorship", ]);
    p.references.push(asReference("tidal-lines", "Keep the flowing lines")!);
    p.decisions.push({ id: crypto.randomUUID(), title: "Quieter", reason: "It reads calmer", cites: [], version: 2 });
    p.versions.push({ ...p.versions[0], id: crypto.randomUUID(), number: 2, note: "Quieter" });
    expect(storyCheck(p).every((c) => c.met)).toBe(true);
  });

  it("gives every line a basis, so nothing is claimed without a record", () => {
    for (const c of storyCheck(fresh())) expect(c.basis.length).toBeGreaterThan(10);
  });
});
