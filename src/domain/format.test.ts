import { expect, test } from 'vitest'
import { lesson, question } from './fixtures'
import { examDateLabel, exportFileName, intervalLabel, scoreDeltaLabel, themeMeta } from './format'
import { INTERVALS_MS } from './srs'

const now = new Date(2026, 10, 9, 23, 30) // 9 Nov 2026, late evening local time

test('examDateLabel compte les jours de calendrier', () => {
  expect(examDateLabel(null, now)).toBeNull()
  expect(examDateLabel('2026-12-13', now)).toBe('Examen le 13 déc. · dans 34 jours')
  expect(examDateLabel('2026-11-10', now)).toBe('Examen le 10 nov. · demain')
  expect(examDateLabel('2026-11-09', now)).toBe("Examen aujourd'hui")
  expect(examDateLabel('2026-11-08', now)).toBe('Examen passé')
  expect(examDateLabel('2027-01-15', now)).toBe('Examen le 15 janv. 2027 · dans 67 jours')
})

test('examDateLabel ne se trompe pas au passage à l’heure d’hiver', () => {
  expect(examDateLabel('2026-10-26', new Date(2026, 9, 24, 12))).toBe('Examen le 26 oct. · dans 2 jours')
})

test('themeMeta compte leçons et questions officielles, sans les zéros', () => {
  const q = question('principes.laicite', 1)
  const lessons = [lesson('principes/a', 'principes', 1), lesson('principes/b', 'principes', 2)]
  const questions = [q, { ...q, id: 'x', official: false }, { ...q, id: 'y', theme: 'droits' as const }]
  expect(themeMeta('principes', lessons, questions)).toBe('2 leçons · 1 question')
  expect(themeMeta('droits', lessons, questions)).toBe('1 question')
  expect(themeMeta('histoire', lessons, questions)).toBe('')
})

test('exportFileName utilise la date locale', () => {
  expect(exportFileName(now)).toBe('civique-sauvegarde-2026-11-09.json')
})

test('intervalLabel donne le délai avant la prochaine révision', () => {
  expect(INTERVALS_MS.map(intervalLabel)).toEqual(['dans 10 min', 'demain', 'dans 3 jours', 'dans 7 jours', 'dans 16 jours', 'dans 35 jours'])
  expect(intervalLabel(3 * 3_600_000)).toBe('dans 3 h')
})

test('scoreDeltaLabel compare le premier et le dernier examen affichés', () => {
  const exam = (score: number, day: number, month = 10) => ({ score, finishedAt: new Date(2026, month, day, 10).toISOString() })
  expect(scoreDeltaLabel(exam(18, 12, 9), exam(27, 9))).toBe('+9 en 4 semaines')
  expect(scoreDeltaLabel(exam(30, 6), exam(28, 9))).toBe('-2 en 3 jours')
  expect(scoreDeltaLabel(exam(30, 8), exam(31, 9))).toBe('+1 en 1 jour')
  expect(scoreDeltaLabel(exam(20, 9), exam(24, 9))).toBe("+4 aujourd'hui")
  expect(scoreDeltaLabel(exam(20, 1, 7), exam(30, 9))).toBe('+10 en 3 mois')
  expect(scoreDeltaLabel(exam(25, 1), exam(25, 9))).toBe('Score stable')
})
