import type { ReactNode } from 'react'
import type { RouteName } from '../router'

const items: { route: RouteName; href: string; label: string; icon: ReactNode }[] = [
  { route: 'accueil', href: '#/', label: 'Accueil', icon: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
  {
    route: 'lecons',
    href: '#/lecons',
    label: 'Leçons',
    icon: (
      <>
        <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
        <path d="M4 21V5" />
      </>
    ),
  },
  {
    route: 'cartes',
    href: '#/cartes',
    label: 'Cartes',
    icon: (
      <>
        <rect x="3" y="6" width="14" height="14" rx="2" />
        <path d="M7 3h12a2 2 0 0 1 2 2v12" />
      </>
    ),
  },
  {
    route: 'progres',
    href: '#/progres',
    label: 'Progrès',
    icon: (
      <>
        <path d="M4 20V10" />
        <path d="M10 20V4" />
        <path d="M16 20v-7" />
        <path d="M22 20H2" />
      </>
    ),
  },
]

export default function BottomNav({ active }: { active: RouteName }) {
  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      {items.map(({ route, href, label, icon }) => {
        const current = route === active
        return (
          <a key={route} href={href} aria-current={current ? 'page' : undefined}>
            {/* Active icon as in the mockups: filled house, thicker strokes elsewhere. */}
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill={current && route === 'accueil' ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={current && route !== 'accueil' ? 2.2 : 1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {icon}
            </svg>
            {label}
          </a>
        )
      })}
    </nav>
  )
}
