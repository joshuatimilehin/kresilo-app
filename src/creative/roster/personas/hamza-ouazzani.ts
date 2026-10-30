import type { Persona } from "./types";

export const persona: Persona = {
  makerId: "hamza-ouazzani",
  studio: {
    training:
      "Four years at a craft-training centre in Fez, where he trained as a tile cutter and learned that a zellige panel is a three-person job: one chooses the glazed tiles and draws the shape, a second roughs it out with the menqach, the master cuts it true. He never became a master cutter; he left to study graphic design in Casablanca and came back with the cutter's habit of drawing every shape so it can be cut.",
    room:
      "A narrow first-floor workshop in Fez el-Bali, above a leather cutter's bench, with a whitewashed wall, one deep window facing west, a drawing board and a cutting mat on trestles, and a row of card templates hung from nails like keys. Downstairs he can hear the copper beaters in the square a few lanes away.",
    tools: [
      "A steel beam compass and a brass bow compass, both with a sharpened needle point",
      "A one-metre steel straight edge and a 45-degree set square",
      "A heavy craft knife with snap-off blades and a self-healing cutting mat",
      "A pricking awl for marking grid centres",
      "Grey board, black card and kraft card for testing every shape at full size",
      "A light table and a scanner for moving finished grids to vector files",
    ],
    materials: [
      "Off-cut glazed tiles from zellige workshops at Ain Nokbi, cut to his templates by a master cutter",
      "Vegetable-tanned hides and leather offcuts from the tanneries' suppliers",
      "Brass sheet for etched and embossed plates",
      "Lime plaster in the off-white of old walls",
      "Kraft paper and cotton drill for bags",
    ],
    hours:
      "Draws from early morning while the street is quiet and the grid lines are easy to see; cuts card at midday; photographs in the late afternoon when the sun comes low down the lanes. Saturday mornings he spends at the tile workshops outside the walls.",
  },
  hand: {
    line:
      "Hairline construction drawn with compass and straight edge, then a single heavy line traced over the final shape. No freehand curves: every curve is an arc from a marked centre.",
    signatureMoves: [
      "Builds every mark and pattern from one square repeat unit divided on its diagonals, so each shape lands on the same grid.",
      "Limits each system to shapes that can be cut with a knife and a straight edge in a few strokes.",
      "Leaves a two-millimetre gap between shapes, like a grout line, so pieces read as cut and laid rather than drawn.",
      "One colour per space or product; colour, not words, does the wayfinding.",
    ],
    motifs: [
      "An eight-point star made from two squares turned 45 degrees against each other",
      "The long, pointed six-sided piece that fills between stars, used alone as a pointer or arrow",
      "A stepped chevron strip that runs along floors, edges and borders",
    ],
    type:
      "Monoline geometric letters in Latin and Arabic script built on the same grid, with 45-degree cut terminals; French and Arabic set side by side at equal weight and size. Names and numbers only, never a passage of text.",
    keptImperfections: [
      "Knife overcuts at the inside corners of card shapes",
      "The compass pinhole left visible at the centre of every drawing",
      "Slightly uneven grout gaps between hand-cut tile pieces",
      "Small chips along the bevelled edge of a cut tile",
    ],
  },
  palette: {
    early: ["#1f1c1a", "#c9b08a", "#2f6b4f", "#f2eee6"],
    current: ["#0e6b6b", "#d9b44a", "#7b3f22", "#f3efe7"],
    why:
      "His early identities were black card, kraft and one zellige green, since he tested everything in card and printed little. Café Bit Skhoun made him work from the glaze colours a tile workshop actually keeps in stock, which brought teal and honey yellow, and the leather work for Atelier Sept Peaux added the tan of vegetable-tanned hide.",
  },
  subjects: {
    clients:
      "Leather and metal workshops in the old city, cafés and guesthouses in converted houses, and small cultural spaces that need signs that can be made by local hands.",
    places: [
      "The zellige and pottery workshops at Ain Nokbi, east of Bab Ftouh",
      "The copper and brass beaters' square, Place Seffarine",
      "The tanneries and leather lanes of Fez el-Bali",
      "Converted bathhouses and courtyard houses inside the walls",
    ],
    returningClient:
      "Atelier Sept Peaux, the five-person leather workshop: he adds a shape to their pattern for each new bag and redraws their order cards every year.",
  },
  presentation: {
    camera:
      "A full-frame camera on a tripod with a shift lens, so walls and floors stay square; he levels the camera with a bubble level before each shot.",
    light:
      "Strong raking late-afternoon sun down a narrow lane or through a doorway, so tile bevels, embossing and etched brass throw long, deep shadows.",
    surfaces:
      "Cut tile, embossed leather, etched brass and lime plaster, photographed in place where they are used: a floor, a door, a workbench.",
    framing:
      "Straight-on and symmetrical, the centre of the pattern on the centre of the frame, with the surrounding wall or floor kept in to show scale; never an angled detail shot.",
  },
  voice: {
    captions:
      "Measured and exact, in French and Arabic: gives the grid, the angle and the size, and credits the cutter or tanner by trade. \"Grille de 12 cm, étoile à huit pointes. Coupée par le maâlem, posée à sec.\"",
    neverSays: ["Moorish", "arabesque", "mystical", "exotic", "oriental", "Arabian Nights"],
  },
  respect: {
    exclude: [
      "Calligraphy of religious text, or any text from scripture",
      "Mosque, madrasa or shrine buildings, interiors, minarets and doors, including the well-known ones near the tanneries and the copper square",
      "The hand-shaped amulet and other protective symbols",
      "Royal emblems, the national star emblem and state seals",
      "Amazigh identity symbols used as decoration",
      "Copies of specific historic tile panels",
    ],
    askAReader: [
      "Does the eight-point star read as neutral craft geometry for a Moroccan reader, or is it too closely tied to religious buildings to use on a café or bag?",
      "Is a tile-cutting apprentice who left for design school, and still sends work to a master cutter, plausible and respectful?",
      "Is the French and Arabic caption mix right for a Fez designer, or would Darija appear in his captions?",
    ],
  },
  sources: [
    {
      url: "https://www.ziatile.com/blog/zellige-mosaics",
      used: "Zellige cut with the menqach, an axe-and-hammer tool, edges bevelled with a second hammer, tiles glazed on one side and fired in olive-pit kilns, and the three-person split of a panel (choose and draw, rough cut, master cut).",
    },
    {
      url: "https://www.lonelyplanet.com/morocco/fez/attractions/art-naji/a/poi-sig/1404626/355510",
      used: "Fez potters moved out of the medina to Ain Nokbi, east of Bab Ftouh, and the sound of hammers on tile in roadside zellige workshops.",
    },
    {
      url: "https://www.rarejob.com/dna/2023/10/29/from-clay-to-vibrant-tiles-fezs-zellige-gains-global-traction/",
      used: "A zellige craft village outside Fez with more than 200 workshops, and smoke from some kilns.",
    },
    {
      url: "https://www.birs.ca/workshops/2021/21w2240/files/Samira_Mian.pdf",
      used: "Building an eight-fold star pattern with compass and straight edge from a circle and a square repeat unit divided on its diagonals.",
    },
    {
      url: "https://www.barcelo.com/guia-turismo/en/morocco/fez/things-to-do/place-seffarine/",
      used: "Place Seffarine as the square where copper is shaped with heat and hammer, the sound carrying across the medina, and much of the work now being repair.",
    },
    {
      url: "https://amusingplanet.com/2014/08/the-leather-tanneries-of-fez-morocco.html",
      used: "How hides are softened and dyed at the Fez tanneries, and the natural dyes used for colour.",
    },
    {
      url: "https://telquel.ma/instant-t/2025/02/12/fes-plus-de-2-milliards-de-dirhams-pour-le-renforcement-de-linfrastructure-dediee-a-lartisanat_1917615/",
      used: "Fez craft training centres and a dedicated pottery and zellige zone.",
    },
    {
      url: "https://www.larousse.fr/encyclopedie/divers/M%C3%A9dina_de_F%C3%A8s/181623",
      used: "Mastering a traditional craft in Fez taking at least four years of apprenticeship.",
    },
  ],
};
