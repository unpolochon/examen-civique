import { expect, test } from 'vitest'
import { lesson, question } from './fixtures'
import { examDateLabel, examTitle, exportFileName, formatTimer, frenchSpacing, plural, splitSituation, themeMeta } from './format'

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

test('plural accorde chaque mot', () => {
  expect(plural(1, 'bonne réponse')).toBe('1 bonne réponse')
  expect(plural(5, 'bonne réponse')).toBe('5 bonnes réponses')
  expect(plural(0, 'erreur')).toBe('0 erreur')
})

test('formatTimer arrondit à la seconde supérieure', () => {
  expect(formatTimer(45 * 60 * 1000)).toBe('45:00')
  expect(formatTimer(31 * 60 * 1000 + 23_200)).toBe('31:24')
  expect(formatTimer(500)).toBe('00:01')
  expect(formatTimer(0)).toBe('00:00')
})

test('splitSituation sépare le scénario de la question finale', () => {
  expect(splitSituation('Nadia est enceinte. Son compagnon n’est pas d’accord. Que dit la loi ?')).toEqual({
    scenario: 'Nadia est enceinte. Son compagnon n’est pas d’accord.',
    question: 'Que dit la loi ?',
  })
  expect(splitSituation('Quelle est la devise de la France ?')).toBeNull()
})

test('examTitle donne le jour et le mois', () => {
  expect(examTitle(new Date(2026, 10, 9, 10).toISOString())).toBe('Examen blanc du 9 nov.')
})

test('frenchSpacing rend insécables les espaces de la ponctuation française', () => {
  expect(frenchSpacing('Le territoire : la Seine ? « Oui » ; non !')).toBe('Le territoire\u00a0: la Seine\u00a0? «\u00a0Oui\u00a0»\u00a0; non\u00a0!')
  expect(frenchSpacing('Le 14 Juillet')).toBe('Le 14 Juillet')
})
