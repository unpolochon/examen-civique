import { expect, test } from '@playwright/test'
import { appData, seed, stored } from './helpers'

test('lire une leçon la marque lue, puis « Me tester » ouvre ses cartes', async ({ page }) => {
  await seed(page, appData(), '#/lecons')
  await expect(page.getByRole('heading', { level: 1, name: 'Leçons' })).toBeVisible()
  const tile = page.getByRole('link', { name: /^Institutions et politique/ })
  await expect(tile).toContainText('0/7 leçons lues')
  await tile.click()

  await expect(page).toHaveURL(/#\/lecons\/institutions$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Institutions et politique' })).toBeVisible()
  await expect(page.getByText('0/7 leçons lues')).toBeVisible()
  const card = page.getByRole('link', { name: /^État de droit et séparation des pouvoirs/ })
  await expect(card).toContainText(/\d+ min · Démocratie et droit de vote/)
  await expect(card).not.toContainText('Lue')
  await card.click()

  await expect(page).toHaveURL(/#\/lecon\/institutions\/etat-de-droit$/)
  await expect(page.getByRole('heading', { level: 1, name: 'État de droit et séparation des pouvoirs' })).toBeVisible()
  await expect(page.getByText('Institutions et politique · Leçon 2 sur 7')).toBeVisible()
  await expect(page.getByText(/^\d+ min de lecture$/)).toBeVisible()
  await expect(page.getByText(/^\d+ questions? officielles?$/)).toBeVisible()
  await expect(page.getByRole('region', { name: 'Tableau' }).getByRole('table')).toBeVisible()
  await expect(page.getByRole('link', { name: /^Fiche officielle/ }).first()).toHaveAttribute('target', '_blank')
  expect((await stored(page)).lessonsRead).toEqual([])

  await page.getByRole('region', { name: 'À retenir' }).scrollIntoViewIfNeeded()
  await expect.poll(async () => (await stored(page)).lessonsRead).toEqual(['institutions/etat-de-droit'])

  await page.getByRole('link', { name: 'Retour' }).click()
  await expect(page).toHaveURL(/#\/lecons\/institutions$/)
  await expect(card).toContainText('Lue')
  await expect(page.getByText('1/7 leçons lues')).toBeVisible()

  await card.click()
  await page.getByRole('link', { name: 'Me tester sur cette leçon' }).click()
  await expect(page).toHaveURL(/#\/cartes\?lecon=institutions%2Fetat-de-droit$/)
})

test('la leçon suivante s’ouvre en haut et n’est pas marquée lue', async ({ page }) => {
  await seed(page, appData(), '#/lecon/institutions/democratie-et-republique')
  await expect(page.getByRole('link', { name: /^Leçon précédente/ })).toHaveCount(0)
  await page.getByRole('region', { name: 'À retenir' }).scrollIntoViewIfNeeded()
  await expect.poll(async () => (await stored(page)).lessonsRead).toEqual(['institutions/democratie-et-republique'])
  await page.getByRole('link', { name: /^Leçon suivante/ }).click()

  await expect(page).toHaveURL(/#\/lecon\/institutions\/etat-de-droit$/)
  await expect(page.getByRole('heading', { level: 1, name: 'État de droit et séparation des pouvoirs' })).toBeInViewport()
  await expect(page.getByRole('link', { name: /^Leçon précédente Démocratie/ })).toBeAttached()
  // Give the observer a few frames: the next lesson, opened at the top, stays unread.
  await page.waitForTimeout(300)
  expect((await stored(page)).lessonsRead).toEqual(['institutions/democratie-et-republique'])
})

test('une leçon inconnue affiche un message', async ({ page }) => {
  await seed(page, appData(), '#/lecon/institutions/inconnue')
  await expect(page.getByRole('heading', { level: 1, name: 'Leçon introuvable' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Retour aux leçons' })).toHaveAttribute('href', '#/lecons')
})
