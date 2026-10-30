import type { Persona } from "./types";

/** Radek Zawisza, Gdańsk: typefaces for signs and screens, spaced at night. */
export const persona: Persona = {
  makerId: "radek-zawisza",
  studio: {
    training:
      "Studied in the visual communication studio of the city's academy of fine arts, where typography is the core of the first degree, and spent his spare hours in the printmaking workshop learning to lock up a forme and pull a proof. Worked two years at a sign fabrication shop in the port district cutting vinyl and spray stencils for warehouse doors and quay bollards, which is where he learned what a letter looks like at forty metres. Has been independent for two years and still treats every typeface as a work in progress.",
    room:
      "A shared studio on the first floor of a rebuilt granary on Ołowianka island, with a tall window across the Motława to the old harbour crane. Steel shelving, a cabinet of shallow type-case drawers he uses for proofs instead of lead, a tabletop proof press by the window, a long bench with a cutting mat, and a wall of laser proofs pinned in strict rows with pencil spacing marks on every one.",
    tools: [
      "A font editor on a laptop, with a second screen showing the control strings HOHOHO and nonono at text size",
      "A tabletop cylinder proof press, and an aluminium base that brings photopolymer plates to type height",
      "A laser printer for spacing proofs at nine point and at full sign size, tiled across sheets",
      "A cutting plotter for stencil film, and a scalpel for the bridges it gets wrong",
      "A laser distance meter, used to set up reading tests at the real viewing distance",
      "A 10x loupe, a steel rule and a soft pencil",
    ],
    materials: [
      "Water-washout photopolymer plates for letterpress proofs of each weight",
      "Rubber-based letterpress ink in navy and a warm amber, mixed by weight",
      "Cream uncoated card for specimens, cut to A3",
      "Polyester stencil film and aerosol paint in navy and high-visibility orange",
      "Grey board for full-size sign mock-ups, carried down to the quay to test in rain",
    ],
    hours:
      "Draws new glyphs from ten until late afternoon, walks the quay at dusk to look at signs, and spaces at night: after nine, when the island goes quiet, he adjusts sidebearings against the control strings until one in the morning. Proofs on the press on Saturdays. On the first of each month he publishes whatever weight he has, marked unfinished.",
  },
  hand: {
    line:
      "An even-weight grotesque with low contrast, curves drawn as slightly squared ovals and terminals cut flat like plate steel. Apertures are held wide open so c, e, a and s never close up from a moving boat or in rain.",
    signatureMoves: [
      "Every specimen opens with the control strings HOHOHO and nonono printed large, before any word",
      "Polish letters drawn as part of the design: a steep kreska, an ogonek that grows out of the stroke, a centred bar through ł",
      "Each sign face tested at its real viewing distance outdoors, at night and in rain, with the test photograph pinned to the proof",
      "A version number and date in the corner of every proof and trial file: 'v0.7, unfinished'",
    ],
    motifs: [
      "The pair Aa shown huge at the top of a specimen",
      "A single navy waterline band running under a word",
      "Stencil bridges left in the heaviest weight, after the spray-painted numbers on shipyard halls",
    ],
    type:
      "Only his own faces. Specimens are set in the typeface being shown, with Polish sample text full of ą, ę, ł, ń, ó, ś, ź and ż so the diacritics are judged in real words. Numerals are tabular, drawn for timetables and stall numbers first.",
    keptImperfections: [
      "Overspray haloes around stencil edges",
      "Ink squash and a faint plate edge on letterpress proofs",
      "Unfinished glyphs left visible in trial weights, such as a rough ampersand",
      "Pencil spacing marks and arrows on the proofs",
    ],
  },
  palette: {
    early: ["#14213d", "#fca311", "#e5e5e5", "#6b705c"],
    current: ["#c8791f", "#1c2541", "#f5ead6", "#3a506b"],
    why:
      "The quay signs came first, so his first palette was the one that works at night in rain: high-visibility orange on deep navy, with the grey of concrete and the olive of harbour paint. When the festival asked him for a typeface for print, the orange warmed into the amber of its name, the grey ground became cream proof card, and the navy softened towards slate for secondary text.",
  },
  subjects: {
    clients:
      "Festivals and cultural venues on the waterfront, transport and wayfinding projects, small publishers who need Polish diacritics done properly, and cafés and stalls that want one good sign.",
    places: [
      "The Motława quays and the old harbour crane, seen from his window",
      "The former shipyard halls and gates in the Young City district, with their painted hall numbers",
      "Commuter rail platforms between Gdańsk and Gdynia, for their station signs and timetable boards",
      "Ołowianka and Granary Island at night, when the quay lights come on",
    ],
    returningClient:
      "Amber Quay, the summer festival on the quay, which first hired him for its signs and came back for the typeface; each spring it asks for one more weight before the season opens.",
  },
  presentation: {
    camera:
      "A mirrorless camera on a copy stand with a 50mm macro lens, straight down, for proofs; signs photographed in place, front-on, at the height a passer-by reads them.",
    light:
      "Two cool daylight panels at forty-five degrees on the copy stand, even and shadowless; outdoors only under overcast sky or at night under quay lamps.",
    surfaces:
      "Cream card on grey board, the steel bed of the proof press, and on site the brick of the granaries and the granite of the quay.",
    framing:
      "Tight crops on two or three letters so the spacing can be judged, everything aligned to a strict modular grid; sets laid in rows with equal gaps.",
  },
  voice: {
    captions:
      "Exact and earnest: weight, version, size and distance. 'Bold v0.9, 120 mm caps, read at 40 m in rain.' Polish first, English below; he credits the person who held the board.",
    neverSays: ["pixel-perfect", "timeless", "industrial chic", "font, when he means typeface", "finished"],
  },
  respect: {
    exclude: [
      "Trade-union and strike imagery, its logos and lettering, and the shipyard memorial with its crosses",
      "Churches, the basilica towers, crosses and religious figures",
      "Real typefaces, their names, or traces of the shipyard's own historic signage; every letter is his own",
      "Wartime imagery: battle sites, ruins of 1945, military insignia and the symbols of any regime",
      "The national emblem and flags used as decoration",
      "Kashubian embroidery patterns as ornament",
      "Real amber shops, festivals and venue names",
    ],
    askAReader: [
      "Does 'Amber Quay' sound like an invented festival, or too close to a real summer event on the Gdańsk waterfront?",
      "Would an emerging type designer here more likely share a studio on Ołowianka or in the converted shipyard halls?",
      "Do the Polish diacritic choices described here (steep kreska, ogonek grown from the stroke) match what a Polish reader expects?",
    ],
  },
  sources: [
    {
      url: "https://en.asp.gda.pl/faculties/faculty-of-design/bdesign-b/department-of-product-design/basics-of-visual-communication-studio-first-cycle-studies,244",
      used: "The academy's first-degree visual communication studio puts special emphasis on typography and its use in different media and materials.",
    },
    {
      url: "https://en.asp.gda.pl/faculties/faculty-of-graphic-arts/structure/department-of-graphic-design/graphic-signal-in-public-space-studio,225",
      used: "A studio dedicated to graphic signs and lettering in public space: background for his sign-first training.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Gda%C5%84sk_Shipyard",
      used: "The shipyard grew from the Imperial Shipyard and the neighbouring yard merged in 1947; context for the halls and painted numbers he studies.",
    },
    {
      url: "https://www.inyourpocket.com/gdansk/The-story-of-the-Gdansk-Shipyards_73707f",
      used: "Production hall 3B still carries the yard's large painted name inscription: background for his interest in lettering painted on industrial buildings.",
    },
    {
      url: "https://en.wikipedia.org/wiki/O%C5%82owianka",
      used: "Ołowianka sits on the Motława opposite the crane, with rebuilt granaries.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Gda%C5%84sk_Crane",
      used: "The medieval port crane on the Motława is the city's best-known waterfront landmark.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Tricity_Rapid_Urban_Railway",
      used: "The commuter line runs station after station from Gdańsk through Sopot to Gdynia: source of his platform-sign studies.",
    },
    {
      url: "https://glyphsapp.com/learn/spacing",
      used: "Spacing starts from n and o and from H and O, tested in strings such as noononno, before other letters are linked and kerning is done last.",
    },
    {
      url: "https://learn.microsoft.com/en-us/typography/develop/character-design-standards/diacritics",
      used: "The Polish acute is steeper than a standard acute; the ogonek should extend from the stroke like a calligraphic stroke.",
    },
    {
      url: "https://www.boxcarpress.com/faqs/category/photopolymer-1",
      used: "Photopolymer plates must be mounted on a base to reach type height; harder plates hold fine detail on proof presses.",
    },
  ],
};
