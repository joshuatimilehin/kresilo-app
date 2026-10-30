import type { ReactNode } from "react";
import { assets as catalogAssets } from "../catalog";
import type { AssetKey } from "../contracts";
import { brandName, fitSize, hash, initials, pal, readable, SANS, SERIF } from "./draw";
import { artSrc, GenImage } from "./GenImage";
import { artThumb } from "./art";
import type { BrandTemplate, CasePanel, CaseStudy, LibraryAsset } from "./types";

/**
 * Everything on a sample project's page is shown here. Most pieces are sample
 * images made with an image model for the prototype (see GenImage, which
 * always marks them as AI-generated); anything without one is drawn in SVG
 * from the project's own palette and name. Every drawing is 400 by 300.
 */
const W = 400;
const H = 300;

function Frame({ label, bg, children }: { label: string; bg: string; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="vis" preserveAspectRatio="xMidYMid meet">
      {/* The background runs far past the 400 by 300 drawing, so any frame shape shows more background, never a crop. */}
      <rect x={-800} y={-600} width={2000} height={1500} fill={bg} />
      {children}
    </svg>
  );
}

/** A simple geometric mark chosen by the project's id, in two palette colours. */
export function Mark({ seed, x, y, size, a, b }: { seed: string; x: number; y: number; size: number; a: string; b: string }) {
  const k = hash(seed) % 6;
  const r = size / 2;
  const cx = x + r;
  const cy = y + r;
  switch (k) {
    case 0:
      return (
        <g>
          <circle cx={cx} cy={cy} r={r} fill={a} />
          <circle cx={cx + r * 0.35} cy={cy - r * 0.2} r={r * 0.55} fill={b} />
        </g>
      );
    case 1:
      return (
        <g>
          <path d={`M${x} ${cy + r} A${r} ${r} 0 0 1 ${x + size} ${cy + r} Z`} fill={a} />
          <rect x={x} y={cy + r + 3} width={size} height={size * 0.12} fill={b} />
        </g>
      );
    case 2:
      return (
        <g>
          <rect x={x} y={y} width={size} height={size} rx={size * 0.18} fill={a} transform={`rotate(45 ${cx} ${cy})`} />
          <circle cx={cx} cy={cy} r={r * 0.3} fill={b} />
        </g>
      );
    case 3:
      return (
        <g fill="none" stroke={a} strokeWidth={size * 0.1}>
          <circle cx={cx} cy={cy} r={r * 0.9} />
          <circle cx={cx} cy={cy} r={r * 0.55} stroke={b} />
        </g>
      );
    case 4:
      return (
        <g fill={a}>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={x + (i * size) / 4 + size * 0.03} y={y + (i % 2) * size * 0.2} width={size * 0.18} height={size * (1 - (i % 2) * 0.2)} rx={size * 0.05} fill={i % 2 ? b : a} />
          ))}
        </g>
      );
    default:
      return (
        <g>
          <path d={`M${cx} ${y} L${x + size} ${y + size} L${x} ${y + size} Z`} fill={a} />
          <circle cx={cx} cy={y + size * 0.62} r={size * 0.14} fill={b} />
        </g>
      );
  }
}

function Wordmark({ text, x, y, width, max = 54, fill, serif = true, anchor = "start", weight }: { text: string; x: number; y: number; width: number; max?: number; fill: string; serif?: boolean; anchor?: "start" | "middle"; weight?: number }) {
  return (
    <text x={x} y={y} fontSize={fitSize(text.length, width, max)} fill={fill} fontFamily={serif ? SERIF : SANS} fontStyle={serif ? "italic" : "normal"} fontWeight={weight ?? (serif ? 400 : 800)} textAnchor={anchor} letterSpacing={serif ? "-0.02em" : "-0.01em"}>
      {text}
    </text>
  );
}

const PHOTOS: AssetKey[] = ["after-light", "dusk-study", "blue-hour", "mineral", "soft-structures", "market-rhythm", "folded-paper"];
const photoFor = (id: string) => catalogAssets[PHOTOS[hash(id) % PHOTOS.length]];

/** A project's cover: its generated lead image when there is one, else the drawing. */
export function ProjectCover({ project, small = false }: { project: CaseStudy; small?: boolean }) {
  const src = (small ? artThumb : artSrc)(`panel:${project.id}:0`);
  return src ? <GenImage src={src} alt={`${project.title} for ${project.client.name}`} /> : <DrawnCover project={project} />;
}

