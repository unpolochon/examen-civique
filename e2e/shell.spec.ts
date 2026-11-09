import { expect, test } from '@playwright/test'
import { seed } from './helpers'

test('la barre de navigation change d’écran et d’élément actif', async ({ page }) => {
  await seed(page)
  const nav = page.getByRole('navigation', { name: 'Navigation principale' })

  for (const [label, title, hash] of [
    ['Leçons', 'Leçons', '#/lecons'],
    ['Progrès', 'Votre progression', '#/progres'],
    ['Accueil', 'Bonjour Paul', '#/'],
  ]) {
    await nav.getByRole('link', { name: label }).click()
    await expect(page).toHaveURL(new RegExp(`${hash}$`))
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
    await expect(nav.locator('[aria-current="page"]')).toHaveText(label)
  }

  // Cartes is full screen: no bar, a close button back home.
  await nav.getByRole('link', { name: 'Cartes' }).click()
  await expect(page).toHaveURL(/#\/cartes$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Aucune carte à revoir' })).toBeVisible()
  await expect(page.getByRole('navigation')).toHaveCount(0)
  await page.getByRole('link', { name: 'Fermer les cartes' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Bonjour Paul' })).toBeVisible()
})

test('la barre est absente hors des écrans principaux et ne masque pas le contenu', async ({ page }) => {
  await seed(page, undefined, '#/reglages')
  await expect(page.getByRole('heading', { level: 1, name: 'Réglages' })).toBeVisible()
  await expect(page.getByRole('navigation')).toHaveCount(0)

  // The reserved bottom padding covers everything from the top of the nav to the bottom of the viewport.
  await page.goto('./#/progres')
  const navTop = (await page.getByRole('navigation').boundingBox())!.y
  const viewportHeight = page.viewportSize()!.height
  const paddingBottom = parseFloat(await page.evaluate<string>('getComputedStyle(document.querySelector("main")).paddingBottom'))
  expect(paddingBottom).toBeGreaterThanOrEqual(viewportHeight - navTop)
})
