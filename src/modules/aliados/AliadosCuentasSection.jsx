import { useMemo, useState, useEffect } from 'react'
import { updateAliadoCuentas, datosFiscalesCompletos } from '../../core/services/promotores.service'
import { A, L } from '../../shared/agendaEditorial'
import { showToast } from '../../shared/Toast'

const MAX_CUENTAS = 3
const emptyCuenta = () => ({ id: crypto.randomUUID(), titular: '', banco: '', clabe: '', predeterminada: false })

function maskClabe(clabe) {
  const c = String(clabe || '').replace(/\s/g, '')
  if (c.length !== 18) return c
  return `${c.slice(0, 6)}••••••${c.slice(12)}`
}

export function AliadosCuentasSection({ aliado, userName }) {
  const initial = useMemo(() => {
    const cuentas = (aliado?.cuentas_bancarias || []).map(c => ({ ...c }))
    const fiscal = aliado?.datos_fiscales || {}
    return {
      cuentas: cuentas.length ? cuentas : [],
      rfc: fiscal.rfc || '',
      razon: fiscal.razon_social || '',
    }
  }, [aliado?.id, aliado?.cuentas_bancarias, aliado?.datos_fiscales])

  const [cuentas, setCuentas] = useState(initial.cuentas)
  const [rfc, setRfc] = useState(initial.rfc)
  const [razon, setRazon] = useState(initial.razon)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(!(aliado?.cuentas_bancarias?.length))

  useEffect(() => {
    if (editing) return
    setCuentas(initial.cuentas)
    setRfc(initial.rfc)
    setRazon(initial.razon)
  }, [initial, editing])

  useEffect(() => {
    if (editing && !cuentas.length) {
      setCuentas([emptyCuenta()])
    }
  }, [editing, cuentas.length])

  const fiscalOk = datosFiscalesCompletos({ rfc, razon_social: razon })

  function addCuenta() {
    if (cuentas.length >= MAX_CUENTAS) return
    setCuentas(prev => [...prev, { ...emptyCuenta(), predeterminada: prev.length === 0 }])
    setEditing(true)
  }

  function updateCuenta(id, patch) {
    setCuentas(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)))
  }

  function setDefault(id) {
    setCuentas(prev => prev.map(c => ({ ...c, predeterminada: c.id === id })))
  }

  function removeCuenta(id) {
    setCuentas(prev => {
      const next = prev.filter(c => c.id !== id)
      if (next.length && !next.some(c => c.predeterminada)) next[0].predeterminada = true
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await updateAliadoCuentas({
        cuentas_bancarias: cuentas.map(c => ({
          ...c,
          titular: c.titular.trim() || userName || '',
          clabe: c.clabe.replace(/\s/g, ''),
        })),
        datos_fiscales: { rfc: rfc.trim().toUpperCase(), razon_social: razon.trim() },
      })
      showToast('Datos guardados', '✓')
      setEditing(false)
    } catch (e) {
      setError(e.message || 'No se pudieron guardar los datos')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={A.section}>
      <p style={A.sectionLabel}>Mis cuentas y datos fiscales</p>
      <div style={{ padding: '12px 16px 16px' }}>
        {!editing && cuentas.length > 0 ? (
          <>
            {cuentas.map(c => (
              <div key={c.id} style={{
                padding: '12px 0',
                borderBottom: `1px solid ${L.champagneBorder}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, color: L.ivory }}>{c.titular}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: L.ivoryMuted }}>
                      {c.banco} · {maskClabe(c.clabe)}
                    </p>
                  </div>
                  {c.predeterminada && (
                    <span style={{
                      fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: L.champagne, alignSelf: 'flex-start',
                    }}>
                      Predeterminada
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div style={{ paddingTop: 12 }}>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: L.ivoryMuted }}>RFC</p>
              <p style={{ margin: 0, fontSize: 14, color: L.ivory }}>{rfc || '—'}</p>
              <p style={{ margin: '10px 0 4px', fontSize: 12, color: L.ivoryMuted }}>Razón social</p>
              <p style={{ margin: 0, fontSize: 14, color: L.ivory }}>{razon || '—'}</p>
              {!fiscalOk && (
                <p style={{ margin: '10px 0 0', fontSize: 12, color: '#E8A838' }}>
                  Completa RFC y razón social antes de tu primer retiro.
                </p>
              )}
            </div>
            <button type="button" onClick={() => setEditing(true)} style={{ ...A.btnSecondary, marginTop: 14, width: '100%' }}>
              Editar
            </button>
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: L.ivoryMuted, lineHeight: 1.5 }}>
              Agrega hasta {MAX_CUENTAS} cuentas CLABE. Los retiros se depositan en la cuenta predeterminada.
            </p>

            {cuentas.map((c, idx) => (
              <div key={c.id} style={{
                marginBottom: 14, padding: '12px 12px 14px',
                background: 'rgba(196,169,98,0.04)',
                border: `1px solid ${L.champagneBorder}`,
                borderRadius: 2,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: L.champagne, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Cuenta {idx + 1}
                  </span>
                  {cuentas.length > 1 && (
                    <button type="button" onClick={() => removeCuenta(c.id)} style={{
                      background: 'none', border: 'none', color: '#E05252', fontSize: 11, cursor: 'pointer',
                    }}>
                      Quitar
                    </button>
                  )}
                </div>
                <input
                  value={c.titular}
                  onChange={e => updateCuenta(c.id, { titular: e.target.value })}
                  placeholder="Titular de la cuenta"
                  style={{ ...A.input, marginBottom: 8 }}
                />
                <input
                  value={c.banco}
                  onChange={e => updateCuenta(c.id, { banco: e.target.value })}
                  placeholder="Banco"
                  style={{ ...A.input, marginBottom: 8 }}
                />
                <input
                  value={c.clabe}
                  onChange={e => updateCuenta(c.id, { clabe: e.target.value.replace(/\D/g, '').slice(0, 18) })}
                  placeholder="CLABE (18 dígitos)"
                  inputMode="numeric"
                  style={{ ...A.input, marginBottom: 8, fontFamily: 'monospace' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: L.ivoryMuted, cursor: 'pointer' }}>
                  <input type="radio" checked={c.predeterminada} onChange={() => setDefault(c.id)} />
                  Usar para retiros
                </label>
              </div>
            ))}

            {cuentas.length < MAX_CUENTAS && (
              <button type="button" onClick={addCuenta} style={{ ...A.btnSecondary, width: '100%', marginBottom: 16 }}>
                + Agregar cuenta
              </button>
            )}

            <p style={{ margin: '0 0 8px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: L.champagne }}>
              Datos fiscales
            </p>
            <input
              value={rfc}
              onChange={e => setRfc(e.target.value.toUpperCase())}
              placeholder="RFC"
              style={{ ...A.input, marginBottom: 8 }}
            />
            <input
              value={razon}
              onChange={e => setRazon(e.target.value)}
              placeholder="Razón social o nombre fiscal"
              style={{ ...A.input, marginBottom: 12 }}
            />

            <button type="button" onClick={handleSave} disabled={saving} style={{ ...A.btnPrimary, width: '100%' }}>
              {saving ? 'Guardando…' : 'Guardar datos'}
            </button>
          </>
        )}

        {error && (
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#E05252' }}>{error}</p>
        )}
      </div>
    </div>
  )
}
