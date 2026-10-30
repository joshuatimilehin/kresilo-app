# Sample maker roster (PROPOSAL for owner review)

Status: PROPOSAL, not accepted scope. Drafted October 22, 2026 for owner review. Lineage: issues #38 (more sample makers) and #49 (a global roster), leaf work under #29, then #12 and #1.

**Owner decision, October 23, 2026:** no "sample", "demo" or "fictional" wording on working screens. The Sample practice badge and the "fictional sample practice" sentence in each bio are gone; one line in the site footer says the makers and clients shown are fictional, and AI-generated pictures keep their sparkle mark. The rules below about the badge describe the earlier state.

Labels: **observed** = read in the repository at `origin/main`; **proposal** = does not exist unless named as existing; **unverified** = needs the owner or a regional reader.

## The problem and what this changes

Kresilo shows six sample makers in Lagos, Accra, São Paulo, Kyoto, Beirut and Lisbon, and only three of their bios said they were fictional. The owner wants more makers, spread across the world, including photography and photo editing, and each one clearly labelled as a made-up practice.

This document is the roster. The data lives in `src/creative/makers.ts`; the labelling is the `SampleBadge` component ("Sample practice"). **Observed in code after this change:** the 12 new makers exist as data only. They have no portraits and no works, because no artwork for them exists yet. Their pages say "No works yet" and show an initials mark. Nothing here generates images or calls an outside service.

## Rules every maker follows

These come from the respect rules in `docs/cultural-context-and-respect-rules.md` (on branch `claude/people-docs`, not yet merged).

1. Every maker is a fictional sample practice. `sample: true` is required by the type and by a test.
2. Names are invented and do not match a well-known living designer. **How this was checked: by judgement only.** A small deny list in `tests/maker-roster.test.ts` catches obvious slips. No web search was run, so the owner or a reviewer must confirm every name before it ships (see "Owner review" below).
3. No real likeness. There are no portraits for the new makers; any later portrait must be drawn or generated from nothing that depicts a real person.
4. No sacred or ceremonial motifs, and no real named artists or brands in bios or influences. Influences are places, materials and practices.
5. A maker's discipline is not decided by their region (respect rule 7). Photo editing is in Nairobi, retouching in Algiers, colour grading in Chennai and spatial design in Almaty; textile is in Accra, packaging in Bandung, and so on. No bio states a custom, history or meaning of a real community as fact (rule 8).
6. Place describes where the maker says they work, not a claim about what their work depicts (rule 6).
7. Sample lineage only between sample works. A sample maker can never be claimed by a real account.

## The roster

Stage is the maker's career stage. Voice is how the practice speaks. All bios end with "This is a fictional sample practice."

| # | Name | Place | Region | Discipline | Stage | Voice | Writes in |
|---|---|---|---|---|---|---|---|
| 1 | Ayo Bello (existing) | Lagos, Nigeria | West Africa | photography | established | Warm and story-led | English, Yoruba |
| 2 | Nia Mensah (existing) | Accra, Ghana | West Africa | textile | mid-career | Tactile and unhurried | English, Twi |
| 3 | Marina Costa (existing) | São Paulo, Brazil | Latin America | motion | mid-career | Bright and playful | Portuguese, English |
| 4 | Ren Sato (existing) | Kyoto, Japan | East Asia | graphic identity | mid-career | Quiet and exact | Japanese, English |
| 5 | Leila Haddad (existing) | Beirut, Lebanon | West Asia | lettering | established | Direct and a little dry | Arabic, French, English |
| 6 | Inês Duarte (existing) | Lisbon, Portugal | Southern Europe | paper and print | emerging | Curious and precise | Portuguese, English |
| 7 | Mira Kesavan | Chennai, India | South Asia | colour grading | established | Patient and dry-humoured | Tamil, English |
| 8 | Arief Pranata | Bandung, Indonesia | Southeast Asia | packaging | emerging | Eager and practical | Indonesian, English |
| 9 | Madina Yesenova | Almaty, Kazakhstan | Central Asia | spatial design | mid-career | Calm and observant | Russian, Kazakh |
| 10 | Neema Waweru | Nairobi, Kenya | East Africa | photo editing | mid-career | Lively and generous | Swahili, English |
| 11 | Hana Zerrouki | Algiers, Algeria | North Africa | retouching | established | Careful and plain-spoken | Arabic, French |
| 12 | Elin Brandvold | Bergen, Norway | Northern Europe | illustration | mid-career | Gentle and wry | Norwegian, English |
| 13 | Radek Zawisza | Gdańsk, Poland | Eastern Europe | type design | emerging | Earnest and exacting | Polish, English |
| 14 | Rook & Delaney (two-person collective: Odile Rook, Sam Delaney) | Montréal, Canada | North America | motion | established | Two voices, quick and joking | French, English |
| 15 | Dorian Voss | Detroit, United States | North America | photography | emerging | Blunt and curious | English |
| 16 | Ximena Torrealba | Quito, Ecuador | Latin America | lettering | mid-career | Bold and warm | Spanish, English |
| 17 | Wren Calloway | Hobart, Australia | Oceania | photography | mid-career | Spare and thoughtful | English |
| 18 | Kareem Lalchan | Port of Spain, Trinidad and Tobago | Caribbean | editorial design | established | Confident and conversational | English |

### Coverage (observed in the data, checked by tests)

