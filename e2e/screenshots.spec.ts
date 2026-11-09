import { test, type Page } from '@playwright/test'
import type { ExamInProgress, Question } from '../src/domain/types.ts'
import { answered, bank, drawn, finished } from './exam'
import { appData, examInProgress, finishedExam, seed } from './helpers'

// Screenshots at 390x844 to compare with design/mockups by eye. Not assertions.
test.skip(({ browserName }) => browserName !== 'webkit', 'iPhone 13 only')
test.use({ viewport: { width: 390, height: 844 } }) // the mockup frame, without the Safari toolbars
// The mockups show the installed app: no install hint, except in accueil-installation.
const HINT_KEY = 'civique:conseil-installation-masque'
test.beforeEach(({ page }) => page.addInitScript((key) => localStorage.setItem(key, '1'), HINT_KEY))

const examDate = new Date(Date.now() + 34 * 86_400_000).toISOString().slice(0, 10)
const profile = { firstName: 'Paul', examDate, createdAt: '2026-11-01T10:00:00.000Z' }
const cards = Object.fromEntries(Array.from({ length: 18 }, (_, i) => [`c${i}`, { level: 0, due: '2026-01-01T00:00:00.000Z' }]))

async function shoot(page: Page, name: string, fullPage = false) {
  await page.evaluate('document.fonts.ready')
  await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage })
}

test('bienvenue', async ({ page }) => {
  await page.goto('./')
  await shoot(page, 'bienvenue')
})

for (const [name, extra] of [
  ['accueil', {}],
  ['accueil-en-cours', { examInProgress: examInProgress(12) }],
  ['accueil-score', { exams: [finishedExam(27)] }],
] as const) {
  test(name, async ({ page }) => {
    await seed(page, appData({ profile, cards, ...extra }))
    await shoot(page, name)
  })
}

test('accueil-installation', async ({ page }) => {
  await page.addInitScript((key) => localStorage.removeItem(key), HINT_KEY)
  await seed(page, appData({ profile, cards }))
  await shoot(page, 'accueil-installation')
})

test('reglages', async ({ page }) => {
  await seed(page, appData({ profile }), '#/reglages')
  await shoot(page, 'reglages')
  await page.getByRole('button', { name: 'Effacer toutes mes données' }).click()
  await shoot(page, 'reglages-effacer')
})

/** A drawn exam showing question `current`, replaced by `shown` when given, `leftMs` before the end. */
function examAt(current: number, leftMs: number, shown?: Question): ExamInProgress {
  const exam = drawn(new Date(Date.now() - (45 * 60_000 - leftMs)))
  if (!shown) return { ...exam, current }
  const { id, question, choices, answer, explanation, theme, notion, lesson } = shown
  const questionIds = exam.questionIds.with(current, id)
  return {
    ...exam,
    questionIds,
    current,
    snapshot: { ...exam.snapshot, [id]: { question, choices, answer, explanation, theme, notion, lesson } },
    choiceOrder: { ...exam.choiceOrder, [id]: [1, 0, 2, 3] },
    answers: { ...exam.answers, [id]: null },
  }
}

test('examen', async ({ page }) => {
  const exam = examAt(11, 31 * 60_000 + 24_500, bank.find((q) => q.question === 'Quelle est la devise de la France ?'))
  const id = exam.questionIds[11]
  exam.answers[id] = exam.snapshot[id].answer
  await seed(page, appData({ profile, examInProgress: exam }), '#/examen')
  await shoot(page, 'examen')
})

test('examen-situation', async ({ page }) => {
  const exam = examAt(30, 4 * 60_000 + 12_500, bank.find((q) => q.notion === 'droits.situations'))
  exam.flagged = [exam.questionIds[30]]
  await seed(page, appData({ profile, examInProgress: exam }), '#/examen')
  await shoot(page, 'examen-situation')
})

