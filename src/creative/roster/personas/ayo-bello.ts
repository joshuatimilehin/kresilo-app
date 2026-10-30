import type { Persona } from "./types";

/** Ayo Bello, Lagos: film photographs of the last hour of light, and the posters people leave on walls. */
export const persona: Persona = {
  makerId: "ayo-bello",
  studio: {
    training:
      "Started at sixteen sweeping the floor and loading film for a portrait studio in Surulere, the kind of neighbourhood studio Lagos once had on every busy street, where he learned to read a negative before he owned a camera. A two-week summer school run by the city's photography festival taught him to edit a series rather than chase single frames. Twenty years on he still shoots colour negative film and develops it himself, because the labs that once lined the mainland have mostly closed.",
    room:
      "The ground floor of an old two-storey house in Ebute Metta, a short walk from Yaba, with a tailor's shop next door and a street of pasted posters outside. One long plaster wall he never repaints, a back room turned into a darkroom with a blacked-out window, a scanning desk under a fan, and a table of paper offcuts from past print runs. Once a year the door stays open all day for the neighbours.",
    tools: [
      "Two manual 35mm film SLRs, one with a 35mm prime for the street and the ferry, one with an 85mm for people",
      "A handheld light meter, read in the shade and the sun before every roll",
      "Daylight developing tank and reels, a kitchen thermometer and a basin for the water bath",
      "A small colour enlarger in the back-room darkroom, printing all seven of a set at the same size",
      "A film scanner and a calibrated screen for grading scans by hand",
      "Two battery flashes and a pack of amber, red and pale violet gels, clipped on with clothes pegs",
      "A craft knife, steel rule and cutting mat for cutting poster letters",
    ],
    materials: [
      "ISO 400 colour negative film, bought in bricks when it can be found and kept in a cool box",
      "Home colour chemistry with a combined bleach-fix; the 38°C developer bath needs only a little warm water in Lagos heat",
      "Matte colour paper for prints, and thin poster paper from a mainland print shop",
      "Offcuts and misprints from earlier poster runs, kept flat under a board",
      "Wheat-starch paste he cooks on the stove for putting posters up on walls",
    ],
    hours:
      "Edits and prints from ten until the afternoon, when the light outside is too hard. From five he is on the water or the street with one roll, shooting until the light goes at about half six. Develops at night when the house is cool; in harmattan months, from late November, he shoots even earlier because the dust softens the sun from four.",
  },
  hand: {
    line:
      "Warm colour negative with visible grain, low sun raking across walls and water, shadows long enough to reach the frame edge. Highlights are allowed to bloom amber; blacks stay soft rather than crushed, the way a negative holds them.",
    signatureMoves: [
      "Shoots the same place from the same spot at different hours, so the light is the only thing that changes",
      "Keeps one small figure off-centre, with at least a third of the frame left to sky, wall or water",
      "Lights people with a single gelled flash from the side, so a body is drawn by its coloured edge",
      "Prints every frame of a set at the same size and hangs them in a single row",
    ],
    motifs: [
      "A lone figure small and off-centre, with the horizon low and the sky doubled in water",
      "Layers of torn posters on a plaster wall, caught in raking evening light",
      "The ferry rail as a hard line across the bottom of the frame, with the lagoon beyond",
    ],
    type:
      "Big letters cut by hand from poster paper and photographed, never typeset, for titles and open-day posters. Captions and credits in a plain grotesque, small and set low, English first with Yoruba where it is the natural word.",
    keptImperfections: [
      "Film grain and the soft amber bloom around low sun",
      "Light leaks and a fogged edge on the first frame of a roll",
      "Dust specks from the darkroom, spotted out only where they sit on a face",
      "The uneven cut edges of his paper letters",
    ],
  },
  palette: {
    early: ["#2b2118", "#e0b46c", "#f4ead6", "#7a5230"],
    current: ["#12324a", "#f2a65a", "#d8553c", "#f6efe3"],
    why:
      "A year of evenings in the reading room taught him to work only with the colours of tungsten lamps: brown shadows, warm paper whites, a single gold. Going back out onto the lagoon for the ferry campaign brought in the blue of water at the end of the day, and the coloured gels he uses for portraits added an orange-red. He now works in deep blue, sunset orange and a gelled red against warm white.",
  },
  subjects: {
    clients:
      "Organisations that people pass through every day: a ferry company, a neighbourhood library, small venues and community spaces, plus his own yearly series with no client at all.",
    places: [
      "The lagoon crossings between Ikorodu, Falomo and CMS, from the rail of a commuter ferry",
      "The plaster wall and paste-up posters of his own street in Ebute Metta",
      "A reading room on the mainland lit only by its own lamps",
      "Lagos Island roads at the end of the working day, when the sun drops behind the buildings",
      "Wide flat ground with water on it, for the week each year he takes away from clients",
    ],
    returningClient:
      "Lamp Street Library, which comes back every January to start a new year of monthly evenings and a new exhibition on the reading-room wall.",
  },
  presentation: {
    camera:
      "Negatives scanned whole with the thin black film border left on; prints photographed straight-on with a 50mm lens on a tripod, square to the wall.",
    light:
      "For the prints themselves, late-afternoon daylight from the street door, low and warm from the left, no flash.",
    surfaces:
      "His own plaster wall, poster walls on the street, and the matte backs of prints laid on the offcut table. Never glass frames or gallery white.",
    framing:
      "Sets shown as a single row of equal-sized prints with wide gaps; single frames shown full-bleed with the film border as the only edge.",
  },
  voice: {
    captions:
      "Warm and specific, a small story in one or two sentences: the hour first, then the place, then who was there. 'Ten to six, the Falomo crossing. Everyone looked west.'",
    neverSays: ["vibrant chaos", "gritty", "hustle", "the real Africa", "exotic", "capturing the essence"],
  },
  respect: {
    exclude: [
      "Masquerades of any kind, including the white-robed Eyo of Lagos Island, which is an ancestral rite, not a carnival",
      "Religious crusade, revival and church or mosque posters, which cover many Lagos walls; his poster walls show only music, events and his own work",
      "Political campaign posters, party logos and the faces of politicians",
      "Stilt settlements on the lagoon shown as a poverty spectacle; the water belongs to commuters and the evening, not to misery",
      "Orisa shrines, sacred groves and ritual offerings",
      "Facial marks and scarification as a style detail",
      "Wedding and naming-day dress and gatherings staged as backdrops",
      "Real musicians' names, real venue names and real brand logos on any poster",
    ],
    askAReader: [
      "Is a colour darkroom at home plausible for a Lagos photographer now, or would he more likely post film abroad or find one of the few remaining local labs?",
      "Does Ebute Metta, near Yaba, read right as the street for an established photographer's studio with a tailor next door?",
      "Would a Lagos commuter recognise the Ikorodu, Falomo and CMS crossings as the everyday ferry routes, and do riders wear life jackets in the photographs as they would on board?",
    ],
  },
  sources: [
    {
      url: "https://www.discoverlagos.ng/post/how-to-use-the-lagos-ferry-system-water-transport-guide",
      used: "Ferry terminals (Ikorodu, Five Cowries at Falomo, CMS), routes such as Ikorodu–Falomo–CMS, commuter hours roughly 6:30 am to 6 pm with evening peaks, and mandatory life jackets on board.",
    },
    {
      url: "https://cielvariable.ca/en/issues/ciel-variable-102-far-away-so-close/lagos-nigeria-capital-of-photography-erika-nimis/",
      used: "Lagos's long history of neighbourhood portrait studios as the training ground for photographers: background for his apprenticeship.",
    },
    {
      url: "https://www.clpa.photography/wordpress/wp-content/uploads/2020/07/CLPAnews201702-EN.pdf",
      used: "An analogue photography group in Nigeria planning a darkroom to train young photographers, showing how scarce film processing has become.",
    },
    {
      url: "https://en.wikipedia.org/wiki/C-41_process",
      used: "C-41 developer at 37.8°C, the step sequence, and simplified home kits with a combined bleach-fix.",
    },
    {
      url: "https://championtraveler.com/dates/best-time-to-visit-lagos-ng/",
      used: "Harmattan haze from the Sahara softening the Lagos skyline in December to February.",
    },
    {
      url: "https://guardian.ng/opinion/my-friend-harmattan/",
      used: "Harmattan usually starting mid-November, peaking mid-January and waning by mid-February.",
    },
    {
      url: "https://www.arise.tv/odufuwa-eyo-festival-is-not-an-annual-carnival-its-an-ancestral-rite/",
      used: "The Eyo is an ancestral rite held to escort a departed king or chief, with white robes and strict rules: listed as an exclusion.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Street_poster_art",
      used: "Wheatpaste on thin paper as the medium of street posters: background for his poster walls and paste-ups.",
    },
  ],
};
