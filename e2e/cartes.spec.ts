import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { appData, seed, stored } from './helpers'

type Q = { id: string; lesson: string; question: string; choices: string[]; answer: number }
const bank: Q[] = ['institutions', 'principes', 'droits'].flatMap((t) => JSON.parse(readFileSync(`content/questions/${t}.json`, 'utf8')))
const byId = (id: string) => bank.find((q) => q.id === id)!

const HOUR = 3_600_000
const ago = (ms: number) => new Date(Date.now() - ms).toISOString()
const counter = (page: Page) => page.locator('.cartes__counter')

test('les cartes dues se révèlent, se notent et sont enregistrées', async ({ page }) => {
  await seed(
    page,
    appData({
      cards: {
        'CR-001': { level: 2, due: ago(HOUR) },
        'CR-041': { level: 0, due: ago(2 * HOUR) }, // due first
        'CR-100': { level: 1, due: new Date(Date.now() + 24 * HOUR).toISOString() }, // not due
        'question-retiree': { level: 0, due: ago(HOUR) }, // no longer in the content
      },
    }),
    '#/cartes',
  )
  const first = byId('CR-041')
  await expect(page.getByText('Cartes du jour')).toBeVisible()
  await expect(counter(page)).toHaveText('1 / 2')
  await expect(counter(page)).toHaveAttribute('aria-label', 'Carte 1 sur 2')
  await expect(page.getByRole('heading', { level: 1, name: first.question })).toBeVisible()
  await expect(page.getByText('Institutions et politique')).toBeVisible()
  await expect(page.getByText(first.choices[first.answer])).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Oui/ })).toHaveCount(0)

  await page.getByRole('button', { name: 'Voir la réponse' }).click()
  await expect(page.getByText(first.choices[first.answer])).toBeVisible()
  await expect(page.getByRole('link', { name: 'Relire la leçon « État de droit et séparation des pouvoirs »' })).toHaveAttribute(
    'href',
    '#/lecon/institutions/etat-de-droit',
  )
  const grades = page.getByRole('group', { name: 'Vous la connaissiez ?' })
  await expect(grades.getByRole('button')).toHaveText(['Nondans 10 min', 'Hésitédans 10 min', 'Ouidemain'])
  await grades.getByRole('button', { name: /^Oui/ }).click()

  const second = byId('CR-001')
  await expect(counter(page)).toHaveText('2 / 2')
  await expect(page.getByRole('heading', { level: 1, name: second.question })).toBeFocused()
  let cards = (await stored(page)).cards
  expect(cards['CR-041'].level).toBe(1)
  expect(Date.parse(cards['CR-041'].due) - Date.now()).toBeGreaterThan(23 * HOUR)

  await page.getByRole('button', { name: 'Voir la réponse' }).click()
  await expect(grades.getByRole('button')).toHaveText(['Nondans 10 min', 'Hésitédans 3 jours', 'Ouidans 7 jours'])
  await grades.getByRole('button', { name: /^Non/ }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Bravo, plus de cartes pour aujourd’hui' })).toBeVisible()
  await expect(page.getByText('Vous avez revu 2 cartes.')).toBeVisible()
  await expect(page.locator('.cartes__count')).toHaveText(['1Non', '0Hésité', '1Oui'])
  cards = (await stored(page)).cards
  expect(cards['CR-001'].level).toBe(0)
  expect(cards['CR-100'].level).toBe(1)

  // Nothing is due any more after a reload.
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Aucune carte à revoir' })).toBeVisible()
  await expect(page.getByText('Vos prochaines cartes ne sont pas encore dues.', { exact: false })).toBeVisible()
  await page.getByRole('link', { name: 'Fermer les cartes' }).click()
  await expect(page).toHaveURL(/#\/$/)
})

test('le mode leçon montre toutes les questions de la leçon, dues ou non', async ({ page }) => {
  const lesson = 'institutions/democratie-et-republique'
  const ids = bank.filter((q) => q.lesson === lesson).map((q) => q.id)
  expect(ids.length).toBeGreaterThan(0)
  await seed(page, appData({ cards: { [ids[0]]: { level: 3, due: new Date(Date.now() + 99 * 24 * HOUR).toISOString() } } }), `#/cartes?lecon=${encodeURIComponent(lesson)}`)

  await expect(page.getByText('Cartes de la leçon')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Fermer les cartes' })).toHaveAttribute('href', `#/lecon/${lesson}`)
  for (const [i, id] of ids.entries()) {
    await expect(counter(page)).toHaveText(`${i + 1} / ${ids.length}`)
    await expect(page.getByRole('heading', { level: 1, name: byId(id).question })).toBeVisible()
    await page.getByRole('button', { name: 'Voir la réponse' }).click()
    await page.getByRole('button', { name: /^Oui/ }).click()
  }
  await expect(page.getByRole('heading', { level: 1, name: 'Bravo, toutes les cartes de la leçon sont revues' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Revenir à la leçon' })).toHaveAttribute('href', `#/lecon/${lesson}`)
  const cards = (await stored(page)).cards
  expect(cards[ids[0]].level).toBe(4)
  for (const id of ids.slice(1)) expect(cards[id].level).toBe(1)
})

test('sans carte due, l’écran propose un examen blanc ou une leçon', async ({ page }) => {
  await seed(page, appData(), '#/cartes')
  await expect(page.getByRole('heading', { level: 1, name: 'Aucune carte à revoir' })).toBeVisible()
  await expect(page.getByText('Les erreurs de vos examens blancs deviennent des cartes à revoir.', { exact: false })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Faire un examen blanc' })).toHaveAttribute('href', '#/examen')
  await expect(page.getByRole('link', { name: 'Voir les leçons' })).toHaveAttribute('href', '#/lecons')
  await expect(page.getByRole('navigation')).toHaveCount(0)
})

test('une leçon inconnue n’a pas de carte', async ({ page }) => {
  await seed(page, appData(), '#/cartes?lecon=inconnue%2Fleçon')
  await expect(page.getByRole('heading', { level: 1, name: 'Aucune carte pour cette leçon' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Voir les leçons' })).toHaveAttribute('href', '#/lecons')
})
