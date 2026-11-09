import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { answered, drawn, finished } from './exam'
import { appData, finishedExam, seed } from './helpers'

// axe on every screen and dialog, in seeded states. Serious and critical violations fail the test.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

async function audit(page: Page) {
  await page.evaluate('document.fonts.ready')
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const blocking = violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.impact}) ${v.help}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
  expect.soft(blocking).toEqual([]) // soft: one run reports every screen
  expect.soft(await smallTargets(page)).toEqual([])
}

/** Controls under 44 x 44 px. Links inside a sentence are exempt (WCAG 2.5.8); a radio button's target is its label. */
function smallTargets(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea')].flatMap((el) => {
      if (getComputedStyle(el).display === 'inline') return []
      const target = el.matches('input[type="radio"]') ? (el.closest('label') ?? el) : el
      const { width, height } = target.getBoundingClientRect()
      if (!width || !height || (width >= 44 && height >= 44)) return []
      const name = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40)
      return [`${location.hash} ${el.tagName.toLowerCase()} « ${name} » ${Math.round(width)} x ${Math.round(height)}`]
    }),
  )
}

const failed = finished(answered(drawn(new Date('2026-11-09T10:00:00.000Z')), ['institutions', 'histoire']))
const passed = finished(answered(drawn(new Date('2026-11-09T10:00:00.000Z'), 2), []))
const due = { level: 1, due: '2026-01-01T00:00:00.000Z' }
const history = ['10-26', '11-02', '11-09'].map((d, i) => finishedExam([21, 27, 33][i], `2026-${d}T10:45:00.000Z`))

/** A drawn exam showing question `current`, or its first situation. */
function inProgress(current: number | 'situation') {
  const exam = drawn()
  if (current === 'situation') current = exam.questionIds.findIndex((id) => exam.snapshot[id].notion.endsWith('.situations'))
  const id = exam.questionIds[current]
  return { ...exam, current, answers: { ...exam.answers, [id]: exam.snapshot[id].answer }, flagged: [exam.questionIds[2]] }
}

test('bienvenue', async ({ page }) => {
  await page.goto('./')
  await audit(page)
  await page.getByRole('button', { name: 'Commencer' }).click()
  await expect(page.getByText('Indiquez votre prénom pour commencer.')).toBeVisible()
  await audit(page)
})

for (const [name, extra] of [
  ['accueil', { cards: { 'CR-001': due } }],
  ['accueil en cours', { examInProgress: inProgress(5) }],
  ['accueil avec score', { exams: [finishedExam(27)], profile: { firstName: 'Paul', examDate: '2027-01-15', createdAt: '2026-11-01T10:00:00.000Z' } }],
] as const) {
  test(name, async ({ page }) => {
    await seed(page, appData(extra))
    await audit(page)
  })
}

test('réglages et ses dialogues', async ({ page }) => {
  await seed(page, appData(), '#/reglages')
  await audit(page)
  await page.getByRole('button', { name: 'Effacer toutes mes données' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await audit(page)
  await page.getByRole('button', { name: 'Annuler' }).click()
  await page.getByLabel('Fichier de sauvegarde à importer').setInputFiles({
    name: 'sauvegarde.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(appData({ exams: [finishedExam(30)] }))),
  })
  await expect(page.getByRole('dialog', { name: 'Remplacer vos données ?' })).toBeVisible()
  await audit(page)
})

test('examen et ses dialogues', async ({ page }) => {
  await seed(page, appData({ examInProgress: inProgress(0) }), '#/examen')
  await expect(page.getByRole('timer')).toBeVisible()
  await audit(page)
  await page.getByRole('button', { name: /^Quitter l.examen$/ }).click()
  await expect(page.getByRole('dialog', { name: 'Quitter ?' })).toBeVisible()
  await audit(page)
  await page.getByRole('button', { name: 'Annuler' }).click()
})

test('examen, mise en situation', async ({ page }) => {
  await seed(page, appData({ examInProgress: inProgress('situation') }), '#/examen')
  await expect(page.getByText('Mise en situation')).toBeVisible()
  await audit(page)
})

test('examen, récapitulatif', async ({ page }) => {
  await seed(page, appData({ examInProgress: inProgress(39) }), '#/examen')
  await page.getByRole('button', { name: /^Terminer l.examen$/ }).click()
  await expect(page.getByRole('dialog', { name: /^Terminer l.examen/ })).toBeVisible()
  await audit(page)
})

for (const [name, record] of [
  ['résultats', failed],
  ['résultats réussis', passed],
] as const) {
  test(name, async ({ page }) => {
    await seed(page, appData({ exams: [record] }), `#/resultats/${encodeURIComponent(record.id)}`)
    await audit(page)
  })
}

test('correction', async ({ page }) => {
  const record = { ...failed, flagged: [failed.questionIds[0]] }
  await seed(page, appData({ exams: [record] }), `#/correction/${encodeURIComponent(record.id)}`)
  await audit(page)
  await page.getByRole('button', { name: /^À revoir/ }).click()
  await audit(page)
})

test('examen introuvable', async ({ page }) => {
  await seed(page, appData(), '#/resultats/inconnu')
  await audit(page)
})

test('leçons, thématique et leçon', async ({ page }) => {
  await seed(page, appData({ lessonsRead: ['institutions/etat-de-droit'] }), '#/lecons')
  await audit(page)
  await page.goto('./#/lecons/institutions')
  await audit(page)
  await page.goto('./#/lecon/institutions/institutions-nationales')
  await audit(page)
  await page.goto('./#/lecon/institutions/inconnue')
  await audit(page)
})

test('cartes', async ({ page }) => {
  await seed(page, appData({ cards: { 'CR-041': due } }), '#/cartes')
  await audit(page)
  await page.getByRole('button', { name: 'Voir la réponse' }).click()
  await audit(page)
  await page.getByRole('button', { name: /^Oui/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Bravo/ })).toBeVisible()
  await audit(page)
})

test('cartes vides', async ({ page }) => {
  await seed(page, appData(), '#/cartes')
  await audit(page)
})

test('progression', async ({ page }) => {
  await seed(page, appData({ exams: history }), '#/progres')
  await audit(page)
})

test('progression vide', async ({ page }) => {
  await seed(page, appData(), '#/progres')
  await audit(page)
})
