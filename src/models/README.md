# src/models: planned data models

This folder is the versioned, tested registry of the data models planned for
the next phase. The plan in words is `docs/data-models.md`; the generated list
is `docs/models.manifest.json`. **Nothing here is wired into the running app.**

## Folder rules

1. **One entity per file**, named in kebab-case after the entity
   (`AuthorshipEvent` is `authorship-event.ts`). Small value objects that only
   make sense inside one entity (a story slide, a deck slide) live in that
   entity's file.
2. **Every file exports `model`**, built with `defineModel()` from
   `common.ts`: `name`, `version`, `status`, `issue`, `storage`, `file`,
   `schema`, a valid `example` and an `invalidExample`. It also exports the zod
   schema and its inferred type.
3. **Add the file to `index.ts`** (the `modelRegistry`). A test fails if a file
   is missing from the registry or the registry names a missing file.
4. **Nothing outside this folder imports from it.** `tests/` may. The one
   exception is `scripts/write-models-manifest.ts`. A test fails otherwise, so
   planned models cannot leak into the app by accident.
5. **Strict schemas.** `.strict()` objects, bounded strings and numbers, ids as
   uuid, timestamps as ISO strings, closed enums for origins and roles, no free
   CSS or HTML. Shared helpers are in `common.ts`.
6. **Storage is additive and in `kresilo_demo` only.** Either inside the
   project JSON document, inside the publication document, in a new
   `kresilo_demo` table, or as additive columns on an existing one. Never a
   second database, never `kresilo_research` (read-only). Migrations are not
   written here; the owner runs them. SQL sketches live in
   `docs/data-models.md`, labelled PROPOSED.
7. **Issue numbers** must come from `allowedIssues` in `common.ts`.

## Versions

Each model has a semver `version`, and every stored document carries
`schemaVersion` with the same major.

| Change | Bump | Example |
|---|---|---|
| New optional field, new enum value a reader can ignore, looser bound | minor | add `Comment.parentId` |
| Bug fix or doc-only change that does not alter what parses | patch | fix a comment |
| Required field added, field removed or renamed, enum value removed, tighter bound, meaning changed | **major**, with a migration | make `Credit.roles` required |

Readers accept any `schemaVersion` with the model's major (`schemaVersionFor`),
so additive changes never break stored data. A major bump needs a written
migration (in `docs/data-models.md`, then an owner-run SQL or script) before
the new version is used.

After changing `version`, `status`, `issue`, `storage` or `file`, regenerate the
manifest and commit it:

```
pnpm models:manifest
```

`tests/models-registry.test.ts` fails if `docs/models.manifest.json` is out of
date.

## Planned and live

- **planned** (`0.x.y`): a design that is not used by the app. May change freely
  until promoted.
- **live** (`1.0.0` or higher): the shape is in use. The app's own contract
  (today `src/creative/contracts.ts`) stays the source of truth; the model
  documents it and a test keeps the two in step (see `LayerEffects`).

### Promoting a model to live

1. Land the code that uses it (command, service change, UI) in its own
   issue-linked pull request. Validate through the one typed command service;
   an agent proposal never writes before approval.
2. Add the owner-run migration (additive only) and note it in
   `docs/data-models.md`.
3. Put the zod schema in the app contract (the app never imports from this
   folder), keep a drift test as `LayerEffects` has, and bump the model to
   `1.0.0` with `status: "live"`.
4. Run `pnpm models:manifest` and update the model's section in
   `docs/data-models.md`.
