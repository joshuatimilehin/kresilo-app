# KRISTELLO / OCTO — local Codex access and research-to-runtime boundary

**Existing connected workspace:** Kristello (`4a3b41e7-2e43-4485-9167-29426d53ccba`). This workspace already has a provisioned PostgreSQL DB, indexed research documents and a projected knowledge graph. **Do not provision a second database** or modify the established research schema.

## 1. How local Codex uses the connection

Use the authenticated Kristello/Octo connector exposed in the user's local environment. Connect it explicitly to Codex if not already available. Connector functions in the ChatGPT environment have the following equivalents (the locally installed names may differ):

- `list_workspaces` → confirm the correct workspace
- `query_workspace_database(workspaceId, sql, params)` → relational SQL on the existing workspace DB
- `query_workspace(workspaceId, query, limit)` → semantic vector retrieval on indexed source material
- `list_documents(workspaceId)` → original document index
- `query_graph(workspaceId, query)` → read-only Cypher over claims/evidence
- `graph_health(workspaceId)` → check graph projection freshness

**Don't paste secrets or tokens into the repo, issues or chat output.** If local Codex has no authenticated Octo connector, ask user to connect/authorize it before runtime DB work. Creating a separate database is not an acceptable workaround.

## 2. Research schema (existing; read-only)

`kresilo_research` tables already contain the source catalog and architecture insights:

- `source_assets`: exact Google Drive IDs, names, MIME, source link, group and review status.
- `capabilities`: product concepts/phase/verification.
- `requirements`: functional requirement IDs and tests.
- `journeys`: ordered desktop/mobile user flows, source refs.
- `source_links`: why a particular file defines/illustrates a capability.
- `product_truth_map`: 23 evidence-graded product assertions linking founder intent, UI promise, written requirement, implementation status, gap and verification method.
- `open_questions`, `research_gaps`: work that must not be misrepresented as resolved.
- `domain_entities`, `domain_relations`: proposed Kresilo application objects, NOT runtime tables.
- `graph_anchors`: cross-reference from SQL records to graph claims/entities.

Starter SQL (**read-only**):

```sql
SELECT truth_key, domain, interpretation, evidence_grade, conflict_or_gap
FROM kresilo_research.product_truth_map
ORDER BY truth_key;

SELECT title, original_url, review_status, source_group
FROM kresilo_research.source_assets
WHERE source_group IN ('ux_mockups', 'html_prototypes', 'brand')
ORDER BY source_group, title;

SELECT entity_key, main_fields, storage_boundary
FROM kresilo_research.domain_entities
ORDER BY entity_key;

SELECT question_key, question, urgency
FROM kresilo_research.open_questions
WHERE status = 'open'
ORDER BY urgency, question_key;
```

Vector questions:
- `Which mobile screens depict the actual project canvas and Copilot sheet?`
- `What does the published case-study UI require about references and visibility?`
- `Which features are only simulated in the HTML demo?`

Cypher example:

```cypher
MATCH (c:Claim)-[r]->(e:Evidence)
RETURN c.statement AS claim, e.locator AS source
LIMIT 20
```

Read indexed document named:
`09 PRODUCT TRUTH MAP | Founder Intent, UX Claims, Technical Evidence and Decision Gaps`.

## 3. NEW app backend namespace — same DB

For this web demo only, create an independent namespace `kresilo_demo` within the EXISTING workspace PostgreSQL DB. Keep schema migration SQL in `db/migrations` and make migrations idempotent.

Recommended small runtime tables:

| Table | Role |
| --- | --- |
| `demo_sessions` | opaque HttpOnly guest session, expiry |
| `projects` | owner session, project name/intent/current poster JSON/private status |
| `references` | source asset/link plus mandatory one-line reason |
| `proposals` | non-mutating suggested poster patch, cited source IDs, status |
| `approvals` | actor, approved/declined decision, idempotency guard |
| `decisions` | accepted rationale and source reference IDs |
| `history_events` | append-only user/assistant operations |
| `versions` | immutable project snapshot data |
| `publish_previews` | optional private set of selected layers |

Implement foreign keys and per-session ownership checks. The server must mediate all access. Prefer guarded transactional operations so approval, patch, decision, version and event either commit together or not at all. Use typed inputs, validation, unique idempotency keys and timestamps. No user-provided raw SQL.

Default project is `Salt Flats Identity` per guest, seeded with a poster composition and a few cleared bundled references. All external integration IDs in the demo must be marked `not connected`; no live API usage expected.

## 4. Two planes — don't confuse them

**Research plane:** describes Kresilo's vision, contradicting documents, designs and prototype evidence. Use at **build time** to choose design wording, components and workflows; leave unchanged.

**Demo runtime plane:** genuine project data, session state, persisted decisions and the interactive UI workflow. Use during each browser session; don't query the knowledge graph during routine UI actions.

Do not expose the public GitHub repository's docs as proof of shipped capabilities; the source folder includes private material and some screenshots are annotated prototype samples.

## 5. Verification

Before marking GitHub issue [#5](https://github.com/Pukujan/kresilo/issues/5) done:
1. Confirm workspace by ID.
2. Show test of a real server-only SELECT and table insert/read in `kresilo_demo` (non-sensitive test data).
3. Demonstrate two guest sessions see distinct projects.
4. Refresh in one browser and confirm state is intact.
5. Denied/duplicate proposals do not corrupt or repeat writes.
6. Verify `kresilo_research` tables unchanged and no workspace credentials in browser or repository.
