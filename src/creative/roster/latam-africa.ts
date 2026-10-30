import type { Maker } from "../makers";
import type { CaseStudy } from "../portfolio/types";

/**
 * Four makers from Oaxaca, Lima, Dakar and Addis Ababa, with two case studies
 * each. Pure data. Culture shows through craft, materials, food, streets,
 * signage, textiles and print only (docs/cultural-context-and-respect-rules.md).
 */

export const makers: Maker[] = [
  {
    id: "itzel-matus",
    name: "Itzel Matus",
    kind: "individual",
    place: "Oaxaca de Juárez, Mexico",
    area: "Latin America and the Caribbean",
    region: "Latin America",
    discipline: "illustration",
    stage: "mid-career",
    voice: "Bright, exact and chatty",
    languages: ["Spanish", "English"],
    influences:
      "Carved and painted wooden animals, burnished black clay, oilcloth on market tables, house paint on mud-brick walls and a brush loaded only once.",
    bio: "Itzel Matus paints patterns with one round brush and a tray of six house-paint colours, then builds whole brand systems from the dots, dashes and zigzags that come out of it. She works beside carvers and potters on the pieces themselves before she draws anything for a screen, and tests every new pattern on a scrap of pine first.",
    sample: true,
    portrait: "/assets/kresilo/gen/portrait--itzel-matus.jpg",
  },
  {
    id: "lucero-huamani",
    name: "Lucero Huamaní",
    kind: "individual",
    place: "Lima, Peru",
    area: "Latin America and the Caribbean",
    region: "Latin America",
    discipline: "paper and print",
    stage: "emerging",
    voice: "Loud on paper, quiet in person",
    languages: ["Spanish", "English"],
    influences:
      "Fluorescent screen inks, black poster board bought by the ream, paste-ups layered on street walls and the print-supply shops of the city centre.",
    bio: "Lucero Huamaní screen-prints posters by hand, one colour a pass, on black board from a print-supply street in the centre of Lima. She draws every letter at full size with a marker before it goes onto a screen and keeps the slight mis-registration on purpose. She prints on Fridays and pastes up on Saturdays.",
    sample: true,
    portrait: "/assets/kresilo/gen/portrait--lucero-huamani.jpg",
  },
  {
    id: "ibou-sarr",
    name: "Ibou Sarr",
    kind: "individual",
    place: "Dakar, Senegal",
    area: "Africa",
    region: "West Africa",
    discipline: "graphic identity",
    stage: "mid-career",
    voice: "Sharp, warm and to the point",
    languages: ["French", "Wolof", "English"],
    influences:
      "Brown tailoring pattern paper, chalk marks on cloth, wax-print bolts stacked on market stalls, seamless studio paper and a single hard flash.",
    bio: "Ibou Sarr designs identities for clothing labels and works most days from a tailor's shop in the Médina, borrowing offcuts of pattern paper for his layouts. He photographs every label he makes on the garment it belongs to, with one flash and a roll of seamless paper, and still writes the first season's price tags by hand.",
    sample: true,
    portrait: "/assets/kresilo/gen/portrait--ibou-sarr.jpg",
  },
  {
    id: "mahlet-tesfaye",
    name: "Mahlet Tesfaye",
    kind: "individual",
    place: "Addis Ababa, Ethiopia",
    area: "Africa",
    region: "East Africa",
    discipline: "packaging",
    stage: "established",
    voice: "Measured and generous",
    languages: ["Amharic", "English"],
    influences:
      "Coiled grass baskets, round-bellied clay coffee pots, jute sacking from green-coffee warehouses, uncoated board and printing in two inks.",
    bio: "Mahlet Tesfaye designs packaging for food and drink producers and builds every pack as a paper model before she opens a laptop. Her patterns start as pencil rubbings of coiled grass baskets bought at Merkato, and she keeps most jobs to two inks on uncoated board. She has run a small studio near Piassa for twelve years.",
    sample: true,
    portrait: "/assets/kresilo/gen/portrait--mahlet-tesfaye.jpg",
  },
];

