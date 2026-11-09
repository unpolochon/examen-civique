import { expect, test } from '@playwright/test'
import { appData, examInProgress, finishedExam, seed } from './helpers'

const examCard = (page: import('@playwright/test').Page) => page.getByRole('region', { name: 'Examen blanc' })

test('sans examen terminé, l’examen blanc est recommandé', async ({ page }) => {
  await seed(page)
  const card = examCard(page)
  await expect(card.getByText('Recommandé')).toBeVisible()
  await expect(card.getByText('40 questions · 45 min · comme le jour J')).toBeVisible()
  await card.getByRole('link', { name: 'Commencer' }).click()
  await expect(page).toHaveURL(/#\/examen$/)
})

test('un examen en cours se reprend depuis l’accueil', async ({ page }) => {
  await seed(page, appData({ examInProgress: examInProgress(12), exams: [finishedExam(20)] }))
  const card = examCard(page)
  await expect(card.getByText('En cours')).toBeVisible()
  await expect(card.getByText('Question 13 sur 40')).toBeVisible()
  await expect(card.getByText('Recommandé')).toHaveCount(0)
  await expect(card.getByRole('link', { name: "Reprendre l'examen blanc" })).toHaveAttribute('href', '#/examen')
})

test('après un examen terminé, l’accueil montre le dernier score', async ({ page }) => {
  await seed(page, appData({ exams: [finishedExam(21, '2026-11-01T10:45:00.000Z'), finishedExam(27)] }))
  const card = examCard(page)
  await expect(card.getByText('Dernier examen blanc : 27/40')).toBeVisible()
  await expect(card.getByText('Il faut 32 bonnes réponses pour réussir. Refaites-en un après vos révisions.')).toBeVisible()
  await expect(card.getByText('Recommandé')).toHaveCount(0)
  await expect(card.getByRole('link', { name: 'Refaire un examen blanc' })).toHaveAttribute('href', '#/examen')
})

test('thématiques, cartes du jour et réglages', async ({ page }) => {
  const past = new Date(Date.now() - 60_000).toISOString()
  const future = new Date(Date.now() + 86_400_000).toISOString()
  await seed(page, appData({ cards: { a: { level: 0, due: past }, b: { level: 1, due: past }, c: { level: 2, due: future } } }))

  for (const [name, theme] of [
    ['Principes et valeurs', 'principes'],
    ['Institutions et politique', 'institutions'],
    ['Droits et devoirs', 'droits'],
    ['Histoire, géographie, culture', 'histoire'],
    ['Vivre dans la société', 'societe'],
  ]) {
    await expect(page.getByRole('link', { name: new RegExp(`^${name}`) })).toHaveAttribute('href', `#/lecons/${theme}`)
  }
  // Counts come from the content: Droits et devoirs has lessons and official questions in every branch.
  await expect(page.getByRole('link', { name: /^Droits et devoirs/ })).toContainText(/\d+ leçons? · \d+ questions?/)
  await expect(page.getByRole('link', { name: 'Tout voir' })).toHaveAttribute('href', '#/lecons')
  await expect(page.getByRole('link', { name: 'Cartes du jour 2 à revoir' })).toHaveAttribute('href', '#/cartes')

  await page.getByRole('link', { name: 'Réglages' }).click()
  await expect(page).toHaveURL(/#\/reglages$/)
})
