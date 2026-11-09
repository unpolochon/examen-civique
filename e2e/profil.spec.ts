import { expect, test } from '@playwright/test'
import { seed, stored } from './helpers'

test('première ouverture : le profil est créé puis conservé après rechargement', async ({ page }) => {
  await page.goto('./#/cartes')
  await expect(page).toHaveURL(/#\/bienvenue$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Préparez l’examen civique de la carte de résident' })).toBeVisible()
  await expect(page.getByRole('navigation')).toHaveCount(0)

  // A blank first name is refused.
  await page.getByLabel('Votre prénom').fill('   ')
  await page.getByRole('button', { name: 'Commencer' }).click()
  await expect(page.getByText('Indiquez votre prénom pour commencer.')).toBeVisible()
  await expect(page.getByLabel('Votre prénom')).toHaveAttribute('aria-invalid', 'true')
  expect(await stored(page)).toBeNull()

  await page.getByLabel('Votre prénom').fill('  Amina ')
  await page.getByLabel('Date de votre examen (facultatif)').fill('2030-03-14')
  await page.getByRole('button', { name: 'Commencer' }).click()
  await expect(page).toHaveURL(/#\/$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Bonjour Amina' })).toBeVisible()
  await expect(page.getByText(/^Examen le 14 mars 2030 · dans \d+ jours$/)).toBeVisible()
  expect((await stored(page)).profile).toMatchObject({ firstName: 'Amina', examDate: '2030-03-14' })

  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Bonjour Amina' })).toBeVisible()

  // With a profile, the first-launch screen leads back home.
  await page.goto('./#/bienvenue')
  await expect(page).toHaveURL(/#\/$/)
})

test('sans date d’examen, la ligne de date est absente', async ({ page }) => {
  await page.goto('./')
  await page.getByLabel('Votre prénom').fill('Lin')
  await page.getByRole('button', { name: 'Commencer' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Bonjour Lin' })).toBeVisible()
  await expect(page.getByText(/^Examen (le|aujourd|passé)/)).toHaveCount(0)
})

test('un profil enregistré ouvre directement l’accueil', async ({ page }) => {
  await seed(page, undefined, '#/bienvenue')
  await expect(page).toHaveURL(/#\/$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Bonjour Paul' })).toBeVisible()
})
