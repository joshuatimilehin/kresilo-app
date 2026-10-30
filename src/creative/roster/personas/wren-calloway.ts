import type { Persona } from "./types";

/** Wren Calloway, Hobart: slow exposures of the estuary, with the weather written beside every frame. */
export const persona: Persona = {
  makerId: "wren-calloway",
  studio: {
    training:
      "Studied at the art school on the Hobart waterfront, in the old sandstone jam-factory warehouses on Hunter Street, where she spent more time in the print rooms than in the photography classes. Then eight years printing exhibition work for other photographers at a small fine-art print studio, matching greys by eye under a viewing lamp. That is where she learned that a series is held together by one grey, not by one subject.",
    room:
      "The back room of a weatherboard cottage in Taroona, looking down through the gums to the estuary. A hooded corner with a calibrated monitor, a wide-format pigment printer on a steel trolley, a plan chest of prints in archival boxes, a viewing lamp, and a shelf of small waterproof notebooks, one for each year, their spines labelled in pencil.",
    tools: [
      "A full-frame mirrorless camera and one 35mm lens",
      "A carbon-fibre tripod with spiked feet for rock platforms and wet sand",
      "Ten-stop and six-stop neutral density filters in a slot holder",
      "A wired remote release for exposures past thirty seconds",
      "A small waterproof notebook, a pencil and a pocket thermometer for air and water",
      "Printed tide tables for the estuary, folded into the notebook",
      "A wide-format pigment printer and a calibrated monitor with a colorimeter",
    ],
    materials: [
      "Matte 100% cotton rag paper with no optical brighteners, for every exhibition print",
      "Archival boxes and pale timber frames for the gallery wall",
      "Pencil, never pen, for the weather notes under each print",
      "Folded cards and posters printed by a local printer for client work",
    ],
    hours:
      "Out forty minutes before sunrise on Tuesdays and Saturdays, on the same rock for the slow series, and at the club's jetty steps on swim mornings. Home by nine to copy the weather into the year's notebook, edit at midday and print in the afternoon when the room is warm. Will not shoot in full sun.",
  },
  hand: {
    line:
      "Exposures of thirty seconds to four minutes that smooth the estuary to silk and turn cloud into soft streaks, horizon centred and level, frames almost empty. Every frame in a series is graded to the same narrow band of slate and pale grey.",
    signatureMoves: [
      "The horizon dead centre and at the same height across a whole series",
      "Weather written in pencil under every print: time, air, water, wind and exposure length",
      "Every frame in a set graded to one matched grey of sky",
      "One small warm note at most: the first light on the far shore, never more than a sliver",
    ],
    motifs: [
      "Rounded dolerite boulders along the lower edge of the frame",
      "Timber jetty steps going down into still water",
      "A single channel marker post standing on a silk-smooth horizon",
    ],
    type:
      "Posters and cards use one plain, wide-tracked sans in capitals, set small at the bottom of the frame, with the weather line beneath in a typewriter-style monospace.",
    keptImperfections: [
      "A ghost where a gull or a swimmer moved through a long exposure",
      "Slight darkening in the corners from stacked filters",
      "A rain spot on the filter in one frame of a set, kept because that morning it rained",
      "Pencil weather notes smudged by a damp thumb",
    ],
  },
  palette: {
    early: ["#475569", "#cbd5e1", "#f8fafc", "#b45309"],
    current: ["#0c4a6e", "#7dd3fc", "#fef3c7", "#1f2937"],
    why:
      "The year-long coastline series was graded to slate, pale grey and paper white, with one amber sliver of first light allowed in. Photographing swimmers brought colour back: the deep clear blue of a winter morning after a southerly, a pale sky blue, and the warm cream of towels and skin, against the charcoal of wet timber.",
  },
  subjects: {
    clients:
      "Sea-swimming and sailing clubs, local galleries, small publishers of photobooks, and coastal and marine organisations that want their place shown plainly.",
    places: [
      "The dolerite boulder shore between Taroona and Sandy Bay",
      "Long Beach and Kingston Beach at first light, where swimmers gather year-round",
      "The working waterfront and its old sandstone warehouses",
      "The estuary seen from the eastern shore, with the city and its mountain across the water",
    ],
    returningClient:
      "Cold Water Club, the year-round swimming club, which comes back every May before the cold sets in for the new season's membership card, always photographed at the same jetty steps.",
  },
  presentation: {
    camera:
      "Full-frame mirrorless camera, the one 35mm lens, on the spiked tripod with a ten-stop filter; for swimmers, the same lens handheld at a fast shutter speed.",
    light:
      "Overcast pre-dawn light, thirty to forty minutes before sunrise; for people, soft early-morning light only, never noon.",
    surfaces:
      "Prints on matte cotton rag in pale timber frames on grey plaster walls; posters on the club shed's weathered boards.",
    framing:
      "Wide and minimal, horizon centred, at least half the frame empty sky; series hung as a single level row with equal gaps.",
  },
  voice: {
    captions:
      "Spare: date, time, air and water temperature, wind, exposure. '14 June, 7:02. Air 4°, water 11°, light nor'-westerly. 120 s.' Nothing else unless something happened.",
    neverSays: ["breathtaking", "pristine", "untouched wilderness", "moody", "serene escape", "hidden gem"],
  },
  respect: {
    exclude: [
      "Aboriginal motifs, art styles, symbols or flags of any kind used as decoration",
      "Shell middens, stone arrangements, rock engravings and other Aboriginal heritage sites in or near the frame",
      "Church spires, crosses and war-memorial crosses",
      "Real festival names, swim-event branding and real club logos",
      "Convict-era chains and prison imagery as decoration",
      "Captions that call the coast empty, untouched or wilderness",
      "Recognisable members of the public who have not agreed to be photographed",
    ],
    askAReader: [
      "Should the mountain above the city, which carries a palawa kani name alongside its English one, be left out of her series as a motif, or is it simply the city's weather gauge?",
      "Does 'Cold Water Club' read as invented, or too close to a real Hobart swimming group?",
      "Are there heritage areas along the Taroona to Kingston shore where she should not set up a tripod?",
    ],
  },
  sources: [
    {
      url: "https://www.lonelyplanet.com/australia/tasmania/hobart/attractions/waterfront/a/poi-sig/1222868/362446",
      used: "Hunter Street's row of Georgian warehouses, the old jam factory, now houses the university's art school.",
    },
    {
      url: "https://utas.edu.au/creative-arts-media",
      used: "The university's School of Creative Arts and Media teaches art in Hobart.",
    },
    {
      url: "https://thehobartmagazine.com.au/swimming-through-the-depths-of-winter",
      used: "Winter sea swimming at Kingston Beach, with water around 12°C on a late-May morning; swimmers avoid big seas and stormwater after rain.",
    },
    {
      url: "https://pulsetasmania.com.au/news/thousands-take-icy-plunge-and-swim-nude-at-hobart-beach",
      used: "Long Beach in Sandy Bay is a winter swimming spot with mid-winter water around 11°C.",
    },
    {
      url: "https://friendsofnorthbruny.org.au/natures-breakwater/",
      used: "Dolerite boulder beaches occur along the estuary coast between Taroona and Sandy Bay.",
    },
    {
      url: "https://www.aboriginalheritage.tas.gov.au/cultural-heritage/aboriginal-shell-middens",
      used: "Shell middens are among the most common Aboriginal sites in Tasmania, often on coastal dunes, headlands and rocky outcrops: the reason for her exclusions.",
    },
    {
      url: "https://www.digitalcameraworld.com/tutorials/seascape-photography-tips-using-an-nd-filter-and-slow-shutter-speeds",
      used: "A ten-stop filter turns a quarter-second into four minutes; focus before fitting the filter; low ISO, small aperture and a solid tripod; bulb mode past thirty seconds.",
    },
    {
      url: "https://weatherzone.com.au/news/beach-walk-with-snow-views-in-hobart/534790",
      used: "Snow on the mountain is visible from Hobart's beaches on winter mornings.",
    },
  ],
};