/** The cover drawing for a project, by kind. */
function DrawnCover({ project }: { project: CaseStudy }) {
  const name = brandName(project);
  const c0 = pal(project, 0);
  const c1 = pal(project, 1);
  const c2 = pal(project, 2);
  const c3 = pal(project, 3);
  const label = `${project.title}, ${project.kind.replace("-", " ")} for ${project.client.name}`;
  const ink0 = readable(c0);
  switch (project.kind) {
    case "brand-identity":
      return (
        <Frame label={label} bg={c0}>
          {project.panels[0]?.kind === "wordmark-pattern" ? <PatternRows name={name} c0={c0} c1={c1} c2={c2} /> : null}
          {project.panels[0]?.kind === "wordmark-pattern" ? null : (
            <>
              <Mark seed={project.id} x={36} y={34} size={64} a={c1} b={c2} />
              <Wordmark text={name} x={36} y={196} width={330} max={52} fill={ink0} />
              <text x={36} y={226} fontSize={11} fill={ink0} opacity={0.75} fontFamily={SANS} letterSpacing="0.14em">
                {project.tagline.toUpperCase().slice(0, 40)}
              </text>
            </>
          )}
          <Swatches colours={project.palette} y={H - 30} />
        </Frame>
      );
    case "packaging":
      return (
        <Frame label={label} bg={c2}>
          <circle cx={290} cy={110} r={120} fill={c1} opacity={0.35} />
          <Pouch x={120} y={40} w={140} h={210} body={c0} accent={c1} name={name} seed={project.id} />
          <Box x={262} y={140} w={96} h={96} body={c3} accent={c1} name={name} />
        </Frame>
      );
    case "campaign":
      if (project.themes.includes("technology") || project.themes.includes("story")) return <NeonCity project={project} label={label} />;
      return (
        <Frame label={label} bg={c0}>
          <image href={photoFor(project.id)} x={-400} y={-300} width={1200} height={900} preserveAspectRatio="xMidYMid slice" opacity={0.55} />
          <rect x={-800} y={-600} width={2000} height={1500} fill={c0} opacity={0.35} />
          <rect x={-800} y={H - 84} width={2000} height={600} fill={c1} />
          <Wordmark text={project.title} x={26} y={H - 36} width={348} max={44} fill={readable(c1)} />
          <text x={26} y={H - 16} fontSize={10} letterSpacing="0.16em" fill={readable(c1)} fontFamily={SANS}>
            {project.client.name.toUpperCase().slice(0, 34)}
          </text>
          <circle cx={318} cy={70} r={36} fill={c2} opacity={0.95} />
        </Frame>
      );
    case "ui-ux":
      return (
        <Frame label={label} bg={c1}>
          <Phone x={142} y={18} w={118} h={236} c0={c0} c1={c1} c2={c2} name={name} />
        </Frame>
      );
    case "presentation":
      return (
        <Frame label={label} bg={c0}>
          <Slide x={74} y={30} w={252} h={142} bg={c2} ink={readable(c2)} title={project.title} accent={c1} />
          <Slide x={44} y={178} w={96} h={54} bg={c1} ink={readable(c1)} title="1" accent={c0} small />
          <Slide x={152} y={178} w={96} h={54} bg={c3} ink={readable(c3)} title="2" accent={c1} small />
          <Slide x={260} y={178} w={96} h={54} bg={c2} ink={readable(c2)} title="3" accent={c3} small />
        </Frame>
      );
    case "motion":
      return (
        <Frame label={label} bg={c0}>
          <defs>
            <radialGradient id={`sph-${project.id}`} cx="35%" cy="30%" r="75%">
              <stop offset="0" stopColor={c2} />
              <stop offset="0.55" stopColor={c1} />
              <stop offset="1" stopColor={c0} />
            </radialGradient>
          </defs>
          <circle cx={200} cy={140} r={92} fill={`url(#sph-${project.id})`} />
          {[0, 1, 2, 3, 4].map((i) => (
            <ellipse key={i} cx={200} cy={140} rx={92} ry={14 + i * 16} fill="none" stroke={readable(c0)} strokeOpacity={0.22} />
          ))}
          <Wordmark text={project.title} x={200} y={262} width={300} max={30} fill={readable(c0)} anchor="middle" serif={false} weight={700} />
          <PlayBadge x={346} y={30} />
        </Frame>
      );
    case "editorial":
      return (
        <Frame label={label} bg={c2}>
          <rect x={96} y={20} width={208} height={262} fill={c0} />
          <rect x={96} y={20} width={208} height={8} fill={c1} />
          <Wordmark text={project.title} x={110} y={92} width={180} max={38} fill={readable(c0)} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={110 + (i % 3) * 62} y={150 + Math.floor(i / 3) * 56} width={52} height={46} fill={pal(project, i + 1)} />
          ))}
          <text x={110} y={270} fontSize={8} letterSpacing="0.2em" fill={readable(c0)} fontFamily={SANS}>
            {project.client.name.toUpperCase().slice(0, 30)}
          </text>
        </Frame>
      );
    case "spatial":
      return (
        <Frame label={label} bg={c3}>
          <g fill="none" stroke={readable(c3)} strokeOpacity={0.5} strokeWidth={1.5}>
            <rect x={30} y={30} width={340} height={240} />
            <path d="M30 150 H210 V30 M210 150 V270 M290 30 V150 H370" />
          </g>
          <rect x={50} y={52} width={120} height={80} fill={c1} opacity={0.9} />
          <rect x={230} y={172} width={120} height={80} fill={c2} opacity={0.9} />
          <rect x={232} y={52} width={46} height={80} fill={c0} />
          <Sign x={96} y={196} w={92} text={name} bg={c0} c1={c1} />
        </Frame>
      );
    case "photography":
      return (
        <Frame label={label} bg={c0}>
          <image href={photoFor(project.id)} x={-400} y={-300} width={1200} height={900} preserveAspectRatio="xMidYMid slice" />
          <rect x={-800} y={-600} width={2000} height={1500} fill={c0} opacity={0.18} />
          <rect x={20} y={H - 58} width={Math.min(300, 14 + project.title.length * 11)} height={36} fill={c0} opacity={0.82} />
          <text x={32} y={H - 33} fontSize={20} fill={readable(c0)} fontFamily={SERIF} fontStyle="italic">
            {project.title}
          </text>
        </Frame>
      );
    default:
      return (
        <Frame label={label} bg={c1}>
          <Wordmark text={project.title} x={34} y={150} width={332} max={86} fill={c0} />
          <path d={`M34 ${176} C 120 ${196}, 240 ${156}, 366 ${182}`} stroke={c2} strokeWidth={9} fill="none" strokeLinecap="round" />
          <text x={34} y={232} fontSize={11} letterSpacing="0.18em" fill={c0} fontFamily={SANS}>
            {project.client.name.toUpperCase().slice(0, 34)}
          </text>
        </Frame>
      );
  }
}

