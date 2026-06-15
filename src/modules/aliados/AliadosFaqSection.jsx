import { useState } from 'react'
import { A, L } from '../../shared/agendaEditorial'

const FAQ = [
  {
    q: '¿Cuándo gano comisión?',
    a: 'Solo cuando alguien paga su primera suscripción de Syng usando tu código. Pagos siguientes no generan comisión.',
  },
  {
    q: '¿Por qué no se aplicó un código?',
    a: 'El código debe ingresarse en Perfil antes del primer pago. Si la persona ya pagó antes, o usó otro código, no aplica. Tampoco puedes usar tu propio código.',
  },
  {
    q: '¿Qué significa Pendiente vs Disponible?',
    a: 'Pendiente: alguien pagó con tu código y Mercado Pago aprobó el pago. Disponible: Syng confirmó el depósito (liquidación). Solo el saldo Disponible cuenta para retirar.',
  },
  {
    q: '¿Cuándo puedo retirar?',
    a: 'Cuando tengas al menos $500 MXN disponibles. Los retiros son en bloques de $500, $1,000, $1,500… Necesitas RFC, razón social y una cuenta CLABE registrada.',
  },
  {
    q: '¿Qué pasa si dejo Aliados Syng?',
    a: 'Tu código deja de funcionar para nuevos referidos. El saldo que ya esté disponible sigue siendo retirable con las mismas reglas.',
  },
  {
    q: '¿Cuánto tarda un retiro?',
    a: 'Al solicitarlo, Syng revisa tu cuenta y deposita por SPEI en días hábiles. Te avisaremos cuando se complete.',
  },
]

export function AliadosFaqSection() {
  const [open, setOpen] = useState(null)

  return (
    <div style={A.section}>
      <p style={A.sectionLabel}>Preguntas frecuentes</p>
      <div style={{ padding: '4px 0 8px' }}>
        {FAQ.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={item.q} style={{ borderTop: i === 0 ? 'none' : `1px solid rgba(196,169,98,0.12)` }}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '14px 16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ fontSize: 14, color: L.ivory, lineHeight: 1.45, fontWeight: 500 }}>
                  {item.q}
                </span>
                <span style={{ fontSize: 18, color: L.champagne, lineHeight: 1, flexShrink: 0 }}>
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen && (
                <p style={{
                  margin: 0,
                  padding: '0 16px 14px',
                  fontSize: 13,
                  color: L.ivoryMuted,
                  lineHeight: 1.55,
                }}>
                  {item.a}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
