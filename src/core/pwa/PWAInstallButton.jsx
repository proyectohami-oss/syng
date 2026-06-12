/**
 * PWAInstallButton — botón de instalación PWA para Android e iOS.
 */
import { useState } from 'react'
import { usePWAInstall } from './usePWAInstall'
import { L } from '../../shared/agendaEditorial'
import { SyngMark } from '../../shared/SyngLogo'

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.72)',
  zIndex: 1000,
}

const sheet = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 1001,
  background: L.inkSoft,
  borderRadius: '2px 2px 0 0',
  padding: '20px 22px max(36px, calc(env(safe-area-inset-bottom) + 24px))',
  borderTop: `1px solid ${L.champagneBorder}`,
  boxShadow: '0 -12px 48px rgba(0,0,0,0.55)',
  color: L.ivory,
}

const handle = {
  width: 36,
  height: 3,
  borderRadius: 1,
  background: L.champagneBorder,
  margin: '0 auto 20px',
}

const stepCard = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 14,
  background: L.champagneLight,
  borderRadius: 2,
  padding: '14px 16px',
  border: `1px solid ${L.champagneBorder}`,
}

const stepNum = {
  minWidth: 32,
  height: 32,
  borderRadius: 2,
  background: L.champagne,
  color: L.ink,
  fontSize: 14,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const btnPrimary = {
  width: '100%',
  minHeight: 48,
  borderRadius: 2,
  border: `1px solid ${L.ivory}`,
  background: L.ivory,
  color: L.ink,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}

const btnClose = {
  background: 'transparent',
  border: `1px solid ${L.champagneBorder}`,
  borderRadius: 2,
  width: 32,
  height: 32,
  fontSize: 14,
  cursor: 'pointer',
  color: L.ivoryMuted,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export function PWAInstallButton() {
  const { canInstall, isIOS, isAndroid, isInstalled, installing, triggerInstall, hasNativePrompt } = usePWAInstall()
  const [showModal, setShowModal] = useState(false)

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
      <style>{`@keyframes syngSpin{to{transform:rotate(360deg)}}`}</style>
      <button
        onClick={handlePress}
        disabled={installing}
        style={{
          width: '100%',
          minHeight: 48,
          borderRadius: 2,
          border: `1px solid ${L.ivory}`,
          background: installing ? L.champagneLight : L.ivory,
          color: L.ink,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.08em',
          cursor: installing ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          opacity: installing ? 0.7 : 1,
        }}
      >
        {installing ? (
          <><Spinner /> Instalando…</>
        ) : (
          <>
            <SyngMark size={22} style={{ border: 'none', background: L.ink }} />
            <span>Instalar Syng</span>
            <span style={{
              background: L.champagneLight,
              border: `1px solid ${L.champagneBorder}`,
              borderRadius: 2,
              padding: '2px 8px',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: L.champagne,
            }}>Gratis</span>
          </>
        )}
      </button>

      {showModal && isIOS && (
        <IOSInstallModal onClose={() => setShowModal(false)} />
      )}
      {showModal && isAndroid && (
        <AndroidInstallModal onClose={() => setShowModal(false)} />
      )}
    </>
  )
}

function InstallSteps({ steps, onClose, title, subtitle }) {
  return (
    <>
      <div onClick={onClose} style={overlay} />
      <div style={sheet}>
        <div style={handle} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
          <SyngMark size={40} style={{ border: 'none', marginBottom: 12 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 400, color: L.ivory, fontFamily: L.serif, letterSpacing: '-0.02em' }}>
              {title}
            </p>
            <button type="button" onClick={onClose} style={btnClose}>✕</button>
          </div>
          {subtitle && (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: L.ivoryMuted, width: '100%' }}>
              {subtitle}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {steps.map(step => (
            <div key={step.n} style={stepCard}>
              <div style={stepNum}>{step.n}</div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 500, color: L.ivory, fontFamily: L.serif }}>
                  {step.title}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: L.ivoryMuted, lineHeight: 1.5 }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={onClose} style={btnPrimary}>
          Entendido
        </button>
      </div>
    </>
  )
}

function AndroidInstallModal({ onClose }) {
  return (
    <InstallSteps
      onClose={onClose}
      title="Instala Syng en Android"
      subtitle="Sigue estos 3 pasos en Chrome"
      steps={[
        { n: '1', title: 'Menú de Chrome', desc: 'Toca los 3 puntos arriba a la derecha' },
        { n: '2', title: 'Instalar app', desc: 'Toca "Instalar app" o "Agregar a inicio"' },
        { n: '3', title: 'Abre Syng', desc: 'Usa el ícono en tu pantalla de inicio' },
      ]}
    />
  )
}

function IOSInstallModal({ onClose }) {
  return (
    <InstallSteps
      onClose={onClose}
      title="Instala Syng en tu iPhone"
      subtitle="Sigue estos 3 pasos en Safari"
      steps={[
        { n: '1', title: 'Toca Compartir', desc: 'El ícono de la flecha hacia arriba en la barra de Safari' },
        { n: '2', title: 'Agregar a inicio', desc: 'Desplázate y toca "Agregar a pantalla de inicio"' },
        { n: '3', title: 'Abre Syng', desc: 'Toca el ícono de Syng en tu pantalla de inicio' },
      ]}
    />
  )
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block',
      width: 14,
      height: 14,
      border: `2px solid ${L.champagneBorder}`,
      borderTopColor: L.ink,
      borderRadius: '50%',
      animation: 'syngSpin 0.7s linear infinite',
    }} />
  )
}
