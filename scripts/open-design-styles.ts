/**
 * Brings the vetted Open Design design systems into Kresilo as data. Only
 * generic styles are taken: none named after a company, product, franchise or
 * person, and none tied to a culture's script. Each keeps its palette, its
 * fonts and a short version of its rules for the assistant to follow.
 *
 * Run with: pnpm exec jiti scripts/open-design-styles.ts <path to open-design checkout>
 * Writes src/creative/openDesign/styles.json. Open Design is Apache-2.0
 * (see THIRD_PARTY_NOTICES.md).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const VETTED = [
  "artistic", "atelier-zero", "bento", "bold", "brutalism", "cafe", "claymorphism", "clean", "colorful", "contemporary",
  "cosmic", "creative", "dithered", "doodle", "dramatic", "editorial", "elegant", "energetic", "expressive", "fantasy",
  "flat", "friendly", "futuristic", "glassmorphism", "gradient", "kami", "levels", "luxury", "minimal", "modern",
  "mono", "neobrutalism", "neon", "neumorphism", "paper", "perspective", "premium", "publication", "refined", "retro",
  "simple", "skeumorphism", "sleek", "spacious", "storytelling", "vibrant", "vintage", "warm-editorial",
];

/** Names of real publications or products some rules mention as inspiration; they never reach Kresilo. */
const STRIP = /\s*\((?:[^()]*\b(?:Monocle|Apartamento|IDEA)\b[^()]*)\)|\b(?:Monocle|Apartamento|IDEA)\b,?\s*/g;

const root = process.argv[2];
if (!root) throw new Error("Give the path to an Open Design checkout.");

/** Any CSS colour the tokens use, as #rrggbb; see-through colours are blended over the background. */
function hex(v: string, over = "#ffffff"): string {
  const h = v.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(h)) return h;
  if (/^#[0-9a-f]{3}$/.test(h)) return `#${[...h.slice(1)].map((c) => c + c).join("")}`;
  const m = h.match(/^rgba?\(([^)]+)\)$/);
  if (!m) return "";
  const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  const base = hex(over).slice(1).match(/../g)!.map((x) => parseInt(x, 16));
  return `#${[r, g, b].map((c, i) => Math.round(c * a + base[i] * (1 - a)).toString(16).padStart(2, "0")).join("")}`;
}

const firstFont = (v = "") => v.split(",")[0].replace(/["']/g, "").trim();
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).replace(/\s+\S*$/, "")}…` : s);
const section = (md: string, n: number) => {
  const m = md.match(new RegExp(`## ${n}\\.[^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`));
  return (m?.[1] ?? "")
    .split("\n")
    .map((l) => l.replace(/^[-*]\s*/, "").replace(/\*\*/g, "").replace(/`/g, "").trim())
    .filter((l) => l && !l.startsWith(">") && !l.startsWith("|") && !l.startsWith("#"))
    .join(" ");
};

const styles = VETTED.map((id) => {
  const dir = join(root, "design-systems", id);
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  const md = readFileSync(join(dir, "DESIGN.md"), "utf8").replace(STRIP, " ");
  const tokens: { name: string; value: string }[] = JSON.parse(readFileSync(join(dir, "design-tokens.json"), "utf8")).tokens;
  const t = (name: string) => tokens.find((x) => x.name === name)?.value ?? "";
  // The summary is the quoted block under the title, which can run over several lines.
  const quote = md.match(/((?:^> .*\n)+)/m)?.[1] ?? "";
  const summary = quote
    .split("\n")
    .map((l) => l.replace(/^>\s?/, "").trim())
    .filter((l) => l && !l.startsWith("Category:") && !/^Inspired by/i.test(l))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  // Template filler that says nothing about the look is left out.
  const filler = /\s*(?:Color stance|Design intent):[^.]*\.?(?:[^.]*readability\.)?/g;
  const rules = clip(
    [section(md, 1), section(md, 5), section(md, 7).split(". ")[0]]
      .filter(Boolean)
      .join(" ")
      .replace(filler, " ")
      .replace(/Visual style: ([^.]*?)(?= [A-Z]|$)/, "Visual style: $1.")
      .replace(/\s+/g, " ")
      .replace(/ \./g, ".")
      .trim(),
    900,
  );
  return {
    id,
    name: String(manifest.name).replace(/^Design System Inspired by /, "").replace(/\s*\(.*\)$/, "").replace(/^kami$/, "Kami"),
    category: manifest.category,
    summary: clip(summary, 200),
    palette: { bg: hex(t("--bg")), surface: hex(t("--surface"), hex(t("--bg"))), fg: hex(t("--fg"), hex(t("--bg"))), muted: hex(t("--muted"), hex(t("--bg"))), border: hex(t("--border"), hex(t("--bg"))), accent: hex(t("--accent"), hex(t("--bg"))) },
    fonts: { display: firstFont(t("--font-display")), body: firstFont(t("--font-body")) },
    rules,
    credit: id === "kami" ? "Open Design (Apache-2.0), after tw93/kami (MIT)" : "Open Design (Apache-2.0)",
  };
});

writeFileSync(join(process.cwd(), "src/creative/openDesign/styles.json"), JSON.stringify(styles, null, 1) + "\n");
console.log(`${styles.length} styles`);
