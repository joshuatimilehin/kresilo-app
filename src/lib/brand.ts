/**
 * Kresilo brand tokens + demo copy. Single source for the homepage and the
 * Studio so colour and type never drift apart.
 *
 * Kresilo ink / Salt Flats ivory / chartreuse accent / violet signal.
 * Interface type stays small and restrained: 11–13px sans, 10px mono labels.
 */
export const brand = {
  ink: "#0A0C0E",
  inkSoft: "#101315",
  paper: "#0E1113",
  ivory: "#EDEAE3",
  ivoryDim: "rgba(237,234,227,0.58)",
  ivoryFaint: "rgba(237,234,227,0.24)",
  hairline: "rgba(237,234,227,0.10)",
  hairlineStrong: "rgba(237,234,227,0.19)",
  accent: "#C7FE02",
  violet: "#8B5CF8",
  terracotta: "#C85731",
  teal: "#204F4D",
  mint: "#7ED5B5",
} as const;

export const HOME = {
  wordmark: "Kresilo",
  eyebrow: "Interactive prototype",
  headline: [
    "Culture feeds creativity.",
    "Creativity produces culture.",
  ] as const,
  standfirst:
    "Kresilo is a design workspace that treats references, proposals and decisions as one continuous record. It learns from the culture you gather and gives back work you can defend.",
  chips: [
    "Interactive prototype",
    "Single project",
    "Salt Flats artwork by Kristello",
  ] as const,
  /** Plain creative-workflow copy: what the project keeps, in a person's words. */
  keeps: [
    { name: "References", gloss: "each one kept with the reason it belongs" },
    { name: "Decisions", gloss: "what you chose, and what justified it" },
    { name: "Versions", gloss: "the poster as it stood at each step" },
    { name: "History", gloss: "an account of the work, in order" },
  ] as const,
  /** The cleared brand board that ships with this prototype. */
  brandBoard: {
    src: "/assets/kresilo/kresilo-brand-board.png",
    alt: "Kresilo wordmark drawn in black script on a chartreuse brand board by Kristello",
    credit: "Kresilo brand board · artwork by Kristello",
  },
} as const;

export const FOOTNOTE =
  "No image service is called and no credit is spent without being shown. The Copilot uses local rules by default; when a model is configured, every proposal names the model and its cost.";
