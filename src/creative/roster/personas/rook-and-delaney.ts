import type { Persona } from "./types";

/** Rook & Delaney, Montréal: a two-person studio for title sequences and short loops. */
export const persona: Persona = {
  makerId: "rook-and-delaney",
  studio: {
    training:
      "Odile Rook, who draws, studied film animation at a Montréal university's cinema school, where frame-by-frame work, under-camera animation and storyboarding come before any software; she made her graduation film from paper cut-outs shot on a rostrum. Sam Delaney, who animates, came up through editing: ten years cutting trailers and music videos, counting every cut to the beat, before teaching himself to time drawings on an exposure sheet. They met building a title card for a friend's short and opened the studio together twelve years ago.",
    room:
      "A fourth-floor room in a stone warehouse on rue Saint-Paul at the eastern end of Old Montréal, with the market's silver dome in the east window. One wall of storyboard panels pinned in rows of twelve; Odile's light table with a peg bar on one side, Sam's two screens and pen display on the other, back to back; a rostrum stand with a sheet of glass for cut-out shoots; plants on the sill that survive the radiators.",
    tools: [
      "A light table with a standard three-peg bar, and punched animation paper to match",
      "Erasable blue pencils for roughs and a black brush pen for clean lines (Odile)",
      "A pen display and a 2D animation package with an exposure sheet and timeline (Sam)",
      "A rostrum copy stand with a mirrorless camera pointing down through glass, for cut-out frames",
      "A click track and printed exposure sheets marked in eight-counts",
      "Scalpels, a self-healing mat and a jar of hinge pins for jointed paper figures",
      "Closed headphones and a pocket recorder for night street sound",
    ],
    materials: [
      "Punched animation bond paper, bought by the ream",
      "Coloured paper and matte black card for cut-out characters and backgrounds",
      "Tracing paper for layout, and sticky notes in two colours: yellow for Odile's French, blue for Sam's English",
      "Street sound recorded on winter nights: snow blowers, a delivery bike, a bakery's ovens",
    ],
    hours:
      "In by half past nine. Mornings Odile draws keys and Sam times yesterday's drawings to the count; at one they play the whole reel at speed together and argue in two languages. Afternoons Sam animates and composites while Odile designs titles; when a generated rough plate is used for a background, she repaints it by hand and the credits say so. In winter they walk the Plateau after dark to record sound and draw the snow-loading crews.",
  },
  hand: {
    line:
      "Thick, even brush-pen outlines that thin only at the tips, as if the shapes were cut from paper, with flat fills and no gradients. Movement is on twos, with the key pose landing hard on a counted beat and the line boiling very slightly from frame to frame.",
    signatureMoves: [
      "Every move lands on a counted beat: they cut to an eight-count and the key pose hits on one",
      "A single-frame motion smear on every fast move, drawn as one stretched flat shape",
      "Depth built from three flat layers sliding at different speeds, like paper on a multiplane rostrum",
      "Titles lettered by Odile in French first and larger, English beneath, both drawn by hand",
    ],
    motifs: [
      "The exterior iron staircases of Plateau triplexes, drawn as zigzag silhouettes against lit windows",
      "Snowbanks along the kerb at night, lit by shop neon and the orange no-parking signs of a snow-loading night",
      "A needle sweeping across a dial and landing on a number",
    ],
    type:
      "Heavy rounded capitals and wide numerals drawn by Odile, with a thin inline highlight; French on top and larger, English below. Lower-thirds and social tiles use a plain sans so the drawn title stays the loudest thing on screen.",
    keptImperfections: [
      "Line boil from redrawing every frame",
      "Paper grain and a fibre or two on the glass in cut-out frames",
      "A one-frame registration jitter they left in because it felt alive",
      "Blue pencil construction lines showing through on storyboard panels",
    ],
  },
  palette: {
    early: ["#ff3d71", "#101935", "#fff1b8", "#00d1b2"],
    current: ["#0d0221", "#ff2a6d", "#05d9e8", "#d1f7ff"],
    why:
      "Their cut-out years kept a warm cream paper ground under the rostrum, with coral pink, teal and a deep navy that still shows in the radio station's sting. Making a short about people working at night, they removed the paper ground and let the night be the background: near-black indigo, a hotter magenta and a cyan that glows, with ice blue kept only for snow.",
  },
  subjects: {
    clients:
      "Community radio and small broadcasters, film festivals and independent features that need opening titles, music venues, and their own short films between commissions.",
    places: [
      "The back lanes of the Plateau and Mile End with their outside staircases",
      "Old Montréal's rue Saint-Paul and the market dome from the studio window",
      "Boulevard Saint-Laurent after midnight, when the shop neon is the only colour",
      "Residential streets on a snow-loading night: blowers, trucks and orange signs on the poles",
    ],
    returningClient:
      "Metro 98.4, the community radio station, which comes back each September for the new season's lower-thirds and a fresh variation on the needle-landing sting.",
  },
  presentation: {
    camera:
      "Finished frames exported straight from the timeline at full resolution, never photographed off a screen; cut-out work shot on the rostrum, camera straight down through glass.",
    light:
      "Digital frames lit only by their own neon; on the rostrum, two lamps at forty-five degrees so the glass throws no glare.",
    surfaces:
      "Paper characters on matte black card under glass; finished work shown on a phone in a hand, a cinema screen or a pinned storyboard wall.",
    framing:
      "Dynamic diagonals, with the subject entering on a slant; motion shown as three frames left to right, the smear frame in the middle.",
  },
  voice: {
    captions:
      "Two voices tagged by initial, quick and joking, French and English answering each other: 'O : on l'a redessinée 48 fois. S: Forty-seven were fine.' Frame counts and the beat always included.",
    neverSays: ["eye candy", "epic", "seamless", "content", "pixel-perfect", "next level"],
  },
  respect: {
    exclude: [
      "First Nations, Inuit and Métis imagery, regalia, carvings, dreamcatchers or stone markers used as decoration",
      "Church domes, basilica towers, crosses and the illuminated cross on the mountain",
      "Real broadcasters' call letters and logos, and the city's real transit symbols",
      "Political flags, sovereignty slogans and protest imagery",
      "Real sports team marks and jerseys",
      "Unhoused people or night workers shown as atmosphere; every worker in their films is a named character with a job",
      "Copying the style of real animation studios or famous Canadian short films",
    ],
    askAReader: [
      "Does 'Metro 98.4' read as an invented community station, or too close to the city's métro or a real frequency?",
      "Would a bilingual Montréal studio put French first and larger on every title and social tile, or only where the signage rules apply?",
      "Do outside staircases and snow-loading nights read as the studio's own Montréal, or as postcard shorthand?",
    ],
  },
  sources: [
    {
      url: "https://www.concordia.ca/academics/undergraduate/film-animation.html",
      used: "A Montréal film animation degree centred on frame-by-frame filmmaking: stop motion, under-camera animation, storyboarding and drawing.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Mel_Hoppenheim_School_of_Cinema",
      used: "The university's cinema school teaches animation, production and film studies, with around 250 new students a year.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Inbetweening",
      used: "Animating on twos holds each drawing for two frames, giving twelve drawings a second at 24 fps; faster action goes on ones.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Traditional_animation",
      used: "Peg bars keep drawings registered on the light table; the exposure sheet records timing frame by frame.",
    },
    {
      url: "https://www.themain.com/articles/history-lesson-montreal-spiral-staircases",
      used: "Outside staircases are typical of the Plateau, Mile End, Rosemont and Villeray, in a city with heavy winter snow.",
    },
    {
      url: "https://atlasobscura.com/articles/montreal-plexes-outdoor-staircases",
      used: "Exterior staircases on plexes are prominent in the older neighbourhoods just beyond downtown Montréal.",
    },
    {
      url: "https://montreal.ctvnews.ca/montreal-snow-clearing-underway-loading-and-removal-to-begin-tomorrow-1.5743418",
      used: "Snow-loading operations run into the night; crews post orange no-parking signs on poles and in snowbanks beforehand.",
    },
    {
      url: "https://globalnews.ca/news/10589481/quebec-store-signs-french-bill-96/",
      used: "Quebec rules require French to be markedly predominant on public signs: background for their French-first titling habit.",
    },
    {
      url: "https://www.afar.com/places/bonsecours-market-montreal",
      used: "The 1840s market building with its silver dome anchors the eastern end of rue Saint-Paul in Old Montréal.",
    },
  ],
};
