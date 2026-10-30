import type { Persona } from "./types";

/** Inês Duarte, Lisbon: cut and folded paper grids that grow like plants, printed in two risograph inks. */
export const persona: Persona = {
  makerId: "ines-duarte",
  studio: {
    training:
      "Finished a degree in communication design at the fine arts faculty in Chiado three years ago, where her final project was a book that unfolded into a garden plan. Spent the year after it at a two-ink risograph studio, cleaning drums and feeding paper in exchange for press time, and stayed on as their freelance designer. She is still learning, and posts every fold test and every misprint as she goes.",
    room:
      "A shared upstairs room in a converted warehouse in Marvila, above the print studio, with tall industrial windows facing the river and a long table she shares with two illustrators. A self-healing cutting mat, a drawer of fold models in envelopes labelled by month, a flatbed scanner, and a clothes line across the window where test prints dry. At home in Arroios she folds at the kitchen table in the evenings.",
    tools: [
      "A scalpel with fine pointed blades, changed every day, and a steel rule with a cork back",
      "A bone folder and a blunt scoring tool for crisp folds on heavy paper",
      "A self-healing A2 cutting mat with a printed grid, and a metal set square",
      "Propelling pencil and a soft eraser for fold diagrams",
      "The studio's two-drum stencil duplicator, with cobalt blue and fluorescent pink drums, and a green drum borrowed for tests",
      "A flatbed scanner for every stage of a fold, scanned from above",
    ],
    materials: [
      "Uncoated off-white paper at 90 to 120gsm, the only kind the duplicator's soy-based ink will dry on",
      "Uncoated card at 250gsm for fold models and covers",
      "Offcuts and spoiled sheets from the studio's runs, kept for tests",
      "Cobalt blue and fluorescent pink ink, printed one over the other for purple",
      "Pressed leaves from Lisbon's gardens, used only as drawing reference",
    ],
    hours:
      "Designs at the warehouse table from ten, prints on the studio's machine on quiet afternoons, and folds models at home in the evenings. Every few days she posts the step she is on, with the fold numbered.",
  },
  hand: {
    line:
      "Clean scalpel cuts and scored folds on a strict square grid, each grid square opening into a leaf-like flap, so a sheet seems to grow from its centre outwards. Printed areas are flat colour with riso grain and slight misregistration at the edges.",
    signatureMoves: [
      "Starts every piece as a folded paper grid on the cutting mat before any drawing on screen",
      "Lets each grid row open a different way, so a sheet reads like a plant growing upwards",
      "Prints two inks only and lets the overprint make a third colour where they meet",
      "Includes the fold diagram as part of the finished piece, numbered step by step",
    ],
    motifs: [
      "A leaf built from a grid of cut squares, each square folded back at a slightly different angle",
      "Arcs of a fold opening, like twelve months fanning out from one point",
      "A square four-line repeat abstracted from Lisbon's patterned façade tiles",
    ],
    type:
      "A plain, slightly rounded sans-serif in lowercase for titles and a monospaced face for step numbers and fold instructions. Portuguese first, English beneath in the second ink.",
    keptImperfections: [
      "Misregistration between the two inks, and purple where they overlap by accident",
      "Riso grain and roller marks in flat areas",
      "Pencil fold lines and scoring marks left visible on models",
      "Slightly uneven cut corners where the blade turned",
    ],
  },
  palette: {
    early: ["#e76f51", "#264653", "#f4ede0", "#e9c46a"],
    current: ["#2457c5", "#f4a6b8", "#f6f1e6", "#1b1b1b"],
    why:
      "Her first commissioned piece, the school almanac, used the colours of the city she walks every day: terracotta roof tiles, the deep teal of patterned façades and a mustard from shop awnings, printed in four colours. Working at the print studio limited her to the two drums on the machine, cobalt blue and fluorescent pink, and she found she preferred it: two inks, a purple where they cross, and a black only for the small print.",
  },
  subjects: {
    clients:
      "Small print studios, schools, libraries and education projects in Lisbon: anyone who needs a printed thing that people fold, carry and keep.",
    places: [
      "The palms, cycads and glasshouse-shaded paths of the botanical garden in Príncipe Real",
      "Façades of patterned tiles in Arroios and Graça",
      "Black and white stone pavements laid in waves and grids",
      "The warehouses of Marvila along the river",
      "A school courtyard where pupils tested the almanac's fold",
    ],
    returningClient:
      "Folded Almanac, the yearly almanac for a school of three hundred pupils, which comes back each June for next year's sheet with a new way for every month to open.",
  },
  presentation: {
    camera:
      "Prints and folds scanned flat on a flatbed, or photographed from directly overhead with a 50mm lens on a copy stand; fold sequences shot one step per frame from the same height.",
    light:
      "Even, diffuse light from two sides, no shadows on flat prints; a single low side light only for folded models, to show the relief of each fold.",
    surfaces:
      "The grid of the cutting mat, or plain off-white paper; never wood, linen or props.",
    framing:
      "Top-down and centred, with the sheet square to the frame; sequences laid out as a numbered grid of steps.",
  },
  voice: {
    captions:
      "Curious and precise, often a step number and a question: 'Step 6 of 9. Does the fold hold at 120gsm? Not yet.' Portuguese first, English below.",
    neverSays: ["saudade", "quaint", "hidden gem", "artisanal", "Instagrammable", "old-world charm"],
  },
  respect: {
    exclude: [
      "Religious tile panels showing saints, the Virgin or biblical scenes; only geometric or plant-pattern tiles are abstracted",
      "June saints' festival imagery: saint figures, altars and street processions",
      "Caravels, navigators, armillary spheres and the cross of the old military order associated with the age of overseas expansion",
      "Exact copies of a real façade's tile pattern traced from a named building; repeats are reduced to her own four lines",
      "Church façades, chapels and processional images",
      "The national flag and its coat of arms",
      "Real tile factories' marks and real print studios' logos",
      "Fado singers and shawls as a mood picture",
    ],
    askAReader: [
      "Is abstracting façade-tile repeats acceptable, or are some patterns so tied to particular buildings that a Lisbon reader would see them as copied?",
      "Is Marvila a plausible place for an emerging designer to share a room above a small print studio, or has it become too expensive?",
      "Do the Portuguese captions and step instructions read naturally to a Lisbon reader?",
    ],
  },
  sources: [
    {
      url: "https://en.wikipedia.org/wiki/Risograph",
      used: "Stencil duplicators burn a master wrapped round an ink drum; one drum per colour, two-drum models print two colours in a pass; soy-based ink; uncoated paper only.",
    },
    {
      url: "https://www.dges.gov.pt/guias/pdfs/statce/col25f1/ec25_15029070.pdf",
      used: "Communication design is taught as a degree at the University of Lisbon's fine arts faculty, with most entrants from the visual arts track.",
    },
    {
      url: "https://www.portugal.com/location/hidden-in-plain-sight-lisbons-botanical-garden/",
      used: "The botanical garden in Príncipe Real, known for palms and cycads collected from many continents.",
    },
    {
      url: "https://aviewoncities.com/lisbon/botanical-garden",
      used: "The garden's planting began in the 1870s; not to be confused with the older Ajuda garden.",
    },
    {
      url: "https://www.theportugalnews.com/news/2021-04-30/calcada-a-dangerous-art/59610",
      used: "Lisbon's stone pavements in black basalt or limestone and white limestone, laid in zig-zags and waves, with a city school for pavers since 1986.",
    },
    {
      url: "https://repositorio.lnec.pt/handle/123456789/1007961",
      used: "Pattern tiles for building façades made semi-industrially in Lisbon from the 1840s, often in many repeating patterns on one building.",
    },
    {
      url: "https://fontsinuse.com/uses/74741/tertulias-graficas-edition-019-joa-o-queiro-s",
      used: "Lisbon design studios running their own risograph labs near the river.",
    },
  ],
};
