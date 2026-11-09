import { expect, test } from '@playwright/test'
import { seed } from './helpers'

test('affiche l’accueil quand un profil existe', async ({ page }) => {
  await seed(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Bonjour Paul' })).toBeVisible()
  await expect(page).toHaveTitle('Civique - examen carte de résident')
})