export const caseStudies: CaseStudy[] = [
  // Itzel Matus, Oaxaca
  {
    id: "patio-pinto",
    makerId: "itzel-matus",
    title: "Patio Pinto",
    client: {
      name: "Patio Pinto",
      what: "A toy-and-homeware shop off a courtyard in Jalatlaco selling painted wooden animals, cups and tablecloths",
    },
    kind: "brand-identity",
    themes: ["brand", "product"],
    tagline: "A brand painted, not drawn.",
    role: "Identity and pattern illustration",
    year: 2026,
    palette: ["#e8418c", "#18a999", "#f5b324", "#2b2522"],
    story: {
      brief: "Patio Pinto had grown from one table of painted wooden animals to a shop and an online store, and its name was still written by hand on a sheet of card taped to the door.",
      idea: "Build the whole identity from the same three strokes the shop's painters put on a fox's back: a dot, a short dash and a zigzag. The wordmark is painted with one loaded brush, and every pattern is a different arrangement of those three marks.",
      outcome: "A painted wordmark, four pattern families, gift boxes and tissue, a courtyard door painted on site, and a rule that no two orders ship in the same pattern.",
    },
    panels: [
      { kind: "hero", caption: "A painted fox and a gift box, the same three strokes." },
      { kind: "wordmark-pattern", caption: "Dot, dash, zigzag and petal: four pattern families painted at full size." },
      { kind: "logo", caption: "The wordmark, painted with one loaded brush and kept as it dried." },
      { kind: "mockup", scene: "box", caption: "Gift boxes, a different pattern for every order." },
      { kind: "mockup", scene: "shopfront", caption: "The courtyard door, painted over two days." },
      { kind: "palette" },
    ],
    assetsUsed: [],
    aiHelp: "none",
    process: "Patterns painted by hand in gouache and house paint, scanned at 1200 dpi and cleaned without redrawing; the door was painted on the wall itself.",
  },
  {
    id: "barro-quieto",
    makerId: "itzel-matus",
    title: "Barro Quieto",
    client: {
      name: "Taller Barro Quieto",
      what: "A family black-clay workshop in San Bartolo Coyotepec that makes cups, jugs and bowls to order",
    },
    kind: "packaging",
    themes: ["product", "company"],
    tagline: "Packing for pots that ring when you tap them.",
    role: "Packaging and pattern illustration",
    year: 2025,
    palette: ["#1f1c1b", "#6e6863", "#ec6fa9", "#ece4d6"],
    story: {
      brief: "The workshop had started shipping tableware to cafés in Mexico City and was losing one cup in eight to breakage inside plain brown cartons.",
      idea: "A folded paper sleeve for each shape, printed in two colours with a pattern taken from the burnished lines on the clay, so the wrap protects the piece and shows which way to lift it out.",
      outcome: "Sleeves for six shapes, a shipping box with a corrugated cradle and a card for every piece naming who shaped it and who burnished it. Breakage fell to one in sixty over the first four months.",
    },
    panels: [
      { kind: "hero", caption: "A burnished jug in its printed sleeve." },
      { kind: "series", caption: "Six sleeves for six shapes, cup to water jug." },
      { kind: "mockup", scene: "box", caption: "The shipping box and its corrugated cradle." },
      { kind: "mockup", scene: "card", caption: "One card per piece: who shaped it, who burnished it." },
      { kind: "process", caption: "Drop tests on the workshop's concrete floor." },
    ],
    assetsUsed: [],
    aiHelp: "none",
    process: "Patterns drawn in brush and ink from the clay surfaces, printed in two colours on recycled kraft; sleeves prototyped and drop-tested at the workshop.",
  },

  // Lucero Huamaní, Lima
  {
    id: "bajo-nivel-posters",
    makerId: "lucero-huamani",
    title: "Bajo Nivel",
    client: { name: "Bajo Nivel", what: "A forty-seat venue under a car park in Barranco" },
    kind: "campaign",
    themes: ["place", "culture"],
    tagline: "A poster a week, printed the night before the gig.",
    role: "Lettering and screen printing",
    year: 2026,
    palette: ["#0b0b0b", "#ff3fa4", "#ff7a00", "#3cf23c"],
    story: {
      brief: "The venue had no advertising budget and a room that only filled when people walking past knew a band was on that night.",
      idea: "One fluorescent poster per gig, lettered by hand and printed in an edition of eighty on black board: the band's name as large as the sheet allows, the date in the second colour, the door price in the third.",
      outcome: "Forty-six posters across one season, pasted on the same three walls every week. Twenty-nine nights sold out, and the venue now keeps a full set framed behind the bar.",
    },
    panels: [
      { kind: "hero", caption: "Pink, orange and green on black: the season's first poster." },
      { kind: "series", caption: "Forty-six weeks, forty-six posters." },
      { kind: "type", caption: "Every letter drawn at full size with a marker, then exposed onto a screen." },
      { kind: "mockup", scene: "poster", caption: "Pasted up outside the car park, the night before." },
      { kind: "process", caption: "Three screens, three passes, eighty sheets." },
    ],
    assetsUsed: [],
    aiHelp: "none",
    process: "Lettered by hand at full size, exposed onto screens and printed by hand in fluorescent ink, one colour per pass. No digital type.",
  },
  {
    id: "siete-frutas",
    makerId: "lucero-huamani",
    title: "Siete Frutas",
    client: {
      name: "Juguería Siete Frutas",
      what: "A juice counter with eight stools in a covered market in Surquillo",
    },
    kind: "lettering",
    themes: ["brand", "place"],
    tagline: "A menu you can read from the other end of the market.",
    role: "Menu lettering and printed matter",
    year: 2025,
    palette: ["#141414", "#ff66b3", "#c8ff1a", "#ffb81c"],
    story: {
      brief: "The counter's menu was a laminated sheet nobody could read past the second stool, and the queue kept drifting to the stall opposite.",
      idea: "Turn the menu into a wall of fluorescent posters, one per juice, with the fruit's name huge and the price in a second colour, printed cheaply enough to redo whenever a price changes.",
      outcome: "Fourteen menu posters, printed cups in two inks, a price strip that slides into the frame and a lettered shutter for the hours the counter is closed.",
    },
    panels: [
      { kind: "hero", caption: "Fourteen juices, fourteen posters, one wall." },
      { kind: "mockup", scene: "shopfront", caption: "The counter at seven in the morning." },
      { kind: "mockup", scene: "cup", caption: "Takeaway cups, two inks." },
      { kind: "mockup", scene: "sign", caption: "The price strip, reprinted in an afternoon." },
      { kind: "quote", caption: "“People order by pointing at the green one.” The owner, in the second week." },
    ],
    assetsUsed: [],
    aiHelp: "assisted",
    process: "Posters lettered and screen-printed by hand. An AI image model was used once to preview the wall layout from photographs of the counter; nothing generated was printed.",
  },

  // Ibou Sarr, Dakar
  {
    id: "coupe-franche",
    makerId: "ibou-sarr",
    title: "Coupe Franche",
    client: {
      name: "Coupe Franche",
      what: "A young menswear label of tailored shirts and wax-print-lined jackets, made in a four-person workshop",
    },
    kind: "brand-identity",
    themes: ["identity", "company"],
    tagline: "An identity cut from the pattern paper.",
    role: "Identity, labels and lookbook art direction",
    year: 2026,
    palette: ["#1b2a4a", "#c49a6c", "#f2ede4", "#d4452a"],
    story: {
      brief: "Two tailors launching their first collection needed labels, tags and a look for their photographs that would not compete with the cloth.",
      idea: "Build every piece from the brown paper the patterns are cut on. Notches, grain lines and seam allowances become the grid, and the wordmark is drawn from the narrow capitals the tailors already chalk onto the paper.",
      outcome: "A wordmark, woven neck labels, kraft swing tags carrying each garment's pattern number, order sheets, a lookbook shot on seamless paper and a sign for the workshop door.",
    },
    panels: [
      { kind: "hero", caption: "A jacket lining, a pattern piece and the wordmark in one frame." },
      { kind: "logo", caption: "The wordmark, drawn from the tailors' own chalk capitals." },
      { kind: "wordmark-pattern", caption: "Notches and grain lines, used as the grid." },
      { kind: "mockup", scene: "card", caption: "Swing tags with each pattern number." },
      { kind: "mockup", scene: "letterhead", caption: "Order sheets for the workshop." },
      { kind: "mockup", scene: "shopfront", caption: "The workshop door." },
    ],
    assetsUsed: [],
    aiHelp: "none",
    process: "Drawn with chalk and pencil on the tailors' pattern paper, scanned and refined; the lookbook was photographed in a hired studio with one flash.",
  },
  {
    id: "six-yards",
    makerId: "ibou-sarr",
    title: "Six Yards",
    client: {
      name: "Ndella Tissus",
      what: "A cloth stall at the HLM market that sells wax print by the six-yard piece",
    },
    kind: "campaign",
    themes: ["story", "place"],
    tagline: "The same cloth twice: folded on the day, worn weeks later.",
    role: "Campaign photography and poster design",
    year: 2025,
    palette: ["#0e7c5b", "#f0b323", "#2d3f8c", "#e6e0d4"],
    story: {
      brief: "The stall wanted a poster for its pitch at the market and a reason for customers to come back once their clothes were made.",
      idea: "Photograph customers on seamless paper holding the folded piece they had just bought, then again when they return wearing what their tailor made from it. Two frames, one cloth.",
      outcome: "Twenty-four paired portraits, a poster series for the stall and a phone-sized set sent to each sitter. Eleven people came back for their second frame in the first month.",
    },
    panels: [
      { kind: "hero", caption: "Folded, then worn: the same cloth twice." },
      { kind: "series", caption: "Twelve pairs from the first season." },
      { kind: "mockup", scene: "poster", caption: "On the stall's pitch at the market." },
      { kind: "mockup", scene: "phone", caption: "The set each customer receives." },
      { kind: "process", caption: "One flash, one roll of grey seamless, a folding table between the bolts." },
    ],
    assetsUsed: [],
    aiHelp: "none",
    process: "Photographed at the stall with signed consent; every sitter chose their own frames before anything was printed.",
  },

  // Mahlet Tesfaye, Addis Ababa
  {
    id: "tilet-roasters",
    makerId: "mahlet-tesfaye",
    title: "Tilet Roasters",
    client: {
      name: "Tilet Roasters",
      what: "A small roaster in Kazanchis that sells beans by the half kilo and runs a six-seat coffee bar",
    },
    kind: "packaging",
    themes: ["product", "brand"],
    tagline: "Bags with a window shaped like the pot.",
    role: "Identity and packaging system",
    year: 2026,
    palette: ["#5e3219", "#c97b3d", "#ead9bc", "#2e4636"],
    story: {
      brief: "The roaster sold beans in clear plastic with a sticker, and regulars could not tell one growing region from the next on the shelf.",
      idea: "One kraft bag for every coffee, printed in two inks: a coiled basket pattern that grows denser as the roast darkens, and the round outline of a clay coffee pot cut as the window, so the beans show through its belly.",
      outcome: "Bags for nine coffees, a takeaway cup, a box of three for gifts and a roast scale printed on every bag. Sales of the two lightest roasts doubled in the first quarter.",
    },
    panels: [
      { kind: "hero", caption: "Nine bags, one pot-shaped window." },
      { kind: "wordmark-pattern", caption: "The coiled basket pattern, denser as the roast darkens." },
      { kind: "mockup", scene: "pouch", caption: "The half-kilo bag." },
      { kind: "mockup", scene: "cup", caption: "Takeaway cup for the coffee bar." },
      { kind: "mockup", scene: "box", caption: "A box of three, for gifts." },
      { kind: "palette" },
    ],
    assetsUsed: [],
    aiHelp: "none",
    process: "Pattern drawn from pencil rubbings of grass baskets, printed in two inks on uncoated kraft; every bag was prototyped by hand before the print run.",
  },
  {
    id: "kolo-bet",
    makerId: "mahlet-tesfaye",
    title: "Kolo Bet",
    client: {
      name: "Kolo Bet",
      what: "A family business in Arat Kilo that roasts barley and chickpeas and sells them in paper cones from a street window",
    },
    kind: "brand-identity",
    themes: ["company", "product"],
    tagline: "A snack window that finally has a name.",
    role: "Identity, stamp and tins",
    year: 2025,
    palette: ["#9a4a2c", "#dcb36e", "#f3e8d4", "#3a2a1f"],
    story: {
      brief: "The family had sold roasted barley from the same window for years without a sign, and wanted to supply two supermarkets without giving up the paper cone.",
      idea: "Keep the cone and make it the mark: a cone drawn in one line, cut as a rubber stamp the family can press onto any paper, and the same stamp printed at full size on tins for the supermarket shelf.",
      outcome: "A rubber stamp, printed cones, three tins (barley, chickpea and mixed), a window sign and a price board. The cones are still stamped by hand every morning.",
    },
    panels: [
      { kind: "hero", caption: "The cone, the stamp and the tin." },
      { kind: "logo", caption: "The cone, drawn in a single line." },
      { kind: "mockup", scene: "can", caption: "Three tins for the supermarket shelf." },
      { kind: "mockup", scene: "sign", caption: "The sign over the window." },
      { kind: "process", caption: "Stamping the morning's cones at the window." },
    ],
    assetsUsed: [],
    aiHelp: "assisted",
    process: "Mark drawn by hand and cut as a rubber stamp. An AI image model was used to try tin colourways from photographs of the drawings; the family chose from printed proofs.",
  },
];

