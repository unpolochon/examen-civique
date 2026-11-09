import { lessonById, lessons } from '../content'
import { isPassed, typeScores } from '../domain/exam'
import { examTitle, frenchSpacing, plural } from '../domain/format'
import { revisionPlan, WEAK_THRESHOLD } from '../domain/plan'
import { PASS_SCORE, THEME_SHORT_LABELS, THEMES, type Score } from '../domain/types'
import { useAppData } from '../state'

const BOOK = (
  <>
    <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
    <path d="M4 21V5" />
  </>
)
const CARDS = (
  <>
    <rect x="3" y="6" width="14" height="14" rx="2" />
    <path d="M7 3h12a2 2 0 0 1 2 2v12" />
  </>
)

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="icon-button icon-button--small" aria-label={label}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M15 6l-6 6 6 6" />
      </svg>
    </a>
  )
}

export function ExamNotFound() {
  return (
    <div className="resultats">
      <header className="resultats__header">
        <BackLink href="#/" label="Retour à l'accueil" />
      </header>
      <div className="card">
        <h1>Examen introuvable</h1>
      </div>
    </div>
  )
}

export default function Resultats({ id }: Record<string, string>) {
  const record = useAppData().data!.exams.find((e) => e.id === id)
  if (!record) return <ExamNotFound />

  const total = record.questionIds.length
  const passed = isPassed(record)
  const percent = Math.round((record.score / total) * 100)
  const { connaissance, situation } = typeScores(record)
  const plan = revisionPlan(record, lessons)
  const missed = plan.missedQuestionIds.length
  const items = [
    ...plan.lessons.flatMap(({ lessonId, errors }) => {
      const lesson = lessonById.get(lessonId)
      return lesson
        ? [{ href: `#/lecon/${lesson.id}`, theme: lesson.theme, title: frenchSpacing(lesson.title), meta: `Leçon · ${lesson.minutes} min · ${plural(errors, 'erreur')}`, action: 'Lire' }]
        : []
    }),
    ...(missed
      ? [{ href: '#/cartes', theme: null, title: `Revoir ${missed > 1 ? `mes ${missed} erreurs` : 'mon erreur'}`, meta: 'Ajoutées aux cartes du jour', action: 'Réviser' }]
      : []),
  ]

  return (
    <div className="resultats">
      <header className="resultats__header">
        <BackLink href="#/" label="Retour à l'accueil" />
        <span>{examTitle(record.finishedAt)}</span>
      </header>

      <section className={passed ? 'score-card score-card--passed' : 'score-card'} aria-labelledby="score-titre">
        <span className="score-card__tag">{passed ? 'Réussi' : 'Pas encore réussi'}</span>
        <div className="score-card__main">
          <div
            role="img"
            aria-label={`${plural(record.score, 'bonne réponse')} sur ${total}`}
            className="score-card__ring"
            style={{ background: `conic-gradient(var(--primary) 0 ${percent}%, var(--surface) ${percent}% 100%)` }}
          >
            <div>
              <span className="score-card__score">{record.score}</span>
              <span>sur {total}</span>
            </div>
          </div>
          <div className="score-card__text">
            <h1 id="score-titre">{passed ? 'Bravo, examen réussi' : `Encore ${plural(PASS_SCORE - record.score, 'bonne réponse')}`}</h1>
            <span>
              Il {passed ? 'fallait' : 'faut'} {PASS_SCORE}/{total} (80&nbsp;%) pour réussir.
            </span>
          </div>
        </div>
        <div className="score-card__types">
          <SubScore label="Connaissances" score={connaissance} />
          <SubScore label="Mises en situation" score={situation} />
        </div>
      </section>

      <section className="card resultats__themes" aria-labelledby="themes-titre">
        <h2 id="themes-titre">Par thématique</h2>
        {THEMES.filter((t) => record.byTheme[t]?.total).map((theme) => {
          const { correct, total } = record.byTheme[theme]
          return (
            <div key={theme} className={`theme-score theme-score--${theme}`}>
              <div className="theme-score__row">
                <span className="theme-score__square" aria-hidden="true" />
                <span className="theme-score__label">{THEME_SHORT_LABELS[theme]}</span>
                {correct / total < WEAK_THRESHOLD && <span className="theme-score__weak">À renforcer</span>}
                <span className="theme-score__value">
                  {correct}/{total}
                </span>
              </div>
              <div className="theme-score__bar" aria-hidden="true">
                <div style={{ width: `${(correct / total) * 100}%` }} />
              </div>
            </div>
          )
        })}
      </section>

      <section className="resultats__plan" aria-labelledby="plan-titre">
        <h2 id="plan-titre">Votre plan de révision</h2>
        {items.length ? (
          items.map((item) => (
            <a key={item.href} href={item.href} className="plan-item">
              <span className={item.theme ? `plan-item__icon theme-tile--${item.theme}` : 'plan-item__icon plan-item__icon--cards'}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {item.theme ? BOOK : CARDS}
                </svg>
              </span>
              <span className="plan-item__text">
                <span className="plan-item__title">{item.title}</span>
                <span className="plan-item__meta">{item.meta}</span>
              </span>
              <span className="plan-item__action">{item.action}</span>
            </a>
          ))
        ) : (
          <p className="card resultats__empty">Aucune erreur : rien à revoir.</p>
        )}
      </section>

      <div className="resultats__buttons">
        {items.length > 0 && (
          <a href={items[0].href} className="pill-button pill-button--primary">
            Commencer le plan
          </a>
        )}
        <a href={`#/correction/${encodeURIComponent(record.id)}`} className="pill-button pill-button--secondary">
          Voir la correction détaillée
        </a>
      </div>
    </div>
  )
}

function SubScore({ label, score }: { label: string; score: Score }) {
  return (
    <div>
      <span>{label}</span>
      <span>
        {score.correct} / {score.total}
      </span>
    </div>
  )
}
