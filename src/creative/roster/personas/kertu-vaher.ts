import type { Persona } from "./types";

export const persona: Persona = {
  makerId: "kertu-vaher",
  studio: {
    training:
      "Studied graphic design in Tallinn, then took the two-year interaction design master's at the city's art academy, where people-centred design and service design were taught as fieldwork rather than theory. Spent six years in a digital agency's public-sector team working on parts of the state e-services, learning to design inside a shared component system and to test with people who never asked for an app. Went independent at thirty-four to take on the small services the big projects skipped.",
    room:
      "A first-floor room in a 1920s wooden 'Tallinn house' in Kalamaja, two timber wings either side of a stone staircase. One long table under the window, a wall of cork tiles for sticky notes, a shelf of printed screens in plastic sleeves, and a hook by the door for the ferry bag: thermos, clipboard, gloves, spare pens that write in the cold.",
    tools: [
      "A browser-based interface design tool with the state design system's components loaded, plus her own small kit of large-type variants",
      "Pads of square sticky notes in four colours, one colour per kind of finding: question, workaround, complaint, quote",
      "A clipboard with A5 paper phone screens printed at true size, and a pencil on a string",
      "Two old phones, one small and one with a cracked screen, for testing at the worst likely size",
      "A pocket recorder for interviews, with a consent card in Estonian and Russian",
      "Thin knitted gloves with conductive fingertips, and thick ski gloves, for testing touch targets the way commuters really use them",
      "A contrast checker and a screen reader, used on every screen before it leaves the room",
    ],
    materials: [
      "Printed paper prototypes on 120 gsm stock, stiff enough to hold in the wind on a pier",
      "The office's own documents: the old PDF timetable, noticeboard photos, the paper booking diary",
      "Open timetable and ice-road status data from the transport authority, used as the real content in every prototype",
      "Plain text in three languages from the first sketch, never placeholder words",
    ],
    hours:
      "Fieldwork weeks start at six to catch the first crossing or the library opening; she writes up notes on the boat or the bus back. Studio days run nine to five: mornings for sorting notes and sketching, afternoons for building screens. Every Friday she tests whatever exists with someone who has not seen it yet.",
  },
  hand: {
    line:
      "Big, calm type and very few elements: one answer per screen, set large enough to read at arm's length, with generous touch targets and a single status line that changes colour only when something is wrong. Nothing decorative; the warmth comes from plain words.",
    signatureMoves: [
      "The one-line status: a single sentence at the top of the screen that answers the question people actually came with",
      "Touch targets sized for gloved thumbs, tested on deck or at the desk rather than at a desk in the studio",
      "Every screen written in Estonian, Russian and English from the first paper sketch, so no language is an afterthought",
      "A paper fallback kept alive alongside every digital service, because some people will always prefer the desk",
    ],
    motifs: [
      "The departure board: three upcoming times in a column, the next one largest",
      "Square sticky notes in four colours, sorted on a window or a desk",
      "A single amber accent for 'check this', used nowhere else",
    ],
    type:
      "A sturdy, open humanist sans-serif with clear figures, set large; numerals in tabular widths so times line up on a board. Headings in sentence case, never all capitals, and no more than two weights on any screen.",
    keptImperfections: [
      "Pencil corrections left on the paper prototypes in the case study, with the commuter's initials",
      "Sticky notes photographed where they were stuck, steamed window and all",
      "Real, slightly awkward wording from interviews kept as quotes rather than polished",
    ],
  },
  palette: {
    early: ["#ffffff", "#1a1a1a", "#0072ce", "#e5e5e5"],
    current: ["#f4f6f7", "#0f2a3d", "#2f7fb5", "#f2b134", "#c8d3da"],
    why:
      "Agency work meant pure white, black and one bright system blue. Standing on piers in winter showed her that bright white glares in snow light and pale greys vanish, so she moved to a frosted off-white, a deep sea navy for text and a softer harbour blue, keeping a single amber for warnings because it reads through sleet.",
  },
  subjects: {
    clients:
      "Small public bodies and the people at the counter: a county ferry office, district libraries, a school transport service, a municipal sauna and swimming hall, a housing office replacing its paper forms.",
    places: [
      "Small-island ferry piers on the west coast at dawn, and the ice roads in hard winters",
      "Kalamaja's wooden houses and their stone staircases",
      "The former industrial courtyards of Telliskivi, where she meets other designers",
      "District library desks with a date stamp, a paper diary and a kettle",
      "Tram stops in sleet, where she watches people read screens with their hoods up",
    ],
    returningClient:
      "Laidu Ferry Office, which brings her back before every winter to check the ice-season screens with the commuters who ride the first boat.",
  },
  presentation: {
    camera:
      "A mirrorless camera with a 35mm lens, handheld at eye level; screens shown in hands and on site, never floating device mock-ups.",
    light:
      "Flat grey northern daylight outdoors, sleet and frost visible; indoors, whatever lamp is on the desk. No studio light.",
    surfaces:
      "Pier rails, ferry saloon windows, library counters, gloved hands and paper clipboards.",
    framing:
      "Straight-on and steady, the screen readable in the frame, with the place behind it in soft focus so you know where the service happens.",
  },
  voice: {
    captions:
      "Short and practical, naming who was there and what changed: 'The 6:40 crossing, week two. Car space moved to the top.' Estonian first, English second, and Russian where the service is used in Russian.",
    neverSays: ["delightful", "seamless", "user journey", "frictionless", "digital transformation", "best-in-class"],
  },
  respect: {
    exclude: [
      "No national symbols, flags or coats of arms on screens or in pictures",
      "No real ferry operators' names, liveries or ship names; the ferry office and routes are invented",
      "No real state portal or e-ID product names or logos; national log-in is described generically",
      "No folk costume, belt patterns or song-festival imagery as decoration on civic screens",
      "No real people's faces from fieldwork; commuters and readers appear from behind, as hands, or not at all",
    ],
    askAReader: [
      "Is showing Estonian and Russian side by side on a county ferry service natural, or would a west-coast island service use Estonian and English only?",
      "Does an islet name like 'Laidu' read as believable and neutral, or does it point at one real place?",
      "Would a district librarian in Tallinn ask for a library card number, or for a national log-in, when booking a room?",
    ],
  },
  sources: [
    {
      url: "https://en.wikipedia.org/wiki/Kihnu_Veeteed",
      used: "Small-island ferry routes on the west coast (Kihnu, Manilaid, Vormsi) are run by a state-contracted operator, with ice roads in cold winters: background for the invented county ferry office and its ice-road status.",
    },
    {
      url: "https://news.err.ee/1609928171/estonia-s-islands-battle-worst-ice-conditions-in-10-years-amid-ferry-stoppages",
      used: "Thick sea ice, low water and ageing vessels disrupt island ferries in hard winters, at times cutting islands off: why the app's single status line switches between ferry, ice road and closed.",
    },
    {
      url: "https://news.err.ee/1609936319/estonia-to-open-more-ice-roads-as-ferries-continue-to-struggle",
      used: "Official ice roads open to small islands when ferries cannot run, and islanders call the connection unreliable in winter.",
    },
    {
      url: "https://news.err.ee/1609896170/state-island-ferry-discount-only-applies-to-permanent-residents-from-2026",
      used: "Islander fares depend on registered residence: background for commuters being regular, known passengers who need the next boat, not a booking site.",
    },
    {
      url: "https://www.dezeen.com/courses/interaction-design-ma-estonian-academy-of-the-arts",
      used: "The art academy's two-year interaction design MA covers people-centred design, service design and tangible design: her training.",
    },
    {
      url: "https://nortal.com/insights/seamless-service-design-for-estonian-state-portal/",
      used: "The state portal's redesign extended a shared government design system and component library held to WCAG 2.2 AA, using focus groups and prototypes: why she designs inside shared components and checks contrast on every screen.",
    },
    {
      url: "https://e-estonia.com/estonia-among-the-best-countries-to-provide-digital-public-services-according-to-the-oecd/",
      used: "An OECD review recommends more user feedback, usability testing and co-design in Estonian digital public services: the case for her fieldwork weeks.",
    },
    {
      url: "https://deepbaltic.com/2015/11/23/bohemian-adventures-in-tallinns-fish-house/",
      used: "Kalamaja's 1920s–30s 'Tallinn houses' have two wooden wings either side of a central stone staircase: her studio building.",
    },
    {
      url: "https://visittallinn.ee/eng/visitor/ideas-tips/tips-and-guides/top-things-to-do-in-six-hours",
      used: "Telliskivi is a former industrial compound turned into studios and creative offices next to Kalamaja.",
    },
    {
      url: "https://keskraamatukogu.ee/en/library/eestikeelne-kirjandus-ja-muusikaosakond/",
      used: "Tallinn's public libraries offer home lending, children's services and reading rooms with set desk hours: background for the district library's desk-led booking.",
    },
  ],
};
