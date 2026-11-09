import { expect, test } from 'vitest'
import { lesson, question } from './fixtures'
import { examDateLabel, exportFileName, themeMeta } from './format'

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
