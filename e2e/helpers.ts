import type { Page } from '@playwright/test'

export function appData(overrides: Record<string, unknown> = {}) {
  return {
    version: 1,
    profile: { firstName: 'Paul', examDate: null, createdAt: '2026-11-01T10:00:00.000Z' },
    exams: [],
    examInProgress: null,
    cards: {},
    lessonsRead: [],
    ...overrides,
  }
}

const questionIds = Array.from({ length: 40 }, (_, i) => `q${i}`)
const snapshot = Object.fromEntries(
  questionIds.map((id) => [
    id,
    { question: 'Q ?', choices: ['A', 'B', 'C', 'D'], answer: 0, explanation: 'E.', theme: 'principes', notion: 'principes.laicite', lesson: 'principes/laicite' },
  ]),
)

/** A finished 40-question exam with the given score, for the screens that only read the score. */
export function finishedExam(score: number, finishedAt = '2026-11-05T10:45:00.000Z') {
  return {
    id: `exam-${finishedAt}`,
    startedAt: '2026-11-05T10:00:00.000Z',
    finishedAt,
    questionIds,
    choiceOrder: {},
    answers: {},
    score,
    byTheme: {},
    byNotion: {},
    snapshot,
  }
}

/** An exam in progress, `current` being the index of the displayed question. */
export function examInProgress(current: number) {
  return { id: 'en-cours', startedAt: new Date().toISOString(), questionIds, choiceOrder: {}, answers: {}, flagged: [], current, snapshot }
}

/** Saves `data` in the app storage before the app starts, once per page (reloads keep what the app saved), then opens `hash`. */
export async function seed(page: Page, data = appData(), hash = '#/') {
  await page.addInitScript((value) => {
    if (sessionStorage.getItem('seeded')) return
    localStorage.setItem('civique:data', value)
    sessionStorage.setItem('seeded', '1')
  }, JSON.stringify(data))
  await page.goto(`./${hash}`)
}

export async function stored(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('civique:data') ?? 'null'))
}
