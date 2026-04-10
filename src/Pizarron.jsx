import { useState, useRef } from 'react'

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function generarId() {
  return Math.random().toString(36).substr(2, 9)
}

// FIX 1: MiniMes ya no recibe onDiaClick — los días no son clickeables desde la vista anual
function MiniMes({ anio, mes, hoy, anotaciones }) {
  const primerDia = new Date(anio, mes, 1).getDay()
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()
  const celdas = []
  for (let i = 0; i < primerDia; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d)
  const esHoyDia = (d) => d === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear()
  const getKey = (a, m, d) => `${a}-${m}-${d}`
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'1px', marginBottom:'2px' }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:'8px', color:'#aaa', fontWeight:'600' }}>{d[0]}</div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'1px' }}>
        {celdas.map((dia, idx) => {
          const lista = dia ? (anotaciones[getKey(anio, mes, dia)] || []) : []
          return (
            <div key={idx}
              style={{
                height:'24px', display:'flex', alignItems:'center', justifyContent:'center',
                borderRadius:'50%',
                // FIX 1: cursor default — los días del mini mes no son clickeables
                cursor: 'default',
                fontSize:'10px',
                background: esHoyDia(dia) ? '#534AB7' : 'transparent',
                color: esHoyDia(dia) ? 'white' : dia ? '#2C2C2A' : 'transparent',
                fontWeight: esHoyDia(dia) ? '700' : '400',
                position:'relative'
              }}>
              {dia || ''}
              {lista.length > 0 && !esHoyDia(dia) && (
                <div style={{ position:'absolute', bottom:'2px', left:'50%', transform:'translateX(-50%)',
                  width:'4px', height:'4px', borderRadius:'50%', background:'#534AB7' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Pizarron({ onVolver }) {
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [vistaAnual, setVistaAnual] = useState(false)
  const [anioAnual, setAnioAnual] = useState(hoy.getFullYear())
  const [anotaciones, setAnotaciones] = useState({})
  const [modalDia, setModalDia] = useState(null)
  const [textoNuevo, setTextoNuevo] = useState('')
  const [mostrarRepetir, setMostrarRepetir] = useState(false)
  const [mesRepetir, setMesRepetir] = useState(hoy.getMonth())
  const [anioRepetir, setAnioRepetir] = useState(hoy.getFullYear())
  const [fechasRepetir, setFechasRepetir] = useState([])
  const [confirmEliminar, setConfirmEliminar] = useState(null)
  const [editando, setEditando] = useState(null)
  const [textoEditar, setTextoEditar] = useState('')
  const [editFecha, setEditFecha] = useState(null)
  const [mostrarCalEditFecha, setMostrarCalEditFecha] = useState(false)
  const [mesCalEdit, setMesCalEdit] = useState(hoy.getMonth())
  const [anioCalEdit, setAnioCalEdit] = useState(hoy.getFullYear())
  const [dragOverCelda, setDragOverCelda] = useState(null)

  // FIX 2: Estado de drag del modal separado y más preciso
  const [dragOverModal, setDragOverModal] = useState(null)
  const [draggingModalIdx, setDraggingModalIdx] = useState(null) // índice del item siendo arrastrado en el modal

  const dragItem = useRef(null)
  const dragGhost = useRef(null)
  const editandoIdxRef = useRef(null)

  // FIX 2: Refs separados para long press del calendario vs modal
  const longPressTimerCalendario = useRef(null)
  const longPressTimerModal = useRef(null)
  const touchStartPos = useRef(null)
  const isDraggingCalendario = useRef(false)
  const isDraggingModal = useRef(false)

  const primerDia = new Date(anio, mes, 1).getDay()
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()
  const esHoy = (d) => d === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear()
  const esFinde = (idx) => { const s = idx % 7; return s === 0 || s === 6 }
  const getKey = (a, m, d) => `${a}-${m}-${d}`

  const celdas = []
  for (let i = 0; i < primerDia; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d)

  const irAHoy = () => {
    setMes(hoy.getMonth())
    setAnio(hoy.getFullYear())
    setVistaAnual(false)
  }

  const abrirModal = (dia) => {
    setModalDia(dia)
    setTextoNuevo('')
    setMostrarRepetir(false)
    setFechasRepetir([{ dia, mes, anio }])
    setMesRepetir(mes)
    setAnioRepetir(anio)
    setEditando(null)
    setEditFecha(null)
    setMostrarCalEditFecha(false)
  }

  const cerrarModal = () => {
    setModalDia(null)
    setEditando(null)
    setConfirmEliminar(null)
    setMostrarRepetir(false)
    setFechasRepetir([])
    setEditFecha(null)
    setMostrarCalEditFecha(false)
    setDragOverModal(null)
    setDraggingModalIdx(null)
    isDraggingModal.current = false
  }

  const toggleFechaRepetir = (d) => {
    const existe = fechasRepetir.find(f => f.dia === d && f.mes === mesRepetir && f.anio === anioRepetir)
    if (existe) {
      if (fechasRepetir.length === 1) return
      setFechasRepetir(fechasRepetir.filter(f => !(f.dia === d && f.mes === mesRepetir && f.anio === anioRepetir)))
    } else {
      setFechasRepetir([...fechasRepetir, { dia: d, mes: mesRepetir, anio: anioRepetir }])
    }
  }

  const esFechaSeleccionada = (d) =>
    fechasRepetir.some(f => f.dia === d && f.mes === mesRepetir && f.anio === anioRepetir)

  const agregarAnotacion = () => {
    if (!textoNuevo.trim()) return
    const repeatGroupId = fechasRepetir.length > 1 ? generarId() : null
    const nuevas = { ...anotaciones }
    fechasRepetir.forEach(({ dia, mes: m, anio: a }) => {
      const key = getKey(a, m, dia)
      nuevas[key] = [...(nuevas[key] || []), {
        id: generarId(), texto: textoNuevo.trim(), realizada: false,
        repeatGroupId, dia, mes: m, anio: a
      }]
    })
    setAnotaciones(nuevas)
    setTextoNuevo('')
    setMostrarRepetir(false)
    setFechasRepetir([{ dia: modalDia, mes, anio }])
  }

  const toggleRealizada = (dia, id) => {
    const key = getKey(anio, mes, dia)
    setAnotaciones({ ...anotaciones, [key]: (anotaciones[key] || []).map(a => a.id === id ? { ...a, realizada: !a.realizada } : a) })
  }

  const confirmarEliminarFn = (dia, anotacion) => setConfirmEliminar({ dia, anotacion })

  const ejecutarEliminar = (soloEsta) => {
    if (!confirmEliminar) return
    const { dia, anotacion } = confirmEliminar
    const nuevas = { ...anotaciones }
    if (soloEsta || !anotacion.repeatGroupId) {
      const key = getKey(anio, mes, dia)
      nuevas[key] = (nuevas[key] || []).filter(a => a.id !== anotacion.id)
    } else {
      Object.keys(nuevas).forEach(key => {
        nuevas[key] = nuevas[key].filter(a => a.repeatGroupId !== anotacion.repeatGroupId)
      })
    }
    setAnotaciones(nuevas)
    setConfirmEliminar(null)
  }

  const iniciarEdicion = (a, idx) => {
    setEditando(a.id)
    editandoIdxRef.current = idx
    setTextoEditar(a.texto)
    setEditFecha({ dia: a.dia, mes: a.mes, anio: a.anio })
    setMesCalEdit(a.mes)
    setAnioCalEdit(a.anio)
    setMostrarCalEditFecha(false)
  }

  const guardarEdicion = (diaModal) => {
    if (!textoEditar.trim() || !editando) return
    const keyVieja = getKey(anio, mes, diaModal)
    const keyNueva = getKey(editFecha.anio, editFecha.mes, editFecha.dia)
    const nuevas = { ...anotaciones }
    const listaVieja = [...(nuevas[keyVieja] || [])]
    const idxOriginal = editandoIdxRef.current ?? listaVieja.findIndex(a => a.id === editando)
    const itemOriginal = listaVieja.find(a => a.id === editando)
    const itemActualizado = { ...itemOriginal, texto: textoEditar.trim(), dia: editFecha.dia, mes: editFecha.mes, anio: editFecha.anio }
    nuevas[keyVieja] = listaVieja.filter(a => a.id !== editando)
    const listaNueva = [...(nuevas[keyNueva] || [])]
    if (keyVieja === keyNueva) {
      listaNueva.splice(idxOriginal, 0, itemActualizado)
    } else {
      listaNueva.push(itemActualizado)
    }
    nuevas[keyNueva] = listaNueva
    setAnotaciones(nuevas)
    setEditando(null)
    editandoIdxRef.current = null
    setTextoEditar('')
    setEditFecha(null)
    setMostrarCalEditFecha(false)
  }

  const seleccionarFechaEdicion = (d) => {
    setEditFecha({ dia: d, mes: mesCalEdit, anio: anioCalEdit })
    setMostrarCalEditFecha(false)
  }

  // ─────────────────────────────────────────────────────────────
  // DRAG CALENDARIO (touch con long press)
  // FIX 2: Solo maneja el arrastre entre celdas del calendario
  // ─────────────────────────────────────────────────────────────
  const onTouchStartCalendario = (e, fromKey, idx) => {
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    isDraggingCalendario.current = false
    longPressTimerCalendario.current = setTimeout(() => {
      isDraggingCalendario.current = true
      dragItem.current = { fromKey, idx }
      const ghost = document.createElement('div')
      ghost.style.cssText = 'position:fixed;padding:8px 14px;background:#534AB7;color:white;border-radius:10px;font-size:13px;pointer-events:none;z-index:9999;opacity:0.9;box-shadow:0 4px 12px rgba(83,74,183,0.4);'
      ghost.innerText = '✦ moviendo...'
      document.body.appendChild(ghost)
      dragGhost.current = ghost
    }, 500)
  }

  const onTouchMoveCalendario = (e) => {
    const touch = e.touches[0]
    if (!isDraggingCalendario.current) {
      if (touchStartPos.current) {
        const dx = Math.abs(touch.clientX - touchStartPos.current.x)
        const dy = Math.abs(touch.clientY - touchStartPos.current.y)
        if (dx > 10 || dy > 10) {
          clearTimeout(longPressTimerCalendario.current)
          longPressTimerCalendario.current = null
        }
      }
      return
    }
    e.preventDefault()
    if (dragGhost.current) {
      dragGhost.current.style.left = (touch.clientX - 50) + 'px'
      dragGhost.current.style.top = (touch.clientY - 30) + 'px'
      dragGhost.current.style.display = 'none'
    }
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    if (dragGhost.current) dragGhost.current.style.display = 'block'
    const celdaEl = el?.closest('[data-dia]')
    if (celdaEl) {
      const diaAttr = celdaEl.getAttribute('data-dia')
      setDragOverCelda(diaAttr ? parseInt(diaAttr) : null)
    } else {
      setDragOverCelda(null)
    }
  }

  const onTouchEndCalendario = (e) => {
    clearTimeout(longPressTimerCalendario.current)
    longPressTimerCalendario.current = null
    if (dragGhost.current) { document.body.removeChild(dragGhost.current); dragGhost.current = null }
    if (!isDraggingCalendario.current) { isDraggingCalendario.current = false; dragItem.current = null; return }
    const touch = e.changedTouches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const celdaEl = el?.closest('[data-dia]')
    if (celdaEl && dragItem.current) {
      const diaAttr = celdaEl.getAttribute('data-dia')
      if (diaAttr) {
        const dia = parseInt(diaAttr)
        const { fromKey, idx } = dragItem.current
        const toKey = getKey(anio, mes, dia)
        if (fromKey !== toKey) {
          const nuevas = { ...anotaciones }
          const listaOrig = [...(nuevas[fromKey] || [])]
          const [item] = listaOrig.splice(idx, 1)
          nuevas[fromKey] = listaOrig
          nuevas[toKey] = [...(nuevas[toKey] || []), { ...item, dia, mes, anio }]
          setAnotaciones(nuevas)
        }
      }
    }
    setDragOverCelda(null)
    isDraggingCalendario.current = false
    dragItem.current = null
  }

  // ─────────────────────────────────────────────────────────────
  // DRAG MODAL (reordenar tareas dentro del modal)
  // FIX 2: Completamente separado del drag del calendario.
  // NO usa el atributo `draggable` en el HTML (eso causaba el temblor).
  // Usa solo eventos touch/mouse manuales.
  // ─────────────────────────────────────────────────────────────
  const modalDragItem = useRef(null) // { fromIdx }
  const modalGhost = useRef(null)

  const onTouchStartModal = (e, idx) => {
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    isDraggingModal.current = false
    longPressTimerModal.current = setTimeout(() => {
      isDraggingModal.current = true
      modalDragItem.current = { fromIdx: idx }
      setDraggingModalIdx(idx)
      // Ghost visual
      const ghost = document.createElement('div')
      ghost.style.cssText = 'position:fixed;padding:8px 14px;background:#534AB7;color:white;border-radius:10px;font-size:13px;pointer-events:none;z-index:9999;opacity:0.9;box-shadow:0 4px 12px rgba(83,74,183,0.4);'
      ghost.innerText = '↕ reordenando...'
      document.body.appendChild(ghost)
      modalGhost.current = ghost
    }, 500)
  }

  const onTouchMoveModal = (e) => {
    const touch = e.touches[0]
    if (!isDraggingModal.current) {
      // Cancelar long press si se movió antes de los 500ms
      if (touchStartPos.current) {
        const dx = Math.abs(touch.clientX - touchStartPos.current.x)
        const dy = Math.abs(touch.clientY - touchStartPos.current.y)
        if (dx > 10 || dy > 10) {
          clearTimeout(longPressTimerModal.current)
          longPressTimerModal.current = null
        }
      }
      return
    }
    e.preventDefault()
    if (modalGhost.current) {
      modalGhost.current.style.left = (touch.clientX - 70) + 'px'
      modalGhost.current.style.top = (touch.clientY - 30) + 'px'
      modalGhost.current.style.display = 'none'
    }
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    if (modalGhost.current) modalGhost.current.style.display = 'block'
    const itemEl = el?.closest('[data-modalidx]')
    if (itemEl) {
      setDragOverModal(parseInt(itemEl.getAttribute('data-modalidx')))
    } else {
      setDragOverModal(null)
    }
  }

  const onTouchEndModal = (e) => {
    clearTimeout(longPressTimerModal.current)
    longPressTimerModal.current = null
    if (modalGhost.current) { document.body.removeChild(modalGhost.current); modalGhost.current = null }
    if (!isDraggingModal.current) {
      isDraggingModal.current = false
      modalDragItem.current = null
      setDraggingModalIdx(null)
      return
    }
    const touch = e.changedTouches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const itemEl = el?.closest('[data-modalidx]')
    if (itemEl && modalDragItem.current && modalDia) {
      const toIdx = parseInt(itemEl.getAttribute('data-modalidx'))
      const fromIdx = modalDragItem.current.fromIdx
      if (fromIdx !== toIdx) {
        const toKey = getKey(anio, mes, modalDia)
        const lista = [...(anotaciones[toKey] || [])]
        const [item] = lista.splice(fromIdx, 1)
        lista.splice(toIdx, 0, item)
        setAnotaciones({ ...anotaciones, [toKey]: lista })
      }
    }
    setDragOverModal(null)
    setDraggingModalIdx(null)
    isDraggingModal.current = false
    modalDragItem.current = null
  }

  // Mouse drag — calendario
  const onDragStartCalendario = (e, fromKey, idx) => {
    dragItem.current = { fromKey, idx }
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDropCelda = (e, dia) => {
    e.preventDefault(); setDragOverCelda(null)
    if (!dragItem.current || !dia) return
    const { fromKey, idx } = dragItem.current
    const toKey = getKey(anio, mes, dia)
    if (fromKey === toKey) return
    const nuevas = { ...anotaciones }
    const listaOrig = [...(nuevas[fromKey] || [])]
    const [item] = listaOrig.splice(idx, 1)
    nuevas[fromKey] = listaOrig
    nuevas[toKey] = [...(nuevas[toKey] || []), { ...item, dia, mes, anio }]
    setAnotaciones(nuevas)
    dragItem.current = null
  }

  // Mouse drag manual para el modal — reemplaza draggable nativo (que causaba temblor)
  const onMouseDownModal = (e, idx) => {
    if (e.button !== 0) return
    const startY = e.clientY
    let dragStarted = false
    modalDragItem.current = { fromIdx: idx }

    const onMouseMove = (ev) => {
      if (!dragStarted && Math.abs(ev.clientY - startY) > 5) {
        dragStarted = true
        setDraggingModalIdx(idx)
      }
      if (!dragStarted) return
      const el = document.elementFromPoint(ev.clientX, ev.clientY)
      const itemEl = el?.closest('[data-modalidx]')
      setDragOverModal(itemEl ? parseInt(itemEl.getAttribute('data-modalidx')) : null)
    }

    const onMouseUp = (ev) => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      if (dragStarted) {
        const el = document.elementFromPoint(ev.clientX, ev.clientY)
        const itemEl = el?.closest('[data-modalidx]')
        if (itemEl && modalDragItem.current && modalDia) {
          const toIdx = parseInt(itemEl.getAttribute('data-modalidx'))
          const fromIdx = modalDragItem.current.fromIdx
          if (fromIdx !== toIdx) {
            const toKey = getKey(anio, mes, modalDia)
            const lista = [...(anotaciones[toKey] || [])]
            const [item] = lista.splice(fromIdx, 1)
            lista.splice(toIdx, 0, item)
            setAnotaciones(prev => ({ ...prev, [toKey]: lista }))
          }
        }
      }
      setDragOverModal(null)
      setDraggingModalIdx(null)
      modalDragItem.current = null
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const buildCeldas = (a, m) => {
    const primer = new Date(a, m, 1).getDay()
    const dias = new Date(a, m + 1, 0).getDate()
    const arr = []
    for (let i = 0; i < primer; i++) arr.push(null)
    for (let d = 1; d <= dias; d++) arr.push(d)
    return arr
  }

  const celdasRepetir = buildCeldas(anioRepetir, mesRepetir)
  const celdasCalEdit = buildCeldas(anioCalEdit, mesCalEdit)
  const esMesActual = (m) => m === hoy.getMonth() && anioAnual === hoy.getFullYear()

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f7', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#185FA5,#534AB7)', padding:'16px 20px', display:'flex', alignItems:'center' }}>
        <button onClick={onVolver} style={{ background:'rgba(255,255,255,0.2)', border:'none', color:'white', borderRadius:'20px', padding:'6px 14px', cursor:'pointer', fontSize:'14px', whiteSpace:'nowrap' }}>Atras</button>
        <div style={{ color:'white', fontSize:'20px', fontWeight:'700', flex:1, textAlign:'center' }}>Pizarron Interactivo</div>
        <div style={{ width:'60px' }} />
      </div>

      {/* ═══ VISTA ANUAL ═══ */}
      {vistaAnual ? (
        <div style={{ padding:'0 12px 100px 12px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 0' }}>
            <button onClick={() => setAnioAnual(anioAnual-1)}
              style={{ background:'white', border:'1px solid #e5e5e5', borderRadius:'10px', padding:'8px 16px', cursor:'pointer', fontSize:'18px' }}>&lt;</button>
            <div style={{ fontSize:'32px', fontWeight:'800', color: anioAnual === hoy.getFullYear() ? '#534AB7' : '#2C2C2A' }}>{anioAnual}</div>
            <button onClick={() => setAnioAnual(anioAnual+1)}
              style={{ background:'white', border:'1px solid #e5e5e5', borderRadius:'10px', padding:'8px 16px', cursor:'pointer', fontSize:'18px' }}>&gt;</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
            {MESES_CORTO.map((nombreCorto, m) => (
              <div key={m}
                // FIX 1: Solo el card completo del mes es clickeable — lleva a la vista mensual
                onClick={() => { setMes(m); setAnio(anioAnual); setVistaAnual(false) }}
                style={{
                  background:'white', borderRadius:'16px', padding:'12px',
                  border: esMesActual(m) ? '2px solid #534AB7' : '1px solid #ececec',
                  cursor:'pointer', boxShadow:'0 1px 4px rgba(0,0,0,0.06)'
                }}>
                <div style={{ fontSize:'16px', fontWeight:'700', color: esMesActual(m) ? '#534AB7' : '#2C2C2A', marginBottom:'8px' }}>
                  {nombreCorto}
                </div>
                {/* FIX 1: MiniMes sin onDiaClick — días no son clickeables individualmente */}
                <MiniMes anio={anioAnual} mes={m} hoy={hoy} anotaciones={anotaciones} />
              </div>
            ))}
          </div>
          <div style={{ position:'fixed', bottom:'24px', left:'50%', transform:'translateX(-50%)', zIndex:50 }}>
            <button onClick={irAHoy}
              style={{ background:'white', border:'2px solid #534AB7', borderRadius:'24px', padding:'10px 28px',
                fontSize:'16px', fontWeight:'700', color:'#534AB7', cursor:'pointer',
                boxShadow:'0 4px 16px rgba(83,74,183,0.25)' }}>
              Hoy
            </button>
          </div>
        </div>

      ) : (
        <>
          {/* Navegacion mes */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px' }}>
            <button onClick={() => { if(mes===0){setMes(11);setAnio(anio-1)}else setMes(mes-1) }}
              style={{ background:'white', border:'1px solid #e5e5e5', borderRadius:'10px', padding:'8px 16px', cursor:'pointer', fontSize:'18px' }}>&lt;</button>
            <button onClick={() => setVistaAnual(true)}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:'18px', fontWeight:'700', color:'#2C2C2A' }}>
              {MESES[mes]} {anio} ▾
            </button>
            <button onClick={() => { if(mes===11){setMes(0);setAnio(anio+1)}else setMes(mes+1) }}
              style={{ background:'white', border:'1px solid #e5e5e5', borderRadius:'10px', padding:'8px 16px', cursor:'pointer', fontSize:'18px' }}>&gt;</button>
          </div>

          {/* Dias semana */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'0 12px', gap:'2px', marginBottom:'4px' }}>
            {DIAS_SEMANA.map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:'12px', fontWeight:'600', color:'#888', padding:'4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Calendario */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'0 12px', gap:'2px' }}>
            {celdas.map((dia, idx) => {
              const key = getKey(anio, mes, dia)
              const lista = anotaciones[key] || []
              const isDragOver = dragOverCelda === dia
              return (
                <div key={idx} data-dia={dia || ''}
                  onDragOver={e => { e.preventDefault(); if(dia) setDragOverCelda(dia) }}
                  onDragLeave={() => setDragOverCelda(null)}
                  onDrop={e => onDropCelda(e, dia)}
                  style={{
                    minHeight:'80px', overflow:'hidden',
                    background: isDragOver ? '#EEF2FF' : dia ? (esFinde(idx) ? '#F8F8F8' : 'white') : 'transparent',
                    borderRadius:'10px', padding:'4px',
                    border: isDragOver ? '2px dashed #534AB7' : esHoy(dia) ? '2px solid #534AB7' : '1px solid #ececec',
                    boxSizing:'border-box', transition:'all 0.15s'
                  }}>
                  {dia && (
                    <>
                      <div onClick={() => abrirModal(dia)}
                        style={{ fontSize:'12px', fontWeight: esHoy(dia)?'700':'400', color: esHoy(dia)?'#534AB7':'#2C2C2A',
                          marginBottom:'2px', cursor:'pointer', display:'inline-block', padding:'1px 3px', borderRadius:'4px' }}>
                        {dia}
                      </div>
                      {lista.slice(0,2).map((a, i) => (
                        <div key={i}
                          // FIX 2: draggable solo en el calendario, con sus propios handlers
                          draggable
                          onDragStart={e => onDragStartCalendario(e, key, i)}
                          onTouchStart={e => onTouchStartCalendario(e, key, i)}
                          onTouchMove={onTouchMoveCalendario}
                          onTouchEnd={onTouchEndCalendario}
                          style={{ display:'flex', alignItems:'flex-start', gap:'3px', marginBottom:'1px', cursor:'grab', userSelect:'none' }}>
                          <span style={{ fontSize:'9px', color: a.realizada?'#ccc':'#534AB7', flexShrink:0, lineHeight:'1.3', marginTop:'1px' }}>•</span>
                          <span style={{ fontSize:'9px', color: a.realizada?'#ccc':'#2C2C2A', overflow:'hidden', textOverflow:'ellipsis',
                            whiteSpace:'nowrap', flex:1, textDecoration: a.realizada?'line-through':'none', lineHeight:'1.3', textAlign:'left' }}>
                            {a.texto}
                          </span>
                        </div>
                      ))}
                      {lista.length === 0 && <div onClick={() => abrirModal(dia)} style={{ height:'48px', cursor:'pointer' }} />}
                      {lista.length > 2 && (
                        <div onClick={() => abrirModal(dia)} style={{ fontSize:'9px', color:'#aaa', cursor:'pointer', marginTop:'1px', textAlign:'left' }}>
                          +{lista.length-2} más
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>

              style={{ background:'white', border:'2px solid #534AB7', borderRadius:'24px', padding:'10px 28px',
                fontSize:'16px', fontWeight:'700', color:'#534AB7', cursor:'pointer',
                boxShadow:'0 4px 16px rgba(83,74,183,0.25)' }}>
              Hoy
            </button>
          </div>
        </>
      )}

      {/* ═══ MODAL ═══ */}
      {modalDia && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:100, touchAction:'none' }}
          onClick={e => { if(e.target===e.currentTarget) cerrarModal() }}>
          <div style={{ background:'white', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:'600px', maxHeight:'88vh', overflowY:'auto', padding:'24px', touchAction:'pan-y' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <div style={{ fontSize:'18px', fontWeight:'700', color:'#2C2C2A' }}>{modalDia} de {MESES[mes]} {anio}</div>
              <button onClick={cerrarModal} style={{ background:'#f5f5f7', border:'none', borderRadius:'50%', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px', color:'#888' }}>✕</button>
            </div>

            <div style={{ marginBottom:'12px' }}>
              <div style={{ display:'flex', gap:'8px', marginBottom:'8px' }}>
                <input value={textoNuevo} onChange={e => setTextoNuevo(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && agregarAnotacion()}
                  placeholder="Nueva anotacion..."
                  style={{ flex:1, padding:'10px 14px', borderRadius:'10px', border:'1.5px solid #e5e5e5', fontSize:'15px', outline:'none' }} />
                <button onClick={agregarAnotacion}
                  style={{ background:'linear-gradient(135deg,#185FA5,#534AB7)', color:'white', border:'none', borderRadius:'10px', padding:'10px 18px', cursor:'pointer', fontWeight:'600', fontSize:'16px' }}>+</button>
              </div>
              <button onClick={() => { setMostrarRepetir(!mostrarRepetir); if(!mostrarRepetir) setFechasRepetir([{dia:modalDia,mes,anio}]) }}
                style={{ background: mostrarRepetir?'#EEF2FF':'#f5f5f7', border:'none', borderRadius:'8px', padding:'6px 14px',
                  cursor:'pointer', fontSize:'13px', color: mostrarRepetir?'#534AB7':'#888', fontWeight:'500' }}>
                🔁 Repetir tarea {mostrarRepetir?'▲':'▼'}
              </button>
            </div>

            {mostrarRepetir && (
              <div style={{ background:'#f5f5f7', borderRadius:'16px', padding:'16px', marginBottom:'16px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                  <button onClick={() => { if(mesRepetir===0){setMesRepetir(11);setAnioRepetir(anioRepetir-1)}else setMesRepetir(mesRepetir-1) }}
                    style={{ background:'white', border:'1px solid #e5e5e5', borderRadius:'8px', padding:'4px 12px', cursor:'pointer' }}>&lt;</button>
                  <div style={{ fontSize:'14px', fontWeight:'600' }}>{MESES[mesRepetir]} {anioRepetir}</div>
                  <button onClick={() => { if(mesRepetir===11){setMesRepetir(0);setAnioRepetir(anioRepetir+1)}else setMesRepetir(mesRepetir+1) }}
                    style={{ background:'white', border:'1px solid #e5e5e5', borderRadius:'8px', padding:'4px 12px', cursor:'pointer' }}>&gt;</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px', marginBottom:'6px' }}>
                  {DIAS_SEMANA.map(d => <div key={d} style={{ textAlign:'center', fontSize:'10px', color:'#aaa', fontWeight:'600' }}>{d}</div>)}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px' }}>
                  {celdasRepetir.map((d,i) => (
                    <div key={i} onClick={() => d && toggleFechaRepetir(d)}
                      style={{ height:'34px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'8px',
                        cursor: d?'pointer':'default', fontSize:'13px',
                        background: d && esFechaSeleccionada(d)?'#534AB7': d?'white':'transparent',
                        color: d && esFechaSeleccionada(d)?'white':'#2C2C2A',
                        fontWeight: d && esFechaSeleccionada(d)?'700':'400',
                        border: d?'1px solid #e5e5e5':'none' }}>
                      {d||''}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:'8px', fontSize:'12px', color:'#534AB7', textAlign:'center' }}>
                  {fechasRepetir.length} fecha{fechasRepetir.length!==1?'s':''} seleccionada{fechasRepetir.length!==1?'s':''}
                </div>
              </div>
            )}

            {/* Items del modal — SIN draggable en absoluto (causa el temblor en mobile).
                Mouse: onMouseDown inicia drag manual con coordenadas.
                Touch: long press 500ms activa drag, sin draggable nativo. */}
            {(anotaciones[getKey(anio,mes,modalDia)]||[]).map((a,i) => (
              <div key={a.id}>
                {dragOverModal === i && (
                  <div style={{ height:'3px', background:'#534AB7', borderRadius:'2px', margin:'3px 0', transition:'all 0.1s' }} />
                )}
                <div
                  data-modalidx={i}
                  onTouchStart={e => onTouchStartModal(e, i)}
                  onTouchMove={onTouchMoveModal}
                  onTouchEnd={onTouchEndModal}
                  onMouseDown={e => onMouseDownModal(e, i)}
                  style={{
                    padding:'8px 0', borderBottom:'1px solid #f5f5f7',
                    cursor: editando === a.id ? 'default' : 'grab',
                    userSelect:'none',
                    opacity: draggingModalIdx === i ? 0.4 : 1,
                    borderRadius:'8px', transition:'opacity 0.1s',
                    // Crítico: desactiva el drag nativo del navegador en touch
                    WebkitUserDrag: 'none',
                    touchAction: isDraggingModal.current ? 'none' : 'pan-y'
                  }}>

                  {editando === a.id ? (
                    <div>
                      <div style={{ display:'flex', gap:'8px', marginBottom:'8px', alignItems:'center' }}>
                        <div onClick={() => toggleRealizada(modalDia, a.id)}
                          style={{ width:'22px', height:'22px', borderRadius:'6px', border: a.realizada?'none':'2px solid #d0d0d0',
                            background: a.realizada?'#534AB7':'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
                          {a.realizada && <span style={{ color:'white', fontSize:'13px' }}>✓</span>}
                        </div>
                        <input value={textoEditar} onChange={e => setTextoEditar(e.target.value)}
                          onKeyDown={e => e.key==='Enter' && guardarEdicion(modalDia)}
                          autoFocus
                          style={{ flex:1, padding:'6px 10px', borderRadius:'8px', border:'1.5px solid #534AB7', fontSize:'15px', outline:'none' }} />
                        <button onClick={() => guardarEdicion(modalDia)}
                          style={{ background:'#534AB7', border:'none', borderRadius:'8px', padding:'6px 12px', color:'white', cursor:'pointer', fontSize:'14px' }}>✓</button>
                      </div>
                      <div style={{ marginLeft:'32px' }}>
                        <button onClick={() => setMostrarCalEditFecha(!mostrarCalEditFecha)}
                          style={{ background:'#EEF2FF', border:'none', borderRadius:'8px', padding:'6px 12px', cursor:'pointer', fontSize:'13px', color:'#534AB7', fontWeight:'500' }}>
                          📅 {editFecha ? `${editFecha.dia} ${MESES[editFecha.mes]} ${editFecha.anio}` : 'Fecha'} {mostrarCalEditFecha?'▲':'▼'}
                        </button>
                        {mostrarCalEditFecha && (
                          <div style={{ background:'#f5f5f7', borderRadius:'12px', padding:'12px', marginTop:'8px' }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                              <button onClick={() => { if(mesCalEdit===0){setMesCalEdit(11);setAnioCalEdit(anioCalEdit-1)}else setMesCalEdit(mesCalEdit-1) }}
                                style={{ background:'white', border:'1px solid #e5e5e5', borderRadius:'8px', padding:'3px 10px', cursor:'pointer' }}>&lt;</button>
                              <div style={{ fontSize:'13px', fontWeight:'600' }}>{MESES[mesCalEdit]} {anioCalEdit}</div>
                              <button onClick={() => { if(mesCalEdit===11){setMesCalEdit(0);setAnioCalEdit(anioCalEdit+1)}else setMesCalEdit(mesCalEdit+1) }}
                                style={{ background:'white', border:'1px solid #e5e5e5', borderRadius:'8px', padding:'3px 10px', cursor:'pointer' }}>&gt;</button>
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px', marginBottom:'4px' }}>
                              {DIAS_SEMANA.map(d => <div key={d} style={{ textAlign:'center', fontSize:'10px', color:'#aaa' }}>{d}</div>)}
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px' }}>
                              {celdasCalEdit.map((d,i) => (
                                <div key={i} onClick={() => d && seleccionarFechaEdicion(d)}
                                  style={{ height:'32px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'6px',
                                    cursor: d?'pointer':'default', fontSize:'12px',
                                    background: d && editFecha?.dia===d && editFecha?.mes===mesCalEdit && editFecha?.anio===anioCalEdit?'#534AB7': d?'white':'transparent',
                                    color: d && editFecha?.dia===d && editFecha?.mes===mesCalEdit && editFecha?.anio===anioCalEdit?'white':'#2C2C2A',
                                    border: d?'1px solid #e5e5e5':'none' }}>
                                  {d||''}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
                      <div onClick={() => toggleRealizada(modalDia, a.id)}
                        style={{ width:'22px', height:'22px', borderRadius:'6px', border: a.realizada?'none':'2px solid #d0d0d0',
                          background: a.realizada?'#534AB7':'white', display:'flex', alignItems:'center', justifyContent:'center',
                          cursor:'pointer', flexShrink:0, marginTop:'1px' }}>
                        {a.realizada && <span style={{ color:'white', fontSize:'13px' }}>✓</span>}
                      </div>
                      <div style={{ flex:1, fontSize:'15px', color: a.realizada?'#aaa':'#2C2C2A',
                        background: a.realizada?'#FFFDE7':'transparent', borderRadius:'4px',
                        padding: a.realizada?'2px 6px':'0', textDecoration: a.realizada?'line-through':'none',
                        lineHeight:'1.4', textAlign:'left', wordBreak:'break-word' }}>
                        {a.texto}
                      </div>
                      <div style={{ display:'flex', gap:'4px', flexShrink:0 }}>
                        <button onClick={e => { e.stopPropagation(); iniciarEdicion(a, i) }}
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:'16px', padding:'2px' }}>✏️</button>
                        <button onClick={e => { e.stopPropagation(); confirmarEliminarFn(modalDia, a) }}
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:'16px', padding:'2px' }}>🗑️</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Línea azul al final de la lista */}
            {dragOverModal === (anotaciones[getKey(anio,mes,modalDia)]||[]).length && (
              <div style={{ height:'3px', background:'#534AB7', borderRadius:'2px', margin:'3px 0' }} />
            )}

            {!(anotaciones[getKey(anio,mes,modalDia)]||[]).length && (
              <div style={{ textAlign:'center', color:'#aaa', fontSize:'14px', padding:'20px 0' }}>No hay anotaciones para este dia</div>
            )}
          </div>
        </div>
      )}

      {/* Confirmacion eliminar */}
      {confirmEliminar && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'white', borderRadius:'20px', padding:'28px 24px', width:'300px', textAlign:'center' }}>
            <div style={{ fontSize:'16px', fontWeight:'700', color:'#2C2C2A', marginBottom:'8px' }}>
              {confirmEliminar.anotacion.repeatGroupId ? '¿Qué deseas eliminar?' : '¿Eliminar esta tarea?'}
            </div>
            <div style={{ fontSize:'14px', color:'#888', marginBottom:'20px' }}>"{confirmEliminar.anotacion.texto}"</div>
            {confirmEliminar.anotacion.repeatGroupId ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <button onClick={() => ejecutarEliminar(true)}
                  style={{ padding:'12px', background:'#f5f5f7', border:'none', borderRadius:'12px', cursor:'pointer', fontSize:'15px', color:'#2C2C2A', fontWeight:'500' }}>
                  Solo esta fecha
                </button>
                <button onClick={() => ejecutarEliminar(false)}
                  style={{ padding:'12px', background:'#ff3b30', border:'none', borderRadius:'12px', cursor:'pointer', fontSize:'15px', color:'white', fontWeight:'600' }}>
                  Todas las repeticiones
                </button>
                <button onClick={() => setConfirmEliminar(null)}
                  style={{ padding:'12px', background:'none', border:'none', cursor:'pointer', fontSize:'15px', color:'#888' }}>
                  Cancelar
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', gap:'10px' }}>
                <button onClick={() => setConfirmEliminar(null)}
                  style={{ flex:1, padding:'12px', background:'#f5f5f7', border:'none', borderRadius:'12px', cursor:'pointer', fontSize:'15px' }}>
                  Cancelar
                </button>
                <button onClick={() => ejecutarEliminar(true)}
                  style={{ flex:1, padding:'12px', background:'#ff3b30', border:'none', borderRadius:'12px', cursor:'pointer', fontSize:'15px', color:'white', fontWeight:'600' }}>
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
