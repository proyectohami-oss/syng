import { useEffect } from 'react'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'

export default function SplashScreen({ onListo }) {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => { onListo(); unsub() })
    const timer = setTimeout(() => onListo(), 3000)
    return () => { clearTimeout(timer); unsub() }
  }, [])

  return (
    <div style={{minHeight:'100vh',background:'#F0EFF8',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif'}}>
      <style>{`
        @keyframes zoomIn{0%{opacity:0;transform:scale(0.3) rotate(-10deg)}60%{transform:scale(1.12) rotate(2deg)}100%{opacity:1;transform:scale(1) rotate(0deg)}}
        @keyframes wordIn{0%{opacity:0;transform:translateY(16px) scale(0.95)}100%{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes sloganIn{0%{opacity:0;transform:translateX(-10px)}100%{opacity:1;transform:translateX(0)}}
        @keyframes dotBounce{0%,100%{transform:translateY(0);opacity:0.3}50%{transform:translateY(-10px);opacity:1}}
        @keyframes ringPulse{0%{transform:scale(0.8);opacity:0.6}100%{transform:scale(1.9);opacity:0}}
        @keyframes blob1{0%,100%{transform:scale(1) translate(0,0)}50%{transform:scale(1.15) translate(10px,-10px)}}
        @keyframes blob2{0%,100%{transform:scale(1) translate(0,0)}50%{transform:scale(1.1) translate(-8px,8px)}}
      `}</style>
      <div style={{position:'absolute',top:'-20px',left:'-20px',width:'220px',height:'220px',borderRadius:'50%',background:'radial-gradient(circle,rgba(83,74,183,0.22) 0%,rgba(123,110,246,0.08) 60%,transparent 80%)',animation:'blob1 5s ease-in-out infinite'}}/>
      <div style={{position:'absolute',bottom:'-10px',right:'-10px',width:'200px',height:'200px',borderRadius:'50%',background:'radial-gradient(circle,rgba(24,95,165,0.2) 0%,rgba(83,74,183,0.08) 60%,transparent 80%)',animation:'blob2 6s ease-in-out infinite'}}/>
      <div style={{position:'relative',marginBottom:'28px'}}>
        <div style={{position:'absolute',inset:'-16px',borderRadius:'40px',border:'2px solid rgba(83,74,183,0.35)',animation:'ringPulse 1.8s 0.5s ease-out both'}}/>
        <div style={{position:'absolute',inset:'-28px',borderRadius:'50px',border:'1.5px solid rgba(83,74,183,0.2)',animation:'ringPulse 1.8s 0.72s ease-out both'}}/>
        <svg width="96" height="96" viewBox="0 0 100 100" style={{display:'block',animation:'zoomIn 0.7s 0.1s cubic-bezier(0.34,1.56,0.64,1) both'}}>
          <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2A3A8C"/><stop offset="100%" stopColor="#0F1540"/></linearGradient></defs>
          <rect width="100" height="100" rx="22" fill="url(#lg)"/>
          <text x="52" y="58" textAnchor="middle" fontFamily="-apple-system,sans-serif" fontSize="52" fontWeight="300" fill="white">4</text>
          <circle cx="52" cy="76" r="6" fill="#7B6EF6"/>
        </svg>
      </div>
      <div style={{color:'#534AB7',fontSize:'32px',fontWeight:'800',letterSpacing:'-1px',animation:'wordIn 0.5s 0.72s cubic-bezier(0.34,1.56,0.64,1) both',opacity:0,marginBottom:'8px'}}>Syng</div>
      <div style={{color:'#8880CC',fontSize:'13px',letterSpacing:'0.06em',animation:'sloganIn 0.5s 1s ease both',opacity:0,marginBottom:'44px'}}>Sincroniza tu mundo</div>
      <div style={{display:'flex',gap:'12px'}}>
        <div style={{width:'9px',height:'9px',borderRadius:'50%',background:'#534AB7',animation:'dotBounce 0.9s 1.15s ease-in-out infinite'}}/>
        <div style={{width:'9px',height:'9px',borderRadius:'50%',background:'#7B6EF6',animation:'dotBounce 0.9s 1.3s ease-in-out infinite'}}/>
        <div style={{width:'9px',height:'9px',borderRadius:'50%',background:'#185FA5',animation:'dotBounce 0.9s 1.45s ease-in-out infinite'}}/>
      </div>
    </div>
  )
}