- Areas: Asia 5, Africa 4, Europe 3, Latin America and the Caribbean 3, North America 2, Oceania 1.
- Sub-regions: East, South, Southeast, Central and West Asia; West, East and North Africa; Northern, Southern and Eastern Europe; North America; Latin America; the Caribbean; Oceania.
- Required disciplines, each at least once: photography (3), photo editing, retouching, colour grading, lettering (2), textile, packaging, motion (2), spatial design. Others: graphic identity, paper and print, illustration, type design, editorial design.
- Career stages: 4 emerging, 8 mid-career, 6 established.
- One two-person collective.

### Four more practices (October 23, 2026)

Makers 19 to 30 live in the regional roster files (`src/creative/roster/east-asia.ts`, `south-west-asia.ts`, `latam-africa.ts`). These four fill disciplines the roster did not have, and add the first studio team. Their data, case studies, looks and portrait briefs are in `src/creative/roster/practices.ts`; each has a researched persona bible in `src/creative/roster/personas/`.

| # | Name | Place | Region | Discipline | Stage | Voice | Writes in |
|---|---|---|---|---|---|---|---|
| 31 | Kertu Vaher | Tallinn, Estonia | Northern Europe | ui and ux design | mid-career | Plain, patient and practical | Estonian, English, Russian |
| 32 | Joven Paguio | Manila, Philippines | Southeast Asia | video editing | emerging | Warm, quick and funny | Filipino, English |
| 33 | Half Landing (studio of six: Isla Ferrie, Callum Dowie, Aamir Siddiqui, Eilidh Gourlay, Tomasz Wrona, Niamh Sweeney) | Glasgow, Scotland | Northern Europe | graphic identity | established | One voice, plain-spoken and sociable | English, Scots |
| 34 | Ari Matenga | Auckland, New Zealand | Oceania | creative technology | mid-career | Easy-going and precise | English, te reo Māori |

Their projects, each written as a story first:

- Kertu Vaher: `praamiaeg-ferry-app` (a ferry app designed on the 6:40 crossing for island commuters, ice road included) and `vesiveski-library-booking` (a room-booking flow cut from eleven fields to three after a week behind the library desk).
- Joven Paguio: `ramos-body-works-documentary` (a twelve-minute documentary following one hand-built jeepney body over six weeks) and `tindahan-huling-biyahe` (a one-night music video for a neighbourhood band, every scene change cut on the snare).
- Half Landing: `brackenbrae-library-wayfinding` (hand-height colour bands, after tiled tenement closes, for a three-floor library), `back-court-days` (a two-ink identity for a festival of shared back courts) and `stone-by-stone-repairs` (a deck and fold-out guide that helped tenement owners vote on stone repairs).
- Ari Matenga: `six-oclock-tide-clock` (a tide clock for a dawn swim club, in the browser and on a solar e-paper screen in the clubhouse window) and `gully-radio-posters` (a generative poster tool forty volunteer radio hosts use every week).

`Maker.kind` now allows `"organization"` for a studio team posting as one account, with its members named. A maker profile shows a team's members on one line with a group icon, and the drawn fallback portrait shows three figures.

### Coverage of all 34 makers (observed in the data, checked by tests)

- Areas: Asia 13, Africa 7, Europe 5, Latin America and the Caribbean 5, North America 2, Oceania 2.
- Disciplines: graphic identity 5, illustration 4, photography, textile, lettering and packaging 3 each, motion and paper and print 2 each, and one each of colour grading, spatial design, photo editing, retouching, type design, editorial design, UI and UX design, video editing and creative technology.
- Career stages: 8 emerging, 16 mid-career, 10 established.
- Kinds: 32 individuals, one two-person collective (Rook & Delaney) and one six-person studio (Half Landing).
- Names checked by web search on October 23, 2026: no well-known designer, editor or studio found under Kertu Vaher, Joven Paguio, Half Landing or Ari Matenga. The owner's name check still applies.

### Bios, influences and the rest

Bios are 2 to 3 plain sentences in the data file (`bio`), with influences (`influences`) written as places, materials and practices. They are not repeated here so the file and the document cannot drift apart; the test checks each bio says "fictional sample practice" and names no real artist or brand.

## What is not done (proposal, for later)

- **No portraits and no works for the 12 new makers.** Each needs an owner decision on the image model and a spot check (#38, owner decision 9), through the vision quality gate. Until then Kresilo shows an initials mark and "No works yet" and the place picker says "Sample makers · no works yet" for those places.
- **Seeded stories** from real project records (#38) are not built.
- **Languages in the interface** and a place switcher are #49 work, not this change. The `languages` field records what each maker writes in; maker text is meant to stay in its own language.
- **Cultural context** is written by the maker and never by the AI (respect rule 2); none is written here.

## Owner review

Please decide, on #38 or #12:

1. **Name check.** Confirm each of the 12 new names, or ask for a web search against known living designers and photographers. Names were chosen by judgement only; ordinary names can match real people, so a match of a well-known designer is the thing to rule out.
2. **Regional reading.** Whether a reader from each region should review that region's makers before they ship (open question in the respect rules). In particular: Oceania has one maker and no Pacific Islands voice, by choice, until a reviewer is found; Central Asia, North Africa and the Caribbean are single makers.
3. **Languages.** Whether the first two interface languages (#49) follow this roster (for example Arabic as the right-to-left language).
4. **Roster size and balance.** Whether Africa 4 and Asia 5 against Oceania 1 and North America 2 is the right spread, or more makers should be added later.
5. **Image model and who spot-checks portraits** (owner decision 9).
