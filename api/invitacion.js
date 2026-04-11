export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Sin id' })
  try {
    const pid = 'syng-app'
    const r1 = await fetch(`https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/invitaciones/${id}`)
    if (!r1.ok) return res.status(404).json({ error: 'No encontrada' })
    const j1 = await r1.json()
    if (!j1.fields) return res.status(404).json({ error: 'Sin datos' })
    if (j1.fields.usado?.booleanValue) return res.status(410).json({ error: 'Ya usada' })
    const grupoId = j1.fields.grupoId?.stringValue
    const modulo = j1.fields.modulo?.stringValue
    const r2 = await fetch(`https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/grupos/${grupoId}`)
    if (!r2.ok) return res.status(404).json({ error: 'Grupo no existe' })
    const j2 = await r2.json()
    const fg = j2.fields
    res.json({
      grupoId,
      modulo,
      grupoNombre: fg?.nombre?.stringValue || 'Grupo',
      adminNombre: fg?.adminNombre?.stringValue || 'un administrador'
    })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
}
