import { missedQuestionIds } from './exam'
import { THEMES, type ExamRecord, type Lesson, type Theme } from './types'

/** Below this share of correct answers, a theme is "à renforcer". */
export const WEAK_THRESHOLD = 0.8
export const MAX_PLAN_LESSONS = 3

export interface RevisionPlan {
  weakThemes: Theme[]
  /** At most 3 lessons, most errors first. */
  lessons: { lessonId: string; errors: number }[]
  /** Every question answered wrong or not answered, in exam order. */
  missedQuestionIds: string[]
}

/** Revision plan after an exam (plan.md, "Plan de révision"). Lessons absent from `lessons` are never proposed. */
export function revisionPlan(record: ExamRecord, lessons: Lesson[]): RevisionPlan {
  const weakThemes = THEMES.filter((t) => {
    const { correct, total } = record.byTheme[t]
    return total > 0 && correct / total < WEAK_THRESHOLD
  })
  const missed = missedQuestionIds(record)
  const errors = new Map<string, number>()
  for (const id of missed) {
    const lessonId = record.snapshot[id].lesson
    errors.set(lessonId, (errors.get(lessonId) ?? 0) + 1)
  }
  const proposed = lessons
    .filter((l) => errors.has(l.id) && (weakThemes.length === 0 || weakThemes.includes(l.theme)))
    .sort(
      (a, b) =>
        errors.get(b.id)! - errors.get(a.id)! || THEMES.indexOf(a.theme) - THEMES.indexOf(b.theme) || a.order - b.order,
    )
    .slice(0, MAX_PLAN_LESSONS)
    .map((l) => ({ lessonId: l.id, errors: errors.get(l.id)! }))
  return { weakThemes, lessons: proposed, missedQuestionIds: missed }
}
