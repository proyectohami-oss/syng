import { useSyncStatus } from '../core/hooks/useSyncStatus'

const styles = {
  online:  { dot: '#22c55e', text: '#6b7280' },
  syncing: { dot: '#f59e0b', text: '#6b7280' },
  cached:  { dot: '#f59e0b', text: '#6b7280' },
  offline: { dot: '#ef4444', text: '#ef4444' },
}

export function SyncBadge() {
  const { status, label } = useSyncStatus()
  const { dot, text }     = styles[status]

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: text }}>
      <span
        style={{
          width: 7, height: 7,
          borderRadius: '50%',
          background: dot,
          display: 'inline-block',
          ...(status === 'syncing' ? { animation: 'pulse 1.2s ease-in-out infinite' } : {}),
        }}
      />
      {label}
    </span>
  )
}
