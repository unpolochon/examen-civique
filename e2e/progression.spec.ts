import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { appData, finishedExam, seed } from './helpers'

test.use({ timezoneId: 'Europe/Paris' })

const idsOf = (theme: string): string[] => JSON.parse(readFileSync(`content/questions/${theme}.json`, 'utf8')).map((q: { id: string }) => q.id)
const days = ['09-21', '09-28', '10-05', '10-12', '10-19', '10-26', '11-02']
const scores = [15, 18, 21, 24, 25, 27, 33]
const exams = days.map((d, i) => finishedExam(scores[i], `2026-${d}T10:45:00.000Z`))

test('les derniers examens, la maîtrise par thématique et l’historique', async ({ page }) => {
  const societe = idsOf('societe')
  const cards = Object.fromEntries([
    ...idsOf('institutions').map((id) => [id, { level: 3, due: '2030-01-01T00:00:00.000Z' }]),
    ...societe.slice(0, societe.length / 2).map((id) => [id, { level: 5, due: '2030-01-01T00:00:00.000Z' }]),
    ...idsOf('principes').map((id) => [id, { level: 2, due: '2030-01-01T00:00:00.000Z' }]), // below mastery
  ])
  await seed(page, appData({ exams, cards }), '#/progres')

  await expect(page.getByRole('heading', { level: 1, name: 'Votre progression' })).toBeVisible()
  const chart = page.getByRole('region', { name: 'Examens blancs' })
  await expect(chart.getByRole('img')).toHaveAccessibleName(
    'Scores des 6 derniers examens blancs : 18, 21, 24, 25, 27 et 33 sur 40. Seuil de réussite 32.',
  )
  await expect(chart.getByText('+15 en 5 semaines')).toBeVisible()
  await expect(chart.getByText('32 pour réussir')).toBeVisible()
  const bars = chart.locator('.progression__bar')
  await expect(bars).toHaveCount(6)
  await expect(bars.first()).toHaveAttribute('style', 'height: 45%;')
  await expect(bars.last()).toHaveAttribute('style', 'height: 82.5%;')
  await expect(bars.last()).toHaveClass(/progression__bar--latest/)
  await expect(chart.locator('.progression__labels > span')).toHaveText(['28 sept.18', '5 oct.21', '12 oct.24', '19 oct.25', '26 oct.27', '2 nov.33'])

  await expect(page.locator('.progression__tile')).toHaveText([
    '100 %Institutions',
    '50 %Vivre dans la société',
    '0 %Principes et valeurs',
    '0 %Droits et devoirs',
    '0 %Histoire, géographie',
    'Refaireun examen blanc',
  ])

  // History: every exam, oldest first.
  const rows = page.locator('.progression__history a')
  await expect(rows).toHaveCount(7)
  await expect(rows.first()).toHaveText(/21 septembre 2026Non réussi15\/40/)
  await expect(rows.last()).toHaveText(/2 novembre 2026Réussi33\/40/)
  await expect(rows.last()).toHaveAttribute('href', `#/resultats/${encodeURIComponent(exams[6].id)}`)

  await page.getByRole('link', { name: 'Refaire un examen blanc' }).click()
  await expect(page).toHaveURL(/#\/examen$/)
})

test('un seul examen : pas d’évolution affichée', async ({ page }) => {
  await seed(page, appData({ exams: [exams[5]] }), '#/progres')
  const chart = page.getByRole('region', { name: 'Examens blancs' })
  await expect(chart.getByRole('img')).toHaveAccessibleName('Score du dernier examen blanc : 27 sur 40. Seuil de réussite 32.')
  await expect(chart.locator('.progression__delta')).toHaveCount(0)
  await expect(chart.locator('.progression__bar')).toHaveCount(1)
})

test('sans examen, la page invite à en passer un', async ({ page }) => {
  await seed(page, appData(), '#/progres')
  await expect(page.getByRole('heading', { name: 'Pas encore d’examen blanc' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Faire un examen blanc' })).toHaveAttribute('href', '#/examen')
  await expect(page.getByRole('img')).toHaveCount(0)
})
