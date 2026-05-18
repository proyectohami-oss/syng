import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CoreDataProvider }  from './core/CoreDataProvider'
import { AuthGuard }         from './auth/AuthGuard'
import { InvitationChecker } from './auth/InvitationChecker'
import { AppShell }          from './shared/AppShell'
import { AgendaModule }      from './modules/agenda/AgendaModule'
import { NewTaskScreen }    from './modules/agenda/NewTaskScreen'
import { DayModule }         from './modules/agenda/DayModule'
import { PizarronModule }    from './modules/pizarron/PizarronModule'
import { GroupInfoScreen }      from './modules/pizarron/components/GroupInfoScreen'
import { NewGroupTaskScreen }  from './modules/pizarron/components/NewGroupTaskScreen'
import { PerfilModule }      from './modules/perfil/PerfilModule'
import { UnirseScreen }      from './modules/UnirseScreen'
import { Toast }             from './shared/Toast'
import { PizarronesModule }  from './modules/pizarrones/PizarronesModule'

const globalStyles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    height: 100%;
    touch-action: manipulation;
    overscroll-behavior: none;
    -webkit-user-select: none;
    user-select: text;
    -webkit-font-smoothing: antialiased;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    background: transparent;
    color: #111827;
  }

  input, textarea, [contenteditable] {
    -webkit-user-select: text;
    user-select: text;
  }

  #root {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100svh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
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

  .desktop-sidebar  { display: flex !important; }
  .mobile-bottom-nav { display: none !important; }

  @media (max-width: 640px) {
    .desktop-sidebar   { display: none !important; }
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

function AppWithViewport() {
  return (
    <BrowserRouter>
      <AuthGuard>
        <InvitationChecker>
          <AppShell>
            <Routes>
              <Route path="/"             element={<Navigate to="/agenda" replace />} />
              <Route path="/agenda"       element={<AgendaModule />} />
              <Route path="/agenda/:date" element={<DayModule />} />
              <Route path="/agenda/:date/nueva" element={<NewTaskScreen />} />
              <Route path="/pizarron/:id" element={<PizarronModule />} />
              <Route path="/pizarron/:id/info" element={<GroupInfoScreen />} />
              <Route path="/pizarron/:id/nueva/:date" element={<NewGroupTaskScreen />} />
              <Route path="/pizarron/:id/editar/:taskId" element={<NewGroupTaskScreen />} />
              <Route path="/pizarrones"   element={<PizarronesModule />} />
              <Route path="/super"        element={<Placeholder icon="🛒" label="Lista de Súper" />} />
              <Route path="/compartir"    element={<Placeholder icon="📤" label="Compartir" />} />
              <Route path="/perfil"       element={<PerfilModule />} />
              <Route path="/unirse"       element={<UnirseScreen />} />
            </Routes>
          </AppShell>
        </InvitationChecker>
      </AuthGuard>
    </BrowserRouter>
  )
}

export function App() {
  return (
    <>
      <style>{globalStyles}</style>
      <CoreDataProvider>
        <Toast />
        <AppWithViewport />
      </CoreDataProvider>
    </>
  )
}
