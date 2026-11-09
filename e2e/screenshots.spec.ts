import { test, type Page } from '@playwright/test'
import { appData, examInProgress, finishedExam, seed } from './helpers'

// Screenshots at 390x844 to compare with design/mockups by eye. Not assertions.
test.skip(({ browserName }) => browserName !== 'webkit', 'iPhone 13 only')
test.use({ viewport: { width: 390, height: 844 } }) // the mockup frame, without the Safari toolbars

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

test('reglages', async ({ page }) => {
  await seed(page, appData({ profile }), '#/reglages')
  await shoot(page, 'reglages')
  await page.getByRole('button', { name: 'Effacer toutes mes données' }).click()
  await shoot(page, 'reglages-effacer')
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
