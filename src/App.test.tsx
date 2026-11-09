import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vitest'
import App from './App'

test('App affiche le titre', () => {
  expect(renderToStaticMarkup(<App />)).toBe('<h1>Civique</h1>')
})
