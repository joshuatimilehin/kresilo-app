/**
 * Code-native artwork for the Salt Flats study. Everything here is SVG driven
 * by the poster model, so the artwork stays editable, inspectable and small —
 * never a screenshot or a rasterised export.
 */
import { useState } from "react";
import type { PosterModel, ReferenceItem } from "@/domain/types";

/* ------------------------------------------------------------- poster ----- */

let uidCounter = 0;

/** Stable per-instance id for SVG defs, so gradients never collide on screen. */
function useLocalId(prefix: string) {
  const [id] = useState(() => `${prefix}${(uidCounter += 1).toString(36)}`);
  return id;
}

export function PosterCanvas({
  poster,
  className,
  showGuides = false,
}: {
  poster: PosterModel;
  className?: string;
  showGuides?: boolean;
}) {
  const uid = useLocalId("p");
  const { palette: p, composition: c, typography: t } = poster;
  const W = poster.width;
  const H = poster.height;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${t.eyebrow} — ${t.title}`}
    >
      <defs>
        <linearGradient id={`hz-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.horizonFrom} />
          <stop offset="52%" stopColor={p.horizonTo} />
          <stop offset="100%" stopColor={p.horizonFrom} />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          <rect x="0" y="0" width={W} height={H} />
        </clipPath>
      </defs>

      <rect x="0" y="0" width={W} height={H} fill={p.canvas} />
      <g clipPath={`url(#clip-${uid})`}>
        <rect x="0" y={H * 0.28} width={W} height={H} fill={p.surface} />
        {/* the horizon disc: one crisp circle, lilac edge -> cream centre -> lilac edge */}
        <circle cx={c.horizon.cx} cy={c.horizon.cy} r={c.horizon.r} fill={`url(#hz-${uid})`} />
        {c.horizon.figure ? (
          <g fill="#111111" opacity="0.85">
            <rect x={c.horizon.cx - 0.55} y={c.horizon.cy - 5.6} width="1.1" height="4.6" />
            <circle cx={c.horizon.cx} cy={c.horizon.cy - 6.3} r="0.62" />
          </g>
        ) : null}
        {c.sun.show ? (
          <circle
            cx={c.sun.cx}
            cy={c.sun.cy}
            r={c.sun.r}
            fill={c.sun.tone === "accent" ? p.accent : p.type}
            opacity="0.92"
          />
        ) : null}
        {c.ring.show ? (
          <circle
            cx={c.ring.cx}
            cy={c.ring.cy}
            r={c.ring.r}
            fill="none"
            stroke={p.hairline}
            strokeWidth="0.45"
          />
        ) : null}
        {c.rule.show ? (
          <line
            x1="10"
            y1={c.rule.y}
            x2={W - 10}
            y2={c.rule.y}
            stroke={p.hairline}
            strokeWidth="0.4"
            strokeDasharray="1.5 1.5"
          />
        ) : null}

        {showGuides ? (
          <g stroke={p.accent} strokeWidth="0.2" opacity="0.5">
            <line x1={c.horizon.cx} y1="0" x2={c.horizon.cx} y2={H} />
            <line x1="0" y1={c.horizon.cy} x2={W} y2={c.horizon.cy} />
            <circle cx={c.horizon.cx} cy={c.horizon.cy} r={c.horizon.r} fill="none" />
          </g>
        ) : null}
      </g>

      <text
        x="10"
        y="14"
        fill={p.type}
        opacity="0.62"
        fontFamily="IBM Plex Mono, monospace"
        fontSize="4.4"
        letterSpacing="0.72"
      >
        {t.eyebrow.toUpperCase()}
      </text>

      <text
        x="9"
        y={t.titleY}
        fill={p.type}
        fontFamily="Instrument Serif, Times New Roman, serif"
        fontStyle="italic"
        fontSize={t.titleSize}
        letterSpacing="-1.2"
      >
        {t.title}
      </text>

      <text
        x="10"
        y={H - 7}
        fill={p.type}
        opacity="0.45"
        fontFamily="IBM Plex Mono, monospace"
        fontSize="3.6"
        letterSpacing="0.6"
      >
        {c.caption.toUpperCase()}
      </text>
      <text
        x={W - 10}
        y={H - 7}
        textAnchor="end"
        fill={p.accent}
        opacity="0.75"
        fontFamily="IBM Plex Mono, monospace"
        fontSize="3.6"
        letterSpacing="0.6"
      >
        {poster.label.toUpperCase()}
      </text>
    </svg>
  );
};

/* ------------------------------------------------- reference art tiles ---- */

/** Relative luminance of a #rrggbb colour; anything unreadable ranks lowest. */
function brightness(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex ?? "").trim());
  if (!m) return -1;
  const n = parseInt(m[1], 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
}

/**
 * Ground = the darkest swatch; the disc keeps the poster's own reading, a
 * lilac edge brightening to a cream centre.
 */
