# docs: where things live

One place for every document, grouped by what it is for. The tests read this list: a new file in `docs/` needs a row here.

Status words: **proposal** (not accepted scope until its issue is confirmed), **live** (describes what runs), **evidence** (a record of something tested), **history** (an earlier build record, kept as it was), **generated** (rebuilt by a tool).

## Direction and plans

| File | What it is | Status | Issue |
|---|---|---|---|
| `people-first-plan.md` | The plan for the next phase: principles, flows, posts, profiles, makers, culture, global, ordered work, owner decisions | proposal | #29 |
| `product-priorities.md` | Priority list P1 to P12 after the partner review | proposal | #12 |
| `product-priorities-issue-draft.md` | The draft issue text for those priorities (not filed) | proposal | #12 |
| `studio-tools-plan.md` | Studio editing tools by help level; build versus reuse | proposal | #53 |
| `anti-slop-rubric.md` | What counts as AI slop, how a suggestion is checked, and the owner decisions needed | proposal | #51 |
| `open-design-spike.md` | What Open Design offers and what ran | evidence | #31 |
| `persona-asset-plan.md` | Research-led persona bibles so each maker's pictures read as one person; series generation and a blind match review | proposal | #38, #49, #51 |
| `visual-library-plan.md` | The recolourable picture library Studio places from, and the saved pack concepts and batch method for the next rounds | live | #158 |
| `octo-reach-test.md` | Read-only probes of vector and graph search; a proposed decision log | evidence | #42 |

## Specifications for people, stories and credit

| File | What it is | Status | Issue |
|---|---|---|---|
| `people-and-journeys.md` | Personas and the beginner, casual and expert journeys | proposal | #30 |
| `designer-story-spec.md` | The records that make a story, disclosure and the post layout | proposal | #30, #35, #50 |
| `collaboration-and-credit-spec.md` | Roles, credit, comments and the collaboration dashboard | proposal | #36, #52 |
| `cultural-context-and-respect-rules.md` | Maker-written context and rules for sample makers | proposal | #48 |
| `maker-roster.md` | The 18-maker fictional roster | proposal | #38, #49 |
| `user-flows.md` | The routes and flows of the current prototype | live | #12 |

## Data models

| File | What it is | Status | Issue |
|---|---|---|---|
| `data-models.md` | The planned data models, relations and migration order | proposal | #29 |
| `models.manifest.json` | Every model's name, version, status and storage, generated from `src/models` | generated | #29 |

## Technology

| File | What it is | Status |
|---|---|---|
| `tech-stack.md` | What the prototype runs on today and its dependencies | live |
| `tech-stack-roadmap.md` | Why each technology, tradeoffs, licences and a proposed analytics path | proposal |
| `Kresilo-tech-stack-investor-overview.pdf` | A short PDF of the above, built by `scripts/make-investor-pdf.py` | generated |

## Evidence and earlier build records

| File | What it is | Status |
|---|---|---|
| `live-verification.md`, `database-verification.md`, `mobile-creative-loop-verification.md` | Verification records for earlier increments | evidence |
| `qa/` | Checked-in acceptance evidence by increment (manifests, screenshots and JSON) | evidence |
| `asset_inventory.md` | Which artwork is cleared for the prototype | live |
| `builder-request.md`, `builder-continuation.md`, `builder-visual-review.md`, `first-build-review.md` | Earlier builder briefs and reviews | history |
| `layered-workspace.md`, `simple-creative-workspace.md`, `mobile-creative-loop-build.md` | Earlier build plans | history |

## Where other things live

- Code maps: `src/creative/README.md`, `server/creative/README.md`, `server/mcp/README.md`, `src/models/README.md`.
- Versions and what changed: `CHANGELOG.md`.
- Scope and acceptance live on the GitHub issues.
