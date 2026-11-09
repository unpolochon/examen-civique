// Content and app data types. Imported by scripts/ under Node type stripping:
// keep this file free of enums and namespaces.

export type Theme = 'principes' | 'institutions' | 'droits' | 'histoire' | 'societe'

export const THEMES: readonly Theme[] = ['principes', 'institutions', 'droits', 'histoire', 'societe']

/** Questions per notion in a mock exam (article 3 of the arrêté, docs/referentiel.md). */
export const EXAM_GRID = {
  'principes.devise-symboles': 3,
  'principes.laicite': 2,
  'principes.situations': 6,
  'institutions.democratie-vote': 3,
  'institutions.organisation': 2,
  'institutions.europe': 1,
  'droits.fondamentaux': 2,
  'droits.obligations': 3,
  'droits.situations': 6,
  'histoire.periodes': 3,
  'histoire.geographie': 3,
  'histoire.patrimoine': 2,
  'societe.installation': 1,
  'societe.soins': 1,
  'societe.travail': 1,
  'societe.ecole': 1,
} as const

export type NotionId = keyof typeof EXAM_GRID

export const NOTIONS = Object.keys(EXAM_GRID) as NotionId[]

export const EXAM_QUESTIONS = 40
export const EXAM_DURATION_MS = 45 * 60 * 1000
export const PASS_SCORE = 32

export interface Question {
  id: string
  theme: Theme
  type: 'connaissance' | 'situation'
  official: boolean
  question: string
  choices: string[]
  answer: number
  explanation: string
  notion: NotionId
  lesson: string
  /** Note for the human review (T013), not shown as content. */
  review?: string
  source?: string
}

export interface Lesson {
  id: string
  theme: Theme
  notion: NotionId
  title: string
  minutes: number
  order: number
  sources: string[]
  /** Markdown, ends with a "## À retenir" section. */
  body: string
}

export interface Profile {
  firstName: string
  /** ISO date (YYYY-MM-DD), null when unknown. */
  examDate: string | null
  createdAt: string
}

export interface Score {
  correct: number
  total: number
}

export interface ExamInProgress {
  id: string
  startedAt: string
  questionIds: string[]
  /** Displayed order of the choices: choiceOrder[questionId][displayIndex] = index in question.choices. */
  choiceOrder: Record<string, number[]>
  /** Index in question.choices, null when unanswered. */
  answers: Record<string, number | null>
  /** Questions marked "À revoir". */
  flagged: string[]
  current: number
  /** Questions as drawn, keyed by id: a content change never blocks or alters the exam. */
  snapshot: Record<string, QuestionSnapshot>
}

/** Question as it was when the exam was drawn, so the exam and its correction survive content changes. */
export type QuestionSnapshot = Pick<Question, 'question' | 'choices' | 'answer' | 'explanation' | 'theme' | 'notion' | 'lesson'>

export interface ExamRecord {
  id: string
  startedAt: string
  finishedAt: string
  questionIds: string[]
  choiceOrder: Record<string, number[]>
  answers: Record<string, number | null>
  score: number
  byTheme: Record<Theme, Score>
  byNotion: Record<NotionId, Score>
  /** Questions marked "À revoir" during the exam. */
  flagged: string[]
  /** Keyed by question id, one entry per question of the exam. */
  snapshot: Record<string, QuestionSnapshot>
}

export interface CardState {
  level: 0 | 1 | 2 | 3 | 4 | 5
  /** ISO datetime of the next review. */
  due: string
}

export interface AppData {
  version: 1
  profile: Profile
  exams: ExamRecord[]
  examInProgress: ExamInProgress | null
  /** Keyed by question id. */
  cards: Record<string, CardState>
  /** Lesson ids. */
  lessonsRead: string[]
}

export const THEME_LABELS: Record<Theme, string> = {
  principes: 'Principes et valeurs',
  institutions: 'Institutions et politique',
  droits: 'Droits et devoirs',
  histoire: 'Histoire, géographie, culture',
  societe: 'Vivre dans la société',
}

export const NOTION_LABELS: Record<NotionId, string> = {
  'principes.devise-symboles': 'Devise et symboles de la République',
  'principes.laicite': 'Laïcité',
  'principes.situations': 'Mises en situation',
  'institutions.democratie-vote': 'Démocratie et droit de vote',
  'institutions.organisation': 'Organisation de la République française',
  'institutions.europe': 'Institutions européennes',
  'droits.fondamentaux': 'Droits fondamentaux',
  'droits.obligations': 'Obligations et devoirs',
  'droits.situations': 'Mises en situation',
  'histoire.periodes': 'Principales périodes et personnages historiques',
  'histoire.geographie': 'Territoires et géographie',
  'histoire.patrimoine': 'Patrimoine français',
  'societe.installation': "S'installer et résider en France",
  'societe.soins': "L'accès aux soins",
  'societe.travail': 'Travailler en France',
  'societe.ecole': 'Autorité parentale et système éducatif',
}

/** Labels where space is short (results rows, progress tiles), as in the mockups. */
export const THEME_SHORT_LABELS: Record<Theme, string> = {
  ...THEME_LABELS,
  institutions: 'Institutions',
  histoire: 'Histoire, géographie',
}
