import { useCallback, useEffect, useRef, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import { questions } from '../content'
import { drawExam, examHistory, gridShortage, isSituation, missedQuestionIds, remainingMs, scoreExam } from '../domain/exam'
import { formatTimer, frenchSpacing, splitSituation } from '../domain/format'
import { markMissed } from '../domain/srs'
import { EXAM_DURATION_MS, THEME_LABELS, type ExamInProgress } from '../domain/types'
import { navigate } from '../router'
import { useAppData } from '../state'

const WARN_MS = 5 * 60 * 1000
/** The content is bundled: whether it can fill an exam never changes while the app runs. */
const shortage = gridShortage(questions)

export default function Examen() {
  const { data, update } = useAppData()
  const exam = data!.examInProgress
  const [confirmQuit, setConfirmQuit] = useState(false)
  const [summary, setSummary] = useState(false)
  const [, setTick] = useState(0)
  const heading = useRef<HTMLHeadingElement>(null)

  // On arrival: resume the exam in progress, else draw a new one. Runs once: `update` never changes.
  useEffect(() => {
    if (shortage) return
    update((d) => (d.examInProgress ? d : { ...d, examInProgress: drawExam(questions, examHistory(d.exams), Math.random, new Date()) }))
  }, [update])

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const finish = useCallback(() => {
    let id = '' // set by the update below, which runs synchronously
    update((d) => {
      if (!d.examInProgress) return d
      const now = new Date()
      const end = Math.min(now.getTime(), Date.parse(d.examInProgress.startedAt) + EXAM_DURATION_MS)
      const record = scoreExam(d.examInProgress, new Date(end).toISOString())
      id = record.id
      return { ...d, exams: [...d.exams, record], cards: markMissed(d.cards, missedQuestionIds(record), now), examInProgress: null }
    })
    if (id) navigate(`/resultats/${encodeURIComponent(id)}`, true)
  }, [update])

  const remaining = exam ? remainingMs(exam, new Date()) : EXAM_DURATION_MS
  const expired = !!exam && remaining === 0
  useEffect(() => {
    if (expired) finish()
  }, [expired, finish])

  // A new question: back to the top, focus on the question for screen readers.
  const current = exam?.current
  const shown = useRef(current)
  useEffect(() => {
    if (current === undefined || shown.current === current) return
    if (shown.current !== undefined) {
      window.scrollTo(0, 0)
      heading.current?.focus({ preventScroll: true })
    }
    shown.current = current
  }, [current])

  if (shortage && !exam) {
    return (
      <div className="examen">
        <div className="card examen__unavailable">
          <h1>Examen blanc indisponible</h1>
          <p>{frenchSpacing(shortage)}</p>
          <a href="#/" className="pill-button pill-button--primary">
            Retour à l’accueil
          </a>
        </div>
      </div>
    )
  }
  if (!exam) return null

  const edit = (patch: (ex: ExamInProgress) => Partial<ExamInProgress>) =>
    update((d) => (d.examInProgress ? { ...d, examInProgress: { ...d.examInProgress, ...patch(d.examInProgress) } } : d))
  const go = (index: number) => edit(() => ({ current: index }))

  const total = exam.questionIds.length
  const n = exam.current + 1
  const id = exam.questionIds[exam.current]
  const q = exam.snapshot[id]
  const situation = isSituation(q.notion)
  const parts = situation ? splitSituation(q.question) : null
  const flagged = exam.flagged.includes(id)
  const warn = remaining < WARN_MS

  return (
    <div className="examen">
      <header className="examen__header">
        <button type="button" className="icon-button icon-button--small" aria-label="Quitter l’examen" onClick={() => setConfirmQuit(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <span className="examen__count">
          Question {n} / {total}
        </span>
        <span role="timer" className={warn ? 'examen__timer examen__timer--warn' : 'examen__timer'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2 2M9 2h6" />
          </svg>
          <span className="visually-hidden">Temps restant : </span>
          {formatTimer(remaining)}
        </span>
      </header>
      <p className="visually-hidden" aria-live="polite">
        {warn ? 'Il reste moins de 5 minutes.' : ''}
      </p>

      <div role="progressbar" aria-label="Avancement" aria-valuenow={n} aria-valuemin={0} aria-valuemax={total} className="examen__progress">
        <div style={{ width: `${(n / total) * 100}%` }} />
      </div>

      <div className={`examen__card theme-tile--${q.theme}`}>
        <div className="examen__chips">
          <span className="chip">{THEME_LABELS[q.theme]}</span>
          {situation && <span className="chip">Mise en situation</span>}
        </div>
        {parts && <p className="examen__scenario">{frenchSpacing(parts.scenario)}</p>}
        <h1 ref={heading} tabIndex={-1} className={parts ? 'examen__situation-question' : undefined}>
          {frenchSpacing(parts ? parts.question : q.question)}
        </h1>
      </div>

      <fieldset key={id} className="examen__choices">
        <legend className="visually-hidden">Choisissez une réponse</legend>
        {(exam.choiceOrder[id] ?? q.choices.map((_, i) => i)).map((choice) => (
          <label key={choice} className="choice">
            <input
              type="radio"
              name={`question-${id}`}
              checked={exam.answers[id] === choice}
              onChange={() => edit((ex) => ({ answers: { ...ex.answers, [id]: choice } }))}
            />
            {frenchSpacing(q.choices[choice])}
          </label>
        ))}
      </fieldset>

      <p className="examen__hint">Comme le jour de l’examen, la correction s’affiche à la fin.</p>

      <div className="examen__footer">
        <button type="button" className="examen__previous" disabled={n === 1} onClick={() => go(exam.current - 1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Précédente
        </button>
        <div className="examen__actions">
          <button
            type="button"
            className="pill-button pill-button--secondary examen__flag"
            aria-pressed={flagged}
            onClick={() => edit((ex) => ({ flagged: flagged ? ex.flagged.filter((f) => f !== id) : [...ex.flagged, id] }))}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={flagged ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 3h12v18l-6-4-6 4z" />
            </svg>
            À revoir
          </button>
          <button
            type="button"
            className="pill-button pill-button--primary examen__next"
            onClick={() => (n === total ? setSummary(true) : go(exam.current + 1))}
          >
            {n === total ? 'Terminer l’examen' : 'Question suivante'}
          </button>
        </div>
      </div>

      {confirmQuit && (
        <ConfirmDialog title="Quitter ?" confirm="Quitter" onConfirm={() => navigate('/')} onCancel={() => setConfirmQuit(false)}>
          Votre progression est gardée. Le minuteur continue de tourner.
        </ConfirmDialog>
      )}

      {summary && (
        <SummarySheet
          exam={exam}
          onJump={(index) => {
            setSummary(false)
            go(index)
          }}
          onCancel={() => setSummary(false)}
          onConfirm={finish}
        />
      )}
    </div>
  )
}

function SummarySheet({ exam, onJump, onCancel, onConfirm }: { exam: ExamInProgress; onJump: (index: number) => void; onCancel: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    cancel.current!.focus() // after showModal, which focuses the first button (a jump link)
    return () => dialog.close()
  }, [])
  const total = exam.questionIds.length
  const answered = exam.questionIds.filter((id) => exam.answers[id] != null).length
  const flagged = exam.questionIds.flatMap((id, index) => (exam.flagged.includes(id) ? [index] : []))

  return (
    <dialog ref={ref} className="dialog sheet" aria-labelledby="sheet-titre" onCancel={onCancel}>
      <h2 id="sheet-titre">Terminer l’examen&nbsp;?</h2>
      <dl className="sheet__stats">
        <div>
          <dt>Répondues</dt>
          <dd>
            {answered} / {total}
          </dd>
        </div>
        <div>
          <dt>Sans réponse</dt>
          <dd>{total - answered}</dd>
        </div>
        <div>
          <dt>À revoir</dt>
          <dd>{flagged.length}</dd>
        </div>
      </dl>
      {flagged.length > 0 && (
        <section className="sheet__flagged" aria-labelledby="sheet-revoir">
          <h3 id="sheet-revoir">Questions marquées à revoir</h3>
          <div>
            {flagged.map((index) => (
              <button key={index} type="button" className="soft-button" onClick={() => onJump(index)}>
                Question {index + 1}
              </button>
            ))}
          </div>
        </section>
      )}
      {answered < total && <p>Les questions sans réponse comptent comme fausses.</p>}
      <div className="dialog__buttons">
        <button ref={cancel} type="button" className="soft-button" onClick={onCancel}>
          Continuer
        </button>
        <button type="button" className="soft-button soft-button--primary" onClick={onConfirm}>
          Terminer
        </button>
      </div>
    </dialog>
  )
}
