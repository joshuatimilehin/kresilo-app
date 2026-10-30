import type { Persona } from "./types";

/** Dorian Voss, Detroit: one lens, existing light, contact sheets marked by hand. */
export const persona: Persona = {
  makerId: "dorian-voss",
  studio: {
    training:
      "Took a community college photography certificate in one of the last cohorts with a working wet darkroom, then spent three years assisting an industrial photographer who shot supplier catalogues: brake rotors, stamped brackets and castings under one hard light. That taught him to read surfaces and to stop waiting for nicer light. He has been working on his own for two years and still develops every roll himself.",
    room:
      "A rented live-work unit on the third floor of a 1910s factory in Milwaukee Junction, with steel-framed windows and a freight lift. The bathroom is blacked out as a darkroom for developing film; the main room has a light box on a door laid across two trestles, a corkboard wall of contact sheets pinned in rows, a flat file of prints and a bicycle by the door.",
    tools: [
      "A manual 35mm film SLR with one 35mm lens, the only lens he owns",
      "A small on-camera flash, used direct and bare after dark",
      "Stainless steel developing tanks, a changing bag and a dial thermometer",
      "A contact printing frame and a light box",
      "A 10x loupe and red and white grease pencils",
      "A flatbed scanner with a film holder, for contact sheets and negatives",
    ],
    materials: [
      "400-speed traditional-grain black-and-white film, rated at 1600 and pushed two stops in development",
      "Resin-coated paper for contact sheets; fibre paper only for exhibition prints",
      "Colour negative film, used once, for the film-night posters' photographed foregrounds",
      "Newsprint zines folded and stapled by hand",
      "Grease pencil for every mark on a contact sheet, never a marker",
    ],
    hours:
      "Walks at shift-change hours, around seven in the morning, three in the afternoon and eleven at night, because that is when buildings are busiest and emptiest at once. Develops film on Sundays, prints contact sheets on Mondays and marks them up at the kitchen table that evening. Rarely shoots in daylight on a weekday afternoon.",
  },
  hand: {
    line:
      "Deadpan, straight-on frames at chest height with level verticals, on pushed film that drops shadows to solid black and lets fluorescent tubes and wet concrete blow to white. Grain is visible everywhere and treated as texture, not noise.",
    signatureMoves: [
      "Straight-on, centred and level, never tilted, never from a dramatic low angle",
      "Only the light the building already has; direct on-camera flash after dark, hard and unapologetic",
      "Work shown first as a contact sheet, keepers boxed in red grease pencil with crop lines drawn in",
      "People appear only when they have said yes, looking back at the lens, and they approve their frames",
    ],
    motifs: [
      "Rows of fluorescent tubes receding along a ceiling",
      "An empty parking lot at night with painted lines and a single lamp pole",
      "A red grease-pencil box around one frame on a contact sheet",
    ],
    type:
      "Titles in plain condensed sans capitals with one red rule underneath; frame numbers, dates and times written by hand in grease pencil. Exhibition captions give place, time and nothing else.",
    keptImperfections: [
      "Heavy grain from pushing two stops",
      "Blown highlights on fluorescent tubes and lamp heads",
      "Film rebate edges and frame numbers left in the scan",
      "A grease-pencil smudge across a frame he did not choose",
    ],
  },
  palette: {
    early: ["#2b2d42", "#ef233c", "#edf2f4", "#8d99ae"],
    current: ["#0b0c10", "#66fcf1", "#c3073f", "#f5f5f5"],
    why:
      "His first palette was simply black-and-white film and the red grease pencil: charcoal, paper white, a cool grey and the red of the marks. The film-night posters brought colour in for the first time, as cyan and crimson in the generated skies, while everything he photographed below the horizon stayed close to black and white.",
  },
  subjects: {
    clients:
      "Workers' co-operatives and small manufacturers, neighbourhood papers, architects recording buildings before and after work, and small film nights and venues that need posters.",
    places: [
      "Milwaukee Junction's factory blocks, where he lives and walks",
      "Foundry and plant gates at shift change",
      "Parking lots and parking structures downtown early on a Sunday",
      "The riverfront walk at night, with the far shore lit across the water",
      "The market sheds before dawn on a Saturday",
    ],
    returningClient:
      "Foundry Co-op, which hired him to show the work as the members see it and now asks him back each January to photograph the hour between shifts for its members' report.",
  },
  presentation: {
    camera:
      "The 35mm SLR and its one 35mm lens, handheld at chest height; contact sheets and prints scanned flat, never photographed at an angle.",
    light:
      "Hard fluorescent overheads or a direct on-camera flash; sodium and LED street light at night; no softboxes, no reflectors.",
    surfaces:
      "Contact sheets on the light box or pinned to cork; exhibition prints taped to painted cinderblock in a break room.",
    framing:
      "Straight-on and centred, buildings filling the frame edge to edge; series shown as a full contact sheet of thirty-six frames with red marks.",
  },
  voice: {
    captions:
      "Blunt and specific: place, time, film speed. 'Gate 3. 2:58 pm. Rated 1600.' He asks a question in the caption when he does not know something.",
    neverSays: ["ruin", "abandoned beauty", "comeback city", "gritty", "urban exploring", "hauntingly"],
  },
  respect: {
    exclude: [
      "Ruin-photography clichés: burnt or derelict houses, famous derelict landmarks, decay staged as beauty",
      "Residents shown as props for poverty; people appear only as consenting, named workers",
      "Churches, crosses and religious murals",
      "Real automaker, union and sports team logos and marks",
      "Police, weapons and crime scenes",
      "Copies of real murals and street art",
      "Real people's faces in the generated parts of an image",
    ],
    askAReader: [
      "Does a foundry co-operative feel like a real kind of Detroit workplace today, or a cliché of the motor city?",
      "Do generated skies over photographed streets read as honest when every poster says which part is generated?",
      "Is Milwaukee Junction plausible for an emerging photographer's rent now, or would he more likely live in another neighbourhood?",
    ],
  },
  sources: [
    {
      url: "https://parallaxphotographic.coop/guide-to-pushing-and-pulling-film/",
      used: "Pushing is longer development after underexposing; it raises contrast and grain and cannot recover shadow detail; traditional-grain films push best.",
    },
    {
      url: "https://www.35mmc.com/?p=47373",
      used: "A traditional 400-speed black-and-white film rated at 1600: the look of a two-stop push at night.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Grease_pencil",
      used: "Grease pencils (china markers) mark glossy photographic paper and are the standard tool for marking contact sheets.",
    },
    {
      url: "https://localwiki.org/detroit/Milwaukee_Junction",
      used: "Milwaukee Junction is an early-1900s factory district named for a rail junction, now mixing industry with studios and lofts.",
    },
    {
      url: "https://www.wikipedia.org/wiki/Ruin_porn",
      used: "The criticism of Detroit ruin photography for leaving residents out and aestheticising decay: the basis of his exclusions.",
    },
    {
      url: "https://www.ledlightingsupply.com/industrial-lighting/foundry-lighting",
      used: "Foundries are lit by high-bay fixtures over casting and furnace areas: the hard overhead light in his frames.",
    },
    {
      url: "https://www.metrotimes.com/arts/20-cool-ways-to-spend-summer-nights-in-detroit-30250576/",
      used: "The riverfront walk and the greenway are open until 10 pm, with views across the river to Windsor.",
    },
  ],
};
