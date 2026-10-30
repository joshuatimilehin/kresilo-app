import type {
  AssetKey,
  Person,
  Project,
  Reference,
  Art,
  LayerRole,
  Motion,
} from "./contracts";
import { makers } from "./makers";
import { artSrc } from "./portfolio/art";
export const motionForWork: Record<string, Motion> = {
  "different-angles": { seconds: 4, movement: "cut", loop: true, beat: 0.5 },
  "quiet-type": { seconds: 4, movement: "type", loop: true, beat: 0.5 },
  "moving-colour": { seconds: 4, movement: "collage", loop: true, beat: 0.5 },
  "chrome-orbit": { seconds: 4, movement: "cut", loop: true, beat: 0.25 },
  "red-interval": { seconds: 4, movement: "type", loop: true, beat: 0.25 },
  "night-signal": { seconds: 4, movement: "collage", loop: true, beat: 0.25 },
};
export const assets: Record<AssetKey, string> = {
  "after-light": "/assets/kresilo/after-light-background.webp",
  mineral: "/assets/kresilo/mineral-texture.webp",
  "culture-type": "/assets/kresilo/culture-type.webp",
  "dusk-study": "/assets/kresilo/dusk-study.webp",
  "folded-paper": "/assets/kresilo/folded-paper.webp",
  "quiet-type": "/assets/kresilo/quiet-type.webp",
  "market-rhythm": "/assets/kresilo/market-rhythm.webp",
  "blue-hour": "/assets/kresilo/blue-hour.webp",
  "soft-structures": "/assets/kresilo/soft-structures.webp",
  "moving-colour": "/assets/kresilo/moving-colour.webp",
  "tidal-lines": "/assets/kresilo/gen/work--tidal-lines.jpg",
  "chrome-orbit": "/assets/kresilo/gen/work--chrome-orbit.jpg",
  "red-interval": "/assets/kresilo/gen/work--red-interval.jpg",
  "garden-grid": "/assets/kresilo/gen/work--garden-grid.jpg",
  "night-signal": "/assets/kresilo/gen/work--night-signal.jpg",
  "paper-orbit": "/assets/kresilo/gen/work--paper-orbit.jpg",
  "plain-paper": "/assets/kresilo/gen/work--plain-paper.jpg",
  "portrait-leap": "/assets/kresilo/gen/work--portrait-leap.jpg",
  "portrait-shades": "/assets/kresilo/gen/work--portrait-shades.jpg",
  "anime-rooftop": "/assets/kresilo/gen/work--anime-rooftop.jpg",
  "anime-rain": "/assets/kresilo/gen/work--anime-rain.jpg",
  "vinyl-dusk": "/assets/kresilo/gen/work--vinyl-dusk.jpg",
  "vinyl-bloom": "/assets/kresilo/gen/work--vinyl-bloom.jpg",
};
/** The media type of a catalogue file, read from its extension. */
export const assetMime = (file: string) =>
  file.endsWith(".svg") ? "image/svg+xml" : file.endsWith(".jpg") ? "image/jpeg" : "image/webp";
/**
 * Catalogue images made with an image model for the prototype (for a motion
 * work, its still). They carry a sparkle wherever they show.
 */
export const aiMadeAssets: ReadonlySet<AssetKey> = new Set<AssetKey>([
  "tidal-lines",
  "chrome-orbit",
  "red-interval",
  "night-signal",
  "garden-grid",
  "paper-orbit",
  "portrait-leap",
  "portrait-shades",
  "anime-rooftop",
  "anime-rain",
  "vinyl-dusk",
  "vinyl-bloom",
]);
/**
 * What each catalogue image is, in the words a person would use to point at it
 * ("the paper texture"), and the job it usually does in a layout. A layer added
 * from an asset starts with this name and role; both can be changed later.
 * Names are 2 to 4 plain words, described from the image itself.
 */
export const assetLayerNames: Record<
  AssetKey,
  { layerName: string; role: LayerRole }
