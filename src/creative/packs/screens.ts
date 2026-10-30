import { LINE, type Sheet } from "./kit";
import type { DesktopKind, PhoneKind, Pack } from "./types";

/** What a screen is drawn with: the sheet, the pack's copy, the brand and which layout of the pack this is. */
export type Ctx = { s: Sheet; pack: Pack; brand: string; item: string; index: number };

const M = 7;
const CW = 86;

const PRICES = [3.4, 4.2, 3.8, 5.1];
const money = (n: number) => `£${n.toFixed(2)}`;

/** The first words of a screen's name, as its heading: "drink customiser sheet" becomes "Drink customiser". */
export function headingOf(item: string): string {
  const cut = item.split(/ with | and | by |, /)[0].replace(/\b(sheet|screen|page|kit|form|picker|view|state)$/i, "").trim() || item;
  const out = cut.charAt(0).toUpperCase() + cut.slice(1);
  return out.length > 28 ? out.slice(0, 27).trimEnd() : out;
}

/** The pack's four sample rows. */
const rowsOf = (p: Pack): [string, string][] => p.rows ?? [["First", "One"], ["Second", "Two"], ["Third", "Three"], ["Fourth", "Four"]];

const DAYS = ["Mon", "Tue", "Wed", "Thu"];
const TIMES = ["09:30", "10:15", "11:00", "12:45"];
const DATES = ["3 Nov", "9 Nov", "14 Nov", "21 Nov"];
const SPOTS = ["4 spots", "2 spots", "6 spots", "1 spot"];

/** The value shown beside a row, for the pack's kind of value. */
function valueOf(p: Pack, i: number): string {
  switch (p.value) {
    case "price":
      return money(PRICES[i % 4]);
    case "time":
      return TIMES[i % 4];
    case "date":
      return DATES[i % 4];
    case "count":
      return SPOTS[i % 4];
    default:
      return "";
  }
}

const initialsOf = (brand: string) => {
  const w = brand.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] ?? "K").slice(0, 2)).toUpperCase();
};

function cta({ s, pack, item }: Ctx, label = pack.cta ?? "Continue"): void {
  const h = 12.5;
  s.button("Primary button", label, { x: M, y: s.H - 7 - h, w: CW, h });
  void item;
}

/** A round picture at the top right, beside a heading. */
function badge(c: Ctx, i = 0) {
  return c.s.tile("Corner picture", c.index + i, { x: 100 - M - 15, y: 9, w: 15, h: 15 }, { round: true });
}

/** A phone's heading: the screen's name in the pack's type, beside a small picture. */
function head(c: Ctx, text = headingOf(c.item), withBadge = true): number {
  if (withBadge) badge(c);
  return c.s.title(text, M, 9, withBadge ? 68 : CW, 12, { lines: 2 });
}

const welcome = (c: Ctx) => {
  const { s, pack, brand } = c;
  s.tile("Hero picture", c.index, { x: M, y: 8, w: CW, h: 82 });
  const tb = s.title(brand, M, 96, CW, 15, { lines: 2 });
  s.text("Tagline", pack.tagline, M, tb + 3, 80, 4.6, { color: s.roles.muted, weight: 500 });
  [0, 1, 2].forEach((i) => s.oval(`Page dot ${i + 1}`, { x: M + i * 6.5, y: s.H - 31, w: 3.6, h: 3.6 }, i === 0 ? s.roles.accent : s.roles.line));
  cta(c);
};

