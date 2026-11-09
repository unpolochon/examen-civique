import { describe, expect, test } from 'vitest'
import { lesson, makeBank, seededRng } from './fixtures'
import { drawExam, scoreExam } from './exam'
import { revisionPlan } from './plan'
import type { ExamRecord, Lesson, Question } from './types'

const bank = makeBank(0)
const map = new Map(bank.map((q) => [q.id, q]))
const exam = drawExam(bank, { seen: new Set(), missed: new Set() }, seededRng(9), new Date('2026-11-09T10:00:00.000Z'))

/** Scores the exam with every answer right except the given ids (answered wrong). */
function recordMissing(wrong: string[], lessonOf: (q: Question) => string = (q) => q.lesson): ExamRecord {
  const answers = Object.fromEntries(exam.questionIds.map((id) => [id, map.get(id)!.answer]))
  for (const id of wrong) answers[id] = (map.get(id)!.answer + 1) % 4
  const relabelled = new Map(bank.map((q) => [q.id, { ...q, lesson: lessonOf(q) }]))
  return scoreExam({ ...exam, answers }, relabelled, '2026-11-09T10:40:00.000Z')
}

const ids = (notion: string, ns: number[]) => ns.map((n) => `${notion}-${n}`)

// Lesson ids produced by the fixtures: `${theme}/${notion suffix}`.
const lessons: Lesson[] = [
  lesson('principes/devise-symboles', 'principes', 1),
  lesson('principes/laicite', 'principes', 2),
  lesson('principes/situations', 'principes', 3),
  lesson('institutions/democratie-vote', 'institutions', 1),
  lesson('droits/situations', 'droits', 3),
  lesson('histoire/periodes', 'histoire', 1),
  lesson('histoire/geographie', 'histoire', 2),
  lesson('societe/ecole', 'societe', 4),
]

describe('revisionPlan', () => {
  test('examen parfait : rien à renforcer, aucune leçon, aucune question ratée', () => {
    expect(revisionPlan(recordMissing([]), lessons)).toEqual({ weakThemes: [], lessons: [], missedQuestionIds: [] })
  })

  test('thématique sous 80 % : à renforcer ; à 80 % : non', () => {
    // principes: 11 questions, 3 wrong -> 72.7 %. histoire: 8 questions, 1 wrong -> 87.5 %.
    // societe: 4 questions, 1 wrong -> 75 %. institutions: 6 questions, 1 wrong -> 83.3 %.
    const record = recordMissing([
      ...ids('principes.situations', [0, 1, 2]),
      ...ids('histoire.periodes', [0]),
      ...ids('societe.ecole', [0]),
      ...ids('institutions.democratie-vote', [0]),
    ])
    expect(revisionPlan(record, lessons).weakThemes).toEqual(['principes', 'societe'])
  })

  test('ne garde que les thématiques à renforcer, erreurs décroissantes, toutes les questions ratées', () => {
    const wrong = [
      ...ids('principes.situations', [0, 1]),
      ...ids('principes.laicite', [0]),
      ...ids('principes.devise-symboles', [0, 1, 2]),
      ...ids('histoire.periodes', [0]),
    ]
    const plan = revisionPlan(recordMissing(wrong), lessons)
    expect(plan.weakThemes).toEqual(['principes'])
    expect(plan.lessons).toEqual([
      { lessonId: 'principes/devise-symboles', errors: 3 },
      { lessonId: 'principes/situations', errors: 2 },
      { lessonId: 'principes/laicite', errors: 1 },
    ])
    expect([...plan.missedQuestionIds].sort()).toEqual([...wrong].sort())
    expect(plan.missedQuestionIds).toEqual(exam.questionIds.filter((id) => wrong.includes(id)))
  })

  test('au plus 3 leçons, égalités départagées par l’ordre des leçons', () => {
    // Everything wrong: every theme is weak.
    const plan = revisionPlan(recordMissing(exam.questionIds), lessons)
    expect(plan.weakThemes).toEqual(['principes', 'institutions', 'droits', 'histoire', 'societe'])
    expect(plan.lessons).toEqual([
      { lessonId: 'principes/situations', errors: 6 },
      { lessonId: 'droits/situations', errors: 6 },
      { lessonId: 'principes/devise-symboles', errors: 3 },
    ])
    expect(plan.missedQuestionIds).toHaveLength(40)
  })

  test('égalité dans une thématique : l’ordre de la leçon décide', () => {
    const record = recordMissing([...ids('histoire.periodes', [0]), ...ids('histoire.geographie', [0]), ...ids('histoire.patrimoine', [0])])
    const reversed = [lesson('histoire/geographie', 'histoire', 1), lesson('histoire/periodes', 'histoire', 2)]
    expect(revisionPlan(record, reversed).lessons.map((l) => l.lessonId)).toEqual(['histoire/geographie', 'histoire/periodes'])
  })

  test('aucune thématique à renforcer : propose quand même les leçons des erreurs', () => {
    const plan = revisionPlan(recordMissing([...ids('histoire.periodes', [0]), ...ids('droits.situations', [0])]), lessons)
    expect(plan.weakThemes).toEqual([])
    expect(plan.lessons).toEqual([
      { lessonId: 'droits/situations', errors: 1 },
      { lessonId: 'histoire/periodes', errors: 1 },
    ])
  })

  test('utilise la leçon de la photo et ignore les leçons inconnues', () => {
    const record = recordMissing(ids('principes.situations', [0, 1, 2]), (q) => (q.notion === 'principes.situations' ? 'principes/laicite' : q.lesson))
    expect(revisionPlan(record, lessons).lessons).toEqual([{ lessonId: 'principes/laicite', errors: 3 }])
    expect(revisionPlan(record, []).lessons).toEqual([])
  })
})
