# DESIGN_ASSETS — original Kresilo reference pack and UI fidelity map

**Source Drive folder:** https://drive.google.com/drive/u/0/folders/1DXrA_fNi7gRB4Czh5ZaRJhsFtogyySqB

These are **reference links**, not assets already committed to this private repository. Local Codex must download them using authorized user access, inventory license/publication clearance, optimize web delivery and avoid relying on third-party hotlinks. The *original mockups* are the source of visual truth; the written product spec dictates what is real and which capabilities are deferred.

## Highest-priority visual references

| Role | Original file | Direct URL | Use for |
| --- | --- | --- | --- |
| Desktop Studio | `Studio mock-up .PNG` | https://drive.google.com/file/d/1JbgK7GvUaqbwt-kOqzrSmqeSlbCfXcYD/view | Overall Studio layout, visual hierarchy, sidebars |
| Desktop Studio alternate | `Studio functionalities.png` | https://drive.google.com/file/d/1zk7JrOm4RT63h1kHmwQ36nK6s5mEI5Az/view | Canvas, references, decisions, history, private state |
| Desktop example project | `aebd3b63-4195-4004-b0a2-bbbaa90fa68b.jpeg` | https://drive.google.com/file/d/1E--Sr8AOg49mBauqgpZDHWH8tVyemt-E/view | Salt Flats Identity hero/poster/source imagery |
| Desktop additional | `Studio.png` | https://drive.google.com/file/d/1o1WpoCo-wA4j_nnFZOo_FwXoIbfnXuIz/view | Workbench layout and information structure |
| Mobile seven-screen | `b6f6e9d0-cacf-4baf-9fd5-f0f98d9ca283.jpeg` | https://drive.google.com/file/d/18mMkX-3RvFBQ7OBa4cJTxJLPitsw8mHE/view | Canvas, proposal, chooser, folder sheet, site preview |
| Mobile nine-screen | `88ab017d-4584-44e1-b43b-3e02d339503c.jpeg` | https://drive.google.com/file/d/1l16WsHshsvkBnxmoHWAfjpRrzzjcKQ-5/view | Culture feed, lineage, mobile studio, terminal, History |
| Mobile assistant | `75322c53-8e64-4429-aead-4e93a948f2cd.jpeg` | https://drive.google.com/file/d/1cBXmIv8N7mOC51iTd5Spl2AaRbmCbp-F/view | Bottom Copilot/Claude contextual sheet |
| Copilot | `Copilot mock-up.PNG` | https://drive.google.com/file/d/1Smnbt_l6rKBC2Up_hA8I-j1ImDT1hA5T/view | Agent action proposals, approval UI |
| Copilot behavior | `Copilot functionalities.png` | https://drive.google.com/file/d/1SG5weyL5pcAcnaAOi35C91BIfJ19TPcd/view | Input/output/cost approval pattern |
| Publish preview | `Publish mock-up .PNG` | https://drive.google.com/file/d/1U61ltqHMj7t3rN9i5GrZ5G2JE-zAMIlD/view | Private/selective publish preview with credits |
| Published case study | `Published mock-up.PNG` | https://drive.google.com/file/d/14664XVY2Ky4Vf40HbczkBG7UpfHHPPGT/view | Editorial case-study page aesthetic |
| Extensions | `Extension.png` | https://drive.google.com/file/d/1_olBfW_rhkeo3oze01H4k0pFhCcTjaJ_/view | Tool modes, permissions, install vs connect |
| Style system | `Kresilo_Design_Brief.pdf` | https://drive.google.com/file/d/1hC4ynDqPsmynpAcxUj1K14EQ7An8mkUw/view | Official approximate palette, accessibility |
| Comprehensive UI explainer | `UI_UX Color explorations & design.pdf` | https://drive.google.com/file/d/1idWtg5KAo03Cw3ctL2wZHj3hInqPv9EA/view | Annotated intended flows, iconography, Publishing, Copilot |
| Interactive web reference | `kresilo-workbench.html` | https://drive.google.com/file/d/1XnKsD8WtbLKbimR25eQy7smFcdGcpbVP/view | UI motion/terminal/assistant concept **only**; provider calls simulated |
| Figma storyboard | `kresilo-figma-storyboard.html` | https://drive.google.com/file/d/1IX0JAcyaE0WEqgBaEghJ3zLuSom-RkK4/view | Extension explanation; no real API evidence |

