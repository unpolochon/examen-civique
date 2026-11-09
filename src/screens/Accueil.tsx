import { useRef, useState } from 'react'
import InstallHint from '../components/InstallHint'
import { lessons, questions } from '../content'
import { isPassed } from '../domain/exam'
import { examDateLabel, themeMeta } from '../domain/format'
import { dueCards } from '../domain/srs'
import { PASS_SCORE, THEME_LABELS, THEMES, type AppData } from '../domain/types'
import { dismissInstallHint, installHintDismissed, isIosSafari, isStandalone } from '../install'
import { useAppData } from '../state'

export default function Accueil() {
  const data = useAppData().data!
  const now = new Date()
  const dateLabel = examDateLabel(data.profile.examDate, now)
  const due = dueCards(data.cards, now).length
  const [installHint, setInstallHint] = useState(() => isIosSafari() && !isStandalone() && !installHintDismissed())
  const nextLink = useRef<HTMLAnchorElement>(null)

  return (
    <div className="accueil">
      <header className="accueil__header">
        <div className="accueil__hello">
          <h1>Bonjour {data.profile.firstName}</h1>
          {dateLabel && <span>{dateLabel}</span>}
        </div>
        <a href="#/reglages" className="icon-button" aria-label="Réglages">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </a>
      </header>

      <ExamCard data={data} />

      {installHint && (
        <InstallHint
          onDismiss={() => {
            dismissInstallHint()
            setInstallHint(false)
            nextLink.current?.focus() // the focused button disappears
          }}
        />
      )}

      <div className="accueil__section">
        <h2>Les 5 thématiques</h2>
        <a ref={nextLink} href="#/lecons">
          Tout voir
        </a>
      </div>

      <div className="accueil__tiles">
        {THEMES.map((theme) => {
          const meta = themeMeta(theme, lessons, questions)
          return (
            <a key={theme} href={`#/lecons/${theme}`} className={`theme-tile theme-tile--${theme}`}>
              <span className="theme-tile__title">{THEME_LABELS[theme]}</span>
              {meta && <span className="theme-tile__meta">{meta}</span>}
            </a>
          )
        })}
        <a href="#/cartes" className="theme-tile accueil__cards">
          <span className="theme-tile__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="6" width="14" height="14" rx="2" />
              <path d="M7 3h12a2 2 0 0 1 2 2v12" />
            </svg>
            Cartes du jour
          </span>
          <span className="theme-tile__meta">{due ? `${due} à revoir` : 'Rien à revoir'}</span>
        </a>
      </div>
    </div>
  )
}

/** Recommended while no exam is finished, then resume or last score. */
function ExamCard({ data }: { data: AppData }) {
  const inProgress = data.examInProgress
  const last = data.exams.at(-1)
  const [tag, meta, text, action] = inProgress
    ? [
        'En cours',
        `Question ${inProgress.current + 1} sur ${inProgress.questionIds.length}`,
        'Vos réponses sont enregistrées : reprenez là où vous en étiez.',
        "Reprendre l'examen blanc",
      ]
    : last
      ? [
          null,
          `Dernier examen blanc : ${last.score}/${last.questionIds.length}`,
          isPassed(last)
            ? 'Seuil atteint. Refaites-en un pour confirmer votre niveau.'
            : `Il faut ${PASS_SCORE} bonnes réponses pour réussir. Refaites-en un après vos révisions.`,
          'Refaire un examen blanc',
        ]
      : [
          'Recommandé',
          '40 questions · 45 min · comme le jour J',
          "Commencez par là : vous verrez vos points forts et ce qu'il faut revoir.",
          'Commencer',
        ]

  return (
    <section className="exam-card" aria-labelledby="exam-card-title">
      {tag && <span className="exam-card__tag">{tag}</span>}
      <h2 id="exam-card-title">Examen blanc</h2>
      <span className="exam-card__meta">{meta}</span>
      <p>{text}</p>
      <a href="#/examen" className="pill-button pill-button--primary pill-button--small">
        {action}
      </a>
    </section>
  )
}