> = {
  "after-light": { layerName: "Sunset reflection photo", role: "background" },
  mineral: { layerName: "Teal plaster texture", role: "texture" },
  "culture-type": { layerName: "AYO letters poster", role: "type" },
  "dusk-study": { layerName: "Salt flat sunset photo", role: "subject" },
  "folded-paper": { layerName: "Paper curl and shadow", role: "texture" },
  "quiet-type": { layerName: "Lavender type poster", role: "type" },
  "market-rhythm": { layerName: "Orange pattern print", role: "ornament" },
  "blue-hour": { layerName: "Blue hour arch photo", role: "subject" },
  "soft-structures": { layerName: "Clay and paper sculpture", role: "subject" },
  "moving-colour": { layerName: "Blue and orange swirls", role: "overlay" },
  "tidal-lines": { layerName: "Tidal sun illustration", role: "background" },
  "chrome-orbit": { layerName: "Chrome orbit rings", role: "shape" },
  "red-interval": { layerName: "Red blocks print", role: "shape" },
  "garden-grid": { layerName: "Leaf pattern grid", role: "ornament" },
  "night-signal": { layerName: "Green signal rings", role: "shape" },
  "paper-orbit": { layerName: "Paper orbit shape", role: "shape" },
  "plain-paper": { layerName: "Plain paper sheet", role: "background" },
  "portrait-leap": { layerName: "Leaping designer portrait", role: "subject" },
  "portrait-shades": { layerName: "Sunglasses portrait", role: "subject" },
  "anime-rooftop": { layerName: "Rooftop courier drawing", role: "subject" },
  "anime-rain": { layerName: "Rainy crossing drawing", role: "subject" },
  "vinyl-dusk": { layerName: "Coastal road at dusk", role: "background" },
  "vinyl-bloom": { layerName: "Chrome flower photo", role: "subject" },
};
/**
 * Maker records come from the sample roster (./makers). The first six have
 * artwork; the rest have no portrait and no works yet, and every surface that
 * lists makers must cope with that.
 */
