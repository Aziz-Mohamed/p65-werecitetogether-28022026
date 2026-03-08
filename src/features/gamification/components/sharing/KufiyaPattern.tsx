import React from 'react';
import { Pattern, Line, Path, Circle } from 'react-native-svg';
import { neutral } from '@/theme/colors';

/**
 * Kufiya pattern SVG defs — renders inside a parent <Svg>'s <Defs>.
 * Palestinian kufiya geometric fishnet crosshatch with leaf/ogee motifs.
 */
export function KufiyaPatternDefs({
  id = 'kufiya',
  color = neutral[600],
  tileSize = 20,
}: {
  id?: string;
  color?: string;
  tileSize?: number;
}) {
  const t = tileSize;
  const half = t / 2;
  const q1 = t * 0.25;
  const q3 = t * 0.75;

  return (
    <Pattern
      id={id}
      patternUnits="userSpaceOnUse"
      width={t}
      height={t}
    >
      {/* Crosshatch diagonal lines — the fishnet grid */}
      <Line x1={0} y1={0} x2={t} y2={t} stroke={color} strokeWidth={0.8} />
      <Line x1={t} y1={0} x2={0} y2={t} stroke={color} strokeWidth={0.8} />

      {/* Diamond outline connecting midpoints */}
      <Path
        d={`M${half},0 L${t},${half} L${half},${t} L0,${half} Z`}
        stroke={color}
        strokeWidth={0.6}
        fill="none"
      />

      {/* Inner diamond (smaller, creates the layered kufiya feel) */}
      <Path
        d={`M${half},${q1} L${q3},${half} L${half},${q3} L${q1},${half} Z`}
        stroke={color}
        strokeWidth={0.4}
        fill="none"
        opacity={0.7}
      />

      {/* Leaf/ogee motifs — the signature kufiya detail */}
      {/* Top leaf */}
      <Path
        d={`M${half - 2.5},${t * 0.08} Q${half},${t * 0.2} ${half + 2.5},${t * 0.08}`}
        stroke={color} strokeWidth={0.5} fill="none"
      />
      {/* Bottom leaf */}
      <Path
        d={`M${half - 2.5},${t * 0.92} Q${half},${t * 0.8} ${half + 2.5},${t * 0.92}`}
        stroke={color} strokeWidth={0.5} fill="none"
      />
      {/* Right leaf */}
      <Path
        d={`M${t * 0.92},${half - 2.5} Q${t * 0.8},${half} ${t * 0.92},${half + 2.5}`}
        stroke={color} strokeWidth={0.5} fill="none"
      />
      {/* Left leaf */}
      <Path
        d={`M${t * 0.08},${half - 2.5} Q${t * 0.2},${half} ${t * 0.08},${half + 2.5}`}
        stroke={color} strokeWidth={0.5} fill="none"
      />

      {/* Center dot cluster */}
      <Circle cx={half} cy={half} r={1} fill={color} opacity={0.5} />
      <Circle cx={half - 2} cy={half - 2} r={0.5} fill={color} opacity={0.3} />
      <Circle cx={half + 2} cy={half + 2} r={0.5} fill={color} opacity={0.3} />
      <Circle cx={half + 2} cy={half - 2} r={0.5} fill={color} opacity={0.3} />
      <Circle cx={half - 2} cy={half + 2} r={0.5} fill={color} opacity={0.3} />
    </Pattern>
  );
}
