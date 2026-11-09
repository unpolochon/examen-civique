import { useEffect, useRef, useState, type ReactNode } from 'react'
import { lessonById, questionById, questions } from '../content'
import { frenchSpacing, intervalLabel } from '../domain/format'
import { dueCards, review, type Grade } from '../domain/srs'
import { THEME_LABELS } from '../domain/types'
import { useAppData } from '../state'

const GRADES: { grade: Grade; label: string }[] = [
  { grade: 'non', label: 'Non' },
  { grade: 'hesite', label: 'Hésité' },
  { grade: 'oui', label: 'Oui' },
]

/** `#/cartes`: the cards due now. `#/cartes?lecon=<id>`: every question of that lesson. */
export default function Cartes({ lecon }: { lecon?: string }) {
  // A new lesson starts a new session.
  return <Session key={lecon ?? ''} lessonId={lecon} />
}

function Session({ lessonId }: { lessonId?: string }) {
  const { data, update } = useAppData()
  const cards = data!.cards
  // Fixed for the whole session: a card graded "Non" comes back in 10 minutes, not in this session.
  const [ids] = useState(() =>
    lessonId
      ? questions.filter((q) => q.lesson === lessonId).map((q) => q.id)
      : dueCards(cards, new Date()).filter((id) => questionById.has(id)),
  )
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [counts, setCounts] = useState<Record<Grade, number>>({ non: 0, hesite: 0, oui: 0 })
  const questionRef = useRef<HTMLHeadingElement>(null)
  const answerRef = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  // The button the user pressed disappears: move the focus to what replaced it.
  useEffect(() => {
    if (revealed) answerRef.current?.focus()
  }, [revealed])
  useEffect(() => {
    if (started.current) questionRef.current?.focus()
    started.current = true
  }, [index])

  const lesson = lessonId ? lessonById.get(lessonId) : undefined
  const title = lessonId ? 'Cartes de la leçon' : 'Cartes du jour'
  const closeHref = lesson ? `#/lecon/${lesson.id}` : '#/'
  const header = (counter?: ReactNode) => (
    <header className="cartes__header">
      <a href={closeHref} className="icon-button icon-button--small" aria-label="Fermer les cartes">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </a>
      <span className="cartes__title">{title}</span>
      {counter ?? <span className="cartes__spacer" />}
    </header>
  )

  if (ids.length === 0) {
    return (
      <div className="cartes">
        {header()}
        <State
          title={lessonId ? 'Aucune carte pour cette leçon' : 'Aucune carte à revoir'}
          text={
            lessonId
              ? 'Cette leçon n’a pas encore de questions. Choisissez une autre leçon.'
              : Object.keys(cards).length
                ? 'Vos prochaines cartes ne sont pas encore dues. Faites un examen blanc ou révisez une leçon en attendant.'
                : 'Les erreurs de vos examens blancs deviennent des cartes à revoir. Faites un examen blanc ou révisez une leçon.'
          }
        >
          {!lessonId && (
            <a href="#/examen" className="pill-button pill-button--primary">
              Faire un examen blanc
            </a>
          )}
          <a href="#/lecons" className={`pill-button ${lessonId ? 'pill-button--primary' : 'pill-button--secondary'}`}>
            Voir les leçons
          </a>
        </State>
      </div>
    )
  }

  if (index >= ids.length) {
    return (
      <div className="cartes">
        {header()}
        <State
          done
          title={lessonId ? 'Bravo, toutes les cartes de la leçon sont revues' : 'Bravo, plus de cartes pour aujourd’hui'}
          text={`Vous avez revu ${ids.length} carte${ids.length > 1 ? 's' : ''}.`}
        >
          <div className="cartes__counts">
            {GRADES.map(({ grade, label }) => (
              <div key={grade} className={`cartes__count cartes__count--${grade}`}>
                <strong>{counts[grade]}</strong>
                {label}
              </div>
            ))}
          </div>
          {lesson && (
            <a href={`#/lecon/${lesson.id}`} className="pill-button pill-button--secondary">
              Revenir à la leçon
            </a>
          )}
          <a href="#/" className="pill-button pill-button--primary">
            {'Retour à l’accueil'}
          </a>
        </State>
      </div>
    )
  }

  const question = questionById.get(ids[index])!
  const questionLesson = lessonById.get(question.lesson)
  const now = new Date()

  function grade(value: Grade) {
    const at = new Date()
    update((d) => ({ ...d, cards: { ...d.cards, [question.id]: review(d.cards[question.id], value, at) } }))
    setCounts((c) => ({ ...c, [value]: c[value] + 1 }))
    setRevealed(false)
    setIndex((i) => i + 1)
  }

  return (
    <div className="cartes">
      {header(
        <span className="cartes__counter" aria-label={`Carte ${index + 1} sur ${ids.length}`}>
          {index + 1} / {ids.length}
        </span>,
      )}

      <section className={`cartes__card theme-tile--${question.theme}`} aria-label="Carte">
        <span className="chip">{THEME_LABELS[question.theme]}</span>
        <h1 ref={questionRef} tabIndex={-1}>
          {frenchSpacing(question.question)}
        </h1>
        {revealed && (
          <div ref={answerRef} tabIndex={-1} className="cartes__answer">
            <span className="cartes__answer-label">Réponse</span>
            <span className="cartes__answer-text">{frenchSpacing(question.choices[question.answer])}</span>
            <p>{frenchSpacing(question.explanation)}</p>
            {questionLesson && <a href={`#/lecon/${questionLesson.id}`}>{frenchSpacing(`Relire la leçon « ${questionLesson.title} »`)}</a>}
          </div>
        )}
      </section>

      <div className="cartes__actions">
        {revealed ? (
          <>
            <span id="cartes-prompt">Vous la connaissiez&nbsp;?</span>
            <div className="cartes__grades" role="group" aria-labelledby="cartes-prompt">
              {GRADES.map(({ grade: value, label }) => {
                const delay = intervalLabel(Date.parse(review(cards[question.id], value, now).due) - now.getTime())
                return (
                  <button key={value} type="button" className={`cartes__grade cartes__grade--${value}`} onClick={() => grade(value)}>
                    <strong>{label}</strong>
                    <span>{delay}</span>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <span>Cherchez la réponse de tête, puis vérifiez.</span>
            <button type="button" className="pill-button pill-button--primary" onClick={() => setRevealed(true)}>
              Voir la réponse
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function State({ title, text, done = false, children }: { title: string; text: string; done?: boolean; children: ReactNode }) {
  return (
    <section className="cartes__state">
      <span className="cartes__state-icon" aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {done ? (
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          ) : (
            <>
              <rect x="3" y="6" width="14" height="14" rx="2" />
              <path d="M7 3h12a2 2 0 0 1 2 2v12" />
            </>
          )}
        </svg>
      </span>
      <h1>{frenchSpacing(title)}</h1>
      <p>{frenchSpacing(text)}</p>
      <div className="cartes__state-actions">{children}</div>
    </section>
  )
}
