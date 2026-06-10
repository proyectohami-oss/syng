/**
 * AuthScreen — login and signup.
 */
import { useState, useEffect } from 'react'
import { useAuthActions, isStandalonePwa } from './useAuthActions'

export function AuthScreen() {
  const { beginGoogleSignIn, signInWithEmail, signUpWithEmail } = useAuthActions()

  const [mode,        setMode]        = useState('login')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading,     setLoading]     = useState(null)
  const [error,       setError]       = useState(null)

  function clearError() { setError(null) }

  useEffect(() => {
    const code = sessionStorage.getItem('authRedirectError')
    if (code) {
      sessionStorage.removeItem('authRedirectError')
      setError(friendlyError(code))
    }
  }, [])

  function friendlyError(code) {
    const map = {
      'auth/invalid-credential':     'Correo o contraseña incorrectos.',
      'auth/user-not-found':         'No existe una cuenta con ese correo.',
      'auth/wrong-password':         'Contraseña incorrecta.',
      'auth/email-already-in-use':   'Ya existe una cuenta con ese correo.',
      'auth/weak-password':          'La contraseña debe tener al menos 6 caracteres.',
      'auth/invalid-email':          'El correo no es válido.',
      'auth/popup-closed-by-user':   'Se cerró la ventana de Google antes de completar el acceso.',
      'auth/popup-blocked':          'No se pudo abrir Google. Cierra la app y ábrela desde Safari.',
      'auth/unauthorized-domain':    'Dominio no autorizado. Contacta soporte.',
      'auth/network-request-failed': 'Sin conexión. Verifica tu red e intenta de nuevo.',
      'auth/too-many-requests':      'Demasiados intentos. Intenta más tarde.',
      'auth/account-exists-with-different-credential': 'Ya tienes cuenta con otro método. Usa correo y contraseña.',
      'auth/web-storage-unsupported': 'Activa cookies/datos del sitio en Ajustes → Safari.',
      'access_denied':                 'Acceso cancelado. Intenta de nuevo.',
      'redirect_failed':               'Safari bloqueó el acceso. Ve a Ajustes → Safari → desactiva "Evitar rastreo entre sitios" e intenta otra vez.',
    }
    if (code?.includes('Unable to process')) {
      return 'Safari bloqueó Google. Usa correo y contraseña, o abre syng-psi.vercel.app en una ventana normal de Safari.'
    }
    return map[code] ?? 'Ocurrió un error. Intenta de nuevo.'
  }

  function handleGoogle() {
    setLoading('google')
    setError(null)
    // Llamada síncrona — iOS Safari bloquea popup si hay await antes
    beginGoogleSignIn()
      .then((result) => {
        if (!result?.redirected) setLoading(null)
      })
      .catch((err) => {
        setError(friendlyError(err.code || err.message))
        setLoading(null)
      })
  }

  async function handleEmailSubmit(e) {
    e.preventDefault(); setLoading('email'); setError(null)
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password)
      } else {
        if (!displayName.trim()) { setError('Ingresa tu nombre.'); setLoading(null); return }
        await signUpWithEmail(email, password, displayName)
      }
    } catch (err) { setError(friendlyError(err.code)) }
    finally { setLoading(null) }
  }

  const isLoading = loading !== null
  const isPwa     = isStandalonePwa()

  return (
    <div style={screen}>
      <div style={card}>

        {isPwa && (
          <p style={pwaHint}>
            App instalada: si Google falla, usa <strong>correo y contraseña</strong> abajo.
          </p>
        )}

        <div style={{ textAlign:'center', marginBottom: isPwa ? 24 : 36 }}>
          <div style={logoWrap}>
            <div style={logoMark}>
              <img src='/icon-192.png' alt='Syng' style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:18 }} />
            </div>
          </div>
          {/* Tipografía: 28px/700, color sistema */}
          <h1 style={{ margin:'18px 0 6px', fontSize:28, fontWeight:700, color:'#0D1240', letterSpacing:'-0.03em' }}>
            Syng
          </h1>
          <p style={{ margin:0, fontSize:14, color:'#5B6480', lineHeight:1.5, fontWeight:400 }}>
            Todo lo importante, en sincronía.
          </p>
        </div>

        <button onClick={handleGoogle} disabled={isLoading} style={googleBtn}>
          {loading === 'google' ? <Spinner /> : <GoogleIcon />}
          {loading === 'google' ? 'Conectando...' : 'Continuar con Google'}
        </button>

        <div style={divider}>
          <span style={dividerLine} />
          <span style={{ padding:'0 14px', fontSize:12, color:'#C8CEDD', flexShrink:0 }}>o</span>
          <span style={dividerLine} />
        </div>

        <form onSubmit={handleEmailSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {mode === 'signup' && (
            <div>
              <label style={lbl} htmlFor="auth-name">Nombre completo</label>
              <input id="auth-name" type="text" value={displayName}
                onChange={e => { setDisplayName(e.target.value); clearError() }}
                placeholder="Tu nombre" autoComplete="name" required={mode==='signup'} style={inp} />
            </div>
          )}
          <div>
            <label style={lbl} htmlFor="auth-email">Correo electrónico</label>
            <input id="auth-email" type="email" value={email}
              onChange={e => { setEmail(e.target.value); clearError() }}
              placeholder="correo@ejemplo.com" autoComplete="email" required style={inp} />
          </div>
          <div>
            <label style={lbl} htmlFor="auth-password">Contraseña</label>
            <input id="auth-password" type="password" value={password}
              onChange={e => { setPassword(e.target.value); clearError() }}
              placeholder={mode==='signup' ? 'Mínimo 6 caracteres' : '••••••••'}
              autoComplete={mode==='login' ? 'current-password' : 'new-password'}
              required minLength={mode==='signup' ? 6 : undefined} style={inp} />
          </div>

          {error && <p style={errorMsg}>{error}</p>}

          <button type="submit" disabled={isLoading} style={submitBtn}>
            {loading === 'email' ? <Spinner light /> : null}
            {loading === 'email'
              ? (mode==='login' ? 'Entrando...' : 'Creando cuenta...')
              : (mode==='login' ? 'Entrar' : 'Crear cuenta')}
          </button>
        </form>

        <p style={{ textAlign:'center', fontSize:13, color:'#5B6480', marginTop:24 }}>
          {mode==='login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button onClick={() => { setMode(mode==='login' ? 'signup' : 'login'); clearError() }}
            style={toggleBtn} disabled={isLoading}>
            {mode==='login' ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </p>

      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function Spinner({ light }) {
  return (
    <span style={{
      width:16, height:16, borderRadius:'50%',
      border: `2px solid ${light ? 'rgba(255,255,255,0.30)' : '#E8EBF4'}`,
      borderTopColor: light ? '#fff' : '#2D3A8C',
      display:'inline-block', animation:'spin 0.7s linear infinite',
    }} />
  )
}

// ── Estilos ─────────────────────────────────────────────────────────────────

const screen = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 20px',
  background: 'linear-gradient(158deg, #F7F8FC 0%, #EEF1F8 100%)',
}

const pwaHint = {
  margin: '0 0 20px',
  padding: '10px 14px',
  background: '#EEF2FF',
  color: '#2D3A8C',
  borderRadius: 12,
  fontSize: 13,
  lineHeight: 1.5,
  border: '1px solid rgba(45,58,140,0.12)',
}

const card = {
  width: '100%',
  maxWidth: 380,
  background: '#FFFFFF',
  borderRadius: 24,
  padding: '40px 32px 32px',
  /* Sombra sistema — tono índigo, no púrpura */
  boxShadow: [
    '0 2px 4px rgba(13,18,64,0.04)',
    '0 8px 32px rgba(13,18,64,0.08)',
    'inset 0 1px 0 rgba(255,255,255,0.90)',
  ].join(', '),
}

const logoWrap = { display: 'inline-flex' }

const logoMark = {
  width: 64,
  height: 64,
  borderRadius: 18,
  overflow: 'hidden',
  display: 'flex',
  background: '#0D1240',
  /* Sombra logo — índigo */
  boxShadow: '0 4px 16px rgba(13,18,64,0.22)',
}

const googleBtn = {
  width: '100%',
  padding: '13px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  border: '1.5px solid #E8EBF4',
  borderRadius: 14,
  background: '#FAFBFE',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
  color: '#0D1240',
  boxShadow: '0 1px 4px rgba(13,18,64,0.05)',
  transition: 'background 0.15s',
}

const divider     = { display: 'flex', alignItems: 'center', margin: '22px 0' }
const dividerLine = { flex: 1, height: 1, background: '#EEF1F8' }

const lbl = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#5B6480',
  marginBottom: 6,
  letterSpacing: '0.02em',
}

const inp = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1.5px solid #E8EBF4',
  fontSize: 15,
  color: '#0D1240',
  outline: 'none',
  fontFamily: 'inherit',
  background: '#FAFBFE',
  boxShadow: 'inset 0 1px 3px rgba(13,18,64,0.04)',
  transition: 'border-color 0.15s',
}

const errorMsg = {
  margin: 0,
  padding: '10px 14px',
  background: '#FFF1F1',
  color: '#C0392B',
  borderRadius: 12,
  fontSize: 13,
  lineHeight: 1.5,
  border: '1px solid #FEE2E2',
}

const submitBtn = {
  width: '100%',
  padding: '14px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  border: 'none',
  borderRadius: 14,
  /* Gradiente índigo — sistema Syng */
  background: 'linear-gradient(135deg, #3D4FA8 0%, #2D3A8C 100%)',
  color: '#fff',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  /* Sombra con tono de marca */
  boxShadow: '0 4px 16px rgba(45,58,140,0.32)',
  letterSpacing: '-0.01em',
}

const toggleBtn = {
  background: 'none',
  border: 'none',
  /* Color marca índigo */
  color: '#2D3A8C',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  padding: 0,
}
