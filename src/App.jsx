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
    touch-action: manipulation;
    /* Use dynamic viewport height — prevents iOS address bar issues */
    height: 100%;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    background: #fff;
    color: #111827;
    -webkit-font-smoothing: antialiased;
    -webkit-user-select: none;
    user-select: none;
    touch-action: manipulation;
    overscroll-behavior: none;
    height: 100%;
  }

  input, textarea, [contenteditable] {
    -webkit-user-select: text;
    user-select: text;
  }

  #root {
    height: 100%;
    /* dvh = dynamic viewport height, accounts for iOS address bar */
    height: 100dvh;
  }

  button, input, textarea, select { font-family: inherit; }
  * { -webkit-tap-highlight-color: transparent; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:0.35;} }

  :focus-visible {
    outline: 2px solid #5B3DF6;
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* ── Desktop: show sidebar, hide mobile nav ─────────────────── */
  .desktop-sidebar { display: flex; }
  .mobile-bottom-nav { display: none; }

  /* ── Mobile (≤640px): hide sidebar, show mobile nav ────────── */
  @media (max-width: 640px) {
    .desktop-sidebar { display: none !important; }
    .mobile-bottom-nav { display: flex !important; }

    body { font-size: 16px; }
  }
`

function Placeholder({ icon, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:12 }}>
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
                  <Route path="/compartir"    element={<Placeholder icon="📤" label="Compartir" />} />
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
