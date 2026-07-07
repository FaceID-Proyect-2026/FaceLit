// ─────────────────────────────────────────────
//  shared/constants/colors.ts
//  Paleta de colores centralizada — NO usar
//  hexadecimales directamente en los componentes
// ─────────────────────────────────────────────

export const Colors = {
  // Marca
  primary:        '#65B361',
  primaryLight:   '#72C96D',
  primaryDark:    '#4A9146',
  primaryFaint:   'rgba(101,179,97,0.10)',

  // Neutros oscuro
  dark: {
    background:   '#050505',
    surface:      '#07120D',
    card:         '#0D1F14',
    border:       'rgba(255,255,255,0.08)',
    inputBg:      'rgba(255,255,255,0.05)',
    inputBorder:  'rgba(255,255,255,0.30)',
    text:         '#FFFFFF',
    textMuted:    '#A8BCA6',
    textSecondary:'#CAD6C8',
    placeholder:  '#5A7258',
    link:         '#8EF58A',
    gradient:     ['#000000', '#06170F', '#0B2D17'] as const,
  },

  // Neutros claro
  light: {
    background:   '#F7FFF4',
    surface:      '#FFFFFF',
    card:         '#FFFFFF',
    border:       'rgba(0,0,0,0.08)',
    inputBg:      '#FAFAFA',
    inputBorder:  '#BBBBBB',
    text:         '#111111',
    textMuted:    '#555555',
    textSecondary:'#1E1E1E',
    placeholder:  '#AAAAAA',
    link:         '#3A8C36',
    gradient:     ['#F7FFF4', '#E5F7DF', '#1E4C28'] as const,
  },

  // Estado
  error:    '#D92027',
  warning:  '#E89B2C',
  success:  '#27AE60',
  info:     '#4A90D9',

  // Fijos
  white:    '#FFFFFF',
  black:    '#000000',
  transparent: 'transparent',
} as const;