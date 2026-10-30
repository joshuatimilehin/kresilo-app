import type { Persona } from "./types";

/** Leila Haddad, Beirut: bilingual lettering drawn from street signs and pulled as two-colour screen prints. */
export const persona: Persona = {
  makerId: "leila-haddad",
  studio: {
    training:
      "Studied graphic design at a Beirut university, where Arabic lettering and typography were taught side by side with Latin, then spent two years carrying ladders and mixing enamel for an old shop-sign painter whose workshop is long gone. Learned screen printing on borrowed time at a T-shirt printer, pulling her own posters after his shift. Twenty years later she still draws every letter with a brush before it goes near a screen.",
    room:
      "A first-floor workshop in Bourj Hammoud, across the river from Mar Mikhael at the end of Armenia Street, above a T-shirt printer whose exposure unit she shares. A long wooden print table with a hinged screen clamp, a drying rack of wire shelves, a drawing board under a battery lamp, and plan-chest drawers holding every failed proof since she started. Shop signs in Arabic, Armenian, French and English fill the street below.",
    tools: [
      "Flat signwriter's brushes from 6 to 25mm, and a mahlstick for steadying the hand on windows",
      "Cut bamboo reed pens and broad flat nibs for testing Arabic stroke contrast before brushing",
      "Aluminium screen frames at a fine mesh, and two squeegees, one for each ink",
      "The shared UV exposure unit downstairs, booked before the generator goes off",
      "A light table and acetate film for hand-painted positives",
      "A rechargeable LED lamp for drawing through the hours without power",
      "A flatbed scanner for high-resolution scans, cleaned only lightly",
    ],
    materials: [
      "Water-based screen inks: a dense black and one vermilion, mixed in jam jars and labelled by date",
      "Cream uncoated board at around 250gsm for posters, bought in reams from a paper merchant near the port",
      "Enamel sign paint for windows and shopfronts",
      "Acetate sheets and opaque ink for positives",
      "Offset paper offcuts for proofing, and every proof kept",
    ],
    hours:
      "Draws in the afternoon, exposes screens in the evening while the neighbourhood generator is running, and prints late into the night by battery lamp after it cuts out. Mornings are for sleep and for the walk back past the signs.",
  },
  hand: {
    line:
      "Bold letters drawn with a flat brush held at a fixed angle, so the thick and thin of every stroke follow the brush, not a font. Edges are slightly irregular; ink squashes a little at the edge of each letter where the squeegee pushed hardest.",
    signatureMoves: [
      "Draws Arabic and Latin on the same baseline at the same stroke weight, so neither script looks translated",
      "Crops letters tight and front-on, as though the poster were a sign cut off by the frame",
      "Allows only one colour of emphasis per piece, used on a single word",
      "Keeps the brush wobble in the final scan rather than smoothing it",
    ],
    motifs: [
      "The two-line shop-sign stack: Arabic above, French or English below, sharing one width",
      "A half-lit sign: one word glowing in colour, the rest of the line dark",
      "A single vermilion word punched into a line of black, as if read aloud",
    ],
    type:
      "Arabic drawn in the broad, sturdy forms of hand-painted shop signs, with flat terminals and open counters; French and English in condensed capitals drawn to match. No digital fonts on a finished piece, only for the small print on the back.",
    keptImperfections: [
      "Slight misregistration between the black and the vermilion",
      "Ink squash and a faint halo at letter edges",
      "Brush wobble on long horizontal strokes",
      "Pinholes and a dust speck in the screen, printed in",
    ],
  },
  palette: {
    early: ["#f1e3c8", "#1a1a1a", "#c1121f", "#4a6fa5"],
    current: ["#14213d", "#fca311", "#f3ecd8", "#6b3e26"],
    why:
      "For years her posters were black and a red on cream, the two inks she could afford to keep open on the table, with a blue saved for rare runs. Lettering a bookshop window for a late-night reading hour moved her towards the colours of the street after dark: a deep night blue, the amber of a shopfront lit on generator power, and the brown of old wooden signboards. Her prints still use black and vermilion; her signs and windows now use night blue and amber.",
  },
  subjects: {
    clients:
      "Independent bookshops, cafés, small publishers and evening events in Beirut, and anyone who wants their name on a window to sound like a voice rather than a font.",
    places: [
      "Bilingual and trilingual shop signs in Bourj Hammoud",
      "Armenia Street and the stairs and cafés of Mar Mikhael",
      "Hamra Street's mix of Arabic and Latin shopfronts",
      "Streets after the generator hour, lit by a few amber windows",
      "A café wall where a poetry morning is held",
    ],
    returningClient:
      "Ink Before Noon, the monthly poetry morning, which comes back each autumn for a new season of twelve posters, one line and one colour each.",
  },
  presentation: {
    camera:
      "Prints shot flat and front-on with a 50mm lens on a copy stand; windows and walls photographed straight-on at night from across the street.",
    light:
      "Flat, even light for prints; for signs, only the street's own night light and the window's own glow, no flash.",
    surfaces:
      "Cream poster board, rough painted walls, shop glass at night. Never a mock-up frame.",
    framing:
      "Lettering cropped tight to the edge, square to the camera, filling the frame like a poster pasted flat to a wall.",
  },
  voice: {
    captions:
      "Direct and a little dry: the word, the ink, the hour. 'Two inks. One bad night. Proof 14 of 15.' Arabic first, then French, then English.",
    neverSays: ["Paris of the Middle East", "resilience", "phoenix rising", "exotic script", "calligraphy", "chaos"],
  },
  respect: {
    exclude: [
      "Quranic verses, religious phrases, names of God and devotional calligraphy in any script",
      "Saints, icons, shrines and any religious imagery seen on Beirut streets",
      "Party flags, emblems, colours, slogans, leaders' portraits and martyr posters",
      "The port explosion and war-damaged buildings used as a backdrop or texture",
      "The national flag or cedar used as decoration",
      "Hand-shaped amulets and evil-eye charms",
      "Real shop names and real signs copied letter for letter",
      "Armenian lettering drawn as decoration; it appears only as it stands on real streets, never copied into her work",
    ],
    askAReader: [
      "Does French below Arabic still read as the natural pairing on a Beirut sign, or would English be more usual for a bookshop now?",
      "Is the generator hour a fair, everyday detail of working late in Beirut, or does it read as making a point about hardship?",
      "Would a Bourj Hammoud reader find a non-Armenian letterer's workshop there plausible, and is leaving Armenian out of her work the right call?",
    ],
  },
  sources: [
    {
      url: "https://en.wikipedia.org/wiki/Mar_Mikha%C3%ABl",
      used: "Mar Mikhael lies along Armenia Street, bounded by the Beirut River, leading east to Bourj Hammoud; it became a hub for galleries and cafés.",
    },
    {
      url: "https://scholarworks.aub.edu.lb/items/3d17e3e0-d2f0-4a82-9504-b636afad2034/full",
      used: "A study of how Arabic and Latin scripts share the shop signs of Hamra Street.",
    },
    {
      url: "https://aub.edu.lb/msfea/ard/gd/Pages/default.aspx",
      used: "A Beirut graphic design programme teaching Arabic from traditional calligraphy to contemporary lettering and typography.",
    },
    {
      url: "https://www.lau.edu.lb/employment/faculty/sard-typography-30112021.php",
      used: "Beirut typography courses covering Latin and Arabic side by side.",
    },
    {
      url: "https://sursock.museum/node/366",
      used: "Screen-printing workshops taught in Beirut.",
    },
    {
      url: "https://today.lorientlejour.com/article/1331531/beirut-neighborhood-generators-we-need-your-insights.html",
      used: "Neighbourhood generator subscriptions with fixed on and off hours, including overnight cuts.",
    },
    {
      url: "https://asiatimes.com/2018/11/in-lebanon-generator-standoff-highlights-power-gap/",
      used: "Daily power cuts in Beirut alternating by neighbourhood, with small generator subscriptions covering lights.",
    },
  ],
};
