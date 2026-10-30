/**
 * A researched persona bible for one maker (docs/persona-asset-plan.md). It
 * describes one invented person's practice, grounded in how the craft is
 * really done in their place. Sources are for facts about craft and place
 * only, never copied images, and never a real, identifiable person.
 */
export type Persona = {
  makerId: string;
  /** How they learned, where they work, the tools and suppliers they use. */
  studio: {
    training: string;
    room: string;
    tools: string[];
    materials: string[];
    hours: string;
  };
  /** What makes their work recognisably theirs. */
  hand: {
    line: string;
    signatureMoves: string[];
    /** Two or three recurring, secular motifs. */
    motifs: string[];
    type: string;
    keptImperfections: string[];
  };
  /** Early and current palettes (hex), and why it changed. */
  palette: { early: string[]; current: string[]; why: string };
  subjects: { clients: string; places: string[]; returningClient: string };
  /** How they photograph their own work: becomes the image look. */
  presentation: { camera: string; light: string; surfaces: string; framing: string };
  voice: { captions: string; neverSays: string[] };
  /** What to exclude for this culture, and questions for a regional reader. */
  respect: { exclude: string[]; askAReader: string[] };
  /** Pages consulted for craft and place facts (URL and what was taken from it). */
  sources: { url: string; used: string }[];
};
