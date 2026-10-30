# src/creative: the creative workspace

Everything the browser side of Studio, Explore, profiles and published posts needs. One concept lives in one file, and pure logic is kept apart from React so it can be tested without a browser. The tests read this list: adding a file here without a row below fails `tests/repo-structure.test.ts`.

Status: **live** means it ships in the app; **planned** models live in `src/models` and are not wired in.

## Rules and data

| File | What it holds | Issue |
|---|---|---|
| `contracts.ts` | The typed shapes and zod schemas for projects, layers, effects, proposals, commands and publications; the command list the server runs | #53, #51 |
| `catalog.ts` | The sample works, assets, motion presets, default layer names and roles, and the creator list | #38 |
| `makers.ts` | The 18-maker fictional sample roster, the Sample practice label and its disclaimer | #38, #49 |
| `tools.ts` | Which layer tools each help level shows (beginner, casual, expert) | #53 |

## Pure logic (no React, no network)

| File | What it holds | Issue |
|---|---|---|
| `layers.ts` | Adding, ordering, renaming and locking layers; the one place layer effects become CSS (`layerStyle`, `layerCss`); hand-only lock helpers | #53 |
| `layerNames.ts` | Layer roles and plain names, unique naming, name suggestions and layer descriptions | #53 |
| `transform.ts` | Resize, rotate and snap geometry for the canvas handles, and which layer sits under a point | #53 |
| `titleHit.ts` | Whether a point is on the title's lettering rather than its box | #53 |
| `guidance.ts` | Plain-language gate reasons and counts ("1 version"); a project's title and first supporting line from its brief | #33 |
| `profile.ts` | Profile tabs, counts, stories and shorts for a maker | #37 |
| `authorship.ts` | Who did what: hand, AI-assisted or AI-generated steps inferred from a project, with the basis stated | #50 |
| `lineage.ts` | The "Where this came from" list built from references | #35 |
| `publicStory.ts` | What a publication may disclose, and the public-safe payload | #35, #36 |

## React components

