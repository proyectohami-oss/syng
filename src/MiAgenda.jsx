import { useState, useEffect, useRef } from 'react'
import { db } from './firebase'
import { collection, doc, getDocs, onSnapshot, setDoc, getDoc } from 'firebase/firestore'

const MESES_TX = {
  es:['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  en:['January','February','March','April','May','June','July','August','September','October','November','December'],
  fr:['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  de:['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
  it:['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'],
  pt:['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  ja:['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  zh:['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
}
const DIAS_TX = {
  es:['L','M','M','J','V','S','D'],
  en:['M','T','W','T','F','S','S'],
  fr:['L','M','M','J','V','S','D'],
  de:['M','D','M','D','F','S','S'],
  it:['L','M','M','G','V','S','D'],
  pt:['S','T','Q','Q','S','S','D'],
  ja:['月','火','水','木','金','土','日'],
  zh:['一','二','三','四','五','六','日'],
}
const TX = {
  es:{ titulo:'Mi Agenda', sinPendientes:'Sin pendientes este día', guardarEn:'Guardar en', enQuePizarron:'¿En qué pizarrón?', nuevaTarea:'¿Qué tienes pendiente?', agregar:'+ agregar', guardar:'Guardar', cancelar:'Cancelar', eliminar:'Eliminar', personal:'Personal', guardarCambios:'Guardar cambios', cambiarFecha:'Cambiar fecha', repetirFechas:'Repetir en más fechas', confirmarEliminar:'¿Eliminar esta tarea?', si:'Sí, eliminar', moverA:'Toca el día al que quieres mover esta tarea', copiarEn:'Toca los días donde quieres copiar esta tarea', fechasSeleccionadas:'fecha(s) seleccionada(s)', repetir:'Repetir', elegirFecha:'Elegir fecha', pendientes:'Pendientes', atendidas:'Atendidas', editarTarea:'Editando tarea' },
  en:{ titulo:'My Agenda', sinPendientes:'No tasks this day', guardarEn:'Save to', enQuePizarron:'Which board?', nuevaTarea:'What is pending?', agregar:'+ add', guardar:'Save', cancelar:'Cancel', eliminar:'Delete', personal:'Personal', guardarCambios:'Save changes', cambiarFecha:'Change date', repetirFechas:'Repeat on more dates', confirmarEliminar:'Delete this task?', si:'Yes, delete', moverA:'Tap the day to move this task', copiarEn:'Tap days to copy this task', fechasSeleccionadas:'date(s) selected', repetir:'Repeat', elegirFecha:'Choose date', pendientes:'Pending', atendidas:'Done', editarTarea:'Editing task' },
  fr:{ titulo:'Mon Agenda', sinPendientes:'Aucune tâche', guardarEn:'Enregistrer dans', enQuePizarron:'Quel tableau?', nuevaTarea:'Quoi de prévu?', agregar:'+ ajouter', guardar:'Enregistrer', cancelar:'Annuler', eliminar:'Supprimer', personal:'Personnel', guardarCambios:'Sauvegarder', cambiarFecha:'Changer date', repetirFechas:'Répéter', confirmarEliminar:'Supprimer cette tâche?', si:'Oui, supprimer', moverA:'Touchez le jour cible', copiarEn:'Touchez les jours à copier', fechasSeleccionadas:'date(s) sélectionnée(s)', repetir:'Répéter', elegirFecha:'Choisir date', pendientes:'En attente', atendidas:'Terminées', editarTarea:'Modifier' },
  de:{ titulo:'Mein Kalender', sinPendientes:'Keine Aufgaben', guardarEn:'Speichern in', enQuePizarron:'Welches Board?', nuevaTarea:'Was steht an?', agregar:'+ hinzufügen', guardar:'Speichern', cancelar:'Abbrechen', eliminar:'Löschen', personal:'Persönlich', guardarCambios:'Speichern', cambiarFecha:'Datum ändern', repetirFechas:'Wiederholen', confirmarEliminar:'Aufgabe löschen?', si:'Ja, löschen', moverA:'Tag antippen', copiarEn:'Tage antippen', fechasSeleccionadas:'Datum ausgewählt', repetir:'Wiederholen', elegirFecha:'Datum wählen', pendientes:'Ausstehend', atendidas:'Erledigt', editarTarea:'Bearbeiten' },
  it:{ titulo:'La Mia Agenda', sinPendientes:'Nessun compito', guardarEn:'Salva in', enQuePizarron:'Quale lavagna?', nuevaTarea:'Cosa hai in sospeso?', agregar:'+ aggiungi', guardar:'Salva', cancelar:'Annulla', eliminar:'Elimina', personal:'Personale', guardarCambios:'Salva', cambiarFecha:'Cambia data', repetirFechas:'Ripeti', confirmarEliminar:'Eliminare?', si:'Sì, elimina', moverA:'Tocca il giorno', copiarEn:'Tocca i giorni', fechasSeleccionadas:'date selezionate', repetir:'Ripeti', elegirFecha:'Scegli data', pendientes:'In sospeso', atendidas:'Completate', editarTarea:'Modifica' },
  pt:{ titulo:'Minha Agenda', sinPendientes:'Sem tarefas', guardarEn:'Salvar em', enQuePizarron:'Qual quadro?', nuevaTarea:'O que está pendente?', agregar:'+ adicionar', guardar:'Salvar', cancelar:'Cancelar', eliminar:'Excluir', personal:'Pessoal', guardarCambios:'Salvar', cambiarFecha:'Alterar data', repetirFechas:'Repetir', confirmarEliminar:'Excluir tarefa?', si:'Sim, excluir', moverA:'Toque no dia', copiarEn:'Toque nos dias', fechasSeleccionadas:'data(s) selecionada(s)', repetir:'Repetir', elegirFecha:'Escolher data', pendientes:'Pendentes', atendidas:'Concluídas', editarTarea:'Editar' },
  ja:{ titulo:'マイアジェンダ', sinPendientes:'タスクなし', guardarEn:'保存先', enQuePizarron:'どのボード?', nuevaTarea:'何が保留中?', agregar:'+ 追加', guardar:'保存', cancelar:'キャンセル', eliminar:'削除', personal:'個人', guardarCambios:'保存', cambiarFecha:'日付変更', repetirFechas:'繰り返す', confirmarEliminar:'削除しますか?', si:'はい', moverA:'移動先の日をタップ', copiarEn:'コピーする日をタップ', fechasSeleccionadas:'日付選択済み', repetir:'繰り返す', elegirFecha:'日付選択', pendientes:'保留中', atendidas:'完了', editarTarea:'編集' },
  zh:{ titulo:'我的日程', sinPendientes:'今天没有待办', guardarEn:'保存到', enQuePizarron:'哪个白板?', nuevaTarea:'有什么待办?', agregar:'+ 添加', guardar:'保存', cancelar:'取消', eliminar:'删除', personal:'个人', guardarCambios:'保存', cambiarFecha:'更改日期', repetirFechas:'重复', confirmarEliminar:'删除此任务?', si:'是的', moverA:'点击目标日期', copiarEn:'点击要复制的日期', fechasSeleccionadas:'个日期已选择', repetir:'重复', elegirFecha:'选择日期', pendientes:'待办', atendidas:'已完成', editarTarea:'编辑' },
}
const COLORES = ['#534AB7','#2ECC9A','#EF9F27','#D4537E','#378ADD','#E24B4A','#639922','#9B59B6']
const TEMA = {
  oscuro:{ bg:'#070712', bgCard:'#18183A', texto:'#F0F0FF', textoSub:'#9090B8', borde:'rgba(255,255,255,0.13)', acento:'#7B6EF6', sombra:'0 4px 24px rgba(0,0,0,0.7)', nombre:'oscuro', puntoDia:'#7B6EF6' },
  claro:{ bg:'#F5F5F7', bgCard:'#FFFFFF', texto:'#1C1C2E', textoSub:'#666680', borde:'#EAEAEA', acento:'#534AB7', sombra:'0 2px 12px rgba(0,0,0,0.07)', nombre:'claro', puntoDia:'#534AB7' },
}

function generarId() { return Math.random().toString(36).slice(2) }
function getKey(a, m, d) { return `${a}-${m}-${d}` }
function primerDiaMes(a, m) { const d = new Date(a, m, 1).getDay(); return d === 0 ? 6 : d - 1 }
function diasEnMes(a, m) { return new Date(a, m + 1, 0).getDate() }
function celdas(a, m) { return [...Array(primerDiaMes(a,m)).fill(null), ...Array(diasEnMes(a,m)).fill(0).map((_,i)=>i+1)] }

export default function MiAgenda({ userId, tema, idioma, onVolver, onNavegar, t }) {
  const th = TEMA[tema] || TEMA.claro
  const tx = TX[idioma] || TX.es
  const meses = MESES_TX[idioma] || MESES_TX.es
  const diasSemana = DIAS_TX[idioma] || DIAS_TX.es
  const esOscuro = tema === 'oscuro'
  const hoy = new Date()

  const [mes, setMes] = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  const [badges, setBadges] = useState({})
  const [grupos, setGrupos] = useState([])
  const [grupoSeleccionado, setGrupoSeleccionado] = useState({ id:'personal', nombre:'Personal', color: COLORES[0] })
  const [mostrarSelectorGrupo, setMostrarSelectorGrupo] = useState(false)
  const [tareas, setTareas] = useState([])
  const [cargandoTareas, setCargandoTareas] = useState(false)
  const [nuevaTarea, setNuevaTarea] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null)
  const [modoEditar, setModoEditar] = useState(null)
  const [modoCapturar, setModoCapturar] = useState(false)
  const [textoEditar, setTextoEditar] = useState('')
  const [editModo, setEditModo] = useState(null)
  const [mostrarElegirFecha, setMostrarElegirFecha] = useState(false)
  const [mesElegir, setMesElegir] = useState(hoy.getMonth())
  const [anioElegir, setAnioElegir] = useState(hoy.getFullYear())
  const [diaElegido, setDiaElegido] = useState(null)
  const [mostrarRepetir, setMostrarRepetir] = useState(false)
  const [mesRepetir, setMesRepetir] = useState(hoy.getMonth())
  const [anioRepetir, setAnioRepetir] = useState(hoy.getFullYear())
  const [fechasRepetir, setFechasRepetir] = useState([])
  const [mesCalEdit, setMesCalEdit] = useState(hoy.getMonth())
  const [anioCalEdit, setAnioCalEdit] = useState(hoy.getFullYear())
  const [mesCalRep, setMesCalRep] = useState(hoy.getMonth())
  const [anioCalRep, setAnioCalRep] = useState(hoy.getFullYear())
  const [fechasEditRepetir, setFechasEditRepetir] = useState([])
  const [nuevaFechaEdit, setNuevaFechaEdit] = useState(null)
  const [confirmEliminar, setConfirmEliminar] = useState(false)
  const [dragOverIdx, setDragOverIdx] = useState(null)
  const [draggingIdx, setDraggingIdx] = useState(null)
  const dragItemRef = useRef(null)
  const ghostRef = useRef(null)
  const longPressRef = useRef(null)
  const touchStartRef = useRef(null)
  const isDraggingRef = useRef(false)

  useEffect(() => {
    if (!userId) return
    const cargar = async () => {
      const snap = await getDocs(collection(db, 'users', userId, 'misGrupos'))
      const gs = snap.docs.filter(d => { const mod = d.data().modulo; return !mod || mod === 'pizarron' }).map((d,i) => ({ id: d.id, nombre: d.data().nombre || 'Grupo', color: COLORES[(i+1) % COLORES.length] }))
      setGrupos([{ id:'personal', nombre: tx.personal, color: COLORES[0] }, ...gs])
    }
    cargar()
  }, [userId, idioma])

  useEffect(() => {
    if (!userId) return
    let data = {}
    let unsubs = []
    const merge = (snap) => {
      snap.docs.forEach(d => {
        const parts = d.id.split('-').map(Number)
        if (parts[0] === anio && parts[1] === mes) {
          const p = (d.data().items || []).filter(i => !i.realizada).length
          if (p > 0) { const k = `${parts[2]}`; data[k] = (data[k] || 0) + p }
        }
      })
      setBadges({ ...data })
    }
    data = {}
    unsubs.push(onSnapshot(collection(db, 'users', userId, 'pizarron'), merge))
    getDocs(collection(db, 'users', userId, 'misGrupos')).then(snap => {
      snap.docs.forEach(d => unsubs.push(onSnapshot(collection(db, 'grupos', d.id, 'pizarron'), merge)))
    })
    return () => unsubs.forEach(u => u())
  }, [userId, mes, anio])

  const cargarTareas = async (dia, mesArg, anioArg) => {
    if (!userId) return
    setCargandoTareas(true)
    const key = getKey(anioArg ?? anio, mesArg ?? mes, dia)
    let todas = []
    const snap1 = await getDoc(doc(db, 'users', userId, 'pizarron', key))
    const items1 = snap1.data()?.items || []
    items1.forEach(i => todas.push({ ...i, grupoId:'personal', grupoNombre: tx.personal, grupoColor: COLORES[0] }))
    const gsSnap = await getDocs(collection(db, 'users', userId, 'misGrupos'))
    for (let idx = 0; idx < gsSnap.docs.length; idx++) {
      const g = gsSnap.docs[idx]
      const snap = await getDoc(doc(db, 'grupos', g.id, 'pizarron', key))
      const items = snap.data()?.items || []
      items.forEach(i => todas.push({ ...i, grupoId: g.id, grupoNombre: g.data().nombre || 'Grupo', grupoColor: COLORES[(idx+1) % COLORES.length] }))
    }
    setTareas(todas)
    setCargandoTareas(false)
  }

  const tocarDia = (dia) => {
    setDiaSeleccionado(dia)
    setTareaSeleccionada(null)
    setModoEditar(null)
    setConfirmEliminar(false)
    setNuevaTarea('')
    setMostrarElegirFecha(false)
    setMostrarRepetir(false)
    setFechasRepetir([])
    setDiaElegido(null)
    setModoCapturar(false)
    cargarTareas(dia, mes, anio)
  }

  const cerrarModal = () => {
    setDiaSeleccionado(null)
    setTareaSeleccionada(null)
    setModoEditar(null)
    setConfirmEliminar(false)
    setNuevaTarea('')
    setMostrarElegirFecha(false)
    setMostrarRepetir(false)
    setFechasRepetir([])
    setModoCapturar(false)
  }

  const guardarTarea = async () => {
    if (!nuevaTarea.trim() || !diaSeleccionado || guardando) return
    setGuardando(true)
    const diaReal = diaElegido ?? diaSeleccionado
    const mesReal = diaElegido ? mesElegir : mes
    const anioReal = diaElegido ? anioElegir : anio
    const key = getKey(anioReal, mesReal, diaReal)
    const nueva = { id: generarId(), texto: nuevaTarea.trim(), realizada: false, dia: diaReal, mes: mesReal, anio: anioReal, creadoPor: userId }
    const refBase = grupoSeleccionado.id === 'personal'
      ? doc(db, 'users', userId, 'pizarron', key)
      : doc(db, 'grupos', grupoSeleccionado.id, 'pizarron', key)
    const snap = await getDoc(refBase)
    await setDoc(refBase, { items: [...(snap.data()?.items || []), nueva] })
    for (const f of fechasRepetir) {
      const fkey = getKey(f.anio, f.mes, f.dia)
      if (fkey === key) continue
      const fref = grupoSeleccionado.id === 'personal'
        ? doc(db, 'users', userId, 'pizarron', fkey)
        : doc(db, 'grupos', grupoSeleccionado.id, 'pizarron', fkey)
      const fsnap = await getDoc(fref)
      await setDoc(fref, { items: [...(fsnap.data()?.items || []), { ...nueva, id: generarId(), dia: f.dia, mes: f.mes, anio: f.anio }] })
    }
    setNuevaTarea('')
    setMostrarRepetir(false)
    setFechasRepetir([])
    setMostrarElegirFecha(false)
    setDiaElegido(null)
    await cargarTareas(diaSeleccionado, mes, anio)
    setModoCapturar(false)
    setGuardando(false)
  }

  const toggleAtendida = async (tarea) => {
    const key = getKey(tarea.anio, tarea.mes, tarea.dia)
    const ref = tarea.grupoId === 'personal'
      ? doc(db, 'users', userId, 'pizarron', key)
      : doc(db, 'grupos', tarea.grupoId, 'pizarron', key)
    const snap = await getDoc(ref)
    const items = (snap.data()?.items || []).map(i => i.id === tarea.id ? { ...i, realizada: !i.realizada } : i)
    await setDoc(ref, { items })
    setTareas(prev => prev.map(t => t.id === tarea.id && t.grupoId === tarea.grupoId ? { ...t, realizada: !t.realizada } : t))
    setTareaSeleccionada(null)
  }

  const eliminarTarea = async () => {
    if (!tareaSeleccionada) return
    const tarea = tareaSeleccionada
    const key = getKey(tarea.anio, tarea.mes, tarea.dia)
    const ref = tarea.grupoId === 'personal'
      ? doc(db, 'users', userId, 'pizarron', key)
      : doc(db, 'grupos', tarea.grupoId, 'pizarron', key)
    const snap = await getDoc(ref)
    await setDoc(ref, { items: (snap.data()?.items || []).filter(i => i.id !== tarea.id) })
    const nuevasTareas = tareas.filter(t => !(t.id === tarea.id && t.grupoId === tarea.grupoId))
    setTareas(nuevasTareas)
    setTareaSeleccionada(null)
    setConfirmEliminar(false)
    const pendientesRestantes = nuevasTareas.filter(t => !t.realizada).length
    setBadges(prev => ({ ...prev, [`${diaSeleccionado}`]: pendientesRestantes > 0 ? pendientesRestantes : undefined }))
  }

  const guardarEdicion = async () => {
    if (!textoEditar.trim() || !modoEditar) return
    if (nuevaFechaEdit) await aplicarCambioFecha()
    const { id, grupoId, dia, mesT, anioT } = modoEditar
    const key = getKey(anioT, mesT, dia)
    const ref = grupoId === 'personal'
      ? doc(db, 'users', userId, 'pizarron', key)
      : doc(db, 'grupos', grupoId, 'pizarron', key)
    const snap = await getDoc(ref)
    await setDoc(ref, { items: (snap.data()?.items || []).map(i => i.id === id ? { ...i, texto: textoEditar.trim() } : i) })
    for (const fkey of fechasEditRepetir) {
      const parts = fkey.split('-').map(Number)
      const fref = grupoId === 'personal'
        ? doc(db, 'users', userId, 'pizarron', fkey)
        : doc(db, 'grupos', grupoId, 'pizarron', fkey)
      const fsnap = await getDoc(fref)
      await setDoc(fref, { items: [...(fsnap.data()?.items || []), { id: generarId(), texto: textoEditar.trim(), realizada: false, dia: parts[2], mes: parts[1], anio: parts[0], creadoPor: userId }] })
    }
    await cargarTareas(diaSeleccionado, mes, anio)
    setModoEditar(null)
    setEditModo(null)
    setFechasEditRepetir([])
    setNuevaFechaEdit(null)
    setTareaSeleccionada(null)
  }

  const cambiarFechaEdicion = (diaNew) => { setNuevaFechaEdit({ dia: diaNew, mes: mesCalEdit, anio: anioCalEdit }) }

  const aplicarCambioFecha = async () => {
    if (!modoEditar || !nuevaFechaEdit) return
    const { id, grupoId, dia, mesT, anioT } = modoEditar
    const keyOld = getKey(anioT, mesT, dia)
    const keyNew = getKey(nuevaFechaEdit.anio, nuevaFechaEdit.mes, nuevaFechaEdit.dia)
    if (keyOld !== keyNew) {
      const refOld = grupoId === 'personal' ? doc(db, 'users', userId, 'pizarron', keyOld) : doc(db, 'grupos', grupoId, 'pizarron', keyOld)
      const snapOld = await getDoc(refOld)
      const items = snapOld.data()?.items || []
      const tarea = items.find(i => i.id === id)
      if (tarea) {
        await setDoc(refOld, { items: items.filter(i => i.id !== id) })
        const refNew = grupoId === 'personal' ? doc(db, 'users', userId, 'pizarron', keyNew) : doc(db, 'grupos', grupoId, 'pizarron', keyNew)
        const snapNew = await getDoc(refNew)
        await setDoc(refNew, { items: [...(snapNew.data()?.items || []), { ...tarea, dia: nuevaFechaEdit.dia, mes: nuevaFechaEdit.mes, anio: nuevaFechaEdit.anio }] })
        const pendientesOrigen = items.filter(i => i.id !== id && !i.realizada).length
        setBadges(prev => ({ ...prev, [`${dia}`]: pendientesOrigen > 0 ? pendientesOrigen : undefined }))
      }
    }
  }

  const reordenar = async (fromIdx, toIdx) => {
    const pendientes = tareas.filter(t => !t.realizada)
    const atendidas = tareas.filter(t => t.realizada)
    const arr = [...pendientes]
    const [item] = arr.splice(fromIdx, 1)
    arr.splice(toIdx, 0, item)
    const nuevas = [...arr, ...atendidas]
    setTareas(nuevas)
    const grupos_ids = [...new Set(nuevas.map(t => t.grupoId))]
    for (const gid of grupos_ids) {
      const key = getKey(anio, mes, diaSeleccionado)
      const ref = gid === 'personal' ? doc(db, 'users', userId, 'pizarron', key) : doc(db, 'grupos', gid, 'pizarron', key)
      const snap = await getDoc(ref)
      const oldItems = snap.data()?.items || []
      const nuevosItems = nuevas.filter(t => t.grupoId === gid).map(t => oldItems.find(i => i.id === t.id) || t)
      await setDoc(ref, { items: nuevosItems })
    }
  }

  const limpiarDrag = () => {
    if (ghostRef.current) { try { document.body.removeChild(ghostRef.current) } catch(e){} ghostRef.current = null }
    isDraggingRef.current = false
    dragItemRef.current = null
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null }
  }

  const onTouchStart = (e, idx) => {
    limpiarDrag()
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    longPressRef.current = setTimeout(() => {
      isDraggingRef.current = true
      dragItemRef.current = idx
      setDraggingIdx(idx)
      const g = document.createElement('div')
      g.style.cssText = 'position:fixed;padding:8px 14px;background:#534AB7;color:white;border-radius:10px;font-size:13px;pointer-events:none;z-index:9999;opacity:0.9;'
      g.innerText = '↕ moviendo...'
      document.body.appendChild(g)
      ghostRef.current = g
    }, 500)
  }

  const onTouchMove = (e) => {
    const touch = e.touches[0]
    if (!isDraggingRef.current) {
      if (touchStartRef.current) {
        const dx = Math.abs(touch.clientX - touchStartRef.current.x)
        const dy = Math.abs(touch.clientY - touchStartRef.current.y)
        if (dx > 8 || dy > 8) { clearTimeout(longPressRef.current); longPressRef.current = null }
      }
      return
    }
    e.preventDefault()
    if (ghostRef.current) { ghostRef.current.style.left = (touch.clientX - 70) + 'px'; ghostRef.current.style.top = (touch.clientY - 20) + 'px'; ghostRef.current.style.display = 'none' }
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    if (ghostRef.current) ghostRef.current.style.display = 'block'
    const itemEl = el?.closest('[data-idx]')
    if (itemEl) setDragOverIdx(parseInt(itemEl.getAttribute('data-idx'))); else setDragOverIdx(null)
  }

  const onTouchEnd = async (e) => {
    clearTimeout(longPressRef.current)
    if (ghostRef.current) { document.body.removeChild(ghostRef.current); ghostRef.current = null }
    if (!isDraggingRef.current) { isDraggingRef.current = false; dragItemRef.current = null; setDraggingIdx(null); return }
    const touch = e.changedTouches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const itemEl = el?.closest('[data-idx]')
    if (itemEl && dragItemRef.current !== null) {
      const toIdx = parseInt(itemEl.getAttribute('data-idx'))
      const fromIdx = dragItemRef.current
      if (fromIdx !== toIdx) await reordenar(fromIdx, toIdx)
    }
    setDragOverIdx(null)
    setDraggingIdx(null)
    isDraggingRef.current = false
    dragItemRef.current = null
  }

  const MiniCal = ({ a, m, setA, setM, onDia, selFn, hint }) => (
    <div style={{ background: esOscuro ? 'rgba(255,255,255,0.05)' : '#f5f5f7', borderRadius:'12px', padding:'12px', marginTop:'8px' }}>
      {hint && <div style={{ fontSize:'11px', color:th.textoSub, marginBottom:'8px', textAlign:'center' }}>{hint}</div>}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
        <button onClick={() => { if(m===0){setM(11);setA(a-1)}else setM(m-1) }} style={{ background:'transparent', border:`0.5px solid ${th.borde}`, borderRadius:'8px', padding:'3px 10px', color:th.texto, cursor:'pointer' }}>‹</button>
        <span style={{ fontSize:'13px', fontWeight:'600', color:th.texto }}>{meses[m]} {a}</span>
        <button onClick={() => { if(m===11){setM(0);setA(a+1)}else setM(m+1) }} style={{ background:'transparent', border:`0.5px solid ${th.borde}`, borderRadius:'8px', padding:'3px 10px', color:th.texto, cursor:'pointer' }}>›</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px', marginBottom:'4px' }}>
        {diasSemana.map((d,i) => <div key={i} style={{ textAlign:'center', fontSize:'10px', color:th.textoSub }}>{d}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
        {celdas(a,m).map((d,i) => {
          const sel = d && selFn(d,a,m)
          return <button key={i} onClick={() => d && onDia(d)} style={{ height:'30px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'6px', fontSize:'12px', background: sel ? th.acento : d ? (esOscuro?'rgba(255,255,255,0.06)':'white') : 'transparent', color: sel ? 'white' : d ? th.texto : 'transparent', border: d ? `0.5px solid ${th.borde}` : 'none', cursor: d?'pointer':'default', fontWeight: sel?'700':'400' }}>{d||''}</button>
        })}
      </div>
    </div>
  )

  const pendientes = tareas.filter(t => !t.realizada)
  const atendidas = tareas.filter(t => t.realizada)

  return (
    <div style={{ minHeight:'100vh', background:th.bg, fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', paddingBottom:'80px' }}>

      {/* Header */}
      <div style={{ background: esOscuro ? 'linear-gradient(135deg,rgba(83,74,183,0.9),rgba(45,43,107,0.85))' : 'linear-gradient(135deg,#534AB7,#185FA5)', padding:'48px 20px 24px', display:'flex', alignItems:'center', gap:'12px' }}>
        <button onClick={onVolver} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'10px', padding:'8px 12px', color:'white', fontSize:'18px', cursor:'pointer' }}>‹</button>
        <div style={{ color:'white', fontSize:'20px', fontWeight:'700' }}>{tx.titulo}</div>
      </div>

      {/* Calendario */}
      <div style={{ padding:'16px' }}>
        <div style={{ background:th.bgCard, borderRadius:'20px', padding:'16px', boxShadow:th.sombra, marginBottom:'16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
            <button onClick={() => { if(mes===0){setMes(11);setAnio(anio-1)}else setMes(mes-1) }} style={{ background:'transparent', border:`0.5px solid ${th.borde}`, borderRadius:'10px', padding:'6px 14px', color:th.texto, cursor:'pointer', fontSize:'18px' }}>‹</button>
            <span style={{ fontSize:'15px', fontWeight:'600', color:th.texto }}>{meses[mes]} {anio}</span>
            <button onClick={() => { if(mes===11){setMes(0);setAnio(anio+1)}else setMes(mes+1) }} style={{ background:'transparent', border:`0.5px solid ${th.borde}`, borderRadius:'10px', padding:'6px 14px', color:th.texto, cursor:'pointer', fontSize:'18px' }}>›</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', textAlign:'center', marginBottom:'4px' }}>
            {diasSemana.map((d,i) => <div key={i} style={{ fontSize:'11px', color:th.textoSub, fontWeight:'600', padding:'4px 0', borderBottom:`0.5px solid ${th.borde}` }}>{d}</div>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', textAlign:'center' }}>
            {celdas(anio,mes).map((dia, i) => {
              if (!dia) return <div key={i} style={{ padding:'6px 0' }} />
              const esHoy = dia===hoy.getDate() && mes===hoy.getMonth() && anio===hoy.getFullYear()
              const sel = dia === diaSeleccionado
              const tieneP = badges[`${dia}`] > 0
              return (
                <div key={i} onClick={() => tocarDia(dia)} style={{ cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', padding:'4px 0' }}>
                  <div style={{ width:'32px', height:'32px', borderRadius:'50%', background: sel ? th.acento : esHoy ? `${th.acento}22` : 'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:'13px', color: sel ? 'white' : esHoy ? th.acento : th.texto, fontWeight: esHoy||sel ? '700':'400' }}>{dia}</span>
                  </div>
                  <div style={{ width:'5px', height:'5px', borderRadius:'50%', background: tieneP ? th.puntoDia : 'transparent', marginTop:'2px' }} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* PANTALLA: Lista del día */}
      {diaSeleccionado && !modoEditar && !modoCapturar && (
        <div style={{ position:'fixed', inset:0, background:th.bg, zIndex:200, display:'flex', flexDirection:'column', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>
          {/* Header fijo */}
          <div style={{ background: esOscuro ? 'linear-gradient(135deg,rgba(83,74,183,0.9),rgba(45,43,107,0.85))' : 'linear-gradient(135deg,#534AB7,#185FA5)', padding:'48px 20px 20px', display:'flex', alignItems:'center', gap:'12px', flexShrink:0 }}>
            <button onClick={cerrarModal} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'10px', padding:'8px 12px', color:'white', fontSize:'18px', cursor:'pointer' }}>‹</button>
            <div style={{ color:'white', fontSize:'18px', fontWeight:'700', flex:1 }}>{diaSeleccionado} {meses[mes]} {anio}</div>
            <button onClick={() => { setNuevaTarea(''); setModoCapturar(true) }} style={{ background:'rgba(255,255,255,0.25)', border:'1.5px solid rgba(255,255,255,0.5)', color:'white', borderRadius:'12px', padding:'8px 18px', fontSize:'14px', fontWeight:'700', cursor:'pointer' }}>{tx.agregar}</button>
          </div>
          {/* Lista scrolleable */}
          <div style={{ overflowY:'auto', flex:1, padding:'16px 20px 100px', touchAction:'pan-y' }}>
            {cargandoTareas && <div style={{ textAlign:'center', color:th.textoSub, fontSize:'13px', padding:'20px 0' }}>...</div>}
            {!cargandoTareas && pendientes.length === 0 && atendidas.length === 0 && (
              <div style={{ textAlign:'center', color:th.textoSub, fontSize:'13px', padding:'40px 0' }}>{tx.sinPendientes}</div>
            )}
            {pendientes.length > 0 && (
              <div style={{ fontSize:'11px', fontWeight:'700', color:th.textoSub, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'8px', marginTop:'4px' }}>{tx.pendientes}</div>
            )}
            {pendientes.map((tarea, idx) => (
              <div key={`${tarea.id}-${tarea.grupoId}`} data-idx={idx} style={{ opacity: draggingIdx===idx ? 0.4 : 1 }}>
                {dragOverIdx===idx && draggingIdx!==idx && <div style={{ height:'3px', background:th.acento, borderRadius:'2px', margin:'3px 0' }} />}
                <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', borderRadius:'12px', marginBottom:'6px', background: tareaSeleccionada?.id===tarea.id&&tareaSeleccionada?.grupoId===tarea.grupoId ? (esOscuro?'rgba(83,74,183,0.2)':'#EEF2FF') : (esOscuro?'rgba(255,255,255,0.04)':'white'), border:`0.5px solid ${tareaSeleccionada?.id===tarea.id&&tareaSeleccionada?.grupoId===tarea.grupoId ? th.acento : th.borde}`, userSelect:'none' }}>
                  <span onTouchStart={e=>onTouchStart(e,idx)} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ fontSize:'18px', color: esOscuro?'rgba(255,255,255,0.2)':'#ccc', cursor:'grab', touchAction:'none', flexShrink:0 }}>⠿</span>
                  <div onClick={() => {
                    const key = `${tarea.id}-${tarea.grupoId}`
                    const selKey = tareaSeleccionada ? `${tareaSeleccionada.id}-${tareaSeleccionada.grupoId}` : null
                    if (key === selKey) setTareaSeleccionada(null)
                    else setTareaSeleccionada(tarea)
                  }} style={{ width:'22px', height:'22px', borderRadius:'6px', border: tareaSeleccionada?.id===tarea.id&&tareaSeleccionada?.grupoId===tarea.grupoId ? 'none' : `1.5px solid ${esOscuro?'rgba(255,255,255,0.3)':'#ccc'}`, background: tareaSeleccionada?.id===tarea.id&&tareaSeleccionada?.grupoId===tarea.grupoId ? th.acento : 'transparent', flexShrink:0, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'12px' }}>
                    {tareaSeleccionada?.id===tarea.id&&tareaSeleccionada?.grupoId===tarea.grupoId ? '✓' : ''}
                  </div>
                  <span onClick={() => toggleAtendida(tarea)} style={{ flex:1, fontSize:'14px', color:th.texto, cursor:'pointer', lineHeight:'1.4' }}>{tarea.texto}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:'4px', background: `${tarea.grupoColor}22`, borderRadius:'20px', padding:'3px 9px', flexShrink:0 }}>
                    <div style={{ width:'6px', height:'6px', borderRadius:'50%', background: tarea.grupoColor }} />
                    <span style={{ fontSize:'11px', color: tarea.grupoColor, fontWeight:'500' }}>{tarea.grupoNombre}</span>
                  </div>
                </div>
              </div>
            ))}
            {atendidas.length > 0 && (
              <div style={{ fontSize:'11px', fontWeight:'700', color:th.textoSub, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'8px', marginTop:'12px' }}>{tx.atendidas}</div>
            )}
            {atendidas.map((tarea) => (
              <div key={`${tarea.id}-${tarea.grupoId}`} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', borderRadius:'12px', marginBottom:'6px', background: esOscuro?'rgba(255,255,255,0.02)':'#F5F5F7', border:`0.5px solid ${th.borde}` }}>
                <span style={{ fontSize:'18px', color: esOscuro?'rgba(255,255,255,0.1)':'#ddd', flexShrink:0 }}>⠿</span>
                <div style={{ width:'22px', height:'22px', borderRadius:'6px', background:'#3B6D11', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'12px' }}>✓</div>
                <span onClick={() => toggleAtendida(tarea)} style={{ flex:1, fontSize:'14px', color:th.textoMuted||th.textoSub, textDecoration:'line-through', cursor:'pointer', lineHeight:'1.4' }}>{tarea.texto}</span>
                <div style={{ display:'flex', alignItems:'center', gap:'4px', background: esOscuro?'rgba(255,255,255,0.06)':'white', borderRadius:'20px', padding:'3px 9px', border:`0.5px solid ${th.borde}`, flexShrink:0 }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#888' }} />
                  <span style={{ fontSize:'11px', color:'#888', fontWeight:'500' }}>{tarea.grupoNombre}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Botones editar/eliminar */}
          {tareaSeleccionada && !confirmEliminar && (
            <div style={{ position:'absolute', bottom:'90px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'10px', zIndex:10 }}>
              <button onClick={() => {
                setModoEditar({ id: tareaSeleccionada.id, grupoId: tareaSeleccionada.grupoId, dia: tareaSeleccionada.dia, mesT: tareaSeleccionada.mes, anioT: tareaSeleccionada.anio, grupoNombre: tareaSeleccionada.grupoNombre, grupoColor: tareaSeleccionada.grupoColor })
                setTextoEditar(tareaSeleccionada.texto)
                setEditModo(null)
                setFechasEditRepetir([])
                setMesCalEdit(tareaSeleccionada.mes)
                setAnioCalEdit(tareaSeleccionada.anio)
                setMesCalRep(tareaSeleccionada.mes)
                setAnioCalRep(tareaSeleccionada.anio)
              }} style={{ background:th.acento, color:'white', border:'none', borderRadius:'14px', padding:'13px 24px', fontSize:'15px', fontWeight:'700', cursor:'pointer', boxShadow:`0 4px 16px ${th.acento}55`, whiteSpace:'nowrap' }}>✏️ {tx.editarTarea}</button>
              <button onClick={() => setConfirmEliminar(true)} style={{ background:'#E24B4A', color:'white', border:'none', borderRadius:'14px', padding:'13px 24px', fontSize:'15px', fontWeight:'700', cursor:'pointer', boxShadow:'0 4px 16px rgba(226,75,74,0.4)', whiteSpace:'nowrap' }}>🗑 {tx.eliminar}</button>
            </div>
          )}
          {confirmEliminar && (
            <div style={{ position:'absolute', bottom:'90px', left:'20px', right:'20px', background:th.bgCard, borderRadius:'16px', padding:'16px', boxShadow:'0 8px 32px rgba(0,0,0,0.3)', zIndex:10 }}>
              <div style={{ fontSize:'14px', color:th.texto, marginBottom:'12px', textAlign:'center' }}>{tx.confirmarEliminar}</div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => setConfirmEliminar(false)} style={{ flex:1, padding:'11px', background: esOscuro?'rgba(255,255,255,0.08)':'#f0f0f0', border:'none', borderRadius:'10px', color:th.textoSub, cursor:'pointer', fontSize:'14px' }}>{tx.cancelar}</button>
                <button onClick={eliminarTarea} style={{ flex:1, padding:'11px', background:'#E24B4A', border:'none', borderRadius:'10px', color:'white', cursor:'pointer', fontSize:'14px', fontWeight:'600' }}>{tx.si}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PANTALLA: Capturar nueva tarea */}
      {modoCapturar && diaSeleccionado && (
        <div style={{ position:'fixed', inset:0, background:th.bg, zIndex:300, display:'flex', flexDirection:'column', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>
          {/* Header fijo */}
          <div style={{ background: esOscuro ? 'linear-gradient(135deg,rgba(83,74,183,0.9),rgba(45,43,107,0.85))' : 'linear-gradient(135deg,#534AB7,#185FA5)', padding:'48px 20px 20px', display:'flex', alignItems:'center', gap:'12px', flexShrink:0 }}>
            <button onClick={() => setModoCapturar(false)} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'10px', padding:'8px 12px', color:'white', fontSize:'18px', cursor:'pointer' }}>‹</button>
            <div style={{ color:'white', fontSize:'18px', fontWeight:'700' }}>{diaSeleccionado} {meses[mes]} {anio}</div>
          </div>
          {/* Contenido scrolleable */}
          <div style={{ overflowY:'auto', flex:1, padding:'24px 20px 100px' }}>

            {/* ── CAMBIO #6: input + botón + en la misma fila ── */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
              <input
                autoFocus
                value={nuevaTarea}
                onChange={e => setNuevaTarea(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && guardarTarea()}
                placeholder={tx.nuevaTarea}
                style={{ flex:1, padding:'16px', borderRadius:'14px', border:`2px solid ${th.acento}`, fontSize:'17px', outline:'none', background: esOscuro ? 'rgba(255,255,255,0.06)' : 'white', color:th.texto, boxSizing:'border-box' }}
              />
              <button
                onClick={guardarTarea}
                disabled={guardando || !nuevaTarea.trim()}
                style={{
                  width:'52px', height:'52px', borderRadius:'50%',
                  background: nuevaTarea.trim() ? th.acento : (esOscuro ? 'rgba(255,255,255,0.1)' : '#ddd'),
                  border:'none', color:'white', fontSize:'28px', fontWeight:'300',
                  cursor: nuevaTarea.trim() ? 'pointer' : 'default',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0, boxShadow: nuevaTarea.trim() ? `0 4px 16px ${th.acento}55` : 'none',
                  transition:'background 0.2s, box-shadow 0.2s'
                }}
              >
                {guardando ? '…' : '+'}
              </button>
            </div>

            <div onClick={() => setMostrarSelectorGrupo(true)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background: esOscuro ? 'rgba(255,255,255,0.06)' : '#F5F5F7', borderRadius:'12px', marginBottom:'12px', cursor:'pointer' }}>
              <div>
                <div style={{ fontSize:'10px', color:th.textoSub, textTransform:'uppercase', letterSpacing:'0.05em' }}>{tx.guardarEn}</div>
                <div style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'2px' }}>
                  <div style={{ width:'7px', height:'7px', borderRadius:'50%', background: grupoSeleccionado.color }} />
                  <span style={{ fontSize:'15px', fontWeight:'600', color: grupoSeleccionado.color }}>{grupoSeleccionado.nombre}</span>
                </div>
              </div>
              <span style={{ color:th.textoSub, fontSize:'16px' }}>▾</span>
            </div>
            <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
              <button onClick={() => { setMostrarElegirFecha(!mostrarElegirFecha); setMostrarRepetir(false) }} style={{ flex:1, padding:'10px', borderRadius:'10px', background: mostrarElegirFecha ? th.acento : (esOscuro?'rgba(255,255,255,0.08)':'#EEF2FF'), border:'none', fontSize:'13px', color: mostrarElegirFecha ? 'white' : th.acento, cursor:'pointer', fontWeight:'500' }}>📅 {tx.elegirFecha}{diaElegido ? ` — ${diaElegido} ${meses[mesElegir]}` : ''}</button>
              <button onClick={() => { setMostrarRepetir(!mostrarRepetir); setMostrarElegirFecha(false); if(!mostrarRepetir){setFechasRepetir([]);setMesRepetir(mes);setAnioRepetir(anio)} }} style={{ flex:1, padding:'10px', borderRadius:'10px', background: mostrarRepetir ? th.acento : (esOscuro?'rgba(255,255,255,0.08)':'#EEF2FF'), border:'none', fontSize:'13px', color: mostrarRepetir ? 'white' : th.acento, cursor:'pointer', fontWeight:'500' }}>🔁 {tx.repetir}</button>
            </div>
            {mostrarElegirFecha && <MiniCal a={anioElegir} m={mesElegir} setA={setAnioElegir} setM={setMesElegir} onDia={d => setDiaElegido(d)} selFn={(d,a,m) => d===diaElegido&&a===anioElegir&&m===mesElegir} hint={tx.moverA} />}
            {mostrarRepetir && <>
              <MiniCal a={anioRepetir} m={mesRepetir} setA={setAnioRepetir} setM={setMesRepetir} onDia={d => {
                const f = { dia:d, mes:mesRepetir, anio:anioRepetir }
                const key = getKey(f.anio,f.mes,f.dia)
                const mainKey = getKey(anio, mes, diaSeleccionado)
                if (key===mainKey) return
                setFechasRepetir(prev => prev.find(x=>getKey(x.anio,x.mes,x.dia)===key) ? prev.filter(x=>getKey(x.anio,x.mes,x.dia)!==key) : [...prev,f])
              }} selFn={(d,a,m) => fechasRepetir.some(f=>f.dia===d&&f.mes===m&&f.anio===a)} hint={tx.copiarEn} />
              <div style={{ fontSize:'12px', color:th.acento, textAlign:'center', marginTop:'6px' }}>{fechasRepetir.length} {tx.fechasSeleccionadas}</div>
            </>}
          </div>
        </div>
      )}

      {/* PANTALLA: Editar tarea */}
      {modoEditar && (
        <div style={{ position:'fixed', inset:0, background:th.bg, zIndex:300, display:'flex', flexDirection:'column', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif' }}>
          <div style={{ background: esOscuro ? 'linear-gradient(135deg,rgba(83,74,183,0.9),rgba(45,43,107,0.85))' : 'linear-gradient(135deg,#534AB7,#185FA5)', padding:'48px 20px 24px', display:'flex', alignItems:'center', gap:'12px', flexShrink:0 }}>
            <button onClick={() => { setModoEditar(null); setEditModo(null); setTareaSeleccionada(null) }} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'10px', padding:'8px 12px', color:'white', fontSize:'18px', cursor:'pointer' }}>‹</button>
            <div style={{ color:'white', fontSize:'18px', fontWeight:'700' }}>{tx.editarTarea}</div>
          </div>
          <div style={{ overflowY:'auto', flex:1, padding:'20px 20px 100px' }}>
            <div style={{ background:th.bgCard, borderRadius:'20px', padding:'20px', boxShadow:th.sombra }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'16px' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: modoEditar.grupoColor }} />
                <span style={{ fontSize:'13px', color: modoEditar.grupoColor, fontWeight:'500' }}>{modoEditar.grupoNombre}</span>
              </div>
              <input autoFocus value={textoEditar} onChange={e=>setTextoEditar(e.target.value)} onKeyDown={e=>e.key==='Enter'&&guardarEdicion()} style={{ width:'100%', padding:'12px 14px', borderRadius:'12px', border:`1.5px solid ${th.acento}`, fontSize:'15px', outline:'none', background: esOscuro ? 'rgba(255,255,255,0.06)' : 'white', color:th.texto, marginBottom:'14px', boxSizing:'border-box' }} />
              <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
                <button onClick={() => setEditModo(editModo==='fecha'?null:'fecha')} style={{ flex:1, padding:'9px', borderRadius:'10px', background: editModo==='fecha'?th.acento:(esOscuro?'rgba(255,255,255,0.08)':'#EEF2FF'), border:'none', fontSize:'13px', color: editModo==='fecha'?'white':th.acento, cursor:'pointer', fontWeight:'500' }}>📅 {tx.cambiarFecha}</button>
                <button onClick={() => { setEditModo(editModo==='repetir'?null:'repetir'); setFechasEditRepetir([]) }} style={{ flex:1, padding:'9px', borderRadius:'10px', background: editModo==='repetir'?th.acento:(esOscuro?'rgba(255,255,255,0.08)':'#EEF2FF'), border:'none', fontSize:'13px', color: editModo==='repetir'?'white':th.acento, cursor:'pointer', fontWeight:'500' }}>🔁 {tx.repetirFechas}</button>
              </div>
              {editModo==='fecha' && <MiniCal a={anioCalEdit} m={mesCalEdit} setA={setAnioCalEdit} setM={setMesCalEdit} onDia={cambiarFechaEdicion} selFn={(d,a,m)=>nuevaFechaEdit?d===nuevaFechaEdit.dia&&a===nuevaFechaEdit.anio&&m===nuevaFechaEdit.mes:d===modoEditar?.dia&&a===modoEditar?.anioT&&m===modoEditar?.mesT} hint={tx.moverA} />}
              {editModo==='repetir' && <>
                <MiniCal a={anioCalRep} m={mesCalRep} setA={setAnioCalRep} setM={setMesCalRep} onDia={d => { const k=getKey(anioCalRep,mesCalRep,d); setFechasEditRepetir(prev=>prev.includes(k)?prev.filter(x=>x!==k):[...prev,k]) }} selFn={(d,a,m)=>fechasEditRepetir.includes(getKey(a,m,d))} hint={tx.copiarEn} />
                <div style={{ fontSize:'12px', color:th.acento, textAlign:'center', marginTop:'6px' }}>{fechasEditRepetir.length} {tx.fechasSeleccionadas}</div>
              </>}
              <div style={{ display:'flex', gap:'8px', marginTop:'16px' }}>
                <button onClick={guardarEdicion} style={{ flex:1, padding:'13px', background:th.acento, color:'white', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}>{tx.guardarCambios}</button>
                <button onClick={() => { setModoEditar(null); setEditModo(null); setTareaSeleccionada(null) }} style={{ padding:'13px 16px', background: esOscuro?'rgba(255,255,255,0.08)':'#f0f0f0', color:th.textoSub, border:'none', borderRadius:'12px', fontSize:'14px', cursor:'pointer' }}>{tx.cancelar}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selector de grupo */}
      {mostrarSelectorGrupo && (
        <div onClick={() => setMostrarSelectorGrupo(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:400 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:th.bgCard, borderRadius:'20px 20px 0 0', padding:'20px 20px 40px', width:'100%', maxWidth:'400px' }}>
            <div style={{ fontSize:'13px', fontWeight:'600', color:th.textoSub, textAlign:'center', marginBottom:'16px', textTransform:'uppercase', letterSpacing:'0.06em' }}>{tx.enQuePizarron}</div>
            {grupos.map(g => (
              <div key={g.id} onClick={() => { setGrupoSeleccionado(g); setMostrarSelectorGrupo(false) }} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderRadius:'12px', marginBottom:'4px', background: grupoSeleccionado.id===g.id?`${th.acento}15`:'transparent', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:`${g.color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700', color:g.color }}>{g.nombre[0]}</div>
                  <span style={{ fontSize:'15px', color:th.texto }}>{g.nombre}</span>
                </div>
                {grupoSeleccionado.id===g.id && <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:th.acento, display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'white' }} /></div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NavBar */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background: esOscuro?'rgba(6,6,15,0.85)':th.bgCard, borderTop: esOscuro?'1px solid rgba(255,255,255,0.1)':`1px solid ${th.borde}`, backdropFilter: esOscuro?'blur(20px)':'none', display:'flex', zIndex:50, paddingBottom:'env(safe-area-inset-bottom,0px)' }}>
        {[{key:'inicio',label:t.inicio,icon:'🏠'},{key:'miagenda',label:t.miAgenda,icon:'🗓'},{key:'pizarron',label:t.pizarron,icon:'📅'},{key:'listasuper',label:t.super2,icon:'🛒'},{key:'compartir',label:t.compartir,icon:'📤',accion:()=>{if(navigator.share){navigator.share({title:'Syng',text:'Te comparto Syng',url:'https://syng-psi.vercel.app'})}else{navigator.clipboard.writeText('https://syng-psi.vercel.app')}}},{key:'perfil',label:t.perfil,icon:'👤'}].map(item => (
          <button key={item.key} onClick={() => item.accion?item.accion():onNavegar(item.key)} style={{ flex:1, padding:'8px 0 6px', background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px', color: item.key==='miagenda' ? th.acento : th.textoSub }}>
            <span style={{ fontSize:'18px', lineHeight:1 }}>{item.icon}</span>
            <span style={{ fontSize:'9px', fontWeight: item.key==='miagenda'?'700':'400' }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
