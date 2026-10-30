# Octo reach test: vector search, graph search and where decisions are recorded

**PROPOSAL.** Nothing here is built or accepted scope. Issue: [#42](https://github.com/Pukujan/kresilo/issues/42), a sub-issue of #29. Tested on October 22, 2026 against branch `claude/investor-pdf` (add6664).

Labels: **observed** = a read-only query or a file I read in this session; **inference** = reasoned from observed facts, not tested; **unverified** = could not be tested here.

## 1. The short answer

1. The app's server path can reach vector maths today; it cannot reach vector search over our own data yet, because no table has a vector column. **Observed.**
2. `query_workspace`, `query_graph` and `graph_health` are not reachable from the app's HTTP endpoint as far as anything in the repository shows. They look like connector (MCP) tools only. **Unverified**, because this session had no Octo connector and I did not guess routes.
3. Decision records belong in a new `kresilo_demo.decision_log` projection, not in `kresilo_research.research_decisions`. **Inference**, for the owner to confirm.
4. Image embeddings for #39 are feasible at our size (about 13 images) with no index, but the gateway's embedding support is unconfirmed. **Observed** for sizes, **unverified** for the gateway.

## 2. What I ran

Every probe was a single `SELECT` sent to the documented endpoint, `POST {OCTO_BASE_URL}/api/workspaces/{id}/query`, with the Bearer key read from `.env.local` inside a script that never printed it. No INSERT, UPDATE, DELETE or DDL was sent, no table was created, and `kresilo_research` was only read. Every call returned HTTP 200 in 0.11 to 0.6 seconds. Results are counts and names only; no user data.

| Query (abridged) | Result |
| --- | --- |
| `select extname, extversion from pg_extension` | `plpgsql 1.0`, `vector 0.8.6` |
| `select left(version(),60)` | PostgreSQL 16.15 |
| `select '[1,2,3]'::vector <-> '[3,2,1]'::vector, ... <=> ..., vector_dims(...)` | L2 distance 2.828, cosine distance 0.286, 3 dimensions |
| `select ... from pg_extension e join pg_namespace n ... where extname='vector'` | the extension lives in schema `public` |
| `select ... from pg_available_extensions where name in ('vector','pg_trgm','pg_cron')` | `vector` 0.8.6 and `pg_trgm` 1.6 available; `pg_cron` not |
| `select ... from pg_attribute ... where type like 'vector%' or 'halfvec%' or 'sparsevec%'` | 0 rows: no vector column anywhere |
| `select ... from pg_indexes where indexdef ilike '%hnsw%' or '%ivfflat%'` | 0 rows: no vector index |
| `select table_schema, count(*) ... from information_schema.tables` | `kresilo_demo` 17 tables, `kresilo_research` 12 |
| `select nspname from pg_namespace` (non-system) | `kresilo_demo`, `kresilo_research`, `public` |
| `select count(*) from kresilo_research.research_decisions` | 0 |
| `select count(*) from kresilo_demo.decisions` | 305 |
| `select column_name, data_type from information_schema.columns` for `research_decisions`, `decisions`, `creative_media` | columns listed in section 5 |
| `select count(*), pg_size_pretty(pg_total_relation_size('kresilo_demo.creative_media'))` | 36 rows, 20 MB |
| `select count(*) from kresilo_demo.creative_media where content_type like 'image/%'` | 13 images |
| `select avg(length(data_base64)), max(length(data_base64))` | average 537 kB, maximum 1679 kB per image row (base64 text) |
| `select count(*) from pg_proc ... where nspname='kresilo_demo'` | 35 functions |
| `select current_setting('statement_timeout')` | 30s on the server side |
| `select rolsuper from pg_roles where rolname=current_user` | the workspace role is not a superuser |

One extra probe was refused by my own script (a read of schema privileges, refused because the word "create" appeared in it). I did not retry it.

## 3. Question 1: can the server path do vector similarity search?

**Yes for the machinery, no for any existing data. Observed.**

- The `vector` extension (0.8.6) is installed and the `<->` and `<=>` operators work through the same endpoint the app uses. The cosine distance of two test vectors came back correctly.
- No table has a vector column and there is no vector index, so there is nothing to search today. The extension is present but unused.
- The app cannot send a raw similarity query. Its guard (`assertDemoStatement` in `server/utils/octoClient.ts`) allows exactly one statement of the form `SELECT kresilo_demo.some_function(...)`, with positional `$n` bindings and no reference outside `kresilo_demo`. **Observed** from the file.

So a vector search would need a **new additive function in `kresilo_demo`**, installed by the owner as a migration, for example `SELECT kresilo_demo.similar_references($1, $2, $3)`. The application code would need no change to the guard; it would only call the new function through the existing client. **Inference.** The function name must use letters and underscores only (the guard's pattern is `[a-z_]+`). The query vector would travel as a text parameter such as `"[0.01,0.02,...]"` and be cast inside the function. **Inference**, not tested with a table.

Two limits to keep in mind:

- The workspace credential is a read-write role for the whole workspace, not limited to one schema by the provider (`octoClient.ts` says so; I confirmed the role is not a superuser and did not test writes). The restriction to `kresilo_demo` and to read-only `kresilo_research` is enforced by server code and convention. **Observed** for the role, **inference** for what it can write.
- The app's own timeout is 8 seconds (`REQUEST_TIMEOUT_MS`); the database allows 30. Probes took under 0.6 seconds. A search over a few thousand rows should sit well inside 8 seconds. **Inference.**

## 4. Question 2: are `query_workspace`, `query_graph` and `graph_health` reachable over HTTP?

**Not shown to be reachable. Unverified.**

- `KRISTELLO_GUIDE.md` lists them as connector functions ("the locally installed names may differ"). The guide, `.env.example` and `octoClient.ts` name exactly one HTTP route, `/api/workspaces/{id}/query`, and its only body is `{ sql, params }`. I did not guess other routes.
- The indexed documents and the graph are not in the workspace's Postgres: the key can see only the `kresilo_demo` and `kresilo_research` schemas and `public` holds no tables. So SQL cannot stand in for `query_workspace`. **Observed**; the conclusion that the index lives in another Octo component is an **inference**.
- This session had no authorised Octo connector, so I could not call the three tools at all.

What the owner would need to do to settle it: (a) ask the Octo operators for the documented HTTP route and auth for semantic and graph queries, or confirm they exist only as connector tools; (b) if they exist, issue a key scoped to read-only search, separate from the SQL key; (c) enable the Kristello connector in a session so the three tools can be called once and their answers recorded. The `AGENTS.md` and guide advice stands: do not run graph queries during routine UI actions; use them at build time.

## 5. Question 3: where decision records go

**Recommendation: a new `kresilo_demo.decision_log`, written by the owner or a build-time script, not `research_decisions`. Inference.**

| Option | Facts | Fit |
| --- | --- | --- |
| `kresilo_research.research_decisions` | Exists, 0 rows. Columns: `decision_key`, `statement`, `status`, `rationale`, `decided_by`, `decided_at`, `source_question_key` (all text except `decided_at`). `AGENTS.md` says the research schema is read-only and must not be changed. | Right shape for research questions, but writing to it needs an explicit owner amendment, and the credential could write to it without the database ever objecting. |
| `kresilo_demo.decisions` | Exists, 305 rows. Per guest project: `project_id`, `title`, `reason`, `kind`, `proposal_id`, `source_reference_ids`, `version_number`. | Wrong meaning: these are people's design decisions inside a project, not engineering or product decisions. Do not mix. |
| New `kresilo_demo.decision_log` | Does not exist. | Keeps research untouched, keeps a database copy beside GitHub, which stays the source of truth for scope and delivery per `AGENTS.md`. |

Keep GitHub as the owner of the decision; the log is a searchable projection of it, keyed by the issue and pull-request numbers so any row can be traced back and corrected.

### Proposed migration sketch (not a migration file; the owner would run it)

```sql
-- PROPOSAL ONLY. Additive and idempotent. Touches kresilo_demo only.
CREATE TABLE IF NOT EXISTS kresilo_demo.decision_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_key  text NOT NULL UNIQUE,            -- e.g. 'octo-decisions-location'
  statement     text NOT NULL,                   -- the decision, one sentence
  status        text NOT NULL DEFAULT 'proposed',
  rationale     text NOT NULL,
  decided_by    text NOT NULL,                   -- GitHub login
  decided_at    timestamptz,
  repo          text NOT NULL DEFAULT 'Pukujan/kresilo',
  issue_number  integer NOT NULL,                -- the owning issue
  pr_number     integer,                         -- the PR that carried it, if any
  merge_sha     text,                            -- accepted-history commit, if any
  supersedes    uuid REFERENCES kresilo_demo.decision_log(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT decision_log_status CHECK (status IN ('proposed','accepted','superseded','withdrawn')),
  CONSTRAINT decision_log_statement_len CHECK (btrim(statement) <> '' AND length(statement) <= 600)
);
CREATE INDEX IF NOT EXISTS decision_log_issue_idx ON kresilo_demo.decision_log (issue_number);
-- Writes by owner-run script or a single function; the running app does not need to read or write it.
```

Open point for the owner: whether the app should ever read this table. Today it does not need to, so no guard change is proposed.

## 6. Question 4: image embeddings for de-duplication and similar references (#39)

**Feasible at our size, with two things to confirm first. Sizes observed, the rest inference or unverified.**

Today: 13 images among 36 media rows, stored as base64 text averaging 537 kB each (largest 1679 kB), 20 MB in total.

| Item | Finding |
| --- | --- |
| Embedding source | The gateway variables in `.env.example` are `INFERHUB_BASE_URL` and `INFERHUB_API_KEY`, plus chat models `COPILOT_MODEL` and `INFERHUB_OMNI_MODEL`. No embedding model is named. Whether the gateway serves an image-embedding model is **unverified**; I did not call it. |
| Dimensions | Set by the chosen model. Common sizes are 512, 768 and 1536. The column type must match exactly, for example `vector(768)`. |
| Size per row | A `vector(n)` takes 4 bytes per dimension plus 8 bytes: about 2.0 kB at 512, 3.1 kB at 768, 6.2 kB at 1536. `halfvec(n)` halves that. Against 537 kB images the embedding is about 1% of the row. |
| Index | Not needed at this size: an exact scan over a few thousand rows is fast, and an approximate index (HNSW, cosine) only pays off beyond tens of thousands of rows. The extension version supports HNSW and IVFFlat (21 operator classes found). Add the index later, not now. |
| Timeout | The app waits 8 seconds. An exact scan at this scale is well inside it. The embedding call itself is separate, goes to the gateway, and must not run inside the Octo request. |
| Exact duplicates | A stored SHA-256 of the image bytes is cheaper and more reliable than embeddings; use embeddings only for near-duplicates and "similar to this reference". |
| Privacy | Embeddings of private user images are personal data. Search must be filtered by `project_id` or session inside the function, never across guests. Cultural-reference rules from the people-first plan apply before any cross-project suggestion. |
| Writes | A new column or table (for example `kresilo_demo.media_embedding(media_id, model, dims, embedding vector(n))`) and the functions to write and search are one additive owner-run migration. The running app keeps its single-SELECT guard. |

## 7. Decisions the owner must make

1. Whether to enable a connector or a documented HTTP route and a read-only search key for `query_workspace` and `query_graph` (section 4).
2. Whether decisions go to a new `kresilo_demo.decision_log` (recommended) or whether `research_decisions` may be written (section 5).
3. Whether the Copilot may query Octo at runtime at all (the guide advises against graph queries in routine UI actions).
4. Whether to confirm an embedding model on the InferHub gateway and approve an additive vector migration for #39 (section 6).

## 8. What stays unchanged

No application code, no migration file, no database row, no key and no connection string was changed or recorded. `kresilo_research` was only read. There is no second database.
