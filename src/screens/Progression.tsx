import { questions } from '../content'
import { isPassed } from '../domain/exam'
import { scoreDeltaLabel } from '../domain/format'
import { mastery } from '../domain/srs'
import { EXAM_QUESTIONS, PASS_SCORE, THEMES, type ExamRecord, type Theme } from '../domain/types'
import { useAppData } from '../state'

/** Exams shown in the chart: 6 keeps the date labels readable at 390px. */
const CHART_EXAMS = 6

/** Short labels from the mockup: the tiles are narrow. */
const SHORT_LABELS: Record<Theme, string> = {
  principes: 'Principes et valeurs',
  institutions: 'Institutions',
  droits: 'Droits et devoirs',
  histoire: 'Histoire, géographie',
  societe: 'Vivre dans la société',
}

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
const longDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const percent = (share: number) => `${Math.round(share * 100)}\u00a0%`

export default function Progression() {
  const data = useAppData().data!
  const exams = data.exams

  if (exams.length === 0) {
    return (
      <div className="progression">
        <h1>Votre progression</h1>
        <section className="card progression__empty">
          <h2>Pas encore d'examen blanc</h2>
          <p>Passez un premier examen blanc : vos scores et votre maîtrise de chaque thématique apparaîtront ici.</p>
          <a href="#/examen" className="pill-button pill-button--primary">
            Faire un examen blanc
          </a>
        </section>
      </div>
    )
  }

  const tiles = THEMES.map((theme) => ({
    theme,
    share: mastery(
      data.cards,
      questions.filter((q) => q.theme === theme).map((q) => q.id),
    ),
  })).sort((a, b) => b.share - a.share)

  return (
    <div className="progression">
      <h1>Votre progression</h1>
      <ScoreChart exams={exams.slice(-CHART_EXAMS)} />

      <h2 className="progression__section">Maîtrise par thématique</h2>
      <div className="progression__tiles">
        {tiles.map(({ theme, share }) => (
          <div key={theme} className={`progression__tile theme-tile--${theme}`}>
            <span className="progression__percent">{percent(share)}</span>
            <span>{SHORT_LABELS[theme]}</span>
          </div>
        ))}
        <a href="#/examen" className="progression__tile progression__redo">
          <strong>Refaire</strong>
          <span>un examen blanc</span>
        </a>
      </div>

      <h2 className="progression__section">Historique</h2>
      <ul className="progression__history">
        {exams.map((exam) => {
          const passed = isPassed(exam)
          return (
            <li key={exam.id}>
              <a href={`#/resultats/${encodeURIComponent(exam.id)}`}>
                <span className="progression__history-main">
                  <span className="progression__history-date">{longDate(exam.finishedAt)}</span>
                  <span className={`progression__status progression__status--${passed ? 'ok' : 'ko'}`}>{passed ? 'Réussi' : 'Non réussi'}</span>
                </span>
                <span className="progression__history-score">
                  {exam.score}/{exam.questionIds.length}
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ScoreChart({ exams }: { exams: ExamRecord[] }) {
  const first = exams[0]
  const last = exams.at(-1)!
  const scores = new Intl.ListFormat('fr', { type: 'conjunction' }).format(exams.map((e) => String(e.score)))
  const label =
    exams.length === 1
      ? `Score du dernier examen blanc : ${last.score} sur ${EXAM_QUESTIONS}. Seuil de réussite ${PASS_SCORE}.`
      : `Scores des ${exams.length} derniers examens blancs : ${scores} sur ${EXAM_QUESTIONS}. Seuil de réussite ${PASS_SCORE}.`
  const columns = { gridTemplateColumns: `repeat(${exams.length}, minmax(0, 1fr))` }
  const height = (score: number) => `${(score / EXAM_QUESTIONS) * 100}%`
  // Spread over the card width like the 5-exam mockup, at most one bar width when there are few exams.
  const width = { maxWidth: exams.length < 5 ? `${(exams.length / 5) * 100}%` : undefined }

  return (
    <section className="card progression__chart" aria-labelledby="progression-exams">
      <div className="progression__chart-head">
        <h2 id="progression-exams">Examens blancs</h2>
        {exams.length > 1 && (
          <span className={`progression__delta progression__delta--${['down', 'flat', 'up'][Math.sign(last.score - first.score) + 1]}`}>{scoreDeltaLabel(first, last)}</span>
        )}
      </div>
      <div className="progression__plot" role="img" aria-label={label}>
        <div className="progression__threshold" style={{ bottom: height(PASS_SCORE) }} />
        <span className="progression__threshold-label" style={{ bottom: `calc(${height(PASS_SCORE)} + 4px)` }}>
          {PASS_SCORE} pour réussir
        </span>
        <div className="progression__bars" style={{ ...columns, ...width }}>
          {exams.map((exam, i) => (
            <div key={exam.id} className={i === exams.length - 1 ? 'progression__bar progression__bar--latest' : 'progression__bar'} style={{ height: height(exam.score) }} />
          ))}
        </div>
      </div>
      <div className="progression__labels" style={{ ...columns, ...width }}>
        {exams.map((exam) => (
          <span key={exam.id}>
            {shortDate(exam.finishedAt)}
            <br />
            <strong>{exam.score}</strong>
          </span>
        ))}
      </div>
    </section>
  )
}
