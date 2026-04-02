import { useState, useRef } from 'react'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const DIAS_LARGO = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']

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
  if (!h) return 'Sin hora'
  const [hh, mm] = h.split(':')
  const h12 = parseInt(hh) % 12 || 12
  return `${h12}:${mm} ${parseInt(hh) < 12 ? 'am' : 'pm'}`
}

function TaskRow({ tarea, num, selectMode, isSelected, onToggleDone, onToggleSelect, onEdit, onDeleteOne, onDragStart, onDragOver, onDrop, onDragEnd, isDragOver, isDragging }) {
  const rowRef = useRef(null)
  const startXRef = useRef(null)
  const swipeRef = useRef(0)
  const trackingRef = useRef(false)
  const longPressRef = useRef(null)
  const movedRef = useRef(false)
  const FULL = 144, HALF = 72

  function applySwipe(x, animated = true) {
    if (!rowRef.current) return
    rowRef.current.style.transition = animated ? 'transform 0.25s cubic-bezier(.4,0,.2,1)' : 'none'
    rowRef.current.style.transform = `translateX(${x}px)`
    swipeRef.current = x
  }

  function onMouseDown(e) { if (e.target.closest('button') || tarea.done) return; startXRef.current = e.clientX; movedRef.current = false }
  function onMouseMove(e) {
    if (startXRef.current === null) return
    const dx = e.clientX - startXRef.current
    if (Math.abs(dx) > 6) { movedRef.current = true; applySwipe(Math.max(-FULL, Math.min(0, dx + swipeRef.current)), false) }
  }
  function onMouseUp(e) {
    if (startXRef.current === null) return; startXRef.current = null
    if (!movedRef.current) return
    const t = swipeRef.current
    if (t < -100) applySwipe(-FULL); else if (t < -40) applySwipe(-HALF); else applySwipe(0)
  }
  function onTouchStart(e) {
    if (tarea.done) return
    startXRef.current = e.touches[0].clientX; trackingRef.current = true; movedRef.current = false
    longPressRef.current = setTimeout(() => { if (!movedRef.current) onToggleSelect() }, 700)
  }
  function onTouchMove(e) {
    if (!trackingRef.current) return
    const dx = e.touches[0].clientX - startXRef.current
    if (Math.abs(dx) > 8) { movedRef.current = true; clearTimeout(longPressRef.current); applySwipe(Math.max(-FULL, Math.min(0, dx + swipeRef.current)), false) }
  }
  function onTouchEnd() {
    clearTimeout(longPressRef.current); if (!trackingRef.current) return; trackingRef.current = false
    const t = swipeRef.current
    if (t < -100) applySwipe(-FULL); else if (t < -40) applySwipe(-HALF); else applySwipe(0)
  }
  function onCheckDown(e) { e.stopPropagation(); movedRef.current = false; longPressRef.current = setTimeout(() => { if (!movedRef.current) onToggleSelect() }, 700) }
  function onCheckUp() { clearTimeout(longPressRef.current) }
  function onCheckMove() { movedRef.current = true; clearTimeout(longPressRef.current) }

  return (
    <div style={{ position:'relative', overflow:'hidden', borderBottom:'0.5px solid #EBEBEB' }}>
      <div style={{ position:'absolute', top:0, right:0, bottom:0, display:'flex' }}>
        <button onClick={() => { applySwipe(0); setTimeout(onEdit, 260) }}
          style={{ width:'72px', background:'#185FA5', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'3px' }}>
          <span style={{ fontSize:'18px', color:'white' }}>✎</span>
          <span style={{ fontSize:'10px', color:'white', fontWeight:'500' }}>Editar</span>
        </button>
        <button onClick={() => { applySwipe(0); setTimeout(onDeleteOne, 260) }}
          style={{ width:'72px', background:'#A32D2D', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'3px' }}>
          <span style={{ fontSize:'18px', color:'white' }}>✕</span>
          <span style={{ fontSize:'10px', color:'white', fontWeight:'500' }}>Eliminar</span>
        </button>
      </div>
      <div ref={rowRef}
        draggable={!tarea.done && !selectMode}
        onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{ display:'flex', alignItems:'flex-start', gap:'8px', padding:'12px 16px', background: isSelected ? '#E6F1FB' : tarea.done ? '#FAFAFA' : 'white', position:'relative', userSelect:'none', cursor: tarea.done ? 'default' : 'grab', opacity: isDragging ? 0.35 : 1 }}>
        {isDragOver && <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'#534AB7', borderRadius:'2px' }} />}
        {selectMode ? (
          <div onClick={e => { e.stopPropagation(); onToggleSelect() }}
            style={{ width:'20px', height:'20px', borderRadius:'50%', border: isSelected ? 'none' : '1.5px solid #ccc', background: isSelected ? '#185FA5' : 'white', flexShrink:0, marginTop:'2px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            {isSelected && <span style={{ color:'white', fontSize:'11px' }}>✓</span>}
          </div>
        ) : (
          <div onClick={e => { e.stopPropagation(); if (!movedRef.current) onToggleDone() }}
            onMouseDown={onCheckDown} onMouseUp={onCheckUp} onMouseMove={onCheckMove}
            style={{ width:'20px', height:'20px', borderRadius:'50%', border: tarea.done ? 'none' : '1.5px solid #ccc', background: tarea.done ? '#185FA5' : 'white', flexShrink:0, marginTop:'2px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.15s' }}>
            {tarea.done && <span style={{ color:'white', fontSize:'11px' }}>✓</span>}
          </div>
        )}
        <div style={{ fontSize:'14px', color:'#bbb', minWidth:'20px', lineHeight:'1.5', flexShrink:0 }}>
          {tarea.done ? '–' : `${num}.`}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'14px', lineHeight:'1.5', color: tarea.done ? '#aaa' : '#2C2C2A', textDecoration: tarea.done ? 'line-through' : 'none', textDecorationThickness:'1px', wordBreak:'break-word', textAlign:'left' }}>
            {tarea.texto}
          </div>
          <div style={{ fontSize:'11px', color:'#bbb', marginTop:'2px', display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
            <span>{formatearHora(tarea.hora)}</span>
            {tarea.arrastrada && <span style={{ fontSize:'10px', fontWeight:'500', padding:'1px 7px', borderRadius:'20px', background:'#FAEEDA', color:'#633806' }}>Arrastrada de ayer</span>}
          </div>
        </div>
        {!tarea.done && !selectMode && (
          <div style={{ display:'flex', flexDirection:'column', gap:'3px', paddingTop:'4px', opacity:0.2, flexShrink:0 }}>
            {[0,1,2].map(i => <span key={i} style={{ display:'block', width:'14px', height:'1.5px', background:'#2C2C2A', borderRadius:'2px' }} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ListaTareas({ onVolver }) {
  const hoyStr = hoyISO()
  const [diaActivo, setDiaActivo] = useState(hoyStr)
  const [tareas, setTareas] = useState([])
  const [quickText, setQuickText] = useState('')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [dragOverId, setDragOverId] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const [modalAgregar, setModalAgregar] = useState(false)
  const [modalEditar, setModalEditar] = useState(null)
  const [confirmEliminar, setConfirmEliminar] = useState(null)
  const [modalTexto, setModalTexto] = useState('')
  const [modalFecha, setModalFecha] = useState(hoyStr)
  const [modalHora, setModalHora] = useState('')
  const quickInputRef = useRef(null)

  const diasNav = Array.from({ length:7 }, (_, i) => sumarDias(diaActivo, i-3))
  const tareasDelDia = tareas.filter(t => t.fecha === diaActivo)
  const pendientes = tareasDelDia.filter(t => !t.done).sort((a,b) => a.orden - b.orden)
  const completadas = tareasDelDia.filter(t => t.done)

  function irDia(iso) { setDiaActivo(iso); setSelectMode(false); setSelectedIds([]) }
  function diaAnterior() { setDiaActivo(prev => sumarDias(prev, -1)) }
  function diaSiguiente() { setDiaActivo(prev => sumarDias(prev, 1)) }

  function quickAdd() {
    const txt = quickText.trim(); if (!txt) return
    setTareas(prev => [...prev, { id:generarId(), texto:txt, fecha:diaActivo, hora:'', done:false, arrastrada:false, orden:prev.filter(t=>t.fecha===diaActivo&&!t.done).length }])
    setQuickText(''); quickInputRef.current?.focus()
  }
  function abrirModalAgregar() { setModalTexto(''); setModalFecha(diaActivo); setModalHora(''); setModalAgregar(true) }
  function guardarAgregar() {
    if (!modalTexto.trim() || !modalFecha) return
    setTareas(prev => [...prev, { id:generarId(), texto:modalTexto.trim(), fecha:modalFecha, hora:modalHora, done:false, arrastrada:false, orden:prev.filter(t=>t.fecha===modalFecha&&!t.done).length }])
    setModalAgregar(false)
  }
  function abrirEditar(t) { setModalEditar(t); setModalTexto(t.texto); setModalFecha(t.fecha||diaActivo); setModalHora(t.hora||'') }
  function guardarEditar() {
    if (!modalTexto.trim() || !modalFecha) return
    setTareas(prev => prev.map(t => t.id===modalEditar.id ? {...t, texto:modalTexto.trim(), fecha:modalFecha, hora:modalHora} : t))
    setModalEditar(null)
  }
  function toggleDone(id) { setTareas(prev => prev.map(t => t.id===id ? {...t, done:!t.done} : t)) }
  function toggleSelect(id) {
    if (!selectMode) { setSelectMode(true); setSelectedIds([id]); return }
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i=>i!==id) : [...prev,id])
  }
  function exitSelectMode() { setSelectMode(false); setSelectedIds([]) }
  function pedirEliminarUna(t) { setConfirmEliminar({ ids:[t.id], texto:`"${t.texto}"` }) }
  function pedirEliminarSeleccion() {
    if (!selectedIds.length) return
    const n = selectedIds.length
    setConfirmEliminar({ ids:selectedIds, texto:`${n} tarea${n>1?'s':''} seleccionada${n>1?'s':''}` })
  }
  function ejecutarEliminar() {
    if (!confirmEliminar) return
    setTareas(prev => prev.filter(t => !confirmEliminar.ids.includes(t.id)))
    setConfirmEliminar(null); exitSelectMode()
  }
  function onDragStart(id) { setDraggingId(id) }
  function onDragOver(e, id) { e.preventDefault(); setDragOverId(id) }
  function onDrop(e, toId) {
    e.preventDefault()
    if (!draggingId || draggingId===toId) { setDragOverId(null); setDraggingId(null); return }
    setTareas(prev => {
      const pend = [...prev.filter(t=>t.fecha===diaActivo&&!t.done)].sort((a,b)=>a.orden-b.orden)
      const resto = prev.filter(t=>!(t.fecha===diaActivo&&!t.done))
      const fi = pend.findIndex(t=>t.id===draggingId), ti = pend.findIndex(t=>t.id===toId)
      if (fi<0||ti<0) return prev
      const [item] = pend.splice(fi,1); pend.splice(ti,0,item)
      return [...pend.map((t,i)=>({...t,orden:i})), ...resto]
    })
    setDragOverId(null); setDraggingId(null)
  }
  function onDragEnd() { setDragOverId(null); setDraggingId(null) }

  const inp = { width:'100%', padding:'10px 12px', border:'0.5px solid #ddd', borderRadius:'10px', fontSize:'14px', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }
  const saveBtn = ok => ({ width:'100%', padding:'13px', background:ok?'#185FA5':'#e5e5e5', color:ok?'white':'#aaa', border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:'500', cursor:ok?'pointer':'default' })

  return (
    <div style={{ minHeight:'100vh', background:'#F5F5F7', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>

      {/* Header */}
      <div style={{ background:'#185FA5', padding:'14px 20px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
          <button onClick={onVolver} style={{ background:'rgba(255,255,255,0.2)', border:'none', color:'white', borderRadius:'20px', padding:'5px 12px', cursor:'pointer', fontSize:'13px', display:'inline-flex', alignItems:'center', gap:'4px' }}>
            ‹ Atras
          </button>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'32px', fontWeight:'500', color:'white', lineHeight:1 }}>{pendientes.length}</div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', marginTop:'1px' }}>pendientes</div>
          </div>
        </div>
        <div style={{ fontSize:'22px', fontWeight:'500', color:'white', letterSpacing:'-0.3px' }}>Mis Tareas</div>
        <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.7)', marginTop:'2px', height:'18px', lineHeight:'18px' }}>
          {formatearFechaLarga(diaActivo)}
        </div>
      </div>

      {/* Barra de días — fondo azul oscuro, días con círculo para el activo */}
      <div style={{ background:'#0C447C', display:'flex', alignItems:'center', padding:'8px 6px 6px' }}>
        <div style={{ flex:1, display:'flex', justifyContent:'center', gap:'2px' }}>
          {diasNav.map(iso => {
            const d = parseFecha(iso)
            const esActivo = iso === diaActivo
            const esHoy = iso === hoyStr
            return (
              <button key={iso} onClick={() => irDia(iso)}
                style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', padding:'4px 6px 6px', border:'none', cursor:'pointer', minWidth:'44px', background:'transparent', borderRadius:'10px' }}>
                {/* Día semana */}
                <span style={{ fontSize:'9px', fontWeight:'600', letterSpacing:'0.05em', textTransform:'uppercase', color: esActivo ? 'white' : 'rgba(255,255,255,0.4)', lineHeight:1.4 }}>
                  {DIAS_SEMANA[d.getDay()]}
                </span>
                {/* Número con círculo azul si es activo */}
                <div style={{ width:'34px', height:'34px', borderRadius:'50%', background: esActivo ? '#378ADD' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', margin:'2px 0' }}>
                  <span style={{ fontSize: esActivo ? '17px' : '16px', fontWeight: esActivo ? '700' : esHoy ? '600' : '400', color: esActivo ? 'white' : 'rgba(255,255,255,0.5)', lineHeight:1 }}>
                    {d.getDate()}
                  </span>
                </div>
                {/* Mes abreviado */}
                <span style={{ fontSize:'9px', color: esActivo ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)', lineHeight:1.2 }}>
                  {MESES_CORTO[d.getMonth()]}
                </span>
              </button>
            )
          })}
        </div>
        {/* Flechas juntas a la derecha */}
        <div style={{ display:'flex', gap:'3px', flexShrink:0, paddingRight:'2px' }}>
          <button onClick={diaAnterior} style={{ width:'28px', height:'28px', borderRadius:'8px', background:'rgba(255,255,255,0.15)', border:'none', color:'white', fontSize:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
          <button onClick={diaSiguiente} style={{ width:'28px', height:'28px', borderRadius:'8px', background:'rgba(255,255,255,0.15)', border:'none', color:'white', fontSize:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth:'600px', margin:'0 auto', paddingBottom:'20px' }}>
        {selectMode && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 20px', background:'#E6F1FB', borderBottom:'0.5px solid #B5D4F4' }}>
            <span style={{ fontSize:'13px', color:'#0C447C' }}>{selectedIds.length} seleccionada{selectedIds.length!==1?'s':''}</span>
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={exitSelectMode} style={{ background:'none', border:'none', color:'#0C447C', fontSize:'13px', cursor:'pointer' }}>Cancelar</button>
              <button onClick={pedirEliminarSeleccion} style={{ background:'none', border:'1px solid #A32D2D', color:'#A32D2D', fontSize:'12px', borderRadius:'6px', padding:'4px 12px', cursor:'pointer' }}>Eliminar</button>
            </div>
          </div>
        )}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 20px 5px', background:'#F5F5F7', borderBottom:'0.5px solid #e5e5e5' }}>
          <span style={{ fontSize:'10px', fontWeight:'500', color:'#aaa', letterSpacing:'0.08em', textTransform:'uppercase' }}>Pendientes</span>
          {!selectMode && <span onClick={() => setSelectMode(true)} style={{ fontSize:'11px', color:'#185FA5', cursor:'pointer' }}>Seleccionar</span>}
        </div>
        <div style={{ fontSize:'11px', color:'#bbb', padding:'5px 20px', background:'#FAFAFA', borderBottom:'0.5px solid #F0F0F0', textAlign:'center' }}>
          ← Desliza para editar o eliminar · Mantén presionado para selección múltiple
        </div>

        {pendientes.length === 0 && (
          <div style={{ padding:'32px 20px', textAlign:'center', color:'#bbb', fontSize:'14px' }}>
            {diaActivo === hoyStr ? 'No hay tareas pendientes para hoy 🎉' : `Sin tareas para el ${formatearFechaLarga(diaActivo)}`}
          </div>
        )}

        {pendientes.map((t,i) => (
          <TaskRow key={t.id} tarea={t} num={i+1} selectMode={selectMode} isSelected={selectedIds.includes(t.id)}
            onToggleDone={() => toggleDone(t.id)} onToggleSelect={() => toggleSelect(t.id)}
            onEdit={() => abrirEditar(t)} onDeleteOne={() => pedirEliminarUna(t)}
            onDragStart={() => onDragStart(t.id)} onDragOver={e => onDragOver(e,t.id)} onDrop={e => onDrop(e,t.id)} onDragEnd={onDragEnd}
            isDragOver={dragOverId===t.id} isDragging={draggingId===t.id} />
        ))}

        {completadas.length > 0 && (
          <>
            <div style={{ padding:'8px 20px 5px', background:'#F5F5F7', borderTop:'0.5px solid #e5e5e5', borderBottom:'0.5px solid #e5e5e5' }}>
              <span style={{ fontSize:'10px', fontWeight:'500', color:'#aaa', letterSpacing:'0.08em', textTransform:'uppercase' }}>Completadas</span>
            </div>
            {completadas.map(t => (
              <TaskRow key={t.id} tarea={t} num={null} selectMode={false} isSelected={false}
                onToggleDone={() => toggleDone(t.id)} onToggleSelect={() => {}}
                onEdit={() => {}} onDeleteOne={() => pedirEliminarUna(t)}
                onDragStart={() => {}} onDragOver={() => {}} onDrop={() => {}} onDragEnd={() => {}}
                isDragOver={false} isDragging={false} />
            ))}
          </>
        )}

        {/* Quick add */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 16px', background:'white', borderTop:'0.5px solid #e5e5e5', position:'sticky', bottom:0, zIndex:10 }}>
          <button onClick={abrirModalAgregar} style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#185FA5', border:'none', color:'white', fontSize:'22px', lineHeight:1, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>+</button>
          <input ref={quickInputRef} value={quickText} onChange={e => setQuickText(e.target.value)}
            onKeyDown={e => e.key==='Enter' && quickAdd()}
            placeholder="Nueva tarea... (Enter para agregar)"
            style={{ flex:1, padding:'8px 12px', border:'0.5px solid #e5e5e5', borderRadius:'10px', fontSize:'14px', outline:'none', fontFamily:'inherit', background:'#FAFAFA', color:'#2C2C2A' }} />
          <button onClick={quickAdd} style={{ padding:'8px 16px', background:'#185FA5', color:'white', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:'500', cursor:'pointer', flexShrink:0 }}>Agregar</button>
        </div>

        <div style={{ padding:'10px 20px', display:'flex', alignItems:'center', gap:'6px' }}>
          <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#BA7517', flexShrink:0 }} />
          <span style={{ fontSize:'11px', color:'#bbb' }}>Las tareas pendientes pasan automáticamente al día siguiente</span>
        </div>
      </div>

      {/* Modal agregar */}
      {modalAgregar && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:100 }}
          onClick={e => { if (e.target===e.currentTarget) setModalAgregar(false) }}>
          <div style={{ background:'white', borderRadius:'20px 20px 0 0', width:'100%', maxWidth:'600px', padding:'24px', overscrollBehavior:'contain' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <div style={{ fontSize:'17px', fontWeight:'500', color:'#2C2C2A' }}>Nueva tarea</div>
              <button onClick={() => setModalAgregar(false)} style={{ background:'#f5f5f5', border:'none', borderRadius:'50%', width:'30px', height:'30px', cursor:'pointer', fontSize:'15px', color:'#888' }}>✕</button>
            </div>
            <div style={{ marginBottom:'14px' }}>
              <div style={{ fontSize:'12px', fontWeight:'500', color:'#888', marginBottom:'5px' }}>Tarea *</div>
              <input autoFocus value={modalTexto} onChange={e => setModalTexto(e.target.value)} onKeyDown={e => e.key==='Enter' && guardarAgregar()} placeholder="¿Qué tienes que hacer?" style={inp} />
            </div>
            <div style={{ display:'flex', gap:'10px', marginBottom:'20px' }}>
              <div style={{ flex:1 }}><div style={{ fontSize:'12px', fontWeight:'500', color:'#888', marginBottom:'5px' }}>Fecha *</div><input type="date" value={modalFecha} onChange={e => setModalFecha(e.target.value)} style={inp} /></div>
              <div style={{ flex:1 }}><div style={{ fontSize:'12px', fontWeight:'500', color:'#888', marginBottom:'5px' }}>Hora (opcional)</div><input type="time" value={modalHora} onChange={e => setModalHora(e.target.value)} style={inp} /></div>
            </div>
            <button onClick={guardarAgregar} disabled={!modalTexto.trim()||!modalFecha} style={saveBtn(modalTexto.trim()&&modalFecha)}>Agregar tarea</button>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {modalEditar && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:100 }}
          onClick={e => { if (e.target===e.currentTarget) setModalEditar(null) }}>
          <div style={{ background:'white', borderRadius:'20px 20px 0 0', width:'100%', maxWidth:'600px', padding:'24px', overscrollBehavior:'contain' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <div style={{ fontSize:'17px', fontWeight:'500', color:'#2C2C2A' }}>Editar tarea</div>
              <button onClick={() => setModalEditar(null)} style={{ background:'#f5f5f5', border:'none', borderRadius:'50%', width:'30px', height:'30px', cursor:'pointer', fontSize:'15px', color:'#888' }}>✕</button>
            </div>
            <div style={{ marginBottom:'14px' }}>
              <div style={{ fontSize:'12px', fontWeight:'500', color:'#888', marginBottom:'5px' }}>Tarea *</div>
              <input autoFocus value={modalTexto} onChange={e => setModalTexto(e.target.value)} onKeyDown={e => e.key==='Enter' && guardarEditar()} style={inp} />
            </div>
            <div style={{ display:'flex', gap:'10px', marginBottom:'20px' }}>
              <div style={{ flex:1 }}><div style={{ fontSize:'12px', fontWeight:'500', color:'#888', marginBottom:'5px' }}>Fecha *</div><input type="date" value={modalFecha} onChange={e => setModalFecha(e.target.value)} style={inp} /></div>
              <div style={{ flex:1 }}><div style={{ fontSize:'12px', fontWeight:'500', color:'#888', marginBottom:'5px' }}>Hora (opcional)</div><input type="time" value={modalHora} onChange={e => setModalHora(e.target.value)} style={inp} /></div>
            </div>
            <button onClick={guardarEditar} disabled={!modalTexto.trim()||!modalFecha} style={saveBtn(modalTexto.trim()&&modalFecha)}>Guardar cambios</button>
          </div>
        </div>
      )}

      {/* Confirmación eliminar */}
      {confirmEliminar && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'20px' }}>
          <div style={{ background:'white', borderRadius:'16px', padding:'28px 24px', width:'100%', maxWidth:'320px', textAlign:'center' }}>
            <div style={{ fontSize:'16px', fontWeight:'500', color:'#2C2C2A', marginBottom:'8px' }}>
              {confirmEliminar.ids.length===1 ? '¿Eliminar esta tarea?' : `¿Eliminar ${confirmEliminar.ids.length} tareas?`}
            </div>
            <div style={{ fontSize:'13px', color:'#888', marginBottom:'24px', lineHeight:'1.5' }}>{confirmEliminar.texto}</div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={() => setConfirmEliminar(null)} style={{ flex:1, padding:'12px', background:'#f5f5f5', border:'none', borderRadius:'12px', cursor:'pointer', fontSize:'14px' }}>Cancelar</button>
              <button onClick={ejecutarEliminar} style={{ flex:1, padding:'12px', background:'#A32D2D', border:'none', borderRadius:'12px', cursor:'pointer', fontSize:'14px', color:'white', fontWeight:'500' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
