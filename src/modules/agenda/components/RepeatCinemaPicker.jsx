import { T } from '../../../theme'

/**
 * Selector de días estilo cine — grilla 7×5 para el mes (1–31).
 * Cada botón actúa como un asiento: tap para activar/desactivar.
 */
export function RepeatCinemaPicker({ selectedDays = [], onToggle, daysInMonth = 31, compact = false }) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const selected = new Set(selectedDays)

  return (
    <div style={{ ...s.wrap, ...(compact ? s.wrapCompact : {}) }}>
      {days.map(day => {
        const valid = day <= daysInMonth
        const active = selected.has(day)
        return (
          <button
            key={day}
            type="button"
            disabled={!valid}
            onClick={() => onToggle(day)}
            style={{
              ...s.seat,
              ...(compact ? s.seatCompact : {}),
              opacity: valid ? 1 : 0.22,
              cursor: valid ? 'pointer' : 'default',
              ...(active ? s.seatActive : s.seatIdle),
            }}
          >
            {day}
          </button>
        )
      })}
    </div>
  )
}

const s = {
  wrap: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 8,
    padding: T.spaceLG,
    background: T.primaryLight,
    borderRadius: T.radius3XL,
    border: `1px solid rgba(45,58,140,0.12)`,
    boxShadow: T.shadowCard,
    flex: 1,
    alignContent: 'start',
    minHeight: 0,
  },
  wrapCompact: {
    gap: 5,
    padding: 10,
  },
  seatCompact: {
    fontSize: 11,
    borderRadius: 8,
  },
  seat: {
    aspectRatio: '1',
    borderRadius: T.radiusMD,
    fontSize: 13,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
    WebkitTapHighlightColor: 'transparent',
  },
  seatIdle: {
    background: 'rgba(255,255,255,0.72)',
    color: T.textSecondary,
    border: `1.5px solid rgba(13,18,64,0.08)`,
    boxShadow: T.shadowSM,
    transform: 'scale(1)',
  },
  seatActive: {
    background: 'linear-gradient(135deg,#3D4FA8,#2D3A8C)',
    color: '#fff',
    border: 'none',
    boxShadow: '0 6px 20px rgba(45,58,140,0.40)',
    transform: 'scale(1.1)',
  },
}
