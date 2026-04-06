import { useState, useRef, useEffect } from 'react'
import { db } from './firebase'
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_LARGO = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const DIAS_CORTO = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function generarId() { return Math.random().toString(36).substr(2, 9) }
function hoyISO() { const h = new Date(); return `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,'0')}-${String(h.getDate()).padStart(2,'0')}` }
function fechaISO(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
function sumarDias(iso, n) { const d = new Date(iso+'T12:00:00'); d.setDate(d.getDate()+n); return fechaISO(d) }
function parseFecha(iso) { return new Date(iso+'T12:00:00') }
function formatearFechaLarga(iso) {
  if (!iso) return ''
  const d = parseFecha(iso)
  return `${DIAS_LARGO[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} ${d.getFullYear()}`
}
function formatearHora(h) {
  if (!h) return ''
  const [hh, mm] = h.split(':')
  const h12 = parseInt(hh) % 12 || 12
  return `${h12}:${mm} ${parseInt(hh) < 12 ? 'am' : 'pm'}`
}

function SelectorFecha({ value, onChange }) {
  const fecha = value ? parseFecha(value) : new Date()
  const [mes, setMes] = useState(fecha.getMonth())
  const [anio, setAnio] = useState(fecha.getFullYear())
  const hoy = hoyISO()
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()
  const primerDia = new Date(anio, mes, 1).getDay()

  function mesAnterior() { if (mes === 0) { setMes(11); setAnio(a => a-1) } else setMes(m => m-1) }
  function mesSiguiente() { if (mes === 11) { setMes(0); setAnio(a => a+1) } else setMes(m => m+1) }
  function seleccionar(dia) {
    onChange(`${anio}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`)
  }

  const celdas = []
  for (let i = 0; i < primerDia; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d)

  return (
    <div style={{ background:'#f8f8f8', border:'1.5px solid #e5e5e5', borderRadius:'14px', padding:'12px', userSelect:'none' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
        <button onClick={mesAnterior} style={{ background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#185FA5', padding:'2px 10px' }}>‹</button>
        <span style={{ fontWeight:'700', fontSize:'14px', color:'#2C2C2A' }}>{MESES[mes]} {anio}</span>
        <button onClick={mesSiguiente} style={{ background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#185FA5', padding:'2px 10px' }}>›</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px', marginBottom:'4px' }}>
        {['D','L','M','M','J','V','S'].map((d,i) => (
          <div key={i} style={{ textAlign:'center', fontSize:'11px', fontWeight:'600', color:'#aaa', padding:'4px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px' }}>
        {celdas.map((dia, i) => {
          if (!dia) return <div key={i} />
          const iso = `${anio}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
          const sel = iso === value
          const esHoy = iso === hoy
          return (
            <button key={i} onClick={() => seleccionar(dia)}
              style={{ width:'100%', aspectRatio:'1', border:'none', borderRadius:'50%', cursor:'pointer', fontSize:'13px', fontWeight: sel||esHoy ? '700':'400', background: sel?'#185FA5': esHoy?'#E6F1FB':'transparent', color: sel?'white': esHoy?'#185FA5':'#2C2C2A' }}>
              {dia}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ListaTareas({ onVolver, userId }) {
  const hoyStr = hoyISO()
  const [diaActivo, setDiaActivo] = useState(hoyStr)
  const [tareas, setTareas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [quickText, setQuickText] = useState('')
  const [modalAgregar, setModalAgregar] = useState(false)
  const [modalEditar, setModalEditar] = useState(null)
  const [menuTarea, setMenuTarea] = useState(null)
  const [confirmEliminar, setConfirmEliminar] = useState(null)
  const [modalTexto, setModalTexto] = useState('')
  const [modalFecha, setModalFecha] = useState(hoyStr)
  const [modalHora, setModalHora] = useState('')
  const quickInputRef = useRef(null)

  const tareasRef = userId ? collection(db, 'users', userId, 'tareas') : null

  useEffect(() => {
    if (!tareasRef) return
    const unsub = onSnapshot(tareasRef, snap => {
      setTareas(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setCargando(false)
    })
    return () => unsub()
  }, [userId])

  const tareasDelDia = tareas.filter(t => t.fecha === diaActivo)
  const pendientes = tareasDelDia.filter(t => !t.done).sort((a,b) => (a.orden||0)-(b.orden||0))
  const completadas = tareasDelDia.filter(t => t.done).sort((a,b) => (a.completadoEn||0)-(b.completadoEn||0))
  const diasNav = [-1,0,1].map(n => sumarDias(diaActivo, n))

  function irDia(iso) { setDiaActivo(iso); setMenuTarea(null) }
  function diaAnterior() { setDiaActivo(prev => sumarDias(prev,-1)); setMenuTarea(null) }
  function diaSiguiente() { setDiaActivo(prev => sumarDias(prev,1)); setMenuTarea(null) }
  function irHoy() { setDiaActivo(hoyStr); setMenuTarea(null) }

  async function quickAdd() {
    const txt = quickText.trim()
    if (!txt || !tareasRef) return
    await setDoc(doc(tareasRef, generarId()), { texto:txt, fecha:diaActivo, hora:'', done:false, arrastrada:false, orden:pendientes.length })
    setQuickText('')
    quickInputRef.current?.focus()
  }

  function abrirModalAgregar() { setModalTexto(''); setModalFecha(diaActivo); setModalHora(''); setModalAgregar(true) }

  async function guardarAgregar() {
    if (!modalTexto.trim() || !modalFecha || !tareasRef) return
    await setDoc(doc(tareasRef, generarId()), { texto:modalTexto.trim(), fecha:modalFecha, hora:modalHora, done:false, arrastrada:false, orden:tareas.filter(t=>t.fecha===modalFecha&&!t.done).length })
    setModalAgregar(false)
  }

  function abrirEditar(t) { setMenuTarea(null); setModalEditar(t); setModalTexto(t.texto); setModalFecha(t.fecha||diaActivo); setModalHora(t.hora||'') }

  async function guardarEditar() {
    if (!modalTexto.trim() || !modalFecha || !tareasRef) return
    await setDoc(doc(tareasRef, modalEditar.id), { ...modalEditar, texto:modalTexto.trim(), fecha:modalFecha, hora:modalHora })
    setModalEditar(null)
  }

  async function toggleDone(tarea) {
    if (!tareasRef) return
    await setDoc(doc(tareasRef, tarea.id), { ...tarea, done:!tarea.done, completadoEn: !tarea.done ? Date.now() : null })
  }

  function pedirEliminar(t) { setMenuTarea(null); setConfirmEliminar(t) }

  async function ejecutarEliminar() {
    if (!confirmEliminar || !tareasRef) return
    await deleteDoc(doc(tareasRef, confirmEliminar.id))
    setConfirmEliminar(null)
  }

  const inp = { width:'100%', padding:'12px 14px', border:'1.5px solid #ddd', borderRadius:'12px', fontSize:'16px', outline:'none', fontFamily:'inherit', boxSizing:'border-box', color:'#2C2C2A', background:'white' }

  if (cargando) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F5F5F7' }}>
      <div style={{ fontSize:'15px', color:'#aaa' }}>Cargando tareas...</div>
    </div>
  )

  return (
    <div style={{ height:'100dvh', background:'#F5F5F7', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header azul con botón Hoy integrado */}
      <div style={{ background:'#185FA5', padding:'14px 20px 12px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
          <button onClick={onVolver} style={{ background:'rgba(255,255,255,0.2)', border:'none', color:'white', borderRadius:'20px', padding:'6px 14px', cursor:'pointer', fontSize:'14px' }}>‹ Atrás</button>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            {diaActivo !== hoyStr && (
              <button onClick={irHoy} style={{ background:'white', color:'#185FA5', border:'none', borderRadius:'16px', padding:'6px 14px', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>
                Hoy
              </button>
            )}
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'30px', fontWeight:'600', color:'white', lineHeight:1 }}>{pendientes.length}</div>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)' }}>pendientes</div>
            </div>
          </div>
        </div>
        <div style={{ fontSize:'20px', fontWeight:'600', color:'white' }}>Mis Tareas</div>
        <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.7)', marginTop:'2px' }}>{formatearFechaLarga(diaActivo)}</div>
      </div>

      {/* Barra 3 días */}
      <div style={{ background:'#0C447C', display:'flex', alignItems:'center', padding:'8px 12px', gap:'6px', flexShrink:0 }}>
        <button onClick={diaAnterior} style={{ width:'38px', height:'38px', borderRadius:'10px', background:'rgba(255,255,255,0.2)', border:'none', color:'white', fontSize:'22px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>‹</button>
        <div style={{ flex:1, display:'flex', gap:'6px' }}>
          {diasNav.map(iso => {
            const d = parseFecha(iso)
            const esActivo = iso === diaActivo
            const esHoy = iso === hoyStr
            return (
              <button key={iso} onClick={() => irDia(iso)}
                style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'6px 4px', border:'none', cursor:'pointer', background: esActivo?'rgba(255,255,255,0.2)':'transparent', borderRadius:'10px', outline: esActivo?'1.5px solid rgba(255,255,255,0.4)':'none', outlineOffset:'-1px' }}>
                <span style={{ fontSize:'9px', fontWeight:'700', color: esActivo?'white':'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.06em', lineHeight:1.4 }}>
                  {esHoy ? 'HOY' : DIAS_CORTO[d.getDay()]}
                </span>
                <span style={{ fontSize:'22px', fontWeight: esActivo?'700':'400', color: esActivo?'white':'rgba(255,255,255,0.5)', lineHeight:1.2 }}>
                  {d.getDate()}
                </span>
                <span style={{ fontSize:'9px', color: esActivo?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.3)' }}>
                  {MESES[d.getMonth()].slice(0,3)}
                </span>
              </button>
            )
          })}
        </div>
        <button onClick={diaSiguiente} style={{ width:'38px', height:'38px', borderRadius:'10px', background:'rgba(255,255,255,0.2)', border:'none', color:'white', fontSize:'22px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>›</button>
      </div>

      {/* Lista */}
      <div style={{ flex:1, overflowY:'auto', paddingBottom:'80px' }}>
        <div style={{ padding:'10px 20px 6px', background:'#F5F5F7', borderBottom:'0.5px solid #e5e5e5' }}>
          <span style={{ fontSize:'11px', fontWeight:'600', color:'#aaa', letterSpacing:'0.08em', textTransform:'uppercase' }}>Pendientes</span>
        </div>

        {pendientes.length === 0 && (
          <div style={{ padding:'40px 20px', textAlign:'center', color:'#bbb', fontSize:'15px' }}>
            {diaActivo === hoyStr ? 'Sin tareas pendientes hoy 🎉' : 'Sin tareas para este día'}
          </div>
        )}

        {pendientes.map((t,i) => (
          <div key={t.id} style={{ background:'white', borderBottom:'0.5px solid #EBEBEB' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'14px 16px' }}
              onClick={() => setMenuTarea(menuTarea?.id===t.id ? null : t)}>
              <div onClick={e => { e.stopPropagation(); toggleDone(t) }}
                style={{ width:'24px', height:'24px', borderRadius:'50%', border:'2px solid #ccc', background:'white', flexShrink:0, marginTop:'1px', cursor:'pointer' }} />
              <div style={{ fontSize:'14px', color:'#bbb', flexShrink:0, minWidth:'20px', paddingTop:'3px' }}>{i+1}.</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'15px', color:'#2C2C2A', lineHeight:'1.4', wordBreak:'break-word' }}>{t.texto}</div>
                {t.hora && <div style={{ fontSize:'12px', color:'#bbb', marginTop:'3px' }}>{formatearHora(t.hora)}</div>}
              </div>
              <span style={{ fontSize:'22px', color:'#bbb', padding:'0 4px', flexShrink:0 }}>⋯</span>
            </div>
            {menuTarea?.id===t.id && (
              <div style={{ display:'flex', borderTop:'0.5px solid #f0f0f0' }}>
                <button onClick={() => abrirEditar(t)} style={{ flex:1, padding:'13px', border:'none', background:'#F0F6FF', color:'#185FA5', fontSize:'15px', fontWeight:'600', cursor:'pointer', borderRight:'0.5px solid #dde8f5' }}>✎ Editar</button>
                <button onClick={() => pedirEliminar(t)} style={{ flex:1, padding:'13px', border:'none', background:'#FFF0F0', color:'#A32D2D', fontSize:'15px', fontWeight:'600', cursor:'pointer' }}>✕ Eliminar</button>
              </div>
            )}
          </div>
        ))}

        {completadas.length > 0 && (
          <>
            <div style={{ padding:'10px 20px 6px', background:'#F5F5F7', borderTop:'0.5px solid #e5e5e5', borderBottom:'0.5px solid #e5e5e5' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'#aaa', letterSpacing:'0.08em', textTransform:'uppercase' }}>Completadas</span>
            </div>
            {completadas.map(t => (
              <div key={t.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', background:'#FAFAFA', borderBottom:'0.5px solid #EBEBEB' }}
                onClick={() => toggleDone(t)}>
                <div style={{ width:'24px', height:'24px', borderRadius:'50%', background:'#185FA5', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                  <span style={{ color:'white', fontSize:'13px' }}>✓</span>
                </div>
                <div style={{ flex:1, fontSize:'15px', color:'#aaa', textDecoration:'line-through', wordBreak:'break-word', cursor:'pointer' }}>{t.texto}</div>
                <button onClick={e => { e.stopPropagation(); pedirEliminar(t) }} style={{ background:'none', border:'none', color:'#ccc', fontSize:'18px', cursor:'pointer' }}>✕</button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Barra agregar fija */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'white', borderTop:'1px solid #e5e5e5', padding:'10px 16px', display:'flex', alignItems:'center', gap:'8px', zIndex:50 }}>
        <button onClick={abrirModalAgregar} style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#185FA5', border:'none', color:'white', fontSize:'24px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>+</button>
        <input ref={quickInputRef} value={quickText} onChange={e => setQuickText(e.target.value)} onKeyDown={e => e.key==='Enter' && quickAdd()}
          placeholder="Nueva tarea rápida..."
          style={{ flex:1, padding:'10px 14px', border:'1.5px solid #e5e5e5', borderRadius:'12px', fontSize:'15px', outline:'none', fontFamily:'inherit', background:'#FAFAFA', color:'#2C2C2A' }} />
        <button onClick={quickAdd} style={{ padding:'10px 16px', background:'#185FA5', color:'white', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:'600', cursor:'pointer', flexShrink:0 }}>Agregar</button>
      </div>

      {/* Modal agregar — scroll interno, abre desde arriba */}
      {modalAgregar && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, overflowY:'auto' }}
          onClick={e => { if (e.target===e.currentTarget) setModalAgregar(false) }}>
          <div style={{ background:'white', borderRadius:'20px', width:'calc(100% - 32px)', maxWidth:'500px', margin:'20px auto', padding:'24px 20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <div style={{ fontSize:'18px', fontWeight:'600', color:'#2C2C2A' }}>Nueva tarea</div>
              <button onClick={() => setModalAgregar(false)} style={{ background:'#f0f0f0', border:'none', borderRadius:'50%', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px', color:'#666' }}>✕</button>
            </div>
            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'13px', fontWeight:'500', color:'#666', marginBottom:'6px' }}>Tarea *</div>
              <input autoFocus value={modalTexto} onChange={e => setModalTexto(e.target.value)} placeholder="¿Qué tienes que hacer?" style={inp} />
            </div>
            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'13px', fontWeight:'500', color:'#666', marginBottom:'8px' }}>Fecha *</div>
              <SelectorFecha value={modalFecha} onChange={setModalFecha} />
            </div>
            <div style={{ marginBottom:'24px' }}>
              <div style={{ fontSize:'13px', fontWeight:'500', color:'#666', marginBottom:'6px' }}>Hora (opcional)</div>
              <input type="time" value={modalHora} onChange={e => setModalHora(e.target.value)} style={inp} />
            </div>
            <button onClick={guardarAgregar}
              style={{ width:'100%', padding:'15px', background: modalTexto.trim()&&modalFecha?'#185FA5':'#e5e5e5', color: modalTexto.trim()&&modalFecha?'white':'#aaa', border:'none', borderRadius:'14px', fontSize:'16px', fontWeight:'600', cursor:'pointer' }}>
              Agregar tarea
            </button>
          </div>
        </div>
      )}

      {/* Modal editar — scroll interno, abre desde arriba */}
      {modalEditar && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, overflowY:'auto' }}
          onClick={e => { if (e.target===e.currentTarget) setModalEditar(null) }}>
          <div style={{ background:'white', borderRadius:'20px', width:'calc(100% - 32px)', maxWidth:'500px', margin:'20px auto', padding:'24px 20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <div style={{ fontSize:'18px', fontWeight:'600', color:'#2C2C2A' }}>Editar tarea</div>
              <button onClick={() => setModalEditar(null)} style={{ background:'#f0f0f0', border:'none', borderRadius:'50%', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px', color:'#666' }}>✕</button>
            </div>
            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'13px', fontWeight:'500', color:'#666', marginBottom:'6px' }}>Tarea *</div>
              <input autoFocus value={modalTexto} onChange={e => setModalTexto(e.target.value)} style={inp} />
            </div>
            <div style={{ marginBottom:'16px' }}>
              <div style={{ fontSize:'13px', fontWeight:'500', color:'#666', marginBottom:'8px' }}>Fecha *</div>
              <SelectorFecha value={modalFecha} onChange={setModalFecha} />
            </div>
            <div style={{ marginBottom:'24px' }}>
              <div style={{ fontSize:'13px', fontWeight:'500', color:'#666', marginBottom:'6px' }}>Hora (opcional)</div>
              <input type="time" value={modalHora} onChange={e => setModalHora(e.target.value)} style={inp} />
            </div>
            <button onClick={guardarEditar}
              style={{ width:'100%', padding:'15px', background: modalTexto.trim()&&modalFecha?'#185FA5':'#e5e5e5', color: modalTexto.trim()&&modalFecha?'white':'#aaa', border:'none', borderRadius:'14px', fontSize:'16px', fontWeight:'600', cursor:'pointer' }}>
              Guardar cambios
            </button>
          </div>
        </div>
      )}

      {/* Confirmar eliminar */}
      {confirmEliminar && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'24px' }}>
          <div style={{ background:'white', borderRadius:'20px', padding:'32px 24px', width:'100%', maxWidth:'320px', textAlign:'center' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>🗑️</div>
            <div style={{ fontSize:'17px', fontWeight:'700', color:'#2C2C2A', marginBottom:'8px' }}>¿Eliminar esta tarea?</div>
            <div style={{ fontSize:'14px', color:'#555', marginBottom:'28px', lineHeight:'1.5' }}>"{confirmEliminar.texto}"</div>
            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={() => setConfirmEliminar(null)} style={{ flex:1, padding:'14px', background:'#E0E0E0', border:'none', borderRadius:'14px', cursor:'pointer', fontSize:'15px', fontWeight:'700', color:'#333' }}>Cancelar</button>
              <button onClick={ejecutarEliminar} style={{ flex:1, padding:'14px', background:'#A32D2D', border:'none', borderRadius:'14px', cursor:'pointer', fontSize:'15px', color:'white', fontWeight:'700' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