const list = (c: Ctx) => {
  const { s, pack } = c;
  const rows = rowsOf(pack);
  const tb = head(c);
  const cy = tb + 4;
  s.rect("Chip selected", { x: M, y: cy, w: 22, h: 8.5 }, s.roles.accent, { radius: 4.2 });
  s.label("Chip selected label", "All", M, cy + 2.1, 22, 4, { color: s.roles.onAccent, align: "center" });
  s.label("Other chips", `${rows[1][0].split(" ")[0]}  ·  ${rows[2][0].split(" ")[0]}`, M + 27, cy + 2.1, 58, 4, { color: s.roles.muted });
  const withValue = Boolean(pack.value && pack.value !== "none");
  const n = withValue ? 3 : 4;
  const y0 = cy + 14;
  const rowH = Math.min(38, (s.H - 9 - y0) / n);
  const t = Math.min(rowH - 7, 24);
  for (let i = 0; i < n; i++) {
    const ry = y0 + i * rowH + (rowH - 7 - t) / 2;
    const [name, meta] = rows[(i + c.index) % 4];
    s.tile(`${name} picture`, c.index + i, { x: M, y: ry, w: t, h: t });
    const tx = M + t + 4;
    const tw = CW - t - 4 - (withValue ? 24 : 0);
    s.text(`${name} name`, name, tx, ry + t / 2 - 6.2, tw, 5.2, { weight: 800 });
    s.text(`${name} detail`, meta, tx, ry + t / 2 + 0.6, tw, 3.7, { color: s.roles.muted });
    if (withValue) s.text(`${name} value`, valueOf(pack, i + c.index), 100 - M - 24, ry + t / 2 - 3, 24, 5.2, { weight: 800, align: "right" });
  }
};

const detail = (c: Ctx) => {
  const { s, pack } = c;
  const [name, meta] = rowsOf(pack)[c.index % 4];
  s.tile("Hero picture", c.index + 1, { x: M, y: 8, w: CW, h: 76 });
  const tb = s.title(name, M, 90, CW, 12, { lines: 2 });
  const mb = s.text("Detail", meta, M, tb + 2, 60, 3.9, { color: s.roles.muted });
  const price = valueOf(pack, c.index) || money(PRICES[c.index % 4]);
  const pb = s.text("Price", price, M, mb + 3, 50, 8, { weight: 800 });
  [0, 1, 2].forEach((i) => s.rule(`Text line ${i + 1}`, M, pb + 6 + i * 6.5, i === 2 ? 52 : CW, s.roles.line, 5));
  cta(c);
};

const choice = (c: Ctx) => {
  const { s, pack } = c;
  const rows = rowsOf(pack);
  const tb = head(c);
  const cardH = Math.min(34, (s.H - 22 - 9 - tb) / 3 - 4);
  for (let i = 0; i < 3; i++) {
    const y = tb + 5 + i * (cardH + 4);
    const on = i === 0;
    s.rect(`Option ${i + 1}`, { x: M, y, w: CW, h: cardH }, "none", { radius: s.look.radius, edge: on ? 3 : 1, stroke: on ? s.roles.accent : s.roles.line });
    const t = cardH - 10;
    s.tile(`Option ${i + 1} picture`, c.index + i, { x: M + 5, y: y + 5, w: t, h: t }, { round: true });
    const [name, meta] = rows[(i + c.index) % 4];
    s.text(`Option ${i + 1} name`, name, M + t + 11, y + cardH / 2 - 6, CW - t - 16, 5.2, { weight: 800 });
    s.text(`Option ${i + 1} detail`, meta, M + t + 11, y + cardH / 2 + 0.8, CW - t - 16, 3.7, { color: s.roles.muted });
  }
  cta(c);
};

const WHEELS = {
  time: ["08:30", "09:00", "09:30", "10:00", "10:30"],
  money: ["£5", "£10", "£25", "£50", "£100"],
  count: ["1", "2", "3", "4", "5"],
};

const wheel = (c: Ctx) => {
  const { s, pack, item } = c;
  head(c);
  const values = /donation|amount/i.test(item) ? WHEELS.money : /quantity|spots|ticket/i.test(item) ? WHEELS.count : pack.value === "count" ? WHEELS.count : WHEELS.time;
  const cy = s.H * 0.5;
  s.rect("Selected value", { x: M, y: cy - 9, w: CW, h: 18 }, s.roles.surface, { radius: s.look.radius, edge: s.look.edge ? 1 : 0, stroke: s.roles.line });
  const sizes = [6, 8.5, 13, 8.5, 6];
  values.forEach((v, i) => {
    const mid = i === 2;
    const y = cy + (i - 2) * 19 - sizes[i] * LINE * 0.5;
    s.text(`Value ${i + 1}`, v, M, y, CW, sizes[i], { weight: mid ? 800 : 600, align: "center", color: mid ? s.roles.ink : s.roles.muted, opacity: mid ? 1 : i === 1 || i === 3 ? 0.8 : 0.5 });
  });
  cta(c);
};

