import type { Persona } from "./types";

export const persona: Persona = {
  makerId: "tahmid-sarkar",
  studio: {
    training:
      "Grew up two lanes from a rickshaw-body workshop in Old Dhaka and, from about twelve, swept up and filled in background colour for the painter there, the way apprentices start on seat backs and small panels. Later studied graphic design at the city's fine-art faculty, where he learned to scan, separate and print; he still treats the faculty's printmaking room as the place he learned that a riso drum is just another tin of paint.",
    room:
      "A rented roof room in Kathalbagan with a rolling shutter that opens onto the roof, a plywood table under a fluorescent tube, tin sheets drying on a line of nails along the parapet, and a borrowed flatbed scanner on a shelf away from the paint fumes. Paint tins are stacked by colour on the floor under the table.",
    tools: [
      "Flat and round sign-writing brushes, plus a long-haired liner for outlines, cleaned in kerosene",
      "A steel ruler, a chalk line and a tea saucer used as the curve template for every round shape",
      "Paper stencils pounced with chalk to repeat letters on site",
      "A tin snip and a hammer to flatten and trim sheet from opened oil drums",
      "A flatbed scanner and a laptop for redrawing paintings as vectors",
      "Access to a two-drum risograph at a print shop near the university",
    ],
    materials: [
      "Gloss enamel house-and-sign paint in small tins, chosen by painters for lasting, being cheap and staying bright",
      "Flattened tin sheet from cooking-oil drums, primed white before painting",
      "Plywood offcuts for stall signs",
      "Thinner and kerosene",
      "Risograph inks in fluorescent pink, yellow, blue and black",
    ],
    hours:
      "Paints from mid-morning, when the roof is bright but enamel still flows, to mid-afternoon; letters and scans after dark when it is cooler. Stall signs are painted on site in the early morning before the tea queues start.",
  },
  hand: {
    line:
      "One confident, unbroken brush stroke per edge, pulled fast so the end of the stroke thins and lifts. Every shape is closed with a thick black outline, then a second, thin white outline inside it.",
    signatureMoves: [
      "Double outline on every letter and figure: black outside, thin white inside, so colour never touches black.",
      "A drop shadow always falling down and to the right, in a muddy maroon he mixes from the dregs of old tins, so it never matches exactly from job to job.",
      "Corners of every panel filled with a quarter-sun fan of rays drawn with the saucer and a ruler.",
      "Animals doing human jobs: a crow pouring tea, a cat reading the price board.",
    ],
    motifs: [
      "A round-bellied kettle with three curling steam lines",
      "A crow in round sunglasses, his stand-in for himself",
      "A scalloped border copied from the edge of a rickshaw hood",
    ],
    type:
      "Fat, compressed Bangla letters whose headstroke (matra) runs as one continuous bar across the whole word, with Latin capitals beside them given a matching top bar so both scripts hang from the same line. All lettering painted, never typeset, then scanned.",
    keptImperfections: [
      "Enamel drips under the bottom of a letter",
      "A brush hair stuck in the gloss",
      "The oil-drum's old printed lettering ghosting through the white primer at the edges",
      "Nail holes and chipped corners where a sheet was hung",
      "Riso misregistration of a millimetre or two between pink and black",
    ],
  },
  palette: {
    early: ["#ff4f9a", "#00a6c8", "#ffe14d", "#2b1b3d"],
    current: ["#e2231a", "#0f8a5f", "#f9c80e", "#1a1aa6"],
    why:
      "His first posters were planned for the risograph, so he painted in colours the fluorescent pink, blue and yellow drums could match, with a dark plum for black. Once he started painting signs that stand in the sun all day, he moved to the red, green, yellow and blue enamels that the old rickshaw painters used and that keep their colour outdoors; red now leads every job.",
  },
  subjects: {
    clients:
      "Tea stalls, small food counters, volunteer film and music clubs, neighbourhood shops that want a hand-painted sign, and visitors who buy painted tin panels as artwork.",
    places: [
      "The rickshaw-body workshops in the lanes of Old Dhaka",
      "Bangshal Street, now mostly motorbike parts, where he buys snips and rivets",
      "Bus stops and markets in Mohammadpur",
      "Rooftops in Kathalbagan",
    ],
    returningClient:
      "Lal Cha Corner, the tea-stall owner in Mohammadpur: Tahmid repaints the price boards every season and adds a stall each time the business grows.",
  },
  presentation: {
    camera:
      "An old phone held close, at the panel's own height; the sharpest shots come from the scanner, which he uses for flat records.",
    light:
      "Hard midday sun on the roof or the street, with sharp shadows from the panel's edge and the gloss throwing back a hot white highlight.",
    surfaces:
      "Painted tin propped against a rolling shutter, a parapet or a stall counter, with tins of enamel and a brush jar at the foot.",
    framing:
      "Tight crops that cut into the panel so brush strokes, drips and the drop shadow fill the frame; when the whole sign is shown, the street behind is thrown out of focus.",
  },
  voice: {
    captions:
      "Fast and joking, Bangla and English mixed in the same line, often a pun on the client's name, always says how long it took to dry. \"Kettle number six. Two coats, one cat, dry before the evening jam.\"",
    neverSays: ["vintage", "kitsch", "dying art", "folk", "naive", "exotic"],
  },
  respect: {
    exclude: [
      "Mosques, devotional text and other religious imagery that appears on some rickshaw panels",
      "Political leaders, party symbols, flags and scenes from the 1971 war",
      "Real film stars or any real person's face",
      "Any text in Arabic script",
      "Real shop, brand or company names on signs",
    ],
    askAReader: [
      "Does the matra-as-one-bar lettering read as good, legible Bangla sign writing, or would a Dhaka sign painter find it wrong?",
      "Are animal characters in human roles still read as playful and neutral, or do they carry political meaning a reader would notice?",
      "Is a painter calling himself an apprentice of a rickshaw workshop plausible for someone who also studied graphic design?",
    ],
  },
  sources: [
    {
      url: "https://ich.unesco.org/en/RL/rickshaws-and-rickshaw-painting-in-dhaka-01589",
      used: "Rickshaw painting taught in workshops orally and by hands-on practice, painters working on commission and passing skills to relatives, painters being men and women, and the range of motifs (flowers, birds, animals, scenes, text).",
    },
    {
      url: "https://www.thedailystar.net/node/1301644",
      used: "Enamel paint chosen for longevity, affordability and brightness; a panel taking hours to days; red as the dominant colour with orange, blue, green, white and yellow; animals in human roles; hand-painted fees compared with cheaper digital prints.",
    },
    {
      url: "https://www.pilotguides.com/?p=11835",
      used: "Recycled tin from cooking-oil drums as the panel; enamel paints; painters learning on the job in the rickshaw maker's workshop, starting young on upholstery and small sections.",
    },
    {
      url: "https://adventure.com/bangladesh-dhaka-rickshaw-artists/",
      used: "Hot pink common in Dhaka; workshops in Old Dhaka lanes and courtyards; painters moving to tourist commissions and sign painting, which is still in demand.",
    },
    {
      url: "https://csmonitor.com/layout/set/amphtml/The-Culture/2024/0606/bangladesh-dhaka-rickshaws-art",
      used: "Digital prints replacing hand painting because they are cheaper and faster, and painters selling tin panels as standalone artwork.",
    },
    {
      url: "https://www.kathmanduandbeyond.com/?p=5225",
      used: "Bangshal Street now selling mostly motorbike parts rather than building rickshaws.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Faculty_of_Fine_Arts,_University_of_Dhaka",
      used: "Dhaka's fine-art faculty with graphic design and printmaking departments.",
    },
    {
      url: "https://learn.microsoft.com/es-es/typography/script-development/bengali",
      used: "Structure of Bengali script for the lettering notes: half forms and the reph above the base consonant.",
    },
  ],
};
