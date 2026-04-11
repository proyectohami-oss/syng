import { useState } from 'react'

export default function PantallaInvitacion({ invData, userActual, onEntrar, onIrLogin }) {
  const [entrando, setEntrando] = useState(false)

  if (!invData) return null

  const handleEntrar = async () => {
    setEntrando(true)
    await onEntrar()
    setEntrando(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0f2a4a,#185FA5,#534AB7)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between', padding:'48px 32px', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>

      <div style={{ color:'white', fontSize:'22px', fontWeight:'800', letterSpacing:'0.08em', opacity:0.9 }}>SYNG</div>

      <div style={{ textAlign:'center', flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'24px', width:'100%', maxWidth:'360px' }}>

        <div style={{ width:'110px', height:'110px', borderRadius:'32px', background:'rgba(255,255,255,0.15)', border:'1.5px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'8px' }}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="22" cy="18" r="9" fill="rgba(255,255,255,0.9)"/>
            <circle cx="38" cy="22" r="7" fill="rgba(255,255,255,0.6)"/>
            <path d="M4 46c0-9.4 8.1-17 18-17s18 7.6 18 17" stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <path d="M36 32c5.5 0 10 4.3 10 9.5" stroke="rgba(255,255,255,0.6)" strokeWidth="3" strokeLinecap="round" fill="none"/>
          </svg>
        </div>

        <div>
          <div style={{ color:'white', fontSize:'32px', fontWeight:'800', letterSpacing:'-0.5px', marginBottom:'8px' }}>{invData.grupoNombre}</div>
          <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'15px' }}>Has sido invitado a unirte</div>
        </div>

        <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:'14px', padding:'12px 20px', border:'1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'13px' }}>Invitado por</div>
          <div style={{ fontWeight:'700', color:'white', fontSize:'15px', marginTop:'2px' }}>{invData.adminNombre}</div>
        </div>

        {userActual && !userActual.isAnonymous && (
          <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:'12px', padding:'10px 16px', border:'1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'12px' }}>Entrando como</div>
            <div style={{ color:'white', fontSize:'14px', fontWeight:'600', marginTop:'2px' }}>{userActual.displayName || userActual.email}</div>
          </div>
        )}

        <button onClick={handleEntrar} disabled={entrando} style={{ width:'100%', padding:'18px', background:'white', color:'#185FA5', border:'none', borderRadius:'16px', fontSize:'17px', fontWeight:'700', cursor:'pointer', marginTop:'8px', opacity: entrando ? 0.7 : 1, WebkitTapHighlightColor:'transparent' }}>
          {entrando ? 'Entrando...' : 'Entrar al grupo'}
        </button>

        <div style={{ textAlign:'center', marginTop:'8px' }}>
          <span style={{ color:'rgba(255,255,255,0.5)', fontSize:'13px' }}>¿Ya tienes tu propio Syng? </span>
          <span onClick={onIrLogin} style={{ color:'white', fontSize:'13px', fontWeight:'600', textDecoration:'underline', cursor:'pointer' }}>Iniciar sesión</span>
        </div>

      </div>

      <div style={{ height:'1px' }} />
    </div>
  )
}
