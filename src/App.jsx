import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CoreDataProvider }  from './core/CoreDataProvider'
import { AuthGuard }         from './auth/AuthGuard'
import { InvitationChecker } from './auth/InvitationChecker'
import { AppShell }          from './shared/AppShell'
import { AgendaModule }      from './modules/agenda/AgendaModule'
import { DayModule }         from './modules/agenda/DayModule'
import { PizarronModule }    from './modules/pizarron/PizarronModule'

const globalStyles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html {
    /* Previene el zoom al enfocar inputs en iOS */
    touch-action: manipulation;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    background: #fff;
    color: #111827;
    -webkit-font-smoothing: antialiased;
    /* Previene selección de texto accidental al tocar */
    -webkit-user-select: none;
    user-select: none;
    /* Elimina delay de 300ms en clicks en móvil */
    touch-action: manipulation;
    overscroll-behavior: none;
  }

  /* Permitir selección en inputs y textareas */
  input, textarea, [contenteditable] {
    -webkit-user-select: text;
    user-select: text;
  }

  html, body, #root { height: 100%; }
  button, input, textarea, select { font-family: inherit; }

  /* Elimina el highlight azul al tocar en Android/iOS */
  * { -webkit-tap-highlight-color: transparent; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:0.35;} }

  :focus-visible {
    outline: 2px solid #5B3DF6;
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* ── Móvil (≤640px) ─────────────────────────────────────────── */
  @media (max-width: 640px) {
    /* Ocultar sidebar desktop */
    nav[aria-label="Navegación principal"] {
      display: none !important;
    }

    /* Mostrar barra inferior */
    nav[aria-label="Navegación móvil"] {
      display: flex !important;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      height: calc(60px + env(safe-area-inset-bottom));
      padding-bottom: env(safe-area-inset-bottom);
      background: #fff;
      border-top: 1px solid #f3f4f6;
      z-index: 200;
    }

    /* Espacio para que el contenido no quede detrás de la barra */
    main {
      padding-bottom: calc(60px + env(safe-area-inset-bottom));
    }

    /* Textos ligeramente más grandes en móvil para legibilidad */
    body {
      font-size: 16px;
    }
  }
`

function Placeholder({ icon, label }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      height:'100%', flexDirection:'column', gap:12,
    }}>
      <span style={{ fontSize:52 }}>{icon}</span>
      <span style={{ fontSize:17, fontWeight:500, color:'#374151' }}>{label}</span>
      <span style={{ fontSize:14, color:'#d1d5db' }}>Próximamente</span>
    </div>
  )
}

export function App() {
  return (
    <>
      <style>{globalStyles}</style>
      <CoreDataProvider>
        <BrowserRouter>
          <AuthGuard>
            <InvitationChecker>
              <AppShell>
                <Routes>
                  <Route path="/"             element={<Navigate to="/agenda" replace />} />
                  <Route path="/agenda"       element={<AgendaModule />} />
                  <Route path="/agenda/:date" element={<DayModule />} />
                  <Route path="/pizarron/:id" element={<PizarronModule />} />
                  <Route path="/pizarrones"   element={<Placeholder icon="📌" label="Pizarrones" />} />
                  <Route path="/super"        element={<Placeholder icon="🛒" label="Lista de Súper" />} />
                  <Route path="/compartir"    element={<Placeholder icon="🎁" label="Compartir" />} />
                  <Route path="/perfil"       element={<Placeholder icon="👤" label="Perfil" />} />
                </Routes>
              </AppShell>
            </InvitationChecker>
          </AuthGuard>
        </BrowserRouter>
      </CoreDataProvider>
    </>
  )
}
