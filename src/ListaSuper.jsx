import { useState, useRef, useEffect } from 'react'

const SV = '✓'

const DEP_ORDER = [
  'Lácteos','Carnes y embutidos','Frutas y verduras','Abarrotes',
  'Panadería','Bebidas','Limpieza','Higiene personal',
  'Congelados','Snacks y dulces','Artículos de cocina','Bebés','Mascotas','Farmacia básica'
]

const CATALOGO_BASE = {
  'Lácteos': [
    'Crema','Crema ácida','Jocoque','Jocoque seco','Leche condensada','Leche descremada',
    'Leche entera','Leche evaporada','Leche light','Leche sin lactosa','Mantequilla',
    'Mantequilla sin sal','Margarina','Queso amarillo','Queso Chihuahua','Queso cottage',
    'Queso crema','Queso fresco','Queso manchego','Queso Oaxaca','Queso panela',
    'Queso parmesano','Queso ricotta','Requesón','Yogur bebible','Yogur griego',
    'Yogur natural','Yogur sin azúcar','Crema para batir','Leche de almendras'
  ],
  'Carnes y embutidos': [
    'Bistec de res','Carne de cerdo','Carne molida','Carne para asar','Chambarete',
    'Chuleta de cerdo','Chorizo','Costilla de res','Costilla de cerdo','Filete de res',
    'Jamón','Jamón serrano','Lomo de cerdo','Milanesa de res','Milanesa de pollo',
    'Pechuga de pollo','Pierna de pollo','Pollo entero','Salchicha','Salchicha de pavo',
    'Tocino','Atún en lata','Camarón','Filete de pescado','Mariscos','Salami',
    'Mortadela','Pepperoni','Longaniza','Barbacoa'
  ],
  'Frutas y verduras': [
    'Aguacate','Ajo','Apio','Arándanos','Betabel','Brócoli','Calabacita','Calabaza',
    'Cebolla','Cebolla morada','Cebollín','Chile ancho','Chile chipotle','Chile güero',
    'Chile habanero','Chile jalapeño','Chile mulato','Chile pasilla','Chile poblano',
    'Chile serrano','Chícharo','Cilantro','Col','Coliflor','Durazno','Ejote',
    'Elote','Espárrago','Espinaca','Fresa','Granada','Guayaba','Higo','Hongos',
    'Jitomate','Kiwi','Lechuga','Lechuga romanita','Limón','Mandarina','Mango',
    'Manzana','Maracuyá','Melón','Mora','Naranja','Nopales','Papa','Papaya',
    'Pepino','Perejil','Pera','Piña','Pimiento','Plátano','Sandía','Tomate',
    'Tomate cherry','Uvas','Zanahoria','Zucchini','Alcachofa','Camote'
  ],
  'Abarrotes': [
    'Aceite','Aceite de coco','Aceite de oliva','Aceite de oliva extra virgen',
    'Aceitunas','Adobo','Ajo en polvo','Albahaca','Arroz blanco','Arroz integral',
    'Atún','Azúcar','Azúcar mascabado','Bicarbonato','Cajeta','Canela','Chiles en vinagre',
    'Chocolate','Coco rallado','Comino','Consomé de pollo','Crema de cacahuate',
    'Cúrcuma','Curry','Chile en polvo','Extracto de vainilla','Fécula de maíz',
    'Frijol negro','Frijol pinto','Frijol bayo','Gelatina','Granos de café',
    'Harina','Harina integral','Hierbas de olor','Honey','Jamoncillo',
    'Ketchup','Laurel','Lentejas','Levadura','Macarrón','Maicena',
    'Miel de abeja','Miel de maple','Mostaza','Nuez','Orégano',
    'Papel aluminio','Papel encerado','Pasta','Pasta para lasaña','Pepinillos',
    'Pimienta negra','Pimienta blanca','Polvo para hornear','Sal','Sal de mar',
    'Salsa catsup','Salsa inglesa','Salsa picante','Salsa soya','Salsa valentina',
    'Sardina','Sopa de pasta','Sopa de arroz','Sopa instantánea','Splenda',
    'Stevia','Tabasco','Tomillo','Tortillas de harina','Tuna en lata',
    'Vinagre','Vinagre balsámico','Cajeta','Chamoy','Amaranto',
    'Avena','Linaza','Chía','Granola','Cereales','Mermelada',
    'Mantequilla de maní','Nutella','Cajeta de membrillo'
  ],
  'Panadería': [
    'Bagel','Bolillo','Baguette','Croissant','Galletas de avena','Galletas marías',
    'Galletas maravillas','Galletas saladas','Muffin','Pan blanco','Pan de caja integral',
    'Pan de dulce','Pan de hot dog','Pan de hamburguesa','Pan integral','Pan multigrano',
    'Pan pita','Pan sin gluten','Tortillas','Waffles','Donas','Conchas'
  ],
  'Bebidas': [
    'Agua mineral','Agua natural','Agua saborizada','Bebida energética','Bebida isotónica',
    'Café en grano','Café molido','Café soluble','Café descafeinado','Cerveza',
    'Champagne','Chocolate en polvo','Cidra','Clamato','Coctel de frutas',
    'Jamaica','Jugo de manzana','Jugo de naranja','Jugo de uva','Leche de almendras',
    'Leche de coco','Leche de soya','Limonada','Naranjada','Refresco',
    'Sidra','Té verde','Té negro','Té de manzanilla','Tepache',
    'Tonicwater','Vino blanco','Vino rosado','Vino tinto','Vino lambrusco',
    'Whisky','Ron','Vodka','Tequila','Mezcal'
  ],
  'Limpieza': [
    'Ariel','Cloro','Cloro para ropa de color','Desengrasante','Detergente en polvo',
    'Detergente líquido','Escoba','Esponja','Fabuloso','Fibra de acero',
    'Guantes de hule','Jabón de trastes','Jabón de trastes Salvo líquido',
    'Jerga','Limpiador de baño','Limpiador multiusos','Mistol',
    'Multiusos','Papel de cocina','Pinol','Pledger','Roma',
    'Sanitas','Suavitel','Vanish','Vim','Zest',
    'Bolsas de basura','Bolsas ziploc','Rastrillo de piso','Trapeador',
    'Aromatizante','Mata insectos','Raid'
  ],
  'Higiene personal': [
    'Acondicionador','Algodón','Bloqueador solar','Ciertos días','Cepillo de dientes',
    'Condón','Crema corporal','Crema facial','Desodorante','Enjuague bucal',
    'Exfoliante','Gel para cabello','Hilo dental','Jabón de baño',
    'Jabón íntimo','Loción','Mascarilla facial','Máquina de afeitar',
    'Papel higiénico','Pasta dental','Rastrillos','Sérum',
    'Shampoo','Shampoo seco','Tampones','Tónico facial',
    'Toallas húmedas','Toallas sanitarias','Vitaminas','Pañuelos desechables',
    'Talco','Vaselina','Alcohol','Agua oxigenada'
  ],
  'Congelados': [
    'Burrito congelado','Caldo de res congelado','Dedos de pescado',
    'Elote congelado','Empanadas congeladas','Fresas congeladas',
    'Helado','Lasaña congelada','Malteada','Mezcla de vegetales',
    'Nuggets de pollo','Paletas','Papa a la francesa','Pizza congelada',
    'Pollo empanizado','Taquitos congelados','Waffles congelados',
    'Edamame','Mango congelado','Betabel congelado'
  ],
  'Snacks y dulces': [
    'Botana de maíz','Cacahuates','Cajeta','Caramelos','Chicharrón',
    'Chicles','Chocorroles','Chocolates','Doritos','Dulces de tamarindo',
    'Frituras','Gansito','Gomitas','Hot Cheetos','Lunetas',
    'Maíz palomero','Mazapán','Obleas','Palomitas de microondas',
    'Papas fritas','Pasas','Pay de queso','Pelon Pelo Rico',
    'Pistaches','Pretzels','Rielito','Sabritas','Takis',
    'Tostadas','Turrones','Nuez de la India'
  ],
  'Artículos de cocina': [
    'Bolsas de basura','Bolsas para sandwich','Cubiertos desechables',
    'Filtros de café','Foil de aluminio','Horno de microondas',
    'Lavavajillas','Moldes para hornear','Palillos de madera',
    'Papel encerado','Papel para hornear','Platos desechables',
    'Popotes','Porta vasos','Recipientes de plástico',
    'Servilletas','Tazas desechables','Tenedores desechables',
    'Toallas de papel','Vasos desechables','Palillos de dientes',
    'Hilo cáñamo','Cuchillos desechables'
  ],
  'Bebés': [
    'Biberón','Chupón','Crema para rozaduras','Formula láctea',
    'Jabón para bebé','Jugo para bebé','Leche de fórmula',
    'Pañales','Pañitos húmedos','Papilla de frutas',
    'Papilla de verduras','Pasta dental para bebé','Polvo para bebé',
    'Ropa interior','Shampoo para bebé','Silla para auto',
    'Talco para bebé','Termómetro','Ungüento','Vitaminas para bebé'
  ],
  'Mascotas': [
    'Alimento para gato','Alimento para perro','Arena para gato',
    'Cama para mascota','Collar antipulgas','Correa',
    'Galletas para perro','Juguete para gato','Juguete para perro',
    'Medicamento antipulgas','Ropa para mascota','Shampoo para mascotas',
    'Snack para gato','Snack para perro','Vitaminas para mascotas',
    'Bebedero','Comedero','Jaula'
  ],
  'Farmacia básica': [
    'Alcohol','Agua oxigenada','Antigripal','Antiácido',
    'Aspirina','Benzal','Crema antibiótica','Gasas',
    'Ibuprofeno','Loperamida','Omeprazol','Paracetamol',
    'Pastillas para la tos','Pomada','Suero oral',
    'Termómetro','Tiritas','Vitamina C',
    'Vitamina D','Zinc'
  ]
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
  const [seleccionados, setSeleccionados] = useState(() => { try { return JSON.parse(localStorage.getItem('syng_super_seleccionados') || '{}') } catch { return {} } })
  const [customProds, setCustomProds] = useState(() => { try { return JSON.parse(localStorage.getItem('syng_super_custom') || '{}') } catch { return {} } })
  const [tab, setTab] = useState('cat')
  const [listSelMode, setListSelMode] = useState(false)
  const [listSelIds, setListSelIds] = useState([])
  const [filtroCat, setFiltroCat] = useState('')
  const [filtroList, setFiltroList] = useState('')
  const [modal, setModal] = useState(null)
  const [mData, setMData] = useState({})

  // Guardar en localStorage cuando cambien
  useEffect(() => { localStorage.setItem('syng_super_seleccionados', JSON.stringify(seleccionados)) }, [seleccionados])
  useEffect(() => { localStorage.setItem('syng_super_custom', JSON.stringify(customProds)) }, [customProds])

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
  }

  function borrarLista() {
    setSeleccionados({})
    setListSelIds([])
    setListSelMode(false)
    setModal(null)
  }

  function borrarMarcados() {
    setSeleccionados(prev => {
      const next = {}
      Object.entries(prev).forEach(([k, v]) => { if (!v.done) next[k] = v })
      return next
    })
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
        <button onClick={onVolver} style={{ display:'none' }}>
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
                      <div style={{ flex: 1, fontSize: '13px', color: isSel ? '#0C447C' : '#2C2C2A', fontWeight: isSel ? '500' : '400', textAlign: 'left' }}>{p}</div>
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
            <div style={{ padding: '10px 14px', borderTop: '0.5px solid #e5e5e5', display:'flex', gap:'8px' }}>
              <button onClick={() => setModal('confirm-borrar-marcados')}
                style={{ flex:1, padding: '10px', border: '0.5px solid #A32D2D', borderRadius: '9px', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#A32D2D', fontFamily: 'inherit', fontWeight: '500' }}>
                Borrar marcados
              </button>
              <button onClick={() => setModal('confirm-borrar')}
                style={{ flex:1, padding: '10px', border: '0.5px solid #A32D2D', borderRadius: '9px', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#A32D2D', fontFamily: 'inherit', fontWeight: '500' }}>
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
          {modal === 'confirm-borrar-marcados' &&
        <ModalConfirm
          title="¿Borrar marcados?"
          onConfirm={borrarMarcados}
          onCancel={() => setModal(null)}
        />
      }
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
