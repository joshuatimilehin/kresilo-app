import { hash } from "../portfolio/draw";
import { makerById } from "../makers";

/**
 * An original illustrated portrait for a fictional maker: a flat figure drawn
 * from the maker's id, so it is always the same person. Nothing here is based
 * on a real photograph or a real person (docs/cultural-context-and-respect-rules.md,
 * rule 2). Skin, hair and clothing are picked independently from the id, and
 * there are no religious, ceremonial or cultural garments.
 */
const SKIN = ["#f3d5b5", "#e8b98d", "#d29b6c", "#b57a52", "#8d5a3b", "#6b4228", "#f6dfc8", "#c58d63"];
const HAIR = ["#1d1a1a", "#3a2a22", "#5b3b26", "#8a5a2b", "#c9a66b", "#7d7d86", "#2b2230", "#a23c2a"];
const CLOTH = ["#2f6f5f", "#d9733d", "#3a5a9b", "#b8436a", "#e0b341", "#4b3f72", "#2a2a35", "#6a994e"];
const BACK = ["#f4d8c8", "#d6e5df", "#e7defa", "#fbe6a8", "#cfe0f1", "#f2cfd8", "#dfe7c6", "#f6d1b0"];

type Props = { id: string; name: string; className?: string };

function Figure({ seed, x, scale = 1 }: { seed: string; x: number; scale?: number }) {
  const h = hash(seed);
  const skin = SKIN[h % SKIN.length];
  const hair = HAIR[(h >> 3) % HAIR.length];
  const cloth = CLOTH[(h >> 6) % CLOTH.length];
  const style = (h >> 9) % 7;
  const glasses = (h >> 12) % 3 === 0;
  const earring = (h >> 14) % 4 === 0;
  const shade = "#00000022";
  return (
    <g transform={`translate(${x} 0) scale(${scale})`} transform-origin="150 360">
      {/* hair behind the head */}
      {style === 2 && <path d="M92 170 C84 262 100 300 118 300 L182 300 C200 300 216 262 208 170 Z" fill={hair} />}
      {style === 4 && <circle cx={150} cy={150} r={86} fill={hair} />}
      {style === 5 && <path d="M96 168 C92 236 106 252 120 252 L180 252 C194 252 208 236 204 168 Z" fill={hair} />}
      {/* body and neck */}
      <path d="M20 362 C20 282 84 244 150 244 C216 244 280 282 280 362 Z" fill={cloth} />
      <rect x={126} y={216} width={48} height={44} rx={16} fill={skin} />
      <rect x={126} y={216} width={48} height={44} rx={16} fill={shade} />
      <path d="M120 246 L150 286 L180 246 Z" fill={skin} />
      {/* head */}
      <circle cx={98} cy={176} r={11} fill={skin} />
      <circle cx={202} cy={176} r={11} fill={skin} />
      {earring && <circle cx={98} cy={192} r={4} fill="#e8c46a" />}
      <ellipse cx={150} cy={170} rx={52} ry={62} fill={skin} />
      {/* face */}
      <ellipse cx={130} cy={174} rx={4.5} ry={5.5} fill="#1d1a1a" />
      <ellipse cx={170} cy={174} rx={4.5} ry={5.5} fill="#1d1a1a" />
      <path d="M121 160 Q130 155 139 159 M161 159 Q170 155 179 160" stroke={hair} strokeWidth={3.4} strokeLinecap="round" fill="none" />
      <path d="M150 178 L146 198 Q150 200 154 198" stroke="#00000033" strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <path d="M135 212 Q150 224 165 212" stroke="#7a3d33" strokeWidth={3.4} strokeLinecap="round" fill="none" />
      {glasses && (
        <g fill="none" stroke="#1d1a1a" strokeWidth={3}>
          <circle cx={130} cy={174} r={13} />
          <circle cx={170} cy={174} r={13} />
          <path d="M143 174 H157" />
        </g>
      )}
      {/* hair on top */}
      {style === 0 && <path d="M96 168 C92 100 208 100 204 168 C194 138 106 138 96 168 Z" fill={hair} />}
      {style === 1 && (
        <g fill={hair}>
          {[100, 120, 140, 160, 180, 200].map((cx, i) => (
            <circle key={cx} cx={cx} cy={118 + Math.abs(i - 2.5) * 6} r={19} />
          ))}
          <path d="M98 150 C100 126 200 126 202 150 C192 140 108 140 98 150 Z" />
        </g>
      )}
      {style === 2 && <path d="M96 172 C90 98 210 98 204 172 C198 140 160 124 140 128 C116 130 100 146 96 172 Z" fill={hair} />}
      {style === 3 && (
        <g fill={hair}>
          <circle cx={150} cy={102} r={22} />
          <path d="M96 168 C92 106 208 106 204 168 C194 140 106 140 96 168 Z" />
        </g>
      )}
      {style === 4 && <path d="M100 160 C104 118 196 118 200 160 C190 138 110 138 100 160 Z" fill={hair} />}
      {style === 5 && <path d="M96 170 C92 100 208 100 204 170 C196 138 104 138 96 170 Z" fill={hair} />}
      {style === 6 && <path d="M98 160 C98 124 202 124 202 160 C196 146 104 146 98 160 Z" fill={hair} />}
    </g>
  );
}

/** One portrait, two for a collective, three in a row for a studio team. */
export function Portrait({ id, name, className }: Props) {
  const h = hash(id);
  const bg = BACK[h % BACK.length];
  const second = id.includes("-and-");
  const team = makerById(id)?.kind === "organization";
  return (
    <svg viewBox="0 0 300 360" role="img" aria-label={`${name}, illustrated portrait`} className={className} preserveAspectRatio="xMidYMax slice">
      <rect x={-300} y={-200} width={900} height={760} fill={bg} />
      <circle cx={150} cy={190} r={140} fill="#ffffff" opacity={0.35} />
      <path d="M0 360 V250 Q150 160 300 250 V360 Z" fill="#00000012" />
      {team ? (
        <>
          <Figure seed={`${id}-a`} x={-76} scale={0.6} />
          <Figure seed={`${id}-c`} x={76} scale={0.6} />
          <Figure seed={`${id}-b`} x={0} scale={0.68} />
        </>
      ) : second ? (
        <>
          <Figure seed={`${id}-a`} x={-70} scale={0.84} />
          <Figure seed={`${id}-b`} x={70} scale={0.84} />
        </>
      ) : (
        <Figure seed={id} x={0} />
      )}
    </svg>
  );
}
