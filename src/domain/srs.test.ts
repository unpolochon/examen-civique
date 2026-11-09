import { describe, expect, test } from 'vitest'
import { dueCards, INTERVALS_MS, markMissed, mastery, review, type Grade } from './srs'
import type { CardState } from './types'

const t0 = new Date('2026-11-09T09:00:00.000Z')
const after = (ms: number, from = t0) => new Date(from.getTime() + ms)
const MIN = 60 * 1000
const DAY = 24 * 60 * MIN
const card = (level: CardState['level'], due = t0.toISOString()): CardState => ({ level, due })

describe('review', () => {
  test('intervalles : 10 min, 1 j, 3 j, 7 j, 16 j, 35 j', () => {
    expect(INTERVALS_MS).toEqual([10 * MIN, DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY])
  })

  test('carte jamais vue', () => {
    expect(review(undefined, 'non', t0)).toEqual({ level: 0, due: '2026-11-09T09:10:00.000Z' })
    expect(review(undefined, 'hesite', t0)).toEqual({ level: 0, due: '2026-11-09T09:10:00.000Z' })
    expect(review(undefined, 'oui', t0)).toEqual({ level: 1, due: '2026-11-10T09:00:00.000Z' })
  })

  test('« Non » : retour au niveau 0, due dans 10 min', () => {
    for (const level of [0, 1, 2, 3, 4, 5] as const) {
      expect(review(card(level), 'non', t0)).toEqual({ level: 0, due: '2026-11-09T09:10:00.000Z' })
    }
  })

  test('« Hésité » : même niveau, due après l’intervalle de ce niveau', () => {
    expect(review(card(2), 'hesite', t0)).toEqual({ level: 2, due: '2026-11-12T09:00:00.000Z' })
    expect(review(card(5), 'hesite', t0)).toEqual({ level: 5, due: '2026-12-14T09:00:00.000Z' })
  })

  test('« Oui » : niveau + 1 plafonné à 5, due après l’intervalle du nouveau niveau', () => {
    expect(review(card(0), 'oui', t0)).toEqual({ level: 1, due: '2026-11-10T09:00:00.000Z' })
    expect(review(card(3), 'oui', t0)).toEqual({ level: 4, due: '2026-11-25T09:00:00.000Z' })
    expect(review(card(5), 'oui', t0)).toEqual({ level: 5, due: '2026-12-14T09:00:00.000Z' })
  })

  test('parcours sur plusieurs jours avec une horloge simulée', () => {
    let now = t0
    let state: CardState | undefined
    const steps: [Grade, string][] = [
      ['oui', '2026-11-10T09:00:00.000Z'], // level 1
      ['oui', '2026-11-13T09:00:00.000Z'], // level 2
      ['hesite', '2026-11-16T09:00:00.000Z'], // level 2
      ['oui', '2026-11-23T09:00:00.000Z'], // level 3
      ['non', '2026-11-23T09:10:00.000Z'], // level 0
      ['oui', '2026-11-24T09:10:00.000Z'], // level 1
    ]
    for (const [grade, due] of steps) {
      // Answer exactly when the card is due.
      state = review(state, grade, now)
      expect(state.due).toBe(due)
      expect(dueCards({ q: state }, after(-1, new Date(due)))).toEqual([])
      expect(dueCards({ q: state }, new Date(due))).toEqual(['q'])
      now = new Date(due)
    }
    expect(state).toEqual({ level: 1, due: '2026-11-24T09:10:00.000Z' })
  })
})

describe('dueCards', () => {
  const cards = {
    a: card(1, after(DAY).toISOString()),
    b: card(0, after(-5 * MIN).toISOString()),
    c: card(3, t0.toISOString()),
    d: card(2, after(-2 * DAY).toISOString()),
  }
  test('cartes dues maintenant, la plus ancienne d’abord', () => {
    expect(dueCards(cards, t0)).toEqual(['d', 'b', 'c'])
    expect(dueCards(cards, after(DAY))).toEqual(['d', 'b', 'c', 'a'])
    expect(dueCards({}, t0)).toEqual([])
  })
})

describe('markMissed', () => {
  test('niveau 0, due maintenant, sans toucher aux autres cartes ni à l’entrée', () => {
    const cards = { a: card(4, after(10 * DAY).toISOString()), b: card(2, after(DAY).toISOString()) }
    const out = markMissed(cards, ['a', 'new'], t0)
    expect(out).toEqual({ a: card(0), b: cards.b, new: card(0) })
    expect(cards.a.level).toBe(4)
    expect(dueCards(out, t0)).toEqual(['a', 'new'])
  })
})

describe('mastery', () => {
  test('part des questions au niveau 3 ou plus', () => {
    const cards = { a: card(3), b: card(5), c: card(2), d: card(0) }
    expect(mastery(cards, ['a', 'b', 'c', 'd'])).toBe(0.5)
    expect(mastery(cards, ['a', 'b', 'c', 'd', 'jamais-vue'])).toBe(0.4)
    expect(mastery(cards, ['c'])).toBe(0)
    expect(mastery(cards, [])).toBe(0)
  })
})
