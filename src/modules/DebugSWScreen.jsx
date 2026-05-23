import { useState, useEffect } from 'react'

export function DebugSWScreen() {
  const [logs, setLogs] = useState([])

  const add = (text, color = '#0D1240') => {
    setLogs(prev => [...prev, { text, color, t: Date.now() }])
  }

  useEffect(() => {
    async function check() {
      add('— ENTORNO —')
      add('serviceWorker API: ' + ('serviceWorker' in navigator))
      add('standalone: ' + (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone))
      add('userAgent: ' + navigator.userAgent.slice(0, 80))

      if (!('serviceWorker' in navigator)) {
        add('❌ SW no soportado', 'red')
        return
      }

      const reg = await navigator.serviceWorker.getRegistration('/')
      if (!reg) {
        add('❌ No hay SW registrado en /', 'red')
        return
      }

      add('— REGISTRO —')
      add('✅ scope: ' + reg.scope, 'green')
      add('active:     ' + (reg.active?.scriptURL ?? 'ninguno'))
      add('installing: ' + (reg.installing?.scriptURL ?? 'ninguno'))
      add('waiting:    ' + (reg.waiting?.scriptURL ?? 'ninguno'))
      add('controller: ' + (navigator.serviceWorker.controller?.scriptURL ?? 'ninguno'))

      add('— ESTADOS —')
      add('active.state:  ' + (reg.active?.state ?? 'n/a'))
      add('waiting.state: ' + (reg.waiting?.state ?? 'n/a'))

      add('— SKIP_WAITING —')
      if (reg.waiting) {
        add('⚠️ Hay SW waiting — enviando SKIP_WAITING...', 'orange')
        reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        add('mensaje enviado')
      } else {
        add('no hay SW waiting')
      }

      add('— UPDATE —')
      await reg.update()
      add('reg.update() ejecutado')
      add('waiting post-update: ' + (reg.waiting?.scriptURL ?? 'ninguno'))

      add('— CONTROLLERCHANGE —')
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        add('🔄 controllerchange disparado!', 'blue')
      })
      add('escuchando controllerchange...')
    }

    check().catch(e => setLogs(prev => [...prev, { text: 'ERROR: ' + e.message, color: 'red' }]))
  }, [])

  return (
    <div style={{ padding: 16, background: '#fff', minHeight: '100%', overflowY: 'auto' }}>
      <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>SW Debug — App Instalada</p>
      {logs.map((l, i) => (
        <p key={i} style={{ margin: '2px 0', fontSize: 11, fontFamily: 'monospace', color: l.color, lineHeight: 1.6 }}>
          {l.text}
        </p>
      ))}
    </div>
  )
}
