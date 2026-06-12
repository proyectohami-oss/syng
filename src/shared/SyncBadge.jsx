import { useSyncStatus } from '../core/hooks/useSyncStatus'
import { L } from './agendaEditorial'

const styles = {
  online:  { dot: '#6ee7a0', text: L.ivoryMuted },
  syncing: { dot: L.champagne, text: L.ivoryMuted },
  cached:  { dot: L.champagne, text: L.ivoryMuted },
  offline: { dot: '#f87171', text: '#fca5a5' },
}

const stylesLight = {
  online:  { dot: '#22c55e', text: '#6b7280' },
  syncing: { dot: '#f59e0b', text: '#6b7280' },
  cached:  { dot: '#f59e0b', text: '#6b7280' },
  offline: { dot: '#ef4444', text: '#ef4444' },
}

export function SyncBadge({ dark = false }) {
  const { status, label } = useSyncStatus()
  const palette = dark ? styles : stylesLight
  const { dot, text } = palette[status]

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: text, letterSpacing: '0.06em' }}>
      <span
        style={{
          width: 7, height: 7,
          borderRadius: dark ? 2 : '50%',
          background: dot,
          display: 'inline-block',
          ...(status === 'syncing' ? { animation: 'pulse 1.2s ease-in-out infinite' } : {}),
        }}
      />
      {label}
    </span>
  )
}
