/**
 * Writes the prompts for the sample portfolio's generated images to stdout as
 * JSON: one entry per project panel (except palettes, quotes and type
 * samples, which stay drawn), one per asset pack and one per template. Each
 * prompt is built from the record's own brief, palette, place and caption, so
 * the image tells that project's story. Run with: pnpm exec jiti scripts/art-prompts.ts
 */
import { assets, brandTemplates, caseStudies } from "../src/creative/portfolio";
import { makers } from "../src/creative/makers";
import { hasLayout } from "../src/creative/portfolio/layouts";
import { allLooks } from "../src/creative/roster";
import { personaLook } from "../src/creative/roster/personas";
import type { CasePanel, CaseStudy, LibraryAsset } from "../src/creative/portfolio/types";

/**
 * Every picture is a photograph of real, finished work. What changes from
 * maker to maker is the work's own style (roster looks), so no two portfolios
 * look alike.
 */
const QUALITY =
  "Photorealistic photograph of real, finished work, the quality of a featured Behance case study: crisp and correct lettering, real materials and texture, considered composition. No watermark, no UI chrome, no lorem ipsum, no real brand names or logos.";
// A researched persona, when the maker has one, gives the most specific direction.
const lookOf = (makerId: string) =>
  personaLook(makerId) ?? (allLooks[makerId] ? `The work's own visual style: ${allLooks[makerId]}` : "");

const STYLE =
  "Professional design portfolio image, the quality of a featured Behance case study. Real materials, natural light, considered composition, crisp and correct lettering, rich texture. No watermark, no UI chrome, no lorem ipsum, no real brand names or logos.";

const hexes = (p: readonly string[]) => `Colour palette: ${p.join(", ")}.`;

function place(makerId: string) {
  const m = makers.find((x) => x.id === makerId);
  return m ? `The designer works from ${m.place}; let materials and setting feel true to that place without stereotype.` : "";
}

