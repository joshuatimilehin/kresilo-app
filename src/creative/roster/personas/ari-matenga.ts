import type { Persona } from "./types";

export const persona: Persona = {
  makerId: "ari-matenga",
  studio: {
    training:
      "Did a creative technologies degree in the city, where responsive environments, physical computing and audience interaction were taught side by side with design. Spent five years as a front-end developer for an agency while building installations at night, then went freelance to make small tools and pieces for designers, clubs and community groups who would never hire an agency.",
    room:
      "A garage workshop behind a weatherboard villa in a western suburb, with the roller door open on dry days. A long bench with a soldering station and a parts drawer, a pegboard of cables and small screens, a shelf of e-paper panels in anti-static bags, a laptop on a stand and a wetsuit drying on the back fence.",
    tools: [
      "A laptop with a code editor and a local web server, and the browser's developer tools open on a second screen",
      "Small microcontroller boards with Wi-Fi, a temperature-controlled soldering iron and a cheap bench multimeter",
      "E-paper display panels, small solar cells, charge controllers and sealed battery packs",
      "A creative-coding library for drawing generative graphics in the browser",
      "An old tablet and three old phones kept for testing on the slowest likely screen",
      "A waterproof notebook and a pencil for checking predictions on the beach",
      "The community station's risograph, borrowed on Thursday nights",
    ],
    materials: [
      "Published tidal harmonic constants and official tide tables for the harbour's standard port",
      "Open water-quality and after-rain swimming advice from the council's beach service",
      "Playlist data typed in by hosts: track names, lengths and tempos",
      "Marine-grade enclosures, silicone sealant and stainless screws for anything that lives near salt",
      "Recycled screens and boards wherever they will do the job",
    ],
    hours:
      "Swims at six with the club most mornings, tests whatever is running on the beach, then codes from eight until mid-afternoon. Late afternoons are for soldering and enclosures; Thursday evenings at the radio station with the hosts.",
  },
  hand: {
    line:
      "One fine, slow line doing the work: a tide curve, a waveform, a stripe drawn per track. Graphics are spare and calm, move gently and rest most of the time; hardware is small, sealed and quiet, with screens that sleep between updates.",
    signatureMoves: [
      "A single line of data drawn as a landscape, the tide or the playlist becoming the picture",
      "Screens that update every few minutes and sleep in between, so a piece can run on a small solar cell for years",
      "Every piece tested where it will live, at the hour it will be used",
      "Tools anyone at the client can run in two minutes, with nothing to install",
    ],
    motifs: [
      "The tide line across barnacled rocks, with a single mark at six o'clock",
      "Stacked stripes whose widths and colours come from a playlist's track lengths and tempos",
      "Small grey e-paper screens in windows, half-lit by dawn",
    ],
    type:
      "One sturdy monospaced face for numbers and times, and a friendly grotesque for names, set small and left-aligned. Time and height always shown as plain figures, never as icons alone.",
    keptImperfections: [
      "E-paper ghosting from the previous update left visible",
      "Salt crust on the enclosure and a fogged window in front of the clock",
      "Risograph misregistration and roller marks on printed posters",
      "Notebook pages of prediction checks, crossed out and rewritten",
    ],
  },
  palette: {
    early: ["#000000", "#00ff9c", "#ff00aa", "#ffffff"],
    current: ["#0b2233", "#7fb7be", "#f4efe6", "#e07a5f", "#3d405b"],
    why:
      "Night installations started him on black screens and neon, which look good in a gallery and terrible in daylight. Building for beaches, windows and posters moved him to deep harbour blue, sea-glass green and sand, with one coral accent for anything that needs attention, colours that survive on e-paper, in sun and through a salty window.",
  },
  subjects: {
    clients:
      "Swim clubs, community radio, a surf lifesaving club's notice board, a library's makerspace, local designers who need a small generative tool built, and the occasional festival that wants something interactive that will not break.",
    places: [
      "Harbour beaches at six in the morning, the tide over the rocks",
      "Weatherboard villas and garage workshops in the western suburbs",
      "The converted shop of a volunteer community radio station",
      "Ferry wharves and the wake of the harbour ferries",
      "Clubhouse windows facing the water",
    ],
    returningClient:
      "Six O'Clock Swimmers, who ask for something new each summer: last year the winter water-temperature log, this year a clock for the far end of the beach.",
  },
  presentation: {
    camera:
      "A phone and a small mirrorless camera with a 35mm lens, handheld; screen recordings for motion work, always alongside a photo of the piece in its place.",
    light:
      "Dawn on the beach, overcast midday in the station window, or the bench lamp in the garage; never a studio backdrop.",
    surfaces:
      "Wet rock, salt-crusted window frames, the radio station's shop window, a workbench with solder and cables.",
    framing:
      "Close and quiet, the screen or poster in focus with the place it lives soft behind it, plenty of sea or sky.",
  },
  voice: {
    captions:
      "Easy-going and exact, giving the numbers: 'Ten mornings, predicted versus the rocks: within six centimetres.' English, with te reo Māori used plainly where the club or station uses it; no hype.",
    neverSays: ["immersive experience", "disruptive", "smart", "AI-powered", "next-gen", "metaverse"],
  },
  respect: {
    exclude: [
      "No volcanic cones (maunga) in any picture or pattern: they are ancestral to mana whenua and not a design motif",
      "No koru, carving, tā moko or other Māori visual forms used as decoration, and no tattoos in the portrait",
      "No pounamu, cloaks or any taonga as props",
      "No marae, wharenui or any ceremonial setting, and no Matariki or other celestial-calendar imagery",
      "No real radio stations, clubs, beaches' official names or council service logos; the club and station are invented",
      "No real tide or swim-safety brand names; data sources are described generically",
    ],
    askAReader: [
      "Is it right for a Māori creative technologist's bio to list te reo Māori as a writing language, or should that be his own call and left out of invented text?",
      "Does a tide clock with a single wave line read as neutral, or does it come too close to any Māori visual form?",
      "Would an Auckland swim club call itself by its meeting time, as 'Six O'Clock Swimmers' does, or is that too Australian or British a habit?",
    ],
  },
  sources: [
    {
      url: "https://www.linz.govt.nz/sea/tides/introduction-tides/definitions-tidal-terms",
      used: "LINZ standard-port tables give Auckland a spring range of about 2.8 m and a neap range of about 1.7 m, predictions in standard time and heights in metres: why the tide line moves so much at six.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Waitemat%C4%81_Harbour",
      used: "The Waitematā is the city's main harbour, with beaches and wharves along its shores: where the club swims.",
    },
    {
      url: "https://lukemiller.org/?p=2153",
      used: "Small tide clocks compute tide height on a microcontroller from per-station harmonic constituents and a real-time clock: the method behind the clock.",
    },
    {
      url: "https://instructables.com/Tide-and-Weather-Clock",
      used: "An e-paper tide clock wakes on a timer, updates and powers down, running for years on a battery: the clubhouse clock's design.",
    },
    {
      url: "https://boards.straightdope.com/t/tide-clock/815198",
      used: "Tide height is a sum of sine waves with local amplitudes and phases, so a clock needs local tables and cannot simply follow the moon: why every prediction is checked on the rocks.",
    },
    {
      url: "https://ourauckland.aucklandcouncil.govt.nz/news/2023/12/stay-safe-at-auckland-beaches-this-summer/",
      used: "The council's beach service gives real-time swim-risk advice and advises against swimming for 48 hours after heavy rain: the clock's single warning colour.",
    },
    {
      url: "https://thespinoff.co.nz/society/03-08-2019/why-i-love-winter-swims",
      used: "Winter sea swimming is popular around the city, with calmer, quieter beaches and a rule of avoiding the water after heavy rain.",
    },
    {
      url: "https://planetaudio.org.nz/about",
      used: "The city's community access station provides facilities and training so volunteers make their own shows, in many languages: background for the invented Gully Radio and its forty hosts.",
    },
    {
      url: "https://www.aut.ac.nz/news/stories/meet-auts-artist-in-residence",
      used: "The city's creative technologies degree has students building interactive light installations for public squares: his training.",
    },
    {
      url: "https://colab.aut.ac.nz/dal",
      used: "Interactive artworks are shown on public screens at city venues: the kind of work he built at night before going freelance.",
    },
    {
      url: "https://honourthemaunga.org.nz/about-tupuna-maunga-authority",
      used: "The city's volcanic cones are tūpuna maunga, ancestral mountains co-governed with mana whenua: why they are kept out of every picture.",
    },
  ],
};
