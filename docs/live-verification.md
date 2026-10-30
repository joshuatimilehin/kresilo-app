# Live verification — persisted workflow (October 18, 2026)

The built server ran locally with a server-only Octo credential supplied at
runtime (never committed, never sent to the browser), against workspace
`4a3b41e7-2e43-4485-9167-29426d53ccba`, writing only to `kresilo_demo`.
`/api/session` returned `mode: connected` (not the design preview), and the
page showed `SAVED · KRESILO_DEMO`.

## Browser journey (Playwright, Chromium)

Evidence: screenshots and `results.json` in `docs/qa/live-20261018/`.

### Guest 1 — desktop 1440×900
- Opened `/demo`; a persisted guest project was created
  (`9c987f23-e2de-4e3d-bff3-e213d866e073`), poster v1.
- Added the Salt Flats pack reference “Pale evaporation pools” with the
  required reason “pool lines give quiet rhythm for live QA”.
- Requested a proposal: it cited `ref-pool-lines` and that exact saved reason
  (plus two seed references), and the active poster did not change yet.
- Approved it: poster changed, poster version v1 → v2,
  versions [1, 2], decisions 2 → 3,
  history grew to 4 events.
- Refreshed the page: same project, same poster/version, reference and
  approved proposal still present (`demo-live-1440-after-refresh.png`).

### Guest 2 — second isolated context, desktop
- Received a different project (`20d63ae2-b696-4b17-a1fe-df53f03a8d45`) with no
  `ref-pool-lines` reference — guest isolation holds.
- Created a proposal and declined it: poster and poster version stayed
  v1, the proposal is recorded as declined.

### Guest 3 — mobile 390×844
- Opened `/demo` in a third isolated context, added “Dusk horizon circle”
  via the Folder sheet with a required reason, proposed from the Copilot
  sheet (citing `ref-dusk-horizon` and its reason), approved it
  (v1 → v2), refreshed, and the same project/poster persisted
  (`demo-live-390-after-refresh.png`).

No page errors were recorded in any context.

## Fix made during verification
The first live run exposed a citation bug: a proposal that explicitly used a
newly added pack reference dropped that reference from its three citations
(board order won over relevance). `src/domain/proposal.ts` now orders
citations by saved-context match first, then guidance rules, and preserves
that priority. A regression test in `tests/proposal.test.ts` covers a pack
reference cited beside seed references. No new dependencies.

## Database verification
- Before and after the journey, direct read-only SQL through the Octo query
  endpoint (workspace above) listed 12 `kresilo_research` tables and the same
  row count for every table (capabilities 16, domain_entities 17,
  domain_relations 20, graph_anchors 15, journeys 6, open_questions 15,
  product_truth_map 23, requirements 18, research_decisions 0,
  research_gaps 10, source_assets 60, source_links 38). Research unchanged.
  The October 17 record (`docs/qa/kresilo-database-checks.json`) stored only
  that 12 tables were fingerprinted, not the fingerprint values, so the
  comparison here is table list + row counts before/after this run.
- `kresilo_demo` has 9 tables. All test writes went through the app/API into
  `kresilo_demo` only, with labelled QA reasons. Guest projects created by
  QA are left as append-only demo evidence; history was not deleted (the app
  has no guest-deletion surface).

## Gates
`lint` (0 errors, 11 pre-existing warnings), `typecheck`, `test`
(53 tests, 4 files) and `build` all pass on October 18, 2026.

## Hosting status
Owner correction, October 18, 2026: the target hostname is
`kresilo.design-bakery.com` (spelled k-r-e-s-i-l-o), superseding the
earlier `kristello.design-bakery.com`. See PROJECT.md.

The first deployment was published under the misspelling
`kriesilo.design-bakery.com`. The owner corrected it on October 18, 2026. The
correct CNAME and tunnel ingress rule were created and verified, then the
misspelled record and rule were removed; the hostname now resolves to this
application only.

## Deployed run (October 18, 2026)

The same build now runs on the owner's MacBook Pro as the launchd service
`com.kresilo.prototype` (port 4390) behind the existing cloudflared tunnel, and
is reachable at `https://kresilo.design-bakery.com`. `/api/session` there
returns `mode: connected` and `copilot: { mode: "model", model:
"cb/deepseek-v4.1-flash" }`.

A browser run against the public hostname repeated the persisted journey: the
Copilot card named the model and its cost
(`cb/deepseek-v4.1-flash - 2636 tokens - $0.000010`), `project.get` returned an
unchanged poster between proposal creation and approval, approval changed the
poster, and the change survived a reload. No page errors were recorded. The
model key lives only in the server runtime environment file and is absent from
the built public bundle.

The Copilot path is optional and server-only: with `INFERHUB_API_KEY` set,
`proposal.create` asks the model for a draft and refuses anything that cites a
reference the project does not hold or fails to quote verbatim, falling back to
the deterministic rules; without the key the rules are used and the UI says no
external model was called. `tests/copilot-model.test.ts` covers the refusals
without calling the model.

## Issue #5 verification list (KRISTELLO_GUIDE §5)
1. Workspace confirmed by ID — yes, above.
2. Real server-only SELECT and insert/read in `kresilo_demo` — yes, via
   `/api/session` and the browser journey (reference/proposal/approval rows
   read back after refresh); the credential is server-only and absent from
   the built public bundle and repository.
3. Two guest sessions see distinct projects — yes (guests 1–3).
4. Refresh in one browser keeps state — yes, desktop and mobile.
5. Declined proposals do not corrupt or repeat writes — yes; decline kept
   the poster/version unchanged (duplicate/rollback behaviour was already
   proven by the 26 direct database checks on October 17).
6. `kresilo_research` unchanged; no workspace credentials in browser or
   repository — yes, see above.
