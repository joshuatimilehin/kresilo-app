import type { Maker } from "../makers";
import type { CaseStudy } from "../portfolio/types";

/**
 * Four practices the roster was missing: a UI and UX designer in Tallinn, a
 * video editor in Manila, a six-person design studio in Glasgow posting as one
 * account, and a creative technologist in Auckland. Every project starts from
 * a story; culture shows only through craft, materials, streets, food and
 * trades (docs/cultural-context-and-respect-rules.md).
 */
export const makers: Maker[] = [
  {
    id: "kertu-vaher",
    name: "Kertu Vaher",
    kind: "individual",
    place: "Tallinn, Estonia",
    area: "Europe",
    region: "Northern Europe",
    discipline: "ui and ux design",
    stage: "mid-career",
    voice: "Plain, patient and practical",
    languages: ["Estonian", "English", "Russian"],
    influences:
      "Ferry piers in sleet, timetable boards, wooden houses with stone stairs, sticky notes on a library counter and paper screens tested with gloves on.",
    bio: "Kertu Vaher designs small public-service apps and forms, and starts every project by spending a week where the service actually happens. She tests paper screens with the people who will use them, in the cold if that is where they stand.",
    sample: true,
    portrait: "/assets/kresilo/gen/portrait--kertu-vaher.jpg",
  },
  {
    id: "joven-paguio",
    name: "Joven Paguio",
    kind: "individual",
    place: "Manila, Philippines",
    area: "Asia",
    region: "Southeast Asia",
    discipline: "video editing",
    stage: "emerging",
    voice: "Warm, quick and funny",
    languages: ["Filipino", "English"],
    influences:
      "Welding sparks at dusk, steel sheet hammered over a wooden form, hand-painted route boards, rehearsal rooms above corner stores and cutting to a counted snare.",
    bio: "Joven Paguio cuts short documentaries and music videos, mostly for families, bands and workshops he knows from his own streets. He prints his transcripts, pins the best lines to a wall and only opens the timeline once the wall reads like a story.",
    sample: true,
    portrait: "/assets/kresilo/gen/portrait--joven-paguio.jpg",
  },
  {
    id: "half-landing",
    name: "Half Landing",
    kind: "organization",
    members: ["Isla Ferrie", "Callum Dowie", "Aamir Siddiqui", "Eilidh Gourlay", "Tomasz Wrona", "Niamh Sweeney"],
    place: "Glasgow, Scotland",
    area: "Europe",
    region: "Northern Europe",
    discipline: "graphic identity",
    stage: "established",
    voice: "One voice, plain-spoken and sociable",
    languages: ["English", "Scots"],
    influences:
      "Tiled tenement closes, red and blond sandstone, enamel street signs, screen-printed posters on close doors and the climb up four flights of stairs.",
    bio: "Half Landing is a studio of six designers working from a first-floor tenement flat, making identities, signs and printed matter for libraries, festivals and housing groups. They draw everything at the size it will be seen, and test every sign by walking the building with the people who use it.",
    sample: true,
    portrait: "/assets/kresilo/gen/portrait--half-landing.jpg",
  },
  {
    id: "ari-matenga",
    name: "Ari Matenga",
    kind: "individual",
    place: "Auckland, New Zealand",
    area: "Oceania",
    region: "Oceania",
    discipline: "creative technology",
    stage: "mid-career",
    voice: "Easy-going and precise",
    languages: ["English", "te reo Māori"],
    influences:
      "Harbour tides over barnacled rocks, salt-crusted pontoons, small screens that sleep most of the day, hand-soldered boards and risograph posters in a shop window.",
    bio: "Ari Matenga builds small tools, generative web pieces and installations for designers, clubs and community groups around the harbour. Most pieces run for years on cheap hardware, and every one is tested where it will live, usually before breakfast.",
    sample: true,
    portrait: "/assets/kresilo/gen/portrait--ari-matenga.jpg",
  },
];

