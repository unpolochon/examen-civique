import type { ComponentType } from 'react'
import BottomNav from './components/BottomNav'
import { useRoute, type RouteName } from './router'
import Accueil from './screens/Accueil'
import Bienvenue from './screens/Bienvenue'
import Cartes from './screens/Cartes'
import Correction from './screens/Correction'
import Examen from './screens/Examen'
import Lecon from './screens/Lecon'
import Lecons from './screens/Lecons'
import Progres from './screens/Progres'
import Reglages from './screens/Reglages'
import Resultats from './screens/Resultats'
import Theme from './screens/Theme'

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
  progres: Progres,
  reglages: Reglages,
}

const withNav: RouteName[] = ['accueil', 'lecons', 'cartes', 'progres']

export default function App() {
  const { name, params } = useRoute()
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
