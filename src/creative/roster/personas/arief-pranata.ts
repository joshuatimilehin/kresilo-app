import type { Persona } from "./types";

/** Arief Pranata, Bandung: hand-folded boxes, bags and wraps, each one tested in the post. */
export const persona: Persona = {
  makerId: "arief-pranata",
  studio: {
    training:
      "Studied product design at the art and design faculty of the city's institute of technology, the oldest such programme in the country, and wrote his final project on boxes that close without glue. Interned for a year at an offset printer that also cuts cartons for small food businesses, where he learned to read a die and talk to the press operators. He started taking packaging jobs from snack makers and roasters he met at small-business packaging workshops, and has worked on his own for three years.",
    room:
      "The front room of his aunt's house in a narrow lane in Coblong, below Dago, with a door on trestles for a desk and an A1 cutting mat across it. A shelf by the window holds every prototype that came back from a shipping test, dented corners and all, each labelled with the city it went to. Rolls of coloured backdrop paper lean in the corner beside one light stand.",
    tools: [
      "A 60cm steel rule and a snap-off cutter with fresh blades",
      "A bone folder and a dull scoring wheel for crease lines",
      "An A1 self-healing cutting mat, gridded in millimetres",
      "A kitchen scale, to weigh every box before it is posted",
      "Booked hours on a print shop's digital cutting table for the first ten of each prototype",
      "A rubber stamp and pad for short runs that do not justify printing",
      "A mirrorless camera with a 50mm lens and one strobe with a bare reflector",
    ],
    materials: [
      "Duplex board from 250 to 400 gsm, white face for print and grey back inside, for most cartons",
      "Ivory board for the few jobs that need a smooth, bright inside",
      "Brown kraft board and kraft paper bags with a paper-lined inside for coffee",
      "E-flute corrugated board for shippers that also stand as counter displays",
      "Paper tape, cotton string and water-based inks; no plastic tape and no lamination",
      "Offcuts bought by the kilo from printers on Jalan Pagarsih",
    ],
    hours:
      "Dielines in the morning while it is cool, printers and suppliers after lunch, folding prototypes in the evening. Every Friday one prototype goes into the post to a friend in Medan, Surabaya or Makassar; when it comes back he photographs it before he opens it.",
  },
  hand: {
    line:
      "Flat, bold colour on honest board, with every fold, tuck and thumb notch visible and meant to be seen. One colour per product, one very large letter, and the kraft or grey board left showing wherever print is not needed.",
    signatureMoves: [
      "One colour and one oversized single letter per variant, so a customer can ask for 'the blue one'",
      "Instructions printed on the inside of the folds, so opening the box reads the steps in order",
      "Tuck locks and slot closures only: nothing he designs needs glue to assemble",
      "The shipping box doubles as the counter display once its front panel is torn along a perforation",
    ],
    motifs: [
      "A half-moon thumb notch on every lid",
      "Dashed fold lines printed on the outside as part of the graphics",
      "A large single capital letter set off-centre on a flat colour panel",
    ],
    type:
      "One heavy geometric sans for the big letter, a plain sans-serif for everything else. Indonesian first, English small beneath; no script faces, no outlines, no shadows.",
    keptImperfections: [
      "The crushed corner from a shipping test, shown next to the clean box",
      "Grey board edges and kraft fibres at every cut",
      "Stamp ink that lands a little uneven on short runs",
      "Crease lines that soften after the box has been opened a dozen times",
    ],
  },
  palette: {
    early: ["#2d6a4f", "#f1e7c8", "#d4a373", "#264653"],
    current: ["#4b2e1f", "#e9c9a0", "#f6efe4", "#c45a2a"],
    why:
      "His first big job, the school seed kit, came out in garden greens, cream board, a soft clay brown and a deep teal that children could tell apart. Working for a coffee roaster moved him to roast browns, milky beige, a warm off-white and one burnt orange, every colour checked under the shop's own lights before it went to print.",
  },
  subjects: {
    clients:
      "Small food producers, coffee roasters, snack and spice makers, a primary school's garden club, and friends' first products that need a box before they need a logo.",
    places: [
      "Jalan Braga, once the cart road for coffee from the old warehouse, now cafés and shopfronts",
      "The highland coffee farms around Pangalengan and Ciwidey south of the city",
      "The printers and paper sellers along Jalan Pagarsih",
      "Morning market stalls where food is still wrapped in paper and leaf",
      "The lanes of Coblong and Dago between campus and home",
    ],
    returningClient:
      "Kopi Kecil, the small-batch roaster, which comes back for every new roast: one new colour, one new letter, the same bag.",
  },
  presentation: {
    camera:
      "Mirrorless camera with a 50mm lens on a tripod at table height, looking at the product from a three-quarter hero angle.",
    light:
      "One hard strobe with a bare reflector, high and to the left, giving crisp-edged shadows; no fill and no softbox.",
    surfaces:
      "Seamless coloured backdrop paper chosen to match or oppose the product colour, and plain kraft board underfoot.",
    framing:
      "Objects in small, honest stacks of two or three; the shipping-test box beside the clean one; one flat shot of the dieline from directly above.",
  },
  voice: {
    captions:
      "Eager and practical: what it holds, how many folds, where it was posted and how it arrived. 'Dikirim ke Medan, sampai utuh. Sent to Medan, arrived whole.' Indonesian first, then English.",
    neverSays: ["premium", "luxury", "eco-friendly", "zero waste", "exotic", "artisanal"],
  },
  respect: {
    exclude: [
      "Batik patterns used as decoration, especially court patterns once reserved for royalty",
      "Mosque domes, religious calligraphy and holiday gift hampers",
      "Shadow puppets, gamelan and other performance and ritual imagery",
      "Halal marks, certification seals and the national emblem drawn as graphics",
      "Woven bamboo boxes shown in communal ritual meals; only as everyday market packaging",
      "Real coffee, snack or printer brands and their logos",
      "Traditional dress on models or as packaging illustration",
    ],
    askAReader: [
      "Do customers in Bandung really ask for coffee by colour, so that one big letter and one colour per roast feels natural?",
      "Is the woven bamboo box read as everyday market packaging, or too tied to communal ritual meals to borrow from?",
      "Is Indonesian first with small English beneath the right order for a local roaster's bag, or would a Sundanese word be expected?",
    ],
  },
  sources: [
    {
      url: "https://www.fsrd.itb.ac.id/id/?p=15450",
      used: "The institute's undergraduate product design programme is the first and longest-running in the country, within a faculty dating back to 1947.",
    },
    {
      url: "https://ejurnal.ubharajaya.ac.id/index.php/kamnas/article/download/1466/1139",
      used: "Bandung joined the creative cities network as a City of Design in December 2015: background for a young designer working with small businesses.",
    },
    {
      url: "https://www.thejakartapost.com/news/2010/09/25/braga-past-and-present",
      used: "Jalan Braga was called Pedatiweg from 1830 to 1870, a cart road for coffee from the warehouse that is now City Hall; later Art Deco shops and cafés.",
    },
    {
      url: "https://specialtycoffee.id/articles/java-preanger-coffee-indonesias-historic-estate-origin/",
      used: "Java Preanger arabica grows at 1,200 to 1,700 m in the highlands around Bandung, including Ciwidey and Pangalengan.",
    },
    {
      url: "https://journals.unpad.ac.id/agricore/article/download/17860/pdf",
      used: "Pangalengan in Bandung Regency as a coffee production centre with a growing processing industry: where his roaster clients buy.",
    },
    {
      url: "https://rri.co.id/singaraja/berita-lain/1025131/mengenal-jenis-kertas-dan-fungsinya-untuk-kebutuhanmu",
      used: "Duplex board runs from about 230 to 500 gsm with a white printing face and grey back and is common for food boxes; ivory board is used for premium packs.",
    },
    {
      url: "https://ojs2.polimedia.ac.id/index.php/kreator/article/view/295",
      used: "Ivory and duplex carton are tested against the national standard for packaging board.",
    },
    {
      url: "https://repository.telkomuniversity.ac.id/pustaka/files/217321/abstraksi/perancangan-design-packaging-ayam-gepuk-pak-gembus-untuk-meningkatkan-brand-awareness-di-kota-bandung-dalam-bentuk-buku-karya-ilmiah.pdf",
      used: "Small food businesses in Bandung often rely on foam packs and neglect packaging design: the gap his clients come to him with.",
    },
    {
      url: "https://journal.umpr.ac.id/index.php/pengabdianmu/article/view/8139",
      used: "Packaging training for small producers in Cimenyan, Bandung Regency: the kind of workshop where he meets clients.",
    },
    {
      url: "https://rri.co.id/en/lifestyle/2311951/magetans-bamboo-artisans-pivot-to-eco-friendly-innovation",
      used: "Woven bamboo boxes returning as everyday packaging under single-use plastic rules: background to his no-plastic habit.",
    },
    {
      url: "https://cloutly.com/business/percetakan-sinar-pelita-bandung",
      used: "Print shops operating on Jalan Pagarsih in Astanaanyar, Bandung.",
    },
  ],
};
