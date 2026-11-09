// Real exams built from content/ with a fixed seed, for the tests and screenshots that need known questions.
import { readdirSync, readFileSync } from 'node:fs'
import { drawExam, scoreExam } from '../src/domain/exam.ts'
import { seededRng } from '../src/domain/fixtures.ts'
import type { ExamInProgress, Question, Theme } from '../src/domain/types.ts'

const dir = new URL('../content/questions/', import.meta.url)
export const bank: Question[] = readdirSync(dir).flatMap((file) => JSON.parse(readFileSync(new URL(file, dir), 'utf8')))

export function drawn(startedAt = new Date(), seed = 1): ExamInProgress {
  return drawExam(bank, { seen: new Set(), missed: new Set() }, seededRng(seed), startedAt)
}

/** Choice text that is right, or wrong (the next choice), for a question of the exam. */
export function choiceText(exam: ExamInProgress, id: string, right: boolean): string {
  const q = exam.snapshot[id]
  return q.choices[right ? q.answer : (q.answer + 1) % q.choices.length]
}

/** Every question answered: wrong for `wrongThemes`, right otherwise. */
export function answered(exam: ExamInProgress, wrongThemes: Theme[]): ExamInProgress {
  const answers = Object.fromEntries(
    exam.questionIds.map((id) => {
      const q = exam.snapshot[id]
      return [id, wrongThemes.includes(q.theme) ? (q.answer + 1) % q.choices.length : q.answer]
    }),
  )
  return { ...exam, answers }
}

/** A finished exam record, 45 minutes after `exam.startedAt`. */
export function finished(exam: ExamInProgress) {
  return scoreExam(exam, new Date(Date.parse(exam.startedAt) + 45 * 60 * 1000).toISOString())
}
