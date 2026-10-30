/**
 * The Kresilo sample roster: 18 invented makers (PROPOSAL, owner review pending,
 * see docs/maker-roster.md). Pure data and helpers; nothing here touches the
 * network, storage or a component.
 *
 * Every entry is a fictional sample practice. None describes a real person,
 * studio or community, and none may be claimed by a real account. `sample` is a
 * literal `true` so the type system, and a test, both refuse an unlabelled maker.
 */

/** Not shown on working screens (the owner's call); one footer line says the makers are fictional. */
import { rosterMakers } from "./roster";

export const SAMPLE_DISCLAIMER = "A fictional maker, not a real person or studio.";

export const AREAS = [
  "Asia",
  "Africa",
  "Europe",
  "North America",
  "Latin America and the Caribbean",
  "Oceania",
] as const;
export type Area = (typeof AREAS)[number];

export const REGIONS = [
  "East Asia",
  "South Asia",
  "Southeast Asia",
  "Central Asia",
  "West Asia",
  "West Africa",
  "East Africa",
  "North Africa",
  "Northern Europe",
  "Southern Europe",
  "Eastern Europe",
  "North America",
  "Latin America",
  "Caribbean",
  "Oceania",
] as const;
export type Region = (typeof REGIONS)[number];

export const DISCIPLINES = [
  "photography",
  "photo editing",
  "retouching",
  "colour grading",
  "lettering",
  "textile",
  "packaging",
  "motion",
  "spatial design",
  "graphic identity",
  "paper and print",
  "illustration",
  "type design",
  "editorial design",
  "ui and ux design",
  "video editing",
  "creative technology",
] as const;
export type Discipline = (typeof DISCIPLINES)[number];

/** Disciplines the owner asked the roster to cover (issue #49). */
export const REQUIRED_DISCIPLINES: readonly Discipline[] = [
  "photography",
  "photo editing",
  "retouching",
  "colour grading",
  "lettering",
  "textile",
  "packaging",
  "motion",
  "spatial design",
];

export type CareerStage = "emerging" | "mid-career" | "established";

export type Maker = {
  id: string;
  name: string;
  /** A person, the two-person collective, or a studio team posting as one account. */
  kind: "individual" | "collective" | "organization";
  /** For a collective or an organization: the invented members, by first and last name. */
  members?: readonly string[];
  /** City and country the maker describes as home. Not a claim about their work's subject. */
  place: string;
  area: Area;
  region: Region;
  discipline: Discipline;
  stage: CareerStage;
  /** How the practice speaks, in a few plain words. */
  voice: string;
  /** Languages the maker writes in. Maker text stays in its own language. */
  languages: readonly string[];
  /** Places, materials and practices only. Never a real named artist or brand. */
  influences: string;
  /** Two or three plain sentences; the last says the practice is fictional. */
  bio: string;
  /** Always true. The badge, the disclaimer and the tests rely on it. */
  sample: true;
  /** Only the first six have artwork. The others show an initials mark. */
  portrait?: string;
};

