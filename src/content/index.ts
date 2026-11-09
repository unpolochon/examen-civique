import { THEMES, type Lesson, type Question } from '../domain/types.ts'
import { parseLesson } from './parse.ts'

// Bundled at build time. Both globs return {} while content/ is empty or absent.
const questionFiles = import.meta.glob<Question[]>('../../content/questions/*.json', {
  eager: true,
  import: 'default',
})
const lessonFiles = import.meta.glob<string>('../../content/lessons/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

export const questions: Question[] = Object.values(questionFiles).flat()

export const lessons: Lesson[] = Object.values(lessonFiles)
  .map(parseLesson)
  .sort((a, b) => THEMES.indexOf(a.theme) - THEMES.indexOf(b.theme) || a.order - b.order)

export const questionById = new Map(questions.map((q) => [q.id, q]))
export const lessonById = new Map(lessons.map((l) => [l.id, l]))
