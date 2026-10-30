import type { Persona } from "./types";

export const persona: Persona = {
  makerId: "nanami-hiraoka",
  studio: {
    training:
      "Studied in the Department of Design at the city's municipal art college, then spent eight years at a Kanazawa commercial printer setting labels, box wraps and shop cards. Evening brush classes taught her to grind her own ink; she went independent at thirty-one and still thinks like a printer about what survives at coin size.",
    room:
      "The upstairs room of a narrow wooden townhouse in the Kazuemachi lanes along the Asano River. One north window over the lane, a low cedar worktable with a felt underlay, a flat file of shallow drawers holding test marks sorted by season, and a flatbed scanner on a side desk away from the water.",
    tools: [
      "Natural-stone suzuri with a flat grinding land (riku) and a deep well (umi)",
      "Two ink sticks: a pine-soot stick for blue-black loops and an oil-soot stick for warm black washes",
      "Kumano-made brushes: a large goat-hair brush for loops and washes, a fine weasel-hair brush for small fills",
      "Brass bunchin paperweight and a thick felt shitajiki",
      "Small ceramic water dropper, adding water a few drops at a time",
      "Flatbed scanner run at 1200 dpi, and a vector tracer set to keep rough edges",
      "Hand-cut rubber stamps and a pad of persimmon-red ink for counter stamping",
    ],
    materials: [
      "Futamata washi from the mountains on Kanazawa's edge, kozo and gampi sheets with deckled edges, bought through a city craft shop",
      "Machine-made hanshi practice paper for the two hundred loops before the kept one",
      "Ground sumi only, never bottled ink, so scans and washi sleeves survive damp backing",
      "Offcuts of the stiff, burnished washi used between gold-leaf sheets in the city's leaf workshops, kept as blotters",
      "Two colours of washi for letterpress sleeves, chosen at the printer, never coated stock",
    ],
    hours:
      "Grinds ink for fifteen minutes at eight, only what the day needs because the glue in the stick sours overnight. Brushes until noon while the north light is steady, vectorises and sets type in the afternoon, washes the stone and hangs brushes by their loops before six.",
  },
  hand: {
    line:
      "One loaded stroke per mark, fast at the start and slowing as the brush empties, so every loop thins and breaks into dry-brush streaks where it nearly meets itself. The ink feathers a hair's width into the washi fibres on the wet side of each stroke.",
    signatureMoves: [
      "A small square garden window drawn in four straight brush strokes, its top-right corner left open where the brush lifts",
      "One small seasonal object seen through the window, slightly below centre, never touching the frame",
      "Every mark printed at fifteen millimetres before it is approved, and redrawn if the gap fills in",
      "Washes laid as one horizontal band across a sleeve or menu, never a full flood of colour",
    ],
    motifs: [
      "The open-cornered garden window with its lift gap",
      "Snow-rope cones: fans of thin straight lines from a single top point, after the ropes tied over garden pines each November",
      "A single leaf or fruit of the season: pine needle, camellia, ginkgo leaf, persimmon",
    ],
    type:
      "Shop names brushed in kana and simple kanji, two or three characters at most, then paired with a small, wide-tracked sans-serif in English and numerals set in grey. Prices and months are brushed, never typed.",
    keptImperfections: [
      "Dry-brush break where the loop runs out of ink",
      "Ink feathering into washi fibres along one edge of a stroke",
      "Deckled paper edges left in scans and on the printed menu",
      "A slight lean in the loop from her right-handed wrist",
    ],
  },
  palette: {
    early: ["#f7f5f0", "#111111", "#7d7d7a", "#3d4f6b"],
    current: ["#f1ece0", "#26231f", "#6f7f4e", "#b4523a"],
    why:
      "At the printer she worked in process black, cool grey and a printer's navy on bright white stock. Grinding pine-soot ink on unbleached washi warmed her blacks and creamed her whites, and the tea-house seasons brought in moss and persimmon. Her colours now come from what grows in the garden that month.",
  },
  subjects: {
    clients:
      "Small food and hospitality businesses: tea houses, bean-paste confectioners, a counter fish restaurant, a rice cracker shop, a guesthouse that wanted its menu rewritten every season.",
    places: [
      "Kazuemachi lanes and the stone stairs down to the Asano River",
      "Omicho Market at seven, for the stalls' handwritten price cards",
      "The lattice shopfronts of Higashi Chaya, seen from the street",
      "Garden pines in their snow ropes from November to March",
      "The craft shops selling Futamata washi and paper umbrellas",
    ],
    returningClient:
      "Yonaga Sweets, a two-counter confectioner near the fish market, which comes back every October to approve the next twelve washi sleeves.",
  },
  presentation: {
    camera:
      "Full-frame camera on a copy stand pointing straight down, 60mm macro lens, ISO 100; flat art is scanned, objects are photographed. No angles, no hands.",
    light:
      "Overcast north-window daylight only, from the left, with a white card on the right to lift the shadow. No flash, no lamps, matte and low contrast.",
    surfaces:
      "A sheet of unbleached washi or a pale cedar board, both with visible grain. Never marble, linen or props.",
    framing:
      "One object, centred, with at least half the frame left empty. Deckled edges always visible; a set is laid in a single row with equal gaps.",
  },
  voice: {
    captions:
      "Short, seasonal and factual: the month first, then the paper and ink. 'November. Persimmon wash on kozo.' Japanese first, English below, no exclamation marks.",
    neverSays: ["zen", "wabi-sabi", "timeless", "minimalist", "authentically Japanese", "ancient tradition"],
  },
  respect: {
    exclude: [
      "No brushed circles of any kind and no ensō: the Zen circle is a spiritual practice, so her mark is a square window, never a loop",
      "Shrine gates, temple roofs, Buddhist imagery and any ritual objects",
      "Real family crests (kamon); her marks are her own and never copy a registered or known crest",
      "Tea-ceremony utensils and procedures; show menus, tins and signs, never the ceremony",
      "Geisha, maiko or kimono-clad figures from the chaya districts",
      "New Year decorations such as pine gate arrangements and sacred straw ropes",
      "Rising-sun rays and red-sun-on-white compositions",
      "Personal name seals with real names",
    ],
    askAReader: [
      "Does the open-cornered window read as a garden window in a tea house, or too much like a picture frame?",
      "Do the snow-rope cones read as a garden practice, or are they too tied to one specific famous garden?",
      "Are the seasonal fruit and leaf choices right for Kanazawa's months, or would a local pick different ones?",
    ],
  },
  sources: [
    {
      url: "https://visitkanazawa.jp/en/kanazawa-101/detail_246.html",
      used: "Futamata in Kanazawa's mountains has made paper from kozo, mitsumata and gampi bark for about 400 years; Futamata paper is used for umbrellas and gold-leaf beating; Kanazawa Crafts Hirosaka sells it.",
    },
    {
      url: "https://papers.iafor.org/?p=51970",
      used: "Futamata papermaking has shrunk to about three craftspeople because of depopulation and ageing.",
    },
    {
      url: "https://www.takase.com/wp-content/learn-japanese-calligraphy/sample-japanese-calligraphy-lesson/S001/L001/L001.htm",
      used: "Suzuri land and well, grinding flat with long slow strokes, adding water a few drops at a time, ground ink surviving wet backing, bunchin, felt shitajiki, hanshi, washing the stone and hanging brushes by the loop.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Inkstick",
      used: "Ink sticks are soot bound with animal glue; pine soot gives a blue-black, oil soot a warm black; quiet grinding indicates fine soot.",
    },
    {
      url: "https://kougeihin.jp/en/craft/1007",
      used: "Kumano brushes use goat, horse, deer, raccoon-dog, weasel or cat hair; hair is degreased with rice-husk ash and tied with hemp thread.",
    },
    {
      url: "https://kougeihin.jp/en/craft/0203/",
      used: "Kaga yuzen is a Kanazawa dye craft with a palette of crimson, indigo, ochre, grass green and ancient purple and calm, realistic plant motifs: background for her muted, plant-led seasonal colours.",
    },
    {
      url: "https://www.gov-online.go.jp/eng/publicity/book/hlj/html/202210/202210_06_en.html",
      used: "Kanazawa makes over 98% of Japan's gold leaf, beaten between sheets of specially treated washi.",
    },
    {
      url: "https://japanesegardens.jp/yukizuri/",
      used: "Kanazawa's garden snow ropes go up from 1 November to mid-December and come down by 15 March; straw ropes run from a tall pole to each branch, hundreds per pine.",
    },
    {
      url: "https://www.kanazawa-bidai.ac.jp/en/",
      used: "The city's art college has departments of Fine Art, Design and Craft.",
    },
    {
      url: "https://www.1stdibs.com/furniture/asian-art-furniture/textiles/fabric-divider-cotton-noren-kakumoji-character-japan-early-20th-century/id-f_45851912",
      used: "Shop curtains carried a single stylised character as a recognisable shop mark, dyed in persimmon tannin: background for her window-as-shop-mark approach.",
    },
    {
      url: "https://japlanease.com/two-day-kanazawa-itinerary/",
      used: "Kazuemachi is a few quiet winding streets with stairs down to the river, about fifteen minutes' walk from Omicho Market.",
    },
  ],
};
