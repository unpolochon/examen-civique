// Test helpers shared by the domain tests. Not imported by the app.
import { EXAM_GRID, NOTIONS, type Lesson, type NotionId, type Question, type Theme } from './types'

/** Deterministic rng (mulberry32), returns numbers in [0, 1). */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const themeOf = (notion: NotionId) => notion.split('.')[0] as Theme

export function question(notion: NotionId, n: number): Question {
  const theme = themeOf(notion)
  return {
    id: `${notion}-${n}`,
    theme,
    type: notion.endsWith('situations') ? 'situation' : 'connaissance',
    official: true,
    question: `Question ${n} sur ${notion} ?`,
    choices: ['A', 'B', 'C', 'D'],
    answer: n % 4,
    explanation: 'Explication.',
    notion,
    lesson: `${theme}/${notion.split('.')[1]}`,
  }
}

/** `extra` more questions than the grid requires, for every notion. */
export function makeBank(extra: number): Question[] {
  return NOTIONS.flatMap((notion) => Array.from({ length: EXAM_GRID[notion] + extra }, (_, n) => question(notion, n)))
}

export function lesson(id: string, theme: Theme, order: number): Lesson {
  return { id, theme, notion: 'principes.laicite', title: id, minutes: 5, order, sources: [], body: '## À retenir' }
}