/** A night skyline with neon lines, for science-fiction and technology stories. Drawn, never a photograph. */
function NeonCity({ project, label }: { project: CaseStudy; label: string }) {
  const bg = pal(project, 0);
  const neon1 = pal(project, 1);
  const neon2 = pal(project, 2);
  const h = hash(project.id);
  const towers = Array.from({ length: 11 }).map((_, i) => {
    const w = 26 + ((h >> i) % 22);
    const ht = 70 + ((h >> (i + 3)) % 120);
    return { x: -40 + i * 44, w, ht };
  });
  return (
    <Frame label={label} bg={bg}>
      <defs>
        <linearGradient id={`sky-${project.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bg} />
          <stop offset="1" stopColor={neon1} stopOpacity={0.4} />
        </linearGradient>
      </defs>
      <rect x={-800} y={-600} width={2000} height={1500} fill={`url(#sky-${project.id})`} />
      <circle cx={290} cy={92} r={46} fill={neon2} opacity={0.9} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={-400} y={70 + i * 9} width={1200} height={2} fill={bg} opacity={0.5} transform="translate(0 0)" />
      ))}
      {towers.map((t, i) => (
        <g key={i}>
          <rect x={t.x} y={H - t.ht} width={t.w} height={t.ht + 400} fill={readable(bg) === "#fbf8f2" ? "#06070d" : "#1b1d2a"} />
          {[0, 1, 2, 3].map((k) => (
            <rect key={k} x={t.x + 6} y={H - t.ht + 12 + k * 20} width={t.w - 12} height={3} fill={k % 2 ? neon1 : neon2} opacity={0.85} />
          ))}
        </g>
      ))}
      <rect x={-800} y={H - 6} width={2000} height={3} fill={neon1} />
      <text x={24} y={50} fontSize={fitSize(project.title.length, 220, 40)} fill={readable(bg)} fontFamily={SANS} fontWeight={800} letterSpacing="0.04em">
        {project.title.toUpperCase()}
      </text>
    </Frame>
  );
}

function PatternRows({ name, c0, c1, c2 }: { name: string; c0: string; c1: string; c2: string }) {
  const rows = 11;
  const word = (name.split(/\s+/)[0] || name).toUpperCase().replace(/[^A-Z0-9&]/g, "").slice(0, 10);
  const size = Math.min(44, 210 / (word.length * 0.66));
  const gap = word.length * size * 0.66 + size * 0.5;
  return (
    <g fontFamily={SANS} fontWeight={800} fontSize={size} letterSpacing="-0.02em">
      {Array.from({ length: rows }).map((_, r) => (
        <g key={r}>
          {Array.from({ length: 9 }).map((__, k) => (
            <text
              key={k}
              x={-420 + k * gap - (r % 2) * (gap / 2)}
              y={-70 + r * (size * 1.02)}
              fill={r % 2 ? "none" : c1}
              stroke={r % 2 ? c2 : "none"}
              strokeWidth={1.2}
            >
              {word}
            </text>
          ))}
        </g>
      ))}
      <rect x={-800} y={H - 44} width={2000} height={600} fill={c0} />
    </g>
  );
}

function Swatches({ colours, y }: { colours: string[]; y: number }) {
  const w = 1200 / colours.length;
  return (
    <g>
      {colours.map((c, i) => (
        <rect key={i} x={-400 + i * w} y={y} width={w} height={600} fill={c} />
      ))}
    </g>
  );
}

