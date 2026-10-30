import type { Persona } from "./types";

/** Half Landing is a studio team, so this bible describes six people working as one. */
export const persona: Persona = {
  makerId: "half-landing",
  studio: {
    training:
      "Six designers who met through the city's art school, a sign-making apprenticeship and a housing association's communications team. Isla Ferrie and Callum Dowie started the studio after a decade designing public signs; Aamir Siddiqui leads print and screen printing, Eilidh Gourlay leads wayfinding and drawing, Tomasz Wrona looks after type and production files, and Niamh Sweeney runs projects and every workshop with residents. Everyone draws, everyone prints, and the whole team walks every building.",
    room:
      "A first-floor flat in a red-sandstone tenement on the Southside, up a tiled close with a window on the half landing that gave the studio its name. The front room has tall sash windows, a big shared table, a plan chest of past signs and posters, and the back bedroom is the print room: a screen-printing bed, a drying rack, a washout booth and shelves of donated paper.",
    tools: [
      "Screen-printing bed with hinged clamps, aluminium screens and a set of squeegees in three widths",
      "A plan chest of full-size sign proofs and enamel samples from the local sign maker",
      "Rolls of coloured masking tape and a laser measure for testing bands and signs on site at full size",
      "Large-format printer for full-size sign and poster proofs taped up in the building",
      "Vector drawing and layout software shared on one file server, with one master file per project",
      "Clipboards, survey photographs and chalk for walking buildings with staff and residents",
      "A kettle and enough mugs for a residents' meeting of twenty",
    ],
    materials: [
      "Vitreous enamel sign plates fired by a local sign maker, for door and floor signs that outlast the paint",
      "Water-based screen-printing inks, two at a time, on donated and offcut paper",
      "Emulsion paint matched by eye to sandstone and glazed close tiles",
      "Uncoated card for fold-out guides posted through letterboxes",
      "Chalk and stencils for pavement marks that wash off in the next rain",
    ],
    hours:
      "Nine to half five, Monday to Thursday, with lunch eaten together at the big table. Fridays are for site visits and printing; the print room runs late before any festival. Residents' workshops are held in the evenings or on Saturday mornings, when people are home.",
  },
  hand: {
    line:
      "Drawn at the size it will be seen: thick, confident lines and big flat colour, worked out in tape on the wall before any file is made. Shapes come from the buildings themselves, the band of a tiled close, the rectangle of a back court, the outline of a tenement front.",
    signatureMoves: [
      "A band of colour at hand height, after the tiled dado of a tenement close, used to mark floors, routes or zones",
      "Everything tested full size in place with tape and paper before it is made",
      "Two inks only on printed matter, overprinted for a third colour",
      "Plain words on every sign, checked aloud with the people who work in the building",
    ],
    motifs: [
      "The hand-height colour band of a tiled close",
      "Washing lines and pegs seen from a top-floor window over a back court",
      "Tenement fronts drawn stone by stone, as a section or an elevation",
    ],
    type:
      "A broad, low-contrast grotesque for signs, with large, open numerals drawn to be read from the bottom of a stair; display lettering sometimes traced from carved stone lettering on the building itself. Sentence case, generous spacing, nothing condensed.",
    keptImperfections: [
      "Screen-print misregistration and ink build-up at the edges of a pull",
      "Tape marks and pencil notes on full-size proofs, photographed on site",
      "Uneven donated paper colours across a poster run",
      "Hand-drawn lines kept slightly wobbly rather than redrawn as perfect vectors",
    ],
  },
  palette: {
    early: ["#ffffff", "#000000", "#e30613", "#ffd500"],
    current: ["#f3ece2", "#8e3b2f", "#2f5d62", "#e3b448", "#1f1f1f"],
    why:
      "The founders' early sign work used regulation white, black and a safety red and yellow. Working inside tenements and old libraries turned them to the colours already in the buildings: the deep red of the sandstone, the bottle green and teal of glazed close tiles and a mustard from the old enamel street signs, on a warm off-white.",
  },
  subjects: {
    clients:
      "Libraries and community centres, residents' groups and housing associations, small festivals, a tenement repairs fund, a swimming baths reopened by its community and the occasional bakery on the corner.",
    places: [
      "Tiled tenement closes and their half-landing windows",
      "Back courts with washing lines, bins and shared greens",
      "Red- and blond-sandstone libraries and halls with carved lettering over the door",
      "Southside streets of four-storey tenements",
      "The open-access print workshops of the Merchant City",
    ],
    returningClient:
      "Back Court Days, the residents' festival, which comes back each spring for a new poster colour and more courts on the map.",
  },
  presentation: {
    camera:
      "A full-frame camera with a 24mm shift lens for buildings and a 50mm for printed work; always in place, never on a white backdrop.",
    light:
      "Soft overcast daylight, the usual Glasgow sky, through tall windows or on the street; no flash, no styled studio light.",
    surfaces:
      "Red sandstone, glazed close tiles, painted plaster, close doors with glass panels, and the big shared studio table.",
    framing:
      "Front-on and architectural, verticals kept straight, the building always in the picture so the work is shown at the size it is seen.",
  },
  voice: {
    captions:
      "Written as 'we', plain and a bit cheeky, naming the people in the building: 'Floor two, teal. The librarians picked it.' Occasional Scots where the residents used it; no exclamation marks.",
    neverSays: ["placemaking", "iconic", "world-class", "activation", "stakeholder journey", "cutting-edge"],
  },
  respect: {
    exclude: [
      "No church or cathedral buildings, religious symbols or any Orange or Green marching or sectarian imagery and colours",
      "No football club colours, crests or rivalries as decoration",
      "No city coat of arms or civic heraldry, and no real council or library service branding",
      "No tartan, bagpipes or kilts as shorthand for Scotland",
      "No real libraries, festivals, housing associations or factors; every client and building name is invented",
      "No residents' real faces or addresses; neighbours appear from behind or at a distance",
    ],
    askAReader: [
      "Does 'Half Landing' read naturally as a Glasgow studio name, after the tenement stair window?",
      "Would a Glasgow library wayfinding project add Gaelic to its signs, and should the studio's languages include it?",
      "Do the hand-height colour bands read as the tiled close they come from, or as plain institutional stripes?",
    ],
  },
  sources: [
    {
      url: "https://www.glasgowlife.org.uk/libraries/family-history/stories-and-blogs-from-the-mitchell/tenements-times-past",
      used: "Wally closes are tenement closes whose lower half is decoratively tiled: the source of the hand-height colour band.",
    },
    {
      url: "https://architextures.org/stories/tenement-tiles",
      used: "Tenement close tiles are tube-lined, transfer-printed or moulded, chosen for durability and easy cleaning in shared stairs; tiling often runs to about four feet.",
    },
    {
      url: "https://coloricombo.substack.com/p/what-is-a-wally-close",
      used: "'Wally' means china or ceramic, and a tiled close marked a better-quality tenement: background for the studio's affection for the close.",
    },
    {
      url: "https://www.dezeen.com/2016/04/09/collective-architecture-glasgow-womens-library-steel-lift-extension-renovation-scotland/",
      used: "Glasgow's sandstone district libraries date from the early 1900s, with carved stonework and engraved lettering, and later lift extensions: the invented Brackenbrae Library's building.",
    },
    {
      url: "https://bwlgroup.co.uk/tender-search/glasgow-life-estate-signage-refresh/",
      used: "The city's cultural venues, libraries among them, regularly tender internal and external wayfinding refreshes: the kind of job the studio wins.",
    },
    {
      url: "https://greatergovanhill.com/latest/big-back-court-brings-govanhill-residents-together-during-lockdown",
      used: "Southside residents have turned shared back courts into meeting places after clean-ups: the seed of the invented Back Court Days.",
    },
    {
      url: "https://www.scottishcommunityalliance.org.uk/?p=1370",
      used: "Housing associations improve tenement back courts with residents block by block: background for the festival's courts and its clients.",
    },
    {
      url: "https://www.glasgowheritage.org.uk/?p=59306",
      used: "Sandstone decays when persistently damp, and decayed stone is replaced with matching indents of new stone: what the Stone by Stone drawings show.",
    },
    {
      url: "https://urbanrealm.com/features/645/Tenement_Maintenance%3A_Stone_broke.html",
      used: "Flat owners must agree shared tenement repairs with co-owners, usually through a factor, and costs can be very high: the problem the repairs deck answers.",
    },
    {
      url: "https://www.glasgowdoorsopendays.org.uk/events/trongate-103---glasgow-print-studio",
      used: "The city has open-access print workshops for screen printing and relief printing in the Merchant City: where the team learned and still borrows a bigger bed.",
    },
  ],
};
