// Syng Design System v1.0 — fuente única de verdad visual
export const T = {

  // ── Marca ────────────────────────────────────────────────────────────────
  primary:       '#2D3A8C',   // Índigo profundo — acción, selector, FAB
  primaryLight:  'rgba(45,58,140,0.10)',  // Fondos de badge, acento suave
  primaryDark:   '#1E2860',   // Estado presionado
  primaryGlow:   'rgba(45,58,140,0.28)', // Sombra de color, glow selector

  // ── Estados ──────────────────────────────────────────────────────────────
  success:       '#22C55E',
  successLight:  '#DCFCE7',
  danger:        '#E05252',   // Rojo más cálido, menos agresivo
  dangerLight:   'rgba(224,82,82,0.10)',
  warning:       '#F59E0B',

  // ── Logro — completadas ──────────────────────────────────────────────────
  // Completadas usan gris neutro — sensación "resuelto", no "premio"
  completedSurface: 'rgba(255,255,255,0.50)',
  completedBorder:  'rgba(13,18,64,0.08)',
  completedText:    'rgba(13,18,64,0.35)',
  completedCheck:   'rgba(13,18,64,0.25)',

  // ── Texto ─────────────────────────────────────────────────────────────────
  textPrimary:   '#0D1240',   // Títulos, tareas — índigo muy oscuro
  textSecondary: '#5B6480',   // Subtítulos, metadatos
  textTertiary:  'rgba(13,18,64,0.35)', // Timestamps, hints
  textDisabled:  'rgba(13,18,64,0.20)', // Elementos inactivos

  // ── Fondos ────────────────────────────────────────────────────────────────
  bg:            '#F7F8FC',   // Fondo principal — azul-blanco neutro
  bgSecondary:   '#EEF1F8',   // Zonas de menor jerarquía
  surface:       '#FFFFFF',   // Cards, modales
  surfaceGlass:  'rgba(255,255,255,0.88)', // Cards flotantes — papel, no cristal
  surfaceHover:  '#F7F8FC',

  // ── Bordes ────────────────────────────────────────────────────────────────
  border:        '#EEF1F8',
  borderStrong:  '#E0E4F0',
  borderGlass:   'rgba(255,255,255,0.65)', // Bordes de superficies glass

  // ── Tipografía ────────────────────────────────────────────────────────────
  fontXS:   11,   // Timestamp, micro
  fontSM:   13,   // Metadata, subtítulos
  fontMD:   15,   // TaskTitle — cuerpo principal
  fontLG:   17,   // Acciones
  fontXL:   20,   // Labels secundarios
  font2XL:  24,   // Reservado
  font3XL:  28,   // Hero — nombre app

  // ── Espaciado — sistema de 4 puntos ───────────────────────────────────────
  spaceXS:  4,
  spaceSM:  8,
  spaceMD:  12,
  spaceLG:  16,
  spaceXL:  20,
  space2XL: 32,
  space3XL: 48,

  // ── Radios ────────────────────────────────────────────────────────────────
  radiusSM:   8,     // Botones pequeños
  radiusMD:   12,    // Inputs, botones
  radiusLG:   16,    // Cards compactas
  radiusXL:   20,    // Cards de tarea
  radius2XL:  26,    // Toolbar
  radius3XL:  32,    // Bottom sheets, modales
  radiusFull: 9999,  // Badges, FAB

  // ── Sombras — temperatura índigo, nunca negro puro ────────────────────────
  shadowSM:  '0 1px 4px rgba(13,18,64,0.05)',
  shadowMD:  '0 4px 16px rgba(13,18,64,0.07), inset 0 1px 0 rgba(255,255,255,0.90)',
  shadowLG:  '0 8px 32px rgba(13,18,64,0.10), inset 0 1px 0 rgba(255,255,255,0.95)',
  shadowXL:  '0 16px 48px rgba(13,18,64,0.13)',

  // Sombras específicas por elemento
  shadowCard:    '0 4px 16px rgba(13,18,64,0.06), inset 0 1px 0 rgba(255,255,255,0.90)',
  shadowToolbar: '0 8px 32px rgba(13,18,64,0.10), 0 -1px 16px rgba(100,140,255,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
  shadowModal:   '0 -8px 48px rgba(13,18,64,0.12), inset 0 1px 0 rgba(255,255,255,0.95)',
  shadowFAB:     '0 4px 20px rgba(45,58,140,0.40), 0 2px 8px rgba(45,58,140,0.22)',
  shadowSelector:'0 0 0 2.5px #ffffff, 0 0 0 5px rgba(45,58,140,0.28), 0 0 14px rgba(45,58,140,0.22)',
  shadowPrimary: '0 4px 20px rgba(45,58,140,0.32)',
}
