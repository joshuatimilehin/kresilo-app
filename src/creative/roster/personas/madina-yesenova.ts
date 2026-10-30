import type { Persona } from "./types";

/** Madina Yesenova, Almaty: rooms and wayfinding, worked out in white card before a single plan is drawn. */
export const persona: Persona = {
  makerId: "madina-yesenova",
  studio: {
    training:
      "Studied architectural environment design at the city's academy of architecture and civil engineering, in the design school founded there in the early nineties. Spent seven years at a large architecture bureau fitting out offices and banks, where she was the one who built the models nobody else had time for. She went independent at thirty-four and now takes on one room or one building's wayfinding at a time.",
    room:
      "A ground-floor room in a five-storey courtyard block below Abay Avenue, its high side window facing the mountains to the south so the daylight is cool and steady most of the year. The concrete-topped table holds whatever model is in progress; white card models of earlier jobs stand on shelves along one wall, each with its scale written on the base. An aryk runs past the window under a row of poplars, and in summer she can hear it while she cuts.",
    tools: [
      "A steel rule, a triangular scale rule and a scalpel with fresh blades, changed every model",
      "An A1 cutting mat and a smaller mat for fine work at 1:20",
      "PVA glue in a syringe applicator, and pins to hold walls while it sets",
      "A desk lamp on a long arm that she moves round a model to stand in for the sun",
      "A laser distance meter and a 30m tape for site measuring",
      "A small camera that can be lowered into a model to standing eye height",
      "Masking tape and an A3 printer for full-size mock signs taped to real doors",
    ],
    materials: [
      "White mounting board for walls and floors, because cut edges hardly show",
      "One and two millimetre grey board for bases and existing structure",
      "Card-and-foam board for walls at 1:50, cut to the true wall thickness",
      "Clear acetate for glazing",
      "One sheet of coloured paper per model, for the single accent",
      "Felt, cork and timber samples cut to postcard size for clients to hold",
    ],
    hours:
      "Mornings on site, sitting for an hour and marking where people stop, wait and turn. Afternoons at the model table while the light from the high window is still cool. Plans only in the evening, and only once the model has settled the question.",
  },
  hand: {
    line:
      "White card and grey board with crisp cut edges, raw concrete greys and one colour only. Spaces are drawn and photographed in one-point perspective from standing eye height, and signs carry two scripts on one shared baseline.",
    signatureMoves: [
      "A card model at 1:20 or 1:50, photographed at eye level, before any plan is drawn",
      "Small filled dots on every plan marking where people were seen to stop",
      "Colour on the floor, by zone, instead of on the walls",
      "One word per door, set large; full-size paper versions taped to the real doors and tested on a first day",
    ],
    motifs: [
      "The standing dot: a small solid circle where someone chose to stop",
      "A single band of floor colour running from a door to a window",
      "A sign with Kazakh above and Russian below on one baseline",
    ],
    type:
      "A plain humanist sans-serif in one weight, Kazakh first and Russian beneath, both in Cyrillic, sized to the same cap height. On newer jobs a third line in Latin-script Kazakh, set smaller. Arrows and pictograms drawn on the same grid as the letters.",
    keptImperfections: [
      "A glint of glue at a card joint",
      "Pencil scale marks and pin holes on the model base",
      "Grey board walls that bow very slightly",
      "Masking tape and curled corners on the full-size mock signs",
    ],
  },
  palette: {
    early: ["#5b4636", "#e8dcc4", "#8a9a5b", "#2f2f2f"],
    current: ["#264653", "#e9c46a", "#f4a261", "#f1faee"],
    why:
      "Her first rooms of her own were reading rooms, and they took their colours from old timber shelving, unbleached felt, a dusty olive and charcoal. Turning a concrete workshop into shared offices pushed her to colour the floor by zone, and she chose a deep teal, saffron and apricot that read clearly against raw concrete and cool mountain light, with a pale off-white for every sign.",
  },
  subjects: {
    clients:
      "Public libraries, co-working spaces in converted industrial buildings, schools and small clinics, and housing co-operatives improving a shared courtyard.",
    places: [
      "The courtyard blocks of the Golden Square and the benches people actually use in them",
      "The aryks running along the avenues under poplars",
      "The halls of the Green Bazaar, for how crowds sort themselves without signs",
      "The pedestrian stretch of Zhibek Zholy",
      "Soviet modernist public buildings, their concrete screens and deep shade",
      "The mountains to the south, visible at the end of almost every street",
    ],
    returningClient:
      "Almond Street Library, which came back after the quiet room for wayfinding on its children's floor and now asks her to walk the building with staff every September.",
  },
  presentation: {
    camera:
      "A small camera lowered into the model on a short rod so the lens sits at standing eye height for the scale, wide aperture for shallow depth of field.",
    light:
      "Cool daylight from the high side window, sometimes with the arm lamp as a low sun; no flash and no coloured gels.",
    surfaces:
      "The model's grey board base on the concrete table; full-size work photographed on site in natural light.",
    framing:
      "One-point perspective down a corridor or across a room, one paper figure standing at a marked dot, a single colour accent in an otherwise grey and white frame.",
  },
  voice: {
    captions:
      "Calm and precise: what people did, then what she changed. 'Most people stopped at the second pillar. The sign moved there.' Russian first, with Kazakh names for places and rooms.",
    neverSays: ["iconic", "Instagrammable", "nomadic spirit", "Silk Road", "yurt-inspired", "exotic"],
  },
  respect: {
    exclude: [
      "The shanyrak yurt crown and yurt interiors, a cherished household symbol carried on the state emblem",
      "Ram's-horn scroll ornaments and clan tamga marks used as decoration",
      "Mosques, minarets and religious calligraphy",
      "The state emblem and flag, Soviet emblems and political mosaics",
      "Traditional dress, eagle hunters and horseback scenes as shorthand for the country",
      "Real named buildings shown as her own projects",
    ],
    askAReader: [
      "Do Kazakh-first, two-script signs read right for a public library in Almaty today, and should Latin-script Kazakh appear yet?",
      "Is leaving the shanyrak and ornament entirely out the right call, or is there secular ornament a local designer would use freely?",
      "Is a mid-career woman running her own small spatial design practice in Almaty believable, and who would her clients usually be?",
    ],
  },
  sources: [
    {
      url: "https://kazgasa.kz/?p=6628",
      used: "The academy's School of Design: architectural environment design established as a specialty in 1992, with the country's first design department.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Kazakh_Leading_Academy_of_Architecture_and_Civil_Engineering",
      used: "The academy was founded in 1980 as the Almaty architectural and construction institute and renamed in 1992.",
    },
    {
      url: "https://en.wikipedia.org/wiki/The_Golden_Square_(Almaty)",
      used: "The Golden Square as Almaty's central historic neighbourhood, with Stalin-era housing and pastel fronts.",
    },
    {
      url: "https://caspianpost.com/en/post/soviet-modernist-architecture-in-almaty",
      used: "Almaty's Soviet-era grid of streets and apartment buildings grouped around courtyards.",
    },
    {
      url: "https://design.britishcouncil.org/blog/2014/nov/14/atomik-architecture-almaty",
      used: "Almaty's Soviet modernist buildings expressing regional imagery through geometry, rhythm, patterning and materials.",
    },
    {
      url: "https://www.walkingalmaty.com/irrigation-ditches",
      used: "Almost every central street has an aryk carrying snowmelt from the mountains; the main one runs along Abay Avenue.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Green_Bazar",
      used: "The Green Bazaar's covered halls in the block bounded by Zhibek Zholy, Zenkov, Makatayev and Pushkin streets.",
    },
    {
      url: "https://www.petosevic.com/node/4602",
      used: "Since January 2022 private signage must be in Kazakh, with Russian or other languages allowed alongside.",
    },
    {
      url: "https://en.orda.kz/majilis-deputy-proposes-removing-cyrillic-from-city-signage-in-favor-of-latin-script-5357/",
      used: "The move to a Latin-script Kazakh alphabet is unfinished and businesses use Latin script at their own discretion.",
    },
    {
      url: "https://www.arts.ac.uk/partnerships/outreach/insights/how-to/techniques/how-to-techniques-scale-models",
      used: "Scale-model practice: white mounting board, card-and-foam board for wall thickness at 1:50, steel rule, blade and cutting mat, acetate for glazing.",
    },
  ],
};
