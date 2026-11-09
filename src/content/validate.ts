import { EXAM_GRID, NOTIONS, THEMES, type Lesson, type NotionId, type Theme } from '../domain/types.ts'
import { parseLesson } from './parse.ts'

export interface OfficialQuestion {
  id: string
  theme: string
}

/**
 * Checks the whole content folder and returns every error found (empty when valid).
 * `files` maps a path relative to content/ (e.g. "questions/principes.json") to its text.
 * Pure function: the Node script and the Vitest test only differ in how they read files.
 */
export function validateContent(files: Record<string, string>, official: OfficialQuestion[]): string[] {
  const errors: string[] = []
  const lessons = new Map<string, Lesson>()
  const questions: { file: string; q: Record<string, unknown> }[] = []

  for (const [path, text] of Object.entries(files)) {
    text.split('\n').forEach((line, i) => {
      if (line.includes('\u2014')) errors.push(`${path}:${i + 1} : tiret cadratin interdit, utiliser « - »`)
    })

    const lessonPath = /^lessons\/([^/]+)\/(.+)\.md$/.exec(path)
    if (lessonPath) {
      let lesson: Lesson
      try {
        lesson = parseLesson(text)
      } catch (e) {
        errors.push(`${path} : ${(e as Error).message}`)
        continue
      }
      const at = `${path} (${lesson.id})`
      if (lesson.id !== `${lessonPath[1]}/${lessonPath[2]}`) errors.push(`${at} : l’id doit être « ${lessonPath[1]}/${lessonPath[2]} »`)
      if (lesson.theme !== lessonPath[1] || !THEMES.includes(lesson.theme)) errors.push(`${at} : thème « ${lesson.theme} » invalide`)
      if (!isNotionOf(lesson.notion, lesson.theme)) errors.push(`${at} : notion « ${lesson.notion} » invalide pour le thème`)
      if (lesson.sources.length === 0) errors.push(`${at} : au moins une source est requise`)
      if (!/^## À retenir$/m.test(lesson.body)) errors.push(`${at} : section « ## À retenir » manquante`)
      if (lessons.has(lesson.id)) errors.push(`${at} : id de leçon en double`)
      lessons.set(lesson.id, lesson)
      continue
    }

    const questionPath = /^questions\/([^/]+)\.json$/.exec(path)
    if (questionPath) {
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch (e) {
        errors.push(`${path} : JSON invalide (${(e as Error).message})`)
        continue
      }
      if (!THEMES.includes(questionPath[1] as Theme)) errors.push(`${path} : nom de fichier hors des 5 thèmes`)
      if (!Array.isArray(parsed)) {
        errors.push(`${path} : le fichier doit contenir un tableau de questions`)
        continue
      }
      for (const q of parsed) {
        if (typeof q === 'object' && q !== null) questions.push({ file: questionPath[1], q })
        else errors.push(`${path} : élément qui n’est pas une question`)
      }
    }
  }

  const officialIds = new Set(official.map((o) => o.id))
  const seen = new Set<string>()
  const byNotion = new Map<string, number>()
  const themesWithContent = new Set<string>()
  for (const { file, q } of questions) {
    const at = `questions/${file}.json (${String(q.id)})`
    const err = (msg: string) => errors.push(`${at} : ${msg}`)
    if (typeof q.id !== 'string' || !q.id) err('id manquant')
    else if (seen.has(q.id)) err('id en double')
    else seen.add(q.id)
    if (q.theme !== file) err(`thème « ${String(q.theme)} » différent du fichier`)
    themesWithContent.add(file)
    if (q.type !== 'connaissance' && q.type !== 'situation') err('type doit être « connaissance » ou « situation »')
    if (typeof q.official !== 'boolean') err('official doit être true ou false')
    for (const key of ['question', 'explanation'] as const) {
      if (typeof q[key] !== 'string' || !q[key].trim()) err(`${key} manquant`)
    }
    const choices = q.choices
    if (!Array.isArray(choices) || choices.length !== 4 || !choices.every((c) => typeof c === 'string' && c.trim())) {
      err('il faut exactement 4 choix non vides')
    } else if (new Set(choices.map((c: string) => c.trim().toLowerCase())).size !== 4) {
      err('les 4 choix doivent être distincts')
    }
    if (!Number.isInteger(q.answer) || (q.answer as number) < 0 || (q.answer as number) > 3) err('answer doit être 0, 1, 2 ou 3')
    if (!isNotionOf(q.notion, q.theme)) err(`notion « ${String(q.notion)} » invalide pour le thème`)
    else byNotion.set(q.notion, (byNotion.get(q.notion) ?? 0) + 1)
    const situationNotion = typeof q.notion === 'string' && q.notion.endsWith('.situations')
    if (q.type === 'situation' && !situationNotion) err('une mise en situation doit avoir une notion *.situations')
    if (q.type === 'connaissance' && situationNotion) err('une notion *.situations est réservée aux mises en situation')
    if (q.type === 'situation' && q.official !== false) err('une mise en situation doit avoir official: false')
    if (typeof q.lesson !== 'string' || !lessons.has(q.lesson)) err(`leçon « ${String(q.lesson)} » introuvable`)
    if (q.official === true && !officialIds.has(q.id as string)) err('marquée officielle mais absente de la liste officielle')
  }

  for (const theme of themesWithContent) {
    const missing = official.filter((o) => o.theme === theme && !seen.has(o.id)).map((o) => o.id)
    if (missing.length) errors.push(`questions/${theme}.json : question(s) officielle(s) manquante(s) : ${missing.join(', ')}`)
  }

  for (const notion of NOTIONS) {
    const count = byNotion.get(notion) ?? 0
    if (themesWithContent.has(themeOf(notion)) && count < EXAM_GRID[notion]) {
      errors.push(`notion ${notion} : ${count} question(s), il en faut au moins ${EXAM_GRID[notion]} pour un examen`)
    }
  }

  return errors
}

const themeOf = (notion: NotionId) => notion.split('.')[0]

function isNotionOf(notion: unknown, theme: unknown): notion is NotionId {
  return NOTIONS.includes(notion as NotionId) && themeOf(notion as NotionId) === theme
}
