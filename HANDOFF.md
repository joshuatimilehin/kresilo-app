# Handing Kresilo over

Kresilo is a culture-first creative platform: a feed of real projects by makers, a Studio where an assistant proposes and the artist decides, events, open boards, competitions, moodboards. This file is what a new owner needs to run, change and ship it.

## Run it

```bash
corepack enable
pnpm install
cp .env.example .env.local   # fill in the values below
pnpm dev                     # http://localhost:8080
```

- `pnpm build` = lint + tests + production build (what CI runs). `pnpm test` runs the tests alone.
- Typecheck: `npx tsc -p tsconfig.app.json --noEmit`.
- Without database keys the app still runs: Home, Discover, the project reel and the samples are built in; anything that saves (accounts, events, boards, competitions, follows, moodboards) needs the database.

## What it is made of

- Nitro 3 server (`server/`) and React 19 + Vite + TypeScript front end (`src/`), validated with zod, tested with vitest.
- `src/creative/` holds the product; `src/creative/README.md` is the module map (a test checks every file is listed).
- The sample portfolio (75 projects, 38 makers) is data in `src/creative/portfolio` and `src/creative/roster`, with generated pictures in `public/assets/kresilo`.
- Studio's visual library: 1,270 recolourable pictures in `public/assets/kresilo/visuals` plus `src/creative/visuals/library.json`. Template packs are in `src/creative/packs`.
- Small copies of covers and portraits for phones: `scripts/art-thumbs.sh` and `scripts/portrait-thumbs.sh`. Run them after adding a cover or portrait (tests check they exist).

## Environment variables (`.env.example`)

- `OCTO_BASE_URL`, `OCTO_API_KEY`, `KRESILO_SCHEMA`: the database (an Octo workspace, schema `kresilo_demo`).
- `KRESILO_COOKIE_*`, `KRESILO_SESSION_TTL_HOURS`, `KRESILO_RATE_LIMIT_PER_MINUTE`, `KRESILO_MAX_BODY_BYTES`: sessions and limits.
- `INFERHUB_*`, `COPILOT_MODEL`, `INFERHUB_OMNI_MODEL`: the model gateway the assistant uses.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`: Google sign-in.
- `HYPERFRAMES_BROWSER_PATH`: the browser used to render motion exports.

Secrets are not in this repository. Ask the previous owner for them, or create your own.

## The database

`db/migrations/001` to `018` are additive SQL files for the `kresilo_demo` schema. They were applied one statement at a time by a small runner against the live workspace; run them in order on a new database. Read a migration before applying it, and never edit one that has been applied: add a new number.

## Deploying

Until the move, the live site runs at kresilo.design-bakery.com on the previous owner's Mac and database. The product's own domain is `kresilo.com`: set up your own hosting, build the app (`pnpm build`), run `node .output/server/index.mjs` with the environment above, put it behind `kresilo.com`, and point the database variables at your own Octo workspace (run `db/migrations` in order). Pictures under `/assets` are served with their own cache rule; script and style bundles are fingerprinted and cached for a year. `HANDOVER_TERMS.md` says how long the old address keeps running.

## How changes are made

- Open a pull request, let CI pass (`.github/workflows/ci.yml`), squash merge.
- Add a CHANGELOG line and keep `src/creative/README.md` current.
- Screens follow `BRAND_GUIDELINES.md` and `AI_RULES.md`: icon-led, no hint text, a visible way back, nothing that makes the site read like an audit, and no AI badge on posts or pictures (how much AI was used is told by the authorship record a maker chooses to show).
- Scope lives on the GitHub issues. Open boards, idea cards, competitions, follows and moodboards each have a migration and tests; read those first when touching them.

## Ownership and licences

Who owns what, and the licence back to the previous owner, is in `HANDOVER_TERMS.md` (a draft until both people sign) and `LICENSE`.

## Third-party licences and credits

`THIRD_PARTY_NOTICES.md` and `third-party/` carry the licences for bundled and referenced material (including a copy of Open Design's licence). Pictures in `public/assets` are AI-generated originals made for this project.
