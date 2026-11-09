import {
  EXAM_DURATION_MS,
  EXAM_GRID,
  NOTIONS,
  PASS_SCORE,
  THEMES,
  type ExamInProgress,
  type ExamRecord,
  type NotionId,
  type Question,
  type QuestionSnapshot,
  type Score,
  type Theme,
} from './types'

export interface History {
  /** Question ids answered in a finished exam or reviewed as a card. */
  seen: Set<string>
  /** Question ids answered wrong the last time. */
  missed: Set<string>
}

/** Fisher-Yates shuffle into a new array. `rng` returns a number in [0, 1). */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Draws a mock exam following EXAM_GRID: never-seen questions first, then missed ones, then the rest,
 * random inside each tier. Question order and choice order are shuffled.
 * Throws when a notion has fewer questions than the grid requires.
 */
export function drawExam(bank: Question[], history: History, rng: () => number, now: Date): ExamInProgress {
  const tier = (q: Question) => (!history.seen.has(q.id) ? 0 : history.missed.has(q.id) ? 1 : 2)
  const picked = NOTIONS.flatMap((notion) => {
    const need = EXAM_GRID[notion]
    const candidates = bank.filter((q) => q.notion === notion)
    if (candidates.length < need) {
      throw new Error(`Pas assez de questions pour la notion ${notion} : ${candidates.length} pour ${need} demandées.`)
    }
    // Array.prototype.sort is stable: the shuffle decides the order inside each tier.
    return shuffle(candidates, rng)
      .sort((a, b) => tier(a) - tier(b))
      .slice(0, need)
  })
  const questions = shuffle(picked, rng)
  const startedAt = now.toISOString()
  return {
    id: startedAt,
    startedAt,
    questionIds: questions.map((q) => q.id),
    choiceOrder: Object.fromEntries(questions.map((q) => [q.id, shuffle(q.choices.map((_, i) => i), rng)])),
    answers: Object.fromEntries(questions.map((q) => [q.id, null])),
    flagged: [],
    current: 0,
  }
}

const emptyScores = <K extends string>(keys: readonly K[]) =>
  Object.fromEntries(keys.map((k) => [k, { correct: 0, total: 0 }])) as Record<K, Score>

/** Scores a finished exam. An unanswered question counts as wrong. Throws when a question is missing from the bank. */
export function scoreExam(exam: ExamInProgress, bank: Map<string, Question>, finishedAt: string): ExamRecord {
  const byTheme = emptyScores<Theme>(THEMES)
  const byNotion = emptyScores<NotionId>(NOTIONS)
  const snapshot: Record<string, QuestionSnapshot> = {}
  let score = 0
  for (const id of exam.questionIds) {
    const q = bank.get(id)
    if (!q) throw new Error(`Question ${id} introuvable dans la banque de questions.`)
    const { question, choices, answer, explanation, theme, notion, lesson } = q
    snapshot[id] = { question, choices, answer, explanation, theme, notion, lesson }
    const correct = exam.answers[id] === answer ? 1 : 0
    score += correct
    for (const s of [byTheme[theme], byNotion[notion]]) {
      s.correct += correct
      s.total += 1
    }
  }
  return {
    id: exam.id,
    startedAt: exam.startedAt,
    finishedAt,
    questionIds: exam.questionIds,
    choiceOrder: exam.choiceOrder,
    answers: exam.answers,
    score,
    byTheme,
    byNotion,
    snapshot,
  }
}

/** Question ids answered wrong or not answered, in exam order. Uses the snapshot, not the current content. */
export function missedQuestionIds(record: ExamRecord): string[] {
  return record.questionIds.filter((id) => record.answers[id] !== record.snapshot[id].answer)
}

export function isPassed(record: ExamRecord): boolean {
  return record.score >= PASS_SCORE
}

/** Milliseconds left before the 45 minutes run out, never negative. */
export function remainingMs(exam: ExamInProgress, now: Date): number {
  return Math.max(0, Date.parse(exam.startedAt) + EXAM_DURATION_MS - now.getTime())
}
