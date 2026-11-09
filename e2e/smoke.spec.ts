import { expect, test } from '@playwright/test'
import { seed } from './helpers'

test('affiche l’accueil quand un profil existe', async ({ page }) => {
  await seed(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Bonjour Paul' })).toBeVisible()
  await expect(page).toHaveTitle('Civique - examen carte de résident')
})

test('installable sur iPhone : manifest, icônes et balises Apple', async ({ page, request }) => {
  await page.goto('./')
  const head = page.locator('head')
  await expect(head.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', './apple-touch-icon.png')
  await expect(head.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes')
  await expect(head.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute('content', 'default')
  await expect(head.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content', 'Civique')

  const manifest = await (await request.get(await head.locator('link[rel="manifest"]').getAttribute('href') ?? '')).json()
  expect(manifest).toMatchObject({ name: 'Civique - examen carte de résident', short_name: 'Civique', start_url: './', scope: './', display: 'standalone' })
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ src: 'icon-192.png', sizes: '192x192' }),
      expect.objectContaining({ src: 'icon-512.png', sizes: '512x512' }),
      expect.objectContaining({ src: 'icon-maskable-512.png', sizes: '512x512', purpose: 'maskable' }),
    ]),
  )
  for (const src of [...manifest.icons.map((i: { src: string }) => i.src), 'apple-touch-icon.png']) {
    expect((await request.get(src)).headers()['content-type'], src).toBe('image/png')
  }
})
