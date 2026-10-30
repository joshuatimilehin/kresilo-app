# Kresilo — Project Contract

## Main goal

Kresilo is a culture-first creative platform: people discover makers and work rooted in real places and crafts, make things in a studio where AI proposes and the artist decides, gather at events and on shared boards, and publish work that keeps its sources and credits. Owner direction for the people-first phase (October 22–23, 2026), tracked under [#29](https://github.com/Pukujan/kresilo/issues/29).

## Why

Keep creative references, reasons, proposals, accepted decisions and credit connected to the resulting artwork, and make creating with AI feel like the artist's own work.

## Scope

- **Discover:** a feed of works, culture stories, collections, thirty persona-based makers with photographic portraits, case studies, asset libraries and editable templates (including album covers and anime posters).
- **Create and Studio:** start from an idea, an image, a work, a template or a PowerPoint deck. Layers, text, shapes, drawing, a canvas that fills the screen with zoom, motion export, presentations, version history and publishing.
- **AI that asks:** proposals only, per-field permissions, layer focus, honest sources, AI-made parts marked, and a sticker maker.
- **Together:** events (in person, online and hybrid, with going and hosting), boards (yours, team and open), invitations by link.
- **Open platform:** one typed command service, also exposed over MCP for agents. Figma, Canva, Claude and Codex plugins and Open Design adapters are planned.
- **Runtime:** Octo `kresilo_demo` in the existing workspace. Migrations are written in `db/migrations` and applied by the owner.

## Non-goals

Native apps, payments, marketplace APIs, and claims about providers that have not been tested live.

## Definition of success

Every flow above works on phones, tablets and desktops at https://kresilo.design-bakery.com, passes the required checks, and reads as clean, visual and icon-led under [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md). Repository governance is tracked in issue #9, under bootstrap issue #2 and epic #1.

## Latest release

Release 920cc19 (PR #133, PowerPoint import) is live as of October 23, 2026. Later releases are recorded in [CHANGELOG.md](CHANGELOG.md) and on their pull requests. Migrations 006–010 are written and not yet applied to the live schema. [DELIVERY_REPORT.md](DELIVERY_REPORT.md) keeps the tested scope of the first accepted prototype.
