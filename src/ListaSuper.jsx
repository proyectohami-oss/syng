import { useState, useRef, useEffect } from 'react'

const SV = '✓'

const DEP_ORDER = [
  'Lácteos','Carnes y embutidos','Frutas y verduras','Abarrotes',
  'Panadería','Bebidas','Limpieza','Higiene personal'
]

const CATALOGO_BASE = {
  'Lácteos': ['Crema','Jocoque','Leche entera','Leche light','Mantequilla','Queso manchego','Queso Oaxaca','Yogur natural'],
  'Carnes y embutidos': ['Bistec de res','Carne molida','Chorizo','Jamón','Pechuga de pollo','Pollo entero','Salchicha','Tocino'],
  'Frutas y verduras': ['Aguacate','Ajo','Cebolla','Chile serrano','Lechuga','Limón','Manzana','Naranja','Papa','Plátano','Tomate','Zanahoria'],
  'Abarrotes': ['Aceite','Aceite de oliva','Arroz blanco','Atún','Azúcar','Frijol negro','Frijol pinto','Harina','Mayonesa','Pasta','Pasta para lasaña','Sal','Salsa','Sardina'],
  'Panadería': ['Bolillo','Galletas marías','Galletas maravillas','Pan blanco','Pan integral','Tortillas'],
  'Bebidas': ['Agua natural','Café en grano','Café molido','Café soluble','Jugo de naranja','Leche de soya','Refresco'],
  'Limpieza': ['Cloro','Detergente','Fabuloso','Jabón de trastes Salvo','Jerga','Multiusos','Pinol','Suavitel','Vanish'],
  'Higiene personal': ['Desodorante','Jabón de baño','Papel higiénico','Pasta dental','Shampoo']
}

const GRUPO_COLORS = ['#5DCAA5','#378ADD','#D85A30','#7F77DD','#1D9E75','#BA7517']

function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function fuzzyMatch(query, text) {
  const q = norm(query), t = norm(text)
  if (t.includes(q)) return true
  if (q.length < 3) return false
  return t.split(' ').some(w => {
    if (Math.abs(w.length - q.length) > 2) return false
    let errors = 0
    const len = Math.max(w.length, q.length)
    for (let i = 0; i < len; i++) {
      if (w[i] !== q[i]) errors++
    }
    return errors <= Math.floor(q.length / 3) + 1
  })
}

function generarId() { return Math.random().toString(36).substr(2, 9) }