function Pouch({ x, y, w, h, body, accent, name, seed }: { x: number; y: number; w: number; h: number; body: string; accent: string; name: string; seed: string }) {
  const ink = readable(body);
  return (
    <g>
      <path d={`M${x + 8} ${y + 12} H${x + w - 8} L${x + w} ${y + h - 6} Q${x + w} ${y + h} ${x + w - 6} ${y + h} H${x + 6} Q${x} ${y + h} ${x} ${y + h - 6} Z`} fill={body} />
      <rect x={x + 8} y={y + 6} width={w - 16} height={10} fill={accent} opacity={0.9} />
      <rect x={x + 14} y={y + 66} width={w - 28} height={96} fill={accent} opacity={0.18} />
      <Mark seed={seed} x={x + w / 2 - 22} y={y + 32} size={44} a={accent} b={ink} />
      <Wordmark text={name} x={x + w / 2} y={y + 118} width={w - 32} max={22} fill={ink} anchor="middle" />
      <rect x={x + 22} y={y + h - 34} width={w - 44} height={3} fill={ink} opacity={0.5} />
    </g>
  );
}

function Box({ x, y, w, h, body, accent, name }: { x: number; y: number; w: number; h: number; body: string; accent: string; name: string }) {
  const ink = readable(body);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={body} />
      <rect x={x} y={y} width={w} height={14} fill={accent} />
      <Wordmark text={name} x={x + w / 2} y={y + h / 2 + 8} width={w - 16} max={18} fill={ink} anchor="middle" />
    </g>
  );
}

function Phone({ x, y, w, h, c0, c1, c2, name }: { x: number; y: number; w: number; h: number; c0: string; c1: string; c2: string; name: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={16} fill={readable(c1)} />
      <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} rx={12} fill="#fbf8f2" />
      <rect x={x + 5} y={y + 5} width={w - 10} height={46} rx={12} fill={c0} />
      <text x={x + 14} y={y + 34} fontSize={13} fill={readable(c0)} fontFamily={SANS} fontWeight={800}>
        {name.slice(0, 14)}
      </text>
      <rect x={x + 14} y={y + 62} width={w - 28} height={52} rx={8} fill={c1} opacity={0.5} />
      <rect x={x + 14} y={y + 122} width={(w - 36) / 2} height={44} rx={8} fill={c2} />
      <rect x={x + 22 + (w - 36) / 2} y={y + 122} width={(w - 36) / 2} height={44} rx={8} fill={c0} opacity={0.85} />
      <rect x={x + 14} y={y + 176} width={w - 28} height={10} rx={5} fill={c0} opacity={0.2} />
      <rect x={x + 14} y={y + 192} width={w - 60} height={10} rx={5} fill={c0} opacity={0.2} />
      <rect x={x + 14} y={y + h - 36} width={w - 28} height={22} rx={11} fill={c2} />
    </g>
  );
}

function Slide({ x, y, w, h, bg, ink, title, accent, small }: { x: number; y: number; w: number; h: number; bg: string; ink: string; title: string; accent: string; small?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4} fill={bg} />
      <rect x={x} y={y + h - 8} width={w} height={8} fill={accent} />
      <text x={x + 12} y={y + (small ? 32 : 70)} fontSize={small ? 18 : fitSize(title.length, w - 24, 34)} fill={ink} fontFamily={SERIF} fontStyle="italic">
        {title}
      </text>
      {!small && <rect x={x + 12} y={y + 86} width={w * 0.5} height={5} rx={2.5} fill={ink} opacity={0.4} />}
    </g>
  );
}

function Sign({ x, y, w, text, bg, c1 }: { x: number; y: number; w: number; text: string; bg: string; c1: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={34} rx={3} fill={bg} />
      <rect x={x} y={y} width={w} height={5} fill={c1} />
      <text x={x + w / 2} y={y + 25} fontSize={fitSize(text.length, w - 14, 14)} fill={readable(bg)} fontFamily={SANS} fontWeight={800} textAnchor="middle">
        {text.slice(0, 16)}
      </text>
    </g>
  );
}

function PlayBadge({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={18} fill="#14110f" opacity={0.7} />
      <path d={`M${x - 5} ${y - 8} L${x + 9} ${y} L${x - 5} ${y + 8} Z`} fill="#fbf8f2" />
    </g>
  );
}

