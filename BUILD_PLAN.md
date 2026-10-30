# BUILD PLAN — execution order for local Codex + app builder

**Objective:** a shareable, branded Kresilo web prototype with a responsive homepage and functional Salt Flats Studio. See [full handoff](HANDOFF.md), [asset reference map](DESIGN_ASSETS.md) and the [GitHub epic](https://github.com/Pukujan/kresilo/issues/1).

## Priority / issue queue

| Sequence | Issue | Output / acceptance | Dependencies |
| --- | --- | --- | --- |
| 0 | [#2 Bootstrap and asset intake](https://github.com/Pukujan/kresilo/issues/2) | App builder integration, stack, build scripts, source/asset inventory, / and /demo skeleton | Local app builder access; owner-cleared assets |
| 1 | [#3 Homepage](https://github.com/Pukujan/kresilo/issues/3) | Original Kresilo editorial brand, CTA, mobile + desktop | #2 tokens/assets |
| 2 | [#4 Responsive Studio](https://github.com/Pukujan/kresilo/issues/4) | Faithful desktop/mob UI, editable poster, tabs/sheets | #2 visual assets |
| 3 | [#5 Kristello persistence](https://github.com/Pukujan/kresilo/issues/5) | Secure per-guest Octo data, shared typed command registry | Workspace connector, #2 scaffold |
| 4 | [#6 Actual user journey](https://github.com/Pukujan/kresilo/issues/6) | Add reference → propose → approve/deny → canvas, decision, version, History, reload | #4 + #5 |
| 5 | [#7 Private publish preview](https://github.com/Pukujan/kresilo/issues/7) | Toggles render safe selected fields, no automatic publication | #5 + #6 |
| 6 | [#8 QA + deploy](https://github.com/Pukujan/kresilo/issues/8) | Tested hosted URLs, responsive screenshots, truthful delivery report | #3–#7 |

## Suggested timebox (planning target, not a guarantee)

With app-builder assistance and immediate access to assets/Octo, aim for a **5–8 focused workday** web-prototype sprint:

- **Day 1**: builder discovery, tokens, image intake, app skeleton.
- **Day 2**: polished homepage plus desktop shell.
- **Day 3**: mobile shell and usable sheet components; DB migration and guest project seed (parallel where feasible).
- **Day 4–5**: typed commands, proposal/approval behavior, project/version/history persisted through Octo.
- **Day 6**: preview/publish controls, accessibility.
- **Day 7–8**: visual parity review, functional test, deployment and sendable link.

Actual timeline depends on original design pack access, public-use approval and Kristello backend connection. Never let speculative external provider integrations block the one real workflow.

## Deliverable versions / stop-the-line gates

**Checkpoint A — Layout is present:** Routes `/` and `/demo` serve, art/brand matches supplied imagery and screenshot shapes. No claim of functional completion.

**Checkpoint B — State is real:** Guest can save a reference and see it after reload via Octo; per-session data isolation works; no client-side secrets.

**Checkpoint C — One vertical slice is complete:** Proposed change is inert until approval; approval produces visible change and Decision/Version/History; decline doesn't mutate artwork. Terminal uses same backend command executor.

**Checkpoint D — Sendable:** Private publish preview works, links are live, responsive/mobile acceptance gates pass, production demo URL verified, owner review requested. Publishing actual creator projects or social discovery is outside first send.

## Work decomposition for automated app builder

### Frontend generation request
Build one coherent branded UI component system, not separate disconnected desktop/mobile pages. Routes: `/`, `/demo`, optional `/demo/publish`. Reusable Header, EditorialHero, StudioShell, ProjectSidebar, ReferenceBoard, EditablePoster, CopilotPanel, ApprovalCard, HistoryTimeline, TerminalPanel, MobileToolbar, BottomSheet, PublishPreview. Use actual Kresilo graphic pack. Match reference screenshots, ensure responsive behavior.

### Backend generation request
Use one existing Kristello/Octo workspace `4a3b41e7-2e43-4485-9167-29426d53ccba`. Add isolated `kresilo_demo` schema and migration files. Implement guest session ownership, seed project, typed verbs `project.get`, `reference.add`, `proposal.create`, `proposal.approve`, `proposal.decline`, `decision.add`, `history.list`, `version.save`, `publish.preview`, with validations/transactional writes. Only backend accesses credentials. Repo research schema is read-only.

### Integration request
Bind UI callbacks and terminal parser to **same backend command functions**. Deterministic rule-based proposal uses selected reference reasons and project intent; must output source IDs and a typed poster patch. Do not call or fake Figma/Higgsfield/Claude. Real model integration can be a separate, later opt-in issue.

### Testing request
Test approval invariant, refresh durability, session isolation, version uniqueness, UI/terminal consistency, mobile touch controls, responsive screenshots and no private-data publication. Use CI and document exact commands.

## Suggested implementation folder structure (adapt to app builder)

```
app/                  # Next.js App Router if selected; otherwise builder's equivalent
  page.tsx            # homepage
  demo/page.tsx       # Studio
  demo/publish/       # preview
components/
  brand/ studio/ canvas/ agent/ terminal/ publish/
lib/
  kresilo/            # typed domain/commands + rules
  kristello/          # server-only Octo adapter
db/
  migrations/         # isolated kresilo_demo DDL
public/
  assets/kresilo/     # cleared, web-optimized public assets only
docs/
  asset_inventory.md
tests/
DELIVERY_REPORT.md    # after testing
```

## Blockers and decision defaults

| Decision | Temporary default for demo | Escalation |
| --- | --- | --- |
| Real external tools | None. Read-only extension list with `Not connected` | Require owner credentials/explicit task to connect |
| AI assistant | Deterministic, grounded demo proposal `No external model called` | Optional LLM tool calling only later |
| Mobile | Responsive web Studio with mobile-native layout, **not** native app | No mobile app stores or platform packages |
| Publishing | Private in-app preview; send the deployed /demo URL | Public work page only after privacy+rights checks |
| Storage | Existing Octo workspace, separate `kresilo_demo` SQL namespace | Request authorized connector access if unavailable |
| Portfolio art | Cleared original pack + faithful editable poster composition | Ask owner before publicizing a previously private image |
| Asset ownership | Link sources, verify public display clearance | Don't assume Drive sharing implies public website permission |

## Required work notes

- Use branch-per-milestone or small PRs; link each PR to an issue and screenshots/functional result.
- Before starting backend writes, inspect Octo schema and confirm permissions; don't alter research tables.
- After completing each issue, comment with changed files, commands run and screenshots, and mark only accepted boxes.
- Final response to owner should include exact deployed homepage/demo URLs, screenshots, source commit, which buttons are real, and which tools are not connected.
