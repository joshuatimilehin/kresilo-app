import type { Persona } from "./types";

/** Neema Waweru, Nairobi: photo editing as layered sets, cut down to their centre and sequenced with the people in them. */
export const persona: Persona = {
  makerId: "neema-waweru",
  studio: {
    training:
      "Started at twenty as the assistant on a weekly magazine's picture desk, culling a thousand frames a night down to twelve and toning them for print. Took an evening certificate in photography and image editing at a creative media college in the city, but learned sequencing from the desk's picture editor, who made her pin small prints on the wall and move them until they read. She has edited on her own for nine years.",
    room:
      "A shared studio on the fourth floor of an older building off Ngong Road, with a window looking north to the towers of the city centre. Her corner has a light table with a loupe on it, a wall of small work prints pinned in rows, an A3 flatbed scanner, a calibrated monitor, and a cutting mat with a jar of scissors. When the rains come the roof above the stairwell is iron sheet, and she can hear it from her desk.",
    tools: [
      "A light table and an 8x loupe for checking prints and contact sheets",
      "A small inkjet printer for matte work prints at contact-sheet size",
      "An image editor's crop, curves and layer masks, used for tone and crop only",
      "A calibrated monitor and a colorimeter, run every fortnight",
      "An A3 flatbed scanner for scanning finished collages at 600 dpi",
      "Scissors, a scalpel, a glue stick and low-tack tape",
      "A printed change-log pad, one sheet per portrait, signed by the sitter",
    ],
    materials: [
      "Matte inkjet work prints, cut up freely because they are cheap to reprint",
      "Photocopies of her own photographs, enlarged until the halftone dots show",
      "Coloured poster paper and sugar paper from stationers in town, torn rather than cut",
      "Warm-white cartridge paper as the base for every collage",
      "Numbered paper tabs for the sequence on the wall",
    ],
    hours:
      "Edits on screen in the morning while the light is even, goes out to markets and meetings after lunch, and sequences at the light table in the evening. Saturdays are for the market: edits are shown to the traders on her phone and on prints, beside the stall, before anything is final.",
  },
  hand: {
    line:
      "Cuts every photograph down to its centre, then lets it sit off-centre on a field of colour. Prints are layered with small cast shadows between them, edges are scissor-clean on photographs and torn on coloured paper, and edited figures become bold, flat shapes that fill their page to the edge.",
    signatureMoves: [
      "The first cut and the last cut shown side by side, every time",
      "A sequence pinned as a row of small prints with numbered tabs before anything is laid out",
      "One figure per page, filling it to the edge",
      "Every portrait paired with a short note of what was and was not changed, agreed with the sitter",
    ],
    motifs: [
      "A torn strip of terracotta or teal paper behind a cut photograph",
      "Enlarged halftone dots from a photocopied print",
      "The ridged lines of an iron-sheet roof used as a background band",
    ],
    type:
      "Titles cut from paper in a heavy condensed sans and scanned; sequence numbers handwritten on small paper tabs; Swahili and English side by side at the same size.",
    keptImperfections: [
      "Glue wrinkles and tape at the edges of a layer",
      "Small cast shadows where prints lift off the base",
      "Scissor steps on a curved cut",
      "A fingerprint of ink from the photocopier on a margin",
    ],
  },
  palette: {
    early: ["#e76f51", "#f4a261", "#264653", "#f7f3ea"],
    current: ["#7a1f3d", "#f4a259", "#f6f0e6", "#264653"],
    why:
      "The market portraits took their terracotta, orange and deep teal from the stalls themselves, on a plain warm white. Working on the illustrated essay deepened the red to a berry she found in painted shop shutters and in the fruit crates at closing time; the teal stayed as the one constant across all her sets.",
  },
  subjects: {
    clients:
      "Traders' co-operatives, magazines, musicians' first album covers, a volunteer film club, and her own illustrated essays.",
    places: [
      "A Saturday market and its traders' stalls",
      "Matatu stages in the city centre, painted buses and their rain-streaked windows",
      "Luthuli Avenue's crowded shopfronts between Tom Mboya Street and River Road",
      "Iron-sheet roofs in the rain, seen from her building's stairwell",
      "The city-centre towers from her studio window on Ngong Road",
    ],
    returningClient:
      "Garden Row Traders, the market co-operative, which asks her back each year to photograph and edit portraits of its new members with them beside her.",
  },
  presentation: {
    camera:
      "Collages scanned flat on the A3 flatbed at 600 dpi so layer shadows and paper texture show; process shots from directly above the light table on a phone.",
    light:
      "Scanner light for finished work; for process shots, the light table glowing from below and window daylight from the side.",
    surfaces: "Warm-white cartridge paper, the light table, and the wall of pinned work prints.",
    framing:
      "Off-centre, crowded compositions; first cut and last cut at equal size side by side; sequences shown as a full row of numbered prints.",
  },
  voice: {
    captions:
      "Lively and generous: who is in the picture, by first name and with their approval, what was cut and why. Swahili and English together, with thanks to everyone who helped.",
    neverSays: ["slum", "poverty", "authentic Africa", "safari", "flawless skin", "transformation"],
  },
  respect: {
    exclude: [
      "Maasai and other community dress, beadwork and red checked cloth used as decoration",
      "Religious figures and verses, including those painted on matatus",
      "Real public figures, musicians, athletes and politicians",
      "Wildlife, safari and poverty imagery as shorthand for Nairobi",
      "The national flag and coat of arms",
      "Kanga sayings copied word for word from real cloth",
      "Children's faces without a guardian's consent",
    ],
    askAReader: [
      "Does a route from a magazine picture desk to independent editing ring true for Nairobi today?",
      "Are kangas fine to keep in her market sticker pack as plain cloth, or do their printed sayings need more care?",
      "Is Swahili and English side by side the natural choice for captions, or would Sheng read as more like her?",
    ],
  },
  sources: [
    {
      url: "https://www.howwemadeitinafrica.com/nairobis-famed-matatu-graffiti-is-back-and-putting-artists-in-business/47509/",
      used: "Matatu painting returned after a ban and now employs artists; designs include pop stars, athletes, politicians and religious figures (kept out).",
    },
    {
      url: "https://hackingfromthesouth.mit.edu/portfolio/matatu",
      used: "Matatus as a form of everyday self-expression in Nairobi.",
    },
    {
      url: "https://meteo.go.ke/sites/default/files/forecast/seasonal-forecast/SEASONAL%20WEATHER%20FORECAST%20FOR%20MARCH%2C%20APRIL%2C%20MAY%20%28MAM%29%202024_0.pdf",
      used: "March to May long rains and October to December short rains, with Nairobi among the higher-rainfall highland areas.",
    },
    {
      url: "https://bestcareservices.co.ke/what-are-the-best-roofing-materials-for-nairobis-rainy-season/",
      used: "Corrugated galvanised iron sheet is the common budget roof in Nairobi and loud in the rain.",
    },
    {
      url: "https://thekenyatimes.com/latest-kenya-times-news/luthuli-avenue-nairobi/",
      used: "Luthuli Avenue runs from Tom Mboya Street to River Road and is a busy electronics and phone-trading street.",
    },
    {
      url: "https://creativesgarage.org/empowering-refugee-creatives",
      used: "Nairobi photography courses covering image editing basics: cropping, colour balance and blemish correction.",
    },
    {
      url: "https://photo.journalism.cuny.edu/?p=406",
      used: "Sequencing works on narrative and graphic levels at once, moving tight to wide and left- to right-facing; consistent naming and captions.",
    },
    {
      url: "https://www.blind-magazine.com/?p=21571199",
      used: "The contact sheet as a thinking tool for weighing frames and finding the rhythm of one image against the next.",
    },
    {
      url: "https://taxnews.ey.com/news/2025-2192-kenya-data-protection-commissioner-reiterates-employers-must-secure-employees-explicit-consent-to-use-their-images-commercially",
      used: "Kenya's data protection law requires express, specific consent to use a person's photograph commercially: background for her signed change notes.",
    },
  ],
};
