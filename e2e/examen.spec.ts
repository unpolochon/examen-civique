import { expect, test, type Page } from '@playwright/test'
import type { ExamInProgress } from '../src/domain/types.ts'
import { choiceText } from './exam'
import { appData, seed, stored } from './helpers'

const counter = (page: Page) => page.getByText(/^Question \d+ \/ 40$/)
const next = (page: Page) => page.getByRole('button', { name: 'Question suivante' })
const flag = (page: Page) => page.getByRole('button', { name: 'À revoir' })

test('examen complet : 40 réponses, résultats et plan de révision', async ({ page }) => {
  await seed(page, appData(), '#/examen')
  await expect(counter(page)).toHaveText('Question 1 / 40')
  await expect(page.getByRole('progressbar', { name: 'Avancement' })).toHaveAttribute('aria-valuenow', '1')
  await expect(page.getByRole('button', { name: 'Précédente' })).toBeHidden()
  const exam: ExamInProgress = (await stored(page)).examInProgress
  expect(exam.questionIds).toHaveLength(40)

  // Wrong on every Institutions and Histoire question (6 + 8), right elsewhere: 26/40.
  for (const [i, id] of exam.questionIds.entries()) {
    const wrong = ['institutions', 'histoire'].includes(exam.snapshot[id].theme)
    await page.getByRole('radio', { name: choiceText(exam, id, !wrong), exact: true }).check()
    if (i === 2) {
      await flag(page).click()
      await expect(flag(page)).toHaveAttribute('aria-pressed', 'true')
    }
    if (i < 39) {
      await next(page).click()
      await expect(counter(page)).toHaveText(`Question ${i + 2} / 40`)
    }
  }
  // Nothing tells whether an answer is right before the end.
  await expect(page.getByText(/juste|fausse|bonne réponse/i)).toHaveCount(0)
  expect((await stored(page)).examInProgress.answers[exam.questionIds[0]]).not.toBeNull()

  await page.getByRole('button', { name: 'Terminer l’examen' }).click()
  const sheet = page.getByRole('dialog', { name: 'Terminer l’examen ?' })
  await expect(sheet.getByText('Répondues40 / 40')).toBeVisible()
  await expect(sheet.getByText('Sans réponse0')).toBeVisible()
  await expect(sheet.getByRole('button', { name: 'Question 3' })).toBeVisible()
  await sheet.getByRole('button', { name: 'Terminer' }).click()

  await expect(page).toHaveURL(new RegExp(`#/resultats/${encodeURIComponent(exam.id)}$`))
  await expect(page.getByRole('heading', { level: 1, name: 'Encore 6 bonnes réponses' })).toBeVisible()
  await expect(page.getByRole('img', { name: '26 bonnes réponses sur 40' })).toBeVisible()
  await expect(page.getByText('Pas encore réussi')).toBeVisible()
  await expect(page.getByText('Connaissances14 / 28')).toBeVisible()
  await expect(page.getByText('Mises en situation12 / 12')).toBeVisible()
  const themes = page.getByRole('region', { name: 'Par thématique' })
  await expect(themes.getByText('Institutions', { exact: true })).toBeVisible()
  await expect(themes.getByText('À renforcer')).toHaveCount(2)
  await expect(themes.getByText('0/6')).toBeVisible()
  await expect(themes.getByText('0/8')).toBeVisible()
  await expect(themes.getByText('11/11')).toHaveCount(2)

  // Plan: at most 3 lessons, only from the weak themes, then the cards.
  const plan = page.getByRole('region', { name: 'Votre plan de révision' })
  const lessons = plan.getByRole('link', { name: /Lire$/ })
  const count = await lessons.count()
  expect(count).toBeGreaterThan(0)
  expect(count).toBeLessThanOrEqual(3)
  for (let i = 0; i < count; i++) {
    await expect(lessons.nth(i)).toHaveAttribute('href', /^#\/lecon\/(institutions|histoire)\/[\w-]+$/)
  }
  await expect(plan.getByRole('link', { name: /^Revoir mes 14 erreurs/ })).toHaveAttribute('href', '#/cartes')
  await expect(page.getByRole('link', { name: 'Commencer le plan' })).toHaveAttribute('href', (await lessons.first().getAttribute('href'))!)

  const data = await stored(page)
  expect(data.examInProgress).toBeNull()
  expect(data.exams).toHaveLength(1)
  expect(data.exams[0]).toMatchObject({ id: exam.id, score: 26, flagged: [exam.questionIds[2]] })
  expect(Object.values(data.cards)).toHaveLength(14)

  await page.getByRole('link', { name: 'Voir la correction détaillée' }).click()
  await expect(page).toHaveURL(new RegExp(`#/correction/${encodeURIComponent(exam.id)}$`))
  await expect(page.getByRole('heading', { level: 1, name: 'Correction' })).toBeVisible()

  // Back on Accueil, the last score replaces the recommendation.
  await page.goto('./#/')
  await expect(page.getByText('Dernier examen blanc : 26/40')).toBeVisible()
})

test('reprise après rechargement, retour arrière, saut depuis le récapitulatif et sortie', async ({ page }) => {
  await seed(page, appData(), '#/examen')
  await expect(counter(page)).toHaveText('Question 1 / 40')
  const radios = page.getByRole('radio')
  await radios.nth(0).check()
  await next(page).click()
  await radios.nth(1).check()
  await flag(page).click()
  const id = (await stored(page)).examInProgress.id

  await page.reload()
  await expect(counter(page)).toHaveText('Question 2 / 40')
  await expect(radios.nth(1)).toBeChecked()
  await expect(flag(page)).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Précédente' }).click()
  await expect(counter(page)).toHaveText('Question 1 / 40')
  await expect(radios.nth(0)).toBeChecked()
  await expect(flag(page)).toHaveAttribute('aria-pressed', 'false')

  // Keyboard: arrows move between the choices and save the answer.
  await radios.nth(0).focus()
  await page.keyboard.press('ArrowDown')
  await expect(radios.nth(1)).toBeChecked()
  await expect.poll(async () => (await stored(page)).examInProgress.answers).not.toEqual({})

  // Jump to the last question (storage edit, then reload), finish, then go back to the flagged question.
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('civique:data')!)
    data.examInProgress.current = 39
    localStorage.setItem('civique:data', JSON.stringify(data))
  })
  await page.reload()
  await expect(counter(page)).toHaveText('Question 40 / 40')
  await page.getByRole('button', { name: 'Terminer l’examen' }).click()
  const sheet = page.getByRole('dialog', { name: 'Terminer l’examen ?' })
  await expect(sheet.getByRole('button', { name: 'Continuer' })).toBeFocused()
  await expect(sheet.getByText('Répondues2 / 40')).toBeVisible()
  await expect(sheet.getByText('Sans réponse38')).toBeVisible()
  await expect(sheet.getByText('Les questions sans réponse comptent comme fausses.')).toBeVisible()
  await sheet.getByRole('button', { name: 'Question 2' }).click()
  await expect(sheet).toBeHidden()
  await expect(counter(page)).toHaveText('Question 2 / 40')
  await expect(flag(page)).toHaveAttribute('aria-pressed', 'true')

  // Leaving keeps the exam; Accueil offers to resume it.
  await page.getByRole('button', { name: 'Quitter l’examen' }).click()
  const quit = page.getByRole('dialog', { name: 'Quitter ?' })
  await expect(quit).toContainText('Votre progression est gardée.')
  await quit.getByRole('button', { name: 'Annuler' }).click()
  await expect(quit).toBeHidden()
  await page.getByRole('button', { name: 'Quitter l’examen' }).click()
  await page.getByRole('dialog', { name: 'Quitter ?' }).getByRole('button', { name: 'Quitter' }).click()
  await expect(page).toHaveURL(/#\/$/)
  await expect(page.getByText('Question 2 sur 40')).toBeVisible()
  await page.getByRole('link', { name: 'Reprendre l’examen blanc' }).click()
  await expect(counter(page)).toHaveText('Question 2 / 40')
  expect((await stored(page)).examInProgress.id).toBe(id)
})

