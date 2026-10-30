import type { Persona } from "./types";

export const persona: Persona = {
  makerId: "ceren-akbudak",
  studio: {
    training:
      "Studied graphic design in Istanbul, then spent two summers in a tile workshop in Kütahya as a paying student, learning the usta-çırak way: shaping, drying, first firing, painting, glazing. There she learned to transfer a design by pouncing charcoal through a pricked paper stencil and to paint the outline first, before any colour is laid in. Twenty years of packaging work for food producers followed, half of it at a printing house.",
    room:
      "A top-floor studio in Kadıköy, ten minutes' walk from the ferry pier, with white-painted plaster walls, a long plaster ledge under the window where prototypes are lined up, a light table, a flat file of pricked stencils, and shelves of every tin and box she has made, oldest at the top.",
    tools: [
      "Round sable brushes, sizes 0 to 4, and one long, fine liner kept only for outlines",
      "A dip pen with a steel nib for single-line drawings",
      "Pricked tracing-paper stencils and a cloth pounce bag of charcoal dust",
      "A light table for separating each colour onto its own sheet by hand",
      "A kitchen scale, a digital calliper and a drop-test mark on the studio doorframe at table height",
      "A scanner and a laptop for cleaning separations into spot-colour files",
    ],
    materials: [
      "Black ink and gouache in cobalt, turquoise and a tomato red, on hot-pressed paper",
      "Tinplate printed in three spot colours plus white at a metal-packaging printer outside the city",
      "Grey board and folding carton from the printers' estate in Topkapı",
      "Moulded pulp from cardboard offcuts",
      "Uncoated white card for sleeves and care cards",
    ],
    hours:
      "Paints from eight until noon while the north light is even; afternoons are for press checks, supplier visits and posting test boxes across the Bosphorus. Never paints after dark.",
  },
  hand: {
    line:
      "A fine, even, dark-cobalt outline drawn first with the liner, like the black outline under an Iznik glaze, with colour laid in afterwards inside it. The line swells slightly where the brush is reloaded and tapers to a point at every leaf tip.",
    signatureMoves: [
      "Leaves a hairline of white paper between the outline and the colour fill, so every shape looks inlaid.",
      "Designs every lid or panel as a square tile that repeats in any rotation, so a row of products builds a larger panel on the shelf.",
      "Uses a raised varnish only on the red, a nod to bole red, which was laid on thick and stands slightly proud of the glaze.",
      "A single blue line drawing of the actual object inside, never a photograph, on every sleeve.",
    ],
    motifs: [
      "A long, curved, serrated leaf that sweeps across the corner of a square",
      "A split pomegranate showing a grid of seeds",
      "A wavy ferry-wake line used as a border along the bottom edge",
    ],
    type:
      "A narrow, upright sans she draws herself with a slight brush entry stroke, always with carefully drawn Turkish letters (ğ, ş, ç and the dotless ı). Product names sit in a white band across the tile pattern, never on top of it.",
    keptImperfections: [
      "A visible join where the brush was reloaded mid-outline",
      "A slightly uneven fill edge inside the white hairline",
      "Tiny charcoal dots from the pounced stencil left in the scanned drawing",
    ],
  },
  palette: {
    early: ["#1d3f8f", "#f4f1ea", "#7d93c4", "#2b2b2b"],
    current: ["#1f3f9a", "#2fa6a0", "#c8382b", "#f7f4ee"],
    why:
      "Her early packaging was cobalt and white only, because a two-colour job was all her first clients could afford. Turquoise came in when she began printing on tinplate, which carries a clean turquoise well, and tomato red last, once a tin printer could hold three spot colours in register. She jokes that her palette arrived in the same order as the old Iznik colours did.",
  },
  subjects: {
    clients:
      "Family food shops, spice and dried-fruit sellers, ceramics studios, olive-oil and honey producers, and small craft businesses that sell online and need boxes that survive the post.",
    places: [
      "The Spice Bazaar in Eminönü, where loose sumac and pul biber are sold by weight",
      "The Kadıköy market streets and the ferry piers on the Asian shore",
      "The printers' estate on Litros Yolu in Topkapı",
      "Tile workshops in Kütahya",
    ],
    returningClient:
      "Akkaya Baharat, the third-generation spice shop: she adds a new lid motif each autumn so regular buyers can extend their row of tins.",
  },
  presentation: {
    camera:
      "A medium-format digital camera on a tripod with a 100mm macro lens, tethered to a laptop; every product shot is at the same height and distance.",
    light:
      "One large softbox from the left, a white fill card on the right, so glaze and tinplate get one crisp specular highlight each.",
    surfaces:
      "The white plaster ledge from her studio, against a clean grey-white backdrop, with the original brush painting sometimes laid flat behind the product.",
    framing:
      "Objects arranged in neat rows or a square grid, front-on and level, lids aligned so their motifs join into one panel; generous empty space above.",
  },
  voice: {
    captions:
      "Precise and warm, in Turkish and English: gives the size, the number of colours and the test it passed, and thanks the printer or potter by trade. \"Sumac tin, 9 cm square, three spot colours plus white. Survived the ferry.\"",
    neverSays: ["Ottoman-inspired", "oriental", "exotic", "bazaar vibe", "timeless", "luxury"],
  },
  respect: {
    exclude: [
      "Calligraphy of any kind, and any Arabic-script text",
      "Mosques, mosque tile panels, lamps and interiors, including the buildings around the Spice Bazaar",
      "The crescent and star, the tughra and other state or imperial emblems",
      "The evil-eye bead and other amulets",
      "The çintamani three-dot motif and any motif with a specific religious or dynastic reading",
      "Copies of specific museum objects or real tile panels",
    ],
    askAReader: [
      "Does a designer from Istanbul apprenticing briefly in Kütahya read as respectful, or as treating a master's workshop as a short course?",
      "Do the serrated leaf and pomegranate still read as neutral botanical motifs, or do they point to particular buildings or traditions?",
      "Is the joke about her palette arriving in the Iznik colour order something a Turkish ceramicist would find apt, or glib?",
    ],
  },
  sources: [
    {
      url: "https://islamicceramics.ashmolean.org/Iznik/intro.htm",
      used: "Iznik's finely textured quartz-frit body and the transparent glaze made from a lead, soda and tin frit.",
    },
    {
      url: "https://www.iznikcini.com/pages/history-of-iznik-tiles",
      used: "Order in which the Iznik palette arrived (cobalt, then turquoise, then other colours, then bole red applied thickly under the glaze); outlines pounced through stencils; saz leaves and later floral designs.",
    },
    {
      url: "https://kureansiklopedi.com/tr/detay/kutahya-cinisi-00068",
      used: "Kütahya tile process (shaping, drying, first firing, painting, glazing), the cobalt, turquoise, red and green palette, floral motifs, and master-apprentice transmission.",
    },
    {
      url: "https://www.masterart.com/artworks/18923/iznik-jug",
      used: "Black outlines under the glaze around cobalt, turquoise and tomato-red fills, and carnation and saz-leaf motifs.",
    },
    {
      url: "https://istanbul.com/blog/food-drink/turkish-spices-explained",
      used: "Sumac and pul biber as staple spices sold loose in Istanbul, and buying by smell and freshness.",
    },
    {
      url: "https://istanbul.com/spice-bazaar",
      used: "The Spice Bazaar's location on the Eminönü waterfront and its daily trading.",
    },
    {
      url: "https://www.feribotseferleri.com.tr/en/karakoy-kadikoy",
      used: "The Karaköy to Kadıköy ferry crossing of about 20 minutes, for her habit of posting test boxes across the Bosphorus.",
    },
    {
      url: "https://connect.buchmesse.de/newfront/exhibitor/zlem-matbaacilik-ve-reklamcilik-ltd-sti",
      used: "Packaging and print firms based at the printers' estate (Matbaacılar Sitesi) on Litros Yolu in Topkapı.",
    },
    {
      url: "https://packagingfair.com/en/brand/kontensan-konya-teneke-kutu-amb-ve-mak-san-tic-as",
      used: "Turkish metal-packaging makers offering offset printing on tinplate for food producers.",
    },
  ],
};
