import { Component } from 'react'

export class BootErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          background: '#0A0A0A',
          color: '#FAF8F5',
          fontFamily: '-apple-system, sans-serif',
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Syng no pudo cargar</p>
          <p style={{ margin: 0, fontSize: 14, color: '#C4A962', maxWidth: 320 }}>
            Cierra la app, ábrela de nuevo en Safari, o usa correo y contraseña.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8,
              padding: '12px 20px',
              border: '1px solid #FAF8F5',
              borderRadius: 2,
              background: '#FAF8F5',
              color: '#0A0A0A',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