## Brand pack / component assets

- `Kresilo colors.png`: https://drive.google.com/file/d/1p0qSxwIJKoTkPLX-xHNXglvkBPjBGTzL/view
- `Color explorations.png`: https://drive.google.com/file/d/1CK4A5ydxqkWbBakpSS2OT3V5WqAAEBn_/view
- `Iconography.png`: https://drive.google.com/file/d/1gdVYfC76waEhKn48PZ43odkarymPmCkz/view
- `Iconography mock-ups.PNG`: https://drive.google.com/file/d/1o4gmm4QqB25Slm4QN5QU_wa-blLrSw1v/view
- Additional individual PNG icons in Drive are named `kresilo_approve`, `kresilo_copilot`, `kresilo_decision`, `kresilo_deny`, `kresilo_discover`, `kresilo_draw`, `kresilo_extension`, `kresilo_history`, `kresilo_like`, `kresilo_note`, `kresilo_preview`, `kresilo_private`, `kresilo_project`, `kresilo_publish`, `kresilo_published`, `kresilo_reference`, `kresilo_save`, `kresilo_select`, `kresilo_share`, `kresilo_studio`, `kresilo_terminal`, `kresilo_version` (and more). Use only if appropriate/cleared; map names to components.
- Some artwork and visual references are **only embedded within collages**. First search for individual image pack sources. If absent, reconstruct a faithful composition with cleared graphics and HTML/CSS/SVG; do not make a flat screenshot masquerade as functional UI.

## Visual rules

- Desktop reference resolution ~1440 or larger: dark background, slim frame border, restrained corner radius, visible editing canvas in center, slim technical typography; menus and properties subordinate to artwork. Sidebar + canvas + Copilot + optional bottom terminal/history.
- Mobile reference resolution 390 or similar: project canvas first, assistant/approvals as sheets, bottom toolbar or views, not miniature desktop layout. Culture feed may be teased on homepage but a functioning feed is not part of this sprint.
- Homepage is new composition. It should use Salt Flats/other approved actual Kresilo artwork, Kresilo's script editorial mark, Ink/Ivory/Chartreuse colors and original architecture of `discover → interpret → create → publish`.
- **Approx tokens:** Ink `#111111`, Ivory `#F2F1ED`, Chartreuse `#C7FE02`, Violet `#8B5CF8`, Mint `#7ED5B5`, Pink `#FF6B9D`. These are sampled; final exact hex values require design-source confirmation.
- Prefer Instrument Sans body, Instrument Serif/editorial display and JetBrains Mono for terminal if permitted. Avoid uploading font binaries to repo.
- Create a table in `docs/asset_inventory.md` during implementation: source Drive ID → local filename → purpose → file hash → public display clearance → credit/usage.

## Required design verification

Capture local/deployed screenshots (not fake image composites) at 1440x900, 1280x800, 768x1024, 390x844 and 375x812. Compare side by side to visual references for content density, hierarchy, line heights, contrast, canvas size, approval card, and mobile sheets. Fix substantial mismatches before calling the prototype ready.

## Generated sample images

The sample portfolio's pictures in `public/assets/kresilo/gen` (project panels, asset packs, templates, and the six catalogue works from Tidal lines to Paper orbit, whose motion loops keep their own videos) were made for this prototype with an image model (`cx/gpt-image-2-codex` through InferHub). The prompts come from the sample data: run `pnpm exec jiti scripts/art-prompts.ts` to print them, and `pnpm exec jiti scripts/art-manifest.ts` after adding or removing a file. They show no real brands and no real people.

Every one of them carries a sparkle mark wherever it shows, and a project page whose pictures are generated says so beside "Made with AI?". The makers and stories are fictional; the pictures stand in for their work and are never presented as hand-made. Anything without a generated picture falls back to the SVG drawing in `src/creative/portfolio/Visuals.tsx`.