/** Story projects photograph each panel exactly as the story describes it. */
const SCENES: Record<string, string> = {
  "after-light-trip:0": "a lone person walking on a flooded salt flat at sunset, the sky reflected perfectly, pink and orange light",
  "after-light-trip:1": "contact sheets and a loupe on a wooden hotel table at night, a lamp, a film camera beside them",
  "after-light-trip:2": "seven same-size photographic prints of salt-flat sunsets pinned in a row on a pale studio wall in Lagos",
  "after-light-trip:3": "postcards of salt-flat sunsets tied with string on a desk next to a coffee cup and handwritten addresses",
  "open-studio-day:0": "three printed posters pasted on a sunlit street wall in Lagos, passers-by walking past, one poster with huge cut letters, one teal plaster texture, one lavender folded paper",
  "open-studio-day:1": "a designer’s hands cutting large paper letters with a knife on a cutting mat, offcuts scattered, studio light",
  "open-studio-day:2": "three posters laid side by side on a studio floor seen from above, letter poster, teal plaster poster, lavender folded-paper poster",
  "open-studio-day:3": "neighbours chatting inside a small bright design studio with prints on the walls during an open day, warm afternoon",
  "friday-loops:0": "a small record shop at night, people listening, a screen behind the counter showing an abstract chrome ring animation, warm lamps, vinyl crates",
  "friday-loops:1": "a laptop on a cluttered desk showing a motion timeline with beat markers, headphones and a record sleeve beside it, night",
  "friday-loops:2": "a grid of small abstract chrome animation stills in different colours printed on a sheet pinned to a corkboard",
  // Kertu Vaher, Tallinn: the screens are shown where the service happens.
  "praamiaeg-ferry-app:0": "a phone held in a gloved hand on a windswept small-island ferry pier in winter, the screen showing one large departure time and a car-deck space bar, a small ferry approaching through grey broken sea ice behind",
  "praamiaeg-ferry-app:1": "rows of handwritten sticky notes stuck to the window of a small ferry's passenger saloon, grey sea outside, a notebook and a paper cup of coffee on the table",
  "praamiaeg-ferry-app:2": "close-up of a phone screen showing a ferry timetable whose single status line reads that the ice road is open, a frozen sea channel marked with posts behind",
  "praamiaeg-ferry-app:3": "a commuter in winter gloves pointing at paper phone-screen sketches on a clipboard on the open deck of a small ferry, cold early-morning light",
  "praamiaeg-ferry-app:4": "a weatherproof screen on a small island ferry pier showing three departure times in large type, a waiting car and a person in a parka beside it, winter dusk",
  "vesiveski-library-booking:0": "a phone in a reader's hand at a small library desk, the screen showing a three-step room booking flow with large buttons, wooden shelves and an old brick bakery oven behind",
  "vesiveski-library-booking:1": "a library service desk covered with rows of handwritten sticky notes, a date stamp, an open paper diary and a cup of tea under a warm desk lamp",
  "vesiveski-library-booking:2": "a tablet on a stand at a library counter showing a room booking screen in large type, an older reader and a librarian looking at it together, seen from behind",
  "vesiveski-library-booking:3": "an open paper booking diary on a library desk, columns of handwritten names and times, a pencil and coloured page tabs",
  "vesiveski-library-booking:4": "a small printed booking slip for a sewing-machine session tucked under the presser foot of a sewing machine on a library table",
  // Joven Paguio, Manila: stills from the cut, and the edit itself.
  "ramos-body-works-documentary:0": "a documentary film still in 16:9: welding sparks fly over the long bonnet of a half-built bare steel jeepney body in a small family workshop at dusk, no decorations or emblems on the vehicle",
  "ramos-body-works-documentary:1": "a documentary film still: an older man's weathered hands holding a hammer to a sheet of steel laid over a wooden hood template, shallow focus, workshop light",
  "ramos-body-works-documentary:2": "printed transcript lines on strips of paper pinned in columns on a bedroom wall, some highlighted in yellow, a laptop on the bed below showing an editing timeline",
  "ramos-body-works-documentary:3": "a laptop screen showing a video editing timeline of many short clips with small beat markers under every scene, headphones and a notebook on a desk at night",
  "ramos-body-works-documentary:4": "a documentary film still: a newly finished silver jeepney with plain painted panels and no decorations driving out of a narrow street in morning light, neighbours watching from doorways",
  "tindahan-huling-biyahe:0": "a music video still: a corner store's metal shutter half lowered at night under a fluorescent tube, a drummer counting in on the pavement, neighbours on plastic stools",
  "tindahan-huling-biyahe:1": "a music video still: a neighbourhood basketball court at night under one floodlight, a four-piece band playing on the court, neighbours dancing around them",
  "tindahan-huling-biyahe:2": "a notebook page with a hand-drawn beat map, bar numbers and snare hits marked as ticks, a pair of drumsticks and a phone lying on top",
  "tindahan-huling-biyahe:3": "a music video still: the open back of a jeepney at its last stop late at night, a passenger stepping on, the street smeared with motion blur",
  "tindahan-huling-biyahe:4": "a phone held upright showing a vertical music video frame of a band on a basketball court at night, a corner store glowing behind",
  // Half Landing, Glasgow: the work in the buildings it was made for.
  "brackenbrae-library-wayfinding:0": "the inside of a red-sandstone Victorian library, a stone stair rising through three floors, a different painted colour band at hand height along each floor's walls and a large floor number at the stair head",
  "brackenbrae-library-wayfinding:3": "three library corridors side by side, each with a painted colour band at hand height and a large floor number, in brick red, deep teal and mustard",
  "brackenbrae-library-wayfinding:4": "designers walking a library corridor with two librarians, unrolling coloured tape along the wall at hand height, a clipboard and a tape measure",
  "back-court-days:0": "a row of two-colour screen-printed festival posters taped inside the glass panels of tenement close doors along a street of red-sandstone tenements, Friday evening",
  "back-court-days:4": "a small studio back room with a screen-printing table, a squeegee, and posters on donated paper of different colours drying on a rack",
  "stone-by-stone-repairs:0": "a large technical drawing of a four-storey sandstone tenement front drawn stone by stone, damp stones shaded blue and cracked stones circled, pinned to a studio wall",
  "stone-by-stone-repairs:3": "a stonemason and a designer on scaffolding against a sandstone tenement front, chalk circles round cracked stones, a clipboard in hand, overcast light",
  // Ari Matenga, Auckland: the pieces running where they live.
  "six-oclock-tide-clock:0": "a large screen showing a minimal web animation frame: one smooth tide line rising across a simple drawing of beach rocks, a single clock mark at six, deep harbour blue and pale sand",
  "six-oclock-tide-clock:1": "a phone held at night beside a bedside lamp, its screen showing a tide clock with one tide line and six o'clock marked, a swimming towel over a chair",
  "six-oclock-tide-clock:2": "a person in a wetsuit at dawn on a harbour beach holding a phone up beside barnacled rocks half covered by the tide, a notebook on a rock, swimmers in the water behind",
  "six-oclock-tide-clock:3": "a small e-paper screen in a weathered clubhouse window showing a tide curve and six o'clock, a small solar panel on the sill, a harbour beach outside at dawn",
  "gully-radio-posters:0": "the shop window of a small community radio station filled with a grid of risograph posters in orange, blue and yellow generative stripe patterns, a microphone visible inside, evening street",
  "gully-radio-posters:1": "a laptop on a cluttered radio studio desk showing a simple browser poster tool with a show name field, a pasted playlist and a generated pattern preview, headphones and a mixing desk beside it",
  "gully-radio-posters:3": "a phone held up in a small radio studio showing an animated generative poster of coloured bars drawing across the screen",
  "gully-radio-posters:4": "volunteer radio hosts gathered round a laptop at a long table in a small community radio station, one pointing at a generated poster on screen, risograph prints on the wall",
};

