import { expect, test } from 'vitest'
import { matchRoute } from './router'

test('matchRoute reconnaît les routes et leurs paramètres', () => {
  expect(matchRoute('')).toEqual({ name: 'accueil', params: {} })
  expect(matchRoute('#/')).toEqual({ name: 'accueil', params: {} })
  expect(matchRoute('#/lecons')).toEqual({ name: 'lecons', params: {} })
  expect(matchRoute('#/lecons/droits')).toEqual({ name: 'theme', params: { theme: 'droits' } })
  expect(matchRoute('#/lecon/histoire/la-revolution')).toEqual({
    name: 'lecon',
    params: { theme: 'histoire', slug: 'la-revolution' },
  })
  expect(matchRoute('#/resultats/abc')).toEqual({ name: 'resultats', params: { id: 'abc' } })
  expect(matchRoute('#/inconnu/x')).toEqual({ name: 'accueil', params: {} })
})
