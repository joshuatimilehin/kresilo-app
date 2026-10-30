import type { Maker } from "../makers";
import type { CaseStudy } from "../portfolio/types";

/**
 * Four makers from South Asia, West Asia and North Africa, with two case
 * studies each. Culture shows through craft, materials, food, streets, signage
 * and print only (docs/cultural-context-and-respect-rules.md).
 */
export const makers: Maker[] = [
  {
    id: "ritika-dhabhai",
    name: "Ritika Dhabhai",
    kind: "individual",
    place: "Jaipur, India",
    area: "Asia",
    region: "South Asia",
    discipline: "textile",
    stage: "mid-career",
    voice: "Steady and hands-on",
    languages: ["Hindi", "English"],
    influences:
      "Carved teak blocks, indigo and madder vats, long printing tables and the registration dots printers use to line up the next impression.",
    bio: "Ritika Dhabhai designs printed cloth and labels for small linen and homeware makers, and draws every motif at the size of the block that will carry it. She keeps a box of first proofs, smudges and all, and pins the best misprints above her table.",
    sample: true,
    portrait: "/assets/kresilo/gen/portrait--ritika-dhabhai.jpg",
  },
  {
    id: "tahmid-sarkar",
    name: "Tahmid Sarkar",
    kind: "individual",
    place: "Dhaka, Bangladesh",
    area: "Asia",
    region: "South Asia",
    discipline: "illustration",
    stage: "emerging",
    voice: "Loud, quick and funny",
    languages: ["Bangla", "English"],
    influences:
      "Painted cycle-rickshaw panels, enamel paint on tin, shop signs lettered by hand and the colour of traffic at noon.",
    bio: "Tahmid Sarkar paints illustrations and lettering in enamel on tin sheet, then scans them for print. He learned to outline letters by watching a sign painter in his neighbourhood and still mixes his own drop-shadow colour from leftover tins.",
    sample: true,
    portrait: "/assets/kresilo/gen/portrait--tahmid-sarkar.jpg",
  },
  {
    id: "ceren-akbudak",
    name: "Ceren Akbudak",
    kind: "individual",
    place: "Istanbul, Türkiye",
    area: "Asia",
    region: "West Asia",
    discipline: "packaging",
    stage: "established",
    voice: "Precise and generous",
    languages: ["Turkish", "English"],
    influences:
      "Cobalt and turquoise glazes, tulip and carnation tile borders, printed tin, ferry timetables and the weight of a jar in the hand.",
    bio: "Ceren Akbudak designs packaging for food and craft businesses, painting each motif with a brush before it is separated into spot colours. She tests every box by posting it to herself across the Bosphorus.",
    sample: true,
    portrait: "/assets/kresilo/gen/portrait--ceren-akbudak.jpg",
  },
  {
    id: "hamza-ouazzani",
    name: "Hamza Ouazzani",
    kind: "individual",
    place: "Fez, Morocco",
    area: "Africa",
    region: "North Africa",
    discipline: "graphic identity",
    stage: "mid-career",
    voice: "Measured and exact",
    languages: ["Arabic", "French"],
    influences:
      "Cut-tile floors, compass-and-ruler grids, vegetable-tanned leather, brass plates and the light in narrow streets.",
    bio: "Hamza Ouazzani builds identities and signage from geometric grids he draws with a compass before touching a screen. He tests every shape by cutting it from card, and most of his marks can be made with a knife and a straight edge.",
    sample: true,
    portrait: "/assets/kresilo/gen/portrait--hamza-ouazzani.jpg",
  },
];

