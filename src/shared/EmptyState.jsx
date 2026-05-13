/**
 * Contextual empty state.
 * @param {{ title: string, description?: string, action?: React.ReactNode }} props
 */
export function EmptyState({ title, description, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', textAlign: 'center',
      gap: 12, color: '#9ca3af',
    }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M3 9h18M9 21V9" />
      </svg>
      <p style={{ margin: 0, fontWeight: 500, fontSize: 15, color: '#374151' }}>{title}</p>
      {description && (
        <p style={{ margin: 0, fontSize: 13, maxWidth: 280 }}>{description}</p>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}
