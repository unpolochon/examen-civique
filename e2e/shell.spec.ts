import { expect, test } from '@playwright/test'

test('la barre de navigation change d’écran et d’élément actif', async ({ page }) => {
  await page.goto('./')
  const nav = page.getByRole('navigation', { name: 'Navigation principale' })

  for (const [label, title, hash] of [
    ['Leçons', 'Leçons', '#/lecons'],
    ['Cartes', 'Cartes', '#/cartes'],
    ['Progrès', 'Progrès', '#/progres'],
    ['Accueil', 'Accueil', '#/'],
  ]) {
    await nav.getByRole('link', { name: label }).click()
    await expect(page).toHaveURL(new RegExp(`${hash}$`))
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
    await expect(nav.locator('[aria-current="page"]')).toHaveText(label)
  }
})

test('la barre est absente hors des écrans principaux et ne masque pas le contenu', async ({ page }) => {
  await page.goto('./#/reglages')
  await expect(page.getByRole('heading', { level: 1, name: 'Réglages' })).toBeVisible()
  await expect(page.getByRole('navigation')).toHaveCount(0)

  // The reserved bottom padding covers everything from the top of the nav to the bottom of the viewport.
  await page.goto('./#/progres')
  const navTop = (await page.getByRole('navigation').boundingBox())!.y
  const viewportHeight = page.viewportSize()!.height
  const paddingBottom = parseFloat(await page.evaluate<string>('getComputedStyle(document.querySelector("main")).paddingBottom'))
  expect(paddingBottom).toBeGreaterThanOrEqual(viewportHeight - navTop)
})
