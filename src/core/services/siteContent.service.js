export const DEFAULT_LEGEND =
  'Las personas Exitosas cada mañana al despertar lo primero que hacen es agradecer a Dios y después revisan su agenda.'

export const DEFAULT_SITE_CONTENT = {
  legend: DEFAULT_LEGEND,
  fan_hero_title: 'Vive como las personas exitosas',
  fan_hero_subtitle: 'Un ritual de mañana que transforma tu día — y Syng te ayuda a sostenerlo.',
  promociones: [],
}

export function normalizeSiteContent(data) {
  if (!data) return { ...DEFAULT_SITE_CONTENT, promociones: [] }
  return {
    ...DEFAULT_SITE_CONTENT,
    legend: data.legend?.trim() || DEFAULT_LEGEND,
    fan_hero_title: data.fan_hero_title?.trim() || DEFAULT_SITE_CONTENT.fan_hero_title,
    fan_hero_subtitle: data.fan_hero_subtitle?.trim() || DEFAULT_SITE_CONTENT.fan_hero_subtitle,
    promociones: Array.isArray(data.promociones) ? data.promociones : [],
  }
}

export function activePromociones(promociones) {
  return (promociones ?? []).filter(p => p.activa !== false && (p.texto?.trim() || p.titulo?.trim()))
}

export function buildWhatsAppShareUrl({ titulo, texto, url = 'https://syng-psi.vercel.app/fan' }) {
  const body = [titulo, texto, url].filter(Boolean).join('\n\n')
  return `https://wa.me/?text=${encodeURIComponent(body)}`
}
