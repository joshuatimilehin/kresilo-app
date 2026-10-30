# Kresilo pitch deck (a16z Speedrun SR008)

- `kresilo-pitch-deck.pdf`: 14 pages, 1440 x 810 pt.
- `deck.html`: editable source. Slides are `<section class="s">` blocks at 1920 x 1080 px; type, colours and mock-ups come from `fonts/` and `assets/`.
- `build.mjs`: renders the PDF with puppeteer-core and Brave/Chrome.

```sh
PUPPETEER_CORE=$PWD/node_modules/.pnpm/puppeteer-core@25.15.0/node_modules/puppeteer-core node pitch-deck/build.mjs /tmp/deck-preview
```
