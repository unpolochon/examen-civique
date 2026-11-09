import { test, type Page } from '@playwright/test'
import { appData, examInProgress, finishedExam, seed } from './helpers'

// Screenshots at 390x844 to compare with design/mockups by eye. Not assertions.
test.skip(({ browserName }) => browserName !== 'webkit', 'iPhone 13 only')
test.use({ viewport: { width: 390, height: 844 } }) // the mockup frame, without the Safari toolbars

const examDate = new Date(Date.now() + 34 * 86_400_000).toISOString().slice(0, 10)
const profile = { firstName: 'Paul', examDate, createdAt: '2026-11-01T10:00:00.000Z' }
const cards = Object.fromEntries(Array.from({ length: 18 }, (_, i) => [`c${i}`, { level: 0, due: '2026-01-01T00:00:00.000Z' }]))

async function shoot(page: Page, name: string) {
  await page.evaluate('document.fonts.ready')
  await page.screenshot({ path: `e2e/screenshots/${name}.png` })
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
