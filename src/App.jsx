import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { CoreDataProvider }  from './core/CoreDataProvider'
import { AuthGuard }         from './auth/AuthGuard'
import { FreeTierGate }      from './core/hooks/useFreeTierGuard'
import { InvitationChecker } from './auth/InvitationChecker'
import { AppShell }          from './shared/AppShell'
import { ShellChromeProvider } from './shared/ShellChromeContext'
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
import { NotificacionesModule } from './modules/notificaciones/NotificacionesModule'
import RecordatorioView from './pages/RecordatorioView'
import AvisoPreview from './pages/AvisoPreview'
import { ResumenDiarioScreen } from './modules/resumen/ResumenDiarioScreen'
import { BienvenidoDeVueltaScreen } from './modules/reenganche/BienvenidoDeVueltaScreen'
import { DeepLinkHandler } from './shared/DeepLinkHandler'
import { AliadosSyngModule } from './modules/aliados/AliadosSyngModule'

const globalStyles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    height: 100%;
    min-height: 100%;
    min-height: -webkit-fill-available;
    touch-action: manipulation;
    overscroll-behavior: none;
    -webkit-user-select: none;
    user-select: text;
    -webkit-font-smoothing: antialiased;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    background: #0A0A0A;
    color: #FAF8F5;
  }

  input, textarea, [contenteditable] {
    -webkit-user-select: text;
    user-select: text;
  }

  #root {
    position: fixed;
    inset: 0;
    width: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding:
      env(safe-area-inset-top)
      env(safe-area-inset-right)
      env(safe-area-inset-bottom)
      env(safe-area-inset-left);
  }

  button, input, textarea, select { font-family: inherit; }
  * { -webkit-tap-highlight-color: transparent; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:0.35;} }

  :focus-visible {
    outline: 2px solid #C4A962;
    outline-offset: 2px;
    border-radius: 2px;
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
      <DeepLinkHandler />
      <Routes>
        <Route path="/preview/aviso" element={<AvisoPreview />} />
        <Route path="*" element={
      <AuthGuard>
        <InvitationChecker>
          <FreeTierGate>
          <ShellChromeProvider>
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
              <Route path="/notificaciones" element={<NotificacionesModule />} />
              <Route path="/recordatorio/:taskId" element={<RecordatorioView />} />
              <Route path="/resumen-diario" element={<ResumenDiarioScreen />} />
              <Route path="/bienvenido-de-vuelta" element={<BienvenidoDeVueltaScreen />} />
              <Route path="/perfil"       element={<PerfilModule />} />
              <Route path="/aliados"     element={<AliadosSyngModule />} />
              <Route path="/unirse"       element={<UnirseScreen />} />
            </Routes>
          </AppShell>
          </ShellChromeProvider>
          </FreeTierGate>
        </InvitationChecker>
      </AuthGuard>
        } />
      </Routes>
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
