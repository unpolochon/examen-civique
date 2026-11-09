import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { appData, finishedExam, seed, stored } from './helpers'

test('modifier le prénom et la date est enregistré aussitôt', async ({ page }) => {
  await seed(page, undefined, '#/reglages')
  const name = page.getByLabel('Prénom')
  await expect(name).toHaveValue('Paul')

  await name.fill('')
  await expect(page.getByText('Le prénom ne peut pas être vide.')).toBeVisible()
  expect((await stored(page)).profile.firstName).toBe('Paul')

  await name.fill('Jean Marc ')
  await page.getByLabel("Date de l'examen").fill('2030-01-20')
  expect((await stored(page)).profile).toMatchObject({ firstName: 'Jean Marc', examDate: '2030-01-20' })

  await page.reload()
  await expect(page.getByLabel('Prénom')).toHaveValue('Jean Marc')
  await expect(page.getByLabel("Date de l'examen")).toHaveValue('2030-01-20')

  await page.getByRole('link', { name: 'Retour' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Bonjour Jean Marc' })).toBeVisible()
  await expect(page.getByText(/^Examen le 20 janv\. 2030 · dans \d+ jours$/)).toBeVisible()
})

test('exporter télécharge toutes les données dans un fichier daté', async ({ page }) => {
  const data = appData({ exams: [finishedExam(27)] })
  await seed(page, data, '#/reglages')
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exporter' }).click()])
  expect(download.suggestedFilename()).toMatch(/^civique-sauvegarde-\d{4}-\d{2}-\d{2}\.json$/)
  expect(JSON.parse(await readFile((await download.path())!, 'utf8'))).toEqual(data)
})

test('importer remplace les données après confirmation', async ({ page }) => {
  await seed(page, undefined, '#/reglages')
  const backup = appData({ profile: { firstName: 'Sofia', examDate: '2030-02-02', createdAt: '2026-10-01T08:00:00.000Z' }, exams: [finishedExam(30)] })
  const file = { name: 'sauvegarde.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) }

  // Cancel keeps the current data.
  await page.getByLabel('Fichier de sauvegarde à importer').setInputFiles(file)
  const dialog = page.getByRole('dialog', { name: 'Remplacer vos données ?' })
  await expect(dialog).toContainText('profil de Sofia, 1 examen terminé')
  await dialog.getByRole('button', { name: 'Annuler' }).click()
  await expect(dialog).toHaveCount(0)
  expect((await stored(page)).profile.firstName).toBe('Paul')

  await page.getByLabel('Fichier de sauvegarde à importer').setInputFiles(file)
  await page.getByRole('dialog').getByRole('button', { name: 'Remplacer' }).click()
  await expect(page.getByRole('status')).toHaveText('Données importées.')
  await expect(page.getByLabel('Prénom')).toHaveValue('Sofia')
  expect(await stored(page)).toEqual(backup)
})

test('un fichier invalide affiche une erreur et ne change rien', async ({ page }) => {
  await seed(page, undefined, '#/reglages')
  await page.getByLabel('Fichier de sauvegarde à importer').setInputFiles({ name: 'photo.json', mimeType: 'application/json', buffer: Buffer.from('pas du json') })
  await expect(page.getByRole('alert')).toHaveText("Ce fichier n'est pas une sauvegarde Civique (JSON illisible).")
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect((await stored(page)).profile.firstName).toBe('Paul')
})

test('effacer toutes les données ramène à la première ouverture', async ({ page }) => {
  await seed(page, undefined, '#/reglages')
  await page.getByRole('button', { name: 'Effacer toutes mes données' }).click()
  const dialog = page.getByRole('dialog', { name: 'Effacer toutes vos données ?' })
  await dialog.getByRole('button', { name: 'Annuler' }).click()
  expect(await stored(page)).not.toBeNull()

  await page.getByRole('button', { name: 'Effacer toutes mes données' }).click()
  await dialog.getByRole('button', { name: 'Tout effacer' }).click()
  await expect(page).toHaveURL(/#\/bienvenue$/)
  await expect(page.getByLabel('Votre prénom')).toHaveValue('')
  expect(await stored(page)).toBeNull()
})

test('le conseil d’installation est affiché hors de l’app installée', async ({ page }) => {
  await seed(page, undefined, '#/reglages')
  await expect(page.getByText(/Sur iPhone, touchez Partager/)).toBeVisible()
})
