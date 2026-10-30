import type { Persona } from "./types";

/** Mira Kesavan, Chennai: colour grading for documentaries and films, built between one warm lamp and one grey sky. */
export const persona: Persona = {
  makerId: "mira-kesavan",
  studio: {
    training:
      "Took the four-year digital intermediate course at the state film institute in Taramani, in the years when the city's films were moving from film scans to digital grading. Spent nine years as an assistant in a large post house in Saligramam, conforming timelines and matching dailies through the night, then graded advertising films before features. She went independent in her forties and still runs every new grader she trains through one exercise: the same shot, three ways.",
    room:
      "A rented grading suite on the second floor above a dubbing studio, in a lane off Arcot Road between Vadapalani and Kodambakkam. The walls are painted mid-grey, the windows are blacked out, every bulb is daylight-balanced, and a strip light behind the reference monitor sets the room's only glow. A dehumidifier runs from October to December. In the corner stands an old sodium street lantern she rescued when the road outside went over to white LEDs; she switches it on before a night-scene grade to remind her eye, then off again.",
    tools: [
      "A grading panel with three trackballs and rings, for lift, gamma and gain",
      "A 10-bit reference monitor set to the broadcast standard: D65 white, 2.4 gamma, 100 nits",
      "A colorimeter probe, run against the monitor on the first working day of every month",
      "A second screen kept for scopes only: waveform, vectorscope with the skin-tone line, and an RGB parade",
      "A grey card and a printed chip chart, shot by every camera on day one of a shoot",
      "A client monitor at the back of the room, so directors never lean over her shoulder",
      "A ruled notebook with three columns per scene: what the camera saw, what she matched, what she chose",
    ],
    materials: [
      "Camera originals in log, never graded from proxies",
      "Grain plates she shot herself on 35mm stock against a grey card and had scanned, applied last at one size across all cameras",
      "A folder of monsoon-sky reference stills taken from her terrace in Ashok Nagar each October to December",
      "Looks built as her own starting nodes, never baked into the footage",
      "Matte paper prints of key frames, pinned in threes on a cork strip by the door",
    ],
    hours:
      "Grades from ten until six in the dark, with a hard stop for tea at four and five minutes outside to reset her eyes. Reviews with directors run late in the evening when they are free. In the monsoon she grades on the battery backup through power cuts and saves every ten minutes. Saturday afternoons belong to the volunteer film club.",
  },
  hand: {
    line:
      "Every grade sits between two anchors: a rain-grey teal in the sky and shadows, and a sodium-orange in the practical lights. Skin stays on the vectorscope's skin line, blacks are lifted a touch rather than crushed, highlights roll off softly round the lamps, and grain goes on last so three different cameras look like one.",
    signatureMoves: [
      "Shows every grade as a triptych of the same frame: flat log on the left, the match in the middle, her final on the right",
      "Two colour chips, lamp and sky, placed beside the frame instead of a full palette",
      "Wide establishing frames in a 2.39:1 letterbox with the horizon low and wet road carrying the warm light",
      "Leaves a little of a location's own green or blue cast in when it belongs to the place, and writes down why",
    ],
    motifs: [
      "One sodium-orange lamp and its long reflection on a wet road",
      "A band of rain-grey sky taking up the top two-thirds of the frame",
      "Vertical streaks of light in puddles and on a bus window, never a clean surface",
    ],
    type:
      "Title cards in a narrow, widely tracked sans-serif in lowercase, Tamil set above English at the same size, placed small in the lower letterbox bar and never over the picture.",
    keptImperfections: [
      "Heavy, even film grain over every shot",
      "Soft halation round street lamps and headlights",
      "Raindrops on the lens left in when the camera was really in the rain",
      "A slight difference in texture from the third camera, kept rather than polished away",
    ],
  },
  palette: {
    early: ["#222831", "#00adb5", "#eeeeee", "#ff7b54"],
    current: ["#0b3d4a", "#e0a458", "#e9f1f1", "#7a3b2e"],
    why:
      "Her advertising years trained her in clean charcoal, bright cyan, white and coral, and she still uses that set for teaching because it reads on any club projector. The monsoon documentary turned her the other way: once the city's sodium lamps gave way to white LEDs, she started grading towards the old amber light from memory, with a deep wet teal, a brick red from rusted shutters and a whiter-than-grey rain sky.",
  },
  subjects: {
    clients:
      "Documentary features, independent Tamil films, a few advertising films a year, music videos for friends, and volunteer film clubs that want to learn colour without expensive tools.",
    places: [
      "The post-production lanes of Vadapalani and Kodambakkam after dark",
      "Arcot Road traffic in the rain, seen from her suite's stairwell",
      "Besant Nagar beach under a monsoon sky",
      "Pondy Bazaar's shopfronts at night, the first street to go over to white light",
      "Her terrace in Ashok Nagar, where she photographs the sky every rainy evening",
    ],
    returningClient:
      "Open Cinema Club, the volunteer film club, which asks her back every January to run its six-evening colour course from the same thirty slides.",
  },
  presentation: {
    camera:
      "Frame grabs exported straight from the timeline at full resolution, never phone photos of a screen. The suite itself is photographed handheld on a mirrorless camera at high ISO, with no added light.",
    light:
      "For stills, none: the frame is the light. For process pictures, only the monitor glow and the daylight-balanced strip behind it, with the panel's trackballs lit from the screen.",
    surfaces:
      "Frames sit on a matte black field. Process shots show the grading panel, the scopes screen and her notebook, never a styled desk.",
    framing:
      "Letterboxed widescreen frames with the horizon low; grades shown left to right as raw, match and final at equal size, with the two anchor chips in the margin.",
  },
  voice: {
    captions:
      "Dry and exact: scene number, camera, the one change that mattered. 'Sc. 41, third camera. Took the green out of the sky, left it in the tea stall.' Tamil and English, often with a small joke at her own expense.",
    neverSays: ["cinematic look", "teal and orange", "make it pop", "one-click film look", "Kollywood", "flawless"],
  },
  respect: {
    exclude: [
      "Temple towers, shrines, deities and any religious procession or festival in frame",
      "Kolam threshold drawings, flower garlands, sacred ash and forehead marks",
      "Real film stars, cut-out hoardings of actors, and political figures",
      "Political party flags and party colour schemes on walls and poles",
      "Floods shown as suffering or rescue scenes; rain is weather and light, never disaster",
      "Real post houses, film titles, posters or studio names",
      "Saris and jasmine used as exotic costume rather than everyday clothing",
    ],
    askAReader: [
      "Is a woman running her own grading suite in Vadapalani a believable path in Chennai's industry, and how would colleagues refer to her?",
      "Does her attachment to the old sodium lamps ring true now that most of the city's street lights are LED?",
      "Do Tamil-first title cards with English beneath read naturally for a documentary made in Chennai?",
    ],
  },
  sources: [
    {
      url: "https://en.wikipedia.org/wiki/Vadapalani",
      used: "Vadapalani as a Chennai neighbourhood known for its film studios, next to Kodambakkam.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Prasad_Studios",
      used: "A long-established film post-production group headquartered in Saligramam, Chennai, offering digital intermediate grading: background for her assistant years.",
    },
    {
      url: "https://en.wikipedia.org/wiki/M.G.R._Government_Film_and_Television_Training_Institute",
      used: "The state film institute in Taramani runs a four-year degree track in digital intermediate alongside cinematography, with small intakes.",
    },
    {
      url: "https://www.thenewsminute.com/tamil-nadu/northeast-monsoon-arrives-south-india-chennai-receive-spells-rain-110691",
      used: "Chennai's main rains come with the northeast monsoon from October to December: the season of her sky references and dehumidifier.",
    },
    {
      url: "https://www.c40.org/case-studies/efficient-urban-lighting-in-chennai-sodium-vapor-lamps-replaced-with-led-lights/",
      used: "Chennai replaced most of its sodium vapour street lights with LEDs, starting with T. Nagar: the reason her sodium-orange is now a remembered colour.",
    },
    {
      url: "https://blog.frame.io/2019/07/22/building-color-grading-suite/",
      used: "Grading suites use neutral grey walls, D65 bulbs throughout, no mixed colour temperatures and a bias light behind the monitor.",
    },
    {
      url: "https://backlothelp.netflix.com/hc/en-us/articles/360000591787-Color-Critical-Display-Calibration-Guidelines",
      used: "SDR reference targets: Rec.709, D65 white point, BT.1886 gamma, 100 nits peak, a dim surround and probe-based calibration.",
    },
    {
      url: "https://www.diyphotography.net/?p=79501",
      used: "Matching footage from several cameras: exposure on the waveform first, then hue and saturation on the vectorscope; mixed sensors are hardest.",
    },
  ],
};
