import { useState, useRef, useEffect } from 'react'
import { db } from './firebase'
import {
  collection, doc, onSnapshot, setDoc, deleteDoc,
  updateDoc, getDoc, getDocs, writeBatch, arrayUnion, arrayRemove
} from 'firebase/firestore'
import { TEXTOS } from './idiomas'
import { CATALOGOS, DEP_ORDER_BY_LANG } from './catalogos'

const GRUPO_COLORS = ['#5DCAA5','#378ADD','#D85A30','#7F77DD','#1D9E75','#BA7517']

const TEMAS = {
  oscuro: { bg:'#0D0D1A', bgCard:'#1A1A2E', bgStripe:'#13132A', bgInput:'#1E1E35', bgInputBorder:'rgba(255,255,255,0.15)', header:'linear-gradient(135deg,#2ECC9A,#1D9E75)', headerSub:'#18856A', texto:'#F0F0FF', textoSub:'#9090B8', textoMuted:'rgba(255,255,255,0.35)', borde:'rgba(255,255,255,0.07)', acento:'#2ECC9A', acentoTexto:'#1D9E75', selBg:'rgba(46,204,154,0.15)', selBorde:'rgba(46,204,154,0.4)', selTexto:'#2ECC9A', qtyBg:'rgba(46,204,154,0.2)', qtyBorde:'rgba(46,204,154,0.3)', modalBg:'#1A1A2E' },
  claro: { bg:'#F5F5F7', bgCard:'#FFFFFF', bgStripe:'#F5F5F7', bgInput:'#FAFAFA', bgInputBorder:'#e5e5e5', header:'#185FA5', headerSub:'#0C447C', texto:'#2C2C2A', textoSub:'#888', textoMuted:'#bbb', borde:'#EBEBEB', acento:'#185FA5', acentoTexto:'#0C447C', selBg:'#E6F1FB', selBorde:'#B5D4F4', selTexto:'#0C447C', qtyBg:'#B5D4F4', qtyBorde:'#85B7EB', modalBg:'#FFFFFF' }
}

function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'') }
function fuzzyMatch(query,text) {
  const q=norm(query),t=norm(text)
  if(t.includes(q)) return true
  if(q.length<3) return false
  return t.split(' ').some(w=>{
    if(Math.abs(w.length-q.length)>2) return false
    let errors=0; const len=Math.max(w.length,q.length)
    for(let i=0;i<len;i++){if(w[i]!==q[i])errors++}
    return errors<=Math.floor(q.length/3)+1
  })
}
function generarId(){return Math.random().toString(36).substr(2,9)}

function ModalInput({title,placeholder,defaultValue='',onConfirm,onCancel,th,tx}){
  const [val,setVal]=useState(defaultValue)
  return(
    <div style={{background:th.modalBg,borderRadius:'16px',padding:'22px 20px',width:'100%',maxWidth:'340px'}}>
      <div style={{fontSize:'15px',fontWeight:'600',color:th.texto,marginBottom:'14px'}}>{title}</div>
      <input autoFocus value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&val.trim()&&onConfirm(val.trim())} placeholder={placeholder} style={{width:'100%',padding:'9px 11px',border:`1px solid ${th.bgInputBorder}`,borderRadius:'8px',fontSize:'13px',outline:'none',fontFamily:'inherit',color:th.texto,background:th.bgInput,marginBottom:'12px',boxSizing:'border-box'}}/>
      <div style={{display:'flex',gap:'8px'}}>
        <button onClick={onCancel} style={{flex:1,padding:'10px',borderRadius:'10px',background:th.bgStripe,border:`0.5px solid ${th.borde}`,cursor:'pointer',fontSize:'13px',color:th.textoSub,fontFamily:'inherit'}}>{tx.cancelar}</button>
        <button onClick={()=>val.trim()&&onConfirm(val.trim())} disabled={!val.trim()} style={{flex:1,padding:'10px',borderRadius:'10px',background:val.trim()?th.acento:th.bgStripe,border:'none',cursor:val.trim()?'pointer':'default',fontSize:'13px',color:val.trim()?'white':th.textoMuted,fontWeight:'500',fontFamily:'inherit'}}>{tx.guardar}</button>
      </div>
    </div>
  )
}

function ModalConfirm({title,msg,onConfirm,onCancel,th,tx}){
  return(
    <div style={{background:th.modalBg,borderRadius:'16px',padding:'22px 20px',width:'100%',maxWidth:'340px',textAlign:'center'}}>
      <div style={{fontSize:'15px',fontWeight:'600',color:th.texto,marginBottom:'8px'}}>{title}</div>
      {msg&&<div style={{fontSize:'13px',color:th.textoSub,marginBottom:'22px',lineHeight:'1.5'}}>{msg}</div>}
      <div style={{display:'flex',gap:'8px'}}>
        <button onClick={onCancel} style={{flex:1,padding:'11px',borderRadius:'10px',background:th.bgStripe,border:`0.5px solid ${th.borde}`,cursor:'pointer',fontSize:'13px',color:th.textoSub,fontFamily:'inherit'}}>{tx.cancelar}</button>
        <button onClick={onConfirm} style={{flex:1,padding:'11px',borderRadius:'10px',background:'#A32D2D',border:'none',cursor:'pointer',fontSize:'13px',color:'white',fontWeight:'500',fontFamily:'inherit'}}>{tx.eliminar}</button>
      </div>
    </div>
  )
}

