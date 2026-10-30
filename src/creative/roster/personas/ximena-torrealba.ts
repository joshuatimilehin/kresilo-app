import type { Persona } from "./types";

/** Ximena Torrealba, Quito: brush-painted enamel lettering for stalls, shops and labels. */
export const persona: Persona = {
  makerId: "ximena-torrealba",
  studio: {
    training:
      "Studied graphic design at a private design institute in Quito, founded in the 1980s when the city's commerce was growing, and hated every hour of setting type on screen. Spent three years after that as the helper of an old rotulista who painted shop names around the city's markets: cleaning brushes, priming boards, pouncing patterns, and only then lettering. He taught her to pallet enamel on a glossy magazine page and to finish a sign before the afternoon rain.",
    room:
      "A ground-floor room with a roll-up metal door on a steep cobbled street at the edge of the historic centre. Sign boards lean against every wall, tins of enamel stand on a shelf by colour, brushes rest flat in a tray of oil, a drawing table by the door holds kraft-paper patterns, and a chalkboard on the back wall carries the week's jobs in her own lettering.",
    tools: [
      "Flat squirrel-hair lettering quills, sizes 2 to 10, kept in oil between jobs",
      "A mahl stick with a padded tip",
      "A pounce wheel, a cloth pounce bag of chalk and kraft-paper patterns",
      "Old glossy magazines torn into pages for palleting paint",
      "A chalk line, a spirit level and a long aluminium straightedge",
      "A flatbed scanner and a vector program, used only to turn finished brush lettering into label files",
    ],
    materials: [
      "Oil-based synthetic enamel in red, chrome yellow, cobalt, leaf green, orange, black and cream",
      "Reducer and a flow additive, touched to the brush on the pallet, never stirred into the tin",
      "Primed sheet metal and plywood panels for stall signs",
      "Chalkboard paint and white chalk for menu boards",
      "Brown kraft paper for full-size patterns",
    ],
    hours:
      "Paints on site from seven until about eleven, while the light is hard but before the strongest midday sun and the afternoon showers. Afternoons in the workshop cutting patterns, priming boards and scanning. Never leaves a sign half-lettered overnight: enamel skins and the next day's stroke will not match.",
  },
  hand: {
    line:
      "Fast, single-pass strokes from a flat quill with square, crisp starts and thick-to-thin changes from turning the brush. Letters bounce slightly on the baseline, then get an outline or drop shadow in a second colour, leaving a hairline gap between letter and shadow.",
    signatureMoves: [
      "One flourish per sign, chosen by the client while she paints",
      "A drop shadow offset down and right in a contrasting colour, with a hair of background showing between",
      "Letters spaced tighter than any font would, by eye",
      "The stall number painted in a circle on the post beside the sign",
    ],
    motifs: [
      "A small painted fruit or flower beside the name: a pineapple, a bunch of bananas, a single bloom",
      "A curling scroll flourish that ends in a teardrop",
      "A two-leaf sprout under a plain round sun disc, with no face and no rays",
    ],
    type:
      "Two hands only: a fat, upright brush script for names and heavy outlined block capitals for the second line. On labels the same lettering is redrawn in vector with a clear weight order, so the flavour is always read first.",
    keptImperfections: [
      "The square mark where the quill first touched",
      "A slight wobble at the end of a long stroke where the mahl stick moved",
      "Faint chalk dots from the pounced pattern still under the paint",
      "Brush texture in the enamel where a stroke was laid fast",
    ],
  },
  palette: {
    early: ["#c1272d", "#f7b32b", "#f4ecd8", "#2a6f97"],
    current: ["#2f6f4f", "#f2c14e", "#f6efdf", "#e4572e"],
    why:
      "Market signs live outside under some of the strongest sun on earth, so her first palette was the enamels that hold up: a full red, chrome yellow and cobalt on a cream ground. Lettering a food label moved her colours towards the produce itself, a leaf green and a squash orange, while the cream and the yellow stayed.",
  },
  subjects: {
    clients:
      "Market stallholders, small grocers and bakeries, juice counters, cafés that want a chalkboard menu, and small food producers who sell at weekend markets and need labels.",
    places: [
      "Plaza Chica Market and its sixty stalls",
      "The old covered markets of the centre, for their painted stall boards and price cards",
      "The weekend organic market in La Floresta, where Plant Pantry first sold from a table",
      "Steep cobbled streets at the edge of the historic centre, where she works",
    ],
    returningClient:
      "Plaza Chica Market, which calls her whenever a stall changes hands so the new stallholder gets a sign with their own flourish; it was a stallholder there who grew into Plant Pantry.",
  },
  presentation: {
    camera:
      "A mirrorless camera with a 35mm lens, square to the sign at its own height; whole stall fronts shot from across the aisle.",
    light:
      "Hard high-altitude midday sun with short, sharp shadows; glossy enamel left to catch a small highlight.",
    surfaces:
      "Painted sheet metal and plywood, stall fronts with produce, whitewashed walls and green-painted doors.",
    framing:
      "Front-on and close enough to see each brushstroke; a row of stalls shown straight on, numbers on the posts visible.",
  },
  voice: {
    captions:
      "Warm and direct: the stallholder's name, the flourish they chose and how long it took. 'Doña Rosa chose the pineapple. Three hours.' Spanish first, English below.",
    neverSays: ["folk art", "naïve", "exotic", "Latin vibes", "rustic", "authentic"],
  },
  respect: {
    exclude: [
      "Churches, domes, crosses, saints and the statue on the hill above the old town",
      "Inca sun faces, the stepped Andean cross and other ceremonial symbols",
      "Indigenous textiles, dress and patterns from any community used as decoration",
      "Real shop names, brands, political party colours and slogans",
      "Holy Week processions and their robed figures",
      "Festival dance masks and costumes",
      "The national flag and coat of arms",
      "Stallholders photographed without asking",
    ],
    askAReader: [
      "Would a Quito sign painter call the work rótulos or letreros, and does 'Plaza Chica' sound like an invented market?",
      "Is hand-painted synthetic enamel still common on Quito market stalls, or have printed vinyl signs taken over?",
      "Could a plain sun disc over a sprout ever be read as a reference to the Inca sun, and should it change?",
    ],
  },
  sources: [
    {
      url: "https://www.elcomercio.com/tendencias/quito-supera-escala-radiacionuv-organizacionmundialdelasalud/",
      used: "Quito sits above 2,800 m at latitude zero; UV rises about 20% per 1,000 m of altitude and regularly reaches very high to extreme levels.",
    },
    {
      url: "https://pam.quito.gob.ec/PAM/Formularios%20PAM/LUAE/ANEXO%204%20-%20REGLAS%20T%C3%89CNICAS%20EN%20MATERIA%20DE%20PUBLICIDAD%20EXTERIOR%20(LUAE).pdf",
      used: "Signs in Quito's historic areas give only the business name, sit on the wall beside the door, not over doors or balconies, at most one square metre.",
    },
    {
      url: "https://www.signs101.com/threads/one-shot-questions-reducing-one-shot.56027",
      used: "Sign painters reduce lettering enamel only until it flows, adding reducer on the pallet rather than in the tin.",
    },
    {
      url: "https://handletteringforum.com/forum/viewtopic.php?p=21749",
      used: "Palleting enamel on a glossy magazine page and dipping the brush tip in thinner for flow before lettering.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Rotulo",
      used: "Rótulos as hand-painted commercial signs in Latin America, a trade squeezed by digital printing.",
    },
    {
      url: "https://dialnet.unirioja.es/descarga/articulo/7940290.pdf",
      used: "Quito's private design institutes date from the mid-1980s, founded as commerce and industry grew.",
    },
    {
      url: "https://expatexchange.com/article/22335/Living-in-Quito-Best-Markets-in-Quito",
      used: "Quito's old markets, Santa Clara, San Roque and the Mercado Central, with fruit, flower and food stalls.",
    },
    {
      url: "https://www.lonelyplanet.com/articles/133951",
      used: "La Floresta as Quito's artists' neighbourhood of galleries, cafés and murals.",
    },
    {
      url: "https://expatlife.ai/ecuador/cities/quito/neighborhoods/la-floresta",
      used: "La Floresta holds a weekly organic market.",
    },
  ],
};
