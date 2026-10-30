import type { Persona } from "./types";

/** Ibou Sarr, Dakar: identities for clothing labels, built from the tailor's pattern paper. */
export const persona: Persona = {
  makerId: "ibou-sarr",
  studio: {
    training:
      "Spent his teenage holidays as an apprentice in a Médina tailoring workshop, pressing seams and learning to read pattern pieces, before studying graphic design in Dakar. Taught himself studio lighting by assisting a portrait studio on weekends, where one flash and a plain backdrop did all the work.",
    room:
      "A corner table inside a four-machine tailoring workshop in the Médina, off the streets near Marché Tilène: brown pattern paper pinned to the wall behind him, a cutting table he shares with the tailors after six in the evening, and a cardboard tube of grey seamless paper leaning by the door. The sewing machines run all day; he works with headphones.",
    tools: [
      "Tailor's chalk in white and blue, sharpened with a blade",
      "Pattern notcher, tracing wheel and a metal L-square",
      "Cloth tape measure worn round his neck",
      "Mechanical pencil and a 60cm steel rule",
      "A DSLR with an 85mm lens and one studio strobe with a bare reflector",
      "A roll of grey seamless paper and two light stands",
    ],
    materials: [
      "Offcuts of brown kraft pattern paper from the tailors",
      "Wax-print cloth bought by the six-yard half piece from stalls at Marché HLM",
      "Woven neck labels and kraft swing tags with string ties",
      "Cotton shirting and lining offcuts",
    ],
    hours:
      "Arrives at nine when the shutters go up and draws through the morning; photographs in the afternoon when a hired studio is cheaper; in the weeks before the big holidays the tailors work past midnight and he steps back from their table.",
  },
  hand: {
    line:
      "Narrow, upright chalk capitals with square ends, drawn with a ruler against them; every line looks measured, as though it could be cut along.",
    signatureMoves: [
      "Uses the pattern's notches, grain lines and seam allowances as the layout grid",
      "Photographs every label on the garment it belongs to, never flat on a desk",
      "Writes the first season's price tags by hand in chalk-style capitals",
      "Shows cloth edges cut, not folded, so the selvedge and weave show",
    ],
    motifs: [
      "The tailor's triangle notch, used as a bullet and a corner mark",
      "A double-headed grain-line arrow",
      "Pattern numbers written inside a small circle",
    ],
    type: "Condensed capitals drawn from the tailors' own chalk lettering, tracked wide, with a plain monospace for sizes and pattern numbers; French and Wolof on tags, English only on export orders.",
    keptImperfections: [
      "Chalk dust and smudges left on the scanned pattern paper",
      "Pin holes and pencil corrections on pattern pieces",
      "A hard shadow line from the single flash",
    ],
  },
  palette: {
    early: ["#0e7c5b", "#f0b323", "#2d3f8c", "#e6e0d4"],
    current: ["#1b2a4a", "#c49a6c", "#f2ede4", "#d4452a"],
    why: "His early work took its colours from the wax-print stalls he photographed: green, gold and cobalt on pale grey. Working inside a tailoring shop moved him toward the colours of the workroom itself, indigo shirting, kraft pattern paper and chalk white, with one red taken from the tailors' marking thread.",
  },
  subjects: {
    clients:
      "Young menswear labels, tailoring workshops starting their first ready-to-wear line, cloth sellers and small shops in Dakar.",
    places: [
      "Médina's tailoring workshops and Marché Tilène",
      "The cloth stalls of Marché HLM",
      "Gueule-Tapée sewing workshops",
      "A hired photo studio with grey seamless paper",
    ],
    returningClient:
      "Coupe Franche, the two-tailor menswear label, comes back each season for new swing tags and a new lookbook.",
  },
  presentation: {
    camera: "DSLR with an 85mm lens on a tripod at chest height, tethered to a laptop.",
    light: "One hard flash with a bare reflector high and to the left, no fill, crisp shadows on the paper.",
    surfaces: "Grey seamless paper, brown pattern paper, the cutting table's worn wood, folded wax-print cloth.",
    framing:
      "Tight crops on cut edges, notches, labels and selvedges; portraits full-length on seamless with generous space above; lookbook pages in a strict grid.",
  },
  voice: {
    captions:
      "Sharp and warm, French first with Wolof where it is the natural word, English last: what the piece is, who sewed it, the pattern number.",
    neverSays: ["\"Exotic\" or \"tribal\"", "\"African print\" as a catch-all", "The name of any cloth manufacturer printed on a selvedge"],
  },
  respect: {
    exclude: [
      "Portraits of religious leaders and devotional wall paintings common on Dakar walls",
      "Prayer beads, amulets and religious calligraphy",
      "Festival and holiday dress staged as ceremony",
      "Wedding and naming-day scenes",
      "Real cloth manufacturers' names and selvedge marks",
    ],
    askAReader: [
      "Is a designer working from a corner of a Médina tailoring shop plausible, and how would the tailors describe him?",
      "Do the French and Wolof on the swing tags read naturally?",
      "Is photographing market customers with their cloth acceptable as shown, with signed consent, or would sitters expect something different?",
    ],
  },
  sources: [
    {
      url: "https://en.wikipedia.org/wiki/African_wax_prints",
      used: "Wax print made by resin resist with crackle, sold as 12-yard full and 6-yard half pieces, with producer and design number printed on the selvedge (hence keep real selvedges out).",
    },
    {
      url: "https://www.tripbase.com/destinations/dakar-senegal/shopping/",
      used: "Marché HLM as Dakar's dedicated fabric market of hundreds of stalls for wax print and bazin, sold by the six-yard piece, with tailors on site; Sandaga in the Plateau as the busier central market.",
    },
    {
      url: "https://lesoleil.sn/actualites/preparatifs-de-la-tabaski-entre-rush-chez-les-tailleurs-et-cherte-de-la-couture/",
      used: "Tailoring workshops at Gueule-Tapée and cloth stalls at Marché Tilène in the Médina, machines running constantly, tailors working late before holidays, bazin and lace prices; holiday dress noted as an exclusion.",
    },
    {
      url: "https://cielvariable.ca/en/issues/ciel-variable-114-masses-monuments/dakar-from-the-studio-to-the-sidewalk-erika-nimis/",
      used: "Médina as the district of Dakar's early studio photographers and the studio-portrait tradition; devotional portrait walls noted as an exclusion.",
    },
    {
      url: "https://tika.gov.tr/en/vocational-training-workshops-inaugurated-in-senegal/",
      used: "Dakar's handicrafts training centre, running since 1961, teaches sewing among its workshops with master trainers, one of the formal routes into tailoring alongside workshop apprenticeship.",
    },
  ],
};
