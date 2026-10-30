# Open Design spike: what is reusable (PROPOSAL, read-only findings)

Status: draft for owner review, October 22, 2026. Issue #31, parent #29. Part one was a read-only inspection; part two (below) is a local build and run on October 22, 2026. Labels: **observed** = read in the files or on GitHub; **inference** = my reading, not tested; **unverified** = needs a run.

Source inspected: `nexu-io/open-design`, a 485 MB extracted copy at revision `8d820a6` (commit date October 21, 2026) in a scratch cache; GitHub metadata read October 22, 2026: 103,338 stars, Apache-2.0, last pushed that day. The copy is one day behind upstream.

## What it is (observed)

An application, not a component library: a Next.js 16 web app (React 18), a local Express and SQLite daemon that owns `/api/*`, agent spawning, skills, design systems and artifacts, and an Electron shell; runs on Node 24 with pnpm. Projects hold design files and agent conversations; outputs are "artifacts" (prototypes, decks, images, video, audio). Content directories: 153 design systems, 116 design templates, 171 skills, 8 plugins. Also a Figma plugin, a pptx skill and fidelity audit, MCP plumbing in the daemon, a Docker deployment, and "OpenDesign Cloud" as an optional paid service.

## Reusable for Kresilo

| Need | What Open Design has | Fit |
|---|---|---|
| **Project stylesheet and brand rules (#47)** | A portable design-system package: `manifest.json` (id, category, provenance), `DESIGN.md` (prose rules for the agent: palette, type scale, usage) and `tokens.css` (compiled tokens the agent pastes into every artifact and references by variable). 153 bundled. | **Strong.** This is nearly the "stylesheet plus brand guideline per project" the owner described. Inference: adopt the package format for Kresilo projects and let people import or author their own. |
| **Slides with animation (#47)** | `design-templates/html-ppt-*`: dozens of HTML-based deck templates, each a `SKILL.md` plus `example.html`; a `pptx` skill, a `dom-to-pptx` bundle and a fidelity audit for PowerPoint export. | **Strong for decks.** Inference: HTML slides with CSS animation; PowerPoint export quality is unverified. |
| **Motion** | HyperFrames is used by templates and skills (the same renderer Kresilo already ships); motion skills and video templates; a `motion` library and three.js in the web app. | **Good.** Kresilo already renders HyperFrames; inference: templates could feed the existing renderer. |
| **Agent access (#41)** | A daemon with MCP support: config, OAuth, tokens, agent install, a live-artifacts MCP server, an "active project" concept. | **Good reference.** Unverified which tools it exposes and whether it can sit behind Kresilo's command service. |
| **Embedding behind another system** | `orchestrator-workspaces.md`: folder-backed projects with explicit provenance; OD reads and writes the given workspace and reports provenance; the caller owns writeback. | **Good.** Fits a sidecar where Kresilo owns records. |
| **Design canvas** | The only canvas library found is `@excalidraw/excalidraw` (a whiteboard), plus Lexical for text. No pixel or layer editor found. | **Weak.** Inference: its canvas does not replace Kresilo's layered Studio, so porting it is low value. |

## Fit with Kresilo's rules

- **One typed command service, nothing before approval:** Open Design's agent writes files in its own project folders. Inference: it must run as a sidecar whose output arrives as a Kresilo proposal, never written straight into Kresilo records.
- **No second database:** its daemon keeps SQLite and files of its own. Inference: acceptable only as transient scratch state, with Octo holding the record (the fail-closed default in #31).
- **Authorship (#50):** its design-system and skill content is AI-driven by design; every output imported into Kresilo must be tagged AI-generated or AI-assisted with the tool named.
- **Licence:** Apache-2.0 (observed). Notice duties apply. Design systems and templates have per-package provenance; some are named after real companies (observed), so brand and trademark use needs a per-package check before Kresilo ships any of them.
- **Cost and hosting:** a local daemon plus web app is a second running service on the MacBook Pro (owner decision). Its cloud and credits are optional and not needed.

## Recommendation (inference, for the owner)

Take option **C-plus** from #31: do not port its canvas; keep Kresilo's layered Studio. Adopt Open Design's design-system package format as the per-project stylesheet and brand guideline, reuse its HTML deck templates and motion templates as data, and run it as an optional sidecar for the expert flow and deck generation, with its output entering Kresilo only as approved, authorship-tagged proposals. Decide the sidecar after a real run.

## Run results (observed, October 22, 2026)

Built and run from the extracted copy (revision `8d820a6`) in a scratch cache, with its data directory set to a scratch folder, on this MacBook (Apple silicon, 8 GB RAM, Node 24.22, pnpm 10.33.2 through Corepack). Stopped afterwards; nothing was installed outside the scratch cache.

| Check | Result |
|---|---|
| Install | `pnpm install --frozen-lockfile` succeeded in 63 seconds; `node_modules` is 2.4 GB. Build scripts for `node-pty`, ffmpeg, ffprobe and `@google/genai` were skipped (not approved). |
| Daemon | Started in seconds and answered `/api/health` (version 0.25.1). Catalogues: 152 design systems, 126 design templates, 169 skills, 465 plugins. |
| Web app | **Crashed** with "JavaScript heap out of memory" (about 2 GB) while compiling its home route on first load. After restarting with `NODE_OPTIONS=--max-old-space-size=4096` it served HTTP 200 and stayed up. On an 8 GB machine that already runs other servers, this is heavy. |
| Design systems | `/api/design-systems` lists packages with id, title, category, summary, swatches and surface; `/api/design-systems/default` returns the `DESIGN.md` prose. Matches the package format in part one. |
| Deck template | `/api/skills/html-ppt-pitch-deck/example` returned one 29 KB standalone HTML page with 25 keyframe animations, transitions and `data-anim` attributes. 57 deck-mode and 57 prototype-mode templates; 3 video templates including `hyperframes` and `video-shortform`; 1 audio. |
| MCP | `od mcp` ran as a stdio MCP server (`open-design` 0.2.0) and listed 22 tools: `create_project`, `create_artifact`, `write_file`, `get_file`, `list_files`, `search_files`, `get_artifact`, `start_run`, `get_run`, `cancel_run`, `list_agents`, `list_skills`, `list_plugins`, `collect_brief`, `confirm_brief`, and others. |
| Agents | The daemon lists 27 agent adapters. On this Mac it detected `amr`, `byok-opencode`, `hermes` and `grok-build` as available; `claude` and `codex` showed as not installed (probably PATH), so Hermes is a real harness in its registry. |
| Data | The scratch data directory was 7.9 MB after the run. The daemon keeps its own SQLite and files, as expected. |

### What this changes in the recommendation

- **Sidecar over HTTP or MCP is feasible.** Kresilo's server could create a project, write the brief and design-system files, start a run and read back the files through the MCP tools, then turn the result into a Kresilo proposal tagged AI-generated (issue #50). This fits the "proposals only" rule.
- **Weight is the cost.** A 2.4 GB install and a web app that needs more than a 2 GB heap make it a poor always-on service on this MacBook, which also hosts the live site and CI. Inference: run only the daemon (no web UI) for Kresilo's use, or run it on another machine.
- **Design-system packages are the best reuse.** They can be read and validated without the daemon, and are the per-project stylesheet and brand guideline for #47.
- **Hermes is real.** It appears in the agent registry and was detected here; whether Kresilo's own MCP server works with it is still untested.

## Generation results (observed, October 22, 2026)

Driven through its own MCP tools (`create_project`, `start_run`, `get_run`) with the Hermes adapter, whose configured provider on this Mac is the InferHub gateway (the owner's own). Daemon only, no web UI: about 510 MB resident while running.

**Deck.** Project with the `editorial` design system and the `html-ppt-taste-editorial` template; prompt asked for six slides from the plan text, dark, with animation on slide entry, no invented statistics. First `deck.html` appeared about 50 seconds after the run started (32 KB, six slides); the run was still marked running and refining the file after ten minutes.
- **Look:** strong. Warm near-black ground, Instrument Serif italics with Inter Tight and a mono for labels, a consistent grid, restrained and editorial; it picked the same display serif the live Kresilo site uses. Rendered with WebKit and viewed.
- **Content:** it followed the six-slide brief and added no statistics (the only digits are slide numbers). It also **invented content**: quoted "questions" a person asks for each flow, a rule that "hand steps stay unmarked by a tool", and four decision questions I never supplied. Everything it makes needs the artist's review and an AI-generated tag (#50).
- **Animation:** requested entry animation was only partly met: zero `@keyframes`, six CSS transitions and one script for slide navigation. The prompt asked for more than it delivered.
- **Export:** not tested. HTML only. PowerPoint export exists in its desktop app (`dom-to-pptx`) and a `pptx` skill; PDF was not tried.

**Motion.** Project with the `hyperframes` template; prompt for a six-second calm sunrise loop of the Salt Flats poster. It produced `salt-flats.mp4`, 2.9 MB, 1920 by 1080, 6.0 seconds, rendered through HyperFrames on this Mac. Frames viewed: a calm lavender-to-peach sky, a teal field, a small figure, the title "Salt" fading in at lower left.
- **Quality:** calm and on brief, but the gradients show visible banding and concentric rings, and the field shows faint horizontal lines. Those are exactly the "generic gradient, over-smooth surface" faults the anti-slop rubric in #51 should catch. It also added a label "SALT FLATS · STUDY 01" that was not requested, and the last frame fades to near-black, so it is not a seamless loop.
- **Cost and speed:** a first composition and an MP4 within about eight minutes of starting; the run itself kept going past ten minutes.

## The editing tools in Open Design (observed in source)

Its web app has a **manual edit** surface for generated HTML: `ManualEditPanel` (1,261 lines), `ManualEditSelectionOverlay`, `ManualEditTextToolbar`, `ManualEditColorPicker`, with patch-based undo and redo; a `SketchEditor` (1,088 lines) and a `PreviewDrawOverlay` (2,008 lines) for drawing and annotating on previews; deck thumbnail rail and slide thumbnails. Searching the panel's source for style names: colour, width, height, margin, padding, gap, line height, font size, font weight, letter spacing, text align, opacity, border radius, background, filter and blur appear; **rotate, shadow, crop, mask and clip do not appear at all.** The panel edits CSS on an HTML element, not raster image layers. The components depend on its own types, i18n and provider registry and on React 18 (Kresilo's app is React 19), so reuse means copying patterns and small pieces with Apache-2.0 notices, not lifting the panel whole. Rotation, shadow, crop and mask (the tools the owner named as missing) would be built in Kresilo's layer model; tracked as issue #53.

## Still unverified

1. Whether the daemon runs headless without the web app, and its memory in that mode.
2. PowerPoint and PDF export quality; image generation; the run's long tail (why it stayed running).
3. How the interface looks and feels (the Browser pane was not allowed to open the local address).
4. Which bundled design systems and templates have licences that allow shipping them (some are named after real companies).
5. Whether `claude` and `codex` are detected once the PATH is set.