export type Creator = {
  id: string;
  name: string;
  location: string;
  influences: string;
  bio: string;
  portrait?: string;
  /** Always true: every maker in this prototype is a fictional sample practice. */
  sample: true;
};
export const creators: Creator[] = makers.map((m) => ({
  id: m.id,
  name: m.name,
  location: m.place,
  influences: m.influences,
  bio: m.bio,
  // A generated portrait counts only once its file exists; until then the initials show.
  portrait: m.portrait && !m.portrait.includes("/gen/") ? m.portrait : artSrc(`portrait:${m.id}`),
  sample: m.sample,
}));
export const creatorFor = (id: string) => creators.find((c) => c.id === id);
export const creator = creatorFor("ayo-bello") as Creator;
export const works: {
  id: string;
  title: string;
  creator: string;
  creatorId: string;
  location: string;
  asset: AssetKey;
  tags: string[];
  description: string;
  /** The project this work comes from: every work has a story behind it. */
  projectId: string;
  motionSrc?: string;
}[] = [
  {
    id: "after-light",
    title: "After light",
    creator: "Ayo Bello",
    creatorId: "ayo-bello",
    location: "Lagos",
    asset: "after-light",
    tags: ["light", "colour", "photography", "motion"],
    description:
      "The first evening of Ayo's yearly week without clients: a lone walker on the flooded salt flats, the sky doubled in the water.",
    projectId: "after-light-trip",
  },
  {
    id: "different-angles",
    motionSrc: "/assets/kresilo/quick-cuts.mp4",
    title: "Different angles",
    creator: "Ayo Bello",
    creatorId: "ayo-bello",
    location: "Lagos",
    asset: "culture-type",
    tags: ["type", "music", "print", "culture"],
    description:
      "The letter poster for Ayo's open studio day: his own name, cut by hand and shuffled until it read like the street outside.",
    projectId: "open-studio-day",
  },
  {
    id: "mineral-notes",
    title: "Mineral notes",
    creator: "Ayo Bello",
    creatorId: "ayo-bello",
    location: "Lagos",
    asset: "mineral",
    tags: ["texture", "material", "colour"],
    description:
      "The plaster wall in Ayo's studio, photographed for the second open-day poster, so neighbours would recognise the room before they entered it.",
    projectId: "open-studio-day",
  },
  {
    id: "dusk-study",
    title: "Dusk study",
    creator: "Ayo Bello",
    creatorId: "ayo-bello",
    location: "Lagos",
    asset: "dusk-study",
    tags: ["light", "photography", "landscape"],
    description:
      "The fourth evening on the salt flats, when the wind dropped and the horizon disappeared.",
    projectId: "after-light-trip",
  },
];
works.push(
  {
    id: "quiet-type",
    motionSrc: "/assets/kresilo/type-punch.mp4",
    title: "Quiet type",
    creator: creator.name,
    creatorId: creator.id,
    location: "Lagos",
    asset: "quiet-type",
    tags: ["type", "print", "texture"],
    description:
      "The quietest of the three open-day posters: folded offcuts from past print runs, set in lavender and black.",
    projectId: "open-studio-day",
  },
  {
    id: "paper-weather",
    title: "Paper weather",
    creator: "Nia Mensah",
    creatorId: "nia-mensah",
    location: "Accra",
    asset: "folded-paper",
    tags: ["material", "texture", "light"],
    description:
      "A swatch-card test for Cloth Notes: how the card's curve holds light, so customers can read a fabric's weight before they order.",
    projectId: "cloth-notes",
  },
  {
    id: "market-rhythm",
    title: "Market rhythm",
    creator: "Nia Mensah",
    creatorId: "nia-mensah",
    location: "Accra",
    asset: "market-rhythm",
    tags: ["type", "print", "culture", "music"],
    description:
      "The label pattern for Loom & Line, drawn from the rhythm of the studio's loom: four beats of warp, one of weft.",
    projectId: "loom-and-line",
  },
  {
    id: "blue-hour",
    title: "Blue hour",
    creator: "Marina Costa",
    creatorId: "marina-costa",
    location: "São Paulo",
    asset: "blue-hour",
    tags: ["photography", "light", "architecture"],
    description:
      "Marina's reference photo of the line's last stop by the sea, taken at blue hour before she drew the anniversary panels.",
    projectId: "metro-moves",
  },
  {
    id: "soft-structures",
    title: "Soft structures",
    creator: "Marina Costa",
    creatorId: "marina-costa",
    location: "São Paulo",
    asset: "soft-structures",
    tags: ["material", "colour", "texture"],
    description:
      "The clay and paper models Marina built by hand before animating Sphere Study, to see how light should fall on a single form.",
    projectId: "sphere-study",
  },
  {
    id: "moving-colour",
    motionSrc: "/assets/kresilo/collage-shuffle.mp4",
    title: "Moving colour",
    creator: "Marina Costa",
    creatorId: "marina-costa",
    location: "São Paulo",
    asset: "moving-colour",
    tags: ["motion", "colour", "light"],
    description:
      "An early colour loop for Ligeiro: the arrival moment, before it became the app's logo animation.",
    projectId: "ligeiro-motion",
  },
);
export function asReference(workId: string, reason: string): Reference | null {
  const w = works.find((w) => w.id === workId);
  return w
    ? {
        id: crypto.randomUUID(),
        workId: w.id,
        title: w.title,
        creator: w.creator,
        source: `/work/${w.id}`,
        reason,
        asset: w.asset,
        tags: w.tags,
      }
    : null;
}
works.push(
  {
    id: "tidal-lines",
    title: "Tidal lines",
    creator: "Ren Sato",
    creatorId: "ren-sato",
    location: "Kyoto",
    asset: "tidal-lines",
    tags: ["illustration", "light", "colour"],
    description:
      "The tide-line drawing behind the Tidewater Co-op mark, made from the harbour's real tide tables.",
    projectId: "tidewater-coop",
  },
  {
    id: "chrome-orbit",
    title: "Chrome orbit",
    creator: "Ren Sato",
    creatorId: "ren-sato",
    location: "Kyoto",
    asset: "chrome-orbit",
    motionSrc: "/assets/kresilo/orbit-cuts.mp4",
    tags: ["geometry", "material", "light", "motion"],
    description:
      "The loop that opened the first Friday listening night at Kaigan Records: one chrome ring, cut four times a second.",
    projectId: "friday-loops",
  },
  {
    id: "red-interval",
    title: "Red interval",
    creator: "Leila Haddad",
    creatorId: "leila-haddad",
    location: "Beirut",
    asset: "red-interval",
    motionSrc: "/assets/kresilo/type-rush.mp4",
    tags: ["type", "print", "culture", "motion"],
    description:
      "The moving poster for Ink Before Noon's first morning: one red word punched in on every half-second, like a line being read aloud.",
    projectId: "ink-before-noon",
  },
  {
    id: "night-signal",
    title: "Night signal",
    creator: "Leila Haddad",
    creatorId: "leila-haddad",
    location: "Beirut",
    asset: "night-signal",
    motionSrc: "/assets/kresilo/signal-shuffle.mp4",
    tags: ["geometry", "colour", "culture", "motion"],
    description:
      "The loop that plays in Lantern Books' window after closing, so the shop still says hello to the street at night.",
    projectId: "lantern-books",
  },
  {
    id: "garden-grid",
    title: "Garden grid",
    creator: "Inês Duarte",
    creatorId: "ines-duarte",
    location: "Lisbon",
    asset: "garden-grid",
    tags: ["illustration", "material", "colour"],
    description:
      "A two-colour riso test sheet from Azul Press: leaves in green on pink, printed to check how the inks overlap.",
    projectId: "azul-press",
  },
  {
    id: "paper-orbit",
    title: "Paper orbit",
    creator: "Inês Duarte",
    creatorId: "ines-duarte",
    location: "Lisbon",
    asset: "paper-orbit",
    tags: ["geometry", "material", "texture"],
    description:
      "An early fold model for the Folded Almanac: twelve months as arcs, before the school chose the pocket version.",
    projectId: "folded-almanac",
  },
);
export type RecommendationMode =
  | "For you"
  | "This project"
  | "Following"
  | "Explore by place";
