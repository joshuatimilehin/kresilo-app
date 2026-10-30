import type { Persona } from "./types";

export const persona: Persona = {
  makerId: "wei-chen-kao",
  studio: {
    training:
      "Left school at sixteen in the late 1980s to sweep and mix paint at a family signboard shop, painting price boards and shop names just as acrylic light boxes were taking over the streets. He learned brush characters from the shop owner's boards and learned to draw for neon by sitting beside a tube bender, watching which strokes glass will and will not take. He has never bent glass himself; he draws, the bender bends.",
    room:
      "The ground floor of a shophouse in West Central District, a few lanes from Hai'an Road, behind a roll-up metal shutter he keeps half open. A five-metre plywood drawing table under fluorescent tubes, rolls of kraft paper on a wall rack, unlit glass test words hanging from nails, a stool by the shutter for talking to whoever walks past.",
    tools: [
      "Wide flat brushes and large Chinese brushes for brush characters on boards",
      "Carpenter's pencils and willow charcoal for full-size layouts",
      "Two-metre aluminium rule, chalk line and a set of plywood radius gauges matched to the bender's tube sizes",
      "Black marker for the single centreline the glass will follow, red marker for electrode ends and painted-out jumps",
      "Laser distance meter for checking reading distance on site",
      "Phone and a tripod for test photos of light-box mock-ups at dusk",
    ],
    materials: [
      "Kraft paper on 90 cm rolls, drawn full size so glass can be laid straight on top",
      "Soft lead-glass tubing about 10 to 12 mm across, bent at a partner workshop",
      "Clear tubes filled with neon for red-orange, argon with a drop of mercury for blue, phosphor-coated tubes for pink, mint and warm white",
      "Black blockout paint for the jumps between strokes",
      "Opal white acrylic sheet and cut vinyl for light-box faces",
      "Enamel sign paint and primed boards for menu and price boards",
    ],
    hours:
      "Draws from late morning to evening, eats at the market, and checks every sign from across the street at dusk before signing off. Weekend nights he is at the night market switch-on with a stepladder and a roll of tape.",
  },
  hand: {
    line:
      "Thick, fast brush strokes with dry-brush streaks where the brush runs out, turned for neon into one even centreline that a tube can follow. Every sign has two readings: the painted body by day, the glass skeleton by night.",
    signatureMoves: [
      "Characters planned so each word bends from as few continuous tubes as possible, with jumps painted out behind",
      "Corners rounded to the tube's real bending radius, never sharp, so his glass never looks forced",
      "Characters drawn slightly wide and squat so they read from forty metres across a car park",
      "A fat teardrop at the end of horizontal strokes, the brush pressed down and lifted",
      "Hokkien words written with the romanised ê where a menu would say it out loud",
    ],
    motifs: [
      "A three-line steam curl rising from a bowl or pot",
      "The rounded price tag with a punched hole, used as a frame for prices and as his own mark",
      "The bowl outline, drawn in one stroke from rim to rim",
    ],
    type:
      "Brushed regular-script Chinese characters with occasional half-dry-brush strokes; prices in tall, condensed painted numerals from old price boards; English only small, in a rounded sans, under the main word.",
    keptImperfections: [
      "Small bulges and colour shifts where glass sections are welded",
      "Dark painted gaps between strokes where the tube jumps",
      "Dry-brush streaks left in painted boards",
      "Kraft patterns kept with shoe prints and tea rings on them",
    ],
  },
  palette: {
    early: ["#f4efe2", "#c8281e", "#1f3d7a", "#f2c230"],
    current: ["#0e1116", "#ff6ec7", "#38f2c4", "#e83a2e"],
    why:
      "His first twenty years were daylight work: red, navy and yellow paint on white boards and acrylic boxes. Moving to neon put everything on black, and phosphor-coated tubes gave him the pink and mint that let each night-market aisle have its own colour. Pure neon red stays for food, because it is what a hungry person looks for.",
  },
  subjects: {
    clients:
      "Food stalls, noodle and rice shops, fruit and shaved-ice stands, bakeries and second-generation family shops renewing a sign without losing the old hand.",
    places: [
      "Garden Night Market and Dadong Night Market on their open nights",
      "Guohua Street and Yongle Market in the morning, for the hand-painted price boards",
      "Hai'an Road's lanes and shopfronts after dark",
      "Shennong Street's narrow shophouse fronts",
    ],
    returningClient:
      "The Shuiyue Night Market, whose stall committee calls him every time a new stallholder joins and needs a light box and a word in the aisle colour.",
  },
  presentation: {
    camera:
      "Full-frame camera on a low tripod at knee height across the street, 35mm lens, ISO 100, one- to four-second exposures metered from the tubes at minus one stop so the glass never blows out.",
    light:
      "Blue hour, ten to twenty minutes after sunset, so the sky is still deep blue behind the glow; the tubes are the only other light.",
    surfaces:
      "Pavement wet from rain or from a bucket he throws, so the colour reflects; shutters, stools and steam in the frame.",
    framing:
      "The sign in the upper third, the street and its reflection below, slightly from one side rather than head-on; scooters left to blur through.",
  },
  voice: {
    captions:
      "Loud, warm and practical: the dish, the colour and the distance it reads from. 'Oyster omelette, pink. Reads from forty metres.' Mandarin, a Hokkien word where it fits, English last.",
    neverSays: ["cyberpunk", "retro aesthetic", "vaporwave", "dying art", "nostalgic vibes", "exotic"],
  },
  respect: {
    exclude: [
      "Temple plaques, deity names, temple roof ridges and incense",
      "Temple festival lanterns, processions and decorated stage trucks",
      "Spirit money and offering tables",
      "Political party colours used as a pair, flags and campaign lettering",
      "Real shop names and real brands on any sign",
    ],
    askAReader: [
      "Does the romanised Hokkien spelling on his signs read naturally to Tainan locals?",
      "Could the aisle colours be read as political party colours in Taiwan, and should any be changed?",
      "Is the stroke order and form of each brushed character right, especially the dry-brush strokes?",
    ],
  },
  sources: [
    {
      url: "https://www.scienceabc.com/eyeopeners/neon-lights-made.html",
      used: "Neon is soft lead glass bent by hand over a ribbon burner; benders blow through a hose to keep the bend open; neon gives red-orange, argon with mercury gives blue, phosphor coatings give other colours; tubes are pumped, bombarded and filled.",
    },
    {
      url: "https://til.simonwillison.net/neon/neon-1",
      used: "Beginner tubing is about 10 mm across; the shape is drawn precisely on paper and the heated glass matched to it; electrodes are welded to the ends.",
    },
    {
      url: "https://www.taiwanngo.tw/Post/82783",
      used: "Taiwanese shop signs layer old over new; acrylic took over in the 1980s; freely brushed characters and half-dry-brush strokes are common; Hokkien ê and phonetic symbols appear on signs.",
    },
    {
      url: "https://www.taiwanplus.com/shows/documentary/culture/402/invisible-taiwan/s1/231207005/how-lighting-and-latitude-shape-the-taiwanese-culture-invisible-taiwan-ep6",
      used: "Neon no longer dominates Taiwan's signage, but a few craftsmen still make tubes.",
    },
    {
      url: "https://twtainan.net/en/statics/night",
      used: "Tainan's Garden Night Market opens Thursday, Saturday and Sunday and Dadong Monday, Tuesday and Friday, both from about 17:00.",
    },
    {
      url: "https://www.wanderlustmagazine.com/inspiration/taiwan-by-foot-3-historic-streets-worth-a-stroll-in-tainan-city",
      used: "Guohua Street is the old city's food street, Yongle Market sits on it, Shennong Street runs into Hai'an Road.",
    },
    {
      url: "https://neonmuseum.org/news/tips-and-tricks-for-photographing-neon-signs/",
      used: "Photograph neon at night on a tripod, keep exposures short enough not to wash out the tubes, shoot low or from the side, and use wet pavement for reflections.",
    },
    {
      url: "https://www.shutterbug.com/node/434611",
      used: "Meter from the tubes themselves and set about minus one stop of exposure compensation.",
    },
    {
      url: "https://www.picturecorrect.com/tips-for-taking-photos-of-neon-signs/",
      used: "Shoot about ten minutes after sunset to keep the surroundings, on a tripod at ISO 100, without flash.",
    },
  ],
};
