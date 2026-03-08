/**
 * Design System — Color Tokens  (WeReciteTogether)
 *
 * Primary:   Teal/Emerald (Trust, Quranic serenity, growth)
 * Secondary: Amber/Gold   (Achievement, warmth, recitation mastery)
 * Accents:   Indigo (Learning), Rose (Care), Violet (Spirituality)
 */

// ─── Shade Scales ────────────────────────────────────────────────────────────

export const primary = {
  50: '#F0FDFA',
  100: '#CCFBF1',
  200: '#99F6E4',
  300: '#5EEAD4',
  400: '#2DD4BF',
  500: '#14B8A6', // Teal — WeReciteTogether brand
  600: '#0D9488',
  700: '#0F766E',
  800: '#115E59',
  900: '#134E4A',
} as const;

export const secondary = {
  50: '#FFFBEB',
  100: '#FEF3C7',
  200: '#FDE68A',
  300: '#FCD34D',
  400: '#FBBF24',
  500: '#F59E0B', // Amber/Gold
  600: '#D97706',
  700: '#B45309',
  800: '#92400E',
  900: '#78350F',
} as const;

export const accent = {
  indigo: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
  },
  rose: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
    700: '#BE123C',
  },
  violet: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
  },
  sky: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
  },
  emerald: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  orange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
  },
  yellow: {
    50: '#FEFCE8',
    100: '#FEF9C3',
    200: '#FEF08A',
    500: '#EAB308',
    600: '#CA8A04',
    700: '#A16207',
  },
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
  teal: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
  },
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
} as const;

export const neutral = {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
} as const;

// ─── Semantic Colors ─────────────────────────────────────────────────────────

export const semantic = {
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

// ─── Semantic Surfaces ──────────────────────────────────────────────────────

export const semanticSurface = {
  success: '#F0FDF4',  // primary[50]
  warning: '#FFFBEB',  // secondary[50]
  error: '#FEF2F2',    // accent.red[50]
  info: '#EFF6FF',     // accent.blue[50]
} as const;

// ─── Chart / Heatmap Palette ────────────────────────────────────────────────

export const chart = {
  empty: '#F3F4F6',    // neutral[100]
  low: '#D1FAE5',
  medium: '#6EE7B7',
  high: '#34D399',
  veryHigh: '#10B981',
  max: '#059669',
} as const;

// ─── Gamification Colors ─────────────────────────────────────────────────────

export const gamification = {
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  diamond: '#B9E2F5',
  platinum: '#E5E4E2',
  tierAccent: {
    gold: '#D97706',
    silver: '#6B7280',
    bronze: '#B45309',
    diamond: '#7C3AED',
    platinum: '#0891B2',
  },
  tierGlow: {
    gold: '#FDE68A',
    silver: '#E5E7EB',
    bronze: '#FED7AA',
    diamond: '#DDD6FE',
    platinum: '#A5F3FC',
  },
} as const;

// ─── Transparency / Glass ───────────────────────────────────────────────────

export const glass = {
  white: {
    veryLow: 'rgba(255, 255, 255, 0.25)',
    low: 'rgba(255, 255, 255, 0.4)',
    medium: 'rgba(255, 255, 255, 0.6)',
    high: 'rgba(255, 255, 255, 0.8)',
    opaque: 'rgba(255, 255, 255, 0.98)',
  },
  black: {
    low: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    high: 'rgba(0, 0, 0, 0.2)',
    overlay: 'rgba(0, 0, 0, 0.6)',
  }
} as const;

// ─── Gradients (Linear equivalents for native) ──────────────────────────────

export const gradients = {
  primary: [primary[400], primary[600]],
  secondary: [secondary[400], secondary[600]],
  indigo: [accent.indigo[400], accent.indigo[600]],
  rose: [accent.rose[400], accent.rose[600]],
  violet: [accent.violet[400], accent.violet[600]],
  sky: [accent.sky[400], accent.sky[600]],
} as const;

// ─── Palette Aggregate ───────────────────────────────────────────────────────

export const colors = {
  primary,
  secondary,
  accent,
  neutral,
  semantic,
  semanticSurface,
  chart,
  gamification,
  glass,
  gradients,

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ─── Themed Surfaces ─────────────────────────────────────────────────────────

export const lightTheme = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: neutral[900],
  textSecondary: neutral[600],
  textTertiary: neutral[400],
  border: neutral[200],
  borderFocused: primary[500],
  overlay: 'rgba(0, 0, 0, 0.5)',
  primary: primary[500],
  primaryText: '#FFFFFF',
  secondary: secondary[500],
  secondaryText: '#FFFFFF',
  ...semantic,
} as const;

/** Dark theme — High Contrast Premium */
export const darkTheme = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceElevated: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  border: '#334155',
  borderFocused: primary[400],
  overlay: 'rgba(0, 0, 0, 0.7)',
  primary: primary[400],
  primaryText: '#0F172A',
  secondary: secondary[400],
  secondaryText: '#0F172A',
  ...semantic,
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

export type ShadeScale = typeof primary;
export type SemanticColors = typeof semantic;
export type SemanticSurface = typeof semanticSurface;
export type ChartColors = typeof chart;
export type GamificationColors = typeof gamification;
export type ThemeColors = typeof lightTheme;
