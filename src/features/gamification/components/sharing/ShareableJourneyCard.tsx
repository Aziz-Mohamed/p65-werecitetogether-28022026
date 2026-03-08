import React from 'react';
import Svg, {
  Defs,
  G,
  Rect,
  Text as SvgText,
  Circle,
  Path,
  LinearGradient,
  RadialGradient,
  Stop,
  type SvgProps,
} from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { KufiyaPatternDefs } from './KufiyaPattern';
import { HEATMAP_LEGEND } from '../../utils/heatmap-colors';
import type {
  EnrichedCertification,
  RubReference,
  FreshnessState,
} from '../../types/gamification.types';
import { primary, accent, neutral } from '@/theme/colors';
import { typography } from '@/theme/typography';

// ─── Card ────────────────────────────────────────────────────────────────────
const W = 360;
const H = 640;

// ─── Palestinian flag ────────────────────────────────────────────────────────
const FL = { black: '#1A1A1A', white: '#FFFFFF', green: '#009736', red: '#CE1126' };
const BAND = 28;
const STRIPE = 7;

// ─── Palette ─────────────────────────────────────────────────────────────────
const GOLD = '#D4A853';
const TXT = '#F8FAFC';
const TXT2 = '#CBD5E1';
const TXTM = '#94A3B8';

// ─── Juz grid (6 × 5 = 30 blocks) ───────────────────────────────────────────
const BLK = 46;
const GAP = 6;
const COLS = 6;
const GW = COLS * BLK + 5 * GAP;          // 306
const GH = 5 * BLK + 4 * GAP;            // 254
const GX = (W - GW) / 2;                  // 27
const GY = 178;

// ─── Mini-dots (8 rub' per block) ────────────────────────────────────────────
const D_R = 1.3;
const D_SP = 4.8;
const D_TW = 7 * D_SP;                    // 33.6
const D_X0 = (BLK - D_TW) / 2;           // 6.2
const D_Y = BLK - 6;                      // 40

// ─── State colors ────────────────────────────────────────────────────────────
const SC: Record<FreshnessState, string> = {
  fresh: primary[500],
  fading: accent.yellow[500],
  warning: accent.orange[500],
  critical: accent.red[500],
  dormant: neutral[500],
  uncertified: 'rgba(255,255,255,0.04)',
};

// Severity order for tie-breaking dominant state
const SEV: FreshnessState[] = [
  'critical', 'warning', 'fading', 'dormant', 'fresh', 'uncertified',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function juzDominant(
  juzNum: number,
  rubs: RubReference[],
  certs: Map<number, EnrichedCertification>,
) {
  const inJuz = rubs.filter((r) => r.juz_number === juzNum);
  const states: FreshnessState[] = inJuz.map((r) => {
    const c = certs.get(r.rub_number);
    return c ? c.freshness.state : 'uncertified';
  });

  const counts = new Map<FreshnessState, number>();
  states.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1));

  let best: FreshnessState = 'uncertified';
  let max = 0;
  for (const s of SEV) {
    const n = counts.get(s) ?? 0;
    if (n > max) {
      best = s;
      max = n;
    }
  }
  return { juzNum, dominant: best, states };
}

