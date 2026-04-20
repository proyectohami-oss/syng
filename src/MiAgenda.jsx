import { useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, doc, getDocs, onSnapshot, setDoc, getDoc } from 'firebase/firestore'

const MESES = {
  es:['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  en:['January','February','March','April','May','June','July','August','September','October','November','December'],
  fr:['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  de:['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
  it:['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'],
  pt:['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  ja:['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  zh:['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
}
const DIAS = {
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
  es:{ titulo:'Mi Agenda', sinPendientes:'Sin pendientes este día', guardarEn:'Guardar en', enQuePizarron:'¿En qué pizarrón?', nuevaTarea:'¿Qué tienes pendiente?', agregar:'+ agregar', guardar:'Guardar', cancelar:'Cancelar', eliminar:'Eliminar', personal:'Personal', editar:'Editar tarea', editarPlaceholder:'Editar...', guardarCambios:'Guardar cambios' },
  en:{ titulo:'My Agenda', sinPendientes:'No tasks this day', guardarEn:'Save to', enQuePizarron:'Which board?', nuevaTarea:'What is pending?', agregar:'+ add', guardar:'Save', cancelar:'Cancel', eliminar:'Delete', personal:'Personal', editar:'Edit task', editarPlaceholder:'Edit...', guardarCambios:'Save changes' },
  fr:{ titulo:'Mon Agenda', sinPendientes:'Aucune tâche ce jour', guardarEn:'Enregistrer dans', enQuePizarron:'Quel tableau?', nuevaTarea:'Quoi de prévu?', agregar:'+ ajouter', guardar:'Enregistrer', cancelar:'Annuler', eliminar:'Supprimer', personal:'Personnel', editar:'Modifier tâche', editarPlaceholder:'Modifier...', guardarCambios:'Sauvegarder' },
  de:{ titulo:'Mein Kalender', sinPendientes:'Keine Aufgaben an diesem Tag', guardarEn:'Speichern in', enQuePizarron:'Welches Board?', nuevaTarea:'Was steht an?', agregar:'+ hinzufügen', guardar:'Speichern', cancelar:'Abbrechen', eliminar:'Löschen', personal:'Persönlich', editar:'Aufgabe bearbeiten', editarPlaceholder:'Bearbeiten...', guardarCambios:'Änderungen speichern' },
  it:{ titulo:'La Mia Agenda', sinPendientes:'Nessun compito questo giorno', guardarEn:'Salva in', enQuePizarron:'Quale lavagna?', nuevaTarea:'Cosa hai in sospeso?', agregar:'+ aggiungi', guardar:'Salva', cancelar:'Annulla', eliminar:'Elimina', personal:'Personale', editar:'Modifica attività', editarPlaceholder:'Modifica...', guardarCambios:'Salva modifiche' },
  pt:{ titulo:'Minha Agenda', sinPendientes:'Sem tarefas este dia', guardarEn:'Salvar em', enQuePizarron:'Qual quadro?', nuevaTarea:'O que está pendente?', agregar:'+ adicionar', guardar:'Salvar', cancelar:'Cancelar', eliminar:'Excluir', personal:'Pessoal', editar:'Editar tarefa', editarPlaceholder:'Editar...', guardarCambios:'Salvar alterações' },
  ja:{ titulo:'マイアジェンダ', sinPendientes:'この日のタスクなし', guardarEn:'保存先', enQuePizarron:'どのボード?', nuevaTarea:'何が保留中ですか?', agregar:'+ 追加', guardar:'保存', cancelar:'キャンセル', eliminar:'削除', personal:'個人', editar:'タスクを編集', editarPlaceholder:'編集...', guardarCambios:'変更を保存' },
  zh:{ titulo:'我的日程', sinPendientes:'今天没有待办', guardarEn:'保存到', enQuePizarron:'哪个白板?', nuevaTarea:'有什么待办?', agregar:'+ 添加', guardar:'保存', cancelar:'取消', eliminar:'删除', personal:'个人', editar:'编辑任务', editarPlaceholder:'编辑...', guardarCambios:'保存更改' },
}

const COLORES = ['#534AB7','#2ECC9A','#EF9F27','#D4537E','#378ADD','#E24B4A','#639922','#9B59B6']

function generarId() { return Math.random().toString(36).slice(2) }
function getKey(a, m, d) { return `${a}-${m}-${d}` }

const TEMA = {
  oscuro:{ bg:'#070712', bgCard:'#18183A', texto:'#F0F0FF', textoSub:'#9090B8', borde:'rgba(255,255,255,0.13)', acento:'#7B6EF6', sombra:'0 4px 24px rgba(0,0,0,0.7)', navBg:'#0E0E24', navBorde:'rgba(255,255,255,0.12)', nombre:'oscuro' },
  claro:{ bg:'#F5F5F7', bgCard:'#FFFFFF', texto:'#1C1C2E', textoSub:'#666680', borde:'#EAEAEA', acento:'#534AB7', sombra:'0 2px 12px rgba(0,0,0,0.07)', navBg:'#FFFFFF', navBorde:'#EAEAEA', nombre:'claro' },
}

export default function MiAgenda({ userId, tema, idioma, onVolver, onNavegar, t }) {
  const th = TEMA[tema] || TEMA.claro
  const tx = TX[idioma] || TX.es
  const meses = MESES[idioma] || MESES.es
  const diasSemana = DIAS[idioma] || DIAS.es
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
  const [grupoSeleccionado, setGrupoSeleccionado] = useState({ id:'personal', nombre: tx.personal })
  const [mostrarSelectorGrupo, setMostrarSelectorGrupo] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [tareaAccion, setTareaAccion] = useState(null)
  const [modoEditar, setModoEditar] = useState(false)
  const [textoEditar, setTextoEditar] = useState('')

  useEffect(() => {
    if (!userId) return
    const cargarGrupos = async () => {
      const snap = await getDocs(collection(db, 'users', userId, 'misGrupos'))
      const gs = snap.docs.map(d => ({ id: d.id, nombre: d.data().nombre || 'Grupo', color: COLORES[(snap.docs.indexOf(d) + 1) % COLORES.length] }))
      setGrupos([{ id:'personal', nombre: tx.personal, color: COLORES[0] }, ...gs])
    }
    cargarGrupos()
  }, [userId, idioma])

  useEffect(() => {
    if (!userId) return
    let data = {}
    let unsubs = []

    const merge = (id, snap) => {
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
    const u1 = onSnapshot(collection(db, 'users', userId, 'pizarron'), s => { merge('personal', s) })
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
    let agrupadas = []

    const snap1 = await getDoc(doc(db, 'users', userId, 'pizarron', key))
    const items1 = (snap1.data()?.items || []).filter(i => !i.realizada)
    if (items1.length > 0) agrupadas.push({ grupoId:'personal', nombre: tx.personal, color: COLORES[0], items: items1 })

    const gsSnap = await getDocs(collection(db, 'users', userId, 'misGrupos'))
    let idx = 1
    for (const g of gsSnap.docs) {
      const snap = await getDoc(doc(db, 'grupos', g.id, 'pizarron', key))
      const items = (snap.data()?.items || []).filter(i => !i.realizada)
      if (items.length > 0) agrupadas.push({ grupoId: g.id, nombre: g.data().nombre || 'Grupo', color: COLORES[idx % COLORES.length], items })
      idx++
    }
    setTareasDia(agrupadas)
  }

  const tocarDia = (dia) => {
    setDiaSeleccionado(dia)
    setMostrarForm(false)
    setNuevaTarea('')
    setTareaAccion(null)
    cargarTareasDia(dia)
  }

  const guardarTarea = async () => {
    if (!nuevaTarea.trim() || !diaSeleccionado) return
    setCargando(true)
    const key = getKey(anio, mes, diaSeleccionado)
    const nueva = { id: generarId(), texto: nuevaTarea.trim(), realizada: false, dia: diaSeleccionado, mes, anio, creadoPor: userId }
    let ref
    if (grupoSeleccionado.id === 'personal') ref = doc(db, 'users', userId, 'pizarron', key)
    else ref = doc(db, 'grupos', grupoSeleccionado.id, 'pizarron', key)
    const snap = await getDoc(ref)
    const items = snap.data()?.items || []
    await setDoc(ref, { items: [...items, nueva] })
    setNuevaTarea('')
    setMostrarForm(false)
    await cargarTareasDia(diaSeleccionado)
    setCargando(false)
  }

  const eliminarTarea = async (grupoId, tareaId) => {
    const key = getKey(anio, mes, diaSeleccionado)
    let ref
    if (grupoId === 'personal') ref = doc(db, 'users', userId, 'pizarron', key)
    else ref = doc(db, 'grupos', grupoId, 'pizarron', key)
    const snap = await getDoc(ref)
    const items = (snap.data()?.items || []).filter(i => i.id !== tareaId)
    await setDoc(ref, { items })
    setTareaAccion(null)
    await cargarTareasDia(diaSeleccionado)
  }

  const guardarEdicion = async (grupoId, tareaId) => {
    if (!textoEditar.trim()) return
    const key = getKey(anio, mes, diaSeleccionado)
    let ref
    if (grupoId === 'personal') ref = doc(db, 'users', userId, 'pizarron', key)
    else ref = doc(db, 'grupos', grupoId, 'pizarron', key)
    const snap = await getDoc(ref)
    const items = (snap.data()?.items || []).map(i => i.id === tareaId ? { ...i, texto: textoEditar.trim() } : i)
    await setDoc(ref, { items })
    setTareaAccion(null)
    setModoEditar(false)
    await cargarTareasDia(diaSeleccionado)
  }

  const primerDia = () => { const d = new Date(anio, mes, 1).getDay(); return d === 0 ? 6 : d - 1 }
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()
  const celdas = [...Array(primerDia()).fill(null), ...Array(diasEnMes).fill(0).map((_,i) => i+1)]

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

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', textAlign:'center', marginBottom:'8px' }}>
            {diasSemana.map((d,i) => <div key={i} style={{ fontSize:'11px', color:th.textoSub, fontWeight:'600', padding:'4px 0' }}>{d}</div>)}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', textAlign:'center', rowGap:'4px' }}>
            {celdas.map((dia, i) => {
              if (!dia) return <div key={i} />
              const esHoy = dia===hoy.getDate() && mes===hoy.getMonth() && anio===hoy.getFullYear()
              const sel = dia === diaSeleccionado
              const tieneP = badges[`${dia}`] > 0
              return (
                <div key={i} onClick={() => tocarDia(dia)} style={{ cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'6px 0' }}>
                  <div style={{ width:'32px', height:'32px', borderRadius:'50%', background: sel ? th.acento : esHoy ? `${th.acento}22` : 'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:'13px', color: sel ? 'white' : esHoy ? th.acento : th.texto, fontWeight: esHoy||sel ? '700':'400' }}>{dia}</span>
                  </div>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background: tieneP ? th.acento : 'transparent' }} />
                </div>
              )
            })}
          </div>
        </div>

        {diaSeleccionado && (
          <div style={{ background:th.bgCard, borderRadius:'20px', padding:'16px', boxShadow:th.sombra }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
              <span style={{ fontSize:'14px', fontWeight:'600', color:th.texto }}>{diaSeleccionado} de {meses[mes]}</span>
              <button onClick={() => { setMostrarForm(true); setGrupoSeleccionado({ id:'personal', nombre: tx.personal, color: COLORES[0] }); setTareaAccion(null) }} style={{ fontSize:'12px', padding:'6px 14px', borderRadius:'20px', background:th.acento, color:'white', border:'none', cursor:'pointer', fontWeight:'600' }}>{tx.agregar}</button>
            </div>

            {tareasDia.length === 0 && !mostrarForm && (
              <div style={{ textAlign:'center', color:th.textoSub, fontSize:'13px', padding:'20px 0' }}>{tx.sinPendientes}</div>
            )}

            {tareasDia.map((grupo) => (
              <div key={grupo.grupoId} style={{ marginBottom:'14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                  <div style={{ width:'10px', height:'10px', borderRadius:'50%', background: grupo.color }} />
                  <span style={{ fontSize:'11px', fontWeight:'700', color:th.textoSub, textTransform:'uppercase', letterSpacing:'0.06em' }}>{grupo.nombre}</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {grupo.items.map(tarea => (
                    <div key={tarea.id}>
                      <div onClick={() => { setTareaAccion(tareaAccion?.id===tarea.id ? null : {...tarea, grupoId: grupo.grupoId}); setModoEditar(false) }} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'12px', background: tareaAccion?.id===tarea.id ? `${grupo.color}18` : `${th.bg}`, cursor:'pointer', border: tareaAccion?.id===tarea.id ? `1px solid ${grupo.color}44` : `0.5px solid ${th.borde}` }}>
                        <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: grupo.color, flexShrink:0 }} />
                        <span style={{ fontSize:'14px', color:th.texto, flex:1 }}>{tarea.texto}</span>
                        <span style={{ fontSize:'14px', color:th.textoSub }}>›</span>
                      </div>
                      {tareaAccion?.id === tarea.id && !modoEditar && (
                        <div style={{ display:'flex', gap:'8px', marginTop:'6px', paddingLeft:'8px' }}>
                          <button onClick={() => { setModoEditar(true); setTextoEditar(tarea.texto) }} style={{ flex:1, padding:'8px', background:`${grupo.color}22`, border:`0.5px solid ${grupo.color}44`, borderRadius:'10px', color: grupo.color, fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>✏️ {tx.editar.split(' ')[0]}</button>
                          <button onClick={() => eliminarTarea(grupo.grupoId, tarea.id)} style={{ flex:1, padding:'8px', background:'rgba(226,75,74,0.1)', border:'0.5px solid rgba(226,75,74,0.3)', borderRadius:'10px', color:'#E24B4A', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>🗑 {tx.eliminar}</button>
                        </div>
                      )}
                      {tareaAccion?.id === tarea.id && modoEditar && (
                        <div style={{ marginTop:'8px', paddingLeft:'8px' }}>
                          <input autoFocus value={textoEditar} onChange={e => setTextoEditar(e.target.value)} onKeyDown={e => e.key==='Enter' && guardarEdicion(grupo.grupoId, tarea.id)} style={{ width:'100%', padding:'10px 12px', borderRadius:'10px', border:`1.5px solid ${th.acento}`, background:th.bg, color:th.texto, fontSize:'14px', outline:'none', boxSizing:'border-box', marginBottom:'8px' }} />
                          <div style={{ display:'flex', gap:'8px' }}>
                            <button onClick={() => guardarEdicion(grupo.grupoId, tarea.id)} style={{ flex:1, padding:'9px', background:th.acento, color:'white', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>{tx.guardarCambios}</button>
                            <button onClick={() => { setModoEditar(false); setTareaAccion(null) }} style={{ padding:'9px 14px', background:'transparent', color:th.textoSub, border:`0.5px solid ${th.borde}`, borderRadius:'10px', fontSize:'13px', cursor:'pointer' }}>{tx.cancelar}</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {mostrarForm && (
              <div style={{ borderTop: tareasDia.length > 0 ? `0.5px solid ${th.borde}` : 'none', paddingTop: tareasDia.length > 0 ? '14px' : '0' }}>
                <input autoFocus placeholder={tx.nuevaTarea} value={nuevaTarea} onChange={e => setNuevaTarea(e.target.value)} onKeyDown={e => e.key==='Enter' && guardarTarea()} style={{ width:'100%', padding:'12px 14px', borderRadius:'12px', border:`1.5px solid ${th.acento}`, background:th.bg, color:th.texto, fontSize:'14px', outline:'none', boxSizing:'border-box', marginBottom:'12px' }} />
                <div onClick={() => setMostrarSelectorGrupo(true)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:`${th.acento}11`, borderRadius:'12px', cursor:'pointer', marginBottom:'12px' }}>
                  <div>
                    <div style={{ fontSize:'10px', color:th.textoSub, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'2px' }}>{tx.guardarEn}</div>
                    <div style={{ fontSize:'14px', fontWeight:'600', color:th.acento }}>{grupoSeleccionado.nombre}</div>
                  </div>
                  <span style={{ color:th.textoSub, fontSize:'16px' }}>›</span>
                </div>
                <div style={{ display:'flex', gap:'8px' }}>
                  <button onClick={guardarTarea} disabled={cargando || !nuevaTarea.trim()} style={{ flex:1, padding:'11px', background:th.acento, color:'white', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:'600', cursor:'pointer', opacity: !nuevaTarea.trim() ? 0.5 : 1 }}>{cargando ? '...' : tx.guardar}</button>
                  <button onClick={() => { setMostrarForm(false); setNuevaTarea('') }} style={{ padding:'11px 16px', background:'transparent', color:th.textoSub, border:`0.5px solid ${th.borde}`, borderRadius:'12px', fontSize:'14px', cursor:'pointer' }}>{tx.cancelar}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {mostrarSelectorGrupo && (
        <div onClick={() => setMostrarSelectorGrupo(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:300 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:th.bgCard, borderRadius:'20px 20px 0 0', padding:'20px 20px 40px', width:'100%', maxWidth:'400px' }}>
            <div style={{ fontSize:'13px', fontWeight:'600', color:th.textoSub, textAlign:'center', marginBottom:'16px', textTransform:'uppercase', letterSpacing:'0.06em' }}>{tx.enQuePizarron}</div>
            {grupos.map(g => (
              <div key={g.id} onClick={() => { setGrupoSeleccionado(g); setMostrarSelectorGrupo(false) }} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderRadius:'12px', marginBottom:'4px', background: grupoSeleccionado.id===g.id ? `${th.acento}15` : 'transparent', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:`${g.color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700', color: g.color }}>{g.nombre[0]}</div>
                  <span style={{ fontSize:'15px', color:th.texto }}>{g.nombre}</span>
                </div>
                {grupoSeleccionado.id===g.id && <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:th.acento, display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'white' }} /></div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ position:'fixed', bottom:0, left:0, right:0, background: esOscuro ? 'rgba(6,6,15,0.85)' : th.navBg, borderTop: esOscuro ? '1px solid rgba(255,255,255,0.1)' : `1px solid ${th.navBorde}`, backdropFilter: esOscuro ? 'blur(20px)' : 'none', display:'flex', zIndex:50, paddingBottom:'env(safe-area-inset-bottom,0px)' }}>
        {[{key:'inicio',label:t.inicio,icon:'🏠'},{key:'pizarron',label:t.pizarron,icon:'📅'},{key:'listasuper',label:t.super2,icon:'🛒'},{key:'compartir',label:'Compartir',icon:'📤',accion:()=>{if(navigator.share){navigator.share({title:'Syng',text:'Te comparto Syng',url:'https://syng-psi.vercel.app'})}else{navigator.clipboard.writeText('https://syng-psi.vercel.app')}}},{key:'perfil',label:t.perfil,icon:'👤'}].map(item => (
          <button key={item.key} onClick={() => item.accion ? item.accion() : onNavegar(item.key)} style={{ flex:1, padding:'10px 0 8px', background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', color: th.textoSub, transition:'color 0.2s' }}>
            <span style={{ fontSize:'20px', lineHeight:1 }}>{item.icon}</span>
            <span style={{ fontSize:'10px', fontWeight:'400' }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
