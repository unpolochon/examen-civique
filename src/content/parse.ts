import type { Lesson, NotionId, Theme } from '../domain/types.ts'

/**
 * Parses a lesson file: a fixed front matter (`key: value` lines and a
 * `sources:` list of `  - url` lines) between two `---` lines, then the
 * Markdown body. Throws a French message when the format is not respected.
 * Theme and notion values are checked by the validator, not here.
 */
export function parseLesson(text: string): Lesson {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text.replace(/\r\n/g, '\n'))
  if (!match) throw new Error('en-tête manquant (bloc entre deux lignes ---)')
  const fields: Record<string, string> = {}
  const sources: string[] = []
  let inSources = false
  for (const line of match[1].split('\n')) {
    if (!line.trim()) continue
    const item = /^\s+-\s+(.+)$/.exec(line)
    if (item && inSources) {
      sources.push(item[1].trim())
      continue
    }
    const pair = /^([a-z]+):\s*(.*)$/.exec(line)
    if (!pair) throw new Error(`ligne d'en-tête illisible : « ${line} »`)
    inSources = pair[1] === 'sources'
    if (!inSources) fields[pair[1]] = pair[2].trim().replace(/^"(.*)"$/, '$1')
  }
  for (const key of ['id', 'theme', 'notion', 'title', 'minutes', 'order']) {
    if (!fields[key]) throw new Error(`champ « ${key} » manquant dans l'en-tête`)
  }
  const minutes = Number(fields.minutes)
  const order = Number(fields.order)
  if (!Number.isInteger(minutes) || minutes <= 0) throw new Error('« minutes » doit être un entier positif')
  if (!Number.isInteger(order)) throw new Error('« order » doit être un entier')
  return {
    id: fields.id,
    theme: fields.theme as Theme,
    notion: fields.notion as NotionId,
    title: fields.title,
    minutes,
    order,
    sources,
    body: match[2].trim(),
  }
}
