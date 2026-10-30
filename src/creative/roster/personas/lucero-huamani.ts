import type { Persona } from "./types";

/** Lucero Huamaní, Lima: hand-lettered fluorescent screen-printed posters. */
export const persona: Persona = {
  makerId: "lucero-huamani",
  studio: {
    training:
      "Learned to burn screens and pull a squeegee as a helper in a commercial print shop in the print-shop blocks around Avenida Bolivia and Jirón Azángaro in central Lima, printing flyers and event cards for two years. Taught herself lettering at night by copying shop signs at full size with markers, then took an evening screen-printing course to learn proper exposure and registration.",
    room:
      "A rented back room in Barranco, three metres by four: a hinged wooden print table with clamps she built herself, a homemade exposure box with UV tubes, a washout sink in the yard, and a wire drying rack along one wall that holds eighty sheets. The walls are covered in test pulls taped edge to edge.",
    tools: [
      "Aluminium screens stretched with 110-thread polyester mesh for solid colour, 160 for small text",
      "70-durometer squeegee, one per colour, never shared",
      "Homemade UV exposure box and a glass sheet to press the film flat",
      "Chisel-tip black paint markers for full-size letter drawings on tracing film",
      "Masking tape registration tabs and a steel rule",
      "Paste brush and a bucket of flour-and-water paste for the walls",
    ],
    materials: [
      "Water-based fluorescent screen inks: pink, orange, acid green, yellow",
      "An opaque white underbase ink for colours that need to glow on black",
      "Black poster board bought by the ream from the print-supply shops in the city centre",
      "Diazo emulsion and tracing film",
      "Kraft cups and paper strips for menu work",
    ],
    hours:
      "Draws Monday to Wednesday evenings, burns screens on Thursday, prints all day Friday and pastes up on Saturday nights; weekdays she still takes print-shop shifts.",
  },
  hand: {
    line:
      "Thick, even marker strokes drawn at full size, letters squeezed tall and touching, with a hard chisel edge on every terminal; nothing is scaled up from a small sketch.",
    signatureMoves: [
      "The headline word as large as the sheet allows, running edge to edge with no margin",
      "One colour per pass, with the second colour deliberately offset a millimetre or two",
      "An inline stripe cut through the middle of every capital",
      "Prices and dates always in a different ink from the name",
    ],
    motifs: [
      "A jagged price starburst behind every number",
      "A hand-drawn arrow pointing at the door or the counter",
      "Fruit silhouettes cut out of solid colour, no outline",
    ],
    type: "Only her own hand-drawn condensed capitals with a chisel edge and an inline stripe; numbers drawn wider than letters; no digital type anywhere on a poster.",
    keptImperfections: [
      "Mis-registration between passes, kept on purpose",
      "Ink starving at the far end of a squeegee pull",
      "Pinholes in the emulsion that print as tiny specks",
    ],
  },
  palette: {
    early: ["#141414", "#ff66b3", "#c8ff1a", "#ffb81c"],
    current: ["#0b0b0b", "#ff3fa4", "#ff7a00", "#3cf23c"],
    why: "Her first menu posters used the softer pink, lime and amber she could get without an underbase. Once she started printing a white underbase on black board for the venue posters, she switched to a deeper pink, a true orange and a pure green that glow under the streetlights where the posters are pasted.",
  },
  subjects: {
    clients:
      "Small music venues, juice counters and market stalls, neighbourhood cumbia and rock nights, and cafés that need a menu read from across a room.",
    places: [
      "Barranco around the Bajada de Baños and Boulevard Sánchez Carrión",
      "Mercado de Surquillo and its fruit and juice stalls",
      "The print-shop blocks of Jirón Azángaro and Avenida Bolivia",
      "Street walls and shutters in Surquillo and Barranco",
    ],
    returningClient:
      "Bajo Nivel, the venue under a car park in Barranco, takes one poster a week every season.",
  },
  presentation: {
    camera:
      "Her phone, with flash off, handheld at the wall; finished prints are also scanned flat on a borrowed A3 scanner.",
    light: "Orange sodium streetlight at night, sometimes a shop's fluorescent tube spilling across the wall.",
    surfaces: "Rough plastered street walls, metal shutters and layered paste-ups, earlier posters torn underneath.",
    framing:
      "Slightly from below and close, the newest poster square in the middle with edges of older ones visible around it; series shown as grids of flat scans.",
  },
  voice: {
    captions:
      "Short and loud: the band or fruit name, the date, the edition and the number of passes. Spanish first, English underneath, no adjectives.",
    neverSays: ["\"Iconic\" or \"vibrant\"", "\"Chicha style\" as a label for her own work", "Anything about the bands she would not say to their faces"],
  },
  respect: {
    exclude: [
      "Purple-and-white religious procession posters and saints",
      "Churches, crosses and altars",
      "Andean ceremonial dance dress and specific community textiles",
      "Political slogans and references to the armed conflict years",
      "Copying the names, layouts or signature lettering of real poster workshops and collectives",
    ],
    askAReader: [
      "Do the fluorescent-on-black posters read as her own hand, or too close to a specific Lima poster family's work?",
      "Are flour paste-ups on these Barranco and Surquillo walls plausible today, or would she paste in other districts?",
      "Is the Spanish on the posters natural Lima street Spanish?",
      "Would market vendors at the juice counter be comfortable appearing in her photographs, or should the stall be shown empty?",
    ],
  },
  sources: [
    {
      url: "https://en.wikipedia.org/wiki/Chicha_(art)",
      used: "Hand screen printing with fluorescent and phosphorescent inks on black, chosen to stand out in poorly lit streets, and paste-ups on neighbourhood walls; used for context and to avoid copying named workshops.",
    },
    {
      url: "https://m.inei.gob.pe/media/MenuRecursivo/noticias/nota-de-prensa-n-117-2014-inei.pdf",
      used: "The print-shop cluster in central Lima around Avenida Bolivia, Jirón Azángaro, Jirón Ica and Jirón Puno, with screen printing among its services (2014 counts).",
    },
    {
      url: "https://www.screenprinting.com/blogs/news/everything-you-need-to-know-to-screen-print-an-underbase",
      used: "110 to 160 mesh for a white underbase, finer mesh for detail, and why bright colours look dull on a dark ground without one.",
    },
    {
      url: "https://lorenzigo.com/barranco-lima-neighborhood-guide/",
      used: "Barranco's Bajada de Baños, Boulevard Sánchez Carrión bar strip, live-music rooms, mural-covered walls and late-night character.",
    },
    {
      url: "https://www.afar.com/places/mercado-de-surquillo-lima",
      used: "Mercado de Surquillo as a local everyday market by Miraflores selling fruit such as lúcuma and camu camu, best early in the morning, where vendors expect to be asked before being photographed.",
    },
  ],
};
