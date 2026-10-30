// Builds kresilo-pitch-deck.pdf (1440x810 pt per page) and review PNGs from deck.html.
// Usage: node pitch-deck/build.mjs   (needs puppeteer-core from the repo and a Chromium-based browser)
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_CORE || "puppeteer-core");
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const browserPath = process.env.CHROME_PATH || "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
const previews = resolve(process.argv[2] || resolve(here, "preview"));
mkdirSync(previews, { recursive: true });

const browser = await puppeteer.launch({ executablePath: browserPath, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.goto(pathToFileURL(resolve(here, "deck.html")).href, { waitUntil: "networkidle0" });
await page.evaluate(() => document.fonts.ready);

const slides = await page.$$("section.s");
for (let i = 0; i < slides.length; i++) {
  await slides[i].screenshot({ path: resolve(previews, `s${String(i + 1).padStart(2, "0")}.png`) });
}
await page.pdf({ path: resolve(here, "kresilo-pitch-deck.pdf"), width: "20in", height: "11.25in", printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log(`${slides.length} slides`);
