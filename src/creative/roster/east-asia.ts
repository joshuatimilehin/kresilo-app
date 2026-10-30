import type { Maker } from "../makers";
import type { CaseStudy } from "../portfolio/types";

/**
 * East and Southeast Asia: four makers in Kanazawa, Jeonju, Tainan and Hanoi,
 * each with two case studies. Culture shows only through craft, materials,
 * food, streets, signage, textiles and print
 * (docs/cultural-context-and-respect-rules.md).
 */
export const makers: Maker[] = [
  {
    id: "nanami-hiraoka",
    name: "Nanami Hiraoka",
    kind: "individual",
    place: "Kanazawa, Japan",
    area: "Asia",
    region: "East Asia",
    discipline: "graphic identity",
    stage: "mid-career",
    voice: "Measured and seasonal",
    languages: ["Japanese", "English"],
    influences:
      "Handmade washi, sumi ink ground on a stone, garden pruning in late autumn and the shop marks dyed on old noren curtains.",
    bio: "Nanami Hiraoka designs identities for small food and hospitality businesses, starting every mark with a brush and a sheet of washi. She keeps a drawer of test marks sorted by season and redraws a mark until it survives being printed the size of a coin.",
    sample: true,
    portrait: "/assets/kresilo/gen/portrait--nanami-hiraoka.jpg",
  },
  {
    id: "da-eun-kwak",
    name: "Da-eun Kwak",
    kind: "individual",
    place: "Jeonju, South Korea",
    area: "Asia",
    region: "East Asia",
    discipline: "textile",
    stage: "emerging",
    voice: "Bright and methodical",
    languages: ["Korean", "English"],
    influences:
      "Offcuts of ramie and silk organza, window light through paper doors, sewing-machine repair shops and the grid of a market's fabric bolts.",
    bio: "Da-eun Kwak sews patchwork wrapping cloths and panels from ramie and silk offcuts, joining every piece with a flat triple-stitched seam. She buys remnants by weight from a fabric wholesaler and plans each cloth on graph paper before cutting.",
    sample: true,
    portrait: "/assets/kresilo/gen/portrait--da-eun-kwak.jpg",
  },
  {
    id: "wei-chen-kao",
    name: "Wei-chen Kao",
    kind: "individual",
    place: "Tainan, Taiwan",
    area: "Asia",
    region: "East Asia",
    discipline: "lettering",
    stage: "established",
    voice: "Loud, warm and practical",
    languages: ["Mandarin", "Taiwanese Hokkien", "English"],
    influences:
      "Night-market steam, glass tubing bent over a ribbon flame, back-lit acrylic menu boxes and the stroke order of hand-painted price boards.",
    bio: "Wei-chen Kao draws lettering for neon signs and light boxes, mostly for food stalls and family shops. He draws every character full size on kraft paper so the tube bender can lay glass straight on top of it, and he checks each sign from across the street before signing off.",
    sample: true,
    portrait: "/assets/kresilo/gen/portrait--wei-chen-kao.jpg",
  },
  {
    id: "vu-bao-ngan",
    name: "Vũ Bảo Ngân",
    kind: "individual",
    place: "Hanoi, Vietnam",
    area: "Asia",
    region: "Southeast Asia",
    discipline: "illustration",
    stage: "mid-career",
    voice: "Patient and quietly funny",
    languages: ["Vietnamese", "English"],
    influences:
      "Layered lacquer sanded back with pumice and water, gold and silver leaf, crushed eggshell, highland coffee farms and motorbikes stacked with sacks.",
    bio: "Vũ Bảo Ngân makes illustrations as lacquer panels, building up a dozen coats and sanding back until colour and gold surface where she wants them. Each panel is photographed for print, so she paints with the scanner's glare in mind.",
    sample: true,
    portrait: "/assets/kresilo/gen/portrait--vu-bao-ngan.jpg",
  },
];

