# People-first plan for the next phase (PROPOSAL, not accepted scope)

Status: draft for owner review, rewritten as one ordered document on October 22, 2026. Nothing here is accepted scope until the owning GitHub issues are confirmed. Lineage: parent leaf #29, then #12 and #1; task KRES-0011.

Labels: **observed** = read from the repository (`origin/main` 33e552e), the live site or read-only Octo queries on October 22, 2026; **inference** = not yet tested; **proposal** = does not exist unless named as existing. Planning input came from two read-only Opus passes; those are agent reports, not decisions.

Sample screens (private canvas, proposal only): https://claude.ai/artifact/Sycb3js4QPf5E84CUMhAYW. Walkthrough deck (private): https://claude.ai/artifact/TRA6UMFhhdc7iMiYXvrrCX.

## 1. What Kresilo is for

Kresilo is for artists and designers and the culture around their work. Its line is "Culture feeds creativity. Creativity produces culture." One outcome serves everything below: **a person can show where their work came from, what they decided, who they owe, and exactly where AI did and did not help.** Engineering and governance support that; they are not the headline.

## 2. The four principles (owner direction, October 22, 2026)

1. **Artist control (#51).** The artist decides; AI only proposes and never acts without approval. Per project and per step the artist sets how much AI may do (none, suggest only, assist, generate), can lock layers as hand-only, can reverse any AI step, and can turn AI off entirely. Everything AI did is marked on the canvas.
2. **AI with taste, not slop (#51).** Proposals must come from the artist's own references and reasons, as a few specific options, not many generic ones. Declined directions teach a per-artist taste profile the artist can see, edit and erase. A visible anti-slop rubric (generic gradients, over-smooth surfaces, stock composition, mismatched type, no point of view) screens proposals and generated assets before the artist sees them. Nothing is called slop-free until it is measured on a test set.
3. **A visible record of who did what (#50).** Every layer, decision and version records whether it was made by hand, AI-assisted or AI-generated, with the tool or model and the step it served. Posts show an authorship strip with a clear hierarchy: the artist's decision on top, AI proposals beneath. AI work can never be recorded as hand work. Any share of hand versus AI work comes from a written formula (for example counted layers and edits) and is labelled an estimate. Observed today: history stores one `actor` string (the person's name), so an approved AI change looks the same as a hand edit.
4. **Culture and people (#35 to #49, #52).** Lineage, credits, collaborators, makers, places, languages and cultural context, below.

### How the authorship record is stored (proposal)

It works like Photoshop's history, but permanent and light. Observed risk: media is stored as base64 rows in the Octo database and Octo queries time out at eight seconds, so weight comes from media, not from the record.
- Events are small text records (actor, tool or model, step, accepted, edited or declined, time), not file copies. Versions point at events; a full snapshot is kept only as a periodic checkpoint.
- Assets are stored once by content hash, so the same image kept twice or reused across projects is one file (this is the de-duplication in #39).
- Declined AI options keep only a thumbnail, the hash and metadata unless the artist pins them.
- Older versions collapse to checkpoints plus events; the artist sets retention and can export the record. Whether it can be exported as open Content Credentials (C2PA) is unverified.
- Large media moves to object storage (#44); the database holds records and hashes only. First step: size a real project's history and report numbers before choosing thresholds.

## 3. Who it is for

| Person | What they want |
|---|---|
| Designer or artist (Studio author) | Turn kept references and reasons into work they can explain, with AI under their control |
| Maker whose work is referenced | Credit, consent, seeing their influence travel (today only fictional samples) |
| Collaborator (invited) | Give feedback and edit with clear credit and role |
| Visitor or viewer | Discover work and understand its story |
| Follower, guest, curator | Track makers; try with no commitment; keep library quality and honesty |
| Reviewer of AI help | Judge whether the Copilot helped |

## 4. The three flows, from goal to published story

- **Beginner:** one sentence on Create; keep one to three references with reasons; the Copilot proposes citing them; approve, edit or decline; guided "tell the story" prompts; private preview; explicit publish with credits.
- **Casual:** goal; references; hands-on canvas with a reduced toolset (layers, size, filters, simple motion); decisions logged from versions; the person picks which appear; publish with credits.
- **Expert:** goal and audience; reference board with lineage; full canvas, console, adapters and motion (Open Design, unverified); decisions including declined directions; a curated process timeline; publish with lineage and credits.

**Acceptance test for every flow, "can a designer tell their story with this":** the published page shows the goal, a credited reference with the designer's reason, a decision with its rationale, a before and after version and the authorship strip; every element traces to a stored record; the designer chose the audience and what to disclose; a first-time viewer can say why it looks this way in under a minute. Beginner: unaided from Create in under fifteen minutes. Expert: includes at least one declined direction.

## 5. What people see

### Every published post (#35, #36, #43, #50)
Behance-style layout in the live dark look: a share rail (Follow, Keep as a reference, Share, Appreciate); **Made by** owners and collaborators with roles (Lead, Design, Type, Motion, Feedback) and Follow; stats; **Made with** (Copilot, Claude via MCP, by hand); **Where this came from** (each reference with creator, the designer's reason and a link to the source work); decisions including declined ones; before and after; the **authorship strip**; comments open to viewers; **Used in** on each source work; easy sharing (link, preview image, embed). Behance has no reference-to-work chain, so lineage is Kresilo's own and comes only from stored records, never image similarity. Private projects never appear in Used in.

### Maker profile (#37)
Observed: the live maker page has a round portrait, a small name, a bio, Follow and a works grid; the live story at `/stories/ayo-bello` is a full-bleed photo story with a progress bar and three slides ("Behind the Reference", the sunset "Then find the rhythm."). Proposal: open with a story cover (huge name, portrait cutout over the maker's own design, "Open story"); slide one is the person and their art, then the process slides; below it a switch of **Posts** (default, the main highlight), **Stories** (cover cards, not circles) and **Shorts** (vertical motion loops, no daily rule); works with discipline tags and "Made from N references"; influences linked to works. Pattern reference: linamakesnoise.com (a Webflow site with scroll-driven rows; pattern only, no assets). Open question: stories as permanent process stories, a short daily layer, or both.

### Collaboration dashboard (#52)
Per project: team and roles with credit status; who is working on what; an activity feed with every actor (person, Copilot, MCP agent) and its origin from #50; a review queue of open comments and AI proposals awaiting approval; invite more than one person, set roles, revoke; each collaborator's hand versus AI share as an estimate. Asynchronous, not live co-editing; presence only if the owner confirms. Observed today: one person can be invited for seven days, which grants access without a role, and comments live on the board only.

## 6. Fictional makers, culture and a global Kresilo

### Makers (#38)
Observed in `src/creative/catalog.ts`: six sample makers in Lagos, Accra, São Paulo, Kyoto, Beirut and Lisbon; most sample works from Lagos; only three bios say fictional. Proposal: 18 makers (six plus twelve) spanning Asia (East, South, Southeast, Central), Africa, Europe, North America, Latin America and the Caribbean, and Oceania, across disciplines including photography, photo editing, retouching, colour grading, lettering, textile, packaging, motion and spatial design, with one two-person collective. Each has a required `sample: true` field, a "Sample practice" badge on every surface enforced by a test, a portrait with background and cutout, three to four works through the vision quality gate and an owner spot check, and a seeded story from real project records. Invented names that do not match well-known living designers; no real likeness; no sacred or ceremonial motifs; lineage only between sample works; a sample maker can never be claimed by a real account.

### Cultural impact (#48)
Observed: the Culture layer is wording only. Proposal: optional context written by the maker (place, materials, practice, language, tradition), never invented by the AI; an influence view built from stored lineage; curated collections with sources; credit back to the creator and any named tradition; written respect rules; honest signals only (works referencing a source, regions connected, makers credited), no engagement scores. Excludes a full social network.

### Global and locale (#49)
Observed: no language support (`<html lang="en">`, no i18n library); "Explore by place" exists as one filter option and is hard to find. Proposal: a visible place switcher on Explore and every profile; at least two non-English languages including one right to left; maker text kept in its own language with any translation labelled machine translation and checked by a person before cultural context is shown as fact; basic photo-edit tools in Studio with each edit recorded as a decision.

## 7. Presentations and the design core

- **Open Design as the design core (#31).** Chosen by the owner for the three flows. Observed October 22, 2026 on GitHub: `nexu-io/open-design`, 103,338 stars, Apache-2.0, pushed that day; its description lists motion, prototypes, websites, apps, dashboards, presentations, images and video; the repository has design systems, design templates, plugins, a Figma plugin and Claude and Codex instruction files. Not yet run by us. A read-only inspection (see `docs/open-design-spike.md`) found it is an application (Next.js, a local Express and SQLite daemon, Electron), with 153 design systems, 116 deck, prototype and motion templates and 171 skills. Strong fit: its design-system package (manifest, DESIGN.md rules, tokens.css) as the per-project stylesheet and brand guideline, its HTML deck templates and a PowerPoint skill, and HyperFrames motion. Weak fit: its only canvas library is Excalidraw, a whiteboard, so Kresilo keeps its own layered Studio. Run on October 22, 2026 (observed): installs in about a minute (2.4 GB); the daemon serves 152 design systems and 126 templates and an MCP server with 22 tools (create project, write file, start run and others); its web app crashed on a 2 GB heap and needs a larger one, heavy for an 8 GB machine that also hosts the site. Hermes is a real adapter in its registry and was detected here. Recommendation (inference): option C-plus, an optional headless sidecar whose output enters only as approved, authorship-tagged proposals; design-system packages are the best reuse. Generation tried through Hermes (the owner's InferHub gateway): a six-slide animated deck looked strong but invented some copy and delivered only transitions, no keyframe animation; a six-second MP4 rendered but showed gradient banding. PowerPoint and PDF export are untested. Its manual-edit panel covers size, spacing, type, colour, opacity, radius and blur but has no rotate, shadow, crop or mask; those tools are issue #53, planned by help level with a build-or-reuse decision in `docs/studio-tools-plan.md`.
- **Branded slide decks with animation (#47).** Each project picks a stylesheet and brand guideline; the Copilot drafts slides and animation inside those rules; proposals that break them are flagged before approval. Unverified: what Open Design offers for decks and which exports work.
- **Open access (#41).** The one typed command service is also an MCP server and CLI for Codex, Claude and other harnesses; every call records its actor. "Hermes" is unverified.

## 8. Octo with GitHub (proposal)

GitHub owns scope, acceptance and delivery. Octo owns runtime data (`kresilo_demo`) and research knowledge (`kresilo_research`, read-only). Observed: the workspace has the `vector` extension; `kresilo_demo` has 17 tables and `kresilo_research` 12; the app uses relational SQL only. Step zero (#42): prove the app's server can call `query_workspace` and `query_graph` (they look like connector tools). Decision records need an owner choice: write access to `research_decisions`, or a `kresilo_demo` log. The guide advises against graph queries in routine UI actions. No second database.

## 9. Ordered work (issues under #29)

| Order | Issue | What | Depends on |
|---|---|---|---|
| 1 | #50, #51 | Authorship record; AI control and taste standard | #35, #41, #32 as noted on the issues |
| 1 | #31 | Open Design spike and decision gate | none |
| 2 | #30 | People, journey, story, collaboration, culture and artist-consent documents | none |
| 2 | #32, #33, #34 | Help level in Studio; Studio guidance; close the older write path | none |
| 3 | #35, #36 | Lineage and credits on posts; comments | #30 |
| 3 | #52 | Collaboration dashboard | #36, #50, #41 |
| 3 | #38, #49 | 18 makers; global roster, photo tools, place and languages | #30 |
| 4 | #37, #39, #43, #48 | Profile; cross-project lineage and de-duplication; sharing; cultural context | #35, #38 |
| 4 | #40 | Beginner, casual, expert flows | #32, #33, #31, #35 |
| 4 | #53 | Studio editing tools: crop, mask, rotate, shadow, shape, type | #31, #50, #32 |
| 5 | #41, #47, #44, #42 | MCP access; branded decks; media storage; Octo reach test | see issues |

Quick fixes independent of Open Design (observed): the Studio gate shows only a red toast; the Create idea is not shown in Studio; "Use in Studio" versus "Keep as a reference" is unexplained; Projects shows "1 versions"; a second write path `/api/command` is still reachable; the code names levels guided, explorer and advanced while the owner says beginner, casual and expert. `/me` from PR #28 is merged but the live site still redirects it to the home page.

## 10. Documents to change or create

Read the Octo research tables `journeys`, `requirements`, `product_truth_map`, `open_questions` first. New: people and journeys, product requirements (there is no separate SRS in the repo), designer story, collaboration and credit, cultural context and respect rules, artist consent policy, AI control and taste rubric, Copilot brand voice. Update: `docs/user-flows.md` (profile is `/me`, settings `/you`), `docs/product-priorities.md`, `BUILD_PLAN.md`, a supersession note on `HANDOFF.md`. 

Drafts written for issue #30 (all proposals): [people and journeys](people-and-journeys.md), [designer story specification](designer-story-spec.md), [collaboration and credit specification](collaboration-and-credit-spec.md), [cultural context and respect rules](cultural-context-and-respect-rules.md). `docs/user-flows.md` now names `/me` as the profile and `/you` as settings, and carries a proposed story flow. Still to write: product requirements, artist consent policy, AI control and taste rubric, Copilot brand voice. The Octo research tables were not queried for these drafts.

## 11. Decisions only the owner can make

1. Confirm the scope beyond one working workflow (three flows, Open Design, adapters, decks, a collaboration dashboard), on #12.
2. Credit rules: references, collaborators and the AI's part; how imported media is credited.
3. What the Culture layer means for the prototype: feed, lineage across makers, or wording only.
4. What a Story is: permanent process stories, a daily layer, or both.
5. Whether declined directions and prompts are ever public.
6. The first two interface languages, and who checks translations.
7. Where decision records go in Octo, and whether the Copilot may query Octo at runtime.
8. Whether an extra service on the MacBook Pro is acceptable and whether experts get a link out to Open Design if porting fails.
9. Roster size and image model for the makers, and who spot-checks portraits.
