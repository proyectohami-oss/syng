
export const IDIOMAS = {
  es: { codigo:'es', nombre:'Español', bandera:'🇲🇽', voz:'es-MX' },
  en: { codigo:'en', nombre:'English', bandera:'🇺🇸', voz:'en-US' },
  fr: { codigo:'fr', nombre:'Français', bandera:'🇫🇷', voz:'fr-FR' },
  de: { codigo:'de', nombre:'Deutsch', bandera:'🇩🇪', voz:'de-DE' },
  it: { codigo:'it', nombre:'Italiano', bandera:'🇮🇹', voz:'it-IT' },
  pt: { codigo:'pt', nombre:'Português', bandera:'🇧🇷', voz:'pt-BR' },
  ja: { codigo:'ja', nombre:'日本語', bandera:'🇯🇵', voz:'ja-JP' },
  zh: { codigo:'zh', nombre:'中文', bandera:'🇨🇳', voz:'zh-CN' },
}
export function getTextos(cod='es') { return IDIOMAS[cod] || IDIOMAS.es }
export function getVoz(cod='es') { return IDIOMAS[cod]?.voz || 'es-MX' }
export const LISTA_IDIOMAS = Object.values(IDIOMAS)