// ─── Olive branch paths (reused left & right) ───────────────────────────────
function OliveBranch({ flip }: { flip?: boolean }) {
  const tx = flip ? W - 62 : 62;
  const sx = flip ? -1 : 1;
  return (
    <G transform={`translate(${tx}, 98) scale(${sx}, 1)`}>
      <Path d="M22,18 Q12,12 0,2" stroke={FL.green} strokeWidth={1} fill="none" opacity={0.5} />
      <Path d="M18,16 C16,12 19,11 20,14 Z" fill={FL.green} opacity={0.4} />
      <Path d="M17,17 C14,14 12,15 14,18 Z" fill={FL.green} opacity={0.4} />
      <Path d="M12,12 C10,8 13,7 14,10 Z" fill={FL.green} opacity={0.4} />
      <Path d="M11,13 C8,10 6,11 8,14 Z" fill={FL.green} opacity={0.4} />
      <Path d="M5,7 C3,3 6,2 7,5 Z" fill={FL.green} opacity={0.4} />
      <Circle cx={20} cy={17} r={1.2} fill={FL.green} opacity={0.5} />
    </G>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ShareableJourneyCardProps extends Pick<SvgProps, 'onLayout'> {
  svgRef: React.RefObject<Svg | null>;
  studentName: string;
  certifiedCount: number;
  totalReviews: number;
  certMap: Map<number, EnrichedCertification>;
  rubReference: RubReference[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ShareableJourneyCard({
  svgRef,
  studentName,
  certifiedCount,
  totalReviews,
  certMap,
  rubReference,
  ...rest
}: ShareableJourneyCardProps) {
  const { t } = useTranslation();
  const pct = Math.round((certifiedCount / 240) * 100);
  const cx = W / 2;

  const juzs = Array.from({ length: 30 }, (_, i) =>
    juzDominant(i + 1, rubReference, certMap),
  );

  // Layout anchors
  const statsY = GY + GH + 18;          // 450
  const sW = 90, sH = 48, sGap = 12;
  const sX0 = (W - (3 * sW + 2 * sGap)) / 2; // 33
  const legendY = statsY + sH + 16;     // 514

  // Reorder legend: positive states first
  const legend = [
    HEATMAP_LEGEND.find((l) => l.label === 'fresh')!,
    HEATMAP_LEGEND.find((l) => l.label === 'fading')!,
    HEATMAP_LEGEND.find((l) => l.label === 'warning')!,
    HEATMAP_LEGEND.find((l) => l.label === 'critical')!,
    HEATMAP_LEGEND.find((l) => l.label === 'dormant')!,
  ];

  return (
    <Svg ref={svgRef} width={W} height={H} viewBox={`0 0 ${W} ${H}`} {...rest}>
      <Defs>
        <KufiyaPatternDefs id="kuf" color="rgba(255,255,255,0.07)" tileSize={18} />
        <KufiyaPatternDefs id="kufB" color="rgba(255,255,255,0.22)" tileSize={22} />

        <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0C1F30" />
          <Stop offset="0.4" stopColor="#0A1628" />
          <Stop offset="1" stopColor="#060E18" />
        </LinearGradient>

        <RadialGradient id="glow" cx="0.5" cy="0.42" r="0.42">
          <Stop offset="0" stopColor={FL.green} stopOpacity="0.06" />
          <Stop offset="1" stopColor={FL.green} stopOpacity="0" />
        </RadialGradient>

        <LinearGradient id="statBg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="rgba(255,255,255,0.07)" />
          <Stop offset="1" stopColor="rgba(255,255,255,0.02)" />
        </LinearGradient>
      </Defs>

      {/* ═══ BACKGROUND ═══ */}
      <Rect width={W} height={H} fill="url(#bg)" />
      <Rect width={W} height={H} fill="url(#kuf)" />
      <Rect width={W} height={H} fill="url(#glow)" />

      {/* ═══ TOP FLAG BAND ═══ */}
      <Rect y={0} width={W} height={STRIPE} fill={FL.black} />
      <Rect y={STRIPE} width={W} height={STRIPE} fill={FL.white} />
      <Rect y={STRIPE * 2} width={W} height={STRIPE} fill={FL.green} />
      <Rect y={STRIPE * 3} width={W} height={STRIPE} fill={FL.red} />
      <Rect y={0} width={W} height={BAND} fill="url(#kufB)" />
      <Rect x={20} y={BAND + 2} width={W - 40} height={0.8} fill={GOLD} opacity={0.3} />

      {/* ═══ BRANDING — crescent + app name ═══ */}
      <G transform={`translate(${cx - 56}, 40) scale(0.28)`}>
        <Path
          d="M38 6 C22 6 10 18 10 34 C10 50 22 62 38 62 C30 56 26 46 26 34 C26 22 30 12 38 6Z"
          fill={GOLD}
        />
        <Path
          d="M48,16 L50,22 L56,22 L51,26 L53,32 L48,28 L43,32 L45,26 L40,22 L46,22 Z"
          fill={GOLD}
        />
      </G>
      <SvgText
        x={cx + 4}
        y={55}
        fill={GOLD}
        fontFamily={typography.fontFamily.bold}
        fontSize={15}
        textAnchor="start"
        letterSpacing={1.2}
      >
        {t('student.journey.shareBranding')}
      </SvgText>

      {/* ═══ DECORATIVE FRAME (corner L-shapes) ═══ */}
      {(() => {
        const fx = 52, fy = 70, fw = W - 104, fh = 92, cl = 14;
        const op = 0.3;
        return (
          <G>
            <Path d={`M${fx},${fy + cl} L${fx},${fy} L${fx + cl},${fy}`} stroke={GOLD} strokeWidth={1} fill="none" opacity={op} />
            <Circle cx={fx} cy={fy} r={1.5} fill={GOLD} opacity={op} />
            <Path d={`M${fx + fw - cl},${fy} L${fx + fw},${fy} L${fx + fw},${fy + cl}`} stroke={GOLD} strokeWidth={1} fill="none" opacity={op} />
            <Circle cx={fx + fw} cy={fy} r={1.5} fill={GOLD} opacity={op} />
            <Path d={`M${fx},${fy + fh - cl} L${fx},${fy + fh} L${fx + cl},${fy + fh}`} stroke={GOLD} strokeWidth={1} fill="none" opacity={op} />
            <Circle cx={fx} cy={fy + fh} r={1.5} fill={GOLD} opacity={op} />
            <Path d={`M${fx + fw - cl},${fy + fh} L${fx + fw},${fy + fh} L${fx + fw},${fy + fh - cl}`} stroke={GOLD} strokeWidth={1} fill="none" opacity={op} />
            <Circle cx={fx + fw} cy={fy + fh} r={1.5} fill={GOLD} opacity={op} />
          </G>
        );
      })()}

      {/* ═══ OLIVE BRANCHES ═══ */}
      <OliveBranch />
      <OliveBranch flip />

      {/* ═══ TITLES ═══ */}
      {/* Arabic title — always shown, prominent */}
      <SvgText
        x={cx}
        y={100}
        fill={TXT}
        fontFamily={typography.fontFamily.arabicBold}
        fontSize={22}
        textAnchor="middle"
      >
        رحلتي مع القرآن
      </SvgText>

      {/* English subtitle */}
      <SvgText
        x={cx}
        y={120}
        fill={TXT2}
        fontFamily={typography.fontFamily.bold}
        fontSize={12}
        textAnchor="middle"
        letterSpacing={2}
      >
        MY QURAN JOURNEY
      </SvgText>

      {/* Student name */}
      <SvgText
        x={cx}
        y={140}
        fill={GOLD}
        fontFamily={typography.fontFamily.semiBold}
        fontSize={14}
        textAnchor="middle"
        letterSpacing={0.5}
      >
        {studentName}
      </SvgText>

      {/* Diamond divider */}
      <G transform={`translate(${cx}, 155)`}>
        <Path d="M0,-3 L3,0 L0,3 L-3,0 Z" fill={GOLD} opacity={0.4} />
        <Rect x={-40} y={-0.4} width={34} height={0.8} fill={GOLD} opacity={0.2} />
        <Rect x={6} y={-0.4} width={34} height={0.8} fill={GOLD} opacity={0.2} />
      </G>

      {/* ═══ JUZ GRID — 6 × 5 ═══ */}
      {juzs.map((juz, idx) => {
        const col = idx % COLS;
        const row = Math.floor(idx / COLS);
        const bx = GX + col * (BLK + GAP);
        const by = GY + row * (BLK + GAP);
        const empty = juz.dominant === 'uncertified';

        return (
          <G key={juz.juzNum}>
            {/* Block */}
            <Rect
              x={bx}
              y={by}
              width={BLK}
              height={BLK}
              rx={8}
              fill={SC[juz.dominant]}
              opacity={empty ? 1 : 0.85}
              stroke={empty ? 'rgba(255,255,255,0.08)' : SC[juz.dominant]}
              strokeWidth={empty ? 0.5 : 0.8}
              strokeOpacity={empty ? 1 : 0.35}
            />

            {/* Juz number */}
            <SvgText
              x={bx + BLK / 2}
              y={by + 26}
              fill={empty ? TXTM : FL.white}
              fontFamily={typography.fontFamily.bold}
              fontSize={empty ? 14 : 16}
              textAnchor="middle"
              opacity={empty ? 0.35 : 0.95}
            >
              {juz.juzNum}
            </SvgText>

            {/* 8 mini-dots showing individual rub' states */}
            {juz.states.map((s, di) => (
              <Circle
                key={di}
                cx={bx + D_X0 + di * D_SP}
                cy={by + D_Y}
                r={D_R}
                fill={SC[s]}
                opacity={s === 'uncertified' ? 0.25 : 0.9}
              />
            ))}
          </G>
        );
      })}

      {/* ═══ STAT CARDS ═══ */}
      {[
        { val: `${certifiedCount}/240`, lbl: t('student.journey.shareCertified'), clr: SC.fresh },
        { val: `${pct}%`, lbl: t('student.journey.shareComplete'), clr: GOLD },
        { val: String(totalReviews), lbl: t('student.journey.shareReviews'), clr: '#60A5FA' },
      ].map((s, i) => {
        const sx = sX0 + i * (sW + sGap);
        return (
          <G key={i}>
            <Rect x={sx} y={statsY} width={sW} height={sH} rx={10} fill="url(#statBg)" stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
            <Rect x={sx + 22} y={statsY} width={sW - 44} height={1.5} rx={1} fill={s.clr} opacity={0.5} />
            <SvgText x={sx + sW / 2} y={statsY + 24} fill={s.clr} fontFamily={typography.fontFamily.bold} fontSize={17} textAnchor="middle">
              {s.val}
            </SvgText>
            <SvgText x={sx + sW / 2} y={statsY + 40} fill={TXTM} fontFamily={typography.fontFamily.medium} fontSize={8} textAnchor="middle">
              {s.lbl}
            </SvgText>
          </G>
        );
      })}

      {/* ═══ LEGEND ═══ */}
      {(() => {
        const itemW = 60;
        const totalW = legend.length * itemW;
        const lx0 = (W - totalW) / 2;
        return legend.map((entry, i) => (
          <G key={i}>
            <Circle cx={lx0 + i * itemW + 4} cy={legendY} r={3} fill={entry.color} />
            <SvgText
              x={lx0 + i * itemW + 12}
              y={legendY + 3}
              fill={TXTM}
              fontFamily={typography.fontFamily.medium}
              fontSize={8}
            >
              {t(`student.journey.legend.${entry.label}`)}
            </SvgText>
          </G>
        ));
      })()}

      {/* ═══ BOTTOM ORNAMENTS ═══ */}
      {/* Centered diamond divider */}
      <G transform={`translate(${cx}, 555)`}>
        <Path d="M0,-3 L3,0 L0,3 L-3,0 Z" fill={GOLD} opacity={0.25} />
        <Rect x={-50} y={-0.4} width={44} height={0.8} fill={GOLD} opacity={0.15} />
        <Rect x={6} y={-0.4} width={44} height={0.8} fill={GOLD} opacity={0.15} />
      </G>

      {/* Islamic stars */}
      {[18, W - 18].map((px, i) => (
        <G key={i} transform={`translate(${px}, 580) scale(0.15)`}>
          <Path
            d="M32 4 L37 22 L56 16 L42 28 L60 32 L42 36 L56 48 L37 42 L32 60 L27 42 L8 48 L22 36 L4 32 L22 28 L8 16 L27 22 Z"
            fill={GOLD}
            opacity={0.3}
          />
        </G>
      ))}

      {/* Gold accent line above bottom band */}
      <Rect x={20} y={H - BAND - 3} width={W - 40} height={0.8} fill={GOLD} opacity={0.3} />

      {/* ═══ BOTTOM FLAG BAND (reversed order) ═══ */}
      <Rect y={H - BAND} width={W} height={STRIPE} fill={FL.red} />
      <Rect y={H - BAND + STRIPE} width={W} height={STRIPE} fill={FL.green} />
      <Rect y={H - BAND + STRIPE * 2} width={W} height={STRIPE} fill={FL.white} />
      <Rect y={H - BAND + STRIPE * 3} width={W} height={STRIPE} fill={FL.black} />
      <Rect y={H - BAND} width={W} height={BAND} fill="url(#kufB)" />
    </Svg>
  );
}
