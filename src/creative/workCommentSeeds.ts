/**
 * What other makers said about a work, written to its story. They show with
 * any stored comments, so a work never opens to an empty thread. Makers and
 * their words are fictional, like the makers themselves.
 */
export type SeedComment = { by: string; text: string; daysAgo: number };

export const workCommentSeeds: Record<string, readonly SeedComment[]> = {
  "after-light": [
    { by: "marina-costa", text: "One roll a day is such a good rule. You can feel how slowly this was made.", daysAgo: 3 },
    { by: "nanami-hiraoka", text: "The reflection does all the work here. Did you wait for the wind to drop?", daysAgo: 2 },
    { by: "kareem-lalchan", text: "A week with no brief every year. Stealing this idea.", daysAgo: 1 },
  ],
  "dusk-study": [
    { by: "ren-sato", text: "Where the horizon disappears is exactly where I want to stand.", daysAgo: 4 },
    { by: "lucero-huamani", text: "Seven evenings printed the same size is a lovely way to compare them.", daysAgo: 2 },
  ],
  "different-angles": [
    { by: "leila-haddad", text: "Cutting your own name by hand for your own open day is the right kind of vanity.", daysAgo: 5 },
    { by: "ibou-sarr", text: "The tailor asking for one for his shop is the best review a poster can get.", daysAgo: 3 },
  ],
  "mineral-notes": [
    { by: "nia-mensah", text: "Recognising the room before you enter it. That's what a good invitation does.", daysAgo: 6 },
    { by: "ines-duarte", text: "That plaster would print beautifully in two colours on riso.", daysAgo: 2 },
  ],
  "quiet-type": [
    { by: "kareem-lalchan", text: "Offcuts from old runs as the poster itself. Nothing wasted.", daysAgo: 4 },
    { by: "wei-chen-kao", text: "Lavender and black is so calm next to the letter poster. A good set of three.", daysAgo: 1 },
  ],
  "paper-weather": [
    { by: "mahlet-tesfaye", text: "Reading a fabric's weight from how the card curves. I want this for coffee bags.", daysAgo: 5 },
    { by: "marina-costa", text: "Light on paper is the cheapest studio there is.", daysAgo: 2 },
  ],
  "market-rhythm": [
    { by: "ritika-dhabhai", text: "Four beats of warp, one of weft. Block printers count the same way.", daysAgo: 4 },
    { by: "ayo-bello", text: "You can hear the loom in it.", daysAgo: 1 },
  ],
  "blue-hour": [
    { by: "ren-sato", text: "Going to the last stop before drawing the line is real research.", daysAgo: 3 },
    { by: "vu-bao-ngan", text: "That blue is the colour of every station I miss.", daysAgo: 1 },
  ],
  "soft-structures": [
    { by: "nanami-hiraoka", text: "Building it in clay first so you know where the light falls. Yes.", daysAgo: 5 },
    { by: "leila-haddad", text: "These models deserve their own show.", daysAgo: 2 },
  ],
  "moving-colour": [
    { by: "kareem-lalchan", text: "An arrival you can feel in four seconds. That's the whole brief, done.", daysAgo: 4 },
    { by: "ines-duarte", text: "Love seeing the early version before it became the logo.", daysAgo: 2 },
  ],
  "tidal-lines": [
    { by: "nia-mensah", text: "Drawing the mark from the harbour's real tide tables makes it belong to them.", daysAgo: 6 },
    { by: "ayo-bello", text: "Works on a stamp, a crate and a boat. Tested by the sea.", daysAgo: 3 },
  ],
  "chrome-orbit": [
    { by: "marina-costa", text: "Thirty-one loops in a year, as a hobby. Respect.", daysAgo: 3 },
    { by: "lucero-huamani", text: "Guessing the album from the loop before the needle drops is the dream.", daysAgo: 1 },
    { by: "wei-chen-kao", text: "One form, the album's colours, cut on the beat. Clear rules, great results.", daysAgo: 1 },
  ],
  "red-interval": [
    { by: "ines-duarte", text: "One word every half-second, like someone reading aloud. Perfect for a poetry morning.", daysAgo: 4 },
    { by: "ayo-bello", text: "This doesn't look like any other event flyer, which was the point.", daysAgo: 2 },
  ],
  "night-signal": [
    { by: "nanami-hiraoka", text: "A shop that still says hello after closing. Lovely.", daysAgo: 5 },
    { by: "kareem-lalchan", text: "The green against the dark street must be beautiful in person.", daysAgo: 2 },
  ],
  "garden-grid": [
    { by: "ritika-dhabhai", text: "Test sheets are often better than the final print. This one is.", daysAgo: 3 },
    { by: "nia-mensah", text: "The overlap where green meets pink is the best part.", daysAgo: 1 },
  ],
  "paper-orbit": [
    { by: "marina-costa", text: "Twelve months as arcs. I can see why the school loved it, even before the pocket version.", daysAgo: 4 },
    { by: "ren-sato", text: "Early fold models are the honest part of a project. Thanks for sharing it.", daysAgo: 2 },
  ],
};

/** What other makers said about a whole project, keyed by case study id. */
export const caseCommentSeeds: Record<string, readonly SeedComment[]> = {
  "harbour-hours": [
    { by: "marina-costa", text: "Selling the crossing as part of the day, not a delay. We were after the same thing on the metro panels.", daysAgo: 5 },
    { by: "wren-calloway", text: "Six hours of the same crossing. I'd hang the first boat of the morning by my bed.", daysAgo: 2 },
  ],
  "loom-and-line": [
    { by: "ritika-dhabhai", text: "A thread crossing itself would carve beautifully into a printing block.", daysAgo: 4 },
    { by: "ines-duarte", text: "When customers ask to buy the tote on its own, the identity has done its job.", daysAgo: 1 },
  ],
  "kopi-kecil": [
    { by: "mahlet-tesfaye", text: "“The blue one” is how people order at our counter too. One colour per roast is kind to customers.", daysAgo: 6 },
    { by: "vu-bao-ngan", text: "One big letter and nothing else on a crowded shelf. Brave, and it works.", daysAgo: 3 },
  ],
  "quiet-pharmacy": [
    { by: "nia-mensah", text: "Making the dose the biggest thing on the label. Obvious only after someone has done it.", daysAgo: 4 },
    { by: "leila-haddad", text: "Testing with forty customers before printing is the step most of us skip.", daysAgo: 2 },
  ],
  "folded-almanac": [
    { by: "nanami-hiraoka", text: "Every month opening a different way suits a year. Some seasons do arrive sideways.", daysAgo: 5 },
    { by: "kareem-lalchan", text: "Giving the template to other schools for free is the best part.", daysAgo: 1 },
  ],
  "faces-of-the-market": [
    { by: "ayo-bello", text: "Editing with each trader beside you is what consent looks like in a portrait.", daysAgo: 3 },
    { by: "hana-zerrouki", text: "A note on what was and was not changed. Every campaign should print one.", daysAgo: 1 },
  ],
};

/** The makers' words for a comment target: a work id, or `case-<id>` for a case study. */
export const commentSeedsFor = (targetId: string): readonly SeedComment[] =>
  targetId.startsWith("case-") ? (caseCommentSeeds[targetId.slice(5)] ?? []) : (workCommentSeeds[targetId] ?? []);
