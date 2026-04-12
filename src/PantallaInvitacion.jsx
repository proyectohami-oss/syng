export default function PantallaInvitacion({ invData, onEntrar, onIrLogin }) {
  if (!invData) return null
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0f2a4a,#185FA5,#534AB7)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 32px', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', gap:'24px' }}>
      <div style={{ color:'white', fontSize:'24px', fontWeight:'800', letterSpacing:'0.08em' }}>SYNG</div>
      <div style={{ width:'100px', height:'100px', borderRadius:'28px', background:'rgba(255,255,255,0.15)', border:'1.5px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="52" height="52" viewBox="0 0 56 56" fill="none">
          <circle cx="22" cy="18" r="9" fill="rgba(255,255,255,0.9)"/>
          <circle cx="38" cy="22" r="7" fill="rgba(255,255,255,0.6)"/>
          <path d="M4 46c0-9.4 8.1-17 18-17s18 7.6 18 17" stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinecap="round" fill="none"/>
          <path d="M36 32c5.5 0 10 4.3 10 9.5" stroke="rgba(255,255,255,0.6)" strokeWidth="3" strokeLinecap="round" fill="none"/>
        </svg>
      </div>
      <div style={{ textAlign:'center' }}>
        <div style={{ color:'white', fontSize:'30px', fontWeight:'800', marginBottom:'8px' }}>{invData.grupoNombre}</div>
        <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'15px' }}>Has sido invitado a unirte</div>
      </div>
      <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:'14px', padding:'12px 24px', border:'1px solid rgba(255,255,255,0.2)', textAlign:'center' }}>
        <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'13px' }}>Invitado por</div>
        <div style={{ color:'white', fontSize:'15px', fontWeight:'700', marginTop:'2px' }}>{invData.adminNombre}</div>
      </div>
      <button onClick={onEntrar} style={{ width:'100%', maxWidth:'360px', padding:'18px', background:'white', color:'#185FA5', border:'none', borderRadius:'16px', fontSize:'17px', fontWeight:'700', cursor:'pointer' }}>
        Entrar al grupo
      </button>
      <div style={{ textAlign:'center' }}>
        <span style={{ color:'rgba(255,255,255,0.5)', fontSize:'13px' }}>¿Ya tienes tu propio Syng? </span>
        <span onClick={onIrLogin} style={{ color:'white', fontSize:'13px', fontWeight:'600', textDecoration:'underline', cursor:'pointer' }}>Iniciar sesión</span>
      </div>
    </div>
  )
}
