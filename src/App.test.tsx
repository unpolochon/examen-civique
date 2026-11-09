import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vitest'
import App from './App'

test('App affiche la première ouverture tant qu’aucun profil n’existe, sans navigation', () => {
  const html = renderToStaticMarkup(<App />)
  expect(html).toContain('<h1>Préparez l&#x27;examen civique de la carte de résident</h1>')
  expect(html).not.toContain('Navigation principale')
})
