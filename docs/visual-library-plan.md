# Visual library and packs

Studio places pre-made pictures, matched by meaning and recoloured to the project's palette. This is what is live, what is saved for next, and how the next batches are made.

## Live now

- **285 pictures** in `public/assets/kresilo/visuals/`, catalogued in `src/creative/visuals/library.json`: ink drawings in five hands (brush, line, linocut, stipple, scratchboard), plus two-tone photos and textures.
- **Recolouring**: ink pictures take one ink colour with their white ground cleared; two-tone pictures run from an ink colour to a ground colour. One SVG filter serves the canvas, previews and motion export; a canvas version serves event covers. A picture's own transparency is kept.
- **Placement**: the assistant reads a short list (id, about, a few meanings) and picks by context, no embeddings. Ask for "a hand-drawn loaf" and one is placed in the project's ink.
- **Quality bar**: every picture passes a pixel check (ground, margins, strokes, no colour) and is looked at on a contact sheet. Sixteen weak ones were left out rather than shipped.
- **Made with**: Grok Imagine for most pictures, Codex for the first 110. The total for this round was capped at 300 generations.

## Saved for next: 1,326 pack concepts

Each concept is a titled pack with its meanings, a list of items and one style line, so a pack reads as one family. They are kept as data, not generated.

| Group | Concepts | What it covers |
| --- | --- | --- |
| Sticker packs | 400 | bakery stickers, houseplants and more, die-cut with a white border |
| Icon packs | 200 | highlight covers and tool sets on a single grid, starting with food |
| UI/UX and brand template packs | 120 | editable layouts: ordering, onboarding, identity sheets |
| Cultural packs | 316 | craft and making tools of Japan and Brazil (150 each), plus 8 Africa and 8 Europe packs to grow from |
| Art, music, philosophy and history | 290 | oil painting kit (150), Stone Age toolkit (100), 20 music packs and 20 philosophy packs |

Cultural packs name a reader from that country to check them before they ship. They show ordinary workshop objects, never sacred or ceremonial ones.

## How a batch is made

1. Pick topics, at most 10 pictures each. A hundred topics is about a thousand pictures.
2. Write the story first: who uses this and why. Every picture comes from a story.
3. Generate with Grok, six at a time, about 13 seconds each. Take inspiration from references and draw our own originals; a reference's licence is never the reason to stop.
4. Run the pixel check, then review a contact sheet of the first batch before making more.
5. Build the library entries, run `pnpm visuals:manifest`, then the full build, and ship.

## Where files live

The repository holds the first thousand or so pictures at about 90KB each. Beyond that they go to object storage and the catalogue points at them.

## Template packs

UI/UX and brand-identity templates are layouts, not pictures. They are built from the saved concepts as editable layers in Studio and offered by the in-product designers (type, colour, layout), so the assistant picks a template and fills it with the library's pictures.
