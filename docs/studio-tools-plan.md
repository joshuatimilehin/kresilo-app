# Studio editing tools plan (PROPOSAL, not accepted scope)

Status: draft for owner review, October 22, 2026. Issue #53, parent #29; related #31, #32, #50, #51. Labels: **observed** = read in the repository, the npm registry or Open Design's source on October 22, 2026; **inference** = my reading, untested; **proposal** = does not exist.

## What exists today (observed)

- A layer is an image with `x`, `y`, `width`, `height`, `opacity`, `rotation`, `visible` and a four-value `filter` (none, grayscale, warm, cool); at most 12 layers; plus a separate title with colour, size and position (`src/creative/contracts.ts`).
- Rotation exists in the data and through the prompt box ("rotate 15") and the Layers panel numbers, but there is **no rotate or resize handle on the canvas**; direct manipulation is only dragging an image or the title (`Editor.tsx`, `startDrag`).
- Missing: crop, mask, shadow, blend mode, shape layers, text layers beyond the title, typography controls, flip, align and snap, grouping, numeric filters.
- All edits go through one typed command service; any new tool must extend `layerAdjustment` and keep that path (and the existing 85 tests).

## The tools, by help level (proposal)

| Tool | Beginner | Casual | Expert |
|---|---|---|---|
| Move | yes | yes | yes, with snap guides and arrow-key nudge |
| Resize (corner handles) | yes | yes | yes, with numeric fields and aspect lock |
| Rotate handle | yes | yes | yes, with angle field and flip |
| Opacity | yes | yes | yes |
| Filter presets | 4 presets | presets | plus sliders: brightness, contrast, saturation, blur, grain |
| Crop | preset shapes (square, 4:5, 16:9) | free crop with handles | exact numbers and position inside the crop |
| Mask | no | ellipse, rounded rectangle | plus feather, invert, brush mask |
| Shadow | no | presets (soft, hard) | offset, blur, colour, opacity |
| Blend mode | no | multiply, screen, overlay | full list |
| Shapes | no | rectangle, ellipse, line | plus fill, stroke, corner radius |
| Typography | colour and size | font, weight, alignment | plus line height, letter spacing, text layers |
| Align and group | no | align | align, distribute, group |
| Console command for each tool | no | no | yes, same command service as the buttons |

Beginner sees about six tools; casual about twelve; expert all. A layer locked as hand-only or AI-locked (#51) shows a lock and cannot be edited by AI. Every tool edit is recorded as a **hand** step with the tool named (#50); non-destructive, so the original image is always kept; undo and redo cover every tool.

## Build or reuse

| Piece | Decision (inference) | Why |
|---|---|---|
| **Move, resize, rotate handles and snap guides** | **Build in-house** on the existing pointer code | The geometry is simple (percent-positioned rectangles). `react-moveable` (MIT) offers draggable, resizable, scalable, rotatable, warpable, pinchable, groupable and snappable, but its last npm release was December 2023, it is 4.6 MB unpacked, and React 19 compatibility is not declared. Keep it as a fallback only if grouping and snapping get complex, after a compatibility test. |
| **Crop** | **Build**: store a crop rectangle and position as parameters, render with CSS; reuse the resize handles | Non-destructive and stays editable. `cropperjs` 2 (MIT) and `react-image-crop` (ISC) exist but would add a second interaction model. |
| **Mask** | **Build** as parameters: shape, size, feather, invert, rendered with CSS `clip-path` or `mask-image` | Works in the HTML that Kresilo's motion renderer already uses, so masks carry into exports. Brush masks (painted alpha) need a canvas and a stored alpha image; defer to expert and to the storage design in #50. |
| **Shadow, blend, numeric filters** | **Build** as parameters rendered with CSS `drop-shadow`, `mix-blend-mode` and `filter` | No library needed. Grain needs an SVG filter. |
| **Typography** | **Build**, reusing the fonts already loaded | Extend the title and allow text layers. |
| **Open Design's manual-edit components** | **Patterns only, not code** | Observed: its panel covers size, spacing, type, colour, opacity, radius and blur on HTML elements, with patch-based undo, but has no rotate, shadow, crop or mask; it depends on its own types and React 18. Reuse the panel grouping and the patch-style history idea; copying any code needs Apache-2.0 notices in `THIRD_PARTY_NOTICES.md`. |
| **Retouch (heal, clone)** | **Out of scope** for now | Needs raster editing; revisit with photo tools in #49. |

## Order of work

1. Add the parameters to the schema and `layerAdjustment` (rotation already present; add crop, mask, shadow, blend, flip, numeric filters) with tests; render them in the editor and the motion renderer.
2. Direct-manipulation handles: resize, rotate, snap guides, on desktop and touch.
3. Tool panel with the three help levels and AI locks.
4. Typography and text layers; shapes.
5. Brush masks and grouping for expert.

Acceptance and the tool list live on #53. Open questions for the owner: how many layers (the cap is 12 today), whether text should be a layer, and whether retouching belongs in the prototype.
