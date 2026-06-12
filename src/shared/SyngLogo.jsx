import { L } from './agendaEditorial'

/** Marca Syng — editorial negro · marfil · champagne */
export function SyngLogo({ size = 'lg', showWordmark = true, centered = true }) {
  const markSize = size === 'sm' ? 30 : size === 'md' ? 44 : 56
  const titleSize = size === 'sm' ? 15 : size === 'md' ? 22 : 32

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: centered ? 'center' : 'flex-start',
      textAlign: centered ? 'center' : 'left',
    }}>
      <div style={{
        width: markSize,
        height: markSize,
        borderRadius: 2,
        background: L.ink,
        border: `1px solid ${L.champagneBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: size === 'lg' ? '0 8px 32px rgba(0,0,0,0.45)' : 'none',
      }}>
        <span style={{
          fontFamily: L.serif,
          fontSize: markSize * 0.52,
          fontWeight: 400,
          color: L.ivory,
          lineHeight: 1,
          marginTop: -2,
        }}>S</span>
      </div>
      {showWordmark && (
        <>
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
        </>
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
      <div style={{
        width: 30,
        height: 30,
        borderRadius: 2,
        background: L.ink,
        border: `1px solid ${L.champagneBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: L.serif, fontSize: 16, color: L.ivory, lineHeight: 1 }}>S</span>
      </div>
      <span style={{ fontFamily: L.serif, fontSize: 18, color: textColor, letterSpacing: '-0.02em' }}>Syng</span>
    </div>
  )
}
