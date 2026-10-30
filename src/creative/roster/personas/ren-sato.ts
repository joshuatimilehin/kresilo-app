import type { Persona } from "./types";

/** Ren Sato, Kyoto: small identity systems built from one compass circle, water lines and empty space. */
export const persona: Persona = {
  makerId: "ren-sato",
  studio: {
    training:
      "Studied visual design at a Kyoto design and technology university, where first-year drafting was done with ruling pens and compasses before any screen. Then spent seven years in the design room of a label and packaging printer in the south of the city that printed boxes and inserts for the old medicine houses around Nijō Street, learning that a dose line has to be read correctly by someone half asleep. Went independent at thirty-three and kept the printer's habit of proofing every mark at actual size.",
    room:
      "A desk in a shared office on the third floor of a plain concrete building near Demachiyanagi, where the Kamo and Takano rivers meet. One window over the river delta and its line of stepping stones, a drafting table with a parallel rule, a lightbox, a plan chest of circles on tracing film sorted by project, and a second screen for vectors. Nothing is pinned to the walls.",
    tools: [
      "A drafting compass with a ruling-pen insert (karasuguchi), its blade gap set by a screw for a constant line",
      "A beam compass for circles larger than the drafting table can hold",
      "Technical pens in 0.1, 0.3 and 0.5mm, and a parallel rule on the drafting table",
      "A lightbox for tracing forty circles on top of each other to choose one",
      "A vector app for final artwork, with every circle set from a measured radius, never drawn freehand",
      "A rubber-stamp maker for crate and bag stamps, proofed on kraft",
      "A motion app for short loops, on a separate desk from identity work",
    ],
    materials: [
      "Smooth, hard-sized drafting paper and matte tracing film for circles",
      "Technical drawing ink, black only; colour is added in the vector file",
      "Printed tide tables from the national weather agency for the harbour each mark belongs to",
      "Kraft and uncoated off-white stock for labels, bags and letterheads",
      "Two-colour proofs from the old printer, which still runs small jobs for Ren",
    ],
    hours:
      "Draws circles from eight until noon while the hand is steadiest, one project at a time, forty attempts at most in a sitting. Afternoons are for vectors, rulebooks and testing labels at arm's length. Friday evenings are for a four-second loop for a friend's record shop.",
  },
  hand: {
    line:
      "A single compass-drawn circle at a constant line weight, with no taper and no lift; a waterline drawn as one thin straight stroke across it, set at a height taken from a real tide reading. Most of the frame is left empty.",
    signatureMoves: [
      "One circle per identity, drawn by compass many times until one is kept, then never redrawn",
      "Places the waterline inside the circle at a height measured from the client's own tide table or timetable",
      "Lays every page out symmetrically about a vertical centre line",
      "Makes the most important fact (a dose, a time, a name) the largest thing on the page, and only that",
    ],
    motifs: [
      "The circle with a single waterline, which moves up or down between applications",
      "A row of small dots crossing two thin horizontal lines, after the river's stepping stones",
      "Three equal thin parallel water lines under a word, never a wave",
    ],
    type:
      "Japanese set in a plain gothic at one weight, English in a quiet grotesque with wide tracking, both centred. Numerals larger than words; nothing italic, nothing ornamental. Addresses written Kyoto-style, by the two streets that cross.",
    keptImperfections: [
      "The compass pinhole at the centre of each circle, left visible in scans",
      "A hairline overlap where the ruling-pen stroke meets its own start",
      "Faint pencil construction lines on the kept sheet",
      "Stamp ink pooling unevenly on kraft",
    ],
  },
  palette: {
    early: ["#f4f1ea", "#2b4a6f", "#d9a441", "#8aa7a0"],
    current: ["#1d3a5f", "#e8d3b0", "#f4efe6", "#3f7f93"],
    why:
      "The pharmacy labels needed one colour per time of day on a pale ground: a steady blue, a morning gold and a sage for night. Working with a fishing co-operative on the coast moved Ren to the colours of the harbour itself: a deep indigo for water at depth, a sea-glass blue for the shallows, and a sand that matches the crates. The work now uses two colours at most, indigo and sand on off-white.",
  },
  subjects: {
    clients:
      "Small organisations with plain, everyday needs: a fishers' co-operative, a neighbourhood pharmacy, a record shop, a clinic or a ward office; anyone who needs a mark to work on a stamp, a crate, a sign and a bag.",
    places: [
      "The Kamo river delta at Demachiyanagi and its stepping stones",
      "The grid of Kyoto's numbered and named streets, seen from above on a map",
      "Old medicine houses along Nijō Street",
      "A small fishing harbour on the Tango coast in the north of the prefecture",
      "A record shop counter on a Friday night",
    ],
    returningClient:
      "Kaigan Records, a friend's small record shop, which gets a new four-second loop from Ren every Friday for its whole-album listening nights.",
  },
  presentation: {
    camera:
      "Flat artwork exported straight from vector files; applied pieces (crates, bags, signs) photographed square-on with a 50mm lens on a tripod, the camera level with the centre of the mark.",
    light:
      "Even, shadowless overcast light; no texture, no gradients, no glare on any surface.",
    surfaces:
      "Off-white paper, raw wooden crate boards and plain kraft, each filling the frame with no props.",
    framing:
      "Strictly symmetrical, the mark on the vertical centre line, at least two-thirds of the frame left empty; a set laid in one row with equal gaps.",
  },
  voice: {
    captions:
      "Quiet and exact: the measurement first, then the object. 'Radius 21mm. Waterline at the spring low tide.' Japanese first, English below, no adjectives.",
    neverSays: ["zen", "minimalist", "harmony", "timeless", "Japanese aesthetic", "ma"],
  },
  respect: {
    exclude: [
      "No brushed or hand-drawn ink circles and no ensō: every circle is compass-drawn at constant weight, never a Zen brush loop",
      "No single red disc centred on white and no radiating sun rays, which read as the national flag",
      "No tomoe swirls or real family crests (kamon); the circle-and-waterline is Ren's own and copies no known crest",
      "Shrine gates, temple roofs, Buddhist or Shinto imagery and the characters of the summer mountain bonfires",
      "Geisha, maiko and kimono-clad figures from the Gion district",
      "Rising-sun naval patterns on boats or flags in harbour pictures",
      "Real pharmacy, pharmaceutical or record-label names and logos",
      "Real tide-table logos or government marks on any printed piece",
    ],
    askAReader: [
      "Does a circle with a waterline read as a harbour mark, or too much like a known crest or a sun on the horizon?",
      "Is it plausible for a Kyoto city designer to take a client from a fishing harbour on the Tango coast, about two hours north?",
      "Do Kyoto-style crossing-street addresses in captions feel natural, or like a tourist's detail?",
    ],
  },
  sources: [
    {
      url: "https://art-design-glossary.musabi.ac.jp/?p=658",
      used: "The ruling pen (karasuguchi, 'crow's beak'): two blades holding ink, line width set by a screw; a ruling-pen compass draws circles.",
    },
    {
      url: "https://www.english.metro.tokyo.lg.jp/documents/d/english/about_tokyo_documents_11_the-art-of-kamon-pdf",
      used: "Family crests drawn with a bamboo compass and brush from perfect circles and straight lines: why Ren's mark must copy no crest.",
    },
    {
      url: "https://www.data.jma.go.jp/kaiyou/db/tide/suisan/suisan.php?stn=MZ",
      used: "The national weather agency publishes daily high and low tide times and heights in centimetres for Maizuru on the Kyoto coast.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Ine,_Kyoto",
      used: "Small fishing harbours at the end of the Tango peninsula in the north of Kyoto Prefecture.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Nij%C5%8D_Street",
      used: "Nijō Street as a drugstore district since the Edo period, with some businesses still there.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Kamo_River",
      used: "Walkways and stepping stones across the Kamo, and the Demachi area where it joins the Takano.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Kawaramachi_Avenue",
      used: "Kyoto's grid of named streets, with crossings such as Shijō Kawaramachi used as place names.",
    },
    {
      url: "https://www.kyoto-seika.ac.jp/eng/about/overview/history.html",
      used: "Visual design and visual communication courses in Kyoto's design schools.",
    },
  ],
};
