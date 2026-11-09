import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { clear, exportJson, importJson, load, migrate, save } from './storage'
import type { AppData, NotionId, QuestionSnapshot, Theme } from './types'

function snap(question: string, theme: Theme, notion: NotionId): QuestionSnapshot {
  return { question, choices: ['a', 'b', 'c', 'd'], answer: 0, explanation: 'Parce que.', theme, notion, lesson: `${theme}/lecon` }
}

const data: AppData = {
  version: 1,
  profile: { firstName: 'Awa', examDate: '2027-01-15', createdAt: '2026-11-09T10:00:00.000Z' },
  exams: [
    {
      id: 'e1',
      startedAt: '2026-11-09T10:00:00.000Z',
      finishedAt: '2026-11-09T10:30:00.000Z',
      questionIds: ['CR-011', 'CR-012'],
      choiceOrder: { 'CR-011': [2, 0, 3, 1], 'CR-012': [0, 1, 2, 3] },
      answers: { 'CR-011': 0, 'CR-012': null },
      score: 1,
      byTheme: {} as AppData['exams'][number]['byTheme'],
      byNotion: {} as AppData['exams'][number]['byNotion'],
      flagged: ['CR-012'],
      snapshot: {
        'CR-011': snap('Quelle est la devise de la République ?', 'principes', 'principes.devise-symboles'),
        'CR-012': snap('Qui vote les lois ?', 'institutions', 'institutions.organisation'),
      },
    },
  ],
  examInProgress: {
    id: 'e2',
    startedAt: '2026-11-09T11:00:00.000Z',
    questionIds: ['CR-011'],
    choiceOrder: { 'CR-011': [1, 0, 2, 3] },
    answers: { 'CR-011': null },
    flagged: ['CR-011'],
    current: 0,
    snapshot: { 'CR-011': snap('Quelle est la devise de la République ?', 'principes', 'principes.devise-symboles') },
  },
  cards: { 'CR-012': { level: 0, due: '2026-11-09T10:40:00.000Z' } },
  lessonsRead: ['principes/symboles'],
}

function fakeStorage() {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', fakeStorage())
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('load, save, clear', () => {
  test('rien de sauvegardé : null', () => {
    expect(load()).toBeNull()
  })

  test('sauvegarde puis relit sous la clé civique:data', () => {
    expect(save(data)).toBe(true)
    expect(JSON.parse(localStorage.getItem('civique:data')!)).toEqual(data)
    expect(load()).toEqual(data)
  })

  test('efface les données', () => {
    save(data)
    clear()
    expect(load()).toBeNull()
  })

  test('données corrompues : null', () => {
    localStorage.setItem('civique:data', '{pas du json')
    expect(load()).toBeNull()
  })

  test('localStorage indisponible : aucune exception', () => {
    const broken = () => {
      throw new Error('SecurityError')
    }
    vi.stubGlobal('localStorage', { getItem: broken, setItem: broken, removeItem: broken })
    expect(load()).toBeNull()
    expect(save(data)).toBe(false)
    expect(() => clear()).not.toThrow()
  })
})

describe('export et import', () => {
  test('aller-retour sans perte', () => {
    expect(importJson(exportJson(data))).toEqual(data)
  })

  test('accepte une date d’examen absente et aucun examen en cours', () => {
    const minimal = { ...data, profile: { ...data.profile, examDate: null }, exams: [], examInProgress: null, cards: {}, lessonsRead: [] }
    expect(importJson(JSON.stringify(minimal))).toEqual(minimal)
  })

  const broken = (patch: object) => JSON.stringify({ ...data, ...patch })
  test.each([
    ['JSON illisible', 'abc', "Ce fichier n'est pas une sauvegarde Civique (JSON illisible)."],
    ['tableau', '[]', "Ce fichier n'est pas une sauvegarde Civique (version inconnue)."],
    ['sans version', broken({ version: undefined }), "Ce fichier n'est pas une sauvegarde Civique (version inconnue)."],
    ['version future', broken({ version: 2 }), "Cette sauvegarde vient d'une version plus récente de l'app. Mettez l'app à jour puis réessayez."],
    ['prénom vide', broken({ profile: { ...data.profile, firstName: ' ' } }), 'Sauvegarde invalide : prénom manquant.'],
    ['date invalide', broken({ profile: { ...data.profile, examDate: 'demain' } }), "Sauvegarde invalide : date d'examen invalide."],
    ['examens absents', broken({ exams: null }), 'Sauvegarde invalide : liste des examens absente.'],
    ['examen sans score', broken({ exams: [{ ...data.exams[0], score: '1' }] }), 'Sauvegarde invalide : examen terminé illisible.'],
    ['examen sans photo des questions', broken({ exams: [{ ...data.exams[0], snapshot: undefined }] }), 'Sauvegarde invalide : examen terminé illisible.'],
    [
      'photo incomplète',
      broken({ exams: [{ ...data.exams[0], snapshot: { 'CR-011': data.exams[0].snapshot['CR-011'] } }] }),
      'Sauvegarde invalide : examen terminé illisible.',
    ],
    [
      'photo avec notion inconnue',
      broken({ exams: [{ ...data.exams[0], snapshot: { ...data.exams[0].snapshot, 'CR-012': { ...data.exams[0].snapshot['CR-012'], notion: 'x' } } }] }),
      'Sauvegarde invalide : examen terminé illisible.',
    ],
    ['examen en cours sans photo', broken({ examInProgress: { ...data.examInProgress, snapshot: {} } }), 'Sauvegarde invalide : examen en cours illisible.'],
    ['réponse invalide', broken({ examInProgress: { ...data.examInProgress, answers: { x: 'A' } } }), 'Sauvegarde invalide : examen en cours illisible.'],
    ['niveau de carte hors limites', broken({ cards: { x: { level: 6, due: data.cards['CR-012'].due } } }), 'Sauvegarde invalide : carte illisible.'],
    ['leçons lues absentes', broken({ lessonsRead: 'principes/symboles' }), 'Sauvegarde invalide : liste des leçons lues absente.'],
  ])('refuse : %s', (_, text, message) => {
    expect(() => importJson(text)).toThrow(message)
  })
})

test('migrate laisse la version 1 inchangée', () => {
  expect(migrate(data)).toBe(data)
})
