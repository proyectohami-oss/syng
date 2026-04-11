import { useState, useEffect } from 'react'
import { db, auth } from './firebase'
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore'
import { signInAnonymously } from 'firebase/auth'

export default function PantallaInvitacion({ invData, userActual, onEntrar, onGoogle, onRegistrar }) {
  const [grupo, setGrupo] = useState(null)
  const [invitacion, setInvitacion] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [entrando, setEntrando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargar = async () => {
      try {
        const invSnap = await getDoc(doc(db, 'invitaciones', invitacionId))
        if (!invSnap.exists()) { setError('Esta invitación no existe o expiró'); setCargando(false); return }
        const inv = invSnap.data()
        if (inv.expiresEn < Date.now()) { setError('Esta invitación ha expirado'); setCargando(false); return }
        const grupoSnap = await getDoc(doc(db, 'grupos', inv.grupoId))
        if (!grupoSnap.exists()) { setError('El grupo ya no existe'); setCargando(false); return }
        setInvitacion(inv)
        setGrupo({ id: inv.grupoId, ...grupoSnap.data() })
      } catch(e) { setError('Error al cargar la invitación') }
      setCargando(false)
    }
    cargar()
  }, [invitacionId])

  const entrar = async () => {
    setEntrando(true)
    try {
      const cred = await signInAnonymously(auth)
      const uid = cred.user.uid
      const yaEsMiembro = grupo.miembros?.some(m => m.uid === uid)
      if (!yaEsMiembro) {
        await updateDoc(doc(db, 'grupos', grupo.id), {
          miembros: arrayUnion({ uid, email: '', nombre: 'Invitado', rol: 'miembro' })
        })
        await setDoc(doc(db, 'users', uid, 'misGrupos', grupo.id), { nombre: grupo.nombre, emoji: grupo.emoji || '👥' })
      }
      onEntrar({ uid, isAnonymous: true, grupoInicial: grupo.id })
    } catch(e) { setError('Error al entrar. Intenta de nuevo.'); setEntrando(false) }
  }

  if (cargando) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0f2a4a,#185FA5,#534AB7)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'white', fontSize:'16px', opacity:0.8 }}>Cargando...</div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0f2a4a,#185FA5,#534AB7)', display:'flex', alignItems:'center', justifyContent:'center', padding:'32px' }}>
      <div style={{ textAlign:'center', color:'white' }}>
        <div style={{ fontSize:'48px', marginBottom:'16px' }}>⚠️</div>
        <div style={{ fontSize:'18px', fontWeight:'600', marginBottom:'8px' }}>Invitación no válida</div>
        <div style={{ fontSize:'14px', opacity:0.7 }}>{error}</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0f2a4a,#185FA5,#534AB7)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between', padding:'48px 32px', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>

      {/* Logo */}
      <div style={{ color:'white', fontSize:'22px', fontWeight:'800', letterSpacing:'0.08em', opacity:0.9 }}>SYNG</div>

      {/* Centro */}
      <div style={{ textAlign:'center', flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'24px' }}>

        {/* Icono grupo */}
        <div style={{ width:'110px', height:'110px', borderRadius:'32px', background:'rgba(255,255,255,0.15)', backdropFilter:'blur(10px)', border:'1.5px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', marginBottom:'8px' }}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="22" cy="18" r="9" fill="rgba(255,255,255,0.9)"/>
            <circle cx="38" cy="22" r="7" fill="rgba(255,255,255,0.6)"/>
            <path d="M4 46c0-9.4 8.1-17 18-17s18 7.6 18 17" stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <path d="M36 32c5.5 0 10 4.3 10 9.5" stroke="rgba(255,255,255,0.6)" strokeWidth="3" strokeLinecap="round" fill="none"/>
          </svg>
        </div>

        {/* Nombre grupo */}
        <div>
          <div style={{ color:'white', fontSize:'32px', fontWeight:'800', letterSpacing:'-0.5px', marginBottom:'8px' }}>{grupo.nombre}</div>
          <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'15px' }}>Has sido invitado a unirte</div>
        </div>

        {/* Quien invita */}
        <div style={{ background:'rgba(255,255,255,0.1)', backdropFilter:'blur(8px)', borderRadius:'14px', padding:'12px 20px', border:'1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ color:'rgba(255,255,255,0.8)', fontSize:'13px' }}>
            Invitado por <span style={{ fontWeight:'700', color:'white' }}>{grupo.adminNombre || grupo.adminEmail || 'un miembro'}</span>
          </div>
        </div>

        {/* Boton entrar */}
        <button onClick={entrar} disabled={entrando}
          style={{ width:'100%', maxWidth:'320px', padding:'18px', background:'white', color:'#185FA5', border:'none', borderRadius:'16px', fontSize:'17px', fontWeight:'700', cursor:'pointer', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', marginTop:'8px', opacity: entrando?0.7:1 }}>
          {entrando ? 'Entrando...' : 'Entrar al grupo'}
        </button>
      </div>

      {/* Pie */}
      <div style={{ textAlign:'center' }}>
        <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'12px', marginBottom:'12px' }}>
          ¿Ya tienes tu propio Syng?
        </div>
        <button onClick={onLogin}
          style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.25)', color:'white', borderRadius:'12px', padding:'10px 24px', fontSize:'14px', fontWeight:'500', cursor:'pointer' }}>
          Iniciar sesión
        </button>
      </div>

    </div>
  )
}
