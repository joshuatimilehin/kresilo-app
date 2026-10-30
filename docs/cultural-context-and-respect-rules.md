# Cultural context and respect rules (PROPOSAL, not accepted scope)

Status: draft for owner review, October 22, 2026. Lineage: leaf #30, parent #29, then #12 and #1. Related issues: #48 (cultural impact), #38 (18 sample makers), #39 (cross-project lineage), #49 (global and locale).

Labels: **observed** = read in the repository on `claude/investor-pdf`; **inference** = not tested; **proposal** = does not exist unless named as existing.

Related: [people-and-journeys.md](people-and-journeys.md), [designer-story-spec.md](designer-story-spec.md), [collaboration-and-credit-spec.md](collaboration-and-credit-spec.md).

## The problem and consequence

Kresilo's line is "Culture feeds creativity. Creativity produces culture." Observed: the Culture layer today is wording only. The six sample makers live in Lagos, Accra, São Paulo, Kyoto, Beirut and Lisbon, and only three bios say they are fictional (`src/creative/catalog.ts`). The plan is to grow to 18 sample makers. If cultural claims are invented by a machine, if a sample work borrows a sacred motif, or if a made-up person resembles a real living designer, Kresilo would misrepresent real communities and people. This document sets the rules before the roster grows.

## Cultural context (optional, written by the maker)

1. **Cultural context is optional.** No work or story requires it. Absence is not shown as a gap.
2. **It is written by the maker, never by the AI.** The Copilot may offer a prompt ("Would you like to say where this practice comes from?"), but it may not draft, complete, translate into fact or invent cultural context. A text field is blank until a person fills it. This is a hard rule, parallel to "AI work can never be recorded as hand work".
3. **What the maker may describe:** place, materials, practice, language, tradition. Each entry is labelled "in the maker's words".
4. **Translation:** text stays in its original language. A translation is labelled "machine translation" until a person who reads the language checks it. Cultural context is not shown as fact in another language until it has been checked by a person (people-first plan, section 6). Who checks is an open owner decision.
5. **Sample makers' context is sample text.** It is labelled "Sample practice", written by the team, and cannot claim real traditions, communities or ceremonies as its subject.
6. **A tradition named in a work's context is credited** (link to the maker's own description of it, not to an AI summary).

## Influence view from stored lineage

Observed: no chain from a reference to the work made from it exists today; only a skip for already-collected references.

Proposal (depends on #35, #39):

- Lineage is built only from stored records: a kept reference with creator and reason, a project that cites it, a published work. Never from image similarity or an AI guess.
- A work shows **Made from N references** and each links to its source work (the maker story and the profile page also use this).
- A source work shows **Used in** for published works that cite it. A private project never appears in **Used in**.
- The view is a list or simple graph of influences for one maker or one work. It is not a score.
- Sample lineage exists only between sample works (rule below).

## Written respect rules for sample makers

These rules apply to any sample maker, portrait, work or story added under issue #38. A curator or the owner checks each item before anything is accepted into the library; the existing vision quality gate does not replace this check. Nothing is added to the library that fails any rule.

1. **No sacred or ceremonial motifs.** Sample works do not use religious symbols, ritual objects, ceremonial dress or patterns, or motifs a community treats as restricted. When in doubt, leave it out and ask the owner.
2. **No real likeness.** Portraits are generated or drawn from nothing that depicts a real person. No prompt names a real person or uses a real photograph as a base.
3. **Invented names that do not match well-known living designers.** Before a name is accepted, search for it; if the full name matches a known living designer or artist, choose another. Names are not borrowed from a real person with a changed spelling.
4. **Sample lineage only between sample works.** A sample maker's work never lists a real maker's work as a reference, and a real work never lists a sample as influence unless the real person chose it. A sample maker can never be claimed by a real account.
5. **Every sample surface is labelled.** Each sample maker has a required `sample: true` field and a "Sample practice" badge on every surface where they appear, enforced by a test (proposal; today three bios say fictional).
6. **Place describes the maker, not a claim about a real scene.** Observed rule in the existing captions: "Location describes the maker, not where this imagined landscape was photographed."
7. **No stereotypes.** A maker's discipline, work and bio are not decided by their region. The roster spans disciplines in every region (people-first plan, section 6).
8. **No invented cultural facts.** Sample bios may describe a practice; they may not state history, meaning or customs of a real community as fact.
9. **A reviewer can say no.** Any of the owner, a curator or a regional reader can reject a sample before it ships; the reason is logged.

Open owner decision: who counts as the reviewer for each region, and whether a person from the region is required to review sample makers from that region.

## Honest impact signals

Kresilo may show only things it can count from stored records:

| Signal | How it is counted |
|---|---|
| Works referencing a source | Published works with the source in their credits |
| Regions connected | Distinct sample or real regions among those makers, stated as a count with the list |
| Makers credited | Distinct creators credited on a maker's published works |

No likes-as-popularity score, no ranking, no "cultural impact" number, no engagement scores. An unverified number is not shown. A signal with a count of zero is shown as zero, not hidden. Sample numbers are labelled sample.

## What is out of scope

- A full social network, feeds, direct messages, or follower-driven ranking.
- Claims that Kresilo preserves, represents or speaks for a culture.
- AI-written cultural context, or cultural facts generated by a model.
- Verification of identity or heritage.
- Real regional experts' advice (that is a task for people).
- Marketplace, licensing, takedown law, or consent law. A separate artist consent policy is listed in people-first plan section 10 and has not been written.
- Curated collections with sources: part of #48, not specified here.

## Acceptance (proposal)

1. A test fails if a sample maker lacks `sample: true` or the "Sample practice" badge.
2. A sample reference list contains only sample works.
3. No cultural-context field is filled by the Copilot (a test with the Copilot prompt open).
4. Each new sample maker has a recorded name check, a likeness check and an owner or reviewer decision.

## Could not be grounded

- The respect rules above are written from the owner direction summarised in the people-first plan; no longer owner-written text was found in the repository.
- No regional reviewers are named anywhere in the repository.
- I did not verify any of the 18 proposed names against real designers; that check belongs to issue #38.
