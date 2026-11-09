import type { Lesson, Question, Theme } from './types'

const DAY_MS = 86_400_000

/** "1 erreur", "3 erreurs". Each word of `words` takes an s. */
export const plural = (n: number, words: string) => `${n} ${n > 1 ? words.replace(/(\S+)/g, '$1s') : words}`

/** Local calendar date as YYYY-MM-DD. */
export function isoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** "Examen le 13 déc. · dans 34 jours", or null without a date. `examDate` is a local calendar date (YYYY-MM-DD). */
export function examDateLabel(examDate: string | null, now: Date): string | null {
  if (!examDate) return null
  const [y, m, d] = examDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((date.getTime() - today.getTime()) / DAY_MS) // round: DST days last 23 or 25 hours
  if (days < 0) return 'Examen passé'
  if (days === 0) return "Examen aujourd'hui"
  const label = date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: y === now.getFullYear() ? undefined : 'numeric',
  })
  return `Examen le ${label} · ${days === 1 ? 'demain' : `dans ${days} jours`}`
}

/** "8 leçons · 40 questions" (official questions only), zero counts left out. */
export function themeMeta(theme: Theme, lessons: Lesson[], questions: Question[]): string {
  const nLessons = lessons.filter((l) => l.theme === theme).length
  const nQuestions = questions.filter((q) => q.theme === theme && q.official).length
  return [nLessons && plural(nLessons, 'leçon'), nQuestions && plural(nQuestions, 'question')].filter(Boolean).join(' · ')
}

export function exportFileName(now: Date): string {
  return `civique-sauvegarde-${isoDay(now)}.json`
}

/** Countdown as mm:ss, rounded up so that 00:00 shows only when the time is over. */
export function formatTimer(ms: number): string {
  const seconds = Math.ceil(ms / 1000)
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

/** Splits a situation into its scenario and its final question. null when the text is a single question. */
export function splitSituation(text: string): { scenario: string; question: string } | null {
  const match = /^(.*[.!»…])\s+([^.!?]+\?)$/s.exec(text.trim())
  return match && { scenario: match[1], question: match[2] }
}

/** "Examen blanc du 9 nov." */
export function examTitle(finishedAt: string): string {
  return `Examen blanc du ${new Date(finishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
}

/** Non-breaking spaces before ? ! : ; » and after «, so French punctuation never starts a line. */
export function frenchSpacing(text: string): string {
  return text.replace(/ ([?!:;»])/g, '\u00a0$1').replace(/« /g, '«\u00a0')
}
