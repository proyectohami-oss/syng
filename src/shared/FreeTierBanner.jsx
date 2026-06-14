import { useNavigate } from 'react-router-dom'
import { useFreeTierBlocked } from '../core/hooks/useFreeTierGuard'

/** Barra fija cuando el plan Gratis está agotado. */
export function FreeTierBanner() {
  const navigate = useNavigate()
  const blocked  = useFreeTierBlocked()

  if (!blocked) return null

  return (
    <button
      type="button"
      onClick={() => navigate('/perfil')}
      style={{
        flexShrink: 0,
        width: '100%',
        padding: '10px 16px',
        border: 'none',
        borderBottom: '1px solid rgba(224,82,82,0.35)',
        background: 'rgba(224,82,82,0.12)',
        color: '#E05252',
        fontSize: 12,
        fontWeight: 500,
        textAlign: 'center',
        cursor: 'pointer',
        letterSpacing: '0.02em',
        lineHeight: 1.45,
      }}
    >
      Plan Gratis agotado — tus datos se conservan. Toca aquí para elegir un plan.
    </button>
  )
}