const summary = (c: Ctx) => {
  const { s, pack } = c;
  const rows = rowsOf(pack);
  const tb = head(c);
  const y0 = tb + 5;
  const rowH = Math.min(25, (s.H - 56 - y0) / 3);
  let total = 0;
  for (let i = 0; i < 3; i++) {
    const ry = y0 + i * rowH;
    const price = PRICES[(i + c.index) % 4];
    total += price;
    s.tile(`Item ${i + 1} picture`, c.index + i, { x: M, y: ry, w: rowH - 5, h: rowH - 5 });
    s.text(`Item ${i + 1} name`, rows[(i + c.index) % 4][0], M + rowH + 1, ry + (rowH - 5) / 2 - 3, 46, 4.8, { weight: 700 });
    s.text(`Item ${i + 1} price`, money(price), 100 - M - 22, ry + (rowH - 5) / 2 - 3, 22, 4.8, { weight: 800, align: "right" });
  }
  const ty = y0 + 3 * rowH + 1;
  s.rule("Divider", M, ty, CW, s.roles.line, 1);
  s.label("Total label", "Total", M, ty + 5, 30, 4.4, { color: s.roles.muted });
  s.text("Total", money(total), 100 - M - 44, ty + 3, 44, 8, { weight: 800, align: "right" });
  cta(c);
};

const confirm = (c: Ctx) => {
  const { s, pack, brand } = c;
  const [name, meta] = rowsOf(pack)[c.index % 4];
  s.pic("Confirmation picture", c.index + 4, { x: M, y: 10, w: 48, h: 48 }, { ink: s.roles.onAccent, ground: s.roles.accent, mask: "ellipse" });
  const tb = s.title(headingOf(c.item), M, 66, CW, 12, { lines: 2 });
  s.text("Summary", `${name}\n${meta}`, M, tb + 3, CW, 4.6, { color: s.roles.muted });
  const cy = Math.max(tb + 22, 110);
  s.rect("Code box", { x: M, y: cy, w: CW, h: 20 }, "none", { radius: s.look.radius, edge: 2, stroke: s.roles.ink });
  s.text("Code", `${initialsOf(brand)}-2417`, M, cy + 4.4, CW, 9, { weight: 800, align: "center" });
  cta(c);
};

const pass = (c: Ctx) => {
  const { s, pack } = c;
  const [name, meta] = rowsOf(pack)[c.index % 4];
  const tb = head(c);
  const y = tb + 4;
  const h = Math.min(118, s.H - y - 8);
  s.rect("Pass", { x: M, y, w: CW, h }, "none", { radius: s.look.radius, edge: Math.max(1.5, s.look.edge), stroke: s.roles.ink });
  s.tile("Pass picture", c.index + 3, { x: M + 6, y: y + 6, w: CW - 12, h: h * 0.38 });
  const ey = y + h * 0.38 + 12;
  s.text("Event", name, M + 6, ey, CW - 12, 7, { weight: 800, font: s.look.font });
  s.text("Event detail", `${meta}  ${valueOf(pack, c.index) || TIMES[0]}`, M + 6, ey + 9.5, CW - 12, 3.9, { color: s.roles.muted });
  s.rule("Tear line", M + 6, ey + 18, CW - 12, s.roles.line, 2);
  const widths = [2.2, 3.6, 2.2, 2.2, 3.6, 2.2, 3.6];
  let x = M + 6;
  widths.forEach((w, i) => {
    s.rect(`Code bar ${i + 1}`, { x, y: ey + 23, w, h: Math.max(8, y + h - ey - 31) }, s.roles.ink);
    x += w + 2.6;
  });
};

