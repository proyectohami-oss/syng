export function EmptyState({ title, description, action, emoji }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '52px 32px', textAlign: 'center',
      gap: 0,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, marginBottom: 20,
        boxShadow: '0 2px 12px rgba(91,61,246,0.08)',
      }}>
        {emoji || '✨'}
      </div>
      <p style={{
        margin: '0 0 8px', fontWeight: 700, fontSize: 16, color: '#111',
        letterSpacing: '-0.01em',
      }}>
        {title}
      </p>
      {description && (
        <p style={{
          margin: '0 0 0', fontSize: 13.5, color: '#9CA3AF',
          maxWidth: 260, lineHeight: 1.55,
        }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: 24 }}>{action}</div>}
    </div>
  )
}
