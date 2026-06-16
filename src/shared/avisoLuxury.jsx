/** Estética aviso Syng — editorial, sobria, champagne sobre negro */
import { createPortal } from 'react-dom'
import { buildCalendarSummary, resolveFriendlyPhrase } from '../core/calendar/calendarSummary'

export const L = {
  ink: '#0A0A0A',
  inkSoft: '#141414',
  ivory: '#FAF8F5',
  ivoryMuted: 'rgba(250,248,245,0.55)',
  ivoryFaint: 'rgba(250,248,245,0.32)',
  champagne: '#C4A962',
  champagneLight: 'rgba(196,169,98,0.14)',
  champagneBorder: 'rgba(196,169,98,0.42)',
  serif: 'Georgia, "Times New Roman", Times, serif',
}

export const luxuryCss = `
@keyframes syngLuxuryIn {
  from { opacity: 0; transform: translateY(32px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes syngLuxuryShimmer {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}
`

export function LuxuryPortal({ children }) {
  if (typeof document === 'undefined') return children
  return createPortal(children, document.body)
}

export function LuxuryKeyframes() {
  return <style>{luxuryCss}</style>
}

export const luxuryFullscreen = {
  position: 'fixed',
  inset: 0,
  zIndex: 100000,
  background: L.ink,
  color: L.ivory,
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  padding:
    'max(20px, env(safe-area-inset-top)) 22px max(28px, calc(env(safe-area-inset-bottom) + 12px))',
}

export function LuxuryHandle() {
  return (
    <div style={{
      width: 36, height: 2, borderRadius: 1,
      background: L.champagneBorder,
      margin: '0 auto 16px',
    }} />
  )
}

export function LuxuryBadge({ children }) {
  return (
    <p style={{
      margin: '0 0 14px',
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: '0.32em',
      textTransform: 'uppercase',
      color: L.champagne,
    }}>
      {children}
    </p>
  )
}

export function LuxuryDivider({ tight = false }) {
  return (
    <div style={{
      width: 48,
      height: 1,
      background: `linear-gradient(90deg, transparent, ${L.champagne}, transparent)`,
      margin: tight ? '12px auto' : '20px auto',
    }} />
  )
}

export function LuxuryTimeCard({ notifyLabel, taskTimeLabel }) {
  return (
    <div style={{
      margin: '0 0 22px',
      padding: '18px 20px',
      borderRadius: 2,
      border: `1px solid ${L.champagneBorder}`,
      background: L.champagneLight,
      textAlign: 'left',
    }}>
      <p style={{
        margin: '0 0 6px',
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        color: L.champagne,
      }}>
        Te avisamos
      </p>
      <p style={{
        margin: 0,
        fontFamily: L.serif,
        fontSize: 22,
        fontWeight: 400,
        color: L.ivory,
        letterSpacing: '-0.01em',
        lineHeight: 1.25,
      }}>
        {notifyLabel}
      </p>
      {taskTimeLabel ? (
        <p style={{
          margin: '10px 0 0',
          fontSize: 13,
          color: L.ivoryMuted,
          letterSpacing: '0.04em',
        }}>
          Tarea a las {taskTimeLabel}
        </p>
      ) : null}
    </div>
  )
}

