import { useState, useRef, useEffect } from 'react'
import { db } from './firebase'
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function generarId() { return Math.random().toString(36).substr(2, 9) }

const EMOJIS_GRUPO = ['👨‍👩‍👧‍👦','💼','🏠','🎯','⭐','🚀','❤️','🎨','🏋️','📚','🌿','🎵']

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
        {DIAS_SEMANA.map(d => <div key={d} style={{ textAlign:'center', fontSize:'8px', color:'#aaa', fontWeight:'600' }}>{d[0]}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'1px' }}>
        {celdas.map((dia, idx) => {
          const lista = dia ? (anotaciones[getKey(anio, mes, dia)] || []) : []
          return (
            <div key={idx} style={{ height:'24px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%', cursor:'default', fontSize:'10px', background: esHoyDia(dia) ? '#534AB7' : 'transparent', color: esHoyDia(dia) ? 'white' : dia ? '#2C2C2A' : 'transparent', fontWeight: esHoyDia(dia) ? '700' : '400', position:'relative' }}>
              {dia || ''}
              {lista.length > 0 && !esHoyDia(dia) && (
                <div style={{ position:'absolute', bottom:'2px', left:'50%', transform:'translateX(-50%)', width:'4px', height:'4px', borderRadius:'50%', background:'#534AB7' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Pizarron({ onVolver, userId, userEmail, userName }) {
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [vistaAnual, setVistaAnual] = useState(false)
  const [anioAnual, setAnioAnual] = useState(hoy.getFullYear())
  const [anotaciones, setAnotaciones] = useState({})
  const [cargando, setCargando] = useState(true)
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
  const [dragOverModal, setDragOverModal] = useState(null)
  const [draggingModalIdx, setDraggingModalIdx] = useState(null)

  // Grupos
  const [grupos, setGrupos] = useState([])
  const [grupoActivo, setGrupoActivo] = useState('personal')
  const [modalGrupos, setModalGrupos] = useState(false)
  const [modalCrearGrupo, setModalCrearGrupo] = useState(false)
  const [modalVerGrupo, setModalVerGrupo] = useState(null)
  const [nuevoNombreGrupo, setNuevoNombreGrupo] = useState('')
  const [nuevoEmojiGrupo, setNuevoEmojiGrupo] = useState('👨‍👩‍👧‍👦')
  const [linkInvitacion, setLinkInvitacion] = useState('')
  const [cargandoGrupos, setCargandoGrupos] = useState(true)

  const dragItem = useRef(null)
  const dragGhost = useRef(null)
  const editandoIdxRef = useRef(null)
  const longPressTimerCalendario = useRef(null)
  const longPressTimerModal = useRef(null)
  const touchStartPos = useRef(null)
  const isDraggingCalendario = useRef(false)
  const isDraggingModal = useRef(false)
  const modalDragItem = useRef(null)
  const modalGhost = useRef(null)

  const getKey = (a, m, d) => `${a}-${m}-${d}`

  // Referencia a la colección de anotaciones según grupo activo
  const getPizarronRef = () => {
    if (grupoActivo === 'personal') {
      return userId ? collection(db, 'users', userId, 'pizarron') : null
    } else {
      return collection(db, 'grupos', grupoActivo, 'pizarron')
    }
  }

  // Cargar grupos del usuario
  useEffect(() => {
    if (!userId) return
    const userGruposRef = collection(db, 'users', userId, 'misGrupos')
    const unsub = onSnapshot(userGruposRef, async snap => {
      const gruposData = []
      for (const d of snap.docs) {
        const grupoSnap = await getDoc(doc(db, 'grupos', d.id))
        if (grupoSnap.exists()) {
          gruposData.push({ id: d.id, ...grupoSnap.data() })
        }
      }
      setGrupos(gruposData)
      setCargandoGrupos(false)
    })
    return () => unsub()
  }, [userId])

  // Cargar anotaciones según grupo activo
  useEffect(() => {
    const ref = getPizarronRef()
    if (!ref) return
    setCargando(true)
    const unsub = onSnapshot(ref, snap => {
      const data = {}
      snap.docs.forEach(d => { data[d.id] = d.data().items || [] })
      setAnotaciones(data)
      setCargando(false)
    })
    return () => unsub()
  }, [userId, grupoActivo])

  const guardarKey = async (key, lista) => {
    const ref = getPizarronRef()
    if (!ref) return
    if (lista.length === 0) {
      await deleteDoc(doc(ref, key))
    } else {
      await setDoc(doc(ref, key), { items: lista })
    }
  }

  // Crear grupo
  const crearGrupo = async () => {
    if (!nuevoNombreGrupo.trim() || !userId) return
    const grupoId = generarId()
    const nuevoGrupo = {
      nombre: nuevoNombreGrupo.trim(),
      emoji: nuevoEmojiGrupo,
      adminId: userId,
      adminEmail: userEmail || '',
      adminNombre: userName || '',
      miembros: [{ uid: userId, email: userEmail || '', nombre: userName || '', rol: 'admin' }],
      creadoEn: Date.now()
    }
    await setDoc(doc(db, 'grupos', grupoId), nuevoGrupo)
    await setDoc(doc(db, 'users', userId, 'misGrupos', grupoId), { nombre: nuevoGrupo.nombre, emoji: nuevoGrupo.emoji })
    setGrupoActivo(grupoId)
    setNuevoNombreGrupo('')
    setNuevoEmojiGrupo('👨‍👩‍👧‍👦')
    setModalCrearGrupo(false)
    setModalGrupos(false)
  }

  // Generar link de invitación y compartir
  const compartirInvitacion = async (grupoId, nombreGrupo) => {
    const invitacionId = generarId()
    await setDoc(doc(db, 'invitaciones', invitacionId), {
      grupoId,
      creadoPor: userId,
      creadoEn: Date.now(),
      expiresEn: Date.now() + 7 * 24 * 60 * 60 * 1000,
      usado: false
    })
    const link = `${window.location.origin}?invitacion=${invitacionId}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Syng',
          text: `Te invito a unirte al grupo "${nombreGrupo}" en Syng`,
          url: link
        })
      } catch(e) {
        if (e.name !== 'AbortError') {
          navigator.clipboard.writeText(link)
          alert('Link copiado al portapapeles')
        }
      }
    } else {
      navigator.clipboard.writeText(link)
      alert('Link copiado: ' + link)
    }
  }

  // Aceptar invitación al entrar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const invitacionId = params.get('invitacion')
    if (!invitacionId || !userId) return
    const aceptarInvitacion = async () => {
      const invSnap = await getDoc(doc(db, 'invitaciones', invitacionId))
      if (!invSnap.exists()) return
      const { grupoId } = invSnap.data()
      const grupoSnap = await getDoc(doc(db, 'grupos', grupoId))
      if (!grupoSnap.exists()) return
      const grupo = grupoSnap.data()
      const yaEsMiembro = grupo.miembros?.some(m => m.uid === userId)
      if (!yaEsMiembro) {
        await updateDoc(doc(db, 'grupos', grupoId), {
          miembros: arrayUnion({ uid: userId, email: userEmail || '', nombre: userName || '', rol: 'miembro' })
        })
        await setDoc(doc(db, 'users', userId, 'misGrupos', grupoId), { nombre: grupo.nombre, emoji: grupo.emoji })
      }
      window.history.replaceState({}, '', window.location.pathname)
      setGrupoActivo(grupoId)
    }
    aceptarInvitacion()
  }, [userId])

  const primerDia = new Date(anio, mes, 1).getDay()
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()
  const esHoy = (d) => d === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear()
  const esFinde = (idx) => { const s = idx % 7; return s === 0 || s === 6 }

  const celdas = []
  for (let i = 0; i < primerDia; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d)

  const irAHoy = () => { setMes(hoy.getMonth()); setAnio(hoy.getFullYear()); setVistaAnual(false) }

  const abrirModal = (dia) => {
    setModalDia(dia); setTextoNuevo(''); setMostrarRepetir(false)
    setFechasRepetir([{ dia, mes, anio }]); setMesRepetir(mes); setAnioRepetir(anio)
    setEditando(null); setEditFecha(null); setMostrarCalEditFecha(false)
  }

  const cerrarModal = () => {
    setModalDia(null); setEditando(null); setConfirmEliminar(null)
    setMostrarRepetir(false); setFechasRepetir([]); setEditFecha(null)
    setMostrarCalEditFecha(false); setDragOverModal(null); setDraggingModalIdx(null)
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

  const esFechaSeleccionada = (d) => fechasRepetir.some(f => f.dia === d && f.mes === mesRepetir && f.anio === anioRepetir)

  const agregarAnotacion = async () => {
    if (!textoNuevo.trim()) return
    const repeatGroupId = fechasRepetir.length > 1 ? generarId() : null
    const nuevas = { ...anotaciones }
    const promises = []
    fechasRepetir.forEach(({ dia, mes: m, anio: a }) => {
      const key = getKey(a, m, dia)
      nuevas[key] = [...(nuevas[key] || []), { id: generarId(), texto: textoNuevo.trim(), realizada: false, repeatGroupId, dia, mes: m, anio: a, creadoPor: userId }]
      promises.push(guardarKey(key, nuevas[key]))
    })
    setAnotaciones(nuevas)
    await Promise.all(promises)
    setTextoNuevo(''); setMostrarRepetir(false); setFechasRepetir([{ dia: modalDia, mes, anio }])
  }

  const toggleRealizada = async (dia, id) => {
    const key = getKey(anio, mes, dia)
    const lista = (anotaciones[key] || []).map(a => a.id === id ? { ...a, realizada: !a.realizada } : a)
    const nuevas = { ...anotaciones, [key]: lista }
    setAnotaciones(nuevas)
    await guardarKey(key, lista)
  }

  const confirmarEliminarFn = (dia, anotacion) => setConfirmEliminar({ dia, anotacion })

  const ejecutarEliminar = async (soloEsta) => {
    if (!confirmEliminar) return
    const { dia, anotacion } = confirmEliminar
    const nuevas = { ...anotaciones }
    const promises = []
    if (soloEsta || !anotacion.repeatGroupId) {
      const key = getKey(anio, mes, dia)
      nuevas[key] = (nuevas[key] || []).filter(a => a.id !== anotacion.id)
      promises.push(guardarKey(key, nuevas[key]))
    } else {
      Object.keys(nuevas).forEach(key => {
        const antes = nuevas[key].length
        nuevas[key] = nuevas[key].filter(a => a.repeatGroupId !== anotacion.repeatGroupId)
        if (nuevas[key].length !== antes) promises.push(guardarKey(key, nuevas[key]))
      })
    }
    setAnotaciones(nuevas)
    await Promise.all(promises)
    setConfirmEliminar(null)
  }

  const iniciarEdicion = (a, idx) => {
    setEditando(a.id); editandoIdxRef.current = idx; setTextoEditar(a.texto)
    setEditFecha({ dia: a.dia, mes: a.mes, anio: a.anio })
    setMesCalEdit(a.mes); setAnioCalEdit(a.anio); setMostrarCalEditFecha(false)
  }

  const guardarEdicion = async (diaModal) => {
    if (!textoEditar.trim() || !editando) return
    const keyVieja = getKey(anio, mes, diaModal)
    const nuevas = { ...anotaciones }
    const listaVieja = [...(nuevas[keyVieja] || [])]
    const itemOriginal = listaVieja.find(a => a.id === editando)
    nuevas[keyVieja] = listaVieja.filter(a => a.id !== editando)
    const promises = [guardarKey(keyVieja, nuevas[keyVieja])]
    const targets = mostrarRepetir && fechasRepetir.length > 0 ? fechasRepetir : [editFecha || { dia: diaModal, mes, anio }]
    const repeatGroupId = targets.length > 1 ? generarId() : null
    targets.forEach(({ dia, mes: m, anio: a }) => {
      const keyNueva = getKey(a, m, dia)
      const itemActualizado = { ...itemOriginal, id: generarId(), texto: textoEditar.trim(), dia, mes: m, anio: a, repeatGroupId }
      nuevas[keyNueva] = [...(nuevas[keyNueva] || []), itemActualizado]
      promises.push(guardarKey(keyNueva, nuevas[keyNueva]))
    })
    setAnotaciones(nuevas)
    await Promise.all(promises)
    setEditando(null); editandoIdxRef.current = null; setTextoEditar(''); setEditFecha(null); setMostrarCalEditFecha(false); setMostrarRepetir(false); setFechasRepetir([{dia:diaModal,mes,anio}])
  }

  const seleccionarFechaEdicion = (d) => { setEditFecha({ dia: d, mes: mesCalEdit, anio: anioCalEdit }); setMostrarCalEditFecha(false) }

  const limpiarDragCalendario = () => {
    if (dragGhost.current) {
      try { document.body.removeChild(dragGhost.current) } catch(e) {}
      dragGhost.current = null
    }
    isDraggingCalendario.current = false
    dragItem.current = null
    if (longPressTimerCalendario.current) {
      clearTimeout(longPressTimerCalendario.current)
      longPressTimerCalendario.current = null
    }
  }

  const onTouchStartCalendario = (e, fromKey, idx) => {
    limpiarDragCalendario()
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    longPressTimerCalendario.current = setTimeout(() => {
      isDraggingCalendario.current = true
      dragItem.current = { fromKey, idx }
      const ghost = document.createElement('div')
      ghost.style.cssText = 'position:fixed;padding:8px 14px;background:#534AB7;color:white;border-radius:10px;font-size:13px;pointer-events:none;z-index:9999;opacity:0.9;top:50%;left:50%;transform:translate(-50%,-50%);'
      ghost.innerText = '✦ moviendo...'
      document.body.appendChild(ghost)
      dragGhost.current = ghost
    }, 600)
  }

  const onTouchMoveCalendario = (e) => {
    const touch = e.touches[0]
    if (!isDraggingCalendario.current) {
      if (touchStartPos.current) {
        const dx = Math.abs(touch.clientX - touchStartPos.current.x)
        const dy = Math.abs(touch.clientY - touchStartPos.current.y)
        if (dx > 8 || dy > 8) { clearTimeout(longPressTimerCalendario.current); longPressTimerCalendario.current = null }
      }
      return
    }
    e.preventDefault()
    if (dragGhost.current) { dragGhost.current.style.left = (touch.clientX-50)+'px'; dragGhost.current.style.top = (touch.clientY-30)+'px'; dragGhost.current.style.display='none' }
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    if (dragGhost.current) dragGhost.current.style.display='block'
    const celdaEl = el?.closest('[data-dia]')
    if (celdaEl) { const d = celdaEl.getAttribute('data-dia'); setDragOverCelda(d ? parseInt(d) : null) }
    else setDragOverCelda(null)
  }

  const onTouchEndCalendario = async (e) => {
    clearTimeout(longPressTimerCalendario.current); longPressTimerCalendario.current = null
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
          await Promise.all([guardarKey(fromKey, nuevas[fromKey]), guardarKey(toKey, nuevas[toKey])])
        }
      }
    }
    limpiarDragCalendario()
    setDragOverCelda(null)
  }

  const onTouchStartModal = (e, idx) => {
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    isDraggingModal.current = false
    longPressTimerModal.current = setTimeout(() => {
      isDraggingModal.current = true; modalDragItem.current = { fromIdx: idx }; setDraggingModalIdx(idx)
      const ghost = document.createElement('div')
      ghost.style.cssText = 'position:fixed;padding:8px 14px;background:#534AB7;color:white;border-radius:10px;font-size:13px;pointer-events:none;z-index:9999;opacity:0.9;'
      ghost.innerText = 'reordenando...'
      document.body.appendChild(ghost); modalGhost.current = ghost
    }, 500)
  }

  const onTouchMoveModal = (e) => {
    const touch = e.touches[0]
    if (!isDraggingModal.current) {
      if (touchStartPos.current) {
        const dx = Math.abs(touch.clientX - touchStartPos.current.x)
        const dy = Math.abs(touch.clientY - touchStartPos.current.y)
        if (dx > 10 || dy > 10) { clearTimeout(longPressTimerModal.current); longPressTimerModal.current = null }
      }
      return
    }
    e.preventDefault()
    if (modalGhost.current) { modalGhost.current.style.left = (touch.clientX-70)+'px'; modalGhost.current.style.top = (touch.clientY-30)+'px'; modalGhost.current.style.display='none' }
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    if (modalGhost.current) modalGhost.current.style.display='block'
    const itemEl = el?.closest('[data-modalidx]')
    if (itemEl) setDragOverModal(parseInt(itemEl.getAttribute('data-modalidx')))
    else setDragOverModal(null)
  }

  const onTouchEndModal = async (e) => {
    clearTimeout(longPressTimerModal.current); longPressTimerModal.current = null
    if (modalGhost.current) { document.body.removeChild(modalGhost.current); modalGhost.current = null }
    if (!isDraggingModal.current) { isDraggingModal.current = false; modalDragItem.current = null; setDraggingModalIdx(null); return }
    const touch = e.changedTouches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const itemEl = el?.closest('[data-modalidx]')
    if (itemEl && modalDragItem.current && modalDia) {
      const toIdx = parseInt(itemEl.getAttribute('data-modalidx'))
      const fromIdx = modalDragItem.current.fromIdx
      if (fromIdx !== toIdx) {
        const toKey = getKey(anio, mes, modalDia)
        const lista = [...(anotaciones[toKey] || [])]
        const [item] = lista.splice(fromIdx, 1); lista.splice(toIdx, 0, item)
        setAnotaciones({ ...anotaciones, [toKey]: lista })
        await guardarKey(toKey, lista)
      }
    }
    setDragOverModal(null); setDraggingModalIdx(null); isDraggingModal.current = false; modalDragItem.current = null
  }

  const onDragStartCalendario = (e, fromKey, idx) => { dragItem.current = { fromKey, idx }; e.dataTransfer.effectAllowed = 'move' }

  const onDropCelda = async (e, dia) => {
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
    await Promise.all([guardarKey(fromKey, nuevas[fromKey]), guardarKey(toKey, nuevas[toKey])])
    dragItem.current = null
  }

  const onMouseDownModal = (e, idx) => {
    if (e.button !== 0) return
    const startY = e.clientY; let dragStarted = false
    modalDragItem.current = { fromIdx: idx }
    const onMouseMove = (ev) => {
      if (!dragStarted && Math.abs(ev.clientY - startY) > 5) { dragStarted = true; setDraggingModalIdx(idx) }
      if (!dragStarted) return
      const el = document.elementFromPoint(ev.clientX, ev.clientY)
      const itemEl = el?.closest('[data-modalidx]')
      setDragOverModal(itemEl ? parseInt(itemEl.getAttribute('data-modalidx')) : null)
    }
    const onMouseUp = async (ev) => {
      document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp)
      if (dragStarted) {
        const el = document.elementFromPoint(ev.clientX, ev.clientY)
        const itemEl = el?.closest('[data-modalidx]')
        if (itemEl && modalDragItem.current && modalDia) {
          const toIdx = parseInt(itemEl.getAttribute('data-modalidx'))
          const fromIdx = modalDragItem.current.fromIdx
          if (fromIdx !== toIdx) {
            const toKey = getKey(anio, mes, modalDia)
            const lista = [...(anotaciones[toKey] || [])]
            const [item] = lista.splice(fromIdx, 1); lista.splice(toIdx, 0, item)
            setAnotaciones(prev => ({ ...prev, [toKey]: lista }))
            await guardarKey(toKey, lista)
          }
        }
      }
      setDragOverModal(null); setDraggingModalIdx(null); modalDragItem.current = null
    }
    document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp)
  }

  const buildCeldas = (a, m) => {
    const primer = new Date(a, m, 1).getDay(); const dias = new Date(a, m+1, 0).getDate()
    const arr = []
    for (let i = 0; i < primer; i++) arr.push(null)
    for (let d = 1; d <= dias; d++) arr.push(d)
    return arr
  }

  const celdasRepetir = buildCeldas(anioRepetir, mesRepetir)
  const celdasCalEdit = buildCeldas(anioCalEdit, mesCalEdit)
  const esMesActual = (m) => m === hoy.getMonth() && anioAnual === hoy.getFullYear()

  const grupoActivoData = grupos.find(g => g.id === grupoActivo)
  const nombreGrupoActivo = grupoActivo === 'personal' ? 'Personal' : (grupoActivoData?.nombre || 'Grupo')
  const emojiGrupoActivo = grupoActivo === 'personal' ? '👤' : (grupoActivoData?.emoji || '👥')

  if (cargando) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f5f7' }}>
      <div style={{ fontSize:'15px', color:'#aaa' }}>Cargando pizarron...</div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f7', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#185FA5,#534AB7)', padding:'16px 20px', display:'flex', alignItems:'center', gap:'10px' }}>
        <button onClick={onVolver} style={{ background:'rgba(255,255,255,0.2)', border:'none', color:'white', borderRadius:'20px', padding:'6px 14px', cursor:'pointer', fontSize:'14px', whiteSpace:'nowrap' }}>Atras</button>
        <div style={{ color:'white', fontSize:'18px', fontWeight:'700', flex:1, textAlign:'center' }}>Pizarron Interactivo</div>
        <button onClick={() => setModalGrupos(true)} style={{ background:'rgba(255,255,255,0.2)', border:'none', color:'white', borderRadius:'16px', padding:'6px 12px', cursor:'pointer', fontSize:'13px', display:'flex', alignItems:'center', gap:'6px', whiteSpace:'nowrap' }}>
          <span style={{ fontSize:'18px' }}>{emojiGrupoActivo}</span>
          <span style={{ maxWidth:'80px', overflow:'hidden', textOverflow:'ellipsis' }}>{nombreGrupoActivo}</span>
          <span>▾</span>
        </button>
      </div>

      {vistaAnual ? (
        <div style={{ padding:'0 12px 100px 12px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 0' }}>
            <button onClick={() => setAnioAnual(anioAnual-1)} style={{ background:'#185FA5', border:'none', borderRadius:'10px', padding:'8px 16px', cursor:'pointer', fontSize:'22px', color:'white', fontWeight:'bold' }}>&#8249;</button>
            <div style={{ fontSize:'32px', fontWeight:'800', color: anioAnual === hoy.getFullYear() ? '#534AB7' : '#2C2C2A' }}>{anioAnual}</div>
            <button onClick={() => setAnioAnual(anioAnual+1)} style={{ background:'#185FA5', border:'none', borderRadius:'10px', padding:'8px 16px', cursor:'pointer', fontSize:'22px', color:'white', fontWeight:'bold' }}>&#8250;</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
            {MESES_CORTO.map((nombreCorto, m) => (
              <div key={m} onClick={() => { setMes(m); setAnio(anioAnual); setVistaAnual(false) }}
                style={{ background:'white', borderRadius:'16px', padding:'12px', border: esMesActual(m) ? '2px solid #534AB7' : '1px solid #ececec', cursor:'pointer', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize:'16px', fontWeight:'700', color: esMesActual(m) ? '#534AB7' : '#2C2C2A', marginBottom:'8px' }}>{nombreCorto}</div>
                <MiniMes anio={anioAnual} mes={m} hoy={hoy} anotaciones={anotaciones} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px' }}>
            <button onClick={() => { if(mes===0){setMes(11);setAnio(anio-1)}else setMes(mes-1) }} style={{ background:'#185FA5', border:'none', borderRadius:'10px', padding:'8px 16px', cursor:'pointer', fontSize:'22px', color:'white', fontWeight:'bold' }}>&#8249;</button>
            <button onClick={() => setVistaAnual(true)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'18px', fontWeight:'700', color:'#2C2C2A' }}>{MESES[mes]} {anio} &#9660;</button>
            <button onClick={() => { if(mes===11){setMes(0);setAnio(anio+1)}else setMes(mes+1) }} style={{ background:'#185FA5', border:'none', borderRadius:'10px', padding:'8px 16px', cursor:'pointer', fontSize:'22px', color:'white', fontWeight:'bold' }}>&#8250;</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'0 12px', gap:'2px', marginBottom:'4px' }}>
            {DIAS_SEMANA.map(d => <div key={d} style={{ textAlign:'center', fontSize:'12px', fontWeight:'600', color:'#888', padding:'4px 0' }}>{d}</div>)}
          </div>

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
                  style={{ minHeight:'80px', overflow:'hidden', background: isDragOver?'#EEF2FF': dia?(esFinde(idx)?'#F8F8F8':'white'):'transparent', borderRadius:'10px', padding:'4px', border: isDragOver?'2px dashed #534AB7': esHoy(dia)?'2px solid #534AB7':'1px solid #ececec', boxSizing:'border-box', transition:'all 0.15s' }}>
                  {dia && (
                    <>
                      <div onClick={() => abrirModal(dia)} style={{ fontSize:'12px', fontWeight: esHoy(dia)?'700':'400', color: esHoy(dia)?'#534AB7':'#2C2C2A', marginBottom:'2px', cursor:'pointer', display:'inline-block', padding:'1px 3px', borderRadius:'4px' }}>{dia}</div>
                      {lista.slice(0,2).map((a, i) => (
                        <div key={i} draggable onDragStart={e => onDragStartCalendario(e, key, i)}
                          style={{ display:'flex', alignItems:'flex-start', gap:'2px', marginBottom:'1px', userSelect:'none' }}>
                          <span
                            onTouchStart={e => { e.stopPropagation(); limpiarDragCalendario(); touchStartPos.current={x:e.touches[0].clientX,y:e.touches[0].clientY}; isDraggingCalendario.current=true; dragItem.current={fromKey:key,idx:i}; const g=document.createElement('div'); g.style.cssText='position:fixed;padding:6px 12px;background:#534AB7;color:white;border-radius:10px;font-size:12px;pointer-events:none;z-index:9999;opacity:0.9;'; g.innerText='moviendo...'; document.body.appendChild(g); dragGhost.current=g; }}
                            onTouchMove={onTouchMoveCalendario}
                            onTouchEnd={onTouchEndCalendario}
                            style={{ fontSize:'13px', color:'#bbb', flexShrink:0, lineHeight:'1.3', cursor:'grab', padding:'0 2px', touchAction:'none' }}>⠿</span>
                          <span onClick={() => abrirModal(dia)} style={{ fontSize:'9px', color: a.realizada?'#ccc':'#2C2C2A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, textDecoration: a.realizada?'line-through':'none', lineHeight:'1.3', textAlign:'left' }}>{a.texto}</span>
                        </div>
                      ))}
                      {lista.length === 0 && <div onClick={() => abrirModal(dia)} style={{ height:'48px', cursor:'pointer' }} />}
                      {lista.length > 2 && <div onClick={() => abrirModal(dia)} style={{ fontSize:'9px', color:'#aaa', cursor:'pointer', marginTop:'1px', textAlign:'left' }}>+{lista.length-2} mas</div>}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* MODAL GRUPOS */}
      {modalGrupos && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={e => { if(e.target===e.currentTarget) setModalGrupos(false) }}>
          <div style={{ background:'white', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:'600px', padding:'24px', maxHeight:'80vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <div style={{ fontSize:'18px', fontWeight:'700', color:'#2C2C2A' }}>Mis Pizarrones</div>
              <button onClick={() => setModalGrupos(false)} style={{ background:'#f0f0f0', border:'none', borderRadius:'50%', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px' }}>&#10005;</button>
            </div>

            {/* Personal */}
            <div onClick={() => { setGrupoActivo('personal'); setModalGrupos(false) }}
              style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', borderRadius:'14px', background: grupoActivo==='personal'?'#EEF2FF':'#f8f8f8', marginBottom:'8px', cursor:'pointer', border: grupoActivo==='personal'?'2px solid #534AB7':'2px solid transparent' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'linear-gradient(135deg,#185FA5,#534AB7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>👤</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'16px', fontWeight:'600', color:'#2C2C2A' }}>Personal</div>
                <div style={{ fontSize:'12px', color:'#888' }}>Solo yo</div>
              </div>
              {grupoActivo==='personal' && <span style={{ color:'#534AB7', fontSize:'20px' }}>&#10003;</span>}
            </div>

            {/* Grupos */}
            {grupos.map(g => (
              <div key={g.id} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', borderRadius:'14px', background: grupoActivo===g.id?'#EEF2FF':'#f8f8f8', marginBottom:'8px', cursor:'pointer', border: grupoActivo===g.id?'2px solid #534AB7':'2px solid transparent' }}>
                <div onClick={() => { setGrupoActivo(g.id); setModalGrupos(false) }} style={{ display:'flex', alignItems:'center', gap:'14px', flex:1 }}>
                  <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'linear-gradient(135deg,#185FA5,#534AB7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>{g.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'16px', fontWeight:'600', color:'#2C2C2A' }}>{g.nombre}</div>
                    <div style={{ fontSize:'12px', color:'#888' }}>{g.miembros?.length || 1} miembro{(g.miembros?.length || 1)!==1?'s':''}</div>
                  </div>
                  {grupoActivo===g.id && <span style={{ color:'#534AB7', fontSize:'20px' }}>&#10003;</span>}
                </div>
                <button onClick={() => { setModalVerGrupo(g); setModalGrupos(false) }}
                  style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#aaa', padding:'4px' }}>&#9432;</button>
              </div>
            ))}

            <button onClick={() => { setModalCrearGrupo(true); setModalGrupos(false) }}
              style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#185FA5,#534AB7)', color:'white', border:'none', borderRadius:'14px', fontSize:'15px', fontWeight:'600', cursor:'pointer', marginTop:'8px' }}>
              + Crear nuevo grupo
            </button>
          </div>
        </div>
      )}

      {/* MODAL CREAR GRUPO */}
      {modalCrearGrupo && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
          onClick={e => { if(e.target===e.currentTarget) setModalCrearGrupo(false) }}>
          <div style={{ background:'white', borderRadius:'20px', width:'100%', maxWidth:'400px', padding:'24px' }}>
            <div style={{ fontSize:'18px', fontWeight:'700', color:'#2C2C2A', marginBottom:'20px', textAlign:'center' }}>Nuevo grupo</div>

            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'20px', justifyContent:'center' }}>
              {EMOJIS_GRUPO.map(e => (
                <button key={e} onClick={() => setNuevoEmojiGrupo(e)}
                  style={{ fontSize:'24px', padding:'8px', borderRadius:'12px', border: nuevoEmojiGrupo===e?'2px solid #534AB7':'2px solid transparent', background: nuevoEmojiGrupo===e?'#EEF2FF':'#f8f8f8', cursor:'pointer' }}>
                  {e}
                </button>
              ))}
            </div>

            <div style={{ marginBottom:'20px' }}>
              <div style={{ fontSize:'13px', fontWeight:'500', color:'#666', marginBottom:'6px' }}>Nombre del grupo *</div>
              <input value={nuevoNombreGrupo} onChange={e => setNuevoNombreGrupo(e.target.value)}
                placeholder="Ej: Familia, Trabajo, Amigos..."
                style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #ddd', borderRadius:'12px', fontSize:'16px', outline:'none', boxSizing:'border-box' }} />
            </div>

            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={() => setModalCrearGrupo(false)} style={{ flex:1, padding:'13px', background:'#E0E0E0', border:'none', borderRadius:'12px', cursor:'pointer', fontSize:'15px', fontWeight:'600', color:'#333' }}>Cancelar</button>
              <button onClick={crearGrupo} style={{ flex:1, padding:'13px', background: nuevoNombreGrupo.trim()?'linear-gradient(135deg,#185FA5,#534AB7)':'#e5e5e5', color: nuevoNombreGrupo.trim()?'white':'#aaa', border:'none', borderRadius:'12px', cursor:'pointer', fontSize:'15px', fontWeight:'600' }}>Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VER GRUPO */}
      {modalVerGrupo && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={e => { if(e.target===e.currentTarget) { setModalVerGrupo(null); setLinkInvitacion('') } }}>
          <div style={{ background:'white', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:'600px', padding:'24px', maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <div style={{ fontSize:'18px', fontWeight:'700', color:'#2C2C2A', display:'flex', alignItems:'center', gap:'10px' }}>
                <span style={{ fontSize:'28px' }}>{modalVerGrupo.emoji}</span>
                {modalVerGrupo.nombre}
              </div>
              <button onClick={() => { setModalVerGrupo(null); setLinkInvitacion('') }} style={{ background:'#f0f0f0', border:'none', borderRadius:'50%', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px' }}>&#10005;</button>
            </div>

            {/* Miembros */}
            <div style={{ fontSize:'13px', fontWeight:'600', color:'#888', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Miembros ({modalVerGrupo.miembros?.length || 1})</div>
            {(modalVerGrupo.miembros || []).map((m, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 0', borderBottom:'0.5px solid #f0f0f0' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'linear-gradient(135deg,#185FA5,#534AB7)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'16px', fontWeight:'700', flexShrink:0 }}>
                  {(m.nombre || m.email || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'14px', fontWeight:'500', color:'#2C2C2A' }}>{m.nombre || m.email}</div>
                  <div style={{ fontSize:'12px', color:'#aaa' }}>{m.rol === 'admin' ? 'Administrador' : 'Miembro'}</div>
                </div>
              </div>
            ))}

            {/* Invitar */}
            {modalVerGrupo.adminId === userId && (
              <div style={{ marginTop:'20px' }}>
                <div style={{ fontSize:'13px', fontWeight:'600', color:'#888', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Invitar personas</div>
                <button onClick={() => compartirInvitacion(modalVerGrupo.id, modalVerGrupo.nombre)}
                  style={{ width:'100%', padding:'13px', background:'linear-gradient(135deg,#185FA5,#534AB7)', color:'white', border:'none', borderRadius:'12px', cursor:'pointer', fontSize:'15px', fontWeight:'600', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                  <span>􀈂</span> Invitar al grupo
                </button>
                <div style={{ fontSize:'11px', color:'#aaa', textAlign:'center', marginTop:'8px' }}>Se abrirá WhatsApp, SMS o el medio que elijas</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DIA */}
      {modalDia && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:100, touchAction:'none' }}
          onClick={e => { if(e.target===e.currentTarget) cerrarModal() }}>
          <div style={{ background:'white', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:'600px', maxHeight:'88vh', overflowY:'auto', padding:'24px', overscrollBehavior:'contain', touchAction:'pan-y' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <div style={{ fontSize:'18px', fontWeight:'700', color:'#2C2C2A' }}>{modalDia} de {MESES[mes]} {anio}</div>
              <button onClick={cerrarModal} style={{ background:'#f5f5f7', border:'none', borderRadius:'50%', width:'32px', height:'32px', cursor:'pointer', fontSize:'16px', color:'#888' }}>&#10005;</button>
            </div>

            <div style={{ marginBottom:'12px' }}>
              <div style={{ display:'flex', gap:'8px', marginBottom:'8px' }}>
                <input value={textoNuevo} onChange={e => setTextoNuevo(e.target.value)} onKeyDown={e => e.key==='Enter' && agregarAnotacion()}
                  placeholder="Nueva anotacion..."
                  style={{ flex:1, padding:'10px 14px', borderRadius:'10px', border:'1.5px solid #e5e5e5', fontSize:'15px', outline:'none' }} />
                <button onClick={agregarAnotacion} style={{ background:'linear-gradient(135deg,#185FA5,#534AB7)', color:'white', border:'none', borderRadius:'10px', padding:'10px 18px', cursor:'pointer', fontWeight:'600', fontSize:'16px' }}>+</button>
              </div>
              <button onClick={() => { setMostrarRepetir(!mostrarRepetir); if(!mostrarRepetir) setFechasRepetir([{dia:modalDia,mes,anio}]) }}
                style={{ background: mostrarRepetir?'#EEF2FF':'#f5f5f7', border:'none', borderRadius:'8px', padding:'6px 14px', cursor:'pointer', fontSize:'13px', color: mostrarRepetir?'#534AB7':'#888', fontWeight:'500' }}>
                &#128260; Repetir tarea {mostrarRepetir?'▲':'▼'}
              </button>
            </div>

            {mostrarRepetir && (
              <div style={{ background:'#f5f5f7', borderRadius:'16px', padding:'16px', marginBottom:'16px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                  <button onClick={() => { if(mesRepetir===0){setMesRepetir(11);setAnioRepetir(anioRepetir-1)}else setMesRepetir(mesRepetir-1) }} style={{ background:'white', border:'1px solid #e5e5e5', borderRadius:'8px', padding:'4px 12px', cursor:'pointer' }}>&#8249;</button>
                  <div style={{ fontSize:'14px', fontWeight:'600' }}>{MESES[mesRepetir]} {anioRepetir}</div>
                  <button onClick={() => { if(mesRepetir===11){setMesRepetir(0);setAnioRepetir(anioRepetir+1)}else setMesRepetir(mesRepetir+1) }} style={{ background:'white', border:'1px solid #e5e5e5', borderRadius:'8px', padding:'4px 12px', cursor:'pointer' }}>&#8250;</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px', marginBottom:'6px' }}>
                  {DIAS_SEMANA.map(d => <div key={d} style={{ textAlign:'center', fontSize:'10px', color:'#aaa', fontWeight:'600' }}>{d}</div>)}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px' }}>
                  {celdasRepetir.map((d,i) => (
                    <div key={i} onClick={() => d && toggleFechaRepetir(d)}
                      style={{ height:'34px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'8px', cursor: d?'pointer':'default', fontSize:'13px', background: d && esFechaSeleccionada(d)?'#534AB7': d?'white':'transparent', color: d && esFechaSeleccionada(d)?'white':'#2C2C2A', fontWeight: d && esFechaSeleccionada(d)?'700':'400', border: d?'1px solid #e5e5e5':'none' }}>
                      {d||''}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:'8px', fontSize:'12px', color:'#534AB7', textAlign:'center' }}>{fechasRepetir.length} fecha{fechasRepetir.length!==1?'s':''} seleccionada{fechasRepetir.length!==1?'s':''}</div>
              </div>
            )}

            {(anotaciones[getKey(anio,mes,modalDia)]||[]).map((a,i) => (
              <div key={a.id}>
                {dragOverModal === i && <div style={{ height:'3px', background:'#534AB7', borderRadius:'2px', margin:'3px 0' }} />}
                <div data-modalidx={i}
                  onMouseDown={e => onMouseDownModal(e, i)}
                  onTouchStart={e => onTouchStartModal(e, i)} onTouchMove={onTouchMoveModal} onTouchEnd={onTouchEndModal}
                  style={{ padding:'8px 0', borderBottom:'1px solid #f5f5f7', cursor: editando===a.id?'default':'grab', userSelect:'none', opacity: draggingModalIdx===i?0.4:1, borderRadius:'8px', WebkitUserDrag:'none', touchAction: isDraggingModal.current?'none':'pan-y' }}>
                  {editando === a.id ? (
                    <div>
                      <div style={{ display:'flex', gap:'8px', marginBottom:'8px', alignItems:'center' }}>
                        <div onClick={() => toggleRealizada(modalDia, a.id)} style={{ width:'22px', height:'22px', borderRadius:'6px', border: a.realizada?'none':'2px solid #d0d0d0', background: a.realizada?'#534AB7':'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
                          {a.realizada && <span style={{ color:'white', fontSize:'13px' }}>&#10003;</span>}
                        </div>
                        <input value={textoEditar} onChange={e => setTextoEditar(e.target.value)} onKeyDown={e => e.key==='Enter' && guardarEdicion(modalDia)} autoFocus
                          style={{ flex:1, padding:'6px 10px', borderRadius:'8px', border:'1.5px solid #534AB7', fontSize:'15px', outline:'none' }} />
                        <button onClick={() => guardarEdicion(modalDia)} style={{ background:'#534AB7', border:'none', borderRadius:'8px', padding:'6px 12px', color:'white', cursor:'pointer', fontSize:'14px' }}>&#10003;</button>
                      </div>
                      <div style={{ marginLeft:'32px' }}>
                        <button onClick={() => setMostrarCalEditFecha(!mostrarCalEditFecha)} style={{ background:'#EEF2FF', border:'none', borderRadius:'8px', padding:'6px 12px', cursor:'pointer', fontSize:'13px', color:'#534AB7', fontWeight:'500' }}>
                          &#128197; {editFecha ? `${editFecha.dia} ${MESES[editFecha.mes]} ${editFecha.anio}` : 'Fecha'} {mostrarCalEditFecha?'▲':'▼'}
                        </button>
                        {mostrarCalEditFecha && (
                          <div style={{ background:'#f5f5f7', borderRadius:'12px', padding:'12px', marginTop:'8px' }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                              <button onClick={() => { if(mesCalEdit===0){setMesCalEdit(11);setAnioCalEdit(anioCalEdit-1)}else setMesCalEdit(mesCalEdit-1) }} style={{ background:'white', border:'1px solid #e5e5e5', borderRadius:'8px', padding:'3px 10px', cursor:'pointer' }}>&#8249;</button>
                              <div style={{ fontSize:'13px', fontWeight:'600' }}>{MESES[mesCalEdit]} {anioCalEdit}</div>
                              <button onClick={() => { if(mesCalEdit===11){setMesCalEdit(0);setAnioCalEdit(anioCalEdit+1)}else setMesCalEdit(mesCalEdit+1) }} style={{ background:'white', border:'1px solid #e5e5e5', borderRadius:'8px', padding:'3px 10px', cursor:'pointer' }}>&#8250;</button>
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px', marginBottom:'4px' }}>
                              {DIAS_SEMANA.map(d => <div key={d} style={{ textAlign:'center', fontSize:'10px', color:'#aaa' }}>{d}</div>)}
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px' }}>
                              {celdasCalEdit.map((d,i) => (
                                <div key={i} onClick={() => d && seleccionarFechaEdicion(d)}
                                  style={{ height:'32px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'6px', cursor: d?'pointer':'default', fontSize:'12px', background: d && editFecha?.dia===d && editFecha?.mes===mesCalEdit && editFecha?.anio===anioCalEdit?'#534AB7': d?'white':'transparent', color: d && editFecha?.dia===d && editFecha?.mes===mesCalEdit && editFecha?.anio===anioCalEdit?'white':'#2C2C2A', border: d?'1px solid #e5e5e5':'none' }}>
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
                      <div onClick={() => toggleRealizada(modalDia, a.id)} style={{ width:'22px', height:'22px', borderRadius:'6px', border: a.realizada?'none':'2px solid #d0d0d0', background: a.realizada?'#534AB7':'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, marginTop:'1px' }}>
                        {a.realizada && <span style={{ color:'white', fontSize:'13px' }}>&#10003;</span>}
                      </div>
                      <div style={{ flex:1, fontSize:'15px', color: a.realizada?'#aaa':'#2C2C2A', background: a.realizada?'#FFFDE7':'transparent', borderRadius:'4px', padding: a.realizada?'2px 6px':'0', textDecoration: a.realizada?'line-through':'none', lineHeight:'1.4', textAlign:'left', wordBreak:'break-word' }}>{a.texto}</div>
                      <div style={{ display:'flex', gap:'4px', flexShrink:0 }}>
                        <button onClick={e => { e.stopPropagation(); iniciarEdicion(a, i) }} style={{ background:'#E8F0FE', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'18px', padding:'5px 8px', color:'#185FA5', flexShrink:0 }}>&#9998;</button>
                        <button onClick={e => { e.stopPropagation(); confirmarEliminarFn(modalDia, a) }} style={{ background:'#FEECEC', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'18px', padding:'5px 8px', color:'#A32D2D', flexShrink:0 }}>&#128465;</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {dragOverModal === (anotaciones[getKey(anio,mes,modalDia)]||[]).length && (
              <div style={{ height:'3px', background:'#534AB7', borderRadius:'2px', margin:'3px 0' }} />
            )}

            {!(anotaciones[getKey(anio,mes,modalDia)]||[]).length && (
              <div style={{ textAlign:'center', color:'#aaa', fontSize:'14px', padding:'20px 0' }}>No hay anotaciones para este dia</div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRMAR ELIMINAR */}
      {confirmEliminar && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300 }}>
          <div style={{ background:'white', borderRadius:'20px', padding:'28px 24px', width:'300px', textAlign:'center' }}>
            <div style={{ fontSize:'16px', fontWeight:'700', color:'#2C2C2A', marginBottom:'8px' }}>{confirmEliminar.anotacion.repeatGroupId ? 'Que deseas eliminar?' : 'Eliminar esta tarea?'}</div>
            <div style={{ fontSize:'14px', color:'#888', marginBottom:'20px' }}>"{confirmEliminar.anotacion.texto}"</div>
            {confirmEliminar.anotacion.repeatGroupId ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <button onClick={() => ejecutarEliminar(true)} style={{ padding:'12px', background:'#f5f5f7', border:'none', borderRadius:'12px', cursor:'pointer', fontSize:'15px', color:'#2C2C2A', fontWeight:'500' }}>Solo esta fecha</button>
                <button onClick={() => ejecutarEliminar(false)} style={{ padding:'12px', background:'#ff3b30', border:'none', borderRadius:'12px', cursor:'pointer', fontSize:'15px', color:'white', fontWeight:'600' }}>Todas las repeticiones</button>
                <button onClick={() => setConfirmEliminar(null)} style={{ padding:'12px', background:'#E0E0E0', border:'none', borderRadius:'10px', cursor:'pointer', fontSize:'15px', fontWeight:'700', color:'#333' }}>Cancelar</button>
              </div>
            ) : (
              <div style={{ display:'flex', gap:'10px' }}>
                <button onClick={() => setConfirmEliminar(null)} style={{ flex:1, padding:'12px', background:'#E0E0E0', border:'none', borderRadius:'12px', cursor:'pointer', fontSize:'15px', fontWeight:'700', color:'#333' }}>Cancelar</button>
                <button onClick={() => ejecutarEliminar(true)} style={{ flex:1, padding:'12px', background:'#ff3b30', border:'none', borderRadius:'12px', cursor:'pointer', fontSize:'15px', color:'white', fontWeight:'600' }}>Eliminar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
