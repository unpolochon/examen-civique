import type { CardState } from './types'

export type Grade = 'non' | 'hesite' | 'oui'
type Level = CardState['level']

const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE
/** Leitner intervals per level: 10 min, 1 d, 3 d, 7 d, 16 d, 35 d. */
export const INTERVALS_MS = [10 * MINUTE, DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY] as const
/** A card at this level or above counts as mastered on the Progress screen. */
export const MASTERY_LEVEL = 3

const at = (level: Level, now: Date): CardState => ({ level, due: new Date(now.getTime() + INTERVALS_MS[level]).toISOString() })

/** Next state of a card after an answer. A card never reviewed starts at level 0. */
export function review(state: CardState | undefined, grade: Grade, now: Date): CardState {
  const level = state?.level ?? 0
  if (grade === 'non') return at(0, now)
  if (grade === 'hesite') return at(level, now)
  return at(Math.min(level + 1, 5) as Level, now)
}

/** Ids of the cards due at `now`, oldest due first. */
export function dueCards(cards: Record<string, CardState>, now: Date): string[] {
  return Object.entries(cards)
    .filter(([, c]) => Date.parse(c.due) <= now.getTime())
    .sort(([, a], [, b]) => Date.parse(a.due) - Date.parse(b.due))
    .map(([id]) => id)
}

/** Copy of `cards` where the given questions are back to level 0 and due now. */
export function markMissed(cards: Record<string, CardState>, questionIds: string[], now: Date): Record<string, CardState> {
  const due = now.toISOString()
  return { ...cards, ...Object.fromEntries(questionIds.map((id) => [id, { level: 0, due }])) }
}

/** Share (0 to 1) of the given questions whose card is at MASTERY_LEVEL or above. 0 when there is no question. */
export function mastery(cards: Record<string, CardState>, questionIds: string[]): number {
  if (questionIds.length === 0) return 0
  return questionIds.filter((id) => (cards[id]?.level ?? -1) >= MASTERY_LEVEL).length / questionIds.length
}
