import { Link } from 'react-router-dom'
import { SyngLogo } from '../shared/SyngLogo'
import { A, L } from '../shared/agendaEditorial'

const FAQ = [
  {
    q: '¿Qué es Syng?',
    a: 'Syng es una app para organizar tareas del día, crear grupos (familia, roomies, equipo) y recibir avisos cuando alguien agrega o completa algo importante.',
  },
  {
    q: '¿Es gratis?',
    a: 'Sí puedes empezar gratis. Hay planes de pago opcionales para más movimientos y funciones avanzadas.',
  },
  {
    q: '¿Funciona en iPhone y Android?',
    a: 'Sí. Puedes usarla en el navegador (Safari o Chrome) e instalarla como app en tu pantalla de inicio. También hay versión Android.',
  },
  {
    q: '¿Puedo invitar a mi familia?',
    a: 'Sí. Crea un Pizarrón (grupo), comparte el enlace de invitación y todos ven las tareas del día en tiempo real.',
  },
  {
    q: '¿Syng lee mis mensajes o WhatsApp?',
    a: 'No. Syng solo guarda lo que tú escribes dentro de la app: tareas, grupos y recordatorios que tú creas.',
  },
]

export function QueEsSyngPage() {
  return (
    <div style={page}>
      <Link to="/" style={backLink}>← Inicio</Link>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <SyngLogo size="md" />
        <h1 style={{ ...A.sectionTitle, fontSize: 28, margin: '16px 0 8px' }}>Qué es Syng</h1>
        <p style={{ margin: 0, color: L.ivoryMuted, fontSize: 15, lineHeight: 1.6 }}>
          Preguntas frecuentes para conocer la app antes de registrarte.
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {FAQ.map(item => (
          <article key={item.q} style={card}>
            <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: L.ivory }}>{item.q}</h2>
            <p style={{ margin: 0, fontSize: 14, color: L.ivoryMuted, lineHeight: 1.6 }}>{item.a}</p>
          </article>
        ))}
      </div>

      <section id="privacidad" style={{ ...card, marginTop: 24, width: '100%', maxWidth: 520 }}>
        <h2 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 600, color: L.ivory }}>Privacidad</h2>
        <p style={{ margin: '0 0 10px', fontSize: 14, color: L.ivoryMuted, lineHeight: 1.6 }}>
          Tus datos viajan protegidos por conexión segura (HTTPS). La información de tus tareas
          se guarda en servidores de Google Firebase, con acceso limitado por tu cuenta.
        </p>
        <p style={{ margin: 0, fontSize: 14, color: L.ivoryMuted, lineHeight: 1.6 }}>
          Solo tú y las personas de tus grupos ven las tareas compartidas. Puedes eliminar tu cuenta
          contactando soporte desde la app.
        </p>
      </section>

      <Link to="/entrar" style={{ ...A.btnPrimary, display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 32, maxWidth: 320, width: '100%' }}>
        Crear cuenta o entrar
      </Link>
    </div>
  )
}

const page = {
  minHeight: '100%',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  background: L.ink,
  color: L.ivory,
  padding: 'max(24px, env(safe-area-inset-top)) 24px max(32px, env(safe-area-inset-bottom))',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}

const backLink = {
  alignSelf: 'flex-start',
  color: L.champagne,
  textDecoration: 'none',
  fontSize: 14,
  marginBottom: 16,
}

const card = {
  padding: '18px 20px',
  borderRadius: 2,
  border: `1px solid ${L.champagneBorder}`,
  background: L.champagneLight,
}