const coreMakers: readonly Maker[] = [
  // The six makers that already shipped. Ids, names, places and portraits are unchanged.
  {
    id: "ayo-bello",
    name: "Ayo Bello",
    kind: "individual",
    place: "Lagos, Nigeria",
    area: "Africa",
    region: "West Africa",
    discipline: "photography",
    stage: "established",
    voice: "Warm and story-led",
    languages: ["English", "Yoruba"],
    influences: "Music, printed matter, and the light between places.",
    bio: "Ayo Bello photographs the last hour of daylight and the posters people leave on walls. Each study is a small note about colour and rhythm.",
    sample: true,
    portrait: "/assets/kresilo/ayo-portrait.webp",
  },
  {
    id: "nia-mensah",
    name: "Nia Mensah",
    kind: "individual",
    place: "Accra, Ghana",
    area: "Africa",
    region: "West Africa",
    discipline: "textile",
    stage: "mid-career",
    voice: "Tactile and unhurried",
    languages: ["English", "Twi"],
    influences:
      "Woven rhythms, printed ephemera and the way light catches paper.",
    bio: "Nia Mensah designs surfaces that you want to touch: texture, warmth and everyday rhythm. Her sketches start as cloth and paper swatches.",
    sample: true,
    portrait: "/assets/kresilo/nia-portrait.webp",
  },
  {
    id: "marina-costa",
    name: "Marina Costa",
    kind: "individual",
    place: "São Paulo, Brazil",
    area: "Latin America and the Caribbean",
    region: "Latin America",
    discipline: "motion",
    stage: "mid-career",
    voice: "Bright and playful",
    languages: ["Portuguese", "English"],
    influences:
      "Public spaces, coastal light and experiments with colour in motion.",
    bio: "Marina Costa makes short loops where soft shapes drift through blue-hour colour. She tests each loop outdoors on a phone before she trusts it.",
    sample: true,
    portrait: "/assets/kresilo/marina-portrait.webp",
  },
  {
    id: "ren-sato",
    name: "Ren Sato",
    kind: "individual",
    place: "Kyoto, Japan",
    area: "Asia",
    region: "East Asia",
    discipline: "graphic identity",
    stage: "mid-career",
    voice: "Quiet and exact",
    languages: ["Japanese", "English"],
    influences: "Tidal marks, circular forms and the rhythm of negative space.",
    bio: "Ren Sato builds small identity systems from circles, water lines and a lot of empty space. Every mark is drawn many times before one is kept.",
    sample: true,
    portrait: "/assets/kresilo/ren-mark.svg",
  },
  {
    id: "leila-haddad",
    name: "Leila Haddad",
    kind: "individual",
    place: "Beirut, Lebanon",
    area: "Asia",
    region: "West Asia",
    discipline: "lettering",
    stage: "established",
    voice: "Direct and a little dry",
    languages: ["Arabic", "French", "English"],
    influences: "Street lettering, night-time signals and printed contrasts.",
    bio: "Leila Haddad draws lettering from the signs she walks past and turns them into bold printed compositions. She works late and keeps every failed proof.",
    sample: true,
    portrait: "/assets/kresilo/leila-mark.svg",
  },
  {
    id: "ines-duarte",
    name: "Inês Duarte",
    kind: "individual",
    place: "Lisbon, Portugal",
    area: "Europe",
    region: "Southern Europe",
    discipline: "paper and print",
    stage: "emerging",
    voice: "Curious and precise",
    languages: ["Portuguese", "English"],
    influences:
      "Botanical grids, cut paper and colour found in everyday spaces.",
    bio: "Inês Duarte folds and cuts paper into grids that grow like plants. She is early in her career and shares every step of a piece.",
    sample: true,
    portrait: "/assets/kresilo/ines-mark.svg",
  },

  // Twelve new makers. Data only: no portraits and no works yet.
  {
    id: "mira-kesavan",
    name: "Mira Kesavan",
    kind: "individual",
    place: "Chennai, India",
    area: "Asia",
    region: "South Asia",
    discipline: "colour grading",
    stage: "established",
    voice: "Patient and dry-humoured",
    languages: ["Tamil", "English"],
    influences:
      "Monsoon skies, sodium street lamps and the slow work of matching one frame to the next.",
    bio: "Mira Kesavan grades colour for moving images and teaches by comparing the same shot three ways. She prefers grain and warmth to polish.",
    sample: true,
  },
  {
    id: "arief-pranata",
    name: "Arief Pranata",
    kind: "individual",
    place: "Bandung, Indonesia",
    area: "Asia",
    region: "Southeast Asia",
    discipline: "packaging",
    stage: "emerging",
    voice: "Eager and practical",
    languages: ["Indonesian", "English"],
    influences:
      "Hand-folded cartons, market stalls, recycled board and the weight of an object in the hand.",
    bio: "Arief Pranata designs boxes, labels and wraps that can be folded by hand and reused. He tests each one by shipping it to a friend.",
    sample: true,
  },
  {
    id: "madina-yesenova",
    name: "Madina Yesenova",
    kind: "individual",
    place: "Almaty, Kazakhstan",
    area: "Asia",
    region: "Central Asia",
    discipline: "spatial design",
    stage: "mid-career",
    voice: "Calm and observant",
    languages: ["Russian", "Kazakh"],
    influences:
      "Mountain light on concrete, shared courtyards, signage in two scripts and models built from card.",
    bio: "Madina Yesenova designs rooms and wayfinding, and builds a card model before she draws a single plan. She is interested in how people choose where to stand.",
    sample: true,
  },
  {
    id: "neema-waweru",
    name: "Neema Waweru",
    kind: "individual",
    place: "Nairobi, Kenya",
    area: "Africa",
    region: "East Africa",
    discipline: "photo editing",
    stage: "mid-career",
    voice: "Lively and generous",
    languages: ["Swahili", "English"],
    influences:
      "Bus-window reflections, rain on tin roofs, layered collage and the craft of cutting a picture down to its centre.",
    bio: "Neema Waweru edits photographs into layered sets, choosing crops and sequence so each picture has room. She shows her first and last cut side by side.",
    sample: true,
  },
  {
    id: "hana-zerrouki",
    name: "Hana Zerrouki",
    kind: "individual",
    place: "Algiers, Algeria",
    area: "Africa",
    region: "North Africa",
    discipline: "retouching",
    stage: "established",
    voice: "Careful and plain-spoken",
    languages: ["Arabic", "French"],
    influences:
      "Sea haze, white walls, printed magazines and the discipline of leaving a face looking like itself.",
    bio: "Hana Zerrouki retouches portraits and still life with a rule of doing less than the client first asks. She keeps a log of every change she makes.",
    sample: true,
  },
  {
    id: "elin-brandvold",
    name: "Elin Brandvold",
    kind: "individual",
    place: "Bergen, Norway",
    area: "Europe",
    region: "Northern Europe",
    discipline: "illustration",
    stage: "mid-career",
    voice: "Gentle and wry",
    languages: ["Norwegian", "English"],
    influences:
      "Harbour fog, wet slate, ink wash and drawing on the train.",
    bio: "Elin Brandvold draws weather, boats and waiting rooms in ink and a few flat colours. She makes one drawing a day and chooses one a month.",
    sample: true,
  },
  {
    id: "radek-zawisza",
    name: "Radek Zawisza",
    kind: "individual",
    place: "Gdańsk, Poland",
    area: "Europe",
    region: "Eastern Europe",
    discipline: "type design",
    stage: "emerging",
    voice: "Earnest and exacting",
    languages: ["Polish", "English"],
    influences:
      "Shipyard stencils, timetable boards, metal type specimens and long nights of spacing letters.",
    bio: "Radek Zawisza draws typefaces for signs and screens and spends most of his time on spacing. He is early in his career and likes to publish unfinished weights.",
    sample: true,
  },
  {
    id: "rook-and-delaney",
    name: "Rook & Delaney",
    kind: "collective",
    members: ["Odile Rook", "Sam Delaney"],
    place: "Montréal, Canada",
    area: "North America",
    region: "North America",
    discipline: "motion",
    stage: "established",
    voice: "Two voices, quick and joking",
    languages: ["French", "English"],
    influences:
      "Winter streets, title cards, paper cut-outs and editing to a counted beat.",
    bio: "Rook & Delaney is a two-person studio that makes title sequences and short loops, one drawing and one animating. They write their notes in both French and English.",
    sample: true,
  },
  {
    id: "dorian-voss",
    name: "Dorian Voss",
    kind: "individual",
    place: "Detroit, United States",
    area: "North America",
    region: "North America",
    discipline: "photography",
    stage: "emerging",
    voice: "Blunt and curious",
    languages: ["English"],
    influences:
      "Empty parking lots, factory-floor light, contact sheets and long walks with one lens.",
    bio: "Dorian Voss photographs ordinary streets and buildings with one lens and no staging. He prints contact sheets and marks them up by hand.",
    sample: true,
  },
  {
    id: "ximena-torrealba",
    name: "Ximena Torrealba",
    kind: "individual",
    place: "Quito, Ecuador",
    area: "Latin America and the Caribbean",
    region: "Latin America",
    discipline: "lettering",
    stage: "mid-career",
    voice: "Bold and warm",
    languages: ["Spanish", "English"],
    influences:
      "Hand-painted shop signs, high-altitude light, brush and enamel paint, and chalk boards.",
    bio: "Ximena Torrealba paints and draws lettering for shopfronts and posters, mostly with a brush. She likes letters that look like they were made quickly and on purpose.",
    sample: true,
  },
  {
    id: "wren-calloway",
    name: "Wren Calloway",
    kind: "individual",
    place: "Hobart, Australia",
    area: "Oceania",
    region: "Oceania",
    discipline: "photography",
    stage: "mid-career",
    voice: "Spare and thoughtful",
    languages: ["English"],
    influences:
      "Harbour mornings, cold water, slow exposures and notebooks full of weather.",
    bio: "Wren Calloway photographs mornings on the water and writes the weather beside every frame. Slow exposures and long waits are part of the work.",
    sample: true,
  },
  {
    id: "kareem-lalchan",
    name: "Kareem Lalchan",
    kind: "individual",
    place: "Port of Spain, Trinidad and Tobago",
    area: "Latin America and the Caribbean",
    region: "Caribbean",
    discipline: "editorial design",
    stage: "established",
    voice: "Confident and conversational",
    languages: ["English"],
    influences:
      "Newsprint, radio, bright paint on small houses and the pacing of a long page.",
    bio: "Kareem Lalchan lays out magazines and books, deciding where a page should breathe. He prototypes every spread on cheap paper first.",
    sample: true,
  },
];

/** Everyone: the first eighteen, then the makers added by region (./roster). */
export const makers: readonly Maker[] = [...coreMakers, ...rosterMakers];

export const makerById = (id: string): Maker | undefined =>
  makers.find((m) => m.id === id);

/** True for any roster maker. Unknown ids are not sample makers. */
export const isSampleMaker = (maker: string | { id: string }): boolean => {
  const found = makerById(typeof maker === "string" ? maker : maker.id);
  return found?.sample === true;
};

/** Matches a sub-region ("South Asia") or a broad area ("Asia"). */
export const makersByRegion = (region: Region | Area): Maker[] =>
  makers.filter((m) => m.region === region || m.area === region);

export const makersByDiscipline = (discipline: Discipline): Maker[] =>
  makers.filter((m) => m.discipline === discipline);

/** Letters for the initials mark shown while a maker has no portrait. */
export const makerInitials = (name: string): string =>
  name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/** One consistent sentence for any surface that needs a written label. */
export const makerDisclaimer = (maker: Maker): string =>
  `${maker.name}: ${SAMPLE_DISCLAIMER}`;