/** The logo shown on a product scene: the project's mark and name on its palette. */
export function MockupScene({ project, scene }: { project: CaseStudy; scene: string }) {
  const name = brandName(project);
  const c0 = pal(project, 0);
  const c1 = pal(project, 1);
  const c2 = pal(project, 2);
  const c3 = pal(project, 3);
  const label = `${project.title} shown on ${scene === "train" ? "a train interior panel" : `a ${scene}`}`;
  const ink0 = readable(c0);
  const logo = (cx: number, cy: number, size: number, bg: string) => (
    <g>
      <Mark seed={project.id} x={cx - size / 2} y={cy - size} size={size} a={pal(project, 1)} b={readable(bg)} />
      <Wordmark text={name} x={cx} y={cy + size * 0.5} width={size * 3} max={size * 0.5} fill={readable(bg)} anchor="middle" />
    </g>
  );
  switch (scene) {
    case "tote":
      return (
        <Frame label={label} bg={c2}>
          <path d="M150 90 C150 30 250 30 250 90" fill="none" stroke={c0} strokeWidth={9} />
          <rect x={110} y={90} width={180} height={190} fill="#f3ead8" />
          <rect x={110} y={90} width={180} height={190} fill={c1} opacity={0.12} />
          {logo(200, 200, 44, "#f3ead8")}
        </Frame>
      );
    case "cup":
      return (
        <Frame label={label} bg={c1}>
          <ellipse cx={200} cy={268} rx={90} ry={9} fill="#000" opacity={0.15} />
          <path d="M130 70 H270 L252 262 H148 Z" fill="#fbf8f2" />
          <rect x={125} y={56} width={150} height={20} rx={6} fill={c0} />
          <path d="M148 130 H252 L248 190 H152 Z" fill={c0} />
          {logo(200, 168, 30, c0)}
        </Frame>
      );
    case "can":
      return (
        <Frame label={label} bg={c3}>
          <ellipse cx={200} cy={278} rx={60} ry={7} fill="#000" opacity={0.18} />
          <rect x={140} y={50} width={120} height={226} rx={14} fill="#d8dde2" />
          <rect x={140} y={92} width={120} height={140} fill={c0} />
          <Mark seed={project.id} x={178} y={104} size={44} a={c1} b={ink0} />
          <Wordmark text={name} x={200} y={196} width={100} max={20} fill={ink0} anchor="middle" />
          <rect x={150} y={44} width={100} height={10} rx={5} fill="#aab1b8" />
        </Frame>
      );
    case "pouch":
      return (
        <Frame label={label} bg={c2}>
          <Pouch x={125} y={36} w={150} h={228} body={c0} accent={c1} name={name} seed={project.id} />
        </Frame>
      );
    case "box":
      return (
        <Frame label={label} bg={c2}>
          <path d="M110 110 L230 80 L310 104 L310 232 L190 262 L110 232 Z" fill={c0} />
          <path d="M110 110 L190 138 L310 104 L230 80 Z" fill={c1} />
          <path d="M190 138 V262" stroke={ink0} strokeOpacity={0.25} />
          <Wordmark text={name} x={150} y={200} width={80} max={16} fill={ink0} anchor="middle" />
        </Frame>
      );
    case "card":
      return (
        <Frame label={label} bg={c3}>
          <g transform="rotate(-8 200 150)">
            <rect x={90} y={80} width={150} height={92} fill={c0} />
            <Mark seed={project.id} x={104} y={94} size={30} a={c1} b={ink0} />
            <Wordmark text={name} x={104} y={152} width={120} max={16} fill={ink0} />
          </g>
          <g transform="rotate(5 280 190)">
            <rect x={190} y={150} width={150} height={92} fill="#fbf8f2" />
            <rect x={190} y={150} width={150} height={6} fill={c1} />
            <text x={204} y={186} fontSize={11} fill="#14110f" fontFamily={SANS} fontWeight={700}>
              {name.slice(0, 22)}
            </text>
            <rect x={204} y={198} width={90} height={4} fill="#14110f" opacity={0.3} />
            <rect x={204} y={208} width={70} height={4} fill="#14110f" opacity={0.3} />
          </g>
        </Frame>
      );
    case "letterhead":
      return (
        <Frame label={label} bg={c3}>
          <rect x={110} y={20} width={180} height={260} fill="#fbf8f2" />
          <Mark seed={project.id} x={124} y={34} size={26} a={c0} b={c1} />
          <text x={158} y={54} fontSize={11} fontFamily={SERIF} fontStyle="italic" fill="#14110f">
            {name.slice(0, 20)}
          </text>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect key={i} x={124} y={96 + i * 14} width={i % 3 === 2 ? 90 : 150} height={3} fill="#14110f" opacity={0.25} />
          ))}
          <rect x={110} y={270} width={180} height={10} fill={c1} />
        </Frame>
      );
    case "sign":
      return (
        <Frame label={label} bg={c3}>
          <rect x={196} y={150} width={8} height={140} fill="#444" />
          <rect x={60} y={64} width={280} height={96} rx={6} fill={c0} />
          <rect x={60} y={64} width={280} height={8} fill={c1} />
          {logo(200, 130, 36, c0)}
        </Frame>
      );
    case "poster":
      return (
        <Frame label={label} bg={c3}>
          <rect x={122} y={22} width={156} height={256} fill={c0} />
          <circle cx={200} cy={100} r={44} fill={c1} />
          <Wordmark text={project.title} x={200} y={196} width={130} max={30} fill={ink0} anchor="middle" />
          <rect x={150} y={214} width={100} height={4} fill={ink0} opacity={0.5} />
          <rect x={150} y={226} width={70} height={4} fill={ink0} opacity={0.35} />
        </Frame>
      );
    case "phone":
      return (
        <Frame label={label} bg={c1}>
          <Phone x={140} y={20} w={120} h={248} c0={c0} c1={c1} c2={c2} name={name} />
        </Frame>
      );
    case "train":
      return (
        <Frame label={label} bg="#cfd6dc">
          <rect x={0} y={0} width={W} height={70} fill="#e8ecef" />
          <rect x={0} y={236} width={W} height={64} fill="#8c969e" />
          {[40, 150, 260].map((x) => (
            <g key={x}>
              <rect x={x} y={84} width={100} height={72} fill={c0} />
              <circle cx={x + 30} cy={110} r={14} fill={c1} />
              <rect x={x + 8} y={134} width={84} height={14} fill={c2} opacity={0.9} />
              <text x={x + 50} y={146} fontSize={9} fill={readable(c2)} fontFamily={SANS} fontWeight={700} textAnchor="middle">
                {name.slice(0, 12)}
              </text>
            </g>
          ))}
          <rect x={0} y={190} width={W} height={20} fill="#6b747b" />
        </Frame>
      );
    case "shopfront":
      return (
        <Frame label={label} bg={c3}>
          <rect x={40} y={50} width={320} height={230} fill={c0} />
          <rect x={60} y={70} width={280} height={44} fill={c1} />
          <Wordmark text={name} x={200} y={102} width={250} max={28} fill={readable(c1)} anchor="middle" />
          <rect x={64} y={132} width={130} height={132} fill="#e6eef2" opacity={0.9} />
          <rect x={206} y={132} width={130} height={132} fill="#e6eef2" opacity={0.9} />
          <rect x={86} y={186} width={86} height={62} fill={c2} opacity={0.8} />
        </Frame>
      );
    default:
      return <ProjectCover project={project} />;
  }
}

