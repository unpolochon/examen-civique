import { describe, expect, test } from 'vitest'
import { drawExam, isPassed, missedQuestionIds, remainingMs, scoreExam, shuffle } from './exam'
import { makeBank, question, seededRng } from './fixtures'
import { EXAM_GRID, EXAM_QUESTIONS, NOTIONS, type ExamInProgress, type NotionId, type Question } from './types'

const now = new Date('2026-11-09T10:00:00.000Z')
const noHistory = { seen: new Set<string>(), missed: new Set<string>() }
const byId = (bank: Question[]) => new Map(bank.map((q) => [q.id, q]))
const countBy = <T>(items: T[], key: (item: T) => string) =>
  items.reduce<Record<string, number>>((acc, item) => ({ ...acc, [key(item)]: (acc[key(item)] ?? 0) + 1 }), {})

describe('shuffle', () => {
  test('rend une permutation sans modifier l’entrée', () => {
    const input = [1, 2, 3, 4, 5, 6]
    const out = shuffle(input, seededRng(1))
    expect(input).toEqual([1, 2, 3, 4, 5, 6])
    expect([...out].sort()).toEqual(input)
  })
})

describe('drawExam', () => {
  const bank = makeBank(5)
  const exam = drawExam(bank, noHistory, seededRng(42), now)
  const map = byId(bank)

  test('respecte exactement la grille : 40 questions, nombre par notion', () => {
    expect(exam.questionIds).toHaveLength(EXAM_QUESTIONS)
    expect(new Set(exam.questionIds).size).toBe(EXAM_QUESTIONS)
    expect(countBy(exam.questionIds, (id) => map.get(id)!.notion)).toEqual(EXAM_GRID)
    const types = countBy(exam.questionIds, (id) => map.get(id)!.type)
    expect(types).toEqual({ connaissance: 28, situation: 12 })
  })

  test('chaque ordre des choix est une permutation', () => {
    for (const id of exam.questionIds) {
      expect([...exam.choiceOrder[id]].sort()).toEqual([0, 1, 2, 3])
    }
    expect(exam.questionIds.some((id) => exam.choiceOrder[id].join() !== '0,1,2,3')).toBe(true)
  })

  test('état initial : aucune réponse, rien à revoir, première question', () => {
    expect(exam).toMatchObject({ id: now.toISOString(), startedAt: now.toISOString(), flagged: [], current: 0 })
    expect(Object.values(exam.answers)).toEqual(Array(EXAM_QUESTIONS).fill(null))
    expect(Object.keys(exam.answers).sort()).toEqual([...exam.questionIds].sort())
  })

  test('photo de chaque question tirée, telle que dans la banque', () => {
    expect(Object.keys(exam.snapshot).sort()).toEqual([...exam.questionIds].sort())
    for (const id of exam.questionIds) {
      const { question: text, choices, answer, explanation, theme, notion, lesson } = map.get(id)!
      expect(exam.snapshot[id]).toEqual({ question: text, choices, answer, explanation, theme, notion, lesson })
    }
  })

  test('mélange l’ordre des questions entre les notions', () => {
    const notions = exam.questionIds.map((id) => map.get(id)!.notion)
    const grouped = NOTIONS.flatMap((n) => Array(EXAM_GRID[n]).fill(n))
    expect(notions).not.toEqual(grouped)
  })

  test('déterministe pour une même graine, différent pour une autre', () => {
    expect(drawExam(bank, noHistory, seededRng(42), now)).toEqual(exam)
    expect(drawExam(bank, noHistory, seededRng(7), now).questionIds).not.toEqual(exam.questionIds)
  })

  test('priorité : jamais vues, puis ratées, puis le reste', () => {
    // laicite needs 2 questions out of 7 (ids 0 to 6).
    const notion: NotionId = 'principes.laicite'
    const ids = (ns: number[]) => ns.map((n) => `${notion}-${n}`)
    const pick = (seen: number[], missed: number[], seed: number) =>
      drawExam(bank, { seen: new Set(ids(seen)), missed: new Set(ids(missed)) }, seededRng(seed), now).questionIds.filter((id) =>
        id.startsWith(notion),
      )
    for (let seed = 0; seed < 20; seed++) {
      // Only 4 and 6 never seen: both drawn.
      expect(pick([0, 1, 2, 3, 5], [0], seed).sort()).toEqual(ids([4, 6]))
      // Only 6 never seen, 2 missed: 6 then 2.
      expect(pick([0, 1, 2, 3, 4, 5], [2], seed).sort()).toEqual(ids([2, 6]))
      // All seen, 1 and 5 missed.
      expect(pick([0, 1, 2, 3, 4, 5, 6], [1, 5], seed).sort()).toEqual(ids([1, 5]))
    }
  })

  test('hasard à l’intérieur d’un palier', () => {
    const drawn = new Set<string>()
    for (let seed = 0; seed < 30; seed++) {
      drawExam(bank, noHistory, seededRng(seed), now)
        .questionIds.filter((id) => id.startsWith('principes.laicite'))
        .forEach((id) => drawn.add(id))
    }
    expect(drawn.size).toBe(7)
  })

  test('erreur claire quand une notion manque de questions', () => {
    const short = bank.filter((q) => q.notion !== 'societe.ecole')
    expect(() => drawExam(short, noHistory, seededRng(1), now)).toThrow(
      'Pas assez de questions pour la notion societe.ecole : 0 pour 1 demandées.',
    )
  })

  test('fonctionne avec juste assez de questions', () => {
    expect(drawExam(makeBank(0), noHistory, seededRng(3), now).questionIds).toHaveLength(EXAM_QUESTIONS)
  })
})

