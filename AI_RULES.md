# AI rules for building Kresilo's interface

For every agent and model that changes this product's screens. The reasoning is in [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md); `tests/brand-rules.test.ts` enforces the floor. Owner direction, October 22, 2026. `AGENTS.md` still governs scope and delivery; these rules govern how the product looks and guides people.

## Our brand

Clean design. Visual storytelling. Guidance that is **seen, not read**.

## The rules

1. **Do not add hint strips, helper sentences, status banners or "how it works" paragraphs to working screens.** Do not explain a flow in words to make up for a design that is unclear. Fix the design.
2. **Guide with the picture.** Use icons, shape, colour, placement, motion, highlights, previews and progressive disclosure. If a label seems needed, first ask whether an icon, a position or a preview already says it. A person should be able to remove the sentence and lose nothing.
3. **Icons are the buttons.** Tools are icon-only with an `aria-label`. A hover tooltip on an icon is fine. Beyond that, show the name of the **selected** tool in one fixed place (the same spot on every screen with tools), only while a tool is selected, and nothing otherwise. Use a visible label on the button itself only when two icons would be confused, and keep it to one word.
4. **Put controls next to the thing they change.** A floating toolbox or quick bar anchored to the selected object, with drawers or sheets for anything secondary. Never a long scroll of stacked toolbars, switches and fields.
5. **Keep it sparse.** One primary action per view. At most five visible controls in a cluster. Never stack two toolbars. On a phone, the canvas leads and everything else tucks away.
6. **Preview before commit.** Show the result visually and confirm with an icon button. Do not describe the result in text.
7. **Results and errors are an icon and, at most, one short line.** No paragraphs. Offer the next step as a button, not an instruction.
8. **Text belongs to the story, not the scaffolding.** Maker stories, project briefs, credits, rules for using an asset and legal or consent wording are content and stay. Instructions, hints and reassurance do not.
9. **Check it with your eyes.** Before saying a screen is done, look at it in the browser at phone width and desktop width, in dark and light. If it feels crowded, remove elements; the default direction is fewer.
10. **When you touch a screen, remove the tooltip and hint text already on it.** Say in the pull request how many words you took out and put in. The goal for guidance text is zero.

## A check before adding any text to a user path

- Could an icon, shape, colour, position, motion or preview say this?
- Would a first-time visitor miss it if it were gone?
- Is it content (story, credit, rule) or scaffolding (hint, reassurance, instruction)?

If it is scaffolding, do not add it.