function horizonInks(c: string[]) {
  const ranked = [...c].sort((a, b) => brightness(b) - brightness(a));
  return {
    centre: ranked[0] ?? "#F4EEE2",
    edge: ranked[1] ?? "#C8B4F2",
    ground: ranked[ranked.length - 1] ?? "#101315",
  };
}

function Horizon({ ground, gradient }: { ground: string; gradient: string }) {
  return (
    <>
      <rect width="60" height="40" fill={ground} />
      <circle cx="30" cy="20" r="15" fill={`url(#${gradient})`} />
      <rect x="29.5" y="14" width="1" height="4.4" fill="#111111" opacity="0.8" />
      <circle cx="30" cy="13" r="0.7" fill="#111111" opacity="0.8" />
    </>
  );
}

function Patchwork({ c }: { c: string[] }) {
  const cells = [
    [0, 0], [15, 0], [30, 0], [45, 0],
    [0, 10], [15, 10], [30, 10], [45, 10],
    [0, 20], [15, 20], [30, 20], [45, 20],
    [0, 30], [15, 30], [30, 30], [45, 30],
  ];
  return (
    <>
      <rect width="60" height="40" fill={c[0] ?? "#204F4D"} />
      {cells.map(([x, y], i) => (
        <rect
          key={i}
          x={x + 0.7}
          y={y + 0.7}
          width="13.6"
          height="8.6"
          fill={i % 5 === 0 ? c[2] ?? "#C85731" : i % 3 === 0 ? c[1] ?? "#F4EEE2" : "transparent"}
          opacity={i % 5 === 0 ? 0.85 : 0.5}
          stroke={c[1] ?? "#F4EEE2"}
          strokeOpacity="0.22"
          strokeWidth="0.3"
        />
      ))}
    </>
  );
}

function CrackedGround({ c }: { c: string[] }) {
  return (
    <>
      <rect width="60" height="40" fill={c[0] ?? "#EDE7DA"} />
      <g stroke={c[1] ?? "#D6CFC0"} strokeWidth="0.4" fill="none" opacity="0.9">
        <path d="M -2 12 L 14 9 L 22 17 L 40 14 L 62 20" />
        <path d="M 14 9 L 17 -2" />
        <path d="M 22 17 L 26 41" />
        <path d="M 40 14 L 47 0" />
        <path d="M -2 30 L 12 27 L 30 34 L 62 29" />
        <path d="M 12 27 L 9 41" />
      </g>
    </>
  );
}

function Contours({ c }: { c: string[] }) {
  return (
    <>
      <rect width="60" height="40" fill={c[1] ?? "#F4EEE2"} />
      <g fill="none" stroke={c[0] ?? "#C85731"} strokeWidth="0.55">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ellipse key={i} cx="30" cy="21" rx={6 + i * 5} ry={3 + i * 2.6} opacity={1 - i * 0.13} />
        ))}
      </g>
    </>
  );
}

function Note({ c }: { c: string[] }) {
  return (
    <>
      <rect width="60" height="40" fill="#101315" />
      <rect x="8" y="6" width="44" height="28" fill={c[0] ?? "#F2F1ED"} />
      <rect x="8" y="6" width="44" height="2.5" fill={c[1] ?? "#C85731"} />
      <g fill="#0A0C0E" opacity="0.72">
        <rect x="13" y="14" width="34" height="1.3" />
        <rect x="13" y="19" width="26" height="1.3" />
        <rect x="13" y="24" width="30" height="1.3" />
      </g>
    </>
  );
}

const FALLBACK_COLORS = ["#204F4D", "#C8B4F2", "#F4EEE2"];

export function ReferenceTile({ reference }: { reference: ReferenceItem }) {
  const colors = reference.swatches?.length ? reference.swatches : FALLBACK_COLORS;
  const art = reference.artwork ?? (reference.kind === "bundled" ? "horizon" : null);
  const grad = useLocalId("rg");
  const ink = horizonInks(colors);

  return (
    <svg viewBox="0 0 60 40" preserveAspectRatio="xMidYMid slice" className="h-full w-full block">
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ink.edge} />
          <stop offset="52%" stopColor={ink.centre} />
          <stop offset="100%" stopColor={ink.edge} />
        </linearGradient>
      </defs>
      {art === "horizon" ? <Horizon ground={ink.ground} gradient={grad} /> : null}
      {art === "patchwork" ? <Patchwork c={colors} /> : null}
      {art === "cracked-ground" ? <CrackedGround c={colors} /> : null}
      {art === "contours" ? <Contours c={colors} /> : null}
      {art === "note" ? <Note c={colors} /> : null}
      {art === null ? (
        <g>
          <rect width="60" height="40" fill="#101315" />
          <rect x="0.5" y="0.5" width="59" height="39" fill="none" stroke="#EDEAE3" strokeOpacity="0.25" strokeDasharray="2 2" />
          {colors.slice(0, 3).map((sw, i) => (
            <rect key={i} x={8 + i * 15} y="16" width="12" height="8" fill={sw} />
          ))}
        </g>
      ) : null}
    </svg>
  );
}