export const caseStudies: CaseStudy[] = [
  // Kertu Vaher
  {
    id: "praamiaeg-ferry-app",
    makerId: "kertu-vaher",
    title: "Praamiaeg",
    client: {
      name: "Laidu Ferry Office",
      what: "A county transport office running three small-island ferry routes and, in hard winters, one ice road",
    },
    kind: "ui-ux",
    themes: ["technology", "place"],
    tagline: "Is my boat going, and is there room for the car? One look, gloves on.",
    role: "Research, app and pier-screen design",
    year: 2025,
    palette: ["#f4f6f7", "#0f2a3d", "#2f7fb5", "#f2b134", "#c8d3da"],
    story: {
      brief:
        "Islanders crossing to the mainland for work and school checked a PDF timetable, a phone line and a noticeboard on the pier, and in ice season the three rarely agreed.",
      idea:
        "Ride the 6:40 crossing for two weeks and design for the deck: one screen that answers whether the boat is going and whether there is car space, readable at arm's length with gloves on, with the ice road shown in the same status line as the ferry.",
      outcome:
        "An app and a pier screen showing the next three departures, car-deck space and a single status that switches between ferry, ice road and closed. Calls to the office phone line halved in the first winter.",
    },
    panels: [
      { kind: "hero", caption: "The next departure, readable at arm's length on a windy pier." },
      { kind: "process", caption: "Sticky notes from two weeks of 6:40 crossings, stuck to the saloon window." },
      { kind: "device", caption: "Ice season: ferry, ice road and closed share one status line." },
      { kind: "process", caption: "Paper screens tested on deck, in gloves." },
      { kind: "mockup", scene: "sign", caption: "The same three departures on the pier screen." },
      { kind: "quote", caption: "“I look once and put my phone away.” A parent on the school run." },
    ],
    assetsUsed: [],
    templateId: "ui-kit-starter",
    aiHelp: "assisted",
    process:
      "Sketched on paper and tested on deck with commuters. AI used only to transcribe the recorded interviews, every note checked by hand against the recordings.",
  },
  {
    id: "vesiveski-library-booking",
    makerId: "kertu-vaher",
    title: "Book a Room at Vesiveski",
    client: {
      name: "Vesiveski Library",
      what: "A three-room district library in a former bakery, lending study rooms, a sewing machine and a sound booth",
    },
    kind: "ui-ux",
    themes: ["education", "empowerment"],
    tagline: "Eleven questions down to three, the three the librarians ask out loud.",
    role: "Service research and booking flow",
    year: 2026,
    palette: ["#fbf7f0", "#2b2d42", "#d1495b", "#edae49", "#66a182"],
    story: {
      brief:
        "The online booking form had eleven fields and defeated most older readers, so the librarians kept a paper diary at the desk and typed it into the system every evening.",
      idea:
        "Sit behind the desk for a week and write every booking question asked aloud on a sticky note. Keep only the three the librarians really ask: what you want, when, and your library card number.",
      outcome:
        "A three-step booking flow for phones and a tablet at the desk, in Estonian and Russian, with the paper diary kept as the fallback. The evening typing stopped, and room bookings rose by a third.",
    },
    panels: [
      { kind: "hero", caption: "Three steps: what, when, and your card." },
      { kind: "process", caption: "A week behind the desk, one sticky note per question asked aloud." },
      { kind: "device", caption: "The desk tablet, large type for readers who book with a librarian." },
      { kind: "process", caption: "The old paper diary, the source for every field we kept." },
      { kind: "mockup", scene: "card", caption: "The printed slip the sewing-machine regulars asked to keep." },
    ],
    assetsUsed: [],
    aiHelp: "none",
    process:
      "Mapped on sticky notes at the desk, prototyped in the browser and tested with readers in the reading room. No generated imagery.",
  },

  // Joven Paguio
  {
    id: "ramos-body-works-documentary",
    makerId: "joven-paguio",
    title: "One More Body",
    client: {
      name: "Ramos Body Works",
      what: "A three-generation family workshop that hand-builds jeepney bodies from steel sheet",
    },
    kind: "motion",
    themes: ["story", "company"],
    tagline: "Six weeks, one jeepney body, and a family talking while they hammer.",
    role: "Editor and co-director",
    year: 2026,
    palette: ["#1b1d21", "#c9ccd1", "#e8a33d", "#b2302b", "#3f6e8c"],
    story: {
      brief:
        "The Ramos family were building what might be their workshop's last hand-made jeepney body as their routes moved to factory-built minibuses, and the youngest daughter wanted the build on film before the shop changed.",
      idea:
        "Follow one body from flat sheet to first trip over six weeks and cut it to the rhythm of the hammers: no narrator, only the family talking while they work and the sound of each stage of the build.",
      outcome:
        "A twelve-minute documentary with Filipino and English subtitles, first shown on a bedsheet in the workshop yard for the whole street, then at a student film night. The family now shows customers a two-minute cut of it.",
    },
    panels: [
      { kind: "motion", caption: "Sparks over the bonnet at dusk, the opening frame." },
      { kind: "motion", caption: "Mang Edwin's hands on the hood template, held long and silent." },
      { kind: "process", caption: "Transcript lines pinned to the bedroom wall: the paper edit." },
      { kind: "process", caption: "The timeline, every hammer hit marked as a beat." },
      { kind: "motion", caption: "The first trip down the street, the closing shot." },
      { kind: "quote", caption: "“Every dent is somebody's hour.” Mang Edwin, on the last panel." },
    ],
    assetsUsed: [],
    aiHelp: "assisted",
    process:
      "Shot on a borrowed mirrorless camera with two clip-on microphones. AI speech-to-text gave a first transcript; every line was corrected and the subtitles translated by hand with the family.",
  },
  {
    id: "tindahan-huling-biyahe",
    makerId: "joven-paguio",
    title: "Huling Biyahe",
    client: {
      name: "Tindahan",
      what: "A four-piece neighbourhood band that rehearses in the room above a corner store",
    },
    kind: "motion",
    themes: ["story", "place"],
    tagline: "One night, one street, every scene change on the snare.",
    role: "Editor and camera",
    year: 2025,
    palette: ["#0d0f1a", "#ffcc33", "#e2445c", "#2ec4b6", "#f7f3e8"],
    story: {
      brief:
        "The band had one weekend, no budget and a single about catching the last ride home, and wanted a video that looked like their own street at night.",
      idea:
        "Shoot the band and their neighbours in a single night between the corner store, the basketball court and the last jeepney stop, then cut every change of place on the snare so the street seems to keep time with the drummer.",
      outcome:
        "A three-minute video, a vertical cut for phones and a short loop for the store's own screen. The band played the court the next month, and the neighbours from the video sang the chorus back.",
    },
    panels: [
      { kind: "motion", caption: "The store shutter half down, the first snare." },
      { kind: "motion", caption: "The court under one floodlight, the chorus." },
      { kind: "process", caption: "The drummer's beat map, counted together on a notebook page." },
      { kind: "motion", caption: "The last ride home, cut on the final hit." },
      { kind: "device", caption: "The vertical cut, for the band's own page." },
    ],
    assetsUsed: [],
    aiHelp: "none",
    process:
      "Shot in one night on a borrowed camera and a phone gimbal, cut by hand to a beat map counted with the drummer. No generated imagery.",
  },

  // Half Landing
  {
    id: "brackenbrae-library-wayfinding",
    makerId: "half-landing",
    title: "Brackenbrae Library",
    client: {
      name: "Brackenbrae Library",
      what: "A red-sandstone district library reopening after a roof repair, with a new children's floor in the old attic",
    },
    kind: "spatial",
    themes: ["place", "education"],
    tagline: "Every floor gets a band of colour at hand height, like a tiled close.",
    role: "Identity, wayfinding and signs",
    year: 2025,
    palette: ["#f3ece2", "#8e3b2f", "#2f5d62", "#e3b448", "#1f1f1f"],
    story: {
      brief:
        "The library had three floors, two staircases and a lift added decades later, and visitors kept ending up at the staff room door looking for the children's books.",
      idea:
        "Treat each floor like a tiled tenement close: one band of colour at hand height along every wall, a different colour per floor, with floor numbers big enough to read from the bottom of the stair.",
      outcome:
        "A wordmark, colour bands on three floors, enamel door signs, a stair map and a children's floor that is the only one painted to the ceiling. The staff stopped fielding the staff-room question in the first week.",
    },
    panels: [
      { kind: "hero", caption: "The stair from the ground floor, three colour bands in view." },
      { kind: "logo", caption: "The wordmark, drawn from the carved letters over the door." },
      { kind: "mockup", scene: "sign", caption: "Enamel door sign for the reading room." },
      { kind: "series", caption: "Three floors, three bands at hand height." },
      { kind: "process", caption: "Walking the building with the staff and a roll of coloured tape." },
      { kind: "type", caption: "Floor numbers drawn to read from the bottom of the stair." },
    ],
    assetsUsed: [],
    aiHelp: "none",
    process:
      "Bands tested full size with coloured tape before anything was painted; door signs enamelled by a local sign maker. No generated imagery.",
  },
  {
    id: "back-court-days",
    makerId: "half-landing",
    title: "Back Court Days",
    client: {
      name: "Back Court Days",
      what: "A weekend when tenement neighbours open their shared back courts for music, food and swaps",
    },
    kind: "brand-identity",
    themes: ["place", "identity"],
    tagline: "Twelve back courts, one washing line, two inks.",
    role: "Identity, posters and print",
    year: 2026,
    palette: ["#f6f1e7", "#e94f37", "#1c3144", "#ffd23f"],
    story: {
      brief:
        "A residents' group on the Southside wanted twelve back courts to feel like one festival, with no budget for anything but paper, tape and paint.",
      idea:
        "A mark drawn from the view every back court shares, washing lines seen from a top-floor window, in a few lines and pegs, screen-printed in two inks on whatever paper the neighbours donated.",
      outcome:
        "Posters for every close door, a map, bunting cut from print offcuts, tote bags and chalk stencils for the pavement. Twelve courts opened on the first weekend and nineteen the next year.",
    },
    panels: [
      { kind: "hero", caption: "Posters on the close doors along one street, the Friday before." },
      { kind: "wordmark-pattern", caption: "The washing-line mark, repeated as bunting." },
      { kind: "series", caption: "Twelve courts, twelve posters, one two-ink system." },
      { kind: "mockup", scene: "tote", caption: "Totes printed from the poster screens." },
      { kind: "process", caption: "Printing on donated paper in the studio's back room." },
      { kind: "quote", caption: "“We met the folk across the court for the first time.” A neighbour at number 40." },
    ],
    assetsUsed: [],
    aiHelp: "assisted",
    process:
      "Drawn by hand and screen-printed in the studio. AI used only to lay out a first draft of the court map from a typed list of addresses; every court was then checked on foot.",
  },
  {
    id: "stone-by-stone-repairs",
    makerId: "half-landing",
    title: "Stone by Stone",
    client: {
      name: "Southside Close Repairs Fund",
      what: "A housing association fund helping tenement owners agree and pay for shared stonework repairs",
    },
    kind: "presentation",
    themes: ["education", "empowerment"],
    tagline: "One tenement front, drawn stone by stone, so a whole close can vote.",
    role: "Deck, guide and information drawing",
    year: 2024,
    palette: ["#f1e9dc", "#a2482f", "#3d5a80", "#98c1d9", "#293241"],
    story: {
      brief:
        "Owners were asked to agree shared sandstone repairs costing thousands each from a factor's letter full of jargon, and most owners' meetings ended without a vote.",
      idea:
        "A short deck and a fold-out guide that show one tenement front stone by stone: which stones are damp, which are cracked, what the scaffolding is for and what each flat pays, drawn as a section through the close.",
      outcome:
        "A twelve-slide deck for owners' meetings, a fold-out guide posted through every door and a cost card per block. Four of the first five blocks voted to go ahead at their first meeting.",
    },
    panels: [
      { kind: "hero", caption: "The tenement front drawn stone by stone, damp in blue." },
      { kind: "slides", caption: "Twelve slides for a meeting held in the close." },
      { kind: "mockup", scene: "card", caption: "The cost card: one block, each flat's share." },
      { kind: "process", caption: "Surveying a front with the stonemason, chalk on the cracked stones." },
      { kind: "series", caption: "The fold-out guide: front, close and back court." },
    ],
    assetsUsed: [],
    templateId: "pitch-deck",
    aiHelp: "none",
    process:
      "Every stone drawn from survey photographs and checked on the scaffold with the stonemason. No generated imagery.",
  },

  // Ari Matenga
  {
    id: "six-oclock-tide-clock",
    makerId: "ari-matenga",
    title: "Tide Clock",
    client: {
      name: "Six O'Clock Swimmers",
      what: "A year-round sea-swimming club that meets at a harbour beach at six every morning",
    },
    kind: "ui-ux",
    themes: ["technology", "place"],
    tagline: "A clock face that is the beach: one line of water, and six o'clock.",
    role: "Web piece, hardware and installation",
    year: 2025,
    palette: ["#0b2233", "#7fb7be", "#f4efe6", "#e07a5f", "#3d405b"],
    story: {
      brief:
        "Swimmers checked three websites and a group chat every night to know whether the tide would cover the rocks at six, and the warnings about swimming after heavy rain lived somewhere else again.",
      idea:
        "A clock face drawn as the beach itself: one slow line of water rising and falling across the rocks, the hour marked at six, the water temperature beside it and the after-rain warning as the only change of colour. It runs in the browser and on an e-paper screen in the clubhouse window.",
      outcome:
        "A web piece the club opens at night, and a solar e-paper clock in the clubhouse window that wakes every ten minutes and has run since winter without a charge. The 'is it high?' messages in the group chat stopped.",
    },
    panels: [
      { kind: "motion", caption: "The tide line rising over the rocks, an hour in four seconds." },
      { kind: "device", caption: "The clock on a phone at night, six o'clock marked." },
      { kind: "process", caption: "Checking the prediction against the rocks at six, ten mornings running." },
      { kind: "device", caption: "The e-paper clock in the clubhouse window." },
      { kind: "quote", caption: "“The only clock I trust before coffee.” A club regular." },
    ],
    assetsUsed: [],
    aiHelp: "assisted",
    process:
      "Tide heights computed in the browser from published harmonic constants. AI helped draft the first version of the prediction code, which was then checked line by line against the official tide tables for a month.",
  },
  {
    id: "gully-radio-posters",
    makerId: "ari-matenga",
    title: "Gully Radio Posters",
    client: {
      name: "Gully Radio",
      what: "A volunteer-run community radio station broadcasting forty shows a week from a converted shop",
    },
    kind: "brand-identity",
    themes: ["technology", "identity"],
    tagline: "Forty hosts, one tool: every poster different, every one the station's.",
    role: "Generative poster tool and identity system",
    year: 2025,
    palette: ["#f7f0e1", "#ff5c39", "#1d6fd8", "#ffd447", "#111111"],
    story: {
      brief:
        "Forty volunteer hosts each made their own weekly poster with whatever they had to hand, and the station looked like forty different stations.",
      idea:
        "A browser tool any host can use in two minutes: type the show name and time, paste the week's playlist, and the tool draws a pattern from the tempo and length of each track, always in the station's type and four inks, always ready for the station's risograph.",
      outcome:
        "Over two thousand posters made by hosts in the first year, an animated version for phones and a station window that changes every week.",
    },
    panels: [
      { kind: "hero", caption: "A week of posters in the station window." },
      { kind: "device", caption: "The tool: show name, time, playlist, print." },
      { kind: "series", caption: "One show, three weeks, three playlists, three patterns." },
      { kind: "motion", caption: "The phone version, drawn track by track." },
      { kind: "process", caption: "Hosts trying the tool at the Thursday volunteers' meeting." },
    ],
    assetsUsed: [],
    templateId: "event-post-set",
    aiHelp: "none",
    process:
      "Patterns drawn by hand-written code from each track's tempo and length, printed on the station's own risograph. No AI in the tool and no generated imagery.",
  },
];

