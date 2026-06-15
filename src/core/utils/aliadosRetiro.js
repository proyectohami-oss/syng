export const RETIRO_MULTIPLO = 500

export function faltanteParaRetiro(disponible) {
  const d = Number(disponible) || 0
  if (d >= RETIRO_MULTIPLO) return 0
  return RETIRO_MULTIPLO - d
}

export function fmtMXN(n) {
  return (n ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function esMultiploRetiro(monto) {
  const m = Number(monto)
  return Number.isFinite(m) && m >= RETIRO_MULTIPLO && m % RETIRO_MULTIPLO === 0
}

export function montosPagoPermitidos(disponible) {
  const max = Math.floor((Number(disponible) || 0) / RETIRO_MULTIPLO) * RETIRO_MULTIPLO
  const montos = []
  for (let m = RETIRO_MULTIPLO; m <= max; m += RETIRO_MULTIPLO) {
    montos.push(m)
  }
  return montos
}

export function aliadoShareUrl(codigo) {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://syng-psi.vercel.app'
  return `${base}/?aliado=${encodeURIComponent(codigo)}`
}

export function aliadoShareText(codigo, descuentoPct = 10) {
  return `Únete a Syng con mi código ${codigo} y obtén ${descuentoPct}% de descuento en tu primera suscripción. Organiza tu día con calma.`
}