export function LuxuryCalPreview({ title, phrase, notifyLabel, taskTimeLabel, compact = false }) {
  const sum = buildCalendarSummary({ title, phrase: resolveFriendlyPhrase(phrase) })
  return (
    <div style={{
      margin: compact ? '0 0 12px' : '0 0 20px',
      padding: compact ? '12px 14px' : '16px 18px',
      borderRadius: compact ? 2 : 14,
      background: 'rgba(255,255,255,0.06)',
      border: `1px solid ${L.champagneBorder}`,
    }}>
      <p style={{
        margin: '0 0 4px',
        fontSize: 9,
        letterSpacing: '0.24em',
        textTransform: 'uppercase',
        color: L.champagne,
      }}>
        Así se verá en Calendario
      </p>
      <p style={{
        margin: '0 0 6px',
        fontFamily: L.serif,
        fontSize: compact ? 16 : 18,
        color: L.ivory,
        lineHeight: 1.25,
      }}>
        {sum}
      </p>
      {notifyLabel ? (
        <p style={{ margin: '0 0 4px', fontSize: 12, color: L.champagne, fontWeight: 500 }}>
          Aviso: {notifyLabel}
        </p>
      ) : null}
      {taskTimeLabel ? (
        <p style={{ margin: '0 0 8px', fontSize: 12, color: L.ivoryMuted }}>
          Tarea a las {taskTimeLabel}
        </p>
      ) : null}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: compact ? '8px 10px' : '10px 12px',
        borderRadius: compact ? 2 : 10,
        background: 'rgba(255,255,255,0.08)',
        marginBottom: compact ? 6 : 10,
      }}>
        <span style={{ fontSize: 11, color: L.ivoryMuted, flex: 1 }}>syng-psi.vercel.app</span>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          color: '#fff',
          background: '#34C759',
          padding: '3px 8px',
          borderRadius: 4,
        }}>
          Abrir
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 10, lineHeight: 1.45, color: L.ivoryFaint }}>
        iPhone controla esta pantalla. Abajo verás <strong style={{ color: L.ivoryMuted }}>Agregar al calendario</strong>.
      </p>
    </div>
  )
}

export function LuxuryStep({ n, title, desc, tight = false }) {
  return (
    <div style={{
      display: 'flex',
      gap: tight ? 12 : 16,
      alignItems: 'flex-start',
      padding: tight ? '10px 0' : '14px 0',
      borderBottom: `1px solid rgba(196,169,98,0.12)`,
    }}>
      <span style={{
        flexShrink: 0,
        width: tight ? 24 : 28,
        height: tight ? 24 : 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: L.serif,
        fontSize: tight ? 13 : 15,
        color: L.champagne,
        border: `1px solid ${L.champagneBorder}`,
        borderRadius: '50%',
      }}>
        {n}
      </span>
      <div>
        <p style={{
          margin: '0 0 2px',
          fontSize: tight ? 14 : 15,
          fontWeight: 500,
          color: L.ivory,
          letterSpacing: '0.01em',
        }}>
          {title}
        </p>
        <p style={{
          margin: 0,
          fontSize: tight ? 12 : 13,
          lineHeight: 1.45,
          color: L.ivoryMuted,
        }}>
          {desc}
        </p>
      </div>
    </div>
  )
}

export const luxuryOverlay = {
  position: 'fixed',
  inset: 0,
  zIndex: 3000,
  background: 'rgba(6,6,6,0.72)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  animation: 'syngLuxuryFade 0.4s ease both',
}

export const luxurySheet = {
  width: '100%',
  maxWidth: 480,
  background: L.ink,
  borderRadius: '2px 2px 0 0',
  borderTop: `1px solid ${L.champagneBorder}`,
  padding: '28px 26px calc(36px + env(safe-area-inset-bottom))',
  boxShadow: '0 -24px 80px rgba(0,0,0,0.55)',
  animation: 'syngLuxuryIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
}

export const luxuryBtnPrimary = {
  width: '100%',
  padding: '16px 20px',
  borderRadius: 2,
  border: `1px solid ${L.ivory}`,
  background: L.ivory,
  color: L.ink,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}

export const luxuryBtnGhost = {
  width: '100%',
  padding: 14,
  borderRadius: 2,
  border: 'none',
  background: 'transparent',
  color: L.ivoryFaint,
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.08em',
  cursor: 'pointer',
  marginTop: 4,
}

export const luxuryBtnOutline = {
  ...luxuryBtnPrimary,
  background: 'transparent',
  color: L.ivory,
  border: `1px solid ${L.champagneBorder}`,
}

export const luxuryNote = {
  margin: '0 0 22px',
  padding: '14px 16px',
  borderLeft: `2px solid ${L.champagne}`,
  background: 'rgba(196,169,98,0.06)',
  fontSize: 13,
  lineHeight: 1.55,
  color: L.ivoryMuted,
}