/** Art direction for every generated picture of this maker's work: medium, rendering, light, composition, in 1–2 sentences. */
export const looks: Record<string, string> = {
  "kertu-vaher":
    "Clean civic interface screens in large, high-contrast type on phones, tablets and outdoor pier screens, photographed in use outdoors in flat grey northern winter light with sleet, frost and harbour grey behind. Gloved hands, steady straight-on framing, one warm amber accent against navy and frost white.",
  "joven-paguio":
    "Documentary film stills in a 16:9 frame from a handheld camera, mixed light of welding sparks, sodium street lamps and fluorescent tubes on brushed steel and humid night streets, natural grain and slight motion blur. Faces and hands close, the background busy and alive.",
  "half-landing":
    "Graphic design photographed in place in Glasgow tenements and civic buildings: screen-printed posters, enamel signs and painted colour bands against red sandstone and glazed close tiles, under soft overcast daylight. Front-on, architectural framing with the building always in the picture.",
  "ari-matenga":
    "Small screens and generative graphics in the world: e-paper and phone displays, risograph prints and fine line animation, shot at dawn on a harbour beach or in a shop window, in cool sea blue and warm sand with one coral accent. Close, quiet framing with salt, wet rock and morning haze.",
};

/** A prompt for this maker's profile portrait (a photo of a person who does not exist, never a real one). */
export const portraitPrompts: Record<string, string> = {
  "kertu-vaher":
    "Editorial portrait photograph of an Estonian woman in her late thirties, a UI and UX designer, straight fair hair tucked into a knitted hat, grey wool coat and fingerless gloves, holding a phone and a clipboard of paper screen sketches on a windswept ferry pier in winter. Flat grey northern daylight, 50mm lens, natural skin texture, calm direct gaze; a private person, not a celebrity or any real individual.",
  "joven-paguio":
    "Editorial portrait photograph of a Filipino man in his mid-twenties, a video editor, short black hair, faded band T-shirt and over-ear headphones round his neck, seated on a bed in a small rented room with printed transcript strips pinned to the wall behind him and a laptop open on his knees. Warm desk-lamp light mixed with a cool laptop glow, 35mm lens, natural skin texture, easy grin; a private person, not a celebrity or any real individual.",
  "half-landing":
    "Editorial team photograph of six designers, a mix of ages from late twenties to fifties and of backgrounds, three women and three men, standing and sitting together in a bright first-floor tenement studio with tall sash windows, a screen-printing table, posters pinned to the walls and a plan chest. Soft overcast Glasgow daylight, 35mm lens, natural skin texture, relaxed and mid-conversation; private people, not celebrities or any real individuals.",
  "ari-matenga":
    "Editorial portrait photograph of a Māori man in his late thirties, a creative technologist, short curly dark hair, navy hoodie with the sleeves pushed up and a towel over one shoulder, holding a small e-paper screen at a harbour beach at dawn with a soldering kit in a tin beside him on the sea wall. Soft pre-dawn blue light with a warm sunrise rim, 50mm lens, natural skin texture, easy smile; a private person, not a celebrity or any real individual, no carvings, tattoos or cultural ornaments.",
};
