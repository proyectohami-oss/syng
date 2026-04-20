import { useState, useEffect } from 'react'
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
  es:{ titulo:'Mi Agenda', sinPendientes:'Sin pendientes este día', guardarEn:'Guardar en', enQuePizarron:'¿En qué pizarrón?', nuevaTarea:'¿Qué tienes pendiente?', agregar:'+ agregar', guardar:'Guardar', cancelar:'Cancelar', eliminar:'Eliminar', personal:'Personal', guardarCambios:'Guardar cambios', cambiarFecha:'Cambiar fecha', repetirFechas:'Repetir en más fechas', confirmarEliminar:'¿Eliminar esta tarea?', si:'Sí, eliminar', moverA:'Toca el día al que quieres mover esta tarea', copiarEn:'Toca los días donde quieres copiar esta tarea', fechasSeleccionadas:'fecha(s) seleccionada(s)', repetir:'Repetir' },
  en:{ titulo:'My Agenda', sinPendientes:'No tasks this day', guardarEn:'Save to', enQuePizarron:'Which board?', nuevaTarea:'What is pending?', agregar:'+ add', guardar:'Save', cancelar:'Cancel', eliminar:'Delete', personal:'Personal', guardarCambios:'Save changes', cambiarFecha:'Change date', repetirFechas:'Repeat on more dates', confirmarEliminar:'Delete this task?', si:'Yes, delete', moverA:'Tap the day to move this task', copiarEn:'Tap days to copy this task', fechasSeleccionadas:'date(s) selected', repetir:'Repeat' },
  fr:{ titulo:'Mon Agenda', sinPendientes:'Aucune tâche', guardarEn:'Enregistrer dans', enQuePizarron:'Quel tableau?', nuevaTarea:'Quoi de prévu?', agregar:'+ ajouter', guardar:'Enregistrer', cancelar:'Annuler', eliminar:'Supprimer', personal:'Personnel', guardarCambios:'Sauvegarder', cambiarFecha:'Changer date', repetirFechas:'Répéter', confirmarEliminar:'Supprimer cette tâche?', si:'Oui, supprimer', moverA:'Touchez le jour cible', copiarEn:'Touchez les jours à copier', fechasSeleccionadas:'date(s) sélectionnée(s)', repetir:'Répéter' },
  de:{ titulo:'Mein Kalender', sinPendientes:'Keine Aufgaben', guardarEn:'Speichern in', enQuePizarron:'Welches Board?', nuevaTarea:'Was steht an?', agregar:'+ hinzufügen', guardar:'Speichern', cancelar:'Abbrechen', eliminar:'Löschen', personal:'Persönlich', guardarCambios:'Änderungen speichern', cambiarFecha:'Datum ändern', repetirFechas:'Wiederholen', confirmarEliminar:'Aufgabe löschen?', si:'Ja, löschen', moverA:'Tag antippen zum Verschieben', copiarEn:'Tage antippen zum Kopieren', fechasSeleccionadas:'Datum/Daten ausgewählt', repetir:'Wiederholen' },
  it:{ titulo:'La Mia Agenda', sinPendientes:'Nessun compito', guardarEn:'Salva in', enQuePizarron:'Quale lavagna?', nuevaTarea:'Cosa hai in sospeso?', agregar:'+ aggiungi', guardar:'Salva', cancelar:'Annulla', eliminar:'Elimina', personal:'Personale', guardarCambios:'Salva modifiche', cambiarFecha:'Cambia data', repetirFechas:'Ripeti in più date', confirmarEliminar:'Eliminare questa attività?', si:'Sì, elimina', moverA:'Tocca il giorno di destinazione', copiarEn:'Tocca i giorni dove copiare', fechasSeleccionadas:'data/e selezionata/e', repetir:'Ripeti' },
  pt:{ titulo:'Minha Agenda', sinPendientes:'Sem tarefas', guardarEn:'Salvar em', enQuePizarron:'Qual quadro?', nuevaTarea:'O que está pendente?', agregar:'+ adicionar', guardar:'Salvar', cancelar:'Cancelar', eliminar:'Excluir', personal:'Pessoal', guardarCambios:'Salvar alterações', cambiarFecha:'Alterar data', repetirFechas:'Repetir em mais datas', confirmarEliminar:'Excluir esta tarefa?', si:'Sim, excluir', moverA:'Toque no dia de destino', copiarEn:'Toque nos dias para copiar', fechasSeleccionadas:'data(s) selecionada(s)', repetir:'Repetir' },
  ja:{ titulo:'マイアジェンダ', sinPendientes:'タスクなし', guardarEn:'保存先', enQuePizarron:'どのボード?', nuevaTarea:'何が保留中ですか?', agregar:'+ 追加', guardar:'保存', cancelar:'キャンセル', eliminar:'削除', personal:'個人', guardarCambios:'変更を保存', cambiarFecha:'日付を変更', repetirFechas:'他の日に繰り返す', confirmarEliminar:'このタスクを削除しますか?', si:'はい、削除', moverA:'移動先の日をタップ', copiarEn:'コピーする日をタップ', fechasSeleccionadas:'日付選択済み', repetir:'繰り返す' },
  zh:{ titulo:'我的日程', sinPendientes:'今天没有待办', guardarEn:'保存到', enQuePizarron:'哪个白板?', nuevaTarea:'有什么待办?', agregar:'+ 添加', guardar:'保存', cancelar:'取消', eliminar:'删除', personal:'个人', guardarCambios:'保存更改', cambiarFecha:'更改日期', repetirFechas:'重复到更多日期', confirmarEliminar:'删除此任务?', si:'是的，删除', moverA:'点击目标日期', copiarEn:'点击要复制的日期', fechasSeleccionadas:'个日期已选择', repetir:'重复' },
}
const COLORES = ['#534AB7','#2ECC9A','#EF9F27','#D4537E','#378ADD','#E24B4A','#639922','#9B59B6']
const TEMA = {
  oscuro:{ bg:'#070712', bgCard:'#18183A', texto:'#F0F0FF', textoSub:'#9090B8', borde:'rgba(255,255,255,0.13)', acento:'#7B6EF6', sombra:'0 4px 24px rgba(0,0,0,0.7)', navBg:'#0E0E24', navBorde:'rgba(255,255,255,0.12)', nombre:'oscuro', puntoDia:'#7B6EF6' },
  claro:{ bg:'#F5F5F7', bgCard:'#FFFFFF', texto:'#1C1C2E', textoSub:'#666680', borde:'#EAEAEA', acento:'#534AB7', sombra:'0 2px 12px rgba(0,0,0,0.07)', navBg:'#FFFFFF', navBorde:'#EAEAEA', nombre:'claro', puntoDia:'#534AB7' },
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
  const [tareasDia, setTareasDia] = useState([])
  const [badges, setBadges] = useState({})
  const [grupos, setGrupos] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevaTarea, setNuevaTarea] = useState('')
  const [grupoSeleccionado, setGrupoSeleccionado] = useState({ id:'personal', nombre:'Personal', color: COLORES[0] })
  const [mostrarSelectorGrupo, setMostrarSelectorGrupo] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [mostrarRepetir, setMostrarRepetir] = useState(false)
  const [fechasRepetir, setFechasRepetir] = useState([])
  const [mesRepetir, setMesRepetir] = useState(hoy.getMonth())
  const [anioRepetir, setAnioRepetir] = useState(hoy.getFullYear())
  const [tareaAccion, setTareaAccion] = useState(null)
  const [modoEditar, setModoEditar] = useState(null)
  const [textoEditar, setTextoEditar] = useState('')
  const [editModo, setEditModo] = useState(null)
  const [mesCalEdit, setMesCalEdit] = useState(hoy.getMonth())
  const [anioCalEdit, setAnioCalEdit] = useState(hoy.getFullYear())
  const [mesCalRep, setMesCalRep] = useState(hoy.getMonth())
  const [anioCalRep, setAnioCalRep] = useState(hoy.getFullYear())
  const [fechasEditRepetir, setFechasEditRepetir] = useState([])
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)

  useEffect(() => {
    if (!userId) return
    const cargar = async () => {
      const snap = await getDocs(collection(db, 'users', userId, 'misGrupos'))
      const gs = snap.docs.map((d,i) => ({ id: d.id, nombre: d.data().nombre || 'Grupo', color: COLORES[(i+1) % COLORES.length] }))
      setGrupos([{ id:'personal', nombre: tx.personal, color: COLORES[0] }, ...gs])
      setGrupoSeleccionado({ id:'personal', nombre: tx.personal, color: COLORES[0] })
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

  const cargarTareasDia = async (dia) => {
    const key = getKey(anio, mes, dia)
    let agrupadas = []
    const snap1 = await getDoc(doc(db, 'users', userId, 'pizarron', key))
    const items1 = (snap1.data()?.items || []).filter(i => !i.realizada)
    if (items1.length > 0) agrupadas.push({ grupoId:'personal', nombre: tx.personal, color: COLORES[0], items: items1 })
    const gsSnap = await getDocs(collection(db, 'users', userId, 'misGrupos'))
    for (let i = 0; i < gsSnap.docs.length; i++) {
      const g = gsSnap.docs[i]
      const snap = await getDoc(doc(db, 'grupos', g.id, 'pizarron', key))
      const items = (snap.data()?.items || []).filter(i => !i.realizada)
      if (items.length > 0) agrupadas.push({ grupoId: g.id, nombre: g.data().nombre || 'Grupo', color: COLORES[(i+1) % COLORES.length], items })
    }
    setTareasDia(agrupadas)
  }

  const tocarDia = (dia) => {
    setDiaSeleccionado(dia)
    setMostrarForm(false)
    setNuevaTarea('')
    setTareaAccion(null)
    setModoEditar(null)
    setConfirmarEliminar(null)
    setMostrarRepetir(false)
    setFechasRepetir([])
    cargarTareasDia(dia)
  }

  const getRef = (grupoId) => grupoId === 'personal'
    ? doc(db, 'users', userId, 'pizarron', getKey(anio, mes, diaSeleccionado))
    : doc(db, 'grupos', grupoId, 'pizarron', getKey(anio, mes, diaSeleccionado))

  const guardarTarea = async () => {
    if (!nuevaTarea.trim() || !diaSeleccionado) return
    setCargando(true)
    const key = getKey(anio, mes, diaSeleccionado)
    const nueva = { id: generarId(), texto: nuevaTarea.trim(), realizada: false, dia: diaSeleccionado, mes, anio, creadoPor: userId }
    let ref = grupoSeleccionado.id === 'personal'
      ? doc(db, 'users', userId, 'pizarron', key)
      : doc(db, 'grupos', grupoSeleccionado.id, 'pizarron', key)
    const snap = await getDoc(ref)
    await setDoc(ref, { items: [...(snap.data()?.items || []), nueva] })
    if (mostrarRepetir && fechasRepetir.length > 0) {
      for (const f of fechasRepetir) {
        const fkey = getKey(f.anio, f.mes, f.dia)
        if (fkey === key) continue
        let fref = grupoSeleccionado.id === 'personal'
          ? doc(db, 'users', userId, 'pizarron', fkey)
          : doc(db, 'grupos', grupoSeleccionado.id, 'pizarron', fkey)
        const fsnap = await getDoc(fref)
        await setDoc(fref, { items: [...(fsnap.data()?.items || []), { ...nueva, id: generarId(), dia: f.dia, mes: f.mes, anio: f.anio }] })
      }
    }
    setNuevaTarea('')
    setMostrarForm(false)
    setMostrarRepetir(false)
    setFechasRepetir([])
    await cargarTareasDia(diaSeleccionado)
    setCargando(false)
  }

  const eliminarTarea = async (grupoId, tareaId) => {
    const ref = getRef(grupoId)
    const snap = await getDoc(ref)
    await setDoc(ref, { items: (snap.data()?.items || []).filter(i => i.id !== tareaId) })
    setConfirmarEliminar(null)
    setTareaAccion(null)
    await cargarTareasDia(diaSeleccionado)
  }

  const guardarEdicion = async () => {
    if (!textoEditar.trim() || !modoEditar) return
    const { grupoId, tareaId } = modoEditar
    const ref = getRef(grupoId)
    const snap = await getDoc(ref)
    await setDoc(ref, { items: (snap.data()?.items || []).map(i => i.id === tareaId ? { ...i, texto: textoEditar.trim() } : i) })

    if (editModo === 'repetir' && fechasEditRepetir.length > 0) {
      for (const fkey of fechasEditRepetir) {
        const parts = fkey.split('-').map(Number)
        let fref = grupoId === 'personal'
          ? doc(db, 'users', userId, 'pizarron', fkey)
          : doc(db, 'grupos', grupoId, 'pizarron', fkey)
        const fsnap = await getDoc(fref)
        const nueva = { id: generarId(), texto: textoEditar.trim(), realizada: false, dia: parts[2], mes: parts[1], anio: parts[0], creadoPor: userId }
        await setDoc(fref, { items: [...(fsnap.data()?.items || []), nueva] })
      }
    }
    setModoEditar(null)
    setEditModo(null)
    setTareaAccion(null)
    setFechasEditRepetir([])
    await cargarTareasDia(diaSeleccionado)
  }

  const cambiarFecha = async (dia) => {
    if (!modoEditar) return
    const { grupoId, tareaId } = modoEditar
    const refOld = getRef(grupoId)
    const snapOld = await getDoc(refOld)
    const items = snapOld.data()?.items || []
    const tarea = items.find(i => i.id === tareaId)
    if (!tarea) return
    await setDoc(refOld, { items: items.filter(i => i.id !== tareaId) })
    const newKey = getKey(anioCalEdit, mesCalEdit, dia)
    let refNew = grupoId === 'personal'
      ? doc(db, 'users', userId, 'pizarron', newKey)
      : doc(db, 'grupos', grupoId, 'pizarron', newKey)
    const snapNew = await getDoc(refNew)
    await setDoc(refNew, { items: [...(snapNew.data()?.items || []), { ...tarea, dia, mes: mesCalEdit, anio: anioCalEdit }] })
    setModoEditar(null)
    setEditModo(null)
    setTareaAccion(null)
    await cargarTareasDia(diaSeleccionado)
  }

  const toggleFechaRepetir = (dia) => {
    const f = { dia, mes: mesRepetir, anio: anioRepetir }
    const key = getKey(f.anio, f.mes, f.dia)
    const mainKey = getKey(anio, mes, diaSeleccionado)
    if (key === mainKey) return
    setFechasRepetir(prev => prev.find(x => getKey(x.anio,x.mes,x.dia)===key) ? prev.filter(x => getKey(x.anio,x.mes,x.dia)!==key) : [...prev, f])
  }

  const toggleFechaEditRepetir = (dia) => {
    const key = getKey(anioCalRep, mesCalRep, dia)
    setFechasEditRepetir(prev => prev.includes(key) ? prev.filter(k=>k!==key) : [...prev, key])
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

  return (
    <div style={{ minHeight:'100vh', background:th.bg, fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', paddingBottom:'80px' }}>
      <div style={{ background: esOscuro ? 'linear-gradient(135deg,rgba(83,74,183,0.9),rgba(45,43,107,0.85))' : 'linear-gradient(135deg,#534AB7,#185FA5)', padding:'48px 20px 24px', display:'flex', alignItems:'center', gap:'12px' }}>
        <button onClick={onVolver} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'10px', padding:'8px 12px', color:'white', fontSize:'18px', cursor:'pointer' }}>‹</button>
        <div style={{ color:'white', fontSize:'20px', fontWeight:'700' }}>{tx.titulo}</div>
      </div>

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

        {diaSeleccionado && (
          <div style={{ background:th.bgCard, borderRadius:'20px', padding:'16px', boxShadow:th.sombra }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
              <span style={{ fontSize:'14px', fontWeight:'600', color:th.texto }}>{diaSeleccionado} {meses[mes]} {anio}</span>
              <button onClick={() => { setMostrarForm(true); setTareaAccion(null); setModoEditar(null); setConfirmarEliminar(null); setMostrarRepetir(false); setFechasRepetir([]) }} style={{ fontSize:'12px', padding:'6px 14px', borderRadius:'20px', background:th.acento, color:'white', border:'none', cursor:'pointer', fontWeight:'600' }}>{tx.agregar}</button>
            </div>

            {tareasDia.length === 0 && !mostrarForm && (
              <div style={{ textAlign:'center', color:th.textoSub, fontSize:'13px', padding:'20px 0' }}>{tx.sinPendientes}</div>
            )}

            {tareasDia.map((grupo) => (
              <div key={grupo.grupoId} style={{ marginBottom:'14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: grupo.color }} />
                  <span style={{ fontSize:'11px', fontWeight:'700', color:th.textoSub, textTransform:'uppercase', letterSpacing:'0.06em' }}>{grupo.nombre}</span>
                </div>
                {grupo.items.map(tarea => (
                  <div key={tarea.id} style={{ marginBottom:'8px' }}>
                    {confirmarEliminar?.id === tarea.id ? (
                      <div style={{ background:'rgba(226,75,74,0.08)', border:'0.5px solid rgba(226,75,74,0.3)', borderRadius:'12px', padding:'12px 14px' }}>
                        <div style={{ fontSize:'13px', color:th.texto, marginBottom:'10px' }}>{tx.confirmarEliminar}</div>
                        <div style={{ display:'flex', gap:'8px' }}>
                          <button onClick={() => eliminarTarea(grupo.grupoId, tarea.id)} style={{ flex:1, padding:'8px', background:'#E24B4A', color:'white', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>{tx.si}</button>
                          <button onClick={() => setConfirmarEliminar(null)} style={{ flex:1, padding:'8px', background:'transparent', color:th.textoSub, border:`0.5px solid ${th.borde}`, borderRadius:'10px', fontSize:'13px', cursor:'pointer' }}>{tx.cancelar}</button>
                        </div>
                      </div>
                    ) : modoEditar?.tareaId === tarea.id ? (
                      <div style={{ background:`${grupo.color}10`, border:`1px solid ${grupo.color}33`, borderRadius:'12px', padding:'12px 14px' }}>
                        <input autoFocus value={textoEditar} onChange={e => setTextoEditar(e.target.value)} onKeyDown={e => e.key==='Enter' && guardarEdicion()} style={{ width:'100%', padding:'8px 10px', borderRadius:'8px', border:`1.5px solid ${th.acento}`, background:th.bg, color:th.texto, fontSize:'14px', outline:'none', boxSizing:'border-box', marginBottom:'10px' }} />
                        <div style={{ display:'flex', gap:'8px', marginBottom:'10px' }}>
                          <button onClick={() => setEditModo(editModo==='fecha'?null:'fecha')} style={{ flex:1, padding:'7px', background: editModo==='fecha'?th.acento:`${th.acento}18`, border:'none', borderRadius:'8px', color: editModo==='fecha'?'white':th.acento, fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>📅 {tx.cambiarFecha}</button>
                          <button onClick={() => { setEditModo(editModo==='repetir'?null:'repetir'); setFechasEditRepetir([]) }} style={{ flex:1, padding:'7px', background: editModo==='repetir'?th.acento:`${th.acento}18`, border:'none', borderRadius:'8px', color: editModo==='repetir'?'white':th.acento, fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>🔁 {tx.repetirFechas}</button>
                        </div>
                        {editModo==='fecha' && <MiniCal a={anioCalEdit} m={mesCalEdit} setA={setAnioCalEdit} setM={setMesCalEdit} onDia={cambiarFecha} selFn={(d,a,m) => a===hoy.getFullYear()&&m===hoy.getMonth()&&d===hoy.getDate()} hint={tx.moverA} />}
                        {editModo==='repetir' && <>
                          <MiniCal a={anioCalRep} m={mesCalRep} setA={setAnioCalRep} setM={setMesCalRep} onDia={toggleFechaEditRepetir} selFn={(d,a,m) => fechasEditRepetir.includes(getKey(a,m,d))} hint={tx.copiarEn} />
                          <div style={{ fontSize:'12px', color:th.acento, textAlign:'center', marginTop:'6px' }}>{fechasEditRepetir.length} {tx.fechasSeleccionadas}</div>
                        </>}
                        <div style={{ display:'flex', gap:'8px', marginTop:'10px' }}>
                          <button onClick={guardarEdicion} style={{ flex:1, padding:'9px', background:th.acento, color:'white', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>{tx.guardarCambios}</button>
                          <button onClick={() => { setModoEditar(null); setEditModo(null) }} style={{ padding:'9px 14px', background:'transparent', color:th.textoSub, border:`0.5px solid ${th.borde}`, borderRadius:'10px', fontSize:'13px', cursor:'pointer' }}>{tx.cancelar}</button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => setTareaAccion(tareaAccion?.id===tarea.id?null:{...tarea,grupoId:grupo.grupoId})} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'12px', background: tareaAccion?.id===tarea.id?`${grupo.color}15`:th.bg, border:`0.5px solid ${tareaAccion?.id===tarea.id?grupo.color:th.borde}`, cursor:'pointer', marginBottom: tareaAccion?.id===tarea.id?'0':'0' }}>
                        <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:grupo.color, flexShrink:0 }} />
                        <span style={{ fontSize:'14px', color:th.texto, flex:1 }}>{tarea.texto}</span>
                        <span style={{ fontSize:'14px', color:th.textoSub }}>›</span>
                      </div>
                    )}
                    {tareaAccion?.id === tarea.id && !modoEditar && !confirmarEliminar && (
                      <div style={{ display:'flex', gap:'8px', marginTop:'6px', paddingLeft:'8px' }}>
                        <button onClick={() => { setModoEditar({grupoId:grupo.grupoId,tareaId:tarea.id}); setTextoEditar(tarea.texto); setEditModo(null); setTareaAccion(null) }} style={{ flex:1, padding:'8px', background:`${grupo.color}18`, border:`0.5px solid ${grupo.color}33`, borderRadius:'10px', color:grupo.color, fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>{`✏️ ${tx.agendaGuardar === 'Guardar' ? 'Editar' : tx.agendaGuardarCambios.split(' ')[0]}`}</button>
                        <button onClick={() => { setConfirmarEliminar(tarea); setTareaAccion(null) }} style={{ flex:1, padding:'8px', background:'rgba(226,75,74,0.08)', border:'0.5px solid rgba(226,75,74,0.25)', borderRadius:'10px', color:'#E24B4A', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>🗑 {tx.eliminar}</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {mostrarForm && (
              <div style={{ borderTop: tareasDia.length>0?`0.5px solid ${th.borde}`:'none', paddingTop: tareasDia.length>0?'14px':'0' }}>
                <input autoFocus placeholder={tx.nuevaTarea} value={nuevaTarea} onChange={e=>setNuevaTarea(e.target.value)} onKeyDown={e=>e.key==='Enter'&&guardarTarea()} style={{ width:'100%', padding:'12px 14px', borderRadius:'12px', border:`1.5px solid ${th.acento}`, background:th.bg, color:th.texto, fontSize:'14px', outline:'none', boxSizing:'border-box', marginBottom:'12px' }} />
                <div onClick={() => setMostrarSelectorGrupo(true)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:`${th.acento}11`, borderRadius:'12px', cursor:'pointer', marginBottom:'10px' }}>
                  <div>
                    <div style={{ fontSize:'10px', color:th.textoSub, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'2px' }}>{tx.guardarEn}</div>
                    <div style={{ fontSize:'14px', fontWeight:'600', color:th.acento }}>{grupoSeleccionado.nombre}</div>
                  </div>
                  <span style={{ color:th.textoSub, fontSize:'16px' }}>›</span>
                </div>
                <button onClick={()=>{setMostrarRepetir(!mostrarRepetir);if(!mostrarRepetir){setFechasRepetir([]);setMesRepetir(mes);setAnioRepetir(anio)}}} style={{ background: mostrarRepetir?th.acento:`${th.acento}18`, border:'none', borderRadius:'8px', padding:'6px 14px', fontSize:'13px', color: mostrarRepetir?'white':th.acento, fontWeight:'600', cursor:'pointer', marginBottom:'10px' }}>🔁 {tx.repetir} {mostrarRepetir?'▲':'▼'}</button>
                {mostrarRepetir && <>
                  <MiniCal a={anioRepetir} m={mesRepetir} setA={setAnioRepetir} setM={setMesRepetir} onDia={toggleFechaRepetir} selFn={(d,a,m) => fechasRepetir.some(f=>f.dia===d&&f.mes===m&&f.anio===a)} hint={null} />
                  <div style={{ fontSize:'12px', color:th.acento, textAlign:'center', marginTop:'6px', marginBottom:'8px' }}>{fechasRepetir.length} {tx.fechasSeleccionadas}</div>
                </>}
                <div style={{ display:'flex', gap:'8px' }}>
                  <button onClick={guardarTarea} disabled={cargando||!nuevaTarea.trim()} style={{ flex:1, padding:'11px', background:th.acento, color:'white', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:'600', cursor:'pointer', opacity:!nuevaTarea.trim()?0.5:1 }}>{cargando?'...':tx.guardar}</button>
                  <button onClick={()=>{setMostrarForm(false);setNuevaTarea('');setMostrarRepetir(false);setFechasRepetir([])}} style={{ padding:'11px 16px', background:'transparent', color:th.textoSub, border:`0.5px solid ${th.borde}`, borderRadius:'12px', fontSize:'14px', cursor:'pointer' }}>{tx.cancelar}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {mostrarSelectorGrupo && (
        <div onClick={() => setMostrarSelectorGrupo(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:300 }}>
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

      <div style={{ position:'fixed', bottom:0, left:0, right:0, background: esOscuro?'rgba(6,6,15,0.85)':th.navBg, borderTop: esOscuro?'1px solid rgba(255,255,255,0.1)':`1px solid ${th.navBorde}`, backdropFilter: esOscuro?'blur(20px)':'none', display:'flex', zIndex:50, paddingBottom:'env(safe-area-inset-bottom,0px)' }}>
        {[{key:'inicio',label:t.inicio,icon:'🏠'},{key:'pizarron',label:t.pizarron,icon:'📅'},{key:'listasuper',label:t.super2,icon:'🛒'},{key:'compartir',label:'Compartir',icon:'📤',accion:()=>{if(navigator.share){navigator.share({title:'Syng',text:'Te comparto Syng',url:'https://syng-psi.vercel.app'})}else{navigator.clipboard.writeText('https://syng-psi.vercel.app')}}},{key:'perfil',label:t.perfil,icon:'👤'}].map(item => (
          <button key={item.key} onClick={() => item.accion?item.accion():onNavegar(item.key)} style={{ flex:1, padding:'10px 0 8px', background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', color:th.textoSub }}>
            <span style={{ fontSize:'20px', lineHeight:1 }}>{item.icon}</span>
            <span style={{ fontSize:'10px' }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
