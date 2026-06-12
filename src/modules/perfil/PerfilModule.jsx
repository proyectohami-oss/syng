import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { useCoreAuth } from '../../core/hooks/useCoreData'
import { updateDisplayName, updatePhoneNumber } from '../../core/services/users.service'
import { useAuthActions } from '../../auth/useAuthActions'
import { PWAInstallButton } from '../../core/pwa/PWAInstallButton'
import { usePWAInstall } from '../../core/pwa/usePWAInstall'
import { NotifPrefsSection } from './NotifPrefsSection'
import { A, L } from '../../shared/agendaEditorial'

export function PerfilModule() {
  const auth = useCoreAuth()
  const { signOut } = useAuthActions()
  const { isInstalled, canInstall } = usePWAInstall()

  const user     = auth.user
  const userData = auth.userData

  const [editingName,  setEditingName]  = useState(false)
  const [editingPhone, setEditingPhone] = useState(false)
  const [name,         setName]         = useState(userData?.displayName ?? '')
  const [phone,        setPhone]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [success,      setSuccess]      = useState(null)
  const [signingOut,   setSigningOut]   = useState(false)

  async function handleSaveName() {
    if (!name.trim()) return
    setLoading(true); setError(null); setSuccess(null)
    try {
      await updateDisplayName(user.uid, name)
      setSuccess('Nombre actualizado')
      setEditingName(false)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleSavePhone() {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) { setError('Ingresa un número válido de 10 dígitos.'); return }
    setLoading(true); setError(null); setSuccess(null)
    try {
      await updatePhoneNumber(user.uid, phone)
      setSuccess('Número actualizado')
      setEditingPhone(false)
      setPhone('')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleSignOut() {
    setSigningOut(true)
    try { await signOut() } finally { setSigningOut(false) }
  }

  const phoneDisplay = userData?.phoneNumber
    ? userData.phoneNumber.replace('+52', '+52 ')
    : 'Sin número'

  return (
    <div style={A.screen}>

      <div style={A.header}>
        <span style={A.headerTitle}>Perfil</span>
        {Capacitor.isNativePlatform() && (
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#6ee7a0',
            border: '1px solid rgba(52,199,89,0.35)',
            padding: '4px 8px',
            borderRadius: 2,
          }}>
            App nativa
          </span>
        )}
      </div>

      <div style={A.body}>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0 24px' }}>
          <div style={A.avatar}>
            {(userData?.displayName?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
          </div>
          <p style={{ margin: '0 0 2px', fontFamily: L.serif, fontSize: 20, color: L.ivory }}>
            {userData?.displayName || 'Sin nombre'}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: L.ivoryMuted }}>{user?.email}</p>
        </div>

        <div style={A.section}>
          <p style={A.sectionLabel}>Nombre</p>
          {editingName ? (
            <div style={{ padding: '12px 16px' }}>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                style={A.input}
                placeholder="Tu nombre"
                autoFocus
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={handleSaveName} disabled={loading} style={A.btnPrimary}>
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button onClick={() => { setEditingName(false); setError(null) }} style={A.btnSecondary}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div style={A.row} onClick={() => { setEditingName(true); setName(userData?.displayName ?? '') }}>
              <span style={{ fontSize: 15, color: L.ivory, flex: 1 }}>{userData?.displayName || 'Sin nombre'}</span>
              <span style={{ fontSize: 13, color: L.champagne, fontWeight: 500 }}>Editar</span>
            </div>
          )}
        </div>

        <div style={A.section}>
          <p style={A.sectionLabel}>Teléfono</p>
          {editingPhone ? (
            <div style={{ padding: '12px 16px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: L.ivoryMuted }}>+52</span>
                <input
                  type="tel" inputMode="numeric"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setError(null) }}
                  style={{ ...A.input, paddingLeft: 44 }}
                  placeholder="9611234567"
                  autoFocus maxLength={15}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={handleSavePhone} disabled={loading} style={A.btnPrimary}>
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button onClick={() => { setEditingPhone(false); setPhone(''); setError(null) }} style={A.btnSecondary}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div style={A.row} onClick={() => setEditingPhone(true)}>
              <span style={{ fontSize: 15, color: L.ivory, flex: 1 }}>{phoneDisplay}</span>
              <span style={{ fontSize: 13, color: L.champagne, fontWeight: 500 }}>Editar</span>
            </div>
          )}
        </div>

        {error && (
          <p style={{ fontSize: 13, color: '#E05252', padding: '10px 16px', background: 'rgba(224,82,82,0.08)', borderRadius: 2, margin: '12px 16px 0', border: '1px solid rgba(224,82,82,0.25)' }}>
            {error}
          </p>
        )}
        {success && (
          <p style={{ fontSize: 13, color: '#6ee7a0', padding: '10px 16px', background: 'rgba(52,199,89,0.08)', borderRadius: 2, margin: '12px 16px 0', border: '1px solid rgba(52,199,89,0.25)' }}>
            {success}
          </p>
        )}

        {canInstall && (
          <div style={{ ...A.section, marginTop: 12 }}>
            <p style={A.sectionLabel}>Instalar app</p>
            <div style={{ padding: '12px 16px 14px' }}>
              <PWAInstallButton />
            </div>
          </div>
        )}

        {isInstalled && (
          <div style={{ ...A.section, marginTop: 12, border: '1px solid rgba(52,199,89,0.35)' }}>
            <p style={{ margin: 0, padding: '14px 16px', fontSize: 14, fontWeight: 500, color: '#6ee7a0' }}>
              App instalada en este dispositivo
            </p>
          </div>
        )}

        <NotifPrefsSection />

        <div style={{ padding: '24px 16px 32px' }}>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={A.btnDanger}
          >
            {signingOut ? 'Cerrando...' : 'Cerrar sesión'}
          </button>
        </div>

      </div>
    </div>
  )
}