// ── Componente principal ──────────────────────────────────────
export default function ListaSuper({ onVolver }) {
  const [grupos, setGrupos] = useState([
    { id: 'familia', nombre: 'Familia', color: '#5DCAA5', miembros: ['Tú', 'Mamá', 'Papá'] }
  ])
  const [grupoActivo, setGrupoActivo] = useState(0)
  const [seleccionados, setSeleccionados] = useState({}) // { producto: { qty, done, dep } }
  const [customProds, setCustomProds] = useState({})     // { dep: [prod, ...] }
  const [tab, setTab] = useState('cat')
  const [listSelMode, setListSelMode] = useState(false)
  const [listSelIds, setListSelIds] = useState([])
  const [filtroCat, setFiltroCat] = useState('')
  const [filtroList, setFiltroList] = useState('')
  const [modal, setModal] = useState(null)
  const [mData, setMData] = useState({})

  const catInputRef = useRef(null)
  const listInputRef = useRef(null)

  // Mantener foco en el input al filtrar
  useEffect(() => { if (tab === 'cat' && filtroCat) catInputRef.current?.focus() }, [filtroCat])
  useEffect(() => { if (tab === 'list' && filtroList) listInputRef.current?.focus() }, [filtroList])

  // Catálogo completo ordenado alfabéticamente
  function getTodo() {
    const todo = {}
    DEP_ORDER.forEach(dep => {
      const base = CATALOGO_BASE[dep] || []
      const custom = customProds[dep] || []
      todo[dep] = [...new Set([...base, ...custom])].sort((a, b) =>
        a.localeCompare(b, 'es', { sensitivity: 'base' })
      )
    })
    return todo
  }

  function toggleProd(p, dep) {
    setSeleccionados(prev => {
      const next = { ...prev }
      if (next[p]) delete next[p]
      else next[p] = { qty: 1, done: false, dep }
      return next
    })
  }

  function cambiarQty(p, delta) {
    setSeleccionados(prev => ({
      ...prev,
      [p]: { ...prev[p], qty: Math.max(1, (prev[p]?.qty || 1) + delta)
      }
    }))
  }

  function toggleDone(p) {
    setSeleccionados(prev => ({
      ...prev,
      [p]: { ...prev[p], done: !prev[p].done }
    }))
  }

  function toggleListSel(p) {
    setListSelIds(prev =>
      prev.includes(p) ? prev.filter(i => i !== p) : [...prev, p]
    )
  }

  function eliminarSeleccion() {
    setSeleccionados(prev => {
      const next = { ...prev }
      listSelIds.forEach(p => delete next[p])
      return next
    })
    setListSelIds([])
    setListSelMode(false)
    setModal(null)
  }

  function borrarLista() {
    setSeleccionados({})
    setListSelIds([])
    setListSelMode(false)
    setModal(null)
  }

  function agregarProducto(dep, nombre) {
    setCustomProds(prev => {
      const arr = [...(prev[dep] || []), nombre]
      return { ...prev, [dep]: arr }
    })
    setModal(null)
  }

  function editarProducto(dep, viejo, nuevo) {
    setCustomProds(prev => {
      const arr = (prev[dep] || []).map(p => p === viejo ? nuevo : p)
      return { ...prev, [dep]: arr }
    })
    setSeleccionados(prev => {
      if (!prev[viejo]) return prev
      const next = { ...prev, [nuevo]: prev[viejo] }
      delete next[viejo]
      return next
    })
    setModal(null)
  }

  function eliminarProductoCat(dep, prod) {
    setCustomProds(prev => ({
      ...prev,
      [dep]: (prev[dep] || []).filter(p => p !== prod)
    }))
    setSeleccionados(prev => {
      const next = { ...prev }
      delete next[prod]
      return next
    })
    setModal(null)
  }

  function crearGrupo(nombre) {
    const color = GRUPO_COLORS[grupos.length % GRUPO_COLORS.length]
    setGrupos(prev => [...prev, { id: generarId(), nombre, color, miembros: ['Tú'] }])
    setGrupoActivo(grupos.length)
    setSeleccionados({})
    setModal(null)
  }

  function cambiarGrupo(i) {
    setGrupoActivo(i)
    setSeleccionados({})
    setModal(null)
  }

  const nSel = Object.keys(seleccionados).length
  const todo = getTodo()
  const g = grupos[grupoActivo]

  const inp = {
    width: '100%', padding: '7px 11px',
    border: '0.5px solid #e5e5e5', borderRadius: '8px',
    fontSize: '13px', outline: 'none',
    fontFamily: 'inherit', background: '#FAFAFA', color: '#2C2C2A',
    boxSizing: 'border-box'
  }

  const saveBtn = ok => ({
    width: '100%', padding: '12px', background: ok ? '#185FA5' : '#e5e5e5',
    color: ok ? 'white' : '#aaa', border: 'none', borderRadius: '12px',
    fontSize: '14px', fontWeight: '500', cursor: ok ? 'pointer' : 'default'
  })

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#185FA5', padding: '12px 16px 0' }}>
        <button onClick={onVolver} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '20px', padding: '4px 11px', cursor: 'pointer', fontSize: '12px', marginBottom: '8px', display: 'inline-block' }}>
          ‹ Atras
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '19px', fontWeight: '500', color: 'white' }}>Lista del Súper</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', marginTop: '1px' }}>
              {nSel} producto{nSel !== 1 ? 's' : ''} en lista
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '26px', fontWeight: '500', color: 'white', lineHeight: 1 }}>{nSel}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>productos</div>
          </div>
        </div>
      </div>

      {/* Barra de grupo */}
      <div style={{ background: '#0C447C', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={() => setModal('grupos')}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'inherit' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: g.color, flexShrink: 0 }} />
          <span style={{ fontWeight: '500' }}>{g.nombre}</span>
          <span style={{ opacity: .6, fontSize: '10px' }}>▾</span>
        </button>
        <button onClick={() => setModal('nuevo-grupo')}
          style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
          + Nuevo grupo
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#0C447C', borderTop: '0.5px solid rgba(255,255,255,0.1)' }}>
        {['cat', 'list'].map(t => (
          <div key={t} onClick={() => { setTab(t); setListSelMode(false); setListSelIds([]) }}
            style={{ flex: 1, padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: '500', cursor: 'pointer', borderBottom: tab === t ? '2px solid white' : '2px solid transparent', color: tab === t ? 'white' : 'rgba(255,255,255,0.5)', position: 'relative' }}>
            {t === 'cat' ? 'Catálogo' : 'Mi lista'}
            {t === 'list' && nSel > 0 && (
              <span style={{ position: 'absolute', top: '5px', right: '10px', background: '#E24B4A', color: 'white', borderRadius: '10px', fontSize: '9px', fontWeight: '700', padding: '1px 5px' }}>{nSel}</span>
            )}
          </div>
        ))}
      </div>

      {/* ── CATÁLOGO ── */}
      {tab === 'cat' && (
        <div>
          <div style={{ padding: '8px 12px', background: '#F5F5F7', borderBottom: '0.5px solid #e5e5e5' }}>
            <input ref={catInputRef} value={filtroCat} onChange={e => setFiltroCat(e.target.value)}
              placeholder="Buscar en Syng..." style={inp} />
          </div>

          {DEP_ORDER.map(dep => {
            const prods = filtroCat
              ? todo[dep].filter(p => fuzzyMatch(filtroCat, p))
              : todo[dep]
            if (!prods.length) return null
            return (
              <div key={dep}>
                <div style={{ fontSize: '9px', fontWeight: '500', color: '#aaa', letterSpacing: '.08em', textTransform: 'uppercase', padding: '7px 14px 3px', background: '#F5F5F7', borderBottom: '0.5px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {dep}
                  <button onClick={() => { setMData({ dep }); setModal('add-prod') }}
                    style={{ fontSize: '10px', color: '#185FA5', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    + agregar
                  </button>
                </div>
                {prods.map(p => {
                  const isSel = !!seleccionados[p]
                  const isCustom = !!(customProds[dep]?.includes(p))
                  const qty = seleccionados[p]?.qty || 1
                  return (
                    <div key={p} onClick={() => toggleProd(p, dep)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderBottom: '0.5px solid #EBEBEB', background: isSel ? '#E6F1FB' : 'white', cursor: 'pointer', borderLeft: isCustom ? '3px solid #378ADD' : 'none' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '5px', border: isSel ? 'none' : '1.5px solid #ccc', background: isSel ? '#185FA5' : 'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'white', transition: 'all .15s' }}>
                        {isSel ? '✓' : ''}
                      </div>
                      <div style={{ flex: 1, fontSize: '13px', color: isSel ? '#0C447C' : '#2C2C2A', fontWeight: isSel ? '500' : '400' }}>{p}</div>
                      {isSel && (
                        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button onClick={() => cambiarQty(p, -1)} style={{ width: '26px', height: '26px', borderRadius: '5px', background: '#B5D4F4', border: '0.5px solid #85B7EB', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0C447C' }}>−</button>
                          <span style={{ fontSize: '13px', fontWeight: '500', minWidth: '20px', textAlign: 'center', color: '#0C447C' }}>{qty}</span>
                          <button onClick={() => cambiarQty(p, 1)} style={{ width: '26px', height: '26px', borderRadius: '5px', background: '#B5D4F4', border: '0.5px solid #85B7EB', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0C447C' }}>+</button>
                        </div>
                      )}
                      {isCustom && (
                        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '3px' }}>
                          <button onClick={() => { setMData({ prod: p, dep }); setModal('edit-prod') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#888', padding: '2px 5px' }}>✎</button>
                          <button onClick={() => { setMData({ prod: p, dep }); setModal('confirm-del-cat') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#A32D2D', padding: '2px 5px' }}>✕</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}

          {filtroCat && DEP_ORDER.every(dep => !todo[dep].some(p => fuzzyMatch(filtroCat, p))) && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#bbb', fontSize: '13px' }}>
              Sin resultados para "{filtroCat}"
            </div>
          )}
        </div>
      )}

      {/* ── MI LISTA ── */}
      {tab === 'list' && (
        <div>
          <div style={{ padding: '8px 12px', background: '#F5F5F7', borderBottom: '0.5px solid #e5e5e5' }}>
            <input ref={listInputRef} value={filtroList} onChange={e => setFiltroList(e.target.value)}
              placeholder="Buscar en Syng..." style={inp} />
          </div>

          {listSelMode ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', background: '#E6F1FB', borderBottom: '0.5px solid #B5D4F4' }}>
              <span style={{ fontSize: '12px', color: '#0C447C' }}>{listSelIds.length} seleccionado{listSelIds.length !== 1 ? 's' : ''}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => { setListSelMode(false); setListSelIds([]) }} style={{ background: 'none', border: 'none', color: '#0C447C', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button onClick={() => setModal('confirm-del-lista')} style={{ background: 'none', border: '1px solid #A32D2D', color: '#A32D2D', fontSize: '11px', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>Eliminar</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '6px 14px', background: '#F5F5F7', borderBottom: '0.5px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#bbb' }}>Toca el círculo o el texto para marcar como jalado</span>
              <button onClick={() => setListSelMode(true)} style={{ fontSize: '11px', color: '#185FA5', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>Seleccionar</button>
            </div>
          )}

          {nSel === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: '#bbb', fontSize: '13px' }}>
              Selecciona productos del catálogo para armar tu lista
            </div>
          ) : (
            DEP_ORDER.map(dep => {
              const items = Object.entries(seleccionados)
                .filter(([p, d]) => d.dep === dep && (!filtroList || fuzzyMatch(filtroList, p)))
                .sort((a, b) => a[0].localeCompare(b[0], 'es', { sensitivity: 'base' }))
              if (!items.length) return null
              return (
                <div key={dep}>
                  <div style={{ fontSize: '9px', fontWeight: '500', color: '#aaa', letterSpacing: '.08em', textTransform: 'uppercase', padding: '7px 14px 3px', background: '#F5F5F7', borderBottom: '0.5px solid #e5e5e5' }}>{dep}</div>
                  {items.map(([p, d]) => {
                    const isSel = listSelIds.includes(p)
                    return (
                      <div key={p} onClick={() => listSelMode ? toggleListSel(p) : toggleDone(p)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderBottom: '0.5px solid #EBEBEB', background: d.done ? '#F5F5F7' : 'white', cursor: 'pointer' }}>
                        {listSelMode ? (
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: isSel ? 'none' : '1.5px solid #ccc', background: isSel ? '#185FA5' : 'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'white' }}>
                            {isSel ? '✓' : ''}
                          </div>
                        ) : (
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: d.done ? 'none' : '1.5px solid #ccc', background: d.done ? '#3B6D11' : 'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'white', transition: 'all .15s' }}>
                            {d.done ? '✓' : ''}
                          </div>
                        )}
                        <div style={{ flex: 1, fontSize: '13px', color: d.done ? '#aaa' : '#2C2C2A', textDecoration: d.done ? 'line-through' : 'none' }}>{p}</div>
                        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button onClick={() => cambiarQty(p, -1)} style={{ width: '26px', height: '26px', borderRadius: '5px', background: '#F5F5F7', border: '0.5px solid #e5e5e5', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2C2C2A' }}>−</button>
                          <span style={{ fontSize: '13px', fontWeight: '500', minWidth: '20px', textAlign: 'center' }}>{d.qty}</span>
                          <button onClick={() => cambiarQty(p, 1)} style={{ width: '26px', height: '26px', borderRadius: '5px', background: '#F5F5F7', border: '0.5px solid #e5e5e5', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2C2C2A' }}>+</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })
          )}

          {nSel > 0 && (
            <div style={{ padding: '10px 14px', borderTop: '0.5px solid #e5e5e5' }}>
              <button onClick={() => setModal('confirm-borrar')}
                style={{ width: '100%', padding: '10px', border: '0.5px solid #A32D2D', borderRadius: '9px', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#A32D2D', fontFamily: 'inherit', fontWeight: '500' }}>
                Borrar lista
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MODALES ── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>

          {/* Lista de grupos */}
          {modal === 'grupos' && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '22px 20px', width: '100%', maxWidth: '340px' }}>
              <div style={{ fontSize: '15px', fontWeight: '500', color: '#2C2C2A', marginBottom: '14px' }}>Mis grupos</div>
              {grupos.map((gr, i) => (
                <div key={gr.id} onClick={() => cambiarGrupo(i)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '0.5px solid #EBEBEB', cursor: 'pointer' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: gr.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: '14px', color: '#2C2C2A' }}>{gr.nombre}{i === grupoActivo ? ' ✓' : ''}</div>
                  <div style={{ fontSize: '11px', color: '#bbb' }}>{gr.miembros.length} integrantes</div>
                </div>
              ))}
              <button onClick={() => setModal(null)} style={{ width: '100%', padding: '10px', marginTop: '12px', borderRadius: '10px', background: '#F5F5F7', border: '0.5px solid #e5e5e5', cursor: 'pointer', fontSize: '13px', color: '#888', fontFamily: 'inherit' }}>Cerrar</button>
            </div>
          )}

          {/* Nuevo grupo */}
          {modal === 'nuevo-grupo' && <ModalInput title="Nuevo grupo" placeholder="Nombre del grupo (ej. Amigos)" onConfirm={v => crearGrupo(v)} onCancel={() => setModal(null)} />}

          {/* Agregar producto */}
          {modal === 'add-prod' && <ModalInput title={`Agregar a ${mData.dep}`} placeholder="Nombre del producto" onConfirm={v => agregarProducto(mData.dep, v)} onCancel={() => setModal(null)} />}

          {/* Editar producto */}
          {modal === 'edit-prod' && <ModalInput title="Editar producto" placeholder="Nombre" defaultValue={mData.prod} onConfirm={v => editarProducto(mData.dep, mData.prod, v)} onCancel={() => setModal(null)} />}

          {/* Confirmación eliminar producto del catálogo */}
          {modal === 'confirm-del-cat' && (
            <ModalConfirm
              title={`¿Eliminar "${mData.prod}"?`}
              msg="Este producto se eliminará de tu catálogo personal."
              onConfirm={() => eliminarProductoCat(mData.dep, mData.prod)}
              onCancel={() => setModal(null)}
            />
          )}

          {/* Confirmación eliminar de lista */}
          {modal === 'confirm-del-lista' && (
            <ModalConfirm
              title={`¿Eliminar ${listSelIds.length} producto${listSelIds.length !== 1 ? 's' : ''}?`}
              msg="Se quitarán de tu lista actual."
              onConfirm={eliminarSeleccion}
              onCancel={() => setModal(null)}
            />
          )}

          {/* Confirmación borrar lista */}
          {modal === 'confirm-borrar' && (
            <ModalConfirm
              title="¿Borrar lista?"
              msg="Se eliminarán todos los productos de tu lista actual."
              onConfirm={borrarLista}
              onCancel={() => setModal(null)}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── Componentes auxiliares ──────────────────────────────────────
function ModalInput({ title, placeholder, defaultValue = '', onConfirm, onCancel }) {
  const [val, setVal] = useState(defaultValue)
  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '22px 20px', width: '100%', maxWidth: '340px' }}>
      <div style={{ fontSize: '15px', fontWeight: '500', color: '#2C2C2A', marginBottom: '14px' }}>{title}</div>
      <input autoFocus value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && val.trim() && onConfirm(val.trim())}
        placeholder={placeholder}
        style={{ width: '100%', padding: '9px 11px', border: '0.5px solid #e5e5e5', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', color: '#2C2C2A', background: '#FAFAFA', marginBottom: '12px', boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: '#F5F5F7', border: '0.5px solid #e5e5e5', cursor: 'pointer', fontSize: '13px', color: '#888', fontFamily: 'inherit' }}>Cancelar</button>
        <button onClick={() => val.trim() && onConfirm(val.trim())} disabled={!val.trim()}
          style={{ flex: 1, padding: '10px', borderRadius: '10px', background: val.trim() ? '#185FA5' : '#e5e5e5', border: 'none', cursor: val.trim() ? 'pointer' : 'default', fontSize: '13px', color: val.trim() ? 'white' : '#aaa', fontWeight: '500', fontFamily: 'inherit' }}>
          Guardar
        </button>
      </div>
    </div>
  )
}

function ModalConfirm({ title, msg, onConfirm, onCancel }) {
  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '22px 20px', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
      <div style={{ fontSize: '15px', fontWeight: '500', color: '#2C2C2A', marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '13px', color: '#888', marginBottom: '22px', lineHeight: '1.5' }}>{msg}</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: '10px', background: '#F5F5F7', border: '0.5px solid #e5e5e5', cursor: 'pointer', fontSize: '13px', color: '#888', fontFamily: 'inherit' }}>Cancelar</button>
        <button onClick={onConfirm} style={{ flex: 1, padding: '11px', borderRadius: '10px', background: '#A32D2D', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'white', fontWeight: '500', fontFamily: 'inherit' }}>Eliminar</button>
      </div>
    </div>
  )
}
