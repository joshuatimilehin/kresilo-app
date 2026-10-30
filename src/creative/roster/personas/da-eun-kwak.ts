import type { Persona } from "./types";

export const persona: Persona = {
  makerId: "da-eun-kwak",
  studio: {
    training:
      "A clothing and textiles degree in Jeonju, then two years at a hanbok alteration shop near Nambu Market, where she hemmed, let out seams and learned the hand seams by repeating them on the owner's offcuts. She taught herself the narrow triple-folded seam from museum books on patchwork wrapping cloths and practised it on a hundred handkerchiefs before her first commission.",
    room:
      "Half of a former stationery shop in the Seohak-dong art village lanes, within walking distance of the Hanok Village. A long west-facing window she uses as a light table, a sliding inner door papered with hanji, a cutting table built on two filing cabinets, pegboard of rulers and a brass rail where finished cloths hang against the light.",
    tools: [
      "Single-needle industrial straight-stitch machine, bought reconditioned from a sewing-machine repair shop",
      "Hand needles, a leather thimble and a tin of silk pins",
      "Tailor's shears kept only for ramie, and a smaller pair for organza",
      "Steam iron plus a small craft iron for pressing each folded seam flat",
      "Water spray bottle, because ramie presses crisp only when damp",
      "A3 graph pads at 5 mm squares, a 60 cm steel rule, coloured pencils",
      "Masking tape for taping paper squares to the window",
    ],
    materials: [
      "Ramie remnants bought by weight from a fabric wholesaler, mostly bleached fine ramie and undyed grey",
      "Silk organza offcuts from hanbok makers, collected in a box at the alteration shop",
      "Clients' own linen offcuts, sorted by colour in clear bins",
      "Natural cotton and silk thread, always one shade darker than the lightest square",
      "Hanji from Jeonju paper shops for full-size paper mock-ups",
      "Brass rods and hand-sewn rod pockets for hanging panels",
    ],
    hours:
      "Plans on graph paper with coffee from eight, cuts and pins until lunch, machine-sews in the afternoon and presses after every row. At four she stops to look at the window with the low sun behind the work in progress. Twice a year she takes the train to the Seoul fabric market floors for organza.",
  },
  hand: {
    line:
      "Her line is the seam: a narrow, dark, triple-folded seam about three millimetres wide that encloses every raw edge. Against light it reads as a grid of firm dark lines between glowing panes, heavier than the usual flat-felled seam on ramie, which is how people recognise her cloths from across a room.",
    signatureMoves: [
      "The triple-folded seam on every fabric, including ramie, where most makers would use a flat-felled seam",
      "Squares sized in multiples of 1.5 cm from the graph-paper plan, built outward in rows from one corner",
      "One square turned ninety degrees so its weave runs the other way and catches light differently",
      "A single tie corner in a contrasting colour, always at the top right of the plan",
      "Pressed flat after every row, so the grid is dead straight",
    ],
    motifs: [
      "The windowpane grid of unequal squares",
      "One small saturated square in a field of pale ones, like a lit window at dusk",
      "The contrasting tie corner",
    ],
    type:
      "She never embroiders words on cloth. Each piece has a cotton tape label stamped in a plain Hangul gothic with the date, the fabric and the number of pieces.",
    keptImperfections: [
      "Ramie slubs and thick threads left in the pane",
      "A slight wave where ramie stretched on the bias",
      "Seam corners where four folds meet, a little thicker than the rest",
      "Thread tails knotted and visible on the back",
    ],
  },
  palette: {
    early: ["#efeadf", "#cfc8b8", "#8f8a7d", "#3b3a36"],
    current: ["#e8dfcc", "#3f5e8c", "#d9a3b5", "#6c9a8b"],
    why:
      "Her first cloths were undyed ramie bought by weight, so the work was whites, greys and the dark seam lines. The bakery panels added brick and sage from a dyed batch at the wholesaler, and the homeware shop's own dyed linen offcuts brought blue, pink and green. She still keeps at least half of every cloth pale so it glows.",
  },
  subjects: {
    clients:
      "Homeware and gift shops, bakeries and cafés with street windows, small guesthouses wanting window panels, and people who bring their own fabric scraps to be pieced.",
    places: [
      "Nambu Market, including the second-floor youth mall",
      "The Seohak-dong art village alleys",
      "Hanji paper shops and the autumn hanji festival stalls",
      "Sewing-machine repair shops in the old downtown",
      "The fabric floors of the Seoul wholesale market, piled with hanbok silks",
    ],
    returningClient:
      "Jogak & Co., the homeware shop in a converted print shop, which sends her a bag of the week's linen offcuts every Monday and reorders wraps each autumn.",
  },
  presentation: {
    camera:
      "Mirrorless camera on a tripod at the panel's mid-height, square-on, 50mm lens; a second set of macro shots of one seam junction.",
    light:
      "Backlit by the west window in late-afternoon sun, no front light, exposed for the pale panes so they glow and the seams read dark. Bright and high-key.",
    surfaces:
      "Cloths hang from a brass rod in front of the window or the hanji-papered door; small wraps are tied on a box on a pale birch shelf.",
    framing:
      "Square crop, the cloth filling the frame edge to edge, seam grid exactly parallel to the frame, horizon level, nothing else in shot.",
  },
  voice: {
    captions:
      "Bright, exact and counted: pieces, seam width, fabric, hours. '42 pieces, 3 mm seams, ramie and organza, 11 hours.' Korean first, English below.",
    neverSays: ["traditional Korean", "heritage", "ancestral", "stained glass", "zen", "handmade with love"],
  },
  respect: {
    exclude: [
      "Wedding and betrothal wrapping cloths, gift-exchange settings and any marriage ritual",
      "Ancestral-rite table settings and offering food",
      "Embroidered auspicious characters and symbols of luck or long life",
      "The five cardinal colours used as a symbolic scheme",
      "Hanbok-clad figures, palace or royal motifs, and the national flag",
      "Shamanic or temple textiles and objects",
    ],
    askAReader: [
      "Does a single contrasting tie corner echo any ceremonial convention for wrapping cloths that should be avoided?",
      "Is the triple-folded seam on ramie believable to a bojagi maker, or would it look wrong?",
      "Do the stamped Hangul labels read naturally, and is the wording on them right?",
    ],
  },
  sources: [
    {
      url: "https://www.vam.ac.uk/articles/jogakbo-traditional-korean-patchwork",
      used: "Patchwork wrapping cloths are pieced from scraps of one fabric type (cotton, silk, ramie, hemp or paper), joined with a triple-stitched seam that gives a sealed flat seam and a window-pane look, sewn into squares and extended outward.",
    },
    {
      url: "https://cutoutandkeep.net/projects/tongsol",
      used: "Seam names and uses: flat-felled seam on single-layer ramie and hemp, the narrow triple-folded seam on silk organza, running stitch and whipstitch; translucent pieced cloth reads as a grid when held to light.",
    },
    {
      url: "https://craftatlas.co/crafts/jogakbo",
      used: "Confirms the triple-stitched seam, single-fabric construction and square-then-outward building order.",
    },
    {
      url: "https://ich.unesco.org/en/RL/weaving-of-mosi-ramie-in-the-hansan-region-00453",
      used: "Fine ramie is harvested, boiled, bleached, spun and woven; the bleached cloth is suited to hot summers and to garments.",
    },
    {
      url: "https://www.koreajoongangdaily.com/korea/doityourself-in-dongdaemun-markets/11134561",
      used: "The Seoul wholesale fabric buildings hold thousands of vendors selling fabric, thread and hanbok silks, mostly in large quantities.",
    },
    {
      url: "https://www.trazy.com/ko/spot/2657/nambu-market-%EC%A0%84%EC%A3%BC-%EB%82%A8%EB%B6%80%EC%8B%9C%EC%9E%A5-shopping",
      used: "Jeonju's Nambu Market has a second-floor youth mall of small shops and a weekend night market.",
    },
    {
      url: "https://biz.heraldcorp.com/article/10898943",
      used: "Jeonju holds a hanji culture festival each autumn; hanji is made from paper mulberry and supplied as window paper for historic buildings.",
    },
    {
      url: "https://airial.travel/attractions/south-korea/jeonju/seohak-dong-art-village-698juJqo",
      used: "Seohak-dong is a neighbourhood of small studios, galleries and shops in alleys within walking distance of the Hanok Village.",
    },
  ],
};
