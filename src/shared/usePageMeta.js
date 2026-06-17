import { useEffect } from 'react'

const SITE = 'https://syng-psi.vercel.app'

function upsertMeta(attr, key, content) {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel, href) {
  if (!href) return
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function removeJsonLd(id) {
  document.getElementById(id)?.remove()
}

/** Título, descripción y canonical por ruta pública (SEO). */
export function usePageMeta({ title, description, path, jsonLd, jsonLdId = 'syng-page-jsonld' }) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title
    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    if (path) {
      const url = `${SITE}${path}`
      upsertLink('canonical', url)
      upsertMeta('property', 'og:url', url)
    }
    if (jsonLd) {
      removeJsonLd(jsonLdId)
      const script = document.createElement('script')
      script.id = jsonLdId
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }
    return () => {
      document.title = prevTitle
      removeJsonLd(jsonLdId)
    }
  }, [title, description, path, jsonLd, jsonLdId])
}
