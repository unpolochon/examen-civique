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

/** French message naming the first notion with fewer questions than EXAM_GRID requires, null when an exam can be drawn. */
export function gridShortage(bank: Question[]): string | null {
  for (const notion of NOTIONS) {
    const count = bank.filter((q) => q.notion === notion).length
    if (count < EXAM_GRID[notion]) return `Pas assez de questions pour la notion ${notion} : ${count} pour ${EXAM_GRID[notion]} demandées.`
  }
  return null
}

/**
 * Draws a mock exam following EXAM_GRID: never-seen questions first, then missed ones, then the rest,
 * random inside each tier. Question order and choice order are shuffled.
 * Throws when a notion has fewer questions than the grid requires.
 */
export function drawExam(bank: Question[], history: History, rng: () => number, now: Date): ExamInProgress {
  const shortage = gridShortage(bank)
  if (shortage) throw new Error(shortage)
  const tier = (q: Question) => (!history.seen.has(q.id) ? 0 : history.missed.has(q.id) ? 1 : 2)
  const picked = NOTIONS.flatMap((notion) =>
    // Array.prototype.sort is stable: the shuffle decides the order inside each tier.
    shuffle(
      bank.filter((q) => q.notion === notion),
      rng,
    )
      .sort((a, b) => tier(a) - tier(b))
      .slice(0, EXAM_GRID[notion]),
  )
  const questions = shuffle(picked, rng)
  const startedAt = now.toISOString()
  const snapshot = Object.fromEntries(
    questions.map(({ id, question, choices, answer, explanation, theme, notion, lesson }) => [
      id,
      { question, choices: [...choices], answer, explanation, theme, notion, lesson },
    ]),
  )
  return {
    id: startedAt,
    startedAt,
    questionIds: questions.map((q) => q.id),
    choiceOrder: Object.fromEntries(questions.map((q) => [q.id, shuffle(q.choices.map((_, i) => i), rng)])),
    answers: Object.fromEntries(questions.map((q) => [q.id, null])),
    flagged: [],
    current: 0,
    snapshot,
  }
}

const emptyScores = <K extends string>(keys: readonly K[]) =>
  Object.fromEntries(keys.map((k) => [k, { correct: 0, total: 0 }])) as Record<K, Score>

/** Scores a finished exam from its own snapshot, without reading the content. An unanswered question counts as wrong. */
export function scoreExam(exam: ExamInProgress, finishedAt: string): ExamRecord {
  const byTheme = emptyScores<Theme>(THEMES)
  const byNotion = emptyScores<NotionId>(NOTIONS)
  let score = 0
  for (const id of exam.questionIds) {
    const { answer, theme, notion } = exam.snapshot[id]
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
    flagged: exam.flagged,
    snapshot: exam.snapshot,
  }
}

/** History for drawExam from the finished exams: a question is missed when it was answered wrong the last time it appeared. */
export function examHistory(exams: ExamRecord[]): History {
  const seen = new Set<string>()
  const missed = new Set<string>()
  const finished = [...exams].sort((a, b) => Date.parse(a.finishedAt) - Date.parse(b.finishedAt))
  for (const record of finished) {
    const wrong = new Set(missedQuestionIds(record))
    for (const id of record.questionIds) {
      seen.add(id)
      if (wrong.has(id)) missed.add(id)
      else missed.delete(id)
    }
  }
  return { seen, missed }
}

export const isSituation = (notion: NotionId) => notion.endsWith('.situations')

/** Knowledge and situation sub-scores, from the scores per notion. */
export function typeScores(record: ExamRecord): { connaissance: Score; situation: Score } {
  const out = { connaissance: { correct: 0, total: 0 }, situation: { correct: 0, total: 0 } }
  for (const [notion, { correct, total }] of Object.entries(record.byNotion) as [NotionId, Score][]) {
    const s = out[isSituation(notion) ? 'situation' : 'connaissance']
    s.correct += correct
    s.total += total
  }
  return out
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
