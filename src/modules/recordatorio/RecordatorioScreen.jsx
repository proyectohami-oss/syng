import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useCoreAuth } from '../../core/hooks/useCoreData'

export function RecordatorioScreen() {
  const { taskId } = useParams()
  const navigate   = useNavigate()
  const auth       = useCoreAuth()
  const [task,      setTask]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [showSheet, setShowSheet] = useState(false)
  const [confirm,   setConfirm]   = useState(null)

  useEffect(() => {
    if (!taskId) return
    getDoc(doc(db, 'tasks', taskId)).then(snap => {
      if (snap.exists()) setTask({ id: snap.id, ...snap.data() })
      setLoading(false)
    })
  }, [taskId])

  function getVenceLabel(dueDate) {
    if (!dueDate) return null
    const fecha = dueDate.toDate ? dueDate.toDate() : new Date(dueDate)
    const hoy = new Date(); hoy.setHours(0,0,0,0)
    const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1)
    if (fecha < hoy) return 'Vencida'
    if (fecha.toDateString() === hoy.toDateString()) return 'Vence hoy'
    if (fecha.toDateString() === manana.toDateString()) return 'Vence mañana'
    const dias = Math.ceil((fecha - hoy) / 86400000)
    return `Vence en ${dias} días`
  }

  async function handlePosponer(label, minutos, tipo) {
    setShowSheet(false)
    if (!task) return
    let nuevaFecha = new Date()
    if (minutos) nuevaFecha = new Date(Date.now() + minutos * 60000)
    else if (tipo === 'tarde') { nuevaFecha.setHours(15, 0, 0, 0) }
    else if (tipo === 'noche') { nuevaFecha.setHours(20, 0, 0, 0) }
    else if (tipo === 'manana') { nuevaFecha.setDate(nuevaFecha.getDate() + 1); nuevaFecha.setHours(9, 0, 0, 0) }
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        'reminder.scheduledAt': nuevaFecha,
        updatedAt: serverTimestamp(),
      })
      await fetch('https://us-central1-syng-app.cloudfunctions.net/scheduleReminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, scheduledAt: nuevaFecha.toISOString() }),
      }).catch(() => {})
    } catch {}
    setConfirm(`Pospuesto · ${label}`)
    setTimeout(() => navigate('/agenda'), 2200)
  }

  if (loading) return (
    <div style={s.stage}>
      <SyngStyles />
      <div style={s.orb1}/><div style={s.orb2}/>
      <div style={s.card}>
        <p style={{ color:'rgba(175,169,236,0.5)', fontSize:14, textAlign:'center' }}>Cargando...</p>
      </div>
    </div>
  )

  if (!task) return (
    <div style={s.stage}>
      <SyngStyles />
      <div style={s.orb1}/><div style={s.orb2}/>
      <div style={s.card}>
        <p style={{ color:'rgba(175,169,236,0.5)', fontSize:14, textAlign:'center', marginBottom:16 }}>Tarea no encontrada.</p>
        <button style={s.btnT} onClick={() => navigate('/agenda')}>Ir a mi agenda</button>
      </div>
    </div>
  )

  const venceLabel = getVenceLabel(task.dueDate)
  const esVencida  = venceLabel === 'Vencida' || venceLabel === 'Vence hoy'
  const esGrupo    = !!task.groupId

  return (
    <div style={s.stage}>
      <SyngStyles />
      <div style={s.orb1}/><div style={s.orb2}/>
      <Particles />

      {confirm && <div style={s.confirm}>{confirm}</div>}

      <div style={s.card}>
        <div style={s.logoWrap}>
          <div style={s.logoGlow}/>
          <div style={s.logoBox}>
            <span style={s.logo4}>4</span>
            <div style={s.logoDot}/>
          </div>
        </div>

        <span style={s.badge}>Recordatorio</span>
        <h1 style={s.title}>{task.title}</h1>
        <p style={s.sub}>Es momento de retomarlo.</p>

        <div style={s.meta}>
          {venceLabel && (
            <div style={{...s.tag, ...(esVencida ? s.tagRed : s.tagBlue)}}>{venceLabel}</div>
          )}
          <div style={{...s.tag, ...s.tagBlue}}>{esGrupo ? 'Grupo' : 'Personal'}</div>
        </div>

        <div style={s.actions}>
          <button style={s.btnP} onClick={() => navigate('/agenda')}>Abrir tarea</button>
          <button style={s.btnS} onClick={() => setShowSheet(true)}>Posponer</button>
          <button style={s.btnT} onClick={() => navigate('/agenda')}>Ya lo vi</button>
        </div>
      </div>

      {showSheet && (
        <div style={s.overlay} onClick={() => setShowSheet(false)}>
          <div style={s.sheet} onClick={e => e.stopPropagation()}>
            <div style={s.sheetHandle}/>
            <p style={s.sheetTitle}>¿Cuánto tiempo?</p>
            <div style={s.sheetGrid}>
              {[
                { label:'5 minutos',       minutos:5 },
                { label:'10 minutos',      minutos:10 },
                { label:'15 minutos',      minutos:15 },
                { label:'30 minutos',      minutos:30 },
                { label:'1 hora',          minutos:60 },
                { label:'Esta tarde',      tipo:'tarde' },
                { label:'Esta noche',      tipo:'noche' },
                { label:'Mañana 9:00 am',  tipo:'manana' },
              ].map(op => (
                <button
                  key={op.label}
                  style={s.sheetBtn}
                  onClick={() => handlePosponer(op.label, op.minutos, op.tipo)}
                >{op.label}</button>
              ))}
              <button style={{...s.sheetBtn, gridColumn:'1/-1'}} onClick={() => navigate('/agenda')}>
                Elegir fecha y hora
              </button>
            </div>
            <button style={s.sheetCancel} onClick={() => setShowSheet(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Particles() {
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
      {Array.from({length:14},(_,i) => (
        <div key={i} style={{
          position:'absolute', width:1.5, height:1.5, borderRadius:'50%',
          background:'rgba(127,119,221,0.35)',
          left:((i*37+13)%100)+'%', top:((i*53+7)%100)+'%',
          animation:`syngP ${7+(i%5)*2}s linear ${i%6}s infinite`,
        }}/>
      ))}
    </div>
  )
}

function SyngStyles() {
  return (
    <style>{`
      @keyframes syngOrbF{0%,100%{transform:translate(0,0)}50%{transform:translate(12px,16px)}}
      @keyframes syngBreath{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
      @keyframes syngGlowP{0%,100%{opacity:0.5;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.2)}}
      @keyframes syngDotP{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.7)}}
      @keyframes syngCardIn{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}
      @keyframes syngFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes syngP{0%{transform:translateY(0);opacity:0}15%{opacity:1}85%{opacity:0.2}100%{transform:translateY(-400px);opacity:0}}
      @keyframes syngSheetIn{from{transform:translateY(100%)}to{transform:translateY(0)}}
      @keyframes syngConfirm{0%{opacity:0;transform:translateX(-50%) translateY(-8px)}15%{opacity:1;transform:translateX(-50%) translateY(0)}85%{opacity:1}100%{opacity:0}}
    `}</style>
  )
}

const s = {
  stage:       { minHeight:'100svh', background:'#0A0E2A', display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 20px', position:'relative', overflow:'hidden', fontFamily:'-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif' },
  orb1:        { position:'absolute', width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle,rgba(45,58,140,0.2) 0%,transparent 70%)', top:-100, left:-80, animation:'syngOrbF 9s ease-in-out infinite', pointerEvents:'none' },
  orb2:        { position:'absolute', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle,rgba(127,119,221,0.14) 0%,transparent 70%)', bottom:-50, right:-40, animation:'syngOrbF 11s ease-in-out infinite reverse', pointerEvents:'none' },
  card:        { width:'100%', maxWidth:340, padding:'36px 24px 28px', background:'rgba(255,255,255,0.04)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:32, boxShadow:'0 24px 64px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', alignItems:'center', position:'relative', animation:'syngCardIn 0.5s ease both', zIndex:1 },
  logoWrap:    { display:'flex', flexDirection:'column', alignItems:'center', marginBottom:16, position:'relative', animation:'syngFadeUp 0.5s ease 0.2s both' },
  logoGlow:    { position:'absolute', width:90, height:90, borderRadius:'50%', background:'radial-gradient(circle,rgba(127,119,221,0.3) 0%,transparent 70%)', top:'50%', left:'50%', animation:'syngGlowP 3s ease-in-out infinite', filter:'blur(6px)', pointerEvents:'none' },
  logoBox:     { width:52, height:52, borderRadius:15, background:'#1A2460', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, boxShadow:'0 0 0 1px rgba(127,119,221,0.3),0 0 24px rgba(127,119,221,0.2)', animation:'syngBreath 3s ease-in-out infinite', position:'relative', zIndex:1 },
  logo4:       { color:'#fff', fontSize:20, fontWeight:700, lineHeight:1 },
  logoDot:     { width:6, height:6, borderRadius:'50%', background:'#7F77DD', animation:'syngDotP 2.5s ease-in-out infinite' },
  badge:       { fontSize:10, fontWeight:600, color:'rgba(175,169,236,0.6)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16, animation:'syngFadeUp 0.5s ease 0.3s both' },
  title:       { fontSize:22, fontWeight:700, color:'#fff', textAlign:'center', lineHeight:1.25, marginBottom:6, letterSpacing:'-0.02em', animation:'syngFadeUp 0.5s ease 0.4s both', width:'100%' },
  sub:         { fontSize:13, color:'rgba(175,169,236,0.65)', textAlign:'center', marginBottom:18, animation:'syngFadeUp 0.5s ease 0.5s both' },
  meta:        { display:'flex', gap:7, flexWrap:'wrap', justifyContent:'center', marginBottom:22, animation:'syngFadeUp 0.5s ease 0.6s both' },
  tag:         { padding:'5px 11px', borderRadius:20, fontSize:11, fontWeight:600, border:'1px solid rgba(255,255,255,0.1)' },
  tagRed:      { background:'rgba(220,50,50,0.12)', color:'#FF8B8B' },
  tagBlue:     { background:'rgba(45,58,140,0.25)', color:'#AFA9EC' },
  actions:     { width:'100%', display:'flex', flexDirection:'column', gap:9, animation:'syngFadeUp 0.5s ease 0.7s both' },
  btnP:        { width:'100%', padding:15, borderRadius:15, border:'none', background:'#2D3A8C', color:'#fff', fontSize:15, fontWeight:500, cursor:'pointer', fontFamily:'inherit' },
  btnS:        { width:'100%', padding:14, borderRadius:15, border:'1px solid rgba(127,119,221,0.25)', background:'rgba(127,119,221,0.08)', color:'rgba(175,169,236,0.9)', fontSize:15, fontWeight:500, cursor:'pointer', fontFamily:'inherit' },
  btnT:        { width:'100%', padding:11, borderRadius:14, border:'none', background:'transparent', color:'rgba(255,255,255,0.22)', fontSize:13, cursor:'pointer', fontFamily:'inherit' },
  overlay:     { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'flex-end' },
  sheet:       { width:'100%', background:'rgba(12,16,42,0.98)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', borderRadius:'24px 24px 0 0', borderTop:'1px solid rgba(127,119,221,0.2)', padding:'16px 18px 40px', animation:'syngSheetIn 0.35s cubic-bezier(0.32,0.72,0,1) both' },
  sheetHandle: { width:36, height:3, borderRadius:2, background:'rgba(255,255,255,0.12)', margin:'0 auto 14px' },
  sheetTitle:  { fontSize:11, fontWeight:600, color:'rgba(175,169,236,0.5)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12, textAlign:'center' },
  sheetGrid:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 },
  sheetBtn:    { padding:11, borderRadius:13, border:'1px solid rgba(127,119,221,0.18)', background:'rgba(127,119,221,0.06)', color:'rgba(255,255,255,0.8)', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit', textAlign:'center' },
  sheetCancel: { width:'100%', marginTop:10, padding:12, borderRadius:13, border:'none', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.3)', fontSize:13, cursor:'pointer', fontFamily:'inherit' },
  confirm:     { position:'fixed', top:24, left:'50%', transform:'translateX(-50%)', background:'rgba(45,58,140,0.9)', border:'1px solid rgba(127,119,221,0.3)', borderRadius:20, padding:'9px 20px', fontSize:13, color:'#AFA9EC', fontWeight:500, whiteSpace:'nowrap', zIndex:200, animation:'syngConfirm 2.2s ease both', pointerEvents:'none' },
}