test('examen-terminer', async ({ page }) => {
  const exam = { ...answered(examAt(39, 12 * 60_000), []), flagged: [] as string[] }
  exam.answers[exam.questionIds[7]] = null
  exam.answers[exam.questionIds[21]] = null
  exam.flagged = [exam.questionIds[4], exam.questionIds[17], exam.questionIds[33]]
  await seed(page, appData({ profile, examInProgress: exam }), '#/examen')
  await page.getByRole('button', { name: 'Terminer l’examen' }).click()
  await shoot(page, 'examen-terminer')
})

const failed = finished(answered(drawn(new Date('2026-11-09T10:00:00.000Z')), ['institutions', 'histoire']))
const passed = finished(answered(drawn(new Date('2026-11-09T10:00:00.000Z'), 2), ['societe']))

for (const [name, record] of [
  ['resultats', failed],
  ['resultats-reussi', passed],
] as const) {
  test(name, async ({ page }) => {
    await seed(page, appData({ profile, exams: [record] }), `#/resultats/${encodeURIComponent(record.id)}`)
    await shoot(page, name, true)
  })
}

test('correction', async ({ page }) => {
  const record = { ...failed, flagged: [failed.questionIds[0], failed.questionIds[5]] }
  await seed(page, appData({ profile, exams: [record] }), `#/correction/${encodeURIComponent(record.id)}`)
  await shoot(page, 'correction')
  await page.getByRole('button', { name: /^Erreurs/ }).click()
  await shoot(page, 'correction-erreurs')
})

const lessonsRead = ['institutions/democratie-et-republique', 'institutions/etat-de-droit', 'principes/liberte', 'droits/droits-et-libertes']

test('lecons', async ({ page }) => {
  await seed(page, appData({ profile, lessonsRead }), '#/lecons')
  await shoot(page, 'lecons')
})

test('theme', async ({ page }) => {
  await seed(page, appData({ profile, lessonsRead }), '#/lecons/institutions')
  await shoot(page, 'theme')
})

test('lecon', async ({ page }) => {
  await seed(page, appData({ profile, lessonsRead }), '#/lecon/institutions/institutions-nationales')
  await shoot(page, 'lecon')
  await shoot(page, 'lecon-complete', true)
  await page.getByRole('region', { name: 'Tableau' }).first().scrollIntoViewIfNeeded()
  await shoot(page, 'lecon-tableau')
  await page.getByRole('navigation', { name: 'Autres leçons de la thématique' }).scrollIntoViewIfNeeded()
  await shoot(page, 'lecon-fin')
})

const due = { level: 1, due: '2026-01-01T00:00:00.000Z' }
const history = ['10-12', '10-19', '10-26', '11-02', '11-09'].map((d, i) => finishedExam([18, 21, 24, 25, 27][i], `2026-${d}T10:45:00.000Z`))

test('cartes', async ({ page }) => {
  await seed(page, appData({ profile, cards: { 'CR-041': due, 'CR-001': due } }), '#/cartes')
  await shoot(page, 'cartes')
  await page.getByRole('button', { name: 'Voir la réponse' }).click()
  await shoot(page, 'cartes-reponse')
  await page.getByRole('button', { name: /^Oui/ }).click()
  await page.getByRole('button', { name: 'Voir la réponse' }).click()
  await page.getByRole('button', { name: /^Hésité/ }).click()
  await shoot(page, 'cartes-fin')
})

test('cartes-vide', async ({ page }) => {
  await seed(page, appData({ profile }), '#/cartes')
  await shoot(page, 'cartes-vide')
})

test('progression', async ({ page }) => {
  const cardsMastered = Object.fromEntries(['CR-041', 'CR-042', 'CR-043', 'CR-001', 'CR-002'].map((id) => [id, { level: 3, due: '2030-01-01T00:00:00.000Z' }]))
  await seed(page, appData({ profile, exams: history, cards: cardsMastered }), '#/progres')
  await shoot(page, 'progression')
  await page.screenshot({ path: 'e2e/screenshots/progression-page.png', fullPage: true })
})

test('progression-vide', async ({ page }) => {
  await seed(page, appData({ profile }), '#/progres')
  await shoot(page, 'progression-vide')
})
