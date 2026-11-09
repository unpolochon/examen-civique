import { useState } from 'react'
import { lessonById } from '../content'
import { isSituation, missedQuestionIds } from '../domain/exam'
import { examTitle, frenchSpacing, splitSituation } from '../domain/format'
import { THEME_SHORT_LABELS, type QuestionSnapshot } from '../domain/types'
import { useAppData } from '../state'
import { BackLink, ExamNotFound } from './Resultats'

const FILTERS = [
  ['toutes', 'Toutes'],
  ['erreurs', 'Erreurs'],
  ['revoir', 'À revoir'],
] as const
type Filter = (typeof FILTERS)[number][0]

const EMPTY: Record<Filter, string> = {
  toutes: '',
  erreurs: 'Aucune erreur : toutes vos réponses sont justes.',
  revoir: "Vous n'avez marqué aucune question « À revoir » pendant l'examen.",
}

export default function Correction({ id }: Record<string, string>) {
  const record = useAppData().data!.exams.find((e) => e.id === id)
  const [filter, setFilter] = useState<Filter>('toutes')
  if (!record) return <ExamNotFound />

  const missed = new Set(missedQuestionIds(record))
  const all = record.questionIds.map((qid, index) => ({ qid, index }))
  const lists: Record<Filter, typeof all> = {
    toutes: all,
    erreurs: all.filter(({ qid }) => missed.has(qid)),
    revoir: all.filter(({ qid }) => record.flagged.includes(qid)),
  }
  const shown = lists[filter]

  return (
    <div className="correction">
      <header className="screen-header">
        <BackLink href={`#/resultats/${encodeURIComponent(record.id)}`} label="Retour aux résultats" />
        <div className="correction__title">
          <h1>Correction</h1>
          <span>
            {examTitle(record.finishedAt)} · {record.score}/{record.questionIds.length}
          </span>
        </div>
      </header>

      <div className="correction__filters" role="group" aria-label="Afficher">
        {FILTERS.map(([key, label]) => (
          <button key={key} type="button" className="filter-chip" aria-pressed={filter === key} onClick={() => setFilter(key)}>
            {label} ({lists[key].length})
          </button>
        ))}
      </div>

      {shown.length ? (
        <ol className="correction__list">
          {shown.map(({ qid, index }) => (
            <Item key={qid} n={index + 1} q={record.snapshot[qid]} given={record.answers[qid] ?? null} flagged={record.flagged.includes(qid)} />
          ))}
        </ol>
      ) : (
        <p className="card correction__empty">{EMPTY[filter]}</p>
      )}
    </div>
  )
}

function Item({ n, q, given, flagged }: { n: number; q: QuestionSnapshot; given: number | null; flagged: boolean }) {
  const parts = isSituation(q.notion) ? splitSituation(q.question) : null
  const lesson = lessonById.get(q.lesson)
  return (
    <li className="correction-item">
      <div className="correction-item__head">
        <span className="correction-item__number">Question {n}</span>
        <span className={`chip theme-tile--${q.theme}`}>{THEME_SHORT_LABELS[q.theme]}</span>
        {flagged && (
          <span className="correction-item__flag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6 3h12v18l-6-4-6 4z" />
            </svg>
            À revoir
          </span>
        )}
      </div>
      {parts && <p className="correction-item__scenario">{frenchSpacing(parts.scenario)}</p>}
      <h2>{frenchSpacing(parts ? parts.question : q.question)}</h2>
      {given === q.answer ? (
        <Answer right label="Votre réponse est juste">
          {q.choices[given]}
        </Answer>
      ) : (
        <>
          <Answer right={false} label={given === null ? "Vous n'avez pas répondu" : 'Votre réponse est fausse'}>
            {given === null ? null : q.choices[given]}
          </Answer>
          <Answer right label="Bonne réponse">
            {q.choices[q.answer]}
          </Answer>
        </>
      )}
      <p className="correction-item__explanation">{frenchSpacing(q.explanation)}</p>
      {lesson && (
        <a href={`#/lecon/${lesson.id}`} className="correction-item__lesson">
          Lire la leçon&nbsp;: {frenchSpacing(lesson.title)}
        </a>
      )}
    </li>
  )
}

function Answer({ right, label, children }: { right: boolean; label: string; children: string | null }) {
  return (
    <div className={right ? 'answer answer--right' : 'answer answer--wrong'}>
      <span className="answer__icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d={right ? 'M5 12.5l4.5 4.5L19 7.5' : 'M6 6l12 12M18 6L6 18'} />
        </svg>
      </span>
      <span className="answer__text">
        <span className="answer__label">{label}</span>
        {children !== null && <span>{frenchSpacing(children)}</span>}
      </span>
    </div>
  )
}
