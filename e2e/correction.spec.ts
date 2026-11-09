import { expect, test } from '@playwright/test'
import { answered, drawn, finished } from './exam'
import { appData, seed } from './helpers'

// Wrong on Institutions (6), one more question unanswered, two flagged.
const exam = answered(drawn(new Date('2026-11-05T10:00:00.000Z')), ['institutions'])
const [unanswered] = exam.questionIds.filter((id) => exam.snapshot[id].theme === 'principes')
const wrong = exam.questionIds.find((id) => exam.snapshot[id].theme === 'institutions')!
const right = exam.questionIds.find((id) => exam.snapshot[id].theme === 'droits')!
const record = finished({ ...exam, answers: { ...exam.answers, [unanswered]: null }, flagged: [wrong, right] })
const position = (id: string) => `Question ${exam.questionIds.indexOf(id) + 1}`

test('correction : réponse, bonne réponse, explication, leçon et filtres', async ({ page }) => {
  await seed(page, appData({ exams: [record] }), `#/correction/${encodeURIComponent(record.id)}`)
  await expect(page.getByRole('heading', { level: 1, name: 'Correction' })).toBeVisible()
  await expect(page.getByText('Examen blanc du 5 nov. · 33/40')).toBeVisible()

  const items = page.getByRole('listitem')
  const item = (id: string) => items.filter({ hasText: new RegExp(`^${position(id)}\\D`) })
  await expect(items).toHaveCount(40)

  // A wrong answer is told by an icon and a text, not only by its color.
  const w = record.snapshot[wrong]
  const wrongItem = item(wrong)
  await expect(wrongItem.getByText('Votre réponse est fausse')).toBeVisible()
  await expect(wrongItem.getByText(w.choices[record.answers[wrong]!], { exact: true })).toBeVisible()
  await expect(wrongItem.getByText('Bonne réponse')).toBeVisible()
  await expect(wrongItem.getByText(w.choices[w.answer], { exact: true })).toBeVisible()
  await expect(wrongItem.getByText(w.explanation)).toBeVisible()
  await expect(wrongItem.getByRole('link', { name: /^Lire la leçon : / })).toHaveAttribute('href', `#/lecon/${w.lesson}`)
  await expect(wrongItem.getByText('À revoir')).toBeVisible()

  await expect(item(unanswered).getByText('Vous n’avez pas répondu')).toBeVisible()
  await expect(item(right).getByText('Votre réponse est juste')).toBeVisible()
  await expect(item(right).getByText('Bonne réponse')).toHaveCount(0)

  const filter = (name: RegExp) => page.getByRole('button', { name })
  await expect(filter(/^Toutes \(40\)$/)).toHaveAttribute('aria-pressed', 'true')

  await filter(/^Erreurs \(7\)$/).click()
  await expect(filter(/^Erreurs/)).toHaveAttribute('aria-pressed', 'true')
  await expect(filter(/^Toutes/)).toHaveAttribute('aria-pressed', 'false')
  await expect(items).toHaveCount(7)
  await expect(page.getByText('Votre réponse est juste')).toHaveCount(0)

  await filter(/^À revoir \(2\)$/).click()
  await expect(items).toHaveCount(2)
  await expect(item(wrong)).toBeVisible()
  await expect(item(right)).toBeVisible()

  await page.getByRole('link', { name: 'Retour aux résultats' }).click()
  await expect(page).toHaveURL(new RegExp(`#/resultats/${encodeURIComponent(record.id)}$`))
  await expect(page.getByRole('heading', { level: 1, name: 'Bravo, examen réussi' })).toBeVisible()
  await expect(page.getByText('Réussi', { exact: true })).toBeVisible()
})

test('correction sans erreur ni question à revoir', async ({ page }) => {
  const perfect = finished(answered(drawn(new Date('2026-11-05T10:00:00.000Z')), []))
  await seed(page, appData({ exams: [perfect] }), `#/correction/${encodeURIComponent(perfect.id)}`)
  await page.getByRole('button', { name: /^Erreurs \(0\)$/ }).click()
  await expect(page.getByText('Aucune erreur : toutes vos réponses sont justes.')).toBeVisible()
  await page.getByRole('button', { name: /^À revoir \(0\)$/ }).click()
  await expect(page.getByText('Vous n’avez marqué aucune question « À revoir » pendant l’examen.')).toBeVisible()

  await page.goto(`./#/resultats/${encodeURIComponent(perfect.id)}`)
  await expect(page.getByText('Aucune erreur : rien à revoir.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Commencer le plan' })).toHaveCount(0)
})

test('un examen inconnu affiche un message', async ({ page }) => {
  await seed(page, appData(), '#/resultats/inconnu')
  await expect(page.getByRole('heading', { level: 1, name: 'Examen introuvable' })).toBeVisible()
  await page.goto('./#/correction/inconnu')
  await expect(page.getByRole('heading', { level: 1, name: 'Examen introuvable' })).toBeVisible()
})
