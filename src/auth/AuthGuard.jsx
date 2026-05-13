import { useContext } from 'react'
import { CoreAuthContext } from '../core/CoreDataProvider'
import { AuthScreen } from './AuthScreen'

export function AuthGuard({ children }) {
  const auth = useContext(CoreAuthContext)

  // auth puede ser null si el contexto no está listo aún
  if (!auth || auth.loading) {
    return <LoadingScreen />
  }

  if (!auth.user) {
    return <AuthScreen />
  }

  return children
}

function LoadingScreen() {
  return (
    <div style={{
      height: '100%', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f9fafb',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '3px solid #e5e7eb',
        borderTopColor: '#5B3DF6',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  )
}
