# Persona-led pictures for makers (PROPOSAL)

Status: proposal, October 23, 2026, from the owner's direction: "use some kind of research so you can get better asset generation that looks like someone's personality rather than just filling up random profiles." Lineage: #38 (makers), #49 (global roster), #51 (taste and anti-slop), under #29.

Labels: **observed** = true in the code or images today; **proposal** = does not exist yet.

## The problem

Observed: each maker has a name, a place, a discipline, a short bio, two case studies, and since #122 a one-line *look* (`src/creative/roster/looks.ts` and the regional roster files). Every picture is generated from one case-study caption plus that look. The result is better than the shared tabletop style it replaced, but a maker is still a set of separate pictures, not a person:

- nothing ties one maker's works together (a recurring motif, a hand, a habit, a way of photographing their own work);
- nothing changes over a career (early versus recent work, a palette that drifts, a client that comes back);
- the portrait, the studio in the process shots and the work are generated separately and can contradict each other;
- the facts behind the culture-rooted work (materials, techniques, how a sign painter in Dhaka or a lacquer painter in Hanoi actually works) come from the model's general knowledge, not from research.

## The goal

A visitor who has seen three of a maker's works can pick a fourth out of a mixed feed. Every maker reads as one person with a consistent hand, a believable studio and a working life, grounded in how that craft is really practised in that place.

## Step 1: research a persona bible for each maker (proposal)

One research pass per maker, by an agent with web access, written to a typed file `src/creative/roster/personas/<maker-id>.ts`. Sources are recorded in the file. They are used for facts about craft and place only, never copied as images, and never based on a real, identifiable person.

| Section | What it holds | Researched from |
|---|---|---|
| Training and studio | How they learned (school, apprenticeship, family shop), the room they work in, tools and equipment by name, suppliers, working hours | Craft guild and trade-school pages, museum and craft-council documentation, trade press about the craft in that city |
| The hand | Line quality, signature moves, two or three recurring secular motifs, type habits, the imperfections they keep on purpose | Technique guides and collection notes for the craft; how the medium behaves (ink bleed, lacquer sanding, enamel brush drag) |
| Palette over time | A core palette and how it shifted from early to recent work, with a reason (a supplier, a client, a move) | Material and pigment sources for the craft; local commercial colour conventions |
| Subjects and clients | The kinds of client and the streets, markets and trades they draw on; one returning client | City and neighbourhood guides, local commerce reporting |
| How they show their work | Camera, light, surfaces and framing they use for their own portfolio shots. This becomes the look | Genre conventions on Behance and in design annuals for that craft (conventions only, no copying) |
| Voice | How they write captions, which languages, what they never say | The existing bio and voice fields |
| Respect check | The motifs, symbols and dress to exclude for this culture, and anything to ask a regional reader about | docs/cultural-context-and-respect-rules.md plus the research |

## Step 2: generate from the persona, as a series (proposal)

- **Reference sheet first.** For each maker, generate one reference sheet (palette chips, motif studies, a corner of the studio, a sample of the hand) and review it before anything else.
- **One series per maker.** Build every later prompt from the persona bible, not from the caption alone: fixed signature fragments (hand, motifs, presentation) plus the case-study caption. Where the image service supports it, pass the reference sheet as an image reference so later pictures stay consistent.
- **Matching portrait and studio.** The portrait shows the person in the studio described in the bible, with the tools named there, so process shots and the portrait agree.
- **Career arc.** Older case studies use the early palette and simpler hand; recent ones the current palette.

## Step 3: review (proposal)

- Every picture passes the anti-slop rubric (docs/anti-slop-rubric.md): correct lettering, no generic tabletop default, no duplicated composition across makers, no real brands, no sacred or ceremonial motifs.
- **Blind match test.** Mix three pictures from each of five makers, then ask a reviewer (a person, or a vision model as a first pass) to group them by maker. Target: at least 80% grouped correctly. A maker below that gets their bible and look revised before more pictures are made.
- Pictures stay marked as AI-generated (the sparkle), and the site footer keeps saying the makers are fictional.

## Order of work (proposal)

1. Persona type and file layout; derive `looks` from the bibles so there is one source.
2. Research and write bibles for the twelve regional makers first (culture-rooted work needs the most grounding), then the first eighteen.
3. Reference sheets, review, then the full picture series per maker; replace earlier pictures that fail the blind match.
4. Regenerate portraits from the bibles where the current portrait contradicts the studio or age.

## Costs and risks

- Image generation is the slow part: on October 23 the service refused most requests (HTTP 429 and 502), and about 135 pictures were still queued. A full series is roughly eight to ten pictures per maker, so plan for runs over several days, at two parallel requests at most.
- Research can drift into claims about a community. The bible describes one person's practice, never "how a culture works", and the respect check is reviewed before generation.
- Owner decisions: how deep the research goes per maker; whether a regional reader checks each bible before it is used.
