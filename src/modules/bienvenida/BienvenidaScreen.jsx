import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const VARIANTS = [
  { label: 'Tu día de hoy',  text: (d) => `Tienes ${d.n} tarea${d.n !== 1 ? 's' : ''} pendiente${d.n !== 1 ? 's' : ''}`, sub: 'Todo está organizado' },
  { label: 'Tu prioridad',   text: (d) => d.tarea || 'Empieza por una sola cosa', sub: 'Empieza por esto' },
  { label: 'Buen trabajo',   text: (d) => `Ayer completaste ${d.c} tarea${d.c !== 1 ? 's' : ''}`, sub: 'Sigue así' },
  { label: 'Todo listo',     text: () => 'Tu agenda está preparada', sub: 'Syng ya hizo el trabajo' },
  { label: 'Enfoque',        text: () => 'Empieza por una sola cosa', sub: 'El resto llegará solo' },
  { label: 'Perspectiva',    text: () => 'Todo gran avance comienza con una tarea', sub: '' },
  { label: 'Espacio',        text: () => 'Hoy tienes espacio para avanzar', sub: '' },
  { label: 'Claridad',       text: () => 'Lo importante ya está definido', sub: '' },
  { label: 'Prioridad',      text: () => 'Una prioridad clara cambia todo', sub: '' },
  { label: 'Bienvenido',     text: () => 'Bienvenido de nuevo', sub: 'Tu día te está esperando' },
  { label: 'Ritual',         text: () => 'Tu día te está esperando', sub: '' },
  { label: 'Filosofía',      text: () => 'Organiza menos. Avanza más.', sub: '' },
  { label: 'Progreso',       text: () => 'Pequeños avances. Grandes resultados.', sub: '' },
  { label: 'Posibilidad',    text: () => 'Hoy puede ser un gran día.', sub: '' },
  { label: 'Syng',           text: () => 'Syng ya preparó tu agenda.', sub: '' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export function BienvenidaScreen({ userData, tareasHoy = [], tareasAyer = [], onDone }) {
  const navigate = useNavigate()
  const barRef   = useRef(null)
  const stageRef = useRef(null)

  const n      = tareasHoy.length
  const c      = tareasAyer.length
  const tarea  = tareasHoy[0]?.title || ''
  const nombre = userData?.displayName?.split(' ')[0] || ''

  const dayIdx  = new Date().getDate() % VARIANTS.length
  const variant = VARIANTS[dayIdx]
  const texto   = variant.text({ n, c, tarea })

  useEffect(() => {
    const t1 = setTimeout(() => {
      if (barRef.current) {
        barRef.current.style.transition = 'width 3.5s linear'
        barRef.current.style.width = '100%'
      }
    }, 400)
    const t2 = setTimeout(() => {
      if (stageRef.current) stageRef.current.style.opacity = '0'
    }, 4200)
    const t3 = setTimeout(() => { if (onDone) onDone(); else navigate('/agenda', { replace: true }) }, 4600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [navigate])

  return (
    <div ref={stageRef} style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'#0A0E2A',
      display:'flex', alignItems:'center', justifyContent:'center',
      transition:'opacity 0.4s ease', overflow:'hidden',
      fontFamily:'-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif',
    }}>
      <style>{`
        @keyframes syngOrbFloat{0%,100%{transform:translate(0,0)}50%{transform:translate(14px,18px)}}
        @keyframes syngFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes syngFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes syngBreathe{0%,100%{transform:scale(1)}50%{transform:scale(1.025)}}
        @keyframes syngGlow{0%,100%{opacity:0.6;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.2)}}
        @keyframes syngDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.7)}}
        @keyframes syngShimmer{from{left:-100%}to{left:200%}}
        @keyframes syngParticle{0%{transform:translateY(0);opacity:0}15%{opacity:1}85%{opacity:0.2}100%{transform:translateY(-500px);opacity:0}}
      `}</style>

      <div style={{position:'absolute',width:380,height:380,borderRadius:'50%',background:'radial-gradient(circle,rgba(45,58,140,0.18) 0%,transparent 70%)',top:-120,left:-80,animation:'syngOrbFloat 9s ease-in-out infinite'}}/>
      <div style={{position:'absolute',width:280,height:280,borderRadius:'50%',background:'radial-gradient(circle,rgba(127,119,221,0.12) 0%,transparent 70%)',bottom:-60,right:-40,animation:'syngOrbFloat 11s ease-in-out infinite reverse'}}/>
      <div style={{position:'absolute',width:160,height:160,borderRadius:'50%',background:'radial-gradient(circle,rgba(45,58,140,0.10) 0%,transparent 70%)',bottom:100,left:40,animation:'syngOrbFloat 13s ease-in-out infinite 3s'}}/>

      {[...Array(16)].map((_,i) => (
        <div key={i} style={{
          position:'absolute', width:1.5, height:1.5, borderRadius:'50%',
          background:'rgba(127,119,221,0.35)',
          left:((i*37+13)%100)+'%', top:((i*53+7)%100)+'%',
          animation:`syngParticle ${7+(i%5)*2}s linear ${i%6}s infinite`,
          pointerEvents:'none',
        }}/>
      ))}

      <div style={{
        width:290, padding:'40px 26px 32px',
        background:'rgba(255,255,255,0.04)',
        backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
        border:'1px solid rgba(255,255,255,0.08)',
        borderRadius:32,
        boxShadow:'0 24px 64px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.06)',
        display:'flex', flexDirection:'column', alignItems:'center',
        position:'relative', overflow:'hidden',
        animation:'syngFadeUp 0.6s ease 0.1s both',
      }}>
        <div style={{position:'absolute',top:0,left:'-100%',width:'50%',height:'100%',background:'linear-gradient(105deg,transparent,rgba(255,255,255,0.04),transparent)',animation:'syngShimmer 0.9s ease 1.8s forwards',pointerEvents:'none'}}/>

        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,marginBottom:28,animation:'syngFadeIn 0.6s ease 0.2s both, syngBreathe 4s ease-in-out 1s infinite'}}>
          <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{position:'absolute',width:120,height:120,borderRadius:'50%',background:'radial-gradient(circle,rgba(127,119,221,0.35) 0%,rgba(45,58,140,0.15) 40%,transparent 70%)',top:'50%',left:'50%',animation:'syngGlow 4s ease-in-out infinite',filter:'blur(8px)',pointerEvents:'none'}}/>
            <div style={{position:'relative',zIndex:1,width:68,height:68,borderRadius:20,background:'#1A2460',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,boxShadow:'0 0 0 1px rgba(127,119,221,0.3),0 0 24px rgba(127,119,221,0.2)'}}>
              <span style={{color:'#fff',fontSize:28,fontWeight:700,lineHeight:1}}>4</span>
              <div style={{width:8,height:8,borderRadius:'50%',background:'#7F77DD',animation:'syngDot 2.5s ease-in-out infinite'}}/>
            </div>
          </div>
          <span style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.4)',letterSpacing:'0.14em'}}>SYNG</span>
        </div>

        <p style={{fontSize:12,fontWeight:500,color:'rgba(175,169,236,0.7)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6,textAlign:'center',animation:'syngFadeUp 0.5s ease 0.65s both'}}>{getGreeting()}</p>
        <p style={{fontSize:28,fontWeight:700,color:'#fff',lineHeight:1.1,marginBottom:22,textAlign:'center',letterSpacing:'-0.02em',animation:'syngFadeUp 0.5s ease 0.8s both'}}>{nombre}</p>

        <div style={{width:'100%',background:'rgba(45,58,140,0.15)',border:'1px solid rgba(127,119,221,0.15)',borderRadius:20,padding:'18px 18px 16px',marginBottom:24,animation:'syngFadeUp 0.5s ease 1.05s both'}}>
          <p style={{fontSize:10,fontWeight:600,color:'#AFA9EC',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10}}>{variant.label}</p>
          <p style={{fontSize:16,fontWeight:500,color:'rgba(255,255,255,0.9)',lineHeight:1.45,textAlign:'center'}}>{texto}</p>
          {variant.sub ? <p style={{fontSize:12,color:'rgba(175,169,236,0.6)',marginTop:8,textAlign:'center',lineHeight:1.4}}>{variant.sub}</p> : null}
        </div>

        <div style={{width:'100%',animation:'syngFadeIn 0.4s ease 1.5s both'}}>
          <div style={{width:'100%',height:1.5,background:'rgba(127,119,221,0.15)',borderRadius:2,overflow:'hidden'}}>
            <div ref={barRef} style={{height:'100%',width:'0%',background:'rgba(127,119,221,0.6)',borderRadius:2}}/>
          </div>
          <p style={{fontSize:10,color:'rgba(255,255,255,0.18)',textAlign:'center',marginTop:10,letterSpacing:'0.05em'}}>Entrando a tu agenda</p>
        </div>
      </div>
    </div>
  )
}
