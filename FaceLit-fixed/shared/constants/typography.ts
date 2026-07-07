// ─────────────────────────────────────────────
//  shared/constants/typography.ts
//  Escala tipográfica — tamaños y pesos
// ─────────────────────────────────────────────

export const FontSize = {
  xs:   11,
  sm:   12,
  md:   13,
  base: 14,
  lg:   16,
  xl:   18,
  '2xl': 22,
  '3xl': 26,
  '4xl': 32,
  '5xl': 38,
} as const;

export const FontWeight = {
  regular:   '400',
  medium:    '500',
  semibold:  '600',
  bold:      '700',
  extrabold: '800',
  black:     '900',
} as const;