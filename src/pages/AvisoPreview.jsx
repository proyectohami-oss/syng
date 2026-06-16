/**
 * Vista previa del flujo aviso Syng — abre /preview/aviso en el navegador.
 */
import {
  L,
  LuxuryBadge,
  LuxuryDivider,
  LuxuryHandle,
  LuxuryStep,
  LuxuryTimeCard,
  luxuryBtnGhost,
  luxuryBtnOutline,
  luxuryBtnPrimary,
  luxuryNote,
} from '../shared/avisoLuxury'

function Phone({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: L.champagne, letterSpacing: '0.12em' }}>
        {label}
      </p>
      <div style={{
        width: 300,
        height: 620,
        borderRadius: 36,
        border: `2px solid ${L.champagneBorder}`,
        overflow: 'hidden',
        background: '#F2F4FB',
        position: 'relative',
        flexShrink: 0,
      }}>
        <div style={{
          height: 28,
          background: L.ink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ width: 72, height: 5, borderRadius: 3, background: L.champagneBorder }} />
        </div>
        <div style={{ height: 'calc(100% - 28px)', position: 'relative', overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function AgendaBg() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#F2F4FB', padding: '14px 12px' }}>
      <p style={{ margin: '0 0 8px', fontSize: 11, color: '#5B6480' }}>Nueva tarea</p>
      <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: '#0D1240' }}>
        Comprar flores
      </div>
    </div>
  )
}

function Sheet({ children }) {
  return (
    <>
      <AgendaBg />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(6,6,6,0.72)',
        display: 'flex', alignItems: 'flex-end',
      }}>
        <div style={{
          width: '100%',
          background: L.ink,
          borderTop: `1px solid ${L.champagneBorder}`,
          padding: '22px 20px 28px',
        }}>
          {children}
        </div>
      </div>
    </>
  )
}

function ActivarPreview() {
  return (
    <Sheet>
      <LuxuryHandle />
      <LuxuryBadge>Aviso personal</LuxuryBadge>
      <h2 style={{
        margin: '0 0 4px', fontFamily: L.serif, fontSize: 22, fontWeight: 400,
        color: L.ivory, textAlign: 'center', lineHeight: 1.2,
      }}>
        Comprar flores
      </h2>
      <LuxuryDivider />
      <LuxuryTimeCard notifyLabel="10 minutos antes" taskTimeLabel="5:00 PM" />
      <p style={{
        margin: '0 0 18px', fontSize: 11, lineHeight: 1.55,
        color: L.ivoryMuted, textAlign: 'center',
      }}>
        iPhone pedirá confirmar en Calendario.
        <br />
        Un gesto, y Syng te acompaña.
      </p>
      <div style={luxuryBtnPrimary}>Activar aviso</div>
      <div style={luxuryBtnGhost}>Solo guardar</div>
    </Sheet>
  )
}

function IphonePreview({ done }) {
  return (
    <Sheet>
      <LuxuryHandle />
      <LuxuryBadge>En tu iPhone</LuxuryBadge>
      <h2 style={{
        margin: '0 0 4px', fontFamily: L.serif, fontSize: 20, fontWeight: 400, color: L.ivory,
      }}>
        {done ? 'Confirma en Calendario' : 'Un paso más'}
      </h2>
      <LuxuryDivider />
      {!done ? (
        <>
          <LuxuryStep n="1" title="Continuar" desc="Toca el botón de abajo. iPhone abrirá la invitación." />
          <LuxuryStep n="2" title="Permitir" desc="Acepta cuando Safari te lo pida." />
          <LuxuryStep n="3" title="Agregar al calendario" desc="Confirma el evento con Syng, la frase amable y tu tarea." />
          <p style={luxuryNote}>Sin ese gesto, el aviso no sonará fuera de Syng.</p>
          <div style={luxuryBtnPrimary}>Continuar</div>
        </>
      ) : (
        <>
          <p style={{ margin: '0 0 18px', fontSize: 13, lineHeight: 1.55, color: L.ivoryMuted }}>
            Busca el evento con <strong style={{ color: L.ivory }}>Syng · Es momento de retomarlo ·</strong> y el nombre de tu tarea en Calendario.
          </p>
          <div style={luxuryBtnOutline}>Reintentar</div>
          <div style={luxuryBtnGhost}>Listo</div>
        </>
      )}
    </Sheet>
  )
}

function RecordatorioPreview() {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: L.ink, color: L.ivory,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'space-between', padding: '36px 20px 28px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 52, height: 52, margin: '0 auto 10px', background: L.ivory, color: L.ink,
          fontSize: 22, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${L.champagneBorder}`,
        }}>S</div>
        <p style={{ margin: 0, fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: L.champagne }}>
          Recordatorio
        </p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          margin: '0 0 10px', fontFamily: L.serif, fontSize: 26, fontWeight: 400,
          lineHeight: 1.2, color: L.ivory,
        }}>
          Comprar flores
        </h1>
        <p style={{ margin: '0 0 14px', fontSize: 14, color: L.ivoryMuted }}>Es momento de retomarlo.</p>
        <span style={{
          padding: '5px 10px', fontSize: 10, border: `1px solid ${L.champagneBorder}`,
          color: L.ivoryMuted, letterSpacing: '0.06em',
        }}>
          Vence hoy
        </span>
      </div>
      <div style={{ width: '100%' }}>
        <div style={{ ...luxuryBtnPrimary, marginBottom: 8 }}>Completar</div>
        <div style={luxuryBtnOutline}>Ver en agenda</div>
      </div>
    </div>
  )
}

export default function AvisoPreview() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050505',
      color: L.ivory,
      padding: '32px 20px 48px',
      overflowX: 'auto',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <p style={{
          margin: '0 0 6px', fontSize: 10, letterSpacing: '0.32em',
          textTransform: 'uppercase', color: L.champagne,
        }}>
          Syng · Vista previa
        </p>
        <h1 style={{
          margin: '0 0 8px', fontFamily: L.serif, fontSize: 28, fontWeight: 400,
        }}>
          Flujo aviso editorial
        </h1>
        <p style={{ margin: '0 0 32px', fontSize: 14, color: L.ivoryMuted, maxWidth: 480 }}>
          Desliza horizontalmente para ver las 4 pantallas. Negro · marfil · champagne.
        </p>

        <div style={{
          display: 'flex', gap: 28, overflowX: 'auto', paddingBottom: 16,
          WebkitOverflowScrolling: 'touch',
        }}>
          <Phone label="1 · ACTIVAR AVISO"><ActivarPreview /></Phone>
          <Phone label="2 · PASOS IPHONE"><IphonePreview done={false} /></Phone>
          <Phone label="3 · CONFIRMAR"><IphonePreview done /></Phone>
          <Phone label="4 · AL SONAR"><RecordatorioPreview /></Phone>
        </div>
      </div>
    </div>
  )
}