function panelPrompt(c: CaseStudy, p: CasePanel, i: number): string | null {
  const about = `Project "${c.title}" for ${c.client.name} (${c.client.what}). The idea: ${c.story.idea}`;
  const cap = p.caption ? ` This image: ${p.caption}` : "";
  const name = c.client.name;
  const scene = SCENES[`${c.id}:${i}`];
  if (scene) return `Photograph of ${scene}. ${about}${cap}`;
  switch (p.kind) {
    case "hero":
      return `Hero image for a ${c.kind.replace("-", " ")} case study. ${about}${cap} Show the finished work in its real setting, wide and calm.`;
    case "logo":
      return `Logo presentation for ${name}: the mark and the wordmark "${name}" centred on a plain field from the palette, generous space, like the first slide of a brand book. ${about}`;
    case "wordmark-pattern":
      return `A repeating pattern built from the ${name} mark, printed on fabric or paper, close-up with texture, part of a brand identity. ${about}${cap}`;
    case "mockup":
      return `Photoreal product photograph of the ${p.scene ?? "printed piece"} for ${name}, carrying its identity, on a styled surface. ${about}${cap}`;
    case "series":
      return `Three pieces from one series laid out together, consistent system, shot from above on a table. ${about}${cap}`;
    case "process":
      return `Behind the scenes on the designer's desk: sketches, proofs, swatches and tools for "${c.title}", warm daylight, honest working mess. ${about}${cap}`;
    case "motion":
      return `A still frame from a motion piece, with motion blur and a strong typographic moment, cinematic. ${about}${cap}`;
    case "device":
      return `Product interface on a phone held in hand and a laptop on a desk, clean modern UI in the palette, readable headings. ${about}${cap}`;
    case "slides":
      return `A presentation deck spread: three slides printed and laid out side by side, strong titles and imagery. ${about}${cap}`;
    default:
      return null; // palette, quote and type stay drawn
  }
}

const PACK: Record<LibraryAsset["type"], string> = {
  "sticker-pack": "A sheet of die-cut vinyl stickers with white borders, scattered and overlapping on a desk, a few peeled off, shot from above",
  "template-pack": "A set of layout templates shown as a neat grid of printed pages and phone screens, showing the system of frames and type",
  "mockup-pack": "A mockup pack preview: several blank product mockups arranged as a clean studio set, ready for a brand",
  texture: "A grid of large texture swatches, high detail, flat even light, like a texture library preview",
  pattern: "A pattern pack preview: four seamless pattern tiles in different colourways on folded paper and fabric",
  "icon-set": "An icon set preview: a clean grid of consistent line icons printed on a card, with a few shown in use on signs",
  "photo-pack": "A photo pack preview: a contact-sheet layout of related photographs, printed and laid on a light table",
  "motion-pack": "A motion pack preview: a sequence of frames from short animated loops, laid out like a film strip",
  "type-specimen": "A type specimen sheet: large letters, a full alphabet and sample words, printed on good paper",
  palette: "A palette pack preview: painted colour chips and fabric swatches arranged in rows",
};

type Job = { key: string; size: string; prompt: string };
const jobs: Job[] = [];

for (const c of caseStudies) {
  c.panels.forEach((p, i) => {
    const body = panelPrompt(c, p, i);
    if (!body) return;
    jobs.push({ key: `panel:${c.id}:${i}`, size: "1536x1024", prompt: `${body} ${lookOf(c.makerId)} ${hexes(c.palette)} ${place(c.makerId)} ${QUALITY}` });
  });
}
for (const a of assets) {
  jobs.push({
    key: `asset:${a.id}`,
    size: "1536x1024",
    prompt: `${PACK[a.type]}. The pack is "${a.name}": ${a.description} ${lookOf(a.makerId)} ${hexes(a.preview.palette)} ${place(a.makerId)} ${QUALITY}`,
  });
}
for (const t of brandTemplates) {
  if (hasLayout(t.id)) continue; // editable templates show their real layouts instead
  jobs.push({
    key: `template:${t.id}`,
    size: "1536x1024",
    prompt: `Preview of a branding template called "${t.name}": ${t.description} Shown applied to a sample brand named "Harbour & Co." ${t.scenes.length ? `on ${t.scenes.join(", ")}` : ""}. ${hexes(t.palette)} ${STYLE}`,
  });
}

process.stdout.write(JSON.stringify(jobs, null, 1));
