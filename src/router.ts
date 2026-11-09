import { useSyncExternalStore } from 'react'

const patterns = {
  accueil: '/',
  bienvenue: '/bienvenue',
  examen: '/examen',
  resultats: '/resultats/:id',
  correction: '/correction/:id',
  lecons: '/lecons',
  theme: '/lecons/:theme',
  lecon: '/lecon/:theme/:slug',
  cartes: '/cartes',
  progres: '/progres',
  reglages: '/reglages',
} as const

export type RouteName = keyof typeof patterns
export type Route = { name: RouteName; params: Record<string, string> }

/** Query parameters (`#/cartes?lecon=a%2Fb`) are added to the route params. */
export function matchRoute(hash: string): Route {
  const [path, query] = hash.replace(/^#/, '').split('?', 2)
  const parts = (path || '/').split('/').filter(Boolean)
  for (const [name, pattern] of Object.entries(patterns) as [RouteName, string][]) {
    const keys = pattern.split('/').filter(Boolean)
    if (keys.length !== parts.length) continue
    const params: Record<string, string> = {}
    if (keys.every((k, i) => (k.startsWith(':') ? (params[k.slice(1)] = decodeURIComponent(parts[i])) : k === parts[i]))) {
      return { name, params: { ...Object.fromEntries(new URLSearchParams(query)), ...params } }
    }
  }
  return { name: 'accueil', params: {} } // ponytail: unknown routes fall back to Accueil, add a 404 screen if needed
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => location.hash, () => '')
  return matchRoute(hash)
}

/** `replace` swaps the current history entry, for redirects that the back button must skip. */
export function navigate(path: string, replace = false) {
  if (replace) location.replace(`#${path}`)
  else location.hash = path
}
