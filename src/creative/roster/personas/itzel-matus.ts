import type { Persona } from "./types";

/** Itzel Matus, Oaxaca de Juárez: painted pattern for wood, clay and the brands around them. */
export const persona: Persona = {
  makerId: "itzel-matus",
  studio: {
    training:
      "Grew up painting the backs of copal animals at a cousin's workshop in the valley south of the city, where the carving and the painting are separate jobs and the painting bench was where she was put. Studied graphic design in Oaxaca de Juárez, then spent two years as the painter for a carving family before taking her first brand job, so she learned pattern on the wood before she learned it on a screen.",
    room:
      "A ground-floor room off a shared courtyard in Jalatlaco: a pine worktable under a north-facing doorway, a shelf of unpainted copal blanks drying for months before they take paint, a scanner on a plastic stool, and a stack of pine offcuts she tests every new pattern on. Oilcloth from the market covers the table and is replaced when the paint crust gets too thick to wipe.",
    tools: [
      "One No. 4 round sable-mix brush for everything, plus a worn No. 1 for dots",
      "Cut-down toothpicks and the blunt end of a brush for single dots",
      "Muffin tin and jam-jar lids as palettes",
      "Sandpaper in 120 and 220 grit for prepping copal and pine",
      "Flatbed scanner, scans at 1200 dpi, cleaned but never redrawn",
      "Kitchen scale and spoons for mixing house paint to repeatable colours",
    ],
    materials: [
      "Copal (Bursera glabrifolia) blanks from carving families, dried slowly before painting",
      "Water-based acrylic house paint in litre tins, mixed to six house colours",
      "Gouache for paper studies",
      "Cochineal, añil (indigo) and pericón (yellow) colour for her early natural-pigment work",
      "Burnished and matte black clay pieces from a family workshop in San Bartolo Coyotepec",
      "Pine offcuts for test strips; recycled kraft for printed sleeves",
    ],
    hours:
      "Paints from seven until the courtyard light turns yellow, around two; afternoons are for scanning, client calls and the drive to the clay workshop on Thursdays.",
  },
  hand: {
    line:
      "One loaded round brush per stroke, never reloaded mid-mark: a dot starts fat and wet, a dash tapers, a zigzag thins as the paint runs out. Edges are soft where the brush lifts and hard where it lands.",
    signatureMoves: [
      "Builds every pattern from only three marks, a dot, a short dash and a zigzag, then rearranges them",
      "Paints a full-size test strip on pine before any pattern goes to a client",
      "Rows follow the form of the object (the curve of a fox's back, the belly of a jug) rather than a flat grid",
      "Leaves a thin band of unpainted wood or bare clay between pattern families",
    ],
    motifs: [
      "The dot-dash-zigzag border, always in that order",
      "A small fox seen in profile, tail curled forward",
      "A four-petal rosette made from four dashes around a dot",
    ],
    type: "Painted wordmarks only, lowercase, drawn in one pass with the same round brush and kept as they dried; secondary text set in a plain grotesque so the painted mark is the only voice.",
    keptImperfections: [
      "The dry-brush tail at the end of each zigzag",
      "Dots that touch where the paint pooled",
      "Wood grain showing through the first coat on copal",
    ],
  },
  palette: {
    early: ["#a3283a", "#2d3a6b", "#d9a62e", "#ece4d6"],
    current: ["#e8418c", "#18a999", "#f5b324", "#2b2522"],
    why: "Her first patterns used cochineal reds, indigo and pericón yellow the way the valley painters did, on a lime-white ground. When shops started reordering the same pattern month after month she switched to mixed house paint that matches between batches and holds up in sunlight, and the colours went hotter: pink, turquoise and marigold on near-black.",
  },
  subjects: {
    clients:
      "Toy and homeware shops, carving and pottery families selling outside the valley, cafés buying tableware, and small food brands in Oaxaca and Mexico City.",
    places: [
      "Jalatlaco's cobbled streets and courtyard shops",
      "San Bartolo Coyotepec and its craft market",
      "Valley carving villages: San Martín Tilcajete, San Antonio Arrazola",
      "Oilcloth stalls in the city markets",
    ],
    returningClient:
      "Taller Barro Quieto, the black-clay workshop, comes back every season for a new sleeve shape and a new pattern taken from the burnishing lines.",
  },
  presentation: {
    camera:
      "A second-hand mirrorless camera with a 60mm macro on a copy stand for flat work, handheld at chest height for objects.",
    light: "Soft north-doorway daylight in the morning, no flash, one white card bounced from the left.",
    surfaces:
      "A slab of burnished black clay, the paint-crusted oilcloth, or bare pine. Never a white sweep.",
    framing:
      "Straight-on and centred, close enough that the brush texture reads, object filling two thirds of the frame; patterns shot dead flat and square.",
  },
  voice: {
    captions:
      "Short, bright and exact, in Spanish first then English: what the marks are, who carved or shaped the piece, how long the paint took. Credits the carver or potter by role in every caption.",
    neverSays: ["\"Ancient\" or \"timeless\"", "\"Spirit animal\" or \"mystical\"", "\"Authentic Zapotec\" or claims about a community's meaning"],
  },
  respect: {
    exclude: [
      "Day of the Dead imagery: skulls, skeletons, marigold arches, papel picado, the mural themes common on Jalatlaco walls",
      "Altars, churches, saints and the city's religious processions",
      "Zapotec cosmology and nahual or spirit-animal framing for carved animals",
      "Stepped fretwork from archaeological sites",
      "Festival dance dress and community-specific huipil or embroidery patterns",
    ],
    askAReader: [
      "Does the dot-dash-zigzag system read as her own, or too close to a specific carving family's signature painting?",
      "Is it right that the clay workshop's card names who shaped and who burnished each piece, or would a family prefer one name?",
      "Do the hot pink and turquoise read as contemporary Oaxaca, or as a tourist cliché?",
    ],
  },
  sources: [
    {
      url: "https://www.mexican-folk-art-guide.com/?p=183",
      used: "Copal wood (Bursera glabrifolia), machete and knife carving, weeks of drying, freezing to kill larvae, the move from aniline dyes to acrylics, the carving towns, and that carving and painting are often separate jobs within a family.",
    },
    {
      url: "https://remezcla.com/features/film/coco-alebrije-workshop-oaxaca/",
      used: "Long drying of copal before painting, hand painting taking weeks, natural reds, oranges and indigos made from pomegranate, lemon, flowers and seeds; the cosmology framing noted as an exclusion.",
    },
    {
      url: "https://harvardartmuseums.org/article/a-colorful-tradition",
      used: "Oaxacan natural colourants: cochineal red, añil blue, pericón yellow, huizache-pod black, and mordanting; basis for her early palette.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Barro_negro_pottery",
      used: "Black clay from San Bartolo Coyotepec: hand-spun plates instead of wheels, slow drying, quartz-stone burnishing when nearly dry, 700 to 800 °C wood firing, shiny burnished versus grey matte, and the town's craft market.",
    },
    {
      url: "https://www.civitatis.com/en/oaxaca/jalatlaco-free-tour/",
      used: "Jalatlaco's cobbled streets, cafés and working print and painting studios; most facade murals there follow Day of the Dead themes, hence the exclusion.",
    },
  ],
};
