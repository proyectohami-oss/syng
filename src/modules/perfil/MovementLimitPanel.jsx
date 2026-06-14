import { isMonthlyPlan } from '../../core/services/movements.service'
import { A, L } from '../../shared/agendaEditorial'

export function MovementLimitPanel({ planId, usage }) {
  if (usage.unlimited) return null

  const monthly = isMonthlyPlan(planId)
  const recovery  = usage.recovery

  function scrollToUpgrade() {
    document.getElementById('syng-mejorar-plan')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: L.ivoryMuted }}>Uso del plan</span>
        <span style={{ fontSize: 12, color: usage.atLimit ? '#E05252' : L.champagne }}>
          {usage.label}
        </span>
      </div>
      <div style={{
        height: 4,
        borderRadius: 2,
        background: 'rgba(196,169,98,0.15)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${usage.percent}%`,
          background: usage.atLimit ? '#E05252' : L.champagne,
          transition: 'width 0.3s ease',
        }} />
      </div>

      {monthly && !usage.atLimit && usage.resetLabel && (
        <p style={{ margin: '8px 0 0', fontSize: 11, color: L.ivoryMuted, lineHeight: 1.45 }}>
          Plus Individual: {usage.limit} movimientos al mes, no se acumulan. Se reinician el {usage.resetLabel}.
        </p>
      )}

      {usage.atLimit && recovery && (
        <div style={{
          marginTop: 12,
          padding: '12px 14px',
          border: '1px solid rgba(224,82,82,0.35)',
          borderRadius: 2,
          background: 'rgba(224,82,82,0.06)',
        }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#E05252', lineHeight: 1.45, fontWeight: 500 }}>
            {monthly
              ? 'Agotaste tus movimientos de Plus Individual este mes (no se acumulan). Elige una opción:'
              : 'Usaste tus 270 movimientos gratis. Tus datos se conservan; elige un plan de pago para seguir:'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recovery.options.map(opt => (
              <div
                key={opt.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 2,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: L.ivory, fontWeight: 500 }}>{opt.label}</div>
                  {opt.sub && (
                    <div style={{ fontSize: 11, color: L.ivoryMuted, marginTop: 2 }}>{opt.sub}</div>
                  )}
                </div>
                {opt.id === 'change_plan' && (
                  <button
                    type="button"
                    onClick={scrollToUpgrade}
                    style={{ ...A.btnPrimary, flex: 'none', padding: '6px 10px', fontSize: 11 }}
                  >
                    Ver planes
                  </button>
                )}
                {opt.id === 'buy_more' && opt.disabled && (
                  <span style={{ fontSize: 10, color: L.ivoryMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Pronto
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
