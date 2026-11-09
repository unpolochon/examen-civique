import { expect, test } from '@playwright/test'
import type { Theme } from '../src/domain/types.ts'
import { bank } from './exam'

// The whole journey of a new user, without seeding: profile, exam, results, lesson, cards, progress, then offline.
test.skip(({ browserName }) => browserName !== 'webkit', 'iPhone 13 only')
test.setTimeout(120_000)

/** Every question of these themes gets a wrong answer: 6 + 4 questions in the exam grid, so 30/40. */
const WRONG_THEMES: Theme[] = ['institutions', 'societe']
const normalize = (text: string) => text.replace(/\u00a0/g, ' ').trim()

test('parcours complet, puis hors ligne', async ({ page, context }) => {
  // First launch: profile.
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1, name: 'Préparez l’examen civique de la carte de résident' })).toBeVisible()
  await page.getByLabel('Votre prénom').fill('Awa')
  await page.getByRole('button', { name: 'Commencer' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Bonjour Awa' })).toBeVisible()

  // The install hint shows on Safari until dismissed.
  await page.getByRole('region', { name: 'Installer l’app' }).getByRole('button', { name: 'Masquer ce conseil' }).click()

  // Full exam: 40 questions, the right answer except for WRONG_THEMES, one question flagged.
  await page.getByRole('region', { name: 'Examen blanc' }).getByRole('link', { name: 'Commencer' }).click()
  let wrong = 0
  for (let n = 1; n <= 40; n++) {
    await expect(page.getByText(`Question ${n} / 40`)).toBeVisible()
    const heading = normalize(await page.getByRole('heading', { level: 1 }).innerText())
    const radios = page.getByRole('radio')
    await expect(radios).toHaveCount(4)
    const shown = (await page.locator('fieldset label').allInnerTexts()).map(normalize)
    const question = bank.find((q) => normalize(q.question).endsWith(heading) && [...q.choices].sort().join('|') === [...shown].sort().join('|'))
    expect(question, `question ${n} « ${heading} » introuvable`).toBeDefined()
    const isWrong = WRONG_THEMES.includes(question!.theme)
    const target = question!.choices[isWrong ? (question!.answer + 1) % 4 : question!.answer]
    await radios.nth(shown.indexOf(target)).check()
    if (isWrong) wrong++
    if (n === 3) await page.getByRole('button', { name: 'À revoir' }).click()
    await page.getByRole('button', { name: n < 40 ? 'Question suivante' : 'Terminer l’examen' }).click()
  }
  expect(wrong).toBe(10)
  const sheet = page.getByRole('dialog', { name: 'Terminer l’examen ?' })
  await expect(sheet.getByText('40 / 40')).toBeVisible()
  await sheet.getByRole('button', { name: 'Terminer' }).click()

  // Results and revision plan.
  await expect(page.getByRole('heading', { level: 1, name: 'Encore 2 bonnes réponses' })).toBeVisible()
  await expect(page.getByRole('img', { name: '30 bonnes réponses sur 40' })).toBeVisible()
  const themes = page.getByRole('region', { name: 'Par thématique' })
  await expect(themes.getByText('À renforcer')).toHaveCount(2)
  const plan = page.getByRole('region', { name: 'Votre plan de révision' })
  await expect(plan.getByRole('link', { name: /^Revoir mes 10 erreurs/ })).toBeVisible()
  const firstLesson = plan.getByRole('link').first()
  await expect(firstLesson).toHaveAttribute('href', /^#\/lecon\/(institutions|societe)\//)

  // Open the first planned lesson and read it to the end.
  await firstLesson.click()
  await expect(page.getByRole('heading', { level: 2, name: 'À retenir' })).toBeAttached()
  const title = normalize(await page.getByRole('heading', { level: 1 }).innerText())
  await page.getByRole('heading', { level: 2, name: 'Sources' }).scrollIntoViewIfNeeded()
  await page.getByRole('link', { name: 'Retour' }).click()
  await expect(page.getByRole('listitem').filter({ hasText: title })).toContainText('Lue')

  // Back to the results (lesson, then results), then the cards of the 10 missed questions.
  await page.goBack()
  await page.goBack()
  await page.getByRole('region', { name: 'Votre plan de révision' }).getByRole('link', { name: /^Revoir mes 10 erreurs/ }).click()
  for (let n = 1; n <= 10; n++) {
    await expect(page.getByLabel(`Carte ${n} sur 10`)).toBeVisible()
    await page.getByRole('button', { name: 'Voir la réponse' }).click()
    await page.getByRole('button', { name: n === 1 ? /^Non/ : /^Oui/ }).click()
  }
  await expect(page.getByRole('heading', { level: 1, name: 'Bravo, plus de cartes pour aujourd’hui' })).toBeVisible()
  await expect(page.getByText('Vous avez revu 10 cartes.')).toBeVisible()
  await page.getByRole('link', { name: 'Retour à l’accueil' }).click()

  // Progress shows the exam.
  await expect(page.getByRole('heading', { level: 1, name: 'Bonjour Awa' })).toBeVisible()
  await expect(page.getByText('Dernier examen blanc : 30/40')).toBeVisible()
  await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: 'Progrès' }).click()
  await expect(page.getByRole('img', { name: 'Score du dernier examen blanc : 30 sur 40. Seuil de réussite 32.' })).toBeVisible()
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  await expect(page.getByRole('link', { name: new RegExp(`${today}.*Non réussi.*30/40`) })).toBeVisible()

  // Offline: the service worker serves the app shell and its content.
  expect(await page.evaluate(async () => (await navigator.serviceWorker.ready).active !== null)).toBe(true)
  await context.setOffline(true)
  const response = await page.reload()
  expect(response?.fromServiceWorker()).toBe(true)
  await expect(page.getByRole('heading', { level: 1, name: 'Votre progression' })).toBeVisible()
  await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: 'Leçons' }).click()
  await page.getByRole('link', { name: /^Principes et valeurs/ }).click()
  await page.getByRole('link', { name: /définition et histoire/ }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'À retenir' })).toBeAttached()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('La laïcité')
})
