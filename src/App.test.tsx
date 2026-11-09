import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vitest'
import App from './App'

test('App affiche l’accueil et la navigation par défaut', () => {
  const html = renderToStaticMarkup(<App />)
  expect(html).toContain('<h1>Accueil</h1>')
  expect(html).toContain('href="#/" aria-current="page"')
})
