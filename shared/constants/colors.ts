// ─────────────────────────────────────────────
//  shared/constants/colors.ts
//  Paleta de colores centralizada — NO usar
//  hexadecimales directamente en los componentes
// ─────────────────────────────────────────────

export const Colors = {
  // ── PRIMARY (Marca SENA/FaceLit) ───────────────────────────────
  primary:          '#65B361',  // Verde SENA original (CTA principal)
  primaryLight:     '#72C96D',  // Hover/Active
  primaryDark:      '#4A9146',  // Pressed/Selected
  primaryFaint:     'rgba(101,179,97,0.10)',  // Fondos sutiles

  // ── SECONDARY / ACCENT (Dorado/Ámbar Cálido) ─────────────────────
  secondary:          '#F59E0B',  // Dorado/Ámbar para badges, selector idioma, estados
  secondaryLight:     '#FFB74D',  // Hover
  secondaryDark:      '#D97706',  // Pressed
  secondaryFaint:     'rgba(245,158,11,0.08)',  // Fondos sutiles

  // ── SEMANTIC (Estados) ────────────────────────────────────────
  success:        '#27AE60',
  successSoft:    'rgba(39,174,96,0.15)',

  info:           '#4A90D9',
  infoSoft:       'rgba(74,144,217,0.12)',

  warning:        '#E89B2C',
  warningSoft:    'rgba(232,155,44,0.12)',

  danger:         '#D92027',
  dangerSoft:     'rgba(217,32,39,0.12)',

  // Compatibilidad de nombres heredados en la app
  error:          '#D92027',

  // ── NEUTROS (Light Theme) ───────────────────────────────────────
  light: {
    background:        '#FAFAFA',     // Fondo blanco/gris muy claro neutro
    surface:           '#FFFFFF',     // Tarjetas principales en blanco puro
    surfaceSecondary:  '#F1F5F9',     // Fondo sutil para el contenedor del teléfono
    card:              '#FFFFFF',     // Alias de compatibilidad para tarjetas
    border:            '#E2E8F0',     // Bordes limpios en gris claro
    borderStrong:      '#CBD5E1',     // Bordes destacados
    inputBg:           '#FFFFFF',
    inputBorder:       '#D1D5DB',
    text:              '#0F172A',     // Títulos principales en gris oscuro/grafito
    textSecondary:     '#475569',     // Texto del párrafo descriptivo
    textMuted:         '#64748B',     // Texto apagado
    placeholder:       '#94A3B8',
    link:              '#D97706',     // Ámbar para links y acciones secundarias
    gradient:          ['#FAFAFA', '#FFFFFF', '#F1F5F9'] as const,
  },

  // ── SUPERFICIES (Dark Theme - Carbón con tinte verde) ───────────
  dark: {
    background:        '#07120D',     // Fondo verde carbón de la aplicación
    surface:           '#121A16',     // Contenedores y modales
    surfaceSecondary:  '#17231C',     // Superficies internas destacadas
    card:              '#121A16',     // Alias de compatibilidad para tarjetas
    border:            '#2C4032',     // Líneas divisorias y bordes
    borderStrong:      '#3D5A42',     // Bordes destacados
    inputBg:           '#151E19',
    inputBorder:       '#2C4032',
    text:              '#FFFFFF',     // Texto principal blanco puro
    textSecondary:     '#A3A3A3',     // Párrafos explicativos
    textMuted:         '#757575',
    placeholder:       '#555555',
    link:              '#F59E0B',     // Ámbar para links y acciones secundarias
    gradient:          ['#07120D', '#121A16', '#17231C'] as const,
  },

  // ── FIJOS ─────────────────────────────────────────────────────
  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',
} as const;