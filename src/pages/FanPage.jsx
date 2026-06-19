import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCoreAuth } from '../core/hooks/useCoreData'
import { SyngLogo } from '../shared/SyngLogo'
import { usePageMeta } from '../shared/usePageMeta'
import { A, L } from '../shared/agendaEditorial'
import { LuxuryKeyframes } from '../shared/avisoLuxury'
import { useSiteContent } from '../hooks/useSiteContent'
import { buildWhatsAppShareUrl } from '../core/services/siteContent.service'
import { MorningRitualGame } from './fan/MorningRitualGame'

export function FanPage() {
  const auth = useCoreAuth()
  const navigate = useNavigate()
  const { content, loading } = useSiteContent()
  const [ritualDone, setRitualDone] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  usePageMeta({
    title: 'Syng — Ritual de personas exitosas',
    description: content.fan_hero_subtitle,
    path: '/fan',
  })

  useEffect(() => {
    if (auth?.user && !auth.loading) {
      navigate('/agenda', { replace: true })
    }
  }, [auth?.user, auth.loading, navigate])

  if (auth?.user) return null

  function sharePromo(promo) {
    const url = buildWhatsAppShareUrl({
      titulo: promo.titulo,
      texto: promo.texto,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function copyPromo(promo) {
    const text = [promo.titulo, promo.texto, 'https://syng-psi.vercel.app/fan'].filter(Boolean).join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(promo.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      sharePromo(promo)
    }
  }

  return (
    <div style={page}>
      <LuxuryKeyframes />
      <style>{fanCss}</style>

      <div className="fan-float-bg" aria-hidden>
        {[...Array(8)].map((_, i) => (
          <span key={i} className="fan-orb" style={{ '--i': i }} />
        ))}
      </div>

      <header style={header}>
        <Link to="/" style={logoLink} aria-label="Syng inicio">
          <SyngLogo size="md" />
        </Link>
        <Link to="/entrar" style={headerCta}>Entrar</Link>
      </header>

      <section style={hero}>
        <p style={A.badge}>{content.fan_hero_title}</p>
        <h1 style={heroTitle}>Organiza tu éxito, un día a la vez</h1>
        <p style={heroSub}>{content.fan_hero_subtitle}</p>
      </section>

      {!loading && (
        <MorningRitualGame
          legend={content.legend}
          onComplete={() => setRitualDone(true)}
        />
      )}

      {ritualDone && (
        <div className="fan-step-in" style={ctaBlock}>
          <Link to="/entrar" style={ctaPrimary}>Empezar gratis en Syng</Link>
          <Link to="/que-es-syng" style={ctaSecondary}>Conocer más</Link>
        </div>
      )}

      <section style={legendSection} aria-label="Leyenda">
        <div style={legendDivider} />
        <blockquote style={legendBlock}>
          <p style={legendMark} aria-hidden>✦</p>
          <p style={legendText}>{content.legend}</p>
        </blockquote>
      </section>

      {content.promociones.length > 0 && (
        <section style={promoSection} aria-label="Promociones">
          <h2 style={sectionTitle}>Promociones</h2>
          <p style={sectionSub}>Comparte con tus grupos de WhatsApp</p>
          <div style={promoGrid}>
            {content.promociones.map(promo => (
              <article key={promo.id} style={promoCard}>
                {promo.titulo && (
                  <h3 style={promoTitle}>{promo.titulo}</h3>
                )}
                <p style={promoText}>{promo.texto}</p>
                <div style={promoActions}>
                  <button type="button" style={waBtn} onClick={() => sharePromo(promo)}>
                    Compartir en WhatsApp
                  </button>
                  <button type="button" style={copyBtn} onClick={() => copyPromo(promo)}>
                    {copiedId === promo.id ? 'Copiado' : 'Copiar texto'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section style={featuresSection}>
        <h2 style={sectionTitle}>Por qué Syng</h2>
        <div style={featureGrid}>
          {[
            { title: 'Claridad matutina', text: 'Tu agenda lista antes de que el día te arrastre.' },
            { title: 'Familia alineada', text: 'Pizarrons compartidos — todos ven lo mismo.' },
            { title: 'Avisos a tiempo', text: 'Recordatorios que sí llegan cuando importa.' },
          ].map(f => (
            <div key={f.title} style={featureCard}>
              <p style={featureLabel}>{f.title}</p>
              <p style={featureText}>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={footer}>
        <Link to="/" style={footerLink}>Inicio</Link>
        <span style={{ color: L.ivoryFaint }}> · </span>
        <Link to="/que-es-syng" style={footerLink}>Qué es Syng</Link>
        <p style={{ margin: '12px 0 0', fontSize: 12, color: L.ivoryFaint }}>© Syng · syng-psi.vercel.app/fan</p>
      </footer>
    </div>
  )
}

const fanCss = `
@keyframes fanGlowPulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}
@keyframes fanStepIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fanSparkle {
  0% { opacity: 0; transform: scale(0) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(180deg); }
  100% { opacity: 0; transform: scale(0.3) rotate(360deg); }
}
@keyframes fanSunIdle {
  0%, 100% { box-shadow: 0 0 24px rgba(196,169,98,0.35); transform: scale(1); }
  50% { box-shadow: 0 0 40px rgba(196,169,98,0.55); transform: scale(1.04); }
}
@keyframes fanSunBurst {
  0% { transform: scale(1); box-shadow: 0 0 24px rgba(196,169,98,0.4); }
  50% { transform: scale(1.2); box-shadow: 0 0 60px rgba(196,169,98,0.8); }
  100% { transform: scale(1.05); box-shadow: 0 0 36px rgba(196,169,98,0.5); }
}
@keyframes fanOrbDrift {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.15; }
  50% { transform: translate(12px, -18px) scale(1.1); opacity: 0.35; }
}
.fan-step-in { animation: fanStepIn 0.65s ease-out both; }
.fan-done { animation: fanStepIn 0.8s ease-out both; }
.fan-sparkle {
  position: absolute;
  border-radius: 50%;
  background: #C4A962;
  pointer-events: none;
  animation: fanSparkle 1.2s ease-out forwards;
}
.fan-sun-idle { animation: fanSunIdle 2.5s ease-in-out infinite; }
.fan-sun-burst { animation: fanSunBurst 0.7s ease-out forwards; }
.fan-float-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.fan-orb {
  position: absolute;
  width: calc(80px + var(--i) * 20px);
  height: calc(80px + var(--i) * 20px);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(196,169,98,0.12), transparent 70%);
  left: calc(var(--i) * 11%);
  top: calc(10% + var(--i) * 8%);
  animation: fanOrbDrift calc(6s + var(--i) * 0.8s) ease-in-out infinite;
  animation-delay: calc(var(--i) * -0.5s);
}
`

const page = {
  position: 'relative',
  minHeight: '100%',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  background: L.ink,
  color: L.ivory,
  padding: 'max(20px, env(safe-area-inset-top)) 20px max(40px, env(safe-area-inset-bottom))',
  zIndex: 1,
}

const header = {
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  maxWidth: 560,
  margin: '0 auto 32px',
}

const logoLink = { textDecoration: 'none', color: 'inherit' }

const headerCta = {
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: L.champagne,
  textDecoration: 'none',
  padding: '8px 14px',
  border: `1px solid ${L.champagneBorder}`,
  borderRadius: 2,
}

const hero = {
  position: 'relative',
  zIndex: 2,
  textAlign: 'center',
  maxWidth: 520,
  margin: '0 auto 28px',
}

const heroTitle = {
  ...A.sectionTitle,
  fontFamily: L.serif,
  fontSize: 34,
  margin: '10px 0 14px',
  lineHeight: 1.15,
}

const heroSub = {
  margin: 0,
  fontSize: 16,
  color: L.ivoryMuted,
  lineHeight: 1.6,
}

const ctaBlock = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  maxWidth: 320,
  margin: '24px auto 0',
  position: 'relative',
  zIndex: 2,
}

const ctaPrimary = {
  ...A.btnPrimary,
  display: 'block',
  textAlign: 'center',
  textDecoration: 'none',
  padding: '14px 20px',
  fontSize: 15,
}

const ctaSecondary = {
  ...A.btnSecondary,
  display: 'block',
  textAlign: 'center',
  textDecoration: 'none',
  padding: '14px 20px',
  fontSize: 15,
}

const legendSection = {
  position: 'relative',
  zIndex: 2,
  maxWidth: 520,
  margin: '48px auto 0',
  textAlign: 'center',
}

const legendDivider = {
  width: 64,
  height: 1,
  margin: '0 auto 24px',
  background: `linear-gradient(90deg, transparent, ${L.champagne}, transparent)`,
}

const legendBlock = { margin: 0, padding: 0, border: 'none' }

const legendMark = {
  margin: '0 0 12px',
  fontSize: 18,
  color: L.champagne,
}

const legendText = {
  margin: 0,
  fontFamily: L.serif,
  fontSize: 20,
  fontStyle: 'italic',
  lineHeight: 1.55,
  color: L.ivory,
}

const promoSection = {
  position: 'relative',
  zIndex: 2,
  maxWidth: 520,
  margin: '48px auto 0',
}

const sectionTitle = {
  margin: '0 0 6px',
  fontFamily: L.serif,
  fontSize: 24,
  fontWeight: 400,
  textAlign: 'center',
}

const sectionSub = {
  margin: '0 0 20px',
  fontSize: 13,
  color: L.ivoryMuted,
  textAlign: 'center',
}

const promoGrid = { display: 'flex', flexDirection: 'column', gap: 14 }

const promoCard = {
  padding: '18px 20px',
  borderRadius: 2,
  border: `1px solid ${L.champagneBorder}`,
  background: L.champagneLight,
}

const promoTitle = {
  margin: '0 0 8px',
  fontSize: 15,
  fontWeight: 600,
  color: L.champagne,
  letterSpacing: '0.04em',
}

const promoText = {
  margin: '0 0 14px',
  fontSize: 14,
  color: L.ivoryMuted,
  lineHeight: 1.55,
  whiteSpace: 'pre-wrap',
}

const promoActions = { display: 'flex', flexDirection: 'column', gap: 8 }

const waBtn = {
  padding: '12px 16px',
  fontSize: 13,
  fontWeight: 600,
  color: '#fff',
  background: '#25D366',
  border: 'none',
  borderRadius: 2,
  cursor: 'pointer',
}

const copyBtn = {
  padding: '10px 16px',
  fontSize: 12,
  fontWeight: 600,
  color: L.champagne,
  background: 'transparent',
  border: `1px solid ${L.champagneBorder}`,
  borderRadius: 2,
  cursor: 'pointer',
}

const featuresSection = {
  position: 'relative',
  zIndex: 2,
  maxWidth: 520,
  margin: '48px auto 0',
}

const featureGrid = { display: 'grid', gap: 12 }

const featureCard = {
  padding: '16px 18px',
  borderRadius: 2,
  border: `1px solid ${L.champagneBorder}`,
  background: 'rgba(20,20,20,0.6)',
}

const featureLabel = {
  margin: '0 0 6px',
  fontSize: 12,
  fontWeight: 600,
  color: L.champagne,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const featureText = {
  margin: 0,
  fontSize: 14,
  color: L.ivoryMuted,
  lineHeight: 1.5,
}

const footer = {
  position: 'relative',
  zIndex: 2,
  marginTop: 56,
  textAlign: 'center',
}

const footerLink = {
  fontSize: 13,
  color: L.champagne,
  textDecoration: 'none',
}
