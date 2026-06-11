/**
 * PWAInstallButton — botón de instalación PWA para Android e iOS.
 * Usa usePWAInstall hook. Sin dependencias externas.
 */
import { useState } from 'react'
import { usePWAInstall } from './usePWAInstall'

export function PWAInstallButton() {
  const { canInstall, isIOS, isAndroid, isInstalled, installing, triggerInstall, hasNativePrompt } = usePWAInstall()
  const [showModal, setShowModal] = useState(false)

  // No mostrar nada si ya está instalada o no se puede instalar
  if (isInstalled || !canInstall) return null

  async function handlePress() {
    if (isIOS) {
      setShowModal(true)
      return
    }
    if (hasNativePrompt) {
      const ok = await triggerInstall()
      if (!ok) setShowModal(true)
      return
    }
    setShowModal(true)
  }

  return (
    <>
      {/* ── Botón principal ── */}
      <button
        onClick={handlePress}
        disabled={installing}
        style={{
          width:         '100%',
          minHeight:     50,
          borderRadius:  14,
          border:        'none',
          background:    installing
            ? 'rgba(45,58,140,0.5)'
            : 'linear-gradient(135deg, #3D4FA8 0%, #2D3A8C 100%)',
          color:         '#fff',
          fontSize:      15,
          fontWeight:    700,
          cursor:        installing ? 'not-allowed' : 'pointer',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          gap:           10,
          transition:    'all 0.15s ease',
          boxShadow:     '0 4px 16px rgba(45,58,140,0.25)',
          letterSpacing: '0.01em',
        }}
      >
        {installing ? (
          <><Spinner /> Instalando…</>
        ) : (
          <>
            <span style={{ fontSize: 18 }}>📲</span>
            <span>Instalar Syng</span>
            <span style={{
              background:   'rgba(255,255,255,0.2)',
              borderRadius: 20,
              padding:      '2px 10px',
              fontSize:     12,
              fontWeight:   600,
            }}>Gratis</span>
          </>
        )}
      </button>

      {/* ── Modal instrucciones ── */}
      {showModal && isIOS && (
        <IOSInstallModal onClose={() => setShowModal(false)} />
      )}
      {showModal && isAndroid && (
        <AndroidInstallModal onClose={() => setShowModal(false)} />
      )}
    </>
  )
}

/* ── Modal de instrucciones para Android ── */
function AndroidInstallModal({ onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000 }} />
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:1001,
        background:'#fff', borderRadius:'24px 24px 0 0', padding:'28px 24px 48px',
      }}>
        <p style={{ margin:'0 0 20px', fontSize:20, fontWeight:700, color:'#0D1240' }}>Instala Syng en Android</p>
        {[
          { n:'1', title:'Menú de Chrome', desc:'Toca los 3 puntos arriba a la derecha' },
          { n:'2', title:'Instalar app', desc:'Toca "Instalar app" o "Agregar a inicio"' },
          { n:'3', title:'Abre Syng', desc:'Usa el ícono en tu pantalla de inicio' },
        ].map(step => (
          <div key={step.n} style={{ display:'flex', gap:14, marginBottom:14, padding:'14px 16px', background:'rgba(61,79,168,0.04)', borderRadius:14 }}>
            <div style={{ minWidth:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#3D4FA8,#2D3A8C)', color:'#fff', fontSize:16, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{step.n}</div>
            <div>
              <p style={{ margin:'0 0 3px', fontSize:15, fontWeight:700, color:'#0D1240' }}>{step.title}</p>
              <p style={{ margin:0, fontSize:13, color:'rgba(13,18,64,0.5)' }}>{step.desc}</p>
            </div>
          </div>
        ))}
        <button onClick={onClose} style={{ width:'100%', minHeight:50, borderRadius:14, border:'none', background:'linear-gradient(135deg,#3D4FA8,#2D3A8C)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer' }}>
          Entendido
        </button>
      </div>
    </>
  )
}

/* ── Modal de instrucciones para iPhone ── */
function IOSInstallModal({ onClose }) {
  return (
    <>
      {/* Fondo oscuro */}
      <div
        onClick={onClose}
        style={{
          position:   'fixed',
          inset:      0,
          background: 'rgba(0,0,0,0.45)',
          zIndex:     1000,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet desde abajo */}
      <div style={{
        position:     'fixed',
        bottom:       0,
        left:         0,
        right:        0,
        zIndex:       1001,
        background:   '#fff',
        borderRadius: '24px 24px 0 0',
        padding:      '28px 24px 48px',
        boxShadow:    '0 -8px 40px rgba(13,18,64,0.18)',
      }}>

        {/* Handle */}
        <div style={{
          width:        40,
          height:       4,
          borderRadius: 2,
          background:   'rgba(13,18,64,0.15)',
          margin:       '0 auto 24px',
        }} />

        {/* Título */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0D1240' }}>
            Instala Syng en tu iPhone
          </p>
          <button
            onClick={onClose}
            style={{
              background:   'rgba(13,18,64,0.07)',
              border:       'none',
              borderRadius: '50%',
              width:        32,
              height:       32,
              fontSize:     16,
              cursor:       'pointer',
              color:        'rgba(13,18,64,0.5)',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
            }}
          >✕</button>
        </div>

        <p style={{ margin: '0 0 24px', fontSize: 13, color: 'rgba(13,18,64,0.45)' }}>
          Sigue estos 3 pasos en Safari
        </p>

        {/* Pasos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
          {[
            {
              n:    '1',
              icon: '⎋',
              title:'Toca Compartir',
              desc: 'El ícono de la flecha hacia arriba en la barra de Safari',
            },
            {
              n:    '2',
              icon: '＋',
              title:'Agregar a inicio',
              desc: 'Desplázate y toca "Agregar a pantalla de inicio"',
            },
            {
              n:    '3',
              icon: '🏠',
              title:'Abre Syng',
              desc: 'Toca el ícono de Syng en tu pantalla de inicio',
            },
          ].map(step => (
            <div key={step.n} style={{
              display:      'flex',
              alignItems:   'flex-start',
              gap:          14,
              background:   'rgba(61,79,168,0.04)',
              borderRadius: 14,
              padding:      '14px 16px',
              border:       '1px solid rgba(61,79,168,0.08)',
            }}>
              <div style={{
                minWidth:       36,
                height:         36,
                borderRadius:   '50%',
                background:     'linear-gradient(135deg, #3D4FA8, #2D3A8C)',
                color:          '#fff',
                fontSize:       16,
                fontWeight:     700,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                boxShadow:      '0 2px 8px rgba(45,58,140,0.25)',
              }}>
                {step.n}
              </div>
              <div>
                <p style={{ margin: '0 0 3px', fontSize: 15, fontWeight: 700, color: '#0D1240' }}>
                  {step.icon} {step.title}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(13,18,64,0.5)', lineHeight: 1.5 }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          style={{
            width:        '100%',
            minHeight:    50,
            borderRadius: 14,
            border:       '1.5px solid rgba(45,58,140,0.2)',
            background:   'rgba(45,58,140,0.05)',
            color:        '#2D3A8C',
            fontSize:     15,
            fontWeight:   700,
            cursor:       'pointer',
          }}
        >
          Entendido
        </button>
      </div>
    </>
  )
}

/* ── Spinner ── */
function Spinner() {
  return (
    <span style={{
      display:         'inline-block',
      width:           15,
      height:          15,
      border:          '2px solid rgba(255,255,255,0.35)',
      borderTopColor:  '#fff',
      borderRadius:    '50%',
      animation:       'spin 0.7s linear infinite',
    }} />
  )
}
