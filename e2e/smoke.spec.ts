import { expect, test } from '@playwright/test'

test('affiche l’accueil', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1, name: 'Accueil' })).toBeVisible()
  await expect(page).toHaveTitle('Civique - examen carte de résident')
})