describe('scoreExam', () => {
  const bank = makeBank(0)
  const map = byId(bank)
  const exam = drawExam(bank, noHistory, seededRng(5), now)
  // All correct except: a histoire question wrong, a societe question unanswered.
  const first = 'histoire.periodes-0'
  const second = 'societe.ecole-0'
  const third = 'principes.laicite-1'
  const answered: ExamInProgress = {
    ...exam,
    answers: Object.fromEntries(exam.questionIds.map((id) => [id, map.get(id)!.answer])),
  }
  answered.answers[first] = (map.get(first)!.answer + 1) % 4
  answered.answers[second] = null
  const record = scoreExam(answered, '2026-11-09T10:40:00.000Z')

  test('score : réponse fausse et absence de réponse valent 0', () => {
    expect(record.score).toBe(38)
    expect(isPassed(record)).toBe(true)
    expect(missedQuestionIds(record).sort()).toEqual([first, second])
  })

  test('scores par thématique et par notion', () => {
    expect(record.byTheme).toEqual({
      principes: { correct: 11, total: 11 },
      institutions: { correct: 6, total: 6 },
      droits: { correct: 11, total: 11 },
      histoire: { correct: 7, total: 8 },
      societe: { correct: 3, total: 4 },
    })
    for (const notion of NOTIONS) {
      const wrong = notion === 'histoire.periodes' || notion === 'societe.ecole' ? 1 : 0
      expect(record.byNotion[notion]).toEqual({ correct: EXAM_GRID[notion] - wrong, total: EXAM_GRID[notion] })
    }
  })

  test('garde les réponses, l’ordre et la photo du tirage', () => {
    expect(record).toMatchObject({
      id: exam.id,
      startedAt: exam.startedAt,
      finishedAt: '2026-11-09T10:40:00.000Z',
      questionIds: exam.questionIds,
      choiceOrder: exam.choiceOrder,
      answers: answered.answers,
    })
    expect(record.snapshot).toEqual(exam.snapshot)
  })

  test('la correction survit à une modification de la liste officielle', () => {
    // The saved record is self-contained: once reloaded, it needs no bank to be corrected.
    const reloaded = JSON.parse(JSON.stringify(record))
    expect(missedQuestionIds(reloaded).sort()).toEqual([first, second])
    expect(reloaded.snapshot[first]).toEqual(record.snapshot[first])
    expect(reloaded.snapshot[third].question).toBe(question('principes.laicite', 1).question)
  })

  test('examen sans réponse : 0, échoué', () => {
    const empty = scoreExam(exam, '2026-11-09T10:45:00.000Z')
    expect(empty.score).toBe(0)
    expect(isPassed(empty)).toBe(false)
    expect(missedQuestionIds(empty)).toHaveLength(EXAM_QUESTIONS)
  })

  test('un changement de contenu pendant l’examen ne le bloque pas et ne change pas sa correction', () => {
    const live = makeBank(0)
    const inProgress = drawExam(live, noHistory, seededRng(5), now)
    // App update while the exam is saved: a question changes its answer and wording, another disappears.
    const changed = live.find((q) => q.id === third)!
    changed.answer = (changed.answer + 1) % 4
    changed.question = 'Nouvelle formulation ?'
    changed.choices[0] = 'Choix modifié'
    live.splice(live.findIndex((q) => q.id === first), 1)
    const resumed: ExamInProgress = JSON.parse(JSON.stringify({ ...inProgress, answers: answered.answers }))
    const rescored = scoreExam(resumed, '2026-11-09T10:40:00.000Z')
    expect(rescored.score).toBe(38)
    expect(rescored.snapshot[third]).toMatchObject({ question: question('principes.laicite', 1).question, choices: ['A', 'B', 'C', 'D'] })
  })
})

describe('isPassed', () => {
  const record = (score: number) => ({ score }) as Parameters<typeof isPassed>[0]
  test('seuil de 32 sur 40', () => {
    expect(isPassed(record(31))).toBe(false)
    expect(isPassed(record(32))).toBe(true)
  })
})

describe('remainingMs', () => {
  const exam = { startedAt: now.toISOString() } as ExamInProgress
  test('45 minutes au départ, décompte, jamais négatif', () => {
    expect(remainingMs(exam, now)).toBe(45 * 60 * 1000)
    expect(remainingMs(exam, new Date('2026-11-09T10:30:00.000Z'))).toBe(15 * 60 * 1000)
    expect(remainingMs(exam, new Date('2026-11-09T10:45:00.000Z'))).toBe(0)
    expect(remainingMs(exam, new Date('2026-11-09T12:00:00.000Z'))).toBe(0)
  })
})
