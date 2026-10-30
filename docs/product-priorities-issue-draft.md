# DRAFT GitHub issue (not filed) — destination Pukujan/kresilo

**Title:** Kresilo needs a recorded priority list for profiles, sign-in, history and assets

Visitors cannot yet tell who the people on Kresilo are, cannot reach their own profile (the Profile link opens a preferences page), cannot sign in, and cannot see where a reference came from. The business partner and the owner reviewed the live site on October 22, 2026 and produced a priority list. Until now it existed only in chat. This issue owns that list and its acceptance, so it survives outside any session.

**Lineage:** this issue is the leaf; parent #12, then #1. Dependencies: #13 (accounts, blocked on Google credentials) and #20 (reference-to-Studio, accepted through PR #26). Task ID: to be assigned on filing. Primary writer: to be recorded when work starts. Branch: from `main`.

**Scope and detail:** [docs/product-priorities.md](docs/product-priorities.md) holds the full table, evidence labels, acceptance per item and the open questions. Summary of the twelve items:

1. P1 Own profile separate from preferences.
2. P2 Real Google sign-in (blocked: no client ID or secret).
3. P3 De-duplicated user content with lineage.
4. P4 At least 12 more makers with professional portraits.
5. P5 Maker intro using the cutout portrait over their own design.
6. P6 Canvas layers with size tweaking (verify what shipped).
7. P7 Undo and redo (shipped in #23; verify).
8. P8 Icon set.
9. P9 Bookmark, like and comment.
10. P10 More high-quality assets, each vision-checked.
11. P11 Studio help levels (beginner, casual, expert) shaping the Studio layout.
12. P12 Inline guidance in Studio and carrying the Create idea text.

Explore stays deliberately unguided; that is an owner decision.

**Evidence (observed, October 22, 2026):** live pages at https://kresilo.design-bakery.com (Explore, Create, Studio, Projects, a work page, `/you`); read-only counts from the existing workspace (36 media, 69 people, 74 projects, 22 motion jobs, 9 publications). **Repository evidence:** `origin/main` at b83f3e1. **Inference, untested:** the Open Design integration and the vision-review asset gate.

**Boundaries:** existing Octo workspace, `kresilo_demo` only; `kresilo_research` read-only; no second database; agent proposals change nothing before approval; no credentials in the repository; no simulated sign-in.

**Acceptance:** each item meets its line in the docs file, with desktop and mobile browser checks and the existing required MacBook Pro CI. Individually deliverable items get their own child issues rather than comments here.

**Next action:** owner approves this text, then filing and the first child issue (P1 and P12, the smallest visible fixes).