const stamps = (c: Ctx) => {
  const { s } = c;
  const tb = head(c);
  const y = tb + 5;
  s.rect("Stamp card", { x: M, y, w: CW, h: 72 }, "none", { radius: s.look.radius, edge: 3, stroke: s.roles.accent });
  s.label("Stamp count", "3 of 8", M + 6, y + 6, 40, 4.6, { color: s.roles.ink });
  for (let i = 0; i < 8; i++) {
    const sx = M + 6 + (i % 4) * 20;
    const sy = y + 17 + Math.floor(i / 4) * 24;
    s.oval(`Stamp ${i + 1}`, { x: sx, y: sy, w: 14, h: 14 }, i < 3 ? s.roles.accent : "none", { edge: 2, stroke: i < 3 ? s.roles.accent : s.roles.line });
  }
  cta(c, "Use my reward");
};

const FIELDS = (item: string): string[] =>
  /expense/i.test(item) ? ["Amount", "Category", "Date"] : /reserve|request/i.test(item) ? ["Title", "Pickup day", "A note"] : /donor|details/i.test(item) ? ["Full name", "Email", "Phone"] : /reflection|rest/i.test(item) ? ["How it felt", "Energy", "A note"] : ["Name", "Email", "Date"];

const form = (c: Ctx) => {
  const { s, item } = c;
  const tb = head(c);
  const fh = 13;
  FIELDS(item).forEach((f, i) => {
    const y = tb + 6 + i * (fh + 13);
    s.label(`Field ${i + 1} label`, f, M, y, CW, 3.6, { color: s.roles.muted });
    s.rect(`Field ${i + 1}`, { x: M, y: y + 6, w: CW, h: fh }, s.roles.surface, { radius: s.look.radius, edge: 1, stroke: s.roles.line });
  });
  cta(c);
};

const board = (c: Ctx) => {
  const { s, pack } = c;
  const rows = rowsOf(pack);
  const tb = head(c);
  const by = tb + 5;
  s.rect("Header band", { x: M, y: by, w: CW, h: 12 }, s.roles.ink, { radius: s.look.radius * 0.6 });
  s.label("Header", pack.industry, M + 4, by + 4, 52, 3.4, { color: s.roles.ground });
  s.rect("Status chip", { x: 100 - M - 26, y: by + 2.2, w: 22, h: 7.6 }, s.roles.accent, { radius: 3.4 });
  s.label("Status", "On time", 100 - M - 26, by + 3.8, 22, 3.6, { color: s.roles.onAccent, align: "center" });
  const rowH = Math.min(26, (s.H - 8 - by - 12) / 4);
  for (let i = 0; i < 4; i++) {
    const ry = by + 16 + i * rowH;
    const when = pack.value === "time" ? TIMES[i] : pack.value === "date" ? DATES[i] : DAYS[i];
    s.text(`Time ${i + 1}`, when, M + 2, ry, 34, 8.5, { weight: 800 });
    s.text(`Place ${i + 1}`, rows[(i + c.index) % 4][0], M + 40, ry + 2, CW - 40, 5, { weight: 700 });
  }
};

/* Desktop: a wide canvas 100 by 56.25. The title leads across the top; everything else sits below it. */

const NAV_Y = 3.2;

function nav(c: Ctx) {
  const { s, pack } = c;
  s.oval("Logo mark", { x: M - 1, y: NAV_Y - 0.4, w: 2.6, h: 2.6 }, s.roles.accent);
  const words = pack.items.slice(1, 4).map((i) => headingOf(i).split(" ").slice(0, 2).join(" "));
  s.text("Navigation", words.join("   ·   "), 40, NAV_Y, 100 - M - 40 + 1, 1.7, { color: s.roles.muted, weight: 600, align: "right" });
}

const siteHome = (c: Ctx) => {
  const { s, pack, brand } = c;
  nav(c);
  const tb = s.title(brand, M, 7, 88, 12, { lines: 2 });
  const y0 = tb + 3;
  s.text("Tagline", pack.tagline, M, y0, 52, 2.7, { color: s.roles.muted });
  s.button("Primary button", pack.cta ?? "Continue", { x: M, y: Math.min(y0 + 8, s.H - 11), w: 20, h: 5.6 });
  s.tile("Hero picture", c.index, { x: 64, y: y0, w: 30, h: s.H - 4 - y0 });
};