| File | What it holds |
|---|---|
| `Editor.tsx` | Studio: the canvas, prompt, focus chips, proposals, versions and the motion page |
| `PublishPage.tsx` | The publish preview: description, audience, icon toggles for what viewers see, credits |
| `LayerPanel.tsx` | The layer list, rename, lock buttons and the tool panel gated by help level |
| `AssetShelf.tsx` | Studio's assets: the makers' shared packs and your imports, on icon shelves, each added with a "+" |
| `LayerHandles.tsx` | Resize and rotate handles and snap guides drawn over the selected layer |
| `Explore.tsx` | Home (the project feed), Discover, work pages, the story viewer and the profile entry point |
| `PublishedPost.tsx` | The public post page: lineage, decisions, authorship strip, credits, save, share, follow; the maker opens or closes comments and takes the post down |
| `Workspace.tsx` | Create, Projects, the project board, your profile and settings |
| `primitives.tsx` | Shared pieces: artwork rendering, header, sample badge, dialogs |
| `VersionControls.tsx` | Undo, redo and the versions list, always above the canvas; undo and redo move through versions without adding one |
| `backNav.ts` | Back goes where you came from: remembers each history entry's path and plans a history step or the parent page |
| `toastPlace.ts` | Where toasts go so they never cover the assistant, a tool sheet or a bottom bar |
| `ThemeToggle.tsx` | Dark and light mode switch |
| `StudioFloat.tsx` | Studio's floating icon toolbox and the quick bar beside the selected layer |
| `studio.css` | Studio layout: canvas-first stage, floating tools, assistant drawer |
| `StudioCanvas.tsx` | Studio's infinite canvas (Excalidraw, MIT): boards, freehand and shape tools, autosaved through `canvas.save` |
| `canvasImages.ts` | Pictures people add to the Studio canvas: the limits, the list a scene remembers, and the check that a file's bytes match its type |
| `visualBake.ts` | Draws a library picture in given colours as a PNG, for the Studio canvas |
| `canvasShelf.ts` | Library pictures on the Studio canvas: the colours they take, how big they start, which board they land on and what an element remembers |
| `canvasOrigins.ts` | Where the AI worked on a canvas project: the tag Copilot, Make clean and the library leave on what they make, and the hand, assisted and generated count a published post tells |
| `canvasVersions.ts` | Versions of a Studio canvas: the kinds, how many are kept and how much room they may take |
| `StudioVersions.tsx` | The versions list on the Studio canvas: keep one, or go back to one |
| `canvasMarks.ts` | Marks on the Studio canvas: which element and board a scribble points at, and keeping marks in their own list apart from the design |
| `canvasVector.ts` | Makes a model's SVG safe (allowlist), snaps its colours to the Kresilo palette and splits it into named layers |
| `canvasBoards.ts` | The seven board sizes a person can add to the Studio canvas, and where a new board goes beside the others |
| `canvasDraft.ts` | Copilot's drafts on the Studio canvas: the request built from a board and its marks, reading the model's answer, copying a board beside the original with the edits applied, and accepting it |
| `StudioAiControls.tsx` | What Copilot may do on the Studio canvas, as icons: hand only, ask first or apply at once, and the four switches (words, layout, look, images) |
| `StudioReferences.tsx` | The references tray on the Studio canvas: what inspired the project with the reason for each, add from the library or by upload, remove and restore |
| `StudioShelf.tsx` | The picture shelf on the Studio canvas: search and chips over the visual library, and baking a picture in the canvas palette |
| `studioCanvas.css` | The canvas dressed in the Kresilo palette: ink ground, lime accent, icon-only chrome |
| `WorkReel.tsx` | The work page as a full-screen reel: vertical works; sideways, the story of the project the work comes from, ending with more from the maker and similar projects; pinch to zoom |
| `ProjectReel.tsx` | A project opened as a reel (`/case/:id`): up and down moves to the next project in Home's order, endlessly; sideways, its cover, its story panel by panel, then more from the maker and similar projects; the full page is `/case/:id/read` |
| `StoryTextCard.tsx` | A reel story slide with no picture of its own: the words alone, so no picture is shown twice |
| `workCommentSeeds.ts` | Other makers' comments on each work and on some case studies, written to their stories, shown with stored comments |
| `Comments.tsx` | The comments sheet shared by the reel and case studies: makers' words, stored comments, remove your own, one-line composer |
| `commentTargets.ts` | `isCommentableId`: which ids the work-comments store takes (catalog works, `case-<id>` for case studies) |
| `reel.css` | Reel layout and its auto-hiding controls |
| `context.tsx` | The workspace provider and command runner used by every page |
| `profile/MakerProfile.tsx` | The profile page: story cover, tabs, follow and keep |
| `profile/ProfileTabs.tsx` | The Posts / Stories / Shorts switch with keyboard support |
| `profile/PostsPanel.tsx` | A maker's works grid |
| `profile/StoriesPanel.tsx` | Story cover cards |
| `profile/ShortsPanel.tsx` | Vertical motion loops |

## Styles