export const caseStudies: CaseStudy[] = [
  // Ritika Dhabhai
  {
    id: "neelgarh-linen",
    makerId: "ritika-dhabhai",
    title: "Neelgarh Linen",
    client: {
      name: "Neelgarh Linen",
      what: "A linen and homeware label run by two sisters from a print workshop outside the city",
    },
    kind: "brand-identity",
    themes: ["company", "product"],
    tagline: "A label printed with the same blocks as the cloth.",
    role: "Identity, labels and printed wraps",
    year: 2026,
    palette: ["#27325f", "#a8432f", "#ede3cf", "#6f7a45"],
    story: {
      brief:
        "The label sold bedsheets and table linen to shops abroad with printed stickers that looked nothing like the cloth inside. The sisters wanted an identity that came out of their own workshop.",
      idea:
        "Carve the wordmark into a small teak block and print every label, tag and wrap by hand, keeping the registration marks the printers use to line up each impression as part of the design.",
      outcome:
        "A carved wordmark block, four border blocks, woven cotton labels, hand-printed swing tags and a kraft wrap. The printers now run a sheet of tags at the end of every cloth batch.",
    },
    panels: [
      { kind: "hero", caption: "The wordmark block in teak, beside its first proof." },
      { kind: "logo", caption: "Printed by hand, so no two are quite the same." },
      { kind: "wordmark-pattern", caption: "Registration marks kept, not trimmed." },
      { kind: "palette", caption: "Indigo, madder, unbleached cloth and an over-dyed olive." },
      { kind: "mockup", scene: "card", caption: "Swing tags from the end of a batch." },
      { kind: "mockup", scene: "tote", caption: "The cotton carry bag." },
    ],
    assetsUsed: [],
    templateId: "brand-board",
    aiHelp: "none",
    process:
      "Wordmark drawn on tracing paper and carved by the workshop's block maker; every tag printed by hand in the workshop's own dyes. No generated imagery.",
  },
  {
    id: "kesar-oven-cloth",
    makerId: "ritika-dhabhai",
    title: "Kesar Oven Bread Cloth",
    client: {
      name: "Kesar Oven",
      what: "A bakery café on a quiet residential lane, grown from a father's bread counter",
    },
    kind: "packaging",
    themes: ["product", "place"],
    tagline: "Bread bags people bring back.",
    role: "Textile print and reusable packaging",
    year: 2025,
    palette: ["#3c4f86", "#b8573c", "#f2ead8", "#c79a3b"],
    story: {
      brief:
        "The bakery went through thousands of plastic bags a month and wanted customers to carry bread home in something they would keep.",
      idea:
        "A cotton bread bag and a tea towel printed with one small loaf block and a wheat-ear border in turmeric and indigo, sold at cost and refilled at a discount.",
      outcome:
        "Eight hundred bags in the first run. By the third month a quarter of morning customers were bringing one back to the counter.",
    },
    panels: [
      { kind: "hero", caption: "Morning bread in printed cotton." },
      { kind: "mockup", scene: "pouch", caption: "The drawstring bread bag." },
      { kind: "series", caption: "Five blocks: loaf, bun, rusk, wheat ear and a dot border." },
      { kind: "process", caption: "Two printers working toward each other down the long table." },
      { kind: "mockup", scene: "shopfront", caption: "Bags hanging behind the counter." },
    ],
    assetsUsed: [],
    aiHelp: "assisted",
    process:
      "Blocks carved from pencil drawings and printed by hand in two colours. AI was used only to preview the bags on the counter before the run; those previews were not published.",
  },

  // Tahmid Sarkar
  {
    id: "lal-cha-corner",
    makerId: "tahmid-sarkar",
    title: "Lal Cha Corner",
    client: {
      name: "Lal Cha Corner",
      what: "Six tea stalls near bus stops and markets, started by one stall owner in Mohammadpur",
    },
    kind: "brand-identity",
    themes: ["brand", "place"],
    tagline: "A tea stall you can spot from across the road.",
    role: "Lettering, illustration and sign painting",
    year: 2026,
    palette: ["#e2231a", "#0f8a5f", "#f9c80e", "#1a1aa6"],
    story: {
      brief:
        "Six stalls had six different signs, and regulars did not know they were the same business. The owner wanted one look a local sign painter could repeat on every stall without a computer.",
      idea:
        "Paint the name in fat, double-outlined letters with a drop shadow, and pair it with a kettle and two cups built only from shapes a painter can mark out with a ruler and a saucer.",
      outcome:
        "A painted wordmark, a kettle emblem, a stencil kit for the painter, cup sleeves and a price board. All six stalls were repainted within a month.",
    },
    panels: [
      { kind: "hero", caption: "The new sign at the first stall, still drying." },
      { kind: "logo", caption: "The wordmark, outlined twice." },
      { kind: "mockup", scene: "sign", caption: "The price board, repainted each season." },
      { kind: "mockup", scene: "cup", caption: "Paper cups for the bus queue." },
      { kind: "process", caption: "The kit: ruler lines, a saucer for curves and four tins of paint." },
    ],
    assetsUsed: [],
    templateId: "logo-on-products",
    aiHelp: "none",
    process:
      "Painted with brush and enamel on tin sheet, then redrawn as vectors for print; stall signs painted by hand on site. No generated imagery.",
  },
  {
    id: "kathalbagan-film-season",
    makerId: "tahmid-sarkar",
    title: "Rooftop Winter Season",
    client: {
      name: "Kathalbagan Film Club",
      what: "A volunteer-run club that screens short films on a rooftop every winter",
    },
    kind: "campaign",
    themes: ["culture", "story"],
    tagline: "Twelve short films, twelve painted posters.",
    role: "Poster illustration and lettering",
    year: 2025,
    palette: ["#ff4f9a", "#00a6c8", "#ffe14d", "#2b1b3d"],
    story: {
      brief:
        "The club's winter season had twelve short films and almost no budget, and last year's printed posters vanished into a wall of other notices.",
      idea:
        "Paint one scene from each film on a tin panel in loud enamel colours and letter the title by hand in the same paint, so each poster reads as a painted object.",
      outcome:
        "Twelve painted panels, a season poster built from all twelve, and risograph prints of each sold at screenings to pay for the projector hire.",
    },
    panels: [
      { kind: "hero", caption: "Twelve panels laid out on the roof before the first night." },
      { kind: "series", caption: "One painted scene per film." },
      { kind: "mockup", scene: "poster", caption: "The season poster on a market wall." },
      { kind: "type", caption: "Titles lettered in enamel, then scanned." },
      { kind: "quote", caption: "“People photographed the poster before they read it.” A club volunteer." },
    ],
    assetsUsed: [],
    aiHelp: "none",
    process:
      "Painted in enamel on tin, scanned at high resolution and printed on a risograph. No generated imagery.",
  },

  // Ceren Akbudak
  {
    id: "akkaya-spice-tins",
    makerId: "ceren-akbudak",
    title: "Akkaya Spice Tins",
    client: {
      name: "Akkaya Baharat",
      what: "A family spice shop in the covered market, third generation",
    },
    kind: "packaging",
    themes: ["product", "brand"],
    tagline: "Spice tins that line up like tiles on a wall.",
    role: "Packaging design and pattern",
    year: 2026,
    palette: ["#1f3f9a", "#2fa6a0", "#c8382b", "#f7f4ee"],
    story: {
      brief:
        "The shop sold loose spice in clear bags that faded within a week, and visitors kept asking for something they could carry home as a gift.",
      idea:
        "Square tins whose lids each carry one botanical tile motif (tulip, carnation, pomegranate or a long serrated leaf) in cobalt, turquoise and tomato red, so a row of tins builds a small tiled panel.",
      outcome:
        "Twelve tins, a foil refill pouch and a gift box of four. The four-tin box became the shop's best seller in its first season.",
    },
    panels: [
      { kind: "hero", caption: "Twelve tins lined up into one panel." },
      { kind: "wordmark-pattern", caption: "Four lid motifs that repeat in any order." },
      { kind: "mockup", scene: "can", caption: "The sumac tin." },
      { kind: "mockup", scene: "pouch", caption: "Refill pouches, sealed with the lid motif." },
      { kind: "mockup", scene: "box", caption: "The gift box of four." },
      { kind: "palette", caption: "Cobalt, turquoise, tomato red and slip white." },
    ],
    assetsUsed: [],
    templateId: "packaging-set",
    aiHelp: "none",
    process:
      "Motifs painted with brush and ink, then separated into three spot colours for tin printing. No generated imagery.",
  },
  {
    id: "firin-19-shipping",
    makerId: "ceren-akbudak",
    title: "Fırın 19",
    client: {
      name: "Fırın 19",
      what: "A ceramics studio and shared kiln run by four potters on the Asian shore",
    },
    kind: "packaging",
    themes: ["company", "product"],
    tagline: "A box that protects a cup and shows what is inside.",
    role: "Identity and shipping packaging",
    year: 2025,
    palette: ["#162f6b", "#5fbfc2", "#d9543a", "#e8ece6"],
    story: {
      brief:
        "The studio had started selling online and was losing one cup in ten to breakage, wrapped in bubble film and old newspaper.",
      idea:
        "A moulded-pulp cradle inside a printed card sleeve. The sleeve carries a single blue line drawing of the piece inside and the studio mark: the number 19 drawn in the loop of a glaze drip.",
      outcome:
        "Breakage fell below one in a hundred. The sleeves are now printed in two blues, one for cups and one for bowls, so packing goes faster.",
    },
    panels: [
      { kind: "hero", caption: "Cup, cradle and sleeve." },
      { kind: "logo", caption: "The 19, drawn as a glaze drip." },
      { kind: "mockup", scene: "box", caption: "The shipping box with its pulp cradle." },
      { kind: "mockup", scene: "card", caption: "Care cards, one per glaze." },
      { kind: "process", caption: "Drop tests from table height, forty times over." },
    ],
    assetsUsed: [],
    aiHelp: "assisted",
    process:
      "Pulp cradles moulded from cardboard offcuts with a local supplier; drawings made with a dip pen. AI was used only to try sleeve colourways, reviewed and chosen by hand.",
  },

  // Hamza Ouazzani
  {
    id: "sept-peaux-atelier",
    makerId: "hamza-ouazzani",
    title: "Atelier Sept Peaux",
    client: {
      name: "Atelier Sept Peaux",
      what: "A leather-goods workshop of five cutters and stitchers making bags and belts to order",
    },
    kind: "brand-identity",
    themes: ["company", "identity"],
    tagline: "A mark you can cut with a knife and a straight edge.",
    role: "Identity and pattern system",
    year: 2026,
    palette: ["#7b3f22", "#1d5c4d", "#e8dcc6", "#2a2420"],
    story: {
      brief:
        "The workshop sold to boutiques under each shop's own label and wanted its own name on the inside of every bag.",
      idea:
        "Build the mark and a pattern from one cut-tile grid, so every shape can be cut from leather offcuts with a knife and a straight edge. The mark is embossed, never printed.",
      outcome:
        "A brass embossing die, a pattern of seven interlocking shapes cut from offcuts, kraft dust bags and a door sign. Two boutiques now sell the bags under the workshop's own name.",
    },
    panels: [
      { kind: "hero", caption: "The brass die and its first pressing in tan hide." },
      { kind: "logo", caption: "One grid, one mark." },
      { kind: "wordmark-pattern", caption: "Seven shapes from one grid, cut from offcuts." },
      { kind: "mockup", scene: "tote", caption: "The dust bag." },
      { kind: "mockup", scene: "sign", caption: "The workshop door." },
    ],
    assetsUsed: [],
    templateId: "logo-on-products",
    aiHelp: "none",
    process:
      "Grid drawn with compass and ruler, tested in card, then cut in leather offcuts by the workshop. No generated imagery.",
  },
  {
    id: "bit-skhoun-wayfinding",
    makerId: "hamza-ouazzani",
    title: "Café Bit Skhoun",
    client: {
      name: "Café Bit Skhoun",
      what: "A café in a converted neighbourhood bathhouse, three vaulted rooms in a row",
    },
    kind: "spatial",
    themes: ["place", "story"],
    tagline: "Find your table by the colour of the floor.",
    role: "Wayfinding and identity",
    year: 2025,
    palette: ["#0e6b6b", "#d9b44a", "#f3efe7", "#9c3d2e"],
    story: {
      brief:
        "The building is three vaulted rooms with no windows between them, and first-time guests kept walking back out to ask where to sit.",
      idea:
        "Give each room one colour of cut tile in a strip along the floor, and repeat that colour on the menus, table numbers and doorway plates, so guests follow colour rather than words.",
      outcome:
        "Floor strips, brass doorway plates, tile table numbers and three menus. Staff say questions at the door all but stopped in the first week.",
    },
    panels: [
      { kind: "hero", caption: "The teal strip leading into the cool room." },
      { kind: "mockup", scene: "sign", caption: "Brass doorway plates, one colour per room." },
      { kind: "mockup", scene: "card", caption: "Table numbers cut in tile." },
      { kind: "palette", caption: "One colour per room, plus the plaster." },
      { kind: "process", caption: "Tile strips laid out dry before setting." },
    ],
    assetsUsed: [],
    aiHelp: "none",
    process:
      "Patterns drawn by hand and cut by a local tile workshop; plates etched in brass. No generated imagery.",
  },
];