export const caseStudies: CaseStudy[] = [
  // Nanami Hiraoka
  {
    id: "hatsushimo-tea-house",
    makerId: "nanami-hiraoka",
    title: "Hatsushimo Tea House",
    client: {
      name: "Hatsushimo",
      what: "A twelve-seat tea house in a restored merchant garden",
    },
    kind: "brand-identity",
    themes: ["place", "brand"],
    tagline: "Four garden windows for four seasons, one brushstroke apart.",
    role: "Identity, menus and signage",
    year: 2026,
    palette: ["#f1ece0", "#26231f", "#6f7f4e", "#b4523a"],
    story: {
      brief:
        "A tea house reopening in a restored garden needed a mark for its curtain, menus and takeaway tins, and a way to show the menu changing four times a year.",
      idea:
        "One small square garden window drawn in four brush strokes, its corner left open, framing a different garden detail each season: a pine needle, a camellia, a ginkgo leaf, a persimmon. The window never changes; the view through it does.",
      outcome:
        "A window-mark system, four seasonal palettes, a folded washi menu, tin labels and an entrance sign. The kitchen now prints each season's menu in-house from one template.",
    },
    panels: [
      { kind: "hero", caption: "The winter window on the entrance curtain." },
      { kind: "logo", caption: "One window, four seasonal views." },
      { kind: "palette", caption: "Moss, sumi, persimmon and paper." },
      { kind: "mockup", scene: "card", caption: "The folded washi menu." },
      { kind: "mockup", scene: "sign", caption: "Cedar sign at the garden gate." },
      { kind: "process", caption: "Two hundred brushed windows before the one that was kept." },
    ],
    assetsUsed: [],
    templateId: "brand-board",
    aiHelp: "none",
    process:
      "Brushed in sumi on handmade washi, scanned at high resolution and kept as rough-edged vectors. No generated imagery.",
  },
  {
    id: "yonaga-seasonal-boxes",
    makerId: "nanami-hiraoka",
    title: "Yonaga Seasonal Boxes",
    client: {
      name: "Yonaga Sweets",
      what: "A two-counter confectioner making bean-paste sweets near the fish market",
    },
    kind: "packaging",
    themes: ["product", "company"],
    tagline: "A box sleeve that changes colour before the sweets inside do.",
    role: "Packaging and marks",
    year: 2025,
    palette: ["#f6f0e4", "#2e2a26", "#c9776b", "#5d6f8a"],
    story: {
      brief:
        "The shop sold most boxes as gifts but used one plain carton all year, so regulars could not tell a new season's set from last month's.",
      idea:
        "Keep one box and change only a printed washi sleeve: a band of ink wash in the season's colour, with a small mark for each sweet stamped where it sits in the tray.",
      outcome:
        "Twelve monthly sleeves printed on two colours of washi, a rubber stamp set for the counter and a gift card. Gift-box sales rose in the first winter.",
    },
    panels: [
      { kind: "hero", caption: "The November sleeve, persimmon wash." },
      { kind: "series", caption: "Twelve sleeves, one for each month." },
      { kind: "mockup", scene: "box", caption: "The sleeve on the shop's standard box." },
      { kind: "mockup", scene: "card", caption: "Gift card tucked under the sleeve." },
      { kind: "process", caption: "Stamping the tray map by hand at the counter." },
    ],
    assetsUsed: [],
    templateId: "packaging-set",
    aiHelp: "none",
    process:
      "Ink washes brushed on paper and scanned; sleeves printed by a local letterpress on washi; stamps cut from the final vectors.",
  },

  // Da-eun Kwak
  {
    id: "jogak-gift-wraps",
    makerId: "da-eun-kwak",
    title: "Jogak Gift Wraps",
    client: {
      name: "Jogak & Co.",
      what: "A homeware shop selling linen, ceramics and gift sets from a converted print shop",
    },
    kind: "packaging",
    themes: ["product", "brand"],
    tagline: "Gift wrap you keep, wash and use again.",
    role: "Textile packaging",
    year: 2026,
    palette: ["#e8dfcc", "#3f5e8c", "#d9a3b5", "#6c9a8b"],
    story: {
      brief:
        "The shop wanted to stop using paper and ribbon for its autumn gift sets without the wrapping looking like an afterthought.",
      idea:
        "Sew square patchwork wrapping cloths from the shop's own linen offcuts, in three sizes that fit its three gift boxes, with one tie corner in a contrasting colour.",
      outcome:
        "Three hundred cloths in three sizes, a folding card that shows two ways to tie them, and a returns basket at the till where customers can swap a cloth for a discount.",
    },
    panels: [
      { kind: "hero", caption: "The large wrap, tied over a set of four bowls." },
      { kind: "series", caption: "Three sizes, each pieced from the week's offcuts." },
      { kind: "process", caption: "Flat triple-stitched seams, pressed after every row." },
      { kind: "mockup", scene: "box", caption: "The small wrap on a tea-cup box." },
      { kind: "mockup", scene: "card", caption: "Folding card with the two knots." },
    ],
    assetsUsed: [],
    aiHelp: "none",
    process:
      "Layouts planned on graph paper, cut and sewn by hand and machine from linen and ramie offcuts. No generated imagery.",
  },
  {
    id: "ssalgaru-window-panels",
    makerId: "da-eun-kwak",
    title: "Ssalgaru Window Panels",
    client: {
      name: "Ssalgaru Bakery",
      what: "A rice-flour bakery with a long street window and a shared table",
    },
    kind: "spatial",
    themes: ["place", "company"],
    tagline: "Patchwork that turns a hot window into soft light.",
    role: "Textile panels and installation",
    year: 2025,
    palette: ["#ece4d3", "#9c4a3c", "#b8c4a0", "#46506b"],
    story: {
      brief:
        "The bakery's west window baked the pastry counter every afternoon, and blinds would have hidden the room from the street.",
      idea:
        "Hang three tall ramie panels pieced in pale and dark squares, so the sun is filtered but people outside can still see the shared table through the light squares.",
      outcome:
        "Three panels on brass rods, a matching cloth for the bread baskets and a small panel on the door. The counter is several degrees cooler and the window became the shop's sign.",
    },
    panels: [
      { kind: "hero", caption: "Afternoon light through the three panels." },
      { kind: "mockup", scene: "shopfront", caption: "From the street, the table shows through." },
      { kind: "process", caption: "Testing square sizes against the window at four o'clock." },
      { kind: "series", caption: "Basket cloths cut from the panel offcuts." },
    ],
    assetsUsed: [],
    aiHelp: "none",
    process:
      "Square sizes tested with paper mock-ups taped to the window, then sewn in ramie and hung on site.",
  },

  // Wei-chen Kao
  {
    id: "shuiyue-night-market-lights",
    makerId: "wei-chen-kao",
    title: "Shuiyue Night Market Lights",
    client: {
      name: "Shuiyue Night Market",
      what: "A weekend night market of forty food stalls on a riverside car park",
    },
    kind: "lettering",
    themes: ["place", "culture"],
    tagline: "Forty stall names you can read from the car park entrance.",
    role: "Neon lettering and light-box signs",
    year: 2025,
    palette: ["#0e1116", "#ff6ec7", "#38f2c4", "#ffb000"],
    story: {
      brief:
        "Stallholders were buying mismatched LED strips, and shoppers could not find a stall they had visited the week before.",
      idea:
        "Give every stall the same light-box size and one neon word for its main dish, with each aisle in its own tube colour so people remember the colour as well as the name.",
      outcome:
        "Forty light boxes, twelve neon words, an aisle map at the entrance and a price-board style each stall can repaint itself.",
    },
    panels: [
      { kind: "hero", caption: "The oyster-omelette aisle in pink." },
      { kind: "series", caption: "Twelve neon words, one per signature dish." },
      { kind: "mockup", scene: "sign", caption: "Stall light box, same size for every stall." },
      { kind: "process", caption: "Full-size drawings on kraft paper, glass laid on top." },
      { kind: "mockup", scene: "poster", caption: "Aisle map at the car park entrance." },
    ],
    assetsUsed: [],
    aiHelp: "assisted",
    process:
      "Lettering drawn by hand and bent in glass by a local workshop. AI used only to preview sign sizes on photographs of the stalls; every final sign was drawn and bent by hand.",
  },
  {
    id: "seventh-lane-noodles",
    makerId: "wei-chen-kao",
    title: "Seventh Lane Noodles",
    client: {
      name: "Seventh Lane Noodles",
      what: "A family noodle shop with eight stools and a counter facing the lane",
    },
    kind: "brand-identity",
    themes: ["company", "story"],
    tagline: "One neon bowl, and the menu painted by the owner's hand.",
    role: "Sign, menu board and identity",
    year: 2026,
    palette: ["#14181f", "#e83a2e", "#f2efe6", "#5ad1ff"],
    story: {
      brief:
        "The second generation was taking over the shop and wanted a sign that would last, without losing the hand-painted menu regulars knew.",
      idea:
        "A single red neon outline of a bowl with steam, plus the shop's name in thick brush characters traced from the father's own menu board.",
      outcome:
        "A neon sign, a repainted menu board, takeaway cup stamps and a business card. The father's lettering is now the wordmark.",
    },
    panels: [
      { kind: "hero", caption: "The neon bowl over the lane at dusk." },
      { kind: "logo", caption: "Wordmark traced from the old menu board." },
      { kind: "mockup", scene: "shopfront", caption: "Counter, stools and sign together." },
      { kind: "mockup", scene: "cup", caption: "Takeaway cup with the stamped bowl." },
      { kind: "quote", caption: "“My dad's handwriting is on the street now.” The owner, at the switch-on." },
    ],
    assetsUsed: [],
    templateId: "logo-on-products",
    aiHelp: "none",
    process:
      "Characters traced from the original board, redrawn with a brush, then bent in red neon. No generated imagery.",
  },

  // Vũ Bảo Ngân
  {
    id: "suong-som-coffee-bags",
    makerId: "vu-bao-ngan",
    title: "Sương Sớm Coffee Bags",
    client: {
      name: "Sương Sớm Roasters",
      what: "A small roaster buying from four highland farms and roasting twice a week",
    },
    kind: "packaging",
    themes: ["product", "place"],
    tagline: "Four farms, four lacquer panels, one bag shape.",
    role: "Illustration and packaging",
    year: 2026,
    palette: ["#1a0f0a", "#7a1f14", "#c9a24a", "#efe6d2"],
    story: {
      brief:
        "The roaster sold single-farm coffee in plain kraft bags with sticker labels, and customers mixed the farms up.",
      idea:
        "Make one small lacquer panel per farm, each built from what grows or moves there: terraced slopes, pine ridges, drying racks, a motorbike carrying sacks. Gold leaf marks the altitude line.",
      outcome:
        "Four panels photographed and printed on matte pouches, with the farm's altitude stamped in gold foil. The bags sell out first at the café.",
    },
    panels: [
      { kind: "hero", caption: "The pine-ridge panel, gold leaf at 1,500 metres." },
      { kind: "series", caption: "Four farms, four panels, sanded to the same depth." },
      { kind: "mockup", scene: "pouch", caption: "Matte pouch with gold-foil altitude." },
      { kind: "process", caption: "Twelve coats, wet-sanded with pumice." },
      { kind: "palette", caption: "Black lacquer, cinnabar, gold and eggshell." },
    ],
    assetsUsed: [],
    templateId: "packaging-set",
    aiHelp: "none",
    process:
      "Each panel built in lacquer over five weeks and photographed under raking light for print. No generated imagery.",
  },
  {
    id: "suong-som-harvest-posters",
    makerId: "vu-bao-ngan",
    title: "Harvest Mornings",
    client: {
      name: "Sương Sớm Roasters",
      what: "A small roaster buying from four highland farms and roasting twice a week",
    },
    kind: "campaign",
    themes: ["place", "story"],
    tagline: "Posters for the first roast of the new crop.",
    role: "Illustration and posters",
    year: 2025,
    palette: ["#2a1810", "#a33a1f", "#d4b26a", "#3c4a3a"],
    story: {
      brief:
        "The roaster wanted to announce the first coffee of the new harvest at its café and two partner bakeries.",
      idea:
        "Three tall lacquer panels following one morning on a farm: picking at first light, cherries on drying beds at noon, sacks leaving on a motorbike. Crushed eggshell gives the mist its texture.",
      outcome:
        "Three posters, a set of cup sleeves and a postcard pack. The original panels now hang behind the café's roaster.",
    },
    panels: [
      { kind: "hero", caption: "Picking at first light, eggshell mist." },
      { kind: "series", caption: "Morning, noon and the road down." },
      { kind: "mockup", scene: "poster", caption: "In the café window." },
      { kind: "mockup", scene: "cup", caption: "Cup sleeve cut from the noon panel." },
      { kind: "process", caption: "Setting eggshell fragments with tweezers before the next coat." },
    ],
    assetsUsed: [],
    aiHelp: "assisted",
    process:
      "Panels made by hand in lacquer. AI used only to remove dust specks from the scans before printing, each fix checked by hand.",
  },
];

