import { NOTIONS, THEMES, type AppData } from './types'

const KEY = 'civique:data'
export const VERSION = 1

/** Saved data, or null when there is none (first launch) or it cannot be read. */
export function load(): AppData | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw === null ? null : importJson(raw)
  } catch (e) {
    console.error('Lecture des données impossible', e)
    return null
  }
}

/** Returns false when the browser refuses to write (full storage, private browsing). */
export function save(data: AppData): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
    return true
  } catch (e) {
    console.error('Sauvegarde impossible', e)
    return false
  }
}

export function clear(): void {
  try {
    localStorage.removeItem(KEY)
  } catch (e) {
    console.error('Effacement impossible', e)
  }
}

/** Fresh data for a new profile. */
export function newAppData(firstName: string, examDate: string | null, now: Date): AppData {
  return {
    version: VERSION,
    profile: { firstName, examDate, createdAt: now.toISOString() },
    exams: [],
    examInProgress: null,
    cards: {},
    lessonsRead: [],
  }
}

export function exportJson(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

/** Parses, migrates and checks an exported file. Throws an Error with a French message. */
export function importJson(text: string): AppData {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('Ce fichier n’est pas une sauvegarde Civique (JSON illisible).')
  }
  const data = migrate(raw)
  const problem = findProblem(data)
  if (problem) throw new Error(`Sauvegarde invalide : ${problem}.`)
  return data as AppData
}

/** Brings data from an older version up to VERSION. Version 1 is the first one. */
export function migrate(raw: unknown): unknown {
  const version = isObject(raw) ? raw.version : undefined
  if (version === VERSION) return raw
  if (typeof version === 'number' && version > VERSION) {
    throw new Error('Cette sauvegarde vient d’une version plus récente de l’app. Mettez l’app à jour puis réessayez.')
  }
  throw new Error('Ce fichier n’est pas une sauvegarde Civique (version inconnue).')
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const isString = (value: unknown) => typeof value === 'string'
const isStringArray = (value: unknown) => Array.isArray(value) && value.every(isString)
const isDate = (value: unknown) => isString(value) && !Number.isNaN(Date.parse(value as string))

function isAnswers(value: unknown) {
  return isObject(value) && Object.values(value).every((a) => a === null || Number.isInteger(a))
}

function isChoiceOrder(value: unknown) {
  return isObject(value) && Object.values(value).every((o) => Array.isArray(o) && o.every(Number.isInteger))
}

function isSnapshot(value: unknown, questionIds: string[]) {
  if (!isObject(value)) return false
  return questionIds.every((id) => {
    const q = value[id]
    return (
      isObject(q) &&
      isString(q.question) &&
      isStringArray(q.choices) &&
      Number.isInteger(q.answer) &&
      isString(q.explanation) &&
      THEMES.includes(q.theme as never) &&
      NOTIONS.includes(q.notion as never) &&
      isString(q.lesson)
    )
  })
}

function isExamBase(exam: unknown): exam is Record<string, unknown> {
  return (
    isObject(exam) &&
    isString(exam.id) &&
    isDate(exam.startedAt) &&
    isStringArray(exam.questionIds) &&
    isChoiceOrder(exam.choiceOrder) &&
    isAnswers(exam.answers) &&
    isSnapshot(exam.snapshot, exam.questionIds as string[])
  )
}

/** Returns a French description of the first problem found, or null. */
function findProblem(data: unknown): string | null {
  if (!isObject(data)) return 'contenu absent'
  const { profile, exams, examInProgress, cards, lessonsRead } = data
  if (!isObject(profile) || !isString(profile.firstName) || !(profile.firstName as string).trim()) return 'prénom manquant'
  if (profile.examDate !== null && !isDate(profile.examDate)) return 'date d’examen invalide'
  if (!isDate(profile.createdAt)) return 'date de création du profil invalide'
  if (!Array.isArray(exams)) return 'liste des examens absente'
  for (const exam of exams) {
    if (
      !isExamBase(exam) ||
      !isDate(exam.finishedAt) ||
      !Number.isInteger(exam.score) ||
      !isObject(exam.byTheme) ||
      !isObject(exam.byNotion) ||
      !isStringArray(exam.flagged)
    ) {
      return 'examen terminé illisible'
    }
  }
  if (examInProgress !== null) {
    if (!isExamBase(examInProgress) || !isStringArray(examInProgress.flagged) || !Number.isInteger(examInProgress.current)) {
      return 'examen en cours illisible'
    }
  }
  if (!isObject(cards)) return 'cartes absentes'
  for (const card of Object.values(cards)) {
    if (!isObject(card) || ![0, 1, 2, 3, 4, 5].includes(card.level as number) || !isDate(card.due)) return 'carte illisible'
  }
  if (!isStringArray(lessonsRead)) return 'liste des leçons lues absente'
  return null
}
