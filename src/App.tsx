import { useEffect, type ComponentType } from 'react'
import BottomNav from './components/BottomNav'
import { navigate, useRoute, type RouteName } from './router'
import Accueil from './screens/Accueil'
import Bienvenue from './screens/Bienvenue'
import Cartes from './screens/Cartes'
import Correction from './screens/Correction'
import Examen from './screens/Examen'
import Lecon from './screens/Lecon'
import Lecons from './screens/Lecons'
import Progression from './screens/Progression'
import Reglages from './screens/Reglages'
import Resultats from './screens/Resultats'
import Theme from './screens/Theme'
import { AppDataProvider, useAppData } from './state'

const screens: Record<RouteName, ComponentType<Record<string, string>>> = {
  accueil: Accueil,
  bienvenue: Bienvenue,
  examen: Examen,
  resultats: Resultats,
  correction: Correction,
  lecons: Lecons,
  theme: Theme,
  lecon: Lecon,
  cartes: Cartes,
  progres: Progression,
  reglages: Reglages,
}

// Cartes is full screen in the mockup, with its own close button.
const withNav: RouteName[] = ['accueil', 'lecons', 'progres']

export default function App() {
  return (
    <AppDataProvider>
      <Shell />
    </AppDataProvider>
  )
}

function Shell() {
  const route = useRoute()
  const { data } = useAppData()
  // No profile: everything leads to Bienvenue. A profile: Bienvenue leads to Accueil.
  const redirect = !data && route.name !== 'bienvenue' ? '/bienvenue' : data && route.name === 'bienvenue' ? '/' : null
  useEffect(() => {
    if (redirect) navigate(redirect, true)
  }, [redirect])
  const name: RouteName = redirect ? (data ? 'accueil' : 'bienvenue') : route.name
  const params = redirect ? {} : route.params
  const Screen = screens[name]
  const nav = withNav.includes(name)
  return (
    <>
      <main className={nav ? 'screen screen--with-nav' : 'screen'}>
        <Screen {...params} />
      </main>
      {nav && <BottomNav active={name} />}
    </>
  )
}
