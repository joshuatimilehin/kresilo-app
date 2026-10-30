/**
 * Brings five Open Design deck templates into Kresilo as shells: each keeps
 * its own head (fonts, colours, type scale, entrance animations) and its
 * navigation script, with the sample slides taken out so Kresilo can put a
 * project's own slides in. The five are Zara Zhang's MIT-licensed templates
 * that share one set of colour variables and type classes.
 *
 * Run with: pnpm exec jiti scripts/open-design-decks.ts <path to open-design checkout>
 * Writes src/creative/openDesign/decks/<id>.html and decks.json.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const DECK_TEMPLATES = ["studio", "monochrome", "signal", "grove", "broadside"];

const root = process.argv[2];
if (!root) throw new Error("Give the path to an Open Design checkout.");
const out = join(process.cwd(), "src/creative/openDesign/decks");
mkdirSync(out, { recursive: true });

const meta = DECK_TEMPLATES.map((id) => {
  const dir = join(root, "design-templates", `html-ppt-zhangzara-${id}`);
  const html = readFileSync(join(dir, "example.html"), "utf8");
  const t = JSON.parse(readFileSync(join(dir, "template.json"), "utf8"));
  const license = readFileSync(join(dir, "LICENSE"), "utf8");
  if (!/^MIT License/.test(license)) throw new Error(`${id} is not MIT`);
  // The deck strip holds only the slides; everything before and after it stays.
  const open = html.indexOf('<div id="deck">');
  const first = html.indexOf("<section", open);
  const lastEnd = html.lastIndexOf("</section>") + "</section>".length;
  if (open < 0 || first < 0 || lastEnd < first) throw new Error(`${id}: no deck strip`);
  const shell = (html.slice(0, first) + "<!--KRESILO_SLIDES-->" + html.slice(lastEnd)).replace(/<title>[^<]*<\/title>/, "<title><!--KRESILO_TITLE--></title>");
  writeFileSync(join(out, `${id}.html`), shell);
  return {
    id,
    name: t.name as string,
    tagline: t.tagline as string,
    mood: (t.mood ?? []) as string[],
    palette: [...new Set(Object.values(t.palette ?? {}).filter((v): v is string => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v)).map((v) => v.toLowerCase()))].slice(0, 5),
    credit: "Template by Zara Zhang (MIT), from Open Design",
  };
});
writeFileSync(join(process.cwd(), "src/creative/openDesign/decks.json"), JSON.stringify(meta, null, 1) + "\n");
console.log(meta.map((m) => m.name).join(", "));