| File | What it holds |
|---|---|
| `creative.css` | Styles for the pages above |
| `post-lineage.css` | Styles for the published post's lineage, credits and share rail |
| `profile/profile.css` | Styles for the maker profile cover, tabs and panels |
| `dashboard.ts` | Team rows, activity feed, review queue and hand/AI estimate for a project |
| `events.ts` | The usage log: event kinds, sanitising, plain descriptions, session grouping and reports |
| `tracker.ts` | Screen-side logger: device and session ids, batching, quiet sending |
| `Activity.tsx` | The Activity page: your log by visit and device, notes, copy report, switch off, delete |
| `aiHelp.ts` | Plain results for AI requests: what changed, what did not, and why |
| `suggestionSummary.ts` | A suggestion's shown reason: the model's words when nothing was left out, otherwise what the kept patch really changes; plain input names in place of the model id |
| `hintPlace.ts` | Where an icon's tooltip or tap balloon goes so it never sits on another control |
| `aiAllow.ts` | What the assistant may change (words, layout, look, images) and the filter that enforces it |
| `specialists.ts` | The four Studio designers (UI/UX, Brand identity, Illustration, Motion): their rules, and `chooseSpecialist`, the pure choice from the brief and the request |
| `specialistMap.ts` | Which template ids, visual-library categories and styles each designer works from; the one place to add a pack |
| `DesignerRow.tsx` | The four designer icons and the working designer's name in the assistant panel |
| `aiMarks.ts` | Which parts the assistant changed and the artist has not touched since; computed on the server |
| `align.ts` | Align an image layer to the canvas by its containing box |
| `collections.ts` | Curated sample collections of works, with counts taken from the works |
| `CollectionPages.tsx` | The collections strip on Explore and the collection page |
| `marks.ts` | Text and shapes on the artwork: building, editing and the CSS for screen and export |
| `MarksPanel.tsx` | The Shapes panel in Studio (add, change, reorder, remove) |
| `DeckPage.tsx` | Present: the project as a deck in an Open Design look, previewed, played full screen or downloaded as one file |
| `openDesign/styles.ts` | Vetted Open Design styles (palette, type, rules) a project can follow; the assistant is told the chosen one |
| `openDesign/styles.json` | The vetted styles as data, written by `scripts/open-design-styles.ts` |
| `openDesign/decks.json` | The five deck looks' names, moods and palettes, written by `scripts/open-design-decks.ts` |
| `openDesign/decks/studio.html` | The Studio deck look's shell (styles, fonts, navigation) with its sample slides taken out |
| `openDesign/decks/monochrome.html` | The Monochrome deck look's shell (styles, fonts, navigation) with its sample slides taken out |
| `openDesign/decks/signal.html` | The Signal deck look's shell (styles, fonts, navigation) with its sample slides taken out |
| `openDesign/decks/grove.html` | The Grove deck look's shell (styles, fonts, navigation) with its sample slides taken out |
| `openDesign/decks/broadside.html` | The Broadside deck look's shell (styles, fonts, navigation) with its sample slides taken out |
| `openDesign/decks.ts` | Five Open Design deck looks and the builder that writes a project's slides into them |
| `Hints.tsx` | Names for icon buttons app-wide: a tooltip on hover and a short balloon after a tap |
| `ShareSheet.tsx` | Share to Instagram, chat and social apps, email, a link, a saved picture or the phone's own sheet |
| `pptx.ts` | Reads a PowerPoint (.pptx) in the browser with no library: each slide's words and pictures, for Create |
| `journey.ts` | The path from goal to story and the story check, read from stored records |
| `UsedIn.tsx` | "Used in" on a source work: community posts that credit it |
| `i18n.ts` | Interface languages (English, Spanish, Arabic), the dictionary, lookup and locale formatting |
| `locale.tsx` | The language provider, the `useT` hook and the language switch |
| `portfolio/types.ts` | Shapes for sample case studies, asset libraries and branding templates (mirror the planned models) |
| `portfolio/projects.ts` | 39 sample case studies with stories, palettes, panels and AI disclosure |
| `portfolio/assets.ts` | 18 sample asset libraries with sharing rules and how-to-use steps |
| `portfolio/templates.ts` | 8 premade branding templates and the mockup scene list |
| `portfolio/index.ts` | Lookups, labels, and derived links between projects, assets and templates |
| `portfolio/useInStudio.ts` | Builds the exact layers an asset or template adds, so the preview is the result |
| `portfolio/UseDialogs.tsx` | Preview-first dialogs: add a library asset to a project, start a project from a template |
| `portfolio/Terms.tsx` | An asset's sharing terms as a short label and icon marks, with full wording as tooltips |
| `libraryArt.ts` | Layers drawn from a library asset or template scene: schema, URL, sharing check and credits |
| `portfolio/draw.ts` | Colour, hashing and naming helpers for drawing sample work |
| `portfolio/story.ts` | A maker's story as slides, built from their latest projects |
| `portfolio/Visuals.tsx` | Covers, mockups and panels for projects, assets and templates: the generated image when there is one, else an SVG drawing |
| `portfolio/layouts.ts` | Editable templates: each layout as real text, shape and photo layers for a brand and colours |
| `portfolio/tones.ts` | Any four colours read as dark, light and two accents, so a layout recolours |
| `packs/packs.json` | The template packs: 12 UI/UX and 12 brand-identity concepts with their palette, type, copy, pictures and the layouts each holds |
| `packs/types.ts` | A pack's shape: layout kinds, the canvas each uses, and its look (type, corners, ground) |
| `packs/data.ts` | `packs`, lookup by id, and each pack as a `BrandTemplate` so the template pages, Studio and the start dialog treat it like any other |
| `packs/kit.ts` | `Sheet`: draws a layout in canvas-width units from palette roles, with the 12 text and shape and 12 picture limits, title and text fitting, and `colourName` |
| `packs/screens.ts` | Phone (9:16) and desktop (16:9) screen builders: welcome, list, detail, choice, wheel, summary, confirm, pass, stamps, form, board; site home, grid, detail, dashboard |
| `packs/sheets.ts` | Brand sheet builders: logo, palette, type specimen, business card, poster, social post, label |
| `packs/layouts.ts` | `packLayout(pack, brand and palette, n)`: one layout as the artwork a project starts from |
| `packs/catalogue.ts` | The packs as the assistant sees them: a few compact lines narrowed to the request (like the visual catalogue) |
| `packs/PackShelf.tsx` | Studio's Templates tab: thumbnails drawn from each pack's layers; opens the start dialog |
| `portfolio/LayoutCover.tsx` | A template's cover; an editable template shows its real layouts side by side |
| `portfolio/art.ts` | Where each generated image lives, and whether it exists yet |
| `avatar.ts` | The tiny copy of a maker's portrait that an avatar draws (made by `scripts/portrait-thumbs.sh`); the profile page keeps the full portrait |
| `moodboards.ts` | Moodboards: named boards, public or private, that a person files saved things into; pure helpers for adding, filing, filtering and deleting |
| `SavedItems.tsx` | Saved things resolved from their keys and drawn as cards, shared by your profile and a public moodboard |
| `MoodboardPage.tsx` | `/moodboards/:person/:board`: a moodboard its owner made public |
| `DiscoverShelves.tsx` | Discover before a search: the project of the week, kinds of project as chips, a shelf for each big kind, open boards, competitions, events, makers and every project below (`discover.css`) |
| `MoodboardSheet.tsx` | The save sheet: Saved plus your moodboards, a lock or globe on each, tap to file an item; loaded only when opened |
| `portfolio/GenImage.tsx` | A generated sample image with its AI sparkle, and where each image's file lives |
| `portfolio/generated.ts` | Which generated images exist (rebuilt by `scripts/art-manifest.ts`; prompts in `scripts/art-prompts.ts`) |
| `portfolio/Cards.tsx` | Project, asset and template cards, and Home's project card |
| `portfolio/feed.ts` | Home's feed: every case study, makers interleaved in a stable order |
| `portfolio/searchIndex.ts` | Discover's project search: accent-folded, all-words, ranked text plus creator, discipline, place and Following filters |
| `portfolio/Pages.tsx` | Case study, asset and template pages |
| `portfolio/portfolio.css` | Styles for those pages |
| `storyNav.ts` | How a story moves: keys, swipe, tap, and where each leads |
| `profile/StoryViewer.tsx` | The full-screen story viewer (keyboard, swipe, tap, buttons) |
| `profile/Portrait.tsx` | Illustrated portrait of a fictional maker, drawn from the maker's id |
| `culture.ts` | Cultural context (the maker's words, a source for any tradition) and honest impact signals |
| `range.ts` | HTTP byte ranges for serving stored loops |
| `postComments.ts` | Rules for comments on a published post: when they are open, validation, who may remove |
| `PostCommentsSection.tsx` | The comments section on a published post |
| `follows.ts` | Who can be followed (a person or a roster maker), the viewer's follows read from the server and the older profile list together, and when a follow button belongs |
| `useFollows.ts` | The shared follow list, loaded for whoever is signed in, with the one-time move of old profile follows to the server |
| `FollowCounts.tsx` | Follower and following counts on a profile (two icons with numbers) |
| `PersonPage.tsx` | A person who is not on the roster: counts, a follow toggle and their published posts; also the post tile used by Following |
| `follows.css` | Follow counts and a person's page |
| `share.ts` | Share links, embed code, the link-preview page and the preview image for a published post |
| `ShareRail.tsx` | The share actions on a post and the embed view at `/embed/:id` |
| `roster/index.ts` | Gathers the regional makers, their case studies, looks and portrait briefs |
| `roster/personas/types.ts` | The persona bible shape: studio, hand, palette over time, clients, how they photograph their work, voice, respect, sources |
| `roster/personas/index.ts` | All persona bibles, and the art direction and portrait brief built from each |
| `roster/personas/nanami-hiraoka.ts` | Researched persona bible for Nanami Hiraoka |
| `roster/personas/da-eun-kwak.ts` | Researched persona bible for Da Eun Kwak |
| `roster/personas/wei-chen-kao.ts` | Researched persona bible for Wei Chen Kao |
| `roster/personas/vu-bao-ngan.ts` | Researched persona bible for Vu Bao Ngan |
| `roster/personas/ritika-dhabhai.ts` | Researched persona bible for Ritika Dhabhai |
| `roster/personas/tahmid-sarkar.ts` | Researched persona bible for Tahmid Sarkar |
| `roster/personas/ceren-akbudak.ts` | Researched persona bible for Ceren Akbudak |
| `roster/personas/hamza-ouazzani.ts` | Researched persona bible for Hamza Ouazzani |
| `roster/personas/itzel-matus.ts` | Researched persona bible for Itzel Matus |
| `roster/personas/lucero-huamani.ts` | Researched persona bible for Lucero Huamani |
| `roster/personas/ibou-sarr.ts` | Researched persona bible for Ibou Sarr |
| `roster/personas/mahlet-tesfaye.ts` | Researched persona bible for Mahlet Tesfaye |
| `roster/personas/ayo-bello.ts` | Researched persona bible for Ayo Bello |
| `roster/personas/nia-mensah.ts` | Researched persona bible for Nia Mensah |
| `roster/personas/marina-costa.ts` | Researched persona bible for Marina Costa |
| `roster/personas/ren-sato.ts` | Researched persona bible for Ren Sato |
| `roster/personas/leila-haddad.ts` | Researched persona bible for Leila Haddad |
| `roster/personas/ines-duarte.ts` | Researched persona bible for Inês Duarte |
| `roster/personas/kareem-lalchan.ts` | Researched persona bible for Kareem Lalchan |
| `roster/personas/mira-kesavan.ts` | Researched persona bible for Mira Kesavan |
| `roster/personas/arief-pranata.ts` | Researched persona bible for Arief Pranata |
| `roster/personas/madina-yesenova.ts` | Researched persona bible for Madina Yesenova |
| `roster/personas/neema-waweru.ts` | Researched persona bible for Neema Waweru |
| `roster/personas/hana-zerrouki.ts` | Researched persona bible for Hana Zerrouki |
| `roster/personas/elin-brandvold.ts` | Researched persona bible for Elin Brandvold |
| `roster/personas/radek-zawisza.ts` | Researched persona bible for Radek Zawisza |
| `roster/personas/rook-and-delaney.ts` | Researched persona bible for Rook & Delaney |
| `roster/personas/dorian-voss.ts` | Researched persona bible for Dorian Voss |
| `roster/personas/ximena-torrealba.ts` | Researched persona bible for Ximena Torrealba |
| `roster/personas/wren-calloway.ts` | Researched persona bible for Wren Calloway |
| `roster/personas/kertu-vaher.ts` | Researched persona bible for Kertu Vaher |
| `roster/personas/joven-paguio.ts` | Researched persona bible for Joven Paguio |
| `roster/personas/half-landing.ts` | Researched persona bible for the Half Landing studio |
| `roster/personas/ari-matenga.ts` | Researched persona bible for Ari Matenga |
| `roster/looks.ts` | Art direction per maker, so each maker's generated pictures have their own style |
| `roster/east-asia.ts` | Makers from Japan, Korea, Taiwan and Vietnam, with their case studies, looks and portrait briefs |
| `roster/south-west-asia.ts` | Makers from India, Bangladesh, Türkiye and Morocco, with their case studies, looks and portrait briefs |
| `roster/latam-africa.ts` | Makers from Mexico, Peru, Senegal and Ethiopia, with their case studies, looks and portrait briefs |
| `roster/practices.ts` | A UI and UX designer in Tallinn, a video editor in Manila, a Glasgow design studio and a creative technologist in Auckland, with their case studies, looks and portrait briefs |
| `DrawLayer.tsx` | Drawing by hand: the surface over the canvas that turns drags into strokes, and the brush tools |
| `Meetups.tsx` | Events: `/events` (the reel, or the dated list with `?list=1`), one event's album-style page with its schedule tracklist and a shelf from the host, Discover's events row and the host form with its schedule rows |
| `EventReel.tsx` | Events as a full-screen reel: swipe up for the next event, sideways through cover, when and where, schedule, who is going and join; the format tag and the big button stay on every slide; a corner menu holds the Discover, Going and Hosting views and the format filter |
| `eventShared.tsx` | What the reel, the list and the event page share: the event shape, the shared events store, your place at an event, dates in your language, the colour wash read from a cover, the one round primary button (Register, Going, Join, Edit) and the calendar file |
| `eventSchedule.ts` | Pure helpers for events: cleaning a schedule's rows, the order of an event's slides, which primary button applies, the going count and the colour wash maths (migration 013 stores the rows) |
| `eventReel.css` | Styles for the events reel, the round primary button, the format tag, the album page and the host form's schedule rows |
| `events.css` | Styles for the events tab and format row, Going and its cancel confirm, Join, the host's delete confirm, the private pill, the host form's missing fields and its cover picker |
| `eventCover.ts` | A hosted event's own cover: draws an uploaded picture or one of the host's projects down to a JPEG, and its public URL |
| `eventPrivacy.ts` | Blanks a hosted event's video link in the public feed for anyone who is neither the host nor going | #29 |
| `meetupList.ts` | The events makers run (workshops, talks, reviews, markets, live jams) and "near you" matching |
| `Competitions.tsx` | Competitions: Discover's row of cards, the index, one competition's page (prompt, rules, entries grid, vote, your entry, host close and winner) and the host form |
| `competitionRules.ts` | Competition rules as pure functions (phase, who may enter, vote verdicts, ranking, the winner, time left), the shared types, and the five curated competitions |
| `competitions.css` | Styles for the competition cards, the page, the entries grid and the host form's rule rows |
| `Team.tsx` | The team and review page at `/projects/:id/team` |
| `Boards.tsx` | Open board cards (also mixed into the For you feed), an open board's page at `/boards/:id` (curated or hosted) with the work and comments for members, the host's requests inbox and the open-board control on the team page |
| `boards.css` | Styles for an open board's jam date, your place on it, its work in progress and its comments |
| `openBoards.ts` | The curated open boards: who runs them, who is on them, the roles they want, what just happened and when they are live |
| `boardRequests.ts` | Real requests to join an open board: a place is none, asked, in or declined; the shape of boards people host, the host's inbox, and what may be asked (#175) |
| `boardsData.ts` | Hooks that read `/api/boards` and `/api/ideas/:target` and stay in step across devices |
| `ideaCards.ts` | Idea cards: where an idea may sit (hosted board, curated board, case study), its limits, the spot of a tap, and who sees it (#176) |
| `IdeaPins.tsx` | The pin button, the marks on a picture, the sheet that writes or reads an idea, and a board's shelf of ideas and credits |
| `ideas.css` | Styles for pins, the idea sheet, the shelf, the host's requests inbox and the open-board control |
| `commentTargets.ts` | What the work-comments table may hold comments for: catalog works, `case-` case studies and `board-` open boards |
| `theme.css` | Colour tokens for dark and light |
| `visuals/types.ts` | The visual library's shape: kinds (ink, duotone), 17 categories, hands, and where a picture's file lives |
| `visuals/library.json` | The library itself, written by the generation pipeline and checked by `scripts/visuals-manifest.ts` |
| `visuals/library.ts` | `visuals`, the library read from `library.json`, and lookup by id |
| `visuals/schema.ts` | What a layer stores about a visual: its id and the ink (and ground) colours |
| `visuals/colour.ts` | How a visual takes colour: the pure maths, the SVG filter that does it on the canvas, previews and the export, and pixel mapping for covers |
| `visuals/palette.ts` | `paletteFor`: the ink and ground a visual gets from a project's Style, else its title and canvas colours |
| `visuals/layer.ts` | Placing a visual as a layer, sized to fit; the check that a visual exists in the library; the filter definitions a canvas needs |
| `visuals/check.ts` | The check that a visual a layer names exists in the library (kept apart so the library file loads only where it is needed) |
| `visuals/find.ts` | The six icon groups over the categories, and the text search over title and meanings |
| `visuals/VisualShelf.tsx` | The Visuals tab of the assets: group chips and tiles drawn already recoloured, each added with a "+" |
| `visuals/VisualColourControls.tsx` | The ink and ground swatches for a selected visual layer |

## Conventions

- Planned features start as a model in `src/models` (one entity per file, with a version), then move here when wired in.
- A new file gets a row here in the same change. Pure logic gets a test in `tests/`.
- Server-side counterparts are listed in `server/creative/README.md`.
