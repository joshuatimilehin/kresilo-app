# Kresilo brand and interface guidelines

Owner direction, October 22, 2026. Every person and every AI agent that changes a Kresilo screen follows this. [AI_RULES.md](AI_RULES.md) is the short checklist for agents; this file is the reasoning. `AGENTS.md` still governs scope and delivery.

## The brand in three words

**Clean. Visual. Story-led.** Kresilo is for artists and designers. The work is the star; the interface steps back. People learn the product by looking at it, not by reading it.

## How guidance works here

Guidance is seen, not read. In order of preference:

1. **The design itself.** Placement, size, colour and motion make the next step obvious.
2. **Icons.** Every tool, toggle and action is an icon with an accessible name for screen readers.
3. **Previews.** Show the result before it is committed. Confirm with an icon button.
4. **One place for names.** A hover tooltip on an icon is fine. On touch, and for keyboard users, one fixed readout shows the name of the tool that is *selected*, in one fixed place (the same spot on every screen that has tools), and only while a tool is selected. When nothing is selected, nothing is shown.
5. **Words last.** A one-word label only where two icons would be confused.

## Invented makers and AI pictures

Owner decision, October 23, 2026. Screens never say "sample", "demo" or "fictional sample practice"; makers, clients and collections read like real ones. The site footer says once that the makers and clients shown are fictional. Pictures made with an image model keep a small sparkle mark (hover: "AI-generated image") wherever they show, because Kresilo never lets AI work pass as hand work.

## What text is for

Text is **content**, not scaffolding.

| Stays (content) | Goes (scaffolding) |
|---|---|
| Maker stories, project briefs, captions | "How to" paragraphs and step lists |
| Credits and who made what | Hint strips and gesture explainers |
| Rules for sharing and using an asset | Status banners that restate what the screen shows |
| Consent and legal wording | Reassurance ("Don't worry, nothing is saved until…") |
| Names, titles, counts that identify a thing | Subtitles that repeat the title, descriptions under every card |

## Layout

- The canvas or the artwork leads. Controls float next to the object they change (toolbox, quick bar), or tuck into drawers and bottom sheets.
- One primary action per view. At most five visible controls in a cluster. Never stack two toolbars.
- Cards show the picture, the title and, at most, one short identifying line. Not a paragraph.
- Phone first: if it feels crowded at 375px, remove things. The default direction is fewer.

## Results and errors

An icon and at most one short line, with the next step as a button. No paragraphs.

## Checking a change

Look at it in the browser at phone and desktop widths, in dark and light, before calling it done. In the pull request, state the words removed and the words added; the goal for guidance text is zero.

## Enforcement

`tests/brand-rules.test.ts` fails the build when known hint-text patterns return. It is a floor, not the rule: the guidelines above apply to everything, including text the test cannot see.

## Identity: logo, colour, type, voice

The interface rules above say how a screen behaves. This section says what Kresilo looks and sounds like anywhere it appears: product, site, decks, video, social.

### The logo

The official Kresilo logo is the wordmark on the website: "Kresilo" set in Instrument Serif italic (`public/assets/kresilo/instrument-serif-italic.ttf`), tight tracking (about -0.04em), one line, no other styling. The site renders it with `.brand-wordmark` in `src/creative/theme.css`. Anywhere else (decks, video, social, print) set it the same way from that font; do not use a different script or a traced image.

The earlier script wordmark on the Kristello brand board (`kresilo-brand-board.png`) and the brush `kresilo-wordmark.webp` are not the logo.

Rules:

- Ink `#0A0C0E` on light and chartreuse grounds, ivory `#EDEAE3` on dark grounds. No gradients, outlines, effects or photographs behind it.
- Never stretch or recolour it, and never swap the font.
- One wordmark per view. The cover and closing slide of a deck show it large; every other slide carries it small in the footer.

### Colour

Source: `src/lib/brand.ts`. Ink and ivory carry the work; chartreuse is the signature and is used sparingly, as a ground for the logo and as the single accent for primary actions.

| Role | Hex |
|---|---|
| Ink | `#0A0C0E` (soft `#101315`) |
| Ivory | `#EDEAE3` (paper `#F2F1ED`) |
| Chartreuse (signature accent) | `#C7FE02` |
| Violet (AI and signal) | `#8B5CF8` |
| Mint | `#7ED5B5` |
| Terracotta | `#C85731` |
| Teal | `#204F4D` |

Artwork supplies the rest of the colour. The interface never competes with it.

### Type

- **Display:** Instrument Serif, italic, tight leading, for headlines and the names of things (`public/assets/kresilo/instrument-serif-italic.ttf`).
- **Interface and body:** Inter (`inter-variable.ttf`).
- **Labels:** a small uppercase monospace with wide tracking, for eyebrows and counters only.

### Voice

Editorial, precise, creative. Confident and visual, written for artists and designers. Say what people can now do ("Develop how you see, not just what you make"), in plain words, and let the picture carry the rest.

- Lead with what the product empowers a person to do, not with how it is built.
- No audit tone, no "why X, why not Y" prose, no generic SaaS claims.
- No invented integrations, traction or numbers. A figure needs a source.
- Credit travels with the work: say who made it.

### Decks and video

The pitch deck (`pitch-deck/`) and the demo video follow this section. Slides alternate ink, paper and chartreuse grounds; the website wordmark is large only on the cover and close. Rebuild the PDF from `pitch-deck/deck.html` with `pitch-deck/build.mjs` after any change, and look at every page before sharing it.