/** Art direction for every generated picture of this maker's work: medium, rendering, light, composition, in 1–2 sentences. */
export const looks: Record<string, string> = {
  "itzel-matus":
    "Flat gouache pattern illustration, dense dots, dashes and zigzags in hot pink, turquoise and marigold, painted on carved wooden animals and on paper. Shot straight-on against burnished black clay in soft north-window daylight, centred and close.",
  "lucero-huamani":
    "Fluorescent hand-screen-printed poster type in pink, orange and acid green on black board, slightly mis-registered with visible ink texture. Photographed pasted in overlapping layers on a rough street wall at night under orange sodium light.",
  "ibou-sarr":
    "Studio fashion photography on seamless grey paper with one hard flash and crisp shadows, wax-print cloth and brown tailoring pattern paper filling the frame. Tight grid layouts in narrow capitals, cropped close on cut edges, notches and labels.",
  "mahlet-tesfaye":
    "Product still life of uncoated kraft packaging printed in two warm earth inks with coiled-basket geometry. Raking late-afternoon sun across a lime-plastered wall and a woven grass mat, shallow depth of field, objects grouped low in the frame.",
};

/** A prompt for this maker's profile portrait (a photo of a person who does not exist, never a real one). */
export const portraitPrompts: Record<string, string> = {
  "itzel-matus":
    "Environmental portrait photograph of a Mexican woman in her late thirties, a pattern illustrator, at a pine worktable with jars of paint, round brushes and small painted wooden animals; paint on her fingertips, plain cotton blouse, soft daylight from a courtyard doorway, 50mm lens, natural skin texture. A person who is not a real individual and resembles no public figure; no text, logos or religious symbols.",
  "lucero-huamani":
    "Portrait photograph of a Peruvian woman in her mid-twenties, a screen printer, in a small print workshop at night holding a squeegee beside a drying rack of fluorescent posters; black T-shirt with ink smudges, hair tied back, light from a single overhead tube, 35mm lens, candid. A person who is not a real individual and resembles no public figure; no readable text, logos or religious symbols.",
  "ibou-sarr":
    "Portrait photograph of a Senegalese man in his early thirties, an identity designer, standing in a tailor's workshop with brown pattern paper pinned to the wall behind him and a tape measure around his neck; plain white shirt with rolled sleeves, short beard, one hard flash with soft fill, 85mm lens, calm direct gaze. A person who is not a real individual and resembles no public figure; no text, logos or religious symbols.",
  "mahlet-tesfaye":
    "Portrait photograph of an Ethiopian woman in her mid-forties, a packaging designer, seated at a studio table covered with folded paper bag prototypes and small dishes of coffee beans; warm neutral linen shirt, reading glasses pushed up into her hair, late-afternoon window light, 50mm lens, natural skin texture. A person who is not a real individual and resembles no public figure; no text, logos, crosses or other religious symbols, no jewellery with symbols.",
};