test('le minuteur décompte, passe en alerte sous 5 minutes et termine l’examen à 0', async ({ page }) => {
  const start = new Date('2026-11-09T10:00:00.000Z').getTime()
  await page.clock.setFixedTime(start)
  await seed(page, appData(), '#/examen')
  const timer = page.getByRole('timer')
  await expect(timer).toHaveText('Temps restant : 45:00')
  await page.getByRole('radio').first().check()

  await page.clock.setFixedTime(start + 1000)
  await expect(timer).toHaveText('Temps restant : 44:59')
  await expect(timer).not.toHaveClass(/examen__timer--warn/)

  await page.clock.setFixedTime(start + 40 * 60_000 + 1000)
  await expect(timer).toHaveText('Temps restant : 04:59')
  await expect(timer).toHaveClass(/examen__timer--warn/)

  await page.clock.setFixedTime(start + 45 * 60_000)
  await expect(page).toHaveURL(/#\/resultats\//)
  await expect(page.getByRole('heading', { level: 1, name: /^Encore \d+ bonnes réponses$/ })).toBeVisible()
  const [record] = (await stored(page)).exams
  expect(record.finishedAt).toBe('2026-11-09T10:45:00.000Z')
  expect(Object.values(record.answers).filter((a) => a === null)).toHaveLength(39)
  expect(record.score).toBeLessThanOrEqual(1)
})