export default function ListaSuper({onVolver,tema='oscuro',idioma='es',userId=null,userName='Tú',userEmail='',grupoInicial=null}){
  const th=TEMAS[tema]||TEMAS.oscuro
  const tx=TEXTOS[idioma]||TEXTOS.es

  const [grupos,setGrupos]=useState([])
  // ✅ FIX: leer grupo destino desde localStorage al abrir por invitación
  const [grupoActivo,setGrupoActivo]=useState(()=>{
    const saved=localStorage.getItem('syng_grupo_activo_lista')
    if(saved){localStorage.removeItem('syng_grupo_activo_lista');return saved}
    return grupoInicial||'personal'
  })
  const [cargando,setCargando]=useState(true)
  const [seleccionados,setSeleccionados]=useState({})
  const [customProds,setCustomProds]=useState({})
  const [tab,setTab]=useState('cat')
  const [listSelMode,setListSelMode]=useState(false)
  const [listSelIds,setListSelIds]=useState([])
  const [filtroCat,setFiltroCat]=useState('')
  const [filtroList,setFiltroList]=useState('')
  const [modal,setModal]=useState(null)
  const [mData,setMData]=useState({})
  const [modalVerGrupo,setModalVerGrupo]=useState(null)
  const [confirmEliminarMiembro,setConfirmEliminarMiembro]=useState(null)
  const [confirmSalirGrupo,setConfirmSalirGrupo]=useState(false)
  const [confirmEliminarGrupo,setConfirmEliminarGrupo]=useState(false)
  const [cargandoInvitacion,setCargandoInvitacion]=useState(false)
  const [modalVisitante,setModalVisitante]=useState(false)

  // ── Migrar localStorage a Firebase personal (una sola vez) ──
  useEffect(()=>{
    if(!userId) return
    const viejo = localStorage.getItem('syng_super_custom')
    if(!viejo) return
    try {
      const data = JSON.parse(viejo)
      const ref = doc(db,'users',userId,'catalogoCustom','productos')
      setDoc(ref,{prods:data}).then(()=>localStorage.removeItem('syng_super_custom'))
    } catch(e) {
      localStorage.removeItem('syng_super_custom')
    }
  },[userId])

  // ── Cargar grupos ──
  useEffect(()=>{
    setCargando(false)
    if(!userId){
      if(grupoInicial){
        const cargarGrupo=async()=>{
          const gSnap=await getDoc(doc(db,'grupos',grupoInicial))
          if(gSnap.exists()) setGrupos([{id:gSnap.id,...gSnap.data()}])
        }
        cargarGrupo()
      }
      return
    }
    const unsub=onSnapshot(collection(db,'users',userId,'misGrupos'),async snap=>{
      const lista=[]
      for(const d of snap.docs){
        if(d.data().modulo!=='lista') continue
        const gSnap=await getDoc(doc(db,'grupos',d.id))
        if(gSnap.exists()) lista.push({id:gSnap.id,...gSnap.data()})
      }
      setGrupos(lista)
      setCargando(false)
    })
    return()=>unsub()
  },[userId])

  // ── Cargar lista de compras del grupo activo ──
  useEffect(()=>{
    if(!userId) return
    setSeleccionados({})
    const listaRef = grupoActivo==='personal'
      ? collection(db,'users',userId,'lista')
      : collection(db,'grupos',grupoActivo,'lista')
    const unsub=onSnapshot(listaRef,snap=>{
      const data={}
      snap.docs.forEach(d=>{ data[d.id]={...d.data()} })
      setSeleccionados(data)
    })
    return()=>unsub()
  },[userId,grupoActivo])

  // ── Cargar catálogo custom del grupo activo desde Firebase ──
  useEffect(()=>{
    if(!userId){ setCustomProds({}); return }
    setCustomProds({})
    const ref = grupoActivo==='personal'
      ? doc(db,'users',userId,'catalogoCustom','productos')
      : doc(db,'grupos',grupoActivo,'catalogoCustom','productos')
    const unsub = onSnapshot(ref, snap=>{
      if(snap.exists()) setCustomProds(snap.data().prods||{})
      else setCustomProds({})
    })
    return()=>unsub()
  },[userId,grupoActivo])

  // ── Guardar catálogo custom — siempre recibe el grupo como parámetro ──
  async function guardarCustom(nuevoCustom, grupo){
    if(!userId) return
    const ref = grupo==='personal'
      ? doc(db,'users',userId,'catalogoCustom','productos')
      : doc(db,'grupos',grupo,'catalogoCustom','productos')
    await setDoc(ref,{prods:nuevoCustom})
  }

  useEffect(()=>{
    const h=(e)=>{const{producto,departamento}=e.detail;const dep=departamento||'Abarrotes';agregarALista(producto,dep)}
    window.addEventListener('sinyi:agregar_producto',h)
    return()=>window.removeEventListener('sinyi:agregar_producto',h)
  },[grupoActivo,userId])

  const catInputRef=useRef(null)
  const listInputRef=useRef(null)
  const depOrder=DEP_ORDER_BY_LANG[idioma]||DEP_ORDER_BY_LANG.es
  const catalogoBase=CATALOGOS[idioma]||CATALOGOS.es

  function getListaRef(p){
    const base=grupoActivo==='personal'
      ?collection(db,'users',userId,'lista')
      :collection(db,'grupos',grupoActivo,'lista')
    return p?doc(base,p):base
  }

  function getTodo(){
    const todo={}
    depOrder.forEach(dep=>{
      const base=catalogoBase[dep]||[]
      const custom=customProds[dep]||[]
      todo[dep]=[...new Set([...base,...custom])].sort((a,b)=>a.localeCompare(b,idioma,{sensitivity:'base'}))
    })
    return todo
  }

  async function agregarALista(p,dep){
    if(!userId||!grupoActivo) return
    await setDoc(getListaRef(p),{qty:1,done:false,dep})
  }
  async function toggleProd(p,dep){
    if(!userId){ setModalVisitante(true); return }
    if(seleccionados[p]){ await deleteDoc(getListaRef(p)) }
    else { await setDoc(getListaRef(p),{qty:1,done:false,dep}) }
  }
  async function cambiarQty(p,delta){
    if(!userId){ setModalVisitante(true); return }
    const qty=Math.max(1,(seleccionados[p]?.qty||1)+delta)
    await updateDoc(getListaRef(p),{qty})
  }
  async function toggleDone(p){
    if(!userId){ setModalVisitante(true); return }
    await updateDoc(getListaRef(p),{done:!seleccionados[p]?.done})
  }
  function toggleListSel(p){setListSelIds(prev=>prev.includes(p)?prev.filter(i=>i!==p):[...prev,p])}
  async function eliminarSeleccion(){
    if(!userId) return
    const batch=writeBatch(db)
    listSelIds.forEach(p=>batch.delete(getListaRef(p)))
    await batch.commit()
    setListSelIds([]);setListSelMode(false)
  }
  async function borrarLista(){
    if(!userId) return
    const batch=writeBatch(db)
    Object.keys(seleccionados).forEach(p=>batch.delete(getListaRef(p)))
    await batch.commit()
    setListSelIds([]);setListSelMode(false);setModal(null)
  }
  async function borrarMarcados(){
    if(!userId) return
    const batch=writeBatch(db)
    Object.entries(seleccionados).forEach(([p,v])=>{ if(v.done) batch.delete(getListaRef(p)) })
    await batch.commit()
    setModal(null)
  }

  async function agregarProducto(dep,nombre){
    const grupo=grupoActivo
    const nuevo={...customProds,[dep]:[...(customProds[dep]||[]),nombre]}
    setCustomProds(nuevo)
    await guardarCustom(nuevo,grupo)
    setModal(null)
  }
  async function editarProducto(dep,viejo,nuevo){
    const grupo=grupoActivo
    const actualizado={...customProds,[dep]:(customProds[dep]||[]).map(p=>p===viejo?nuevo:p)}
    setCustomProds(actualizado)
    await guardarCustom(actualizado,grupo)
    setModal(null)
  }
  async function eliminarProductoCat(dep,prod){
    const grupo=grupoActivo
    const actualizado={...customProds,[dep]:(customProds[dep]||[]).filter(p=>p!==prod)}
    setCustomProds(actualizado)
    await guardarCustom(actualizado,grupo)
    setModal(null)
  }

  async function crearGrupo(nombre){
    if(!userId) return
    const grupoId=generarId()
    const color=GRUPO_COLORS[grupos.length%GRUPO_COLORS.length]
    const nuevoGrupo={nombre,color,adminId:userId,adminEmail:userEmail,adminNombre:userName,miembros:[{uid:userId,email:userEmail,nombre:userName,rol:'admin'}],modulo:'lista',creadoEn:Date.now()}
    await setDoc(doc(db,'grupos',grupoId),nuevoGrupo)
    await setDoc(doc(db,'users',userId,'misGrupos',grupoId),{nombre,modulo:'lista'})
    setGrupoActivo(grupoId)
    setModal(null)
  }
  function cambiarGrupo(id){setGrupoActivo(id);setTab('cat');setModal(null)}
  async function generarInvitacion(){
    if(!modalVerGrupo||!userId) return
    setCargandoInvitacion(true)
    const invId=generarId()
    await setDoc(doc(db,'invitaciones',invId),{grupoId:modalVerGrupo.id,grupoNombre:modalVerGrupo.nombre,modulo:'lista',creadoPor:userId,creadoEn:Date.now(),expiresEn:Date.now()+7*24*60*60*1000,usado:false})
    const link=`${window.location.origin}?invitacion=${invId}`
    setCargandoInvitacion(false)
    if(navigator.share){
      try{await navigator.share({title:'Syng',text:`Te invito al grupo "${modalVerGrupo.nombre}" en Syng`,url:link})}
      catch(e){if(e.name!=='AbortError'){await navigator.clipboard.writeText(link);alert('Link copiado')}}
    }else{
      await navigator.clipboard.writeText(link)
      alert('Link copiado: '+link)
    }
  }
  async function eliminarMiembro(miembro){
    if(!modalVerGrupo) return
    await updateDoc(doc(db,'grupos',modalVerGrupo.id),{miembros:arrayRemove(miembro)})
    await deleteDoc(doc(db,'users',miembro.uid,'misGrupos',modalVerGrupo.id))
    setModalVerGrupo(prev=>({...prev,miembros:prev.miembros.filter(m=>m.uid!==miembro.uid)}))
    setConfirmEliminarMiembro(null)
  }
  async function salirDelGrupo(){
    if(!modalVerGrupo||!userId) return
    const miembro=(modalVerGrupo.miembros||[]).find(m=>m.uid===userId)
    if(miembro) await updateDoc(doc(db,'grupos',modalVerGrupo.id),{miembros:arrayRemove(miembro)})
    await deleteDoc(doc(db,'users',userId,'misGrupos',modalVerGrupo.id))
    setModalVerGrupo(null);setConfirmSalirGrupo(false);setGrupoActivo('personal')
  }
  async function eliminarGrupo(){
    if(!modalVerGrupo||!userId) return
    const batch=writeBatch(db)
    for(const m of (modalVerGrupo.miembros||[])) batch.delete(doc(db,'users',m.uid,'misGrupos',modalVerGrupo.id))
    const listaSnap=await getDocs(collection(db,'grupos',modalVerGrupo.id,'lista'))
    listaSnap.docs.forEach(d=>batch.delete(d.ref))
    const catSnap=await getDocs(collection(db,'grupos',modalVerGrupo.id,'catalogoCustom'))
    catSnap.docs.forEach(d=>batch.delete(d.ref))
    batch.delete(doc(db,'grupos',modalVerGrupo.id))
    await batch.commit()
    setModalVerGrupo(null);setConfirmEliminarGrupo(false);setGrupoActivo('personal')
  }

  const nSel=Object.keys(seleccionados).length
  const todo=getTodo()
  const g=grupoActivo==='personal'?{id:'personal',nombre:'Personal',color:'#888'}:(grupos.find(gr=>gr.id===grupoActivo)||null)
  const inp={width:'100%',padding:'9px 13px',border:`1.5px solid ${th.bgInputBorder}`,borderRadius:'10px',fontSize:'14px',outline:'none',fontFamily:'inherit',background:th.bgInput,color:th.texto,boxSizing:'border-box'}
  const T={fontFamily:'inherit',cursor:'pointer'}

  if(cargando) return(
    <div style={{minHeight:'100vh',background:th.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:th.textoMuted,fontSize:'14px'}}>Cargando...</div>
    </div>
  )

  return(
    <div style={{minHeight:'100vh',background:th.bg,fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif'}}>
      <div style={{position:'sticky',top:0,zIndex:20}}>
      <div style={{background:th.header,padding:'12px 16px 0'}}>
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',paddingBottom:'12px'}}>
          <div>
            <div style={{fontSize:'19px',fontWeight:'700',color:'white'}}>{tx.listSuper}</div>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.65)',marginTop:'1px'}}>{nSel} {tx.productos}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'26px',fontWeight:'700',color:'white',lineHeight:1}}>{nSel}</div>
            <div style={{fontSize:'10px',color:'rgba(255,255,255,0.6)'}}>{tx.productos}</div>
          </div>
        </div>
      </div>

      <div style={{background:th.headerSub,padding:'7px 12px',display:'flex',alignItems:'center',gap:'8px'}}>
        <button onClick={()=>setModal('grupos')} style={{background:'rgba(255,255,255,0.15)',border:'none',color:'white',borderRadius:'8px',padding:'5px 10px',fontSize:'12px',cursor:'pointer',display:'flex',alignItems:'center',gap:'5px',fontFamily:'inherit'}}>
          <div style={{width:'8px',height:'8px',borderRadius:'50%',background:g?g.color:'#888',flexShrink:0}}/>
          <span style={{fontWeight:'500'}}>{g?g.nombre:'Personal'}</span>
          <span style={{opacity:.6,fontSize:'10px'}}>▾</span>
        </button>
        <button onClick={()=>setModal('nuevo-grupo')} style={{marginLeft:'auto',background:'rgba(255,255,255,0.15)',border:'none',color:'white',borderRadius:'8px',padding:'5px 10px',fontSize:'11px',cursor:'pointer',fontFamily:'inherit'}}>{tx.nuevoGrupoSuper}</button>
      </div>

      <div style={{display:'flex',background:th.headerSub,borderTop:'0.5px solid rgba(255,255,255,0.1)'}}>
        {['cat','list'].map(t=>(
          <div key={t} onClick={()=>{setTab(t);setListSelMode(false);setListSelIds([])}} style={{flex:1,padding:'10px',textAlign:'center',fontSize:'13px',fontWeight:'500',cursor:'pointer',borderBottom:tab===t?'2px solid white':'2px solid transparent',color:tab===t?'white':'rgba(255,255,255,0.5)',position:'relative'}}>
            {t==='cat'?tx.catalogo:tx.miLista}
            {t==='list'&&nSel>0&&<span style={{position:'absolute',top:'5px',right:'10px',background:'#E24B4A',color:'white',borderRadius:'10px',fontSize:'9px',fontWeight:'700',padding:'1px 5px'}}>{nSel}</span>}
          </div>
        ))}
      </div>
      </div>

      {tab==='cat'&&(
        <div>
          <div style={{padding:'8px 12px',background:th.bgStripe,borderBottom:`0.5px solid ${th.borde}`,position:'sticky',top:0,zIndex:10}}>
            <div style={{position:'relative',display:'flex',alignItems:'center'}}>
              <input ref={catInputRef} value={filtroCat} onChange={e=>setFiltroCat(e.target.value)} placeholder={tx.buscarCatalogo} style={{...inp,paddingRight:'32px'}}/>
              {filtroCat&&<button onClick={()=>setFiltroCat('')} style={{position:'absolute',right:'10px',background:'none',border:'none',cursor:'pointer',fontSize:'16px',color:th.textoMuted,lineHeight:1,padding:'0'}}>✕</button>}
            </div>
          </div>
          {depOrder.map(dep=>{
            const prods=filtroCat?todo[dep].filter(p=>fuzzyMatch(filtroCat,p)):todo[dep]
            if(!prods.length) return null
            return(
              <div key={dep}>
                <div style={{fontSize:'9px',fontWeight:'600',color:th.textoMuted,letterSpacing:'.08em',textTransform:'uppercase',padding:'7px 14px 3px',background:th.bgStripe,borderBottom:`0.5px solid ${th.borde}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  {dep}
                  <button onClick={()=>{setMData({dep});setModal('add-prod')}} style={{fontSize:'10px',color:th.acento,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>{tx.agregarProd}</button>
                </div>
                {prods.map(p=>{
                  const isSel=!!seleccionados[p]
                  const isCustom=!!(customProds[dep]?.includes(p))
                  const qty=seleccionados[p]?.qty||1
                  return(
                    <div key={p} onClick={()=>toggleProd(p,dep)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 14px',borderBottom:`0.5px solid ${th.borde}`,background:isSel?th.selBg:th.bgCard,cursor:'pointer',borderLeft:isCustom?`3px solid ${th.acento}`:'none'}}>
                      <div style={{width:'20px',height:'20px',borderRadius:'5px',border:isSel?'none':`1.5px solid ${th.textoMuted}`,background:isSel?th.acento:'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',color:'white',transition:'all .15s'}}>{isSel?'✓':''}</div>
                      <div style={{flex:1,fontSize:'13px',color:isSel?th.selTexto:th.texto,fontWeight:isSel?'500':'400',textAlign:'left'}}>{p}</div>
                      {isSel&&(
                        <div onClick={e=>e.stopPropagation()} style={{display:'flex',alignItems:'center',gap:'4px'}}>
                          <button onClick={()=>cambiarQty(p,-1)} style={{width:'26px',height:'26px',borderRadius:'5px',background:th.qtyBg,border:`0.5px solid ${th.qtyBorde}`,cursor:'pointer',fontSize:'16px',display:'flex',alignItems:'center',justifyContent:'center',color:th.selTexto}}>−</button>
                          <span style={{fontSize:'13px',fontWeight:'500',minWidth:'20px',textAlign:'center',color:th.selTexto}}>{qty}</span>
                          <button onClick={()=>cambiarQty(p,1)} style={{width:'26px',height:'26px',borderRadius:'5px',background:th.qtyBg,border:`0.5px solid ${th.qtyBorde}`,cursor:'pointer',fontSize:'16px',display:'flex',alignItems:'center',justifyContent:'center',color:th.selTexto}}>+</button>
                        </div>
                      )}
                      {isCustom&&(
                        <div onClick={e=>e.stopPropagation()} style={{display:'flex',gap:'3px'}}>
                          <button onClick={()=>{setMData({prod:p,dep});setModal('edit-prod')}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'12px',color:th.textoSub,padding:'2px 5px'}}>✎</button>
                          <button onClick={()=>{setMData({prod:p,dep});setModal('confirm-del-cat')}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'12px',color:'#A32D2D',padding:'2px 5px'}}>✕</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
          {filtroCat&&depOrder.every(dep=>!todo[dep].some(p=>fuzzyMatch(filtroCat,p)))&&(
            <div style={{padding:'32px 16px',textAlign:'center',color:th.textoMuted,fontSize:'13px'}}>{tx.sinResultados} "{filtroCat}"</div>
          )}
        </div>
      )}

      {tab==='list'&&(
        <div>
          <div style={{padding:'8px 12px',background:th.bgStripe,borderBottom:`0.5px solid ${th.borde}`,position:'sticky',top:0,zIndex:10}}>
            <div style={{position:'relative',display:'flex',alignItems:'center'}}>
              <input ref={listInputRef} value={filtroList} onChange={e=>setFiltroList(e.target.value)} placeholder={tx.buscarLista} style={{...inp,paddingRight:'32px'}}/>
              {filtroList&&<button onClick={()=>setFiltroList('')} style={{position:'absolute',right:'10px',background:'none',border:'none',cursor:'pointer',fontSize:'16px',color:th.textoMuted,lineHeight:1,padding:'0'}}>✕</button>}
            </div>
          </div>
          {listSelMode?(
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 14px',background:th.selBg,borderBottom:`0.5px solid ${th.selBorde}`}}>
              <span style={{fontSize:'12px',color:th.selTexto}}>{listSelIds.length} {tx.seleccionados}</span>
              <div style={{display:'flex',gap:'6px'}}>
                <button onClick={()=>{setListSelMode(false);setListSelIds([])}} style={{background:'none',border:'none',color:th.selTexto,fontSize:'12px',cursor:'pointer',fontFamily:'inherit'}}>{tx.cancelar}</button>
                <button onClick={()=>setModal('confirm-del-lista')} style={{background:'none',border:'1px solid #A32D2D',color:'#A32D2D',fontSize:'11px',borderRadius:'6px',padding:'3px 10px',cursor:'pointer',fontFamily:'inherit'}}>{tx.eliminar}</button>
              </div>
            </div>
          ):(
            <div style={{padding:'6px 14px',background:th.bgStripe,borderBottom:`0.5px solid ${th.borde}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:'11px',color:th.textoMuted}}>{tx.tocaCirculo}</span>
              <button onClick={()=>setListSelMode(true)} style={{fontSize:'11px',color:th.acento,cursor:'pointer',background:'none',border:'none',fontFamily:'inherit'}}>{tx.seleccionar}</button>
            </div>
          )}
          {nSel===0?(
            <div style={{padding:'40px 16px',textAlign:'center',color:th.textoMuted,fontSize:'13px'}}>{tx.seleccionarProd}</div>
          ):(
            depOrder.map(dep=>{
              const items=Object.entries(seleccionados).filter(([p,d])=>d.dep===dep&&(!filtroList||fuzzyMatch(filtroList,p))).sort((a,b)=>a[0].localeCompare(b[0],'es',{sensitivity:'base'}))
              if(!items.length) return null
              return(
                <div key={dep}>
                  <div style={{fontSize:'9px',fontWeight:'600',color:th.textoMuted,letterSpacing:'.08em',textTransform:'uppercase',padding:'7px 14px 3px',background:th.bgStripe,borderBottom:`0.5px solid ${th.borde}`}}>{dep}</div>
                  {items.map(([p,d])=>{
                    const isSel=listSelIds.includes(p)
                    return(
                      <div key={p} onClick={()=>listSelMode?toggleListSel(p):toggleDone(p)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 14px',borderBottom:`0.5px solid ${th.borde}`,background:d.done?th.bgStripe:th.bgCard,cursor:'pointer'}}>
                        {listSelMode?(
                          <div style={{width:'20px',height:'20px',borderRadius:'50%',border:isSel?'none':`1.5px solid ${th.textoMuted}`,background:isSel?th.acento:'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',color:'white'}}>{isSel?'✓':''}</div>
                        ):(
                          <div style={{width:'20px',height:'20px',borderRadius:'50%',border:d.done?'none':`1.5px solid ${th.textoMuted}`,background:d.done?'#3B6D11':'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',color:'white',transition:'all .15s'}}>{d.done?'✓':''}</div>
                        )}
                        <div style={{flex:1,fontSize:'13px',color:d.done?th.textoMuted:th.texto,textDecoration:d.done?'line-through':'none',textAlign:'left'}}>{p}</div>
                        <div onClick={e=>e.stopPropagation()} style={{display:'flex',alignItems:'center',gap:'4px'}}>
                          <button onClick={()=>cambiarQty(p,-1)} style={{width:'26px',height:'26px',borderRadius:'5px',background:th.bgStripe,border:`0.5px solid ${th.borde}`,cursor:'pointer',fontSize:'16px',display:'flex',alignItems:'center',justifyContent:'center',color:th.texto}}>−</button>
                          <span style={{fontSize:'13px',fontWeight:'500',minWidth:'20px',textAlign:'center',color:th.texto}}>{d.qty}</span>
                          <button onClick={()=>cambiarQty(p,1)} style={{width:'26px',height:'26px',borderRadius:'5px',background:th.bgStripe,border:`0.5px solid ${th.borde}`,cursor:'pointer',fontSize:'16px',display:'flex',alignItems:'center',justifyContent:'center',color:th.texto}}>+</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })
          )}
          {nSel>0&&(
            <div style={{padding:'10px 14px',borderTop:`0.5px solid ${th.borde}`,display:'flex',gap:'8px'}}>
              <button onClick={()=>setModal('confirm-borrar-marcados')} style={{flex:1,padding:'10px',border:'0.5px solid #A32D2D',borderRadius:'9px',background:'none',cursor:'pointer',fontSize:'13px',color:'#A32D2D',fontFamily:'inherit',fontWeight:'500'}}>{tx.borrarMarcados}</button>
              <button onClick={()=>setModal('confirm-borrar')} style={{flex:1,padding:'10px',border:'0.5px solid #A32D2D',borderRadius:'9px',background:'none',cursor:'pointer',fontSize:'13px',color:'#A32D2D',fontFamily:'inherit',fontWeight:'500'}}>{tx.borrarLista}</button>
            </div>
          )}
        </div>
      )}

      {modal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:'20px'}} onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}>
          {modal==='grupos'&&(
            <div style={{background:th.modalBg,borderRadius:'16px',padding:'22px 20px',width:'100%',maxWidth:'340px'}}>
              <div style={{fontSize:'15px',fontWeight:'600',color:th.texto,marginBottom:'14px'}}>{tx.misGrupos}</div>
              <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 0',borderBottom:`0.5px solid ${th.borde}`}}>
                <div onClick={()=>cambiarGrupo('personal')} style={{display:'flex',alignItems:'center',gap:'10px',flex:1,cursor:'pointer'}}>
                  <div style={{width:'10px',height:'10px',borderRadius:'50%',background:'#888',flexShrink:0}}/>
                  <div style={{flex:1,fontSize:'14px',color:th.texto}}>Personal{grupoActivo==='personal'?' ✓':''}</div>
                  <div style={{fontSize:'11px',color:th.textoMuted}}>Solo tú</div>
                </div>
              </div>
              {grupos.map((gr)=>(
                <div key={gr.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 0',borderBottom:`0.5px solid ${th.borde}`}}>
                  <div onClick={()=>cambiarGrupo(gr.id)} style={{display:'flex',alignItems:'center',gap:'10px',flex:1,cursor:'pointer'}}>
                    <div style={{width:'10px',height:'10px',borderRadius:'50%',background:gr.color,flexShrink:0}}/>
                    <div style={{flex:1,fontSize:'14px',color:th.texto}}>{gr.nombre}{gr.id===grupoActivo?' ✓':''}</div>
                    <div style={{fontSize:'11px',color:th.textoMuted}}>{gr.miembros?.length||1} {tx.integrantes}</div>
                  </div>
                  <button onClick={(e)=>{e.stopPropagation();setModalVerGrupo(gr);setModal(null)}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'20px',color:th.textoSub,padding:'4px 10px',flexShrink:0}}>⋯</button>
                </div>
              ))}
              <button onClick={()=>setModal(null)} style={{width:'100%',padding:'10px',marginTop:'12px',borderRadius:'10px',background:th.bgStripe,border:`0.5px solid ${th.borde}`,cursor:'pointer',fontSize:'13px',color:th.textoSub,fontFamily:'inherit'}}>{tx.cerrar}</button>
            </div>
          )}
          {modal==='nuevo-grupo'&&<ModalInput title={tx.nuevoGrupo} placeholder={tx.nombreGrupoPlaceholder} onConfirm={v=>crearGrupo(v)} onCancel={()=>setModal(null)} th={th} tx={tx}/>}
          {modal==='add-prod'&&<ModalInput title={`${tx.agregarProd} ${mData.dep}`} placeholder={tx.nombreProd} onConfirm={v=>agregarProducto(mData.dep,v)} onCancel={()=>setModal(null)} th={th} tx={tx}/>}
          {modal==='edit-prod'&&<ModalInput title={tx.editarProd} placeholder={tx.nombre} defaultValue={mData.prod} onConfirm={v=>editarProducto(mData.dep,mData.prod,v)} onCancel={()=>setModal(null)} th={th} tx={tx}/>}
          {modal==='confirm-del-cat'&&<ModalConfirm title={`${tx.eliminar} "${mData.prod}"?`} msg={tx.confirmarEliminarProd} onConfirm={()=>eliminarProductoCat(mData.dep,mData.prod)} onCancel={()=>setModal(null)} th={th} tx={tx}/>}
          {modal==='confirm-del-lista'&&<ModalConfirm title={`${tx.eliminar} ${listSelIds.length} ${tx.productos}?`} msg={tx.confirmarEliminarLista} onConfirm={eliminarSeleccion} onCancel={()=>setModal(null)} th={th} tx={tx}/>}
          {modal==='confirm-borrar-marcados'&&<ModalConfirm title={tx.confirmarBorrarMarcados} onConfirm={borrarMarcados} onCancel={()=>setModal(null)} th={th} tx={tx}/>}
          {modal==='confirm-borrar'&&<ModalConfirm title={tx.borrarLista} msg={tx.confirmarBorrarLista} onConfirm={borrarLista} onCancel={()=>setModal(null)} th={th} tx={tx}/>}
        </div>
      )}

      {modalVerGrupo&&!confirmEliminarMiembro&&!confirmSalirGrupo&&!confirmEliminarGrupo&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:'20px'}} onClick={e=>{if(e.target===e.currentTarget)setModalVerGrupo(null)}}>
          <div style={{background:th.modalBg,borderRadius:'16px',padding:'22px 20px',width:'100%',maxWidth:'340px',maxHeight:'80vh',overflowY:'auto'}}>
            <div style={{fontSize:'16px',fontWeight:'700',color:th.texto,marginBottom:'4px'}}>{modalVerGrupo.nombre}</div>
            <div style={{fontSize:'12px',color:th.textoMuted,marginBottom:'18px'}}>Admin: {modalVerGrupo.adminNombre}</div>
            {modalVerGrupo.adminId===userId&&(
              <div style={{marginBottom:'18px'}}>
                <div style={{fontSize:'12px',fontWeight:'600',color:th.textoSub,marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Invitar al grupo</div>
                <button onClick={generarInvitacion} disabled={cargandoInvitacion} style={{width:'100%',padding:'13px',background:cargandoInvitacion?th.bgStripe:'linear-gradient(135deg,#185FA5,#534AB7)',color:cargandoInvitacion?th.textoMuted:'white',border:'none',borderRadius:'12px',fontSize:'15px',fontWeight:'600',...T}}>{cargandoInvitacion?'Generando link...':'Invitar al grupo'}</button>
                <div style={{fontSize:'11px',color:th.textoMuted,textAlign:'center',marginTop:'8px'}}>Cada link funciona una sola vez.</div>
              </div>
            )}
            <div style={{fontSize:'12px',fontWeight:'600',color:th.textoSub,marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Miembros ({modalVerGrupo.miembros?.length||1})</div>
            {(modalVerGrupo.miembros||[]).map((m,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 0',borderBottom:`0.5px solid ${th.borde}`}}>
                <div style={{width:'32px',height:'32px',borderRadius:'50%',background:th.acento,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',color:'white',fontWeight:'600',flexShrink:0}}>{(m.nombre||'?')[0].toUpperCase()}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'13px',color:th.texto,fontWeight:'500'}}>{m.nombre}{m.uid===userId?' (tú)':''}</div>
                  <div style={{fontSize:'11px',color:th.textoMuted}}>{m.rol==='admin'?'Admin':'Miembro'}</div>
                </div>
                {modalVerGrupo.adminId===userId&&m.uid!==userId&&(
                  <button onClick={()=>setConfirmEliminarMiembro(m)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'12px',color:'#A32D2D',padding:'4px 8px',...T}}>Quitar</button>
                )}
              </div>
            ))}
            <div style={{marginTop:'20px',display:'flex',flexDirection:'column',gap:'10px'}}>
              {modalVerGrupo.adminId!==userId&&<button onClick={()=>setConfirmSalirGrupo(true)} style={{width:'100%',padding:'13px',background:'none',border:'1.5px solid #A32D2D',borderRadius:'12px',fontSize:'15px',fontWeight:'600',color:'#A32D2D',...T}}>Salir del grupo</button>}
              {modalVerGrupo.adminId===userId&&<button onClick={()=>setConfirmEliminarGrupo(true)} style={{width:'100%',padding:'13px',background:'none',border:'1.5px solid #A32D2D',borderRadius:'12px',fontSize:'15px',fontWeight:'600',color:'#A32D2D',...T}}>Eliminar grupo</button>}
              <button onClick={()=>setModalVerGrupo(null)} style={{width:'100%',padding:'11px',background:th.bgStripe,border:`0.5px solid ${th.borde}`,borderRadius:'12px',fontSize:'14px',color:th.textoSub,...T}}>{tx.cerrar}</button>
            </div>
          </div>
        </div>
      )}

      {confirmEliminarMiembro&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:'20px'}}>
          <div style={{background:th.modalBg,borderRadius:'20px',padding:'28px 24px',width:'100%',maxWidth:'320px',textAlign:'center'}}>
            <div style={{fontSize:'16px',fontWeight:'700',color:th.texto,marginBottom:'8px'}}>¿Quitar a {confirmEliminarMiembro.nombre}?</div>
            <div style={{fontSize:'14px',color:th.textoSub,marginBottom:'20px'}}>Se le quitará el acceso al grupo, pero seguirá en Syng.</div>
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={()=>setConfirmEliminarMiembro(null)} style={{flex:1,padding:'12px',background:th.bgStripe,border:'none',borderRadius:'12px',fontSize:'15px',color:th.textoSub,...T}}>{tx.cancelar}</button>
              <button onClick={()=>eliminarMiembro(confirmEliminarMiembro)} style={{flex:1,padding:'12px',background:'#A32D2D',border:'none',borderRadius:'12px',fontSize:'15px',color:'white',fontWeight:'600',...T}}>Quitar</button>
            </div>
          </div>
        </div>
      )}
      {confirmSalirGrupo&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:'20px'}}>
          <div style={{background:th.modalBg,borderRadius:'20px',padding:'28px 24px',width:'100%',maxWidth:'320px',textAlign:'center'}}>
            <div style={{fontSize:'16px',fontWeight:'700',color:th.texto,marginBottom:'8px'}}>¿Salir del grupo?</div>
            <div style={{fontSize:'14px',color:th.textoSub,marginBottom:'20px'}}>Ya no verás esta lista compartida. Tu cuenta en Syng sigue igual.</div>
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={()=>setConfirmSalirGrupo(false)} style={{flex:1,padding:'12px',background:th.bgStripe,border:'none',borderRadius:'12px',fontSize:'15px',color:th.textoSub,...T}}>{tx.cancelar}</button>
              <button onClick={salirDelGrupo} style={{flex:1,padding:'12px',background:'#A32D2D',border:'none',borderRadius:'12px',fontSize:'15px',color:'white',fontWeight:'600',...T}}>Salir</button>
            </div>
          </div>
        </div>
      )}
      {confirmEliminarGrupo&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:'20px'}}>
          <div style={{background:th.modalBg,borderRadius:'20px',padding:'28px 24px',width:'100%',maxWidth:'320px',textAlign:'center'}}>
            <div style={{fontSize:'16px',fontWeight:'700',color:th.texto,marginBottom:'8px'}}>¿Eliminar el grupo "{modalVerGrupo?.nombre}"?</div>
            <div style={{fontSize:'14px',color:th.textoSub,marginBottom:'20px'}}>Se eliminará para todos los miembros. Ellos siguen en Syng.</div>
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={()=>setConfirmEliminarGrupo(false)} style={{flex:1,padding:'12px',background:th.bgStripe,border:'none',borderRadius:'12px',fontSize:'15px',color:th.textoSub,...T}}>{tx.cancelar}</button>
              <button onClick={eliminarGrupo} style={{flex:1,padding:'12px',background:'#A32D2D',border:'none',borderRadius:'12px',fontSize:'15px',color:'white',fontWeight:'600',...T}}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {modalVisitante&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,padding:'24px'}}>
          <div style={{background:th.modalBg,borderRadius:'24px',padding:'32px',maxWidth:'340px',width:'100%',textAlign:'center'}}>
            <div style={{fontSize:'40px',marginBottom:'12px'}}>🎉</div>
            <div style={{fontSize:'19px',fontWeight:'800',color:th.texto,marginBottom:'8px'}}>¡Únete a Syng!</div>
            <div style={{fontSize:'14px',color:th.textoSub,marginBottom:'24px',lineHeight:'1.5'}}>Inicia sesión para agregar productos, crear grupos y compartir tu lista.</div>
            <button onClick={()=>{window.location.href='/'}} style={{width:'100%',padding:'14px',background:'linear-gradient(135deg,#185FA5,#534AB7)',color:'white',border:'none',borderRadius:'14px',fontSize:'16px',fontWeight:'700',cursor:'pointer',marginBottom:'10px'}}>Iniciar sesión</button>
            <button onClick={()=>setModalVisitante(false)} style={{width:'100%',padding:'12px',background:th.bgStripe,color:th.textoSub,border:'none',borderRadius:'14px',fontSize:'15px',cursor:'pointer'}}>Seguir explorando</button>
          </div>
        </div>
      )}
    </div>
  )
}
