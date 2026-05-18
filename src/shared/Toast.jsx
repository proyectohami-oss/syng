import { useState, useEffect } from 'react'

let _show = null

export function Toast() {
  const [msg,     setMsg]     = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    _show = (text, emoji = '✨') => {
      setMsg({ text, emoji })
      setVisible(true)
      setTimeout(() => setVisible(false), 2800)
      setTimeout(() => setMsg(null), 3200)
    }
    return () => { _show = null }
  }, [])

  if (!msg) return null

  return (
    <div style={{
      position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, pointerEvents: 'none',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(17,17,17,0.88)', backdropFilter: 'blur(12px)',
        color: '#fff', borderRadius: 20, padding: '8px 16px',
        fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
      }}>
        <span style={{ fontSize: 15 }}>{msg.emoji}</span>
        <span>{msg.text}</span>
      </div>
    </div>
  )
}

export function showToast(text, emoji) {
  _show?.(text, emoji)
}