/** A grid of six small variations: a series. */
export function SeriesPanel({ project }: { project: CaseStudy }) {
  return (
    <Frame label={`${project.title}, six pieces from the series`} bg={pal(project, 3)}>
      {Array.from({ length: 6 }).map((_, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const bg = pal(project, i);
        return (
          <g key={i} transform={`translate(${22 + col * 124} ${28 + row * 130})`}>
            <rect width={112} height={118} fill={bg} />
            <Mark seed={`${project.id}${i}`} x={26} y={18} size={60} a={pal(project, i + 1)} b={readable(bg)} />
            <text x={10} y={108} fontSize={9} letterSpacing="0.16em" fill={readable(bg)} fontFamily={SANS}>
              {String(i + 1).padStart(2, "0")}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

export function PalettePanel({ project }: { project: CaseStudy }) {
  const w = W / project.palette.length;
  return (
    <Frame label={`${project.title} colour palette`} bg="#fbf8f2">
      {project.palette.map((c, i) => (
        <g key={c + i}>
          <rect x={i * w - (i === 0 ? 800 : 0)} y={-600} width={w + (i === 0 ? 800 : 0) + (i === project.palette.length - 1 ? 800 : 0)} height={1500} fill={c} />
          <text x={i * w + 12} y={H - 16} fontSize={12} fill={readable(c)} fontFamily={SANS} fontWeight={700}>
            {c.toUpperCase()}
          </text>
        </g>
      ))}
    </Frame>
  );
}

export function TypePanel({ project }: { project: CaseStudy }) {
  const bg = pal(project, 0);
  const ink = readable(bg);
  return (
    <Frame label={`${project.title} type specimen`} bg={bg}>
      <text x={30} y={150} fontSize={150} fill={ink} fontFamily={SERIF} fontStyle="italic">
        Aa
      </text>
      <text x={232} y={92} fontSize={22} fill={ink} fontFamily={SANS} fontWeight={800}>
        Headline
      </text>
      <text x={232} y={122} fontSize={16} fill={ink} fontFamily={SANS} fontWeight={500}>
        Subhead set smaller
      </text>
      <text x={232} y={150} fontSize={11} fill={ink} fontFamily={SANS} opacity={0.8}>
        Body text stays quiet and
      </text>
      <text x={232} y={165} fontSize={11} fill={ink} fontFamily={SANS} opacity={0.8}>
        easy to read at length.
      </text>
      <text x={30} y={250} fontSize={13} letterSpacing="0.28em" fill={ink} fontFamily={SANS} opacity={0.85}>
        ABCDEFGHIJKLM 0123456789
      </text>
    </Frame>
  );
}

export function LogoPanel({ project }: { project: CaseStudy }) {
  const bg = pal(project, 2);
  const name = brandName(project);
  return (
    <Frame label={`${project.title} logo`} bg={bg}>
      <Mark seed={project.id} x={162} y={52} size={76} a={pal(project, 0)} b={pal(project, 1)} />
      <Wordmark text={name} x={200} y={190} width={300} max={44} fill={readable(bg)} anchor="middle" />
      <text x={200} y={224} fontSize={10} letterSpacing="0.2em" textAnchor="middle" fill={readable(bg)} fontFamily={SANS} opacity={0.75}>
        {project.tagline.toUpperCase().slice(0, 44)}
      </text>
    </Frame>
  );
}

export function SlidesPanel({ project }: { project: CaseStudy }) {
  const bg = pal(project, 3);
  return (
    <Frame label={`${project.title} slides`} bg={bg}>
      {[0, 1, 2, 3].map((i) => (
        <Slide key={i} x={24 + (i % 2) * 188} y={20 + Math.floor(i / 2) * 136} w={176} h={124} bg={pal(project, i)} ink={readable(pal(project, i))} title={i === 0 ? project.title : ["Idea", "Palette", "Use"][i - 1]} accent={pal(project, i + 1)} />
      ))}
    </Frame>
  );
}

export function QuotePanel({ project, text }: { project: CaseStudy; text: string }) {
  const bg = pal(project, 1);
  const ink = readable(bg);
  const lines = wrap(text.replace(/[“”]/g, ""), 30).slice(0, 4);
  return (
    <Frame label={`A quote from ${project.title}`} bg={bg}>
      <text x={28} y={80} fontSize={90} fill={pal(project, 0)} fontFamily={SERIF}>
        “
      </text>
      {lines.map((l, i) => (
        <text key={i} x={36} y={120 + i * 28} fontSize={22} fill={ink} fontFamily={SERIF} fontStyle="italic">
          {l}
        </text>
      ))}
    </Frame>
  );
}

export function ProcessPanel({ project }: { project: CaseStudy }) {
  const bg = "#f4efe6";
  const labels = ["Sketch", "Test", "Final"];
  return (
    <Frame label={`${project.title} process`} bg={bg}>
      {labels.map((l, i) => (
        <g key={l} transform={`translate(${24 + i * 124} 40)`}>
          <rect width={112} height={170} fill="#fff" stroke="#14110f" strokeOpacity={0.2} />
          {i === 0 ? <path d="M16 140 C 40 40, 70 150, 96 30" stroke="#14110f" strokeOpacity={0.6} fill="none" /> : null}
          {i === 1 ? (
            <g>
              <rect x={18} y={26} width={76} height={50} fill={pal(project, 1)} opacity={0.5} />
              <rect x={18} y={90} width={50} height={50} fill={pal(project, 0)} opacity={0.5} />
            </g>
          ) : null}
          {i === 2 ? <Mark seed={project.id} x={26} y={48} size={60} a={pal(project, 0)} b={pal(project, 1)} /> : null}
          <text x={0} y={196} fontSize={11} letterSpacing="0.2em" fill="#14110f" fontFamily={SANS}>
            {`0${i + 1}  ${l.toUpperCase()}`}
          </text>
        </g>
      ))}
    </Frame>
  );
}

function wrap(text: string, per: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(/\s+/)) {
    if (line && `${line} ${w}`.length > per) {
      out.push(line);
      line = w;
    } else line = `${line} ${w}`.trim();
  }
  if (line) out.push(line);
  return out;
}

/** One panel of a case study. */
export function PanelVisual({ project, panel }: { project: CaseStudy; panel: CasePanel }) {
  const src = artSrc(`panel:${project.id}:${project.panels.indexOf(panel)}`);
  if (src) return <GenImage src={src} alt={panel.caption ?? `${project.title}, ${panel.kind}`} />;
  switch (panel.kind) {
    case "hero":
    case "wordmark-pattern":
    case "motion":
      return <DrawnCover project={panel.kind === "wordmark-pattern" ? { ...project, kind: "brand-identity", panels: [{ kind: "wordmark-pattern" }] } : panel.kind === "motion" ? { ...project, kind: "motion" } : project} />;
    case "logo":
      return <LogoPanel project={project} />;
    case "palette":
      return <PalettePanel project={project} />;
    case "type":
      return <TypePanel project={project} />;
    case "mockup":
      return <MockupScene project={project} scene={panel.scene ?? "poster"} />;
    case "series":
      return <SeriesPanel project={project} />;
    case "device":
      return <MockupScene project={project} scene="phone" />;
    case "slides":
      return <SlidesPanel project={project} />;
    case "quote":
      return <QuotePanel project={project} text={panel.caption ?? project.tagline} />;
    case "process":
      return <ProcessPanel project={project} />;
  }
}

const MOTIFS: Record<string, (p: string[]) => ReactNode> = {};
void MOTIFS;

/**
 * The cover for an asset library: its generated sample image, or the drawing
 * from its colours and motif. `drawn` asks for the drawing (a standalone SVG).
 */
export function AssetCover({ asset, drawn = false }: { asset: LibraryAsset; drawn?: boolean }) {
  const src = drawn ? undefined : artSrc(`asset:${asset.id}`);
  if (src) return <GenImage src={src} alt={`${asset.name}, ${asset.count} items`} />;
  const [a, b, c, d] = [0, 1, 2, 3].map((i) => asset.preview.palette[i % asset.preview.palette.length]);
  const label = `${asset.name}, ${asset.count} items`;
  const tiles = Array.from({ length: 9 });
  return (
    <Frame label={label} bg={a}>
      {tiles.map((_, i) => {
        const x = 24 + (i % 3) * 120;
        const y = 22 + Math.floor(i / 3) * 86;
        const fill = [b, c, d][i % 3];
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <rect width={108} height={76} fill={fill} opacity={0.92} />
            {asset.preview.motif === "grain" || asset.preview.motif === "weave" ? (
              Array.from({ length: 6 }).map((_, k) => <rect key={k} x={0} y={k * 13} width={108} height={2} fill={readable(fill)} opacity={0.16} />)
            ) : asset.preview.motif === "circles" || asset.preview.motif === "clouds" ? (
              <circle cx={54} cy={38} r={20 + (i % 3) * 6} fill="none" stroke={readable(fill)} strokeOpacity={0.5} strokeWidth={3} />
            ) : asset.preview.motif === "bars" || asset.preview.motif === "icons" ? (
              [0, 1, 2].map((k) => <rect key={k} x={26 + k * 22} y={18 + (k % 2) * 10} width={14} height={40 - (k % 2) * 10} rx={4} fill={readable(fill)} opacity={0.5} />)
            ) : asset.preview.motif === "numerals" || asset.preview.motif === "type" || asset.preview.motif === "brush" ? (
              <text x={54} y={56} fontSize={44} textAnchor="middle" fill={readable(fill)} fontFamily={SERIF} fontStyle="italic">
                {asset.preview.motif === "type" ? "Ag" : String((i + 3) % 10)}
              </text>
            ) : (
              <rect x={24} y={20} width={60} height={36} rx={asset.preview.motif === "fold" ? 0 : 8} fill={readable(fill)} opacity={0.2} />
            )}
          </g>
        );
      })}
      <rect x={0} y={H - 22} width={W} height={22} fill={readable(a)} opacity={0.9} />
      <text x={16} y={H - 7} fontSize={10} letterSpacing="0.16em" fill={a} fontFamily={SANS} fontWeight={700}>
        {`${asset.count} ${asset.type.replace("-", " ").toUpperCase()}`}
      </text>
    </Frame>
  );
}

/** A scene drawn for a brand name and four colours (what "Start from a template" and layers use). */
export function SceneArt({ scene, brand, palette }: { scene: string; brand: string; palette: string[] }) {
  const project: CaseStudy = {
    id: `scene-${brand}`,
    makerId: "kresilo",
    title: brand,
    client: { name: brand, what: "A brand drawn from a template" },
    kind: "brand-identity",
    themes: ["brand"],
    tagline: brand,
    role: "You",
    year: 2026,
    palette,
    story: { brief: "", idea: "", outcome: "" },
    panels: [],
    assetsUsed: [],
    aiHelp: "none",
    process: "",
  };
  return <MockupScene project={project} scene={scene} />;
}

/** A stand-in project so a template can show its mockup scenes with a placeholder brand. */
function demoProject(t: BrandTemplate): CaseStudy {
  return {
    id: `demo-${t.id}`,
    makerId: "kresilo",
    title: "Your brand",
    client: { name: "Your brand", what: "A placeholder brand" },
    kind: "brand-identity",
    themes: ["brand"],
    tagline: "Your idea in one line",
    role: "You",
    year: 2026,
    palette: t.palette.length >= 4 ? t.palette : [...t.palette, ...t.palette].slice(0, 4),
    story: { brief: "", idea: "", outcome: "" },
    panels: [],
    assetsUsed: [],
    aiHelp: "none",
    process: "",
  };
}

/**
 * The cover for a branding template. A template that draws products shows
 * those products with a placeholder brand; the others show their slots as a
 * small layout.
 */
export function TemplateCover({ template }: { template: BrandTemplate }) {
  const src = artSrc(`template:${template.id}`);
  if (src) return <GenImage src={src} alt={`${template.name} template`} />;
  if (template.scenes.length >= 2) {
    const project = demoProject(template);
    return (
      <div className="vis pf-template-collage" role="img" aria-label={`${template.name} template: ${template.scenes.join(", ")}`}>
        {template.scenes.slice(0, 4).map((scene) => (
          <MockupScene key={scene} project={project} scene={scene} />
        ))}
      </div>
    );
  }
  return <TemplateWireframe template={template} />;
}

function TemplateWireframe({ template }: { template: BrandTemplate }) {

  const [a, b, c, d] = [0, 1, 2, 3].map((i) => template.palette[i % template.palette.length]);
  return (
    <Frame label={`${template.name} template`} bg={c}>
      <rect x={24} y={24} width={160} height={252} fill={a} />
      <Mark seed={template.id} x={72} y={52} size={64} a={b} b={readable(a)} />
      <text x={104} y={168} fontSize={16} textAnchor="middle" fill={readable(a)} fontFamily={SERIF} fontStyle="italic">
        Your logo
      </text>
      {template.slots.slice(0, 3).map((s, i) => (
        <g key={s.id}>
          <rect x={204} y={40 + i * 70} width={172} height={56} rx={6} fill="none" stroke={a} strokeWidth={2} strokeDasharray="6 5" />
          <text x={216} y={74 + i * 70} fontSize={12} fill={a} fontFamily={SANS} fontWeight={700}>
            {s.label}
          </text>
        </g>
      ))}
      <rect x={204} y={254} width={172} height={22} fill={d} />
    </Frame>
  );
}
