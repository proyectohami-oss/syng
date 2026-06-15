export const RETIRO_MULTIPLO = 500

export function faltanteParaRetiro(disponible) {
  const d = Number(disponible) || 0
  if (d >= RETIRO_MULTIPLO) return 0
  return RETIRO_MULTIPLO - d
}

export function fmtMXN(n) {
  return (n ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function aliadoShareUrl(codigo) {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://syng-psi.vercel.app'
  return `${base}/?aliado=${encodeURIComponent(codigo)}`
}

export function aliadoShareText(codigo, descuentoPct = 10) {
  return `Únete a Syng con mi código ${codigo} y obtén ${descuentoPct}% de descuento en tu primera suscripción. Organiza tu día con calma.`
}
