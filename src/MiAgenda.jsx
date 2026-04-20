import { useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, doc, getDocs, onSnapshot, setDoc, getDoc } from 'firebase/firestore'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEMANA = ['L','M','M','J','V','S','D']

function getKey(a, m, d) { return `${a}-${m}-${d}` }
function generarId() { return Math.random().toString(36).slice(2) }

export default function MiAgenda({ userId, tema, onVolver }) {
  const TEMA = {
    oscuro: { bg:'#070712', bgCard:'#18183A', texto:'#F0F0FF', textoSub:'#9090B8', borde:'rgba(255,255,255,0.13)', acento:'#7B6EF6', sombra:'0 4px 24px rgba(0,0,0,0.7)', navBg:'#0E0E24' },
    claro:  { bg:'#F5F5F7', bgCard:'#FFFFFF', texto:'#1C1C2E', textoSub:'#666680', borde:'#EAEAEA', acento:'#534AB7', sombra:'0 2px 12px rgba(0,0,0,0.07)', navBg:'#FFFFFF' },
  }
  const th = TEMA[tema] || TEMA.claro
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  const [tareasDia, setTareasDia] = useState([])
  const [badges, setBadges] = useState({})
  const [grupos, setGrupos] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevaTarea, setNuevaTarea] = useState('')
  const [grupoSeleccionado, setGrupoSeleccionado] = useState({ id:'personal', nombre:'Personal' })
  const [mostrarSelectorGrupo, setMostrarSelectorGrupo] = useState(false)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!userId) return
    const cargarGrupos = async () => {
      const snap = await getDocs(collection(db, 'users', userId, 'misGrupos'))
      const gs = snap.docs.map(d => ({ id: d.id, nombre: d.data().nombre || 'Grupo' }))
      setGrupos([{ id:'personal', nombre:'Personal' }, ...gs])
    }
    cargarGrupos()
  }, [userId])

  useEffect(() => {
    if (!userId) return
    const diasDelMes = new Date(anio, mes + 1, 0).getDate()
    let data = {}
    let unsubs = []

    const merge = (grupoId, snap) => {
      snap.docs.forEach(d => {
        const [a, m2, di] = d.id.split('-').map(Number)
        if (a === anio && m2 === mes) {
          const pendientes = (d.data().items || []).filter(i => !i.realizada).length
          if (pendientes > 0) {
            const k = `${di}`
            data[k] = (data[k] || 0) + pendientes
          }
        }
      })
      setBadges({ ...data })
    }

    const ref1 = collection(db, 'users', userId, 'pizarron')
    const u1 = onSnapshot(ref1, snap => merge('personal', snap))
    unsubs.push(u1)

    getDocs(collection(db, 'users', userId, 'misGrupos')).then(snap => {
      snap.docs.forEach(d => {
        const u = onSnapshot(collection(db, 'grupos', d.id, 'pizarron'), s => merge(d.id, s))
        unsubs.push(u)
      })
    })

    return () => unsubs.forEach(u => u())
  }, [userId, mes, anio])

  const cargarTareasDia = async (dia) => {
    if (!userId) return
    const key = getKey(anio, mes, dia)
    let todas = []

    const snap1 = await getDoc(doc(db, 'users', userId, 'pizarron', key))
    const items1 = (snap1.data()?.items || []).filter(i => !i.realizada)
    items1.forEach(i => todas.push({ ...i, pizarron: 'Personal' }))

    const gsSnap = await getDocs(collection(db, 'users', userId, 'misGrupos'))
    for (const g of gsSnap.docs) {
      const snap = await getDoc(doc(db, 'grupos', g.id, 'pizarron', key))
      const items = (snap.data()?.items || []).filter(i => !i.realizada)
      items.forEach(i => todas.push({ ...i, pizarron: g.data().nombre || 'Grupo' }))
    }

    setTareasDia(todas)
  }

  const tocarDia = (dia) => {
    setDiaSeleccionado(dia)
    setMostrarForm(false)
    setNuevaTarea('')
    cargarTareasDia(dia)
  }

  const guardarTarea = async () => {
    if (!nuevaTarea.trim() || !diaSeleccionado) return
    setCargando(true)
    const key = getKey(anio, mes, diaSeleccionado)
    const nueva = { id: generarId(), texto: nuevaTarea.trim(), realizada: false, dia: diaSeleccionado, mes, anio, creadoPor: userId }
    let ref
    if (grupoSeleccionado.id === 'personal') {
      ref = doc(db, 'users', userId, 'pizarron', key)
    } else {
      ref = doc(db, 'grupos', grupoSeleccionado.id, 'pizarron', key)
    }
    const snap = await getDoc(ref)
    const items = snap.data()?.items || []
    await setDoc(ref, { items: [...items, nueva] })
    setNuevaTarea('')
    setMostrarForm(false)
    cargarTareasDia(diaSeleccionado)
    setCargando(false)
  }

  const primerDia = () => {
    const d = new Date(anio, mes, 1).getDay()
    return d === 0 ? 6 : d - 1
  }

  const diasEnMes = new Date(anio, mes + 1, 0).getDate()
  const offset = primerDia()
  const celdas = [...Array(offset).fill(null), ...Array(diasEnMes).fill(0).map((_,i) => i+1)]

  const colores = ['#534AB7','#2ECC9A','#EF9F27','#D4537E','#378ADD','#E24B4A','#639922']

  return (
    <div style={{ minHeight:'100vh', background:th.bg, fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', paddingBottom:'80px' }}>
      <div style={{ background: tema==='oscuro' ? 'linear-gradient(135deg,rgba(83,74,183,0.9),rgba(45,43,107,0.85))' : 'linear-gradient(135deg,#534AB7,#185FA5)', padding:'48px 20px 24px', display:'flex', alignItems:'center', gap:'12px' }}>
        <button onClick={onVolver} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'10px', padding:'8px 12px', color:'white', fontSize:'16px', cursor:'pointer' }}>‹</button>
        <div style={{ color:'white', fontSize:'20px', fontWeight:'700' }}>Mi Agenda</div>
      </div>

      <div style={{ padding:'16px' }}>
        <div style={{ background:th.bgCard, borderRadius:'20px', padding:'16px', boxShadow:th.sombra, marginBottom:'16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
            <button onClick={() => { if(mes===0){setMes(11);setAnio(anio-1)}else setMes(mes-1) }} style={{ background:'transparent', border:`0.5px solid ${th.borde}`, borderRadius:'10px', padding:'6px 12px', color:th.texto, cursor:'pointer', fontSize:'16px' }}>‹</button>
            <span style={{ fontSize:'15px', fontWeight:'600', color:th.texto }}>{MESES[mes]} {anio}</span>
            <button onClick={() => { if(mes===11){setMes(0);setAnio(anio+1)}else setMes(mes+1) }} style={{ background:'transparent', border:`0.5px solid ${th.borde}`, borderRadius:'10px', padding:'6px 12px', color:th.texto, cursor:'pointer', fontSize:'16px' }}>›</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', textAlign:'center', gap:'2px', marginBottom:'8px' }}>
            {DIAS_SEMANA.map((d,i) => <div key={i} style={{ fontSize:'11px', color:th.textoSub, fontWeight:'600', padding:'4px 0' }}>{d}</div>)}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px', textAlign:'center' }}>
            {celdas.map((dia, i) => {
              if (!dia) return <div key={i} />
              const esHoy = dia===hoy.getDate() && mes===hoy.getMonth() && anio===hoy.getFullYear()
              const seleccionado = dia === diaSeleccionado
              const tienePendientes = badges[`${dia}`] > 0
              return (
                <div key={i} onClick={() => tocarDia(dia)} style={{ position:'relative', padding:'8px 2px', cursor:'pointer', borderRadius:'10px', background: seleccionado ? th.acento : esHoy ? `${th.acento}22` : 'transparent' }}>
                  <span style={{ fontSize:'13px', color: seleccionado ? 'white' : esHoy ? th.acento : th.texto, fontWeight: esHoy || seleccionado ? '700' : '400' }}>{dia}</span>
                  {tienePendientes && <span style={{ position:'absolute', top:'2px', right:'4px', width:'6px', height:'6px', borderRadius:'50%', background: seleccionado ? 'white' : '#FFD700', display:'block' }} />}
                </div>
              )
            })}
          </div>
        </div>

        {diaSeleccionado && (
          <div style={{ background:th.bgCard, borderRadius:'20px', padding:'16px', boxShadow:th.sombra }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
              <span style={{ fontSize:'14px', fontWeight:'600', color:th.texto }}>{diaSeleccionado} de {MESES[mes]}</span>
              <button onClick={() => { setMostrarForm(true); setGrupoSeleccionado({ id:'personal', nombre:'Personal' }) }} style={{ fontSize:'12px', padding:'6px 14px', borderRadius:'20px', background:th.acento, color:'white', border:'none', cursor:'pointer', fontWeight:'600' }}>+ agregar</button>
            </div>

            {tareasDia.length === 0 && !mostrarForm && (
              <div style={{ textAlign:'center', color:th.textoSub, fontSize:'13px', padding:'20px 0' }}>Sin pendientes este día</div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom: mostrarForm ? '16px' : '0' }}>
              {tareasDia.map((t, i) => (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: colores[i % colores.length], flexShrink:0 }} />
                  <span style={{ fontSize:'14px', color:th.texto, flex:1 }}>{t.texto}</span>
                  <span style={{ fontSize:'11px', color:th.textoSub, background:`${th.acento}18`, padding:'2px 8px', borderRadius:'10px' }}>{t.pizarron}</span>
                </div>
              ))}
            </div>

            {mostrarForm && (
              <div style={{ borderTop: tareasDia.length > 0 ? `0.5px solid ${th.borde}` : 'none', paddingTop: tareasDia.length > 0 ? '14px' : '0' }}>
                <input
                  autoFocus
                  placeholder="¿Qué tienes pendiente?"
                  value={nuevaTarea}
                  onChange={e => setNuevaTarea(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && guardarTarea()}
                  style={{ width:'100%', padding:'12px 14px', borderRadius:'12px', border:`1.5px solid ${th.acento}`, background:th.bg, color:th.texto, fontSize:'14px', outline:'none', boxSizing:'border-box', marginBottom:'12px' }}
                />
                <div onClick={() => setMostrarSelectorGrupo(true)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:`${th.acento}11`, borderRadius:'12px', cursor:'pointer', marginBottom:'12px' }}>
                  <div>
                    <div style={{ fontSize:'10px', color:th.textoSub, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'2px' }}>Guardar en</div>
                    <div style={{ fontSize:'14px', fontWeight:'600', color:th.acento }}>{grupoSeleccionado.nombre}</div>
                  </div>
                  <span style={{ color:th.textoSub, fontSize:'16px' }}>›</span>
                </div>
                <div style={{ display:'flex', gap:'8px' }}>
                  <button onClick={guardarTarea} disabled={cargando || !nuevaTarea.trim()} style={{ flex:1, padding:'11px', background:th.acento, color:'white', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:'600', cursor:'pointer', opacity: !nuevaTarea.trim() ? 0.5 : 1 }}>{cargando ? '...' : 'Guardar'}</button>
                  <button onClick={() => { setMostrarForm(false); setNuevaTarea('') }} style={{ padding:'11px 16px', background:'transparent', color:th.textoSub, border:`0.5px solid ${th.borde}`, borderRadius:'12px', fontSize:'14px', cursor:'pointer' }}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {mostrarSelectorGrupo && (
        <div onClick={() => setMostrarSelectorGrupo(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:300 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:th.bgCard, borderRadius:'20px 20px 0 0', padding:'20px', width:'100%', maxWidth:'400px', paddingBottom:'40px' }}>
            <div style={{ fontSize:'13px', fontWeight:'600', color:th.textoSub, textAlign:'center', marginBottom:'16px', textTransform:'uppercase', letterSpacing:'0.06em' }}>¿En qué pizarrón?</div>
            {grupos.map((g, i) => (
              <div key={g.id} onClick={() => { setGrupoSeleccionado(g); setMostrarSelectorGrupo(false) }} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderRadius:'12px', marginBottom:'4px', background: grupoSeleccionado.id===g.id ? `${th.acento}15` : 'transparent', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:`${colores[i % colores.length]}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700', color: colores[i % colores.length] }}>{g.nombre[0]}</div>
                  <span style={{ fontSize:'15px', color:th.texto }}>{g.nombre}</span>
                </div>
                {grupoSeleccionado.id===g.id && <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:th.acento, display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'white' }} /></div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
