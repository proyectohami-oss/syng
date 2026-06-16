import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCoreAuth } from '../core/hooks/useCoreData'
import { SyngLogo } from '../shared/SyngLogo'
import { A, L } from '../shared/agendaEditorial'

export function LandingPage() {
  const auth = useCoreAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (auth?.user && !auth.loading) {
      navigate('/agenda', { replace: true })
    }
  }, [auth?.user, auth?.loading, navigate])

  if (auth?.loading) {
    return (
      <div style={page}>
        <p style={{ color: L.ivoryMuted, fontSize: 14 }}>Cargando…</p>
      </div>
    )
  }

  if (auth?.user) return null

  return (
    <div style={page}>
      <header style={{ textAlign: 'center', marginBottom: 40 }}>
        <SyngLogo size="lg" />
        <p style={{ ...A.badge, marginTop: 20 }}>Organiza tu vida</p>
        <h1 style={{ ...A.sectionTitle, fontSize: 32, margin: '12px 0 16px', lineHeight: 1.2 }}>
          Tareas, grupos y recordatorios en un solo lugar
        </h1>
        <p style={{ margin: 0, fontSize: 16, color: L.ivoryMuted, lineHeight: 1.6, maxWidth: 420, marginInline: 'auto' }}>
          Syng ayuda a familias y equipos pequeños a coordinar pendientes del día a día,
          con avisos y pizarrones compartidos. Simple, claro y en español.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320, width: '100%', margin: '0 auto 32px' }}>
        <Link to="/entrar" style={ctaPrimary}>Empezar gratis</Link>
        <Link to="/que-es-syng" style={ctaSecondary}>Qué es Syng</Link>
      </div>

      <section style={featureGrid} aria-label="Funciones principales">
        {[
          { title: 'Mi Agenda', text: 'Tus tareas personales por día, con recordatorios.' },
          { title: 'Pizarrons', text: 'Grupos familiares o de trabajo: todos ven lo mismo.' },
          { title: 'Avisos', text: 'Entérate cuando alguien agrega o completa una tarea.' },
        ].map(f => (
          <div key={f.title} style={featureCard}>
            <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: L.champagne, letterSpacing: '0.08em' }}>{f.title}</p>
            <p style={{ margin: 0, fontSize: 14, color: L.ivoryMuted, lineHeight: 1.5 }}>{f.text}</p>
          </div>
        ))}
      </section>

      <footer style={{ marginTop: 48, textAlign: 'center', fontSize: 12, color: L.ivoryFaint }}>
        <p style={{ margin: '0 0 8px' }}>© Syng · syng-psi.vercel.app</p>
        <Link to="/que-es-syng#privacidad" style={{ color: L.champagne, textDecoration: 'none' }}>Privacidad</Link>
      </footer>
    </div>
  )
}

const page = {
  minHeight: '100%',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  background: L.ink,
  color: L.ivory,
  padding: 'max(32px, env(safe-area-inset-top)) 24px max(32px, env(safe-area-inset-bottom))',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
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

const featureGrid = {
  display: 'grid',
  gap: 12,
  width: '100%',
  maxWidth: 480,
}

const featureCard = {
  padding: '16px 18px',
  borderRadius: 2,
  border: `1px solid ${L.champagneBorder}`,
  background: L.champagneLight,
}
