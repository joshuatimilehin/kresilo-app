# Instructions for Claude Code in this repository

Read [HANDOFF.md](HANDOFF.md) first: how to run, test, deploy and change Kresilo.

For any change to screens or user flows, also follow [AI_RULES.md](AI_RULES.md). [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md) is the brand rule: clean, visual, icon-led design; no hint strips, subtitles or explanatory text on working screens; hover tooltips on icons are fine, and the selected tool is named in one fixed place.

- Typecheck with `npx tsc -p tsconfig.app.json --noEmit` (plain `tsc -p .` checks nothing).
- `pnpm build` runs lint, the tests and the production build; run it before opening a PR.
- Every change adds a CHANGELOG line under "Unreleased" ("Words removed: N; added: N" for on-screen words), and a row in `src/creative/README.md` for each new file in `src/creative` (a test enforces it).
- Product demos are built from real screens (HTML render, screenshots, ffmpeg). Generated video garbles interfaces; use it only for non-UI footage, and never present generated people as real footage of the founders.
