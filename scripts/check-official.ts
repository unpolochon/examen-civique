// Compares data/official/cr-questions.json with the official CR list (npm run check:official).
// Exit 1 on any difference with the official page; data.gouv differences are warnings only.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export type Question = { theme: string; question: string }

const PAGE_URL = 'https://formation-civique.interieur.gouv.fr/examen-civique/liste-officielle-des-questions-de-connaissance-cr/'
const DATASET_URL = 'https://www.data.gouv.fr/api/1/datasets/examen-civique-cr/'
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

const THEMES: Record<string, string> = {
  'principes et valeurs de la république': 'principes',
  'système institutionnel et politique': 'institutions',
  'droits et devoirs': 'droits',
  'histoire géographie et culture': 'histoire',
  'vivre dans la société française': 'societe',
}

export const normalize = (text: string) =>
  text.normalize('NFKC').toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim()

function themeId(heading: string) {
  const id = THEMES[normalize(heading).replace(/ :$/, '')]
  if (!id) throw new Error(`Thématique inconnue : « ${heading} »`)
  return id
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
const text = (html: string) =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (entity, code: string) =>
      code[0] === '#' ? String.fromCodePoint(Number(code.slice(1).replace(/^x/i, '0x'))) : (ENTITIES[code] ?? entity),
    )
    .trim()

/** Questions of the official page: `<li>` items following a `<p>` heading that ends with " :", up to the footer. */
export function parseOfficialPage(html: string): Question[] {
  const main = html.split(/<footer\b/i)[0]
  const questions: Question[] = []
  let theme: string | undefined
  for (const [, tag, inner] of main.matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const content = text(inner)
    if (tag.toLowerCase() === 'p') {
      theme = content.endsWith(' :') ? themeId(content) : undefined
    } else if (theme) {
      questions.push({ theme, question: content })
    }
  }
  return questions
}

type Dataset = { data: { theme: string; questions: { question: string }[] }[] }
export const parseDataset = (json: Dataset): Question[] =>
  json.data.flatMap((group) => group.questions.map((q) => ({ theme: themeId(group.theme), question: q.question.trim() })))

/** Questions present in `source` but not in `local` (added) and the reverse (removed). */
export function compare(local: Question[], source: Question[]) {
  const key = (q: Question) => `${q.theme}|${normalize(q.question)}`
  const localKeys = new Set(local.map(key))
  const sourceKeys = new Set(source.map(key))
  return {
    added: source.filter((q) => !localKeys.has(key(q))),
    removed: local.filter((q) => !sourceKeys.has(key(q))),
  }
}

async function get(url: string) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`${url} : HTTP ${res.status}`)
  return res
}

function report(label: string, local: Question[], source: Question[]) {
  const { added, removed } = compare(local, source)
  console.log(`${label} : ${source.length} questions, ${added.length} ajoutée(s), ${removed.length} retirée(s)`)
  for (const q of added) console.log(`  + [${q.theme}] ${q.question}`)
  for (const q of removed) console.log(`  - [${q.theme}] ${q.question}`)
  return added.length + removed.length
}

if (import.meta.main) {
  const file = join(import.meta.dirname, '../data/official/cr-questions.json')
  const local: Question[] = JSON.parse(readFileSync(file, 'utf8')).questions
  console.log(`data/official/cr-questions.json : ${local.length} questions`)

  const page = parseOfficialPage(await (await get(PAGE_URL)).text())
  const pageDiffs = report('Page officielle', local, page)

  try {
    const dataset = (await (await get(DATASET_URL)).json()) as { resources: { format: string; url: string }[] }
    const resource = dataset.resources.find((r) => r.format === 'json')
    if (!resource) throw new Error('aucune ressource JSON dans le jeu de données')
    if (report('data.gouv', local, parseDataset((await (await get(resource.url)).json()) as Dataset))) {
      console.warn('Avertissement : data.gouv diffère de la liste locale.')
    }
  } catch (error) {
    console.warn(`Avertissement : data.gouv indisponible (${(error as Error).message})`)
  }

  if (pageDiffs) console.error('La page officielle diffère de data/official/cr-questions.json.')
  process.exit(pageDiffs ? 1 : 0)
}