/** Art direction for every generated picture of this maker's work: medium, rendering, light, composition, in 1–2 sentences. */
export const looks: Record<string, string> = {
  "ritika-dhabhai":
    "Hand block-printed linen and cotton photographed flat from directly above on a padded printing table, ink bleed, slight misregistration and carved-wood grain visible in each impression. Soft overcast daylight, muted indigo, madder and unbleached tones, carved blocks at the edge of frame.",
  "tahmid-sarkar":
    "Glossy enamel paint on tin and plywood, saturated flat colour with thick black outlines and drop-shadowed hand lettering, tight crops showing brush strokes, drips and chipped edges. Hard midday sunlight with sharp shadows and a street background thrown out of focus.",
  "ceren-akbudak":
    "Studio product still life of printed tins, card boxes and glazed ceramics on a white plaster ledge, cobalt and turquoise underglaze motifs with crisp specular highlights. One large softbox from the left, clean grey-white backdrop, objects arranged in neat rows.",
  "hamza-ouazzani":
    "Architectural photography of geometric cut-tile surfaces, embossed leather and etched brass signage in place, shot straight-on and symmetrical. Strong raking late-afternoon light, deep shadows, narrow street or vaulted interior, tactile surfaces in sharp focus.",
};

/** A prompt for this maker's profile portrait (a photo of a person who does not exist, never a real one). */
export const portraitPrompts: Record<string, string> = {
  "ritika-dhabhai":
    "Natural-light portrait photograph of a woman in her late thirties standing at a long block-printing table in a workshop in Jaipur, indigo-stained fingertips, plain cotton kurta, hair tied back, a carved wooden block in one hand, calm direct gaze, 50mm lens, shallow depth of field. Not based on any real or public person.",
  "tahmid-sarkar":
    "Candid portrait photograph of a young man in his mid-twenties in a small Dhaka workshop, paint-spattered t-shirt, a brush tucked behind his ear, tins of bright enamel paint and a half-painted tin sign behind him, grinning, bright daylight from an open shutter, 35mm lens. Not based on any real or public person.",
  "ceren-akbudak":
    "Studio portrait photograph of a woman in her late forties in a bright Istanbul design studio, short grey-streaked hair, linen shirt, reading glasses pushed up, holding a printed spice tin, shelves of packaging prototypes softly blurred behind her, soft window light, 85mm lens. Not based on any real or public person.",
  "hamza-ouazzani":
    "Environmental portrait photograph of a man in his late thirties in a narrow street in Fez, trimmed beard, dark work jacket over a plain shirt, holding a compass and a sheet of card cut into geometric shapes, a tiled wall behind him, raking afternoon light, 50mm lens. Not based on any real or public person.",
};
