export const DEFAULT_LEGEND =
  'Las personas Exitosas cada mañana al despertar lo primero que hacen es agradecer a Dios y después revisan su agenda.'

export const FAN_PAGE_URL = 'https://syng-psi.vercel.app/fan'

export const DEFAULT_SHARE_MESSAGE =
  '¿Te gustaría tener más organizado tu día — pendientes, recordatorios, sin mil mensajes de “¿ya lo hiciste?”? Si te hace sentido, échale un ojo:'

export const DEFAULT_SITE_CONTENT = {
  legend: DEFAULT_LEGEND,
  fan_hero_title: 'Vive como las personas exitosas',
  fan_hero_subtitle: 'Un ritual de mañana que transforma tu día — y Syng te ayuda a sostenerlo.',
  share_message: DEFAULT_SHARE_MESSAGE,
  promociones: [],
}

export function normalizeSiteContent(data) {
  if (!data) return { ...DEFAULT_SITE_CONTENT, promociones: [] }
  return {
    ...DEFAULT_SITE_CONTENT,
    legend: data.legend?.trim() || DEFAULT_LEGEND,
    fan_hero_title: data.fan_hero_title?.trim() || DEFAULT_SITE_CONTENT.fan_hero_title,
    fan_hero_subtitle: data.fan_hero_subtitle?.trim() || DEFAULT_SITE_CONTENT.fan_hero_subtitle,
    share_message: data.share_message?.trim() || DEFAULT_SHARE_MESSAGE,
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
