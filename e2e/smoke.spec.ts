import { expect, test } from '@playwright/test'

test('affiche le titre de l’app', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1, name: 'Civique' })).toBeVisible()
  await expect(page).toHaveTitle('Civique - examen carte de résident')
})
