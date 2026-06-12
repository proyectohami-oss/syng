import { L } from './agendaEditorial'

/** Isotipo Syng — 4 con punto debajo */
export function SyngMark({ size = 56, animated = false, style = {}, bordered = true }) {
  const dotSize = Math.max(5, Math.round(size * 0.13))
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: 2,
      background: L.ink,
      border: bordered ? `1px solid ${L.champagneBorder}` : 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Math.round(size * 0.05),
      flexShrink: 0,
      ...style,
    }}>
      <span style={{
        fontFamily: L.serif,
        fontSize: size * 0.44,
        fontWeight: 400,
        color: L.ivory,
        lineHeight: 1,
        marginTop: -Math.round(size * 0.04),
      }}>4</span>
      <div style={{
        width: dotSize,
        height: dotSize,
        borderRadius: '50%',
        background: L.champagne,
        animation: animated ? 'syngMarkDot 2.5s ease-in-out infinite' : undefined,
      }} />
      {animated && (
        <style>{`
          @keyframes syngMarkDot {
            0%, 100% { opacity: 0.45; transform: scale(0.92); }
            50% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      )}
    </div>
  )
}

/** Marca Syng — editorial negro · marfil · champagne */
export function SyngLogo({ size = 'lg', showWordmark = true, centered = true, animated = false }) {
  const markSize = size === 'sm' ? 30 : size === 'md' ? 44 : 56
  const titleSize = size === 'sm' ? 15 : size === 'md' ? 22 : 32

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: centered ? 'center' : 'flex-start',
      textAlign: centered ? 'center' : 'left',
    }}>
      <SyngMark
        size={markSize}
        animated={animated}
        style={size === 'lg' ? { boxShadow: '0 8px 32px rgba(0,0,0,0.45)' } : undefined}
      />
      {showWordmark && (
        <p style={{
          margin: size === 'sm' ? '0 0 0 8px' : '14px 0 0',
          fontFamily: L.serif,
          fontSize: titleSize,
          fontWeight: 400,
          color: L.ivory,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}>
          Syng
        </p>
      )}
    </div>
  )
}

/** Logo horizontal — sidebar desktop */
export function SyngLogoRow({ onClick, lightBg = false }) {
  const textColor = lightBg ? L.ink : L.ivory
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: onClick ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <SyngMark size={30} />
      <span style={{ fontFamily: L.serif, fontSize: 18, color: textColor, letterSpacing: '-0.02em' }}>Syng</span>
    </div>
  )
}