export function recommend(
  person: Person | undefined,
  project: Project | undefined,
  mode: RecommendationMode,
  place = "",
) {
  const taste = person?.taste ?? [],
    projectTags = project?.references.flatMap((r) => r.tags) ?? [];
  return works
    .filter(
      (w) =>
        (mode !== "Following" || person?.following.includes(w.creatorId)) &&
        (!place || w.location.toLowerCase() === place.toLowerCase()),
    )
    .map((w) => {
      const matches = w.tags.filter((t) =>
        (mode === "This project"
          ? projectTags
          : [...projectTags, ...taste]
        ).includes(t),
      );
      return {
        ...w,
        score: w.tags.reduce(
          (n, t) =>
            n +
            ((mode === "This project" || mode === "For you") &&
            projectTags.includes(t)
              ? 5
              : 0) +
            (mode === "For you" && taste.includes(t) ? 2 : 0),
          0,
        ),
        why: matches.length
          ? `Shares ${matches.slice(0, 2).join(" and ")} with ${projectTags.length ? "your project references" : "your chosen interests"}.`
          : place
            ? `A work by a creator based in ${place}.`
            : "An editorial starting point. Choose interests or save references to shape this selection.",
      };
    })
    .sort((a, b) => {
      const order = [
        "after-light",
        "market-rhythm",
        "blue-hour",
        "mineral-notes",
        "different-angles",
        "paper-weather",
        "moving-colour",
        "dusk-study",
        "quiet-type",
        "soft-structures",
      ];
      return b.score - a.score || order.indexOf(a.id) - order.indexOf(b.id);
    });
}

export const afterLightArt: Art = {
  title: "After\nlight",
  color: "#FFF7E3",
  size: 31,
  x: 6,
  y: 6,
  asset: "after-light",
};
