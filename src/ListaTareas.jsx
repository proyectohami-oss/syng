import { useState, useRef, useEffect } from 'react'
import { db } from './firebase'
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_LARGO = ['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado']
const DIAS_CORTO = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab']

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
  const diasEnMes = new Date(anio, mes+1, 0).getDate()
  const primerDia = new Date(anio, mes, 1).getDay()
  function mesAnterior() { if(mes===0){setMes(11);setAnio(a=>a-1)}else setMes(m=>m-1) }
  function mesSiguiente() { if(mes===11){setMes(0);setAnio(a=>a+1)}else setMes(m=>m+1) }
  function seleccionar(dia) { onChange(`${anio}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`) }
  const celdas = []
  for(let i=0;i<primerDia;i++) celdas.push(null)
  for(let d=1;d<=diasEnMes;d++) celdas.push(d)
  return (
    <div style={{background:'#f8f8f8',border:'1.5px solid #e5e5e5',borderRadius:'14px',padding:'10px',userSelect:'none'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
        <button onClick={mesAnterior} style={{background:'none',border:'none',fontSize:'20px',cursor:'pointer',color:'#185FA5',padding:'2px 8px'}}>&#8249;</button>
        <span style={{fontWeight:'700',fontSize:'13px',color:'#2C2C2A'}}>{MESES[mes]} {anio}</span>
        <button onClick={mesSiguiente} style={{background:'none',border:'none',fontSize:'20px',cursor:'pointer',color:'#185FA5',padding:'2px 8px'}}>&#8250;</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'1px',marginBottom:'2px'}}>
        {['D','L','M','M','J','V','S'].map((d,i)=>(
          <div key={i} style={{textAlign:'center',fontSize:'10px',fontWeight:'600',color:'#aaa',padding:'2px 0'}}>{d}</div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px'}}>
        {celdas.map((dia,i)=>{
          if(!dia) return <div key={i}/>
          const iso=`${anio}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
          const sel=iso===value, esHoy=iso===hoy
          return(
            <button key={i} onClick={()=>seleccionar(dia)}
              style={{width:'100%',aspectRatio:'1',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:'12px',fontWeight:sel||esHoy?'700':'400',background:sel?'#185FA5':esHoy?'#E6F1FB':'transparent',color:sel?'white':esHoy?'#185FA5':'#2C2C2A'}}>
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
  const [menuTareaId, setMenuTareaId] = useState(null)
  const [confirmEliminar, setConfirmEliminar] = useState(null)
  const [modalTexto, setModalTexto] = useState('')
  const [modalFecha, setModalFecha] = useState(hoyStr)
  const [modalHora, setModalHora] = useState('')
  const [seleccionMode, setSeleccionMode] = useState(false)
  const [seleccionados, setSeleccionados] = useState([])
  const [confirmEliminarMultiple, setConfirmEliminarMultiple] = useState(false)
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const longPressRef = useRef(null)
  const quickInputRef = useRef(null)
  const touchItem = useRef(null)
  const touchMoved = useRef(false)

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

  function irDia(iso) { setDiaActivo(iso); setMenuTareaId(null); setSeleccionMode(false); setSeleccionados([]) }
  function diaAnterior() { irDia(sumarDias(diaActivo,-1)) }
  function diaSiguiente() { irDia(sumarDias(diaActivo,1)) }
  function irHoy() { irDia(hoyStr) }

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

  function abrirEditar(t) { setMenuTareaId(null); setModalEditar(t); setModalTexto(t.texto); setModalFecha(t.fecha||diaActivo); setModalHora(t.hora||'') }

  async function guardarEditar() {
    if (!modalTexto.trim() || !modalFecha || !tareasRef) return
    await setDoc(doc(tareasRef, modalEditar.id), { ...modalEditar, texto:modalTexto.trim(), fecha:modalFecha, hora:modalHora })
    setModalEditar(null)
  }

  async function toggleDone(tarea) {
    if (!tareasRef) return
    await setDoc(doc(tareasRef, tarea.id), { ...tarea, done:!tarea.done, completadoEn: !tarea.done ? Date.now() : null })
  }

  function pedirEliminar(t) { setMenuTareaId(null); setConfirmEliminar(t) }

  async function ejecutarEliminar() {
    if (!confirmEliminar || !tareasRef) return
    await deleteDoc(doc(tareasRef, confirmEliminar.id))
    setConfirmEliminar(null)
  }

  async function ejecutarEliminarMultiple() {
    if (!tareasRef) return
    for (const id of seleccionados) await deleteDoc(doc(tareasRef, id))
    setSeleccionados([]); setSeleccionMode(false); setConfirmEliminarMultiple(false)
  }

  function toggleSeleccion(id) {
    setSeleccionados(prev => prev.includes(id) ? prev.filter(i=>i!==id) : [...prev, id])
  }

  function onTouchStartItem(e, id) {
    touchMoved.current = false
    touchItem.current = id
    longPressRef.current = setTimeout(() => {
      if (!touchMoved.current) { setSeleccionMode(true); setSeleccionados([id]) }
    }, 600)
  }

  function onTouchMoveItem(e) {
    touchMoved.current = true
    clearTimeout(longPressRef.current)
    if (!touchItem.current || !draggingId) {
      setDraggingId(touchItem.current)
    }
    const touch = e.touches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const row = el?.closest('[data-tarea-id]')
    if (row && row.dataset.tareaId !== touchItem.current) {
      setDragOverId(row.dataset.tareaId)
    }
  }

  async function onTouchEndItem() {
    clearTimeout(longPressRef.current)
    if (draggingId && dragOverId && draggingId !== dragOverId && tareasRef) {
      const pend = [...pendientes]
      const fi = pend.findIndex(t=>t.id===draggingId)
      const ti = pend.findIndex(t=>t.id===dragOverId)
      if (fi>=0 && ti>=0) {
        const [item] = pend.splice(fi,1); pend.splice(ti,0,item)
        for (let i=0; i<pend.length; i++) {
          await setDoc(doc(tareasRef, pend[i].id), { ...pend[i], orden:i })
        }
      }
    }
    setDraggingId(null); setDragOverId(null); touchItem.current = null
  }

  function onDragStart(id) { setDraggingId(id) }
  function onDragOver(e, id) { e.preventDefault(); setDragOverId(id) }
  async function onDrop(e, toId) {
    e.preventDefault()
    if (!draggingId || draggingId===toId || !tareasRef) { setDraggingId(null); setDragOverId(null); return }
    const pend = [...pendientes]
    const fi = pend.findIndex(t=>t.id===draggingId), ti = pend.findIndex(t=>t.id===toId)
    if (fi>=0 && ti>=0) {
      const [item] = pend.splice(fi,1); pend.splice(ti,0,item)
      for (let i=0; i<pend.length; i++) await setDoc(doc(tareasRef, pend[i].id), { ...pend[i], orden:i })
    }
    setDraggingId(null); setDragOverId(null)
  }
  function onDragEnd() { setDraggingId(null); setDragOverId(null) }

  const inp = { width:'100%', padding:'11px 13px', border:'1.5px solid #ddd', borderRadius:'12px', fontSize:'15px', outline:'none', fontFamily:'inherit', boxSizing:'border-box', color:'#2C2C2A', background:'white' }

  if (cargando) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F5F5F7'}}>
      <div style={{fontSize:'15px',color:'#aaa'}}>Cargando tareas...</div>
    </div>
  )

  return (
    <div style={{height:'100dvh',background:'#F5F5F7',fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif',display:'flex',flexDirection:'column',overflow:'hidden'}}>

      {/* HEADER */}
      <div style={{background:'#185FA5',padding:'14px 20px 12px',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
          <button onClick={onVolver} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'white',borderRadius:'20px',padding:'6px 14px',cursor:'pointer',fontSize:'14px'}}>&#8249; Atras</button>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'28px',fontWeight:'600',color:'white',lineHeight:1}}>{pendientes.length}</div>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.6)'}}>pendientes</div>
            {diaActivo !== hoyStr && (
              <button onClick={irHoy} style={{background:'rgba(255,255,255,0.25)',color:'white',border:'1.5px solid rgba(255,255,255,0.5)',borderRadius:'12px',padding:'3px 10px',fontSize:'11px',fontWeight:'700',cursor:'pointer',marginTop:'4px'}}>Hoy</button>
            )}
          </div>
        </div>
        <div style={{fontSize:'20px',fontWeight:'600',color:'white'}}>Mis Tareas</div>
        <div style={{fontSize:'13px',color:'rgba(255,255,255,0.7)',marginTop:'2px'}}>{formatearFechaLarga(diaActivo)}</div>
      </div>

      {/* BARRA 3 DIAS */}
      <div style={{background:'#0C447C',display:'flex',alignItems:'center',padding:'8px 12px',gap:'6px',flexShrink:0}}>
        <button onClick={diaAnterior} style={{width:'38px',height:'38px',borderRadius:'10px',background:'rgba(255,255,255,0.2)',border:'none',color:'white',fontSize:'22px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>&#8249;</button>
        <div style={{flex:1,display:'flex',gap:'6px'}}>
          {diasNav.map(iso=>{
            const d=parseFecha(iso),esActivo=iso===diaActivo,esHoy=iso===hoyStr
            return(
              <button key={iso} onClick={()=>irDia(iso)}
                style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',padding:'6px 4px',border:'none',cursor:'pointer',background:esActivo?'rgba(255,255,255,0.2)':'transparent',borderRadius:'10px',outline:esActivo?'1.5px solid rgba(255,255,255,0.4)':'none',outlineOffset:'-1px'}}>
                <span style={{fontSize:'9px',fontWeight:'700',color:esActivo?'white':'rgba(255,255,255,0.45)',textTransform:'uppercase',letterSpacing:'0.06em',lineHeight:1.4}}>{esHoy?'HOY':DIAS_CORTO[d.getDay()]}</span>
                <span style={{fontSize:'22px',fontWeight:esActivo?'700':'400',color:esActivo?'white':'rgba(255,255,255,0.5)',lineHeight:1.2}}>{d.getDate()}</span>
                <span style={{fontSize:'9px',color:esActivo?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.3)'}}>{MESES[d.getMonth()].slice(0,3)}</span>
              </button>
            )
          })}
        </div>
        <button onClick={diaSiguiente} style={{width:'38px',height:'38px',borderRadius:'10px',background:'rgba(255,255,255,0.2)',border:'none',color:'white',fontSize:'22px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>&#8250;</button>
      </div>

      {/* BARRA SELECCION MULTIPLE */}
      {seleccionMode && (
        <div style={{background:'#E6F1FB',borderBottom:'1px solid #B5D4F4',padding:'10px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
          <span style={{fontSize:'14px',color:'#0C447C',fontWeight:'600'}}>{seleccionados.length} seleccionada{seleccionados.length!==1?'s':''}</span>
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={()=>{setSeleccionMode(false);setSeleccionados([])}} style={{background:'none',border:'none',color:'#0C447C',fontSize:'14px',cursor:'pointer',padding:'4px 8px'}}>Cancelar</button>
            {seleccionados.length>0 && <button onClick={()=>setConfirmEliminarMultiple(true)} style={{background:'#A32D2D',color:'white',border:'none',borderRadius:'10px',fontSize:'13px',fontWeight:'600',cursor:'pointer',padding:'6px 14px'}}>Eliminar {seleccionados.length}</button>}
          </div>
        </div>
      )}

      {/* LISTA */}
      <div style={{flex:1,overflowY:'auto',paddingBottom:'80px'}}>
        <div style={{padding:'10px 20px 6px',background:'#F5F5F7',borderBottom:'0.5px solid #e5e5e5'}}>
          <span style={{fontSize:'11px',fontWeight:'600',color:'#aaa',letterSpacing:'0.08em',textTransform:'uppercase'}}>Pendientes</span>
          {!seleccionMode && <span style={{fontSize:'10px',color:'#ddd',fontWeight:'400'}}> · manten presionado para seleccionar</span>}
        </div>

        {pendientes.length===0 && (
          <div style={{padding:'40px 20px',textAlign:'center',color:'#bbb',fontSize:'15px'}}>
            {diaActivo===hoyStr?'Sin tareas pendientes hoy 🎉':'Sin tareas para este dia'}
          </div>
        )}

        {pendientes.map((t,i)=>(
          <div key={t.id} data-tarea-id={t.id}
            draggable={!seleccionMode}
            onDragStart={()=>onDragStart(t.id)} onDragOver={e=>onDragOver(e,t.id)} onDrop={e=>onDrop(e,t.id)} onDragEnd={onDragEnd}
            onTouchStart={e=>onTouchStartItem(e,t.id)} onTouchMove={onTouchMoveItem} onTouchEnd={onTouchEndItem}
            style={{background:dragOverId===t.id?'#dbeeff':seleccionados.includes(t.id)?'#EEF5FF':'white',borderBottom:'0.5px solid #EBEBEB',opacity:draggingId===t.id?0.4:1,borderLeft:seleccionados.includes(t.id)?'3px solid #185FA5':'3px solid transparent',transition:'background 0.15s'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:'12px',padding:'14px 16px'}}>
              <div onClick={()=>seleccionMode?toggleSeleccion(t.id):toggleDone(t)}
                style={{width:'24px',height:'24px',borderRadius:'50%',border:seleccionados.includes(t.id)?'none':'2px solid #ccc',background:seleccionados.includes(t.id)?'#185FA5':'white',flexShrink:0,marginTop:'1px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {seleccionados.includes(t.id)&&<span style={{color:'white',fontSize:'13px'}}>&#10003;</span>}
              </div>
              <div style={{fontSize:'14px',color:'#bbb',flexShrink:0,minWidth:'20px',paddingTop:'3px'}}>{i+1}.</div>
              <div style={{flex:1,minWidth:0,cursor:'pointer'}} onClick={()=>seleccionMode?toggleSeleccion(t.id):toggleDone(t)}>
                <div style={{fontSize:'15px',color:'#2C2C2A',lineHeight:'1.4',wordBreak:'break-word'}}>{t.texto}</div>
                {t.hora&&<div style={{fontSize:'12px',color:'#bbb',marginTop:'3px'}}>{formatearHora(t.hora)}</div>}
              </div>
              {!seleccionMode&&(
                <button onClick={e=>{e.stopPropagation();setMenuTareaId(menuTareaId===t.id?null:t.id)}}
                  style={{background:'none',border:'none',fontSize:'22px',color:'#bbb',cursor:'pointer',padding:'0 4px',flexShrink:0}}>&#8230;</button>
              )}
            </div>
            {menuTareaId===t.id&&(
              <div style={{display:'flex',borderTop:'0.5px solid #f0f0f0'}}>
                <button onClick={()=>abrirEditar(t)} style={{flex:1,padding:'13px',border:'none',background:'#F0F6FF',color:'#185FA5',fontSize:'15px',fontWeight:'600',cursor:'pointer',borderRight:'0.5px solid #dde8f5'}}>&#9998; Editar</button>
                <button onClick={()=>pedirEliminar(t)} style={{flex:1,padding:'13px',border:'none',background:'#FFF0F0',color:'#A32D2D',fontSize:'15px',fontWeight:'600',cursor:'pointer'}}>&#10005; Eliminar</button>
              </div>
            )}
          </div>
        ))}

        {completadas.length>0&&(
          <>
            <div style={{padding:'10px 20px 6px',background:'#F5F5F7',borderTop:'0.5px solid #e5e5e5',borderBottom:'0.5px solid #e5e5e5'}}>
              <span style={{fontSize:'11px',fontWeight:'600',color:'#aaa',letterSpacing:'0.08em',textTransform:'uppercase'}}>Completadas</span>
            </div>
            {completadas.map(t=>(
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',background:'#FAFAFA',borderBottom:'0.5px solid #EBEBEB',cursor:'pointer'}} onClick={()=>toggleDone(t)}>
                <div style={{width:'24px',height:'24px',borderRadius:'50%',background:'#185FA5',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <span style={{color:'white',fontSize:'13px'}}>&#10003;</span>
                </div>
                <div style={{flex:1,fontSize:'15px',color:'#aaa',textDecoration:'line-through',wordBreak:'break-word'}}>{t.texto}</div>
                <button onClick={e=>{e.stopPropagation();pedirEliminar(t)}} style={{background:'none',border:'none',color:'#ccc',fontSize:'18px',cursor:'pointer'}}>&#10005;</button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* BARRA AGREGAR */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'white',borderTop:'1px solid #e5e5e5',padding:'10px 16px',display:'flex',alignItems:'center',gap:'8px',zIndex:50}}>
        <input ref={quickInputRef} value={quickText} onChange={e=>setQuickText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&quickAdd()}
          placeholder="Nueva tarea... (Enter para agregar)"
          style={{flex:1,padding:'10px 14px',border:'1.5px solid #e5e5e5',borderRadius:'12px',fontSize:'15px',outline:'none',fontFamily:'inherit',background:'#FAFAFA',color:'#2C2C2A'}}/>
        <button onClick={()=>quickText.trim()?quickAdd():abrirModalAgregar()} style={{width:'36px',height:'36px',borderRadius:'50%',background:'#185FA5',border:'none',color:'white',fontSize:'24px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>+</button>
      </div>

      {/* MODAL AGREGAR - todo visible sin scroll */}
      {modalAgregar&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
          <div style={{background:'white',borderRadius:'20px',width:'100%',maxWidth:'480px',padding:'20px 18px',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
              <div style={{fontSize:'17px',fontWeight:'600',color:'#2C2C2A'}}>Nueva tarea</div>
              <button onClick={()=>setModalAgregar(false)} style={{background:'#f0f0f0',border:'none',borderRadius:'50%',width:'30px',height:'30px',cursor:'pointer',fontSize:'15px',color:'#666'}}>&#10005;</button>
            </div>
            <div style={{marginBottom:'12px'}}>
              <div style={{fontSize:'12px',fontWeight:'500',color:'#666',marginBottom:'5px'}}>Tarea *</div>
              <input value={modalTexto} onChange={e=>setModalTexto(e.target.value)} placeholder="Que tienes que hacer?" style={inp}/>
            </div>
            <div style={{marginBottom:'12px'}}>
              <div style={{fontSize:'12px',fontWeight:'500',color:'#666',marginBottom:'6px'}}>Fecha *</div>
              <SelectorFecha value={modalFecha} onChange={setModalFecha}/>
            </div>
            <div style={{marginBottom:'16px'}}>
              <div style={{fontSize:'12px',fontWeight:'500',color:'#666',marginBottom:'5px'}}>Hora (opcional)</div>
              <input type="time" value={modalHora} onChange={e=>setModalHora(e.target.value)} style={inp}/>
            </div>
            <button onClick={guardarAgregar}
              style={{width:'100%',padding:'14px',background:modalTexto.trim()&&modalFecha?'#185FA5':'#e5e5e5',color:modalTexto.trim()&&modalFecha?'white':'#aaa',border:'none',borderRadius:'14px',fontSize:'15px',fontWeight:'600',cursor:'pointer'}}>
              Agregar tarea
            </button>
          </div>
        </div>
      )}

      {/* MODAL EDITAR - todo visible sin scroll */}
      {modalEditar&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
          <div style={{background:'white',borderRadius:'20px',width:'100%',maxWidth:'480px',padding:'20px 18px',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
              <div style={{fontSize:'17px',fontWeight:'600',color:'#2C2C2A'}}>Editar tarea</div>
              <button onClick={()=>setModalEditar(null)} style={{background:'#f0f0f0',border:'none',borderRadius:'50%',width:'30px',height:'30px',cursor:'pointer',fontSize:'15px',color:'#666'}}>&#10005;</button>
            </div>
            <div style={{marginBottom:'12px'}}>
              <div style={{fontSize:'12px',fontWeight:'500',color:'#666',marginBottom:'5px'}}>Tarea *</div>
              <input value={modalTexto} onChange={e=>setModalTexto(e.target.value)} style={inp}/>
            </div>
            <div style={{marginBottom:'12px'}}>
              <div style={{fontSize:'12px',fontWeight:'500',color:'#666',marginBottom:'6px'}}>Fecha *</div>
              <SelectorFecha value={modalFecha} onChange={setModalFecha}/>
            </div>
            <div style={{marginBottom:'16px'}}>
              <div style={{fontSize:'12px',fontWeight:'500',color:'#666',marginBottom:'5px'}}>Hora (opcional)</div>
              <input type="time" value={modalHora} onChange={e=>setModalHora(e.target.value)} style={inp}/>
            </div>
            <button onClick={guardarEditar}
              style={{width:'100%',padding:'14px',background:modalTexto.trim()&&modalFecha?'#185FA5':'#e5e5e5',color:modalTexto.trim()&&modalFecha?'white':'#aaa',border:'none',borderRadius:'14px',fontSize:'15px',fontWeight:'600',cursor:'pointer'}}>
              Guardar cambios
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMAR ELIMINAR */}
      {confirmEliminar&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:'24px'}}>
          <div style={{background:'white',borderRadius:'20px',padding:'28px 22px',width:'100%',maxWidth:'320px',textAlign:'center'}}>
            <div style={{fontSize:'36px',marginBottom:'10px'}}>&#128465;</div>
            <div style={{fontSize:'16px',fontWeight:'700',color:'#2C2C2A',marginBottom:'8px'}}>Eliminar esta tarea?</div>
            <div style={{fontSize:'14px',color:'#555',marginBottom:'24px',lineHeight:'1.5'}}>"{confirmEliminar.texto}"</div>
            <div style={{display:'flex',gap:'12px'}}>
              <button onClick={()=>setConfirmEliminar(null)} style={{flex:1,padding:'13px',background:'#E0E0E0',border:'none',borderRadius:'14px',cursor:'pointer',fontSize:'14px',fontWeight:'700',color:'#333'}}>Cancelar</button>
              <button onClick={ejecutarEliminar} style={{flex:1,padding:'13px',background:'#A32D2D',border:'none',borderRadius:'14px',cursor:'pointer',fontSize:'14px',color:'white',fontWeight:'700'}}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMAR ELIMINAR MULTIPLE */}
      {confirmEliminarMultiple&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:'24px'}}>
          <div style={{background:'white',borderRadius:'20px',padding:'28px 22px',width:'100%',maxWidth:'320px',textAlign:'center'}}>
            <div style={{fontSize:'36px',marginBottom:'10px'}}>&#128465;</div>
            <div style={{fontSize:'16px',fontWeight:'700',color:'#2C2C2A',marginBottom:'8px'}}>Eliminar {seleccionados.length} tarea{seleccionados.length!==1?'s':''}?</div>
            <div style={{fontSize:'14px',color:'#555',marginBottom:'24px'}}>Esta accion no se puede deshacer.</div>
            <div style={{display:'flex',gap:'12px'}}>
              <button onClick={()=>setConfirmEliminarMultiple(false)} style={{flex:1,padding:'13px',background:'#E0E0E0',border:'none',borderRadius:'14px',cursor:'pointer',fontSize:'14px',fontWeight:'700',color:'#333'}}>Cancelar</button>
              <button onClick={ejecutarEliminarMultiple} style={{flex:1,padding:'13px',background:'#A32D2D',border:'none',borderRadius:'14px',cursor:'pointer',fontSize:'14px',color:'white',fontWeight:'700'}}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