const siteGrid = (c: Ctx) => {
  const { s, pack } = c;
  const rows = rowsOf(pack);
  nav(c);
  const tb = s.title(headingOf(c.item), M, 7, 88, 12, { lines: 2 });
  const gy = tb + 3;
  const tileH = Math.max(8, s.H - 4 - 6 - gy);
  for (let i = 0; i < 4; i++) {
    const x = M + i * 22;
    s.tile(`${rows[i][0]} picture`, c.index + i, { x, y: gy, w: 19, h: tileH });
    s.text(`${rows[i][0]} name`, rows[i][0], x, gy + tileH + 1.2, 19, 1.9, { weight: 700 });
  }
};

const siteDetail = (c: Ctx) => {
  const { s, pack } = c;
  const [name, meta] = rowsOf(pack)[c.index % 4];
  nav(c);
  const tb = s.title(name, M, 7, 88, 12, { lines: 2 });
  const y0 = tb + 3;
  s.tile("Hero picture", c.index + 1, { x: M, y: y0, w: 38, h: s.H - 4 - y0 });
  const x = 52;
  const mb = s.text("Detail", meta, x, y0, 42, 2.5, { color: s.roles.muted });
  const pb = s.text("Price", valueOf(pack, c.index) || money(PRICES[c.index % 4]), x, mb + 1.5, 42, 4.6, { weight: 800 });
  [0, 1].forEach((i) => s.rule(`Text line ${i + 1}`, x, pb + 3 + i * 3, i === 1 ? 26 : 42, s.roles.line, 3));
  s.button("Primary button", pack.cta ?? "Continue", { x, y: Math.min(pb + 12, s.H - 11), w: 20, h: 5.6 });
};

const dashboard = (c: Ctx) => {
  const { s, pack } = c;
  const rows = rowsOf(pack);
  s.rect("Sidebar", { x: 0, y: 0, w: 20, h: s.H }, s.roles.surface);
  s.tile("Sidebar picture", c.index, { x: 4, y: 4, w: 8, h: 8 }, { round: true });
  s.text("Sidebar links", pack.items.slice(0, 4).map((i) => headingOf(i).split(" ").slice(0, 2).join(" ")).join("\n"), 4, 17, 15.5, 1.7, { weight: 600 });
  const tb = s.title(headingOf(c.item), 24, 5, 70, 12, { lines: 2 });
  const cy = tb + 3;
  const ch = Math.min(15, (s.H - 3 - cy) * 0.5);
  [0, 1].forEach((i) => {
    const x = 24 + i * 36;
    s.rect(`Stat card ${i + 1}`, { x, y: cy, w: 34, h: ch }, "none", { radius: s.look.radius * 0.5, edge: 1, stroke: s.roles.line });
    s.text(`Stat ${i + 1}`, i === 0 ? valueOf(pack, 0) || money(PRICES[0]) : money(PRICES[1] * 10), x + 2.5, cy + ch / 2 - 3.2, 29, 4.6, { weight: 800 });
    s.text(`Stat ${i + 1} label`, rows[i][0], x + 2.5, cy + ch / 2 + 2.8, 29, 1.7, { color: s.roles.muted });
  });
  const by = cy + ch + 3;
  const bh = s.H - 3 - by;
  [0.55, 0.8, 0.45, 1].forEach((k, i) => s.rect(`Bar ${i + 1}`, { x: 24 + i * 9, y: by + bh * (1 - k), w: 6.4, h: Math.max(1.2, bh * k) }, i === 3 ? s.roles.accent : s.roles.line));
};

export const PHONE_BUILDERS: Record<PhoneKind, (c: Ctx) => void> = { welcome, list, detail, choice, wheel, summary, confirm, pass, stamps, form, board };
export const DESKTOP_BUILDERS: Record<DesktopKind, (c: Ctx) => void> = { "site-home": siteHome, "site-grid": siteGrid, "site-detail": siteDetail, dashboard };
