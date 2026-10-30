import type { Persona } from "./types";

/** Marina Costa, São Paulo: soft-shaped motion for transit and the city, tested outdoors at blue hour. */
export const persona: Persona = {
  makerId: "marina-costa",
  studio: {
    training:
      "Studied design at a São Paulo university, then took an evening technical course in 2D and 3D animation while working days in a small post-production house cutting station idents and bumpers. Ten years of making things move for screens on buses, platforms and phones taught her that motion is read in a glance, in a crowd, in bad light, so every loop has to work at arm's length on a moving train.",
    room:
      "A flat on the eighth floor of a 1960s building in Santa Cecília, two blocks from the elevated Minhocão, with one window facing west over the city. A desk with two screens and a pen tablet, a windowsill crowded with clay and card models, a small turntable and an LED panel on a clamp, and a corkboard of printed frames pinned in rows of twelve.",
    tools: [
      "A desktop with a 3D package and a compositing app, keyframed by hand on a pen tablet",
      "A mid-range phone kept on purpose, never the newest, to test every loop the way riders see it",
      "A turntable and a single LED panel for lighting clay models before animating them",
      "Wooden modelling tools and a craft knife",
      "A sketchbook of easing curves drawn as graphs before they are typed in",
      "Headphones and a metronome app for timing cuts to a beat",
    ],
    materials: [
      "Matte grey plasticine for form studies, so light shows the shape without colour",
      "Coloured card and paper for flat models of bars, discs and arcs",
      "Printed timetables and arrival-time logs, used to set how fast a motion should feel",
      "Reference photographs of stations and streets at blue hour, taken on the phone",
      "An image tool used only to try colour variations, as on the anniversary panels, every choice made by hand",
    ],
    hours:
      "Animates from late morning to early evening. At blue hour, around half past five in winter and later in summer, she takes the phone out to test the day's loop: on weekends from the Minhocão when it is closed to cars, on Sundays on Avenida Paulista when it is given to pedestrians. Renders run overnight.",
  },
  hand: {
    line:
      "Soft, matte, rounded forms with no hard edges, moving on slow-in, quick-out curves with one small overshoot before they settle. Shadows are soft and close to the form; motion blur is gentle and only on the fastest frame.",
    signatureMoves: [
      "Builds every motion from one simple form (a bar, a sphere, a disc) and lets speed carry the meaning",
      "Makes every loop seamless, so the last frame hands back to the first with no visible cut",
      "Tests each loop outdoors on an ordinary phone at blue hour before she trusts it",
      "Models the form in clay first, lights it, and matches the render to the clay",
    ],
    motifs: [
      "Three rounded bars that stretch and shrink with speed, from the Ligeiro mark",
      "A single matte sphere rolling, with type wrapped around it",
      "The blue-hour gradient: deep blue at the top, through violet, to coral and pale yellow at the horizon",
    ],
    type:
      "A rounded geometric sans-serif in lowercase, animated letter by letter so words arrive rather than appear. Portuguese first, English as a second line in a lighter weight.",
    keptImperfections: [
      "Fingerprints and tool marks on the clay models, shown in process shots",
      "A slight wobble in hand-keyframed easing that a preset would smooth out",
      "Phone-screen glare and street reflections in the outdoor test recordings",
    ],
  },
  palette: {
    early: ["#0f7b5f", "#fff1d0", "#ff6b4a", "#243b53"],
    current: ["#16324f", "#7b5cff", "#ff5a36", "#ffd23f", "#f6f1e7"],
    why:
      "The anniversary panels took their green from the metro line itself, set against cream and a warm coral for the illustrations. Working on a transit app's signals pushed her towards stronger contrast that holds up on a phone in the street: a deep night blue, a signal orange-red and a sharp yellow. Her own sphere studies then brought in the violet of the sky just after sunset, and that gradient now runs through everything.",
  },
  subjects: {
    clients:
      "Transport, public space and the apps that serve them: transit lines, mobility apps, city programmes, plus her own motion studies.",
    places: [
      "The elevated Minhocão at blue hour on a car-free weekend",
      "Avenida Paulista on Sundays, closed to cars and full of people",
      "Station platforms along the line that follows Paulista",
      "Bus stops with live arrival boards",
      "Her west-facing windowsill of clay and card models",
    ],
    returningClient:
      "Ligeiro, the city transit app, which comes back every few months for new animated status icons as it adds routes and services.",
  },
  presentation: {
    camera:
      "Renders exported as stills and loops; outdoor tests filmed on the phone held at arm's length, showing the loop on screen in the street.",
    light:
      "Soft, even render light with a gentle top key; outdoor shots at blue hour only, with the city's lights just coming on.",
    surfaces:
      "Open fields of gradient colour with nothing else in them; for process, the windowsill and the turntable with grey clay.",
    framing:
      "Centred forms with wide open colour around them; series shown as a strip of frames read left to right, the timing visible in the spacing.",
  },
  voice: {
    captions:
      "Bright and playful, short and in motion terms: the frame count, the beat, what the movement means. 'Twelve frames to arrive. Late buses get twenty.'",
    neverSays: ["tropical", "exotic", "samba vibes", "chaotic megacity", "concrete jungle", "favela-chic"],
  },
  respect: {
    exclude: [
      "Orixás, offerings to the sea goddess, terreiro imagery and white-flower offerings on the shore",
      "Catholic saints, church processions and devotional images",
      "Favelas as a colourful backdrop",
      "Copied pixação or graffiti tags, which are other people's signatures",
      "The national flag, football club crests and team colour pairings",
      "Samba-school emblems and carnival floats",
      "Real metro, rail and bus operators' logos, line branding and maps",
      "Real riders' faces recognisable on platforms without consent",
    ],
    askAReader: [
      "Does the invented Linha Garoa read as a made-up line, or would a São Paulo rider look for it on the real metro map?",
      "Is testing loops on a phone on the Minhocão at blue hour something a local would do, or does the hour feel unsafe or unusual?",
      "Does the bright violet, coral and yellow palette feel like the city's evening sky, or does it tip into a 'tropical' cliché?",
    ],
  },
  sources: [
    {
      url: "https://en.wikipedia.org/wiki/Minhoc%C3%A3o_(S%C3%A3o_Paulo)",
      used: "The elevated road closed to cars at night and at weekends for pedestrians and cyclists, with access near Santa Cecília station.",
    },
    {
      url: "https://domusweb.it/en/architecture/gallery/2020/03/12/living-with-the-big-worm.html",
      used: "The Minhocão turning into a de facto park in the evenings and at weekends, with flats close on either side.",
    },
    {
      url: "https://nextcity.org/urbanist-news/taking-back-saeo-paulos-streets-one-sunday-at-a-time",
      used: "Avenida Paulista closed to cars on Sundays and given to walking, cycling and play.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Line_2_(S%C3%A3o_Paulo_Metro)",
      used: "The city's green line follows much of Avenida Paulista between Vila Madalena and Vila Prudente: background, and the reason to ask about the fictional client's name.",
    },
    {
      url: "https://querobolsa.com.br/cursos-e-faculdades/motion-design",
      used: "Motion design courses in Brazil running 40 to 120 hours, teaching 2D and 3D animation, image work and editing.",
    },
    {
      url: "https://rioandlearn.com/iemanja/",
      used: "Offerings of white flowers and small boats to the sea goddess on 2 February: listed as an exclusion for coastal light.",
    },
  ],
};
