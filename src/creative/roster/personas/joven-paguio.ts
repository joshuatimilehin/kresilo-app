import type { Persona } from "./types";

export const persona: Persona = {
  makerId: "joven-paguio",
  studio: {
    training:
      "Took a film degree at a state university in Quezon City, where his thesis short was a cut, not a shoot: he edited a classmate's footage of her grandmother's market stall. Learned the rest by assisting a freelance editor on wedding films and corporate jobs, then by cutting friends' bands' videos for free on weekends. Two years out of school, he takes paid documentary and music work and still does one free job a year for his street.",
    room:
      "A rented room on the second floor of a family house in Sampaloc, shared with a cousin's bunk. A desk by the window with an electric fan clipped to it, an external drive on a folded towel to keep it cool, and the wall above the bed covered in printed transcript strips held with masking tape. When it rains hard he moves the drives off the floor.",
    tools: [
      "A second-hand laptop and a desktop non-linear editor, with a colour panel he uses lightly",
      "Two portable hard drives, one copy always kept at his aunt's house across the city",
      "Closed-back headphones and a small pair of desk speakers, checked against a phone speaker before every export",
      "A borrowed mirrorless camera, a phone gimbal, and two clip-on lapel microphones with a small recorder",
      "A subtitle editor for Filipino and English subtitles, timed by hand",
      "Masking tape, a highlighter and a stack of A4 printouts for the paper edit",
      "A school notebook for beat maps, counted bar by bar with the drummer or the hammer",
    ],
    materials: [
      "Interview transcripts printed in strips, one line of speech per strip, coded with the timecode in pencil",
      "Location sound recorded separately: hammers, grinders, jeepney engines, shutters, basketballs on concrete",
      "Footage from phones the family or the band shot themselves, mixed in with his own",
      "Hand-painted route boards and workshop chalk marks, filmed as inserts rather than drawn titles",
    ],
    hours:
      "Shoots early, before the heat and the traffic, or late at night when the street is his. Edits from two in the afternoon until the small hours with the fan on; brownouts mean he saves every few minutes. Sundays are for watching cuts with the people in them, on a bedsheet or a phone.",
  },
  hand: {
    line:
      "Cuts on sound: a hammer, a snare, a shutter, a ball on concrete. Long, silent holds on hands at work, then a quick run of short shots on the beat. Handheld frames left a little restless, and no narrator; people explain themselves while they work.",
    signatureMoves: [
      "Every change of scene lands on a sound from the place itself, not on a music hit added later",
      "One long, quiet hold on someone's hands in each film, longer than feels comfortable",
      "Subtitles in Filipino and English set low and small, timed by hand to the speaker's breath",
      "The paper edit first: the film is built on the wall from printed lines before the timeline is opened",
    ],
    motifs: [
      "Sparks and sodium light on bare steel at dusk",
      "Hand-painted route lettering and chalk marks on metal, filmed close",
      "A corner store shutter, half up or half down, marking the start or end of the night",
    ],
    type:
      "Titles are filmed, not typed: a route board, a chalk mark, a painted price. When type is needed, a plain condensed sans-serif in white, small and low in the frame, in Filipino first.",
    keptImperfections: [
      "Handheld wobble and focus searching when a moment happened fast",
      "Grinder noise and street sound left under the dialogue rather than cleaned away",
      "Lens flare from welding sparks and street lamps",
      "A jump cut kept when the speaker said it better the second time",
    ],
  },
  palette: {
    early: ["#101010", "#f5f5f5", "#ff3b3b", "#00b3ff"],
    current: ["#1b1d21", "#c9ccd1", "#e8a33d", "#b2302b", "#3f6e8c"],
    why:
      "His first band videos were graded hard: crushed blacks, punchy reds and electric blue, because that was what looked like a music video on a phone. Cutting the workshop documentary he learned to leave the light alone: steel greys, sodium amber, a deep rust red from primer paint and the blue of a wet street at dawn.",
  },
  subjects: {
    clients:
      "Families with a trade, neighbourhood bands, a small cooperative of jeepney drivers, a carinderia that wanted a short film for its anniversary, student film nights and the occasional wedding to pay the rent.",
    places: [
      "Family body shops where jeepney bodies are hammered from steel sheet over wooden forms",
      "Corner stores with rehearsal rooms above them",
      "Neighbourhood basketball courts under a single floodlight",
      "The last jeepney stop of the night, with its hand-painted route boards",
      "Carinderias where people eat standing up and talk after midnight",
    ],
    returningClient:
      "Tindahan, the band from the room above the corner store, who come back with every new single and pay in gigs, food and footage.",
  },
  presentation: {
    camera:
      "Stills pulled straight from the cut in 16:9, plus phone photos of the wall and the timeline taken where he works.",
    light:
      "Whatever was there: welding sparks, sodium street lamps, fluorescent tubes in a store, a single court floodlight, the laptop's glow at night.",
    surfaces:
      "Bare and primed steel, wet concrete, masking-taped walls of printed transcript, the laptop screen and a school notebook.",
    framing:
      "Close on hands and faces, the background busy and alive; process shots taken from the bed or the desk, a little crooked, never staged.",
  },
  voice: {
    captions:
      "Warm and quick, mixing Filipino and English the way his street does, always naming the person: 'Mang Edwin, week four. Siya ang nagsabi kung kailan puputulin.' No hype, a joke when it fits.",
    neverSays: ["cinematic masterpiece", "epic", "vibes", "authentic Filipino", "dying art", "poverty"],
  },
  respect: {
    exclude: [
      "No religious decorations, saints' figures, rosaries or devotional phrases on jeepneys, dashboards or walls; frames are chosen or cropped without them",
      "No church processions, feast-day parades or anything filmed at a religious event",
      "No real jeepney manufacturers' names or badges, and no real route names or operator plates",
      "No real bands, songs, venues or broadcasters; the band, its single and the workshop are invented",
      "No poverty framing: no slum tours, no crying close-ups for effect, no children used as decoration",
      "No political rallies, slogans or party colours around the transport modernisation debate",
    ],
    askAReader: [
      "Does a three-generation family body shop in Metro Manila read as believable for 2026, given how many have closed?",
      "Is 'Mang' plus a first name the natural way a young editor would refer to an older workshop owner on screen?",
      "Is 'Huling Biyahe' a natural song title for a last-ride-home single, or does it carry an unwanted meaning?",
    ],
  },
  sources: [
    {
      url: "https://en.wikipedia.org/wiki/Jeepney",
      used: "Jeepneys began as stretched post-war jeeps; bodies are built in small workshops, and the modernisation programme aims to retire older vehicles in favour of factory-built minibuses: the documentary's premise.",
    },
    {
      url: "https://abs-cbn.com/news/2024/4/26/end-of-the-road-philippine-jeepneys-face-uncertain-future-1201",
      used: "Modern replacement jeepneys cost three to four times a traditional one and the phase-out has faced repeated delays: why the family think this may be their last hand-built body.",
    },
    {
      url: "https://www.taipeitimes.com/News/biz/archives/2019/02/03/2003709146",
      used: "Hand-painting artists for jeepneys have dwindled from hundreds to about a dozen, and replacements look like small buses: background for filming the craft before it changes.",
    },
    {
      url: "https://www.thingsasian.com/node/1385.html",
      used: "Backyard builders use welding machines, rivets, drills, acetylene cutters, grinders and ball-peen hammers, and a body takes four to six weeks: the six-week shoot and the sounds he cuts on.",
    },
    {
      url: "https://stuartxchange.com/JeepneyCollection64.html",
      used: "Archive notes on body building: the roof goes on last and sheet metal is retouched by hammering: stages the documentary follows.",
    },
    {
      url: "https://gridmagazine.ph/story/sign-of-times-tayao-jeepney",
      used: "Jeepney signboards name the route and stops, and hand sign-painting survives in only a few Manila workshops: why route boards appear as filmed titles.",
    },
    {
      url: "https://3d-universal.com/en/blogs/understanding-jeepney-route-signs-in-manila.html",
      used: "Route signs appear as painted metal plates, cardboard behind the windscreen or clipped boards.",
    },
    {
      url: "https://reduct.video/blog/paper-edits-for-documentary-filmmakers",
      used: "A paper edit lays out the story from transcript quotes, each tagged with source clip and timecode, before the timeline: his wall of printed lines.",
    },
    {
      url: "https://dohafilminstitute.com/blog/diy-documentary-part-4-post-production",
      used: "The assembly is built from the paper edit or index cards and kept rough, then refined into a rough cut, fine cut and locked picture.",
    },
    {
      url: "https://a-indie.com/the-buildings-interview/",
      used: "Manila indie bands keep a DIY approach to their own videos and cover art: background for Tindahan's no-budget, one-night shoot.",
    },
    {
      url: "https://www.malaymail.com/news/life/2019/08/29/not-just-basketball-circumcisions-pageants-at-philippines-courts/1785455",
      used: "Neighbourhood covered courts are among the few public spaces in many communities and are used constantly: the court as the music video's stage.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Sari-sari_store",
      used: "Family-run corner stores, usually in the owner's home, are on almost every street: the band's rehearsal room above one.",
    },
    {
      url: "https://engagemedia.org/?p=18856",
      used: "Subtitling communities in Manila work comfortably across Filipino and English: his two-language subtitles, timed by hand.",
    },
  ],
};
