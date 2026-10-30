import type { Persona } from "./types";

/** Kareem Lalchan, Port of Spain: magazines, books and programmes paced like a long page of newsprint. */
export const persona: Persona = {
  makerId: "kareem-lalchan",
  studio: {
    training:
      "Majored in design in the visual arts degree at the university's creative and festival arts department in St Augustine. Spent eleven years on the night layout desk of a daily paper, paginating to a press deadline, then ran the features pages of a weekend magazine. He went independent in his forties and still plans every job the way the desk taught him: a flat-plan on the wall first, pages second.",
    room:
      "The top floor of an older office block downtown, near the waterfront, with tall windows looking west over the port and north to the green hills of the Northern Range. One long wall is covered in spreads printed at full size on newsprint and pinned in reading order; a plan table runs the length of the room, with a guillotine at one end and a stack of paper dummies at the other. The radio is always on.",
    tools: [
      "A steel pica rule and line gauge, worn smooth at the zero end",
      "A linen tester loupe, for checking halftone dots on press proofs",
      "A tabloid-size office laser printer that prints every spread at full size",
      "A rotary guillotine, a bone folder and a long-arm stapler for saddle-stitched dummies",
      "Red and blue pencils for marking proofs",
      "A layout program's master pages built on one twelve-column grid, the same grid he publishes free",
      "A radio tuned to talk shows by day and calypso by night",
    ],
    materials: [
      "End rolls of newsprint bought cheaply from a commercial printer's web press, cut down for prototypes",
      "Recycled uncoated stock for programmes and posters",
      "Cheap copier paper for the first thumbnail flat-plan",
      "Masking tape and pushpins, never spray mount on the wall",
      "Press proofs kept in a flat file, one drawer per client",
    ],
    hours:
      "Flat-plans in the morning while the light is cool, layout through the afternoon with the radio on, and a walk along Frederick Street at four to see what the shopfronts are doing with colour. Press checks happen in the evening at the printer, a habit from the newspaper years.",
  },
  hand: {
    line:
      "Dense, confident grids where every sequence is allowed one page to breathe: six packed pages, then a spread of white with a single line of type. Thick bands of flat colour divide sections and run straight across the gutter, and the important numbers are set big enough to read across a room.",
    signatureMoves: [
      "A flat-plan of thumbnails pinned to the wall before any page is set",
      "One open, nearly empty page after every run of tight ones",
      "Colour stripes that run edge to edge and cross the fold, one stripe per day or per section",
      "Every spread printed full size on cheap newsprint and pinned before it goes to press",
    ],
    motifs: [
      "Horizontal bands of flat colour, stacked like a programme's days",
      "Oversized numerals for dates, page numbers and issue numbers",
      "A scalloped rule cut from the fretwork edging on old Woodbrook houses",
    ],
    type:
      "A condensed grotesque for headlines, set tight and big; a sturdy newspaper serif for text at nine on eleven; numerals huge and tabular. Capitals only for kickers, and never more than two typefaces on a page.",
    keptImperfections: [
      "Colour half a millimetre off register on newsprint",
      "Show-through of the reverse page in the white spaces",
      "Coarse, visible halftone dots in every photograph",
      "Pin holes and red-pencil notes on the proofs he photographs",
    ],
  },
  palette: {
    early: ["#1d3557", "#e63946", "#f1faee", "#a8dadc"],
    current: ["#d62828", "#f77f00", "#fcbf49", "#003049"],
    why:
      "His magazine work started in a printer's navy, one press red, a pale sky blue and bright paper, colours that held up on cheap stock and suited a quarterly about craft and small business. The street-festival programme pulled him outdoors: the red, tangerine and yellow came from painted house fronts and shop signs in the east of the city, and the navy stayed on as the colour he sets text in.",
  },
  subjects: {
    clients:
      "Small presses, quarterly magazines, neighbourhood festival committees, community newsletters, book publishers and the occasional restaurant menu on Ariapita Avenue.",
    places: [
      "Ariapita Avenue in Woodbrook, its gingerbread fretwork and late cafés",
      "Western Main Road in St James at night, its signs still lit at one in the morning",
      "Frederick Street's narrow shopfronts and kiosks",
      "The promenade down the middle of Independence Square",
      "The steep, winding streets of Belmont and their small painted houses",
      "The port, seen every day from his window",
    ],
    returningClient:
      "Steelyard, the quarterly about craft and small business, which comes back every three months for a new issue built on his twelve-column grid.",
  },
  presentation: {
    camera:
      "Mirrorless camera on a copy stand pointing straight down for whole spreads; a second shot through the loupe for halftone close-ups.",
    light: "Even, diffuse daylight from the tall windows with the blinds half down, no flash and no hard shadows.",
    surfaces: "The plan table's grey newsprint underlay, or the wall of pinned spreads seen front-on.",
    framing:
      "Spreads shown flat and whole, top-down, edge to edge; a set laid as a grid of pages in reading order; one tight crop on the dots and the off-register edge.",
  },
  voice: {
    captions:
      "Conversational and sure of himself: what the page had to do and how many pages it had to do it in. 'Six tight pages, then one that breathes.' Plain English with a Trinidadian turn of phrase where it is the natural one.",
    neverSays: ["tropical", "island vibes", "paradise", "exotic", "content", "clean design"],
  },
  respect: {
    exclude: [
      "Carnival masquerade costumes, headpieces and J'ouvert scenes as a shorthand for the island",
      "Religious flags on bamboo poles, festival lamps and any temple, mosque or church in frame",
      "Hosay structures and processions, and the observances of any faith",
      "Real politicians, calypsonians and named public figures",
      "Real newspaper mastheads and magazine names",
      "The national flag and coat of arms used as decoration",
      "Steelpans and palm-tree beaches as filler imagery",
    ],
    askAReader: [
      "Do his Trinidadian turns of phrase read naturally in captions, or would a local reader hear them as put on?",
      "Is a neighbourhood street festival in east Port of Spain a believable secular client, separate from Carnival?",
      "With the island down to two daily papers, does a newspaper layout desk still ring true as where he trained?",
    ],
  },
  sources: [
    {
      url: "https://sta.uwi.edu/fhe/dcfa/about.asp",
      used: "The creative and festival arts department in St Augustine runs a visual arts degree where students choose design or fine art as their major in the second year.",
    },
    {
      url: "https://www.discovertnt.com/articles/Trinidad/Touring-Trinidad-pt-3-the-Port-of-Spain-Suburbs/144/3/23",
      used: "Woodbrook's gingerbread houses and Ariapita Avenue as the restaurant strip; St James's Western Main Road open late; Belmont's narrow winding streets; Hosay held in St James (noted as an exclusion).",
    },
    {
      url: "https://en.wikipedia.org/wiki/Downtown_Port_of_Spain",
      used: "Independence Square's central promenade and Frederick Street as the main shopping street of small stores and kiosks.",
    },
    {
      url: "https://worldcapitalconfidential.com/?p=8081",
      used: "Port of Spain's ornate fretwork 'gingerbread' houses: the source of his scalloped rule.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Trinidad_and_Tobago_Newsday",
      used: "One of the country's three dailies closed in January 2026, leaving two national daily papers: context for his newspaper training and cheap end rolls.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Port_of_Spain_Gazette",
      used: "Port of Spain's long history of daily papers and their presses changing hands.",
    },
    {
      url: "https://en.wikipedia.org/wiki/Lines_per_inch",
      used: "Newsprint is printed with coarse halftone screens of about 85 to 100 lines per inch because the porous paper spreads ink.",
    },
    {
      url: "https://repository.rit.edu/theses/6516",
      used: "Dot gain on offset newsprint and why coarser screens hold up better: the look of his visible dots and soft register.",
    },
  ],
};