/** Art direction for every generated picture of this maker's work: medium, rendering, light, composition, in 1–2 sentences. */
export const looks: Record<string, string> = {
  "nanami-hiraoka":
    "Flat sumi-ink brush marks: small square garden windows framing one botanical detail, printed on handmade washi with deckled edges and generous empty space. Photographed flat from directly above under soft, even north-window light, muted and matte.",
  "da-eun-kwak":
    "Translucent ramie and silk-organza patchwork in pale and saturated squares with visible flat seams, hung against a window so daylight glows through each pane. Straight-on textile photography, crisp stitch detail, airy and bright.",
  "wei-chen-kao":
    "Hand-bent glass neon tubes and back-lit acrylic light boxes with bold brush-stroke lettering, shot at night on a long exposure with saturated glow and soft bloom. Dark wet street surfaces reflect the colour; low angle, shallow depth of field.",
  "vu-bao-ngan":
    "Glossy layered lacquer panels in black, cinnabar and ochre with gold leaf and crushed eggshell inlay, sanded back to reveal colour beneath. Macro detail under low raking light that catches the polish and the sanded edges.",
};

/** A prompt for this maker's profile portrait (a photo of a person who does not exist, never a real one). */
export const portraitPrompts: Record<string, string> = {
  "nanami-hiraoka":
    "Editorial portrait photograph of a Japanese woman in her late thirties, a graphic designer, chin-length black hair, grey linen work shirt with ink on one cuff, seated at a low worktable covered in washi sheets and brushes in a bright wooden studio. Soft north-window light, 85mm lens, natural skin texture, calm expression; a private person, not a celebrity or any real individual.",
  "da-eun-kwak":
    "Editorial portrait photograph of a Korean woman in her late twenties, a textile maker, hair tied back, round glasses, cream cotton apron with a pincushion on the wrist, standing beside a window hung with pale patchwork panels in a small sewing studio. Bright diffused daylight, 50mm lens, natural skin texture, slight smile; a private person, not a celebrity or any real individual.",
  "wei-chen-kao":
    "Editorial portrait photograph of a Taiwanese man in his early fifties, a sign letterer, short greying hair, rolled-up work shirt, holding a roll of kraft-paper lettering drawings in a workshop with unlit glass tubes on the wall. Warm tungsten light with a faint pink neon glow behind, 35mm lens, natural skin texture, easy grin; a private person, not a celebrity or any real individual.",
  "vu-bao-ngan":
    "Editorial portrait photograph of a Vietnamese woman in her mid-thirties, an illustrator, shoulder-length hair, dark cotton smock with lacquer marks, seated beside a stack of glossy lacquer panels in a small studio with a ceiling fan. Soft side light from a tall shuttered window, 85mm lens, natural skin texture, thoughtful expression; a private person, not a celebrity or any real individual.",
};
