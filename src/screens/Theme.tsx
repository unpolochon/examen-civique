import ThemeHero from '../components/ThemeHero'
import { lessons, questions } from '../content'
import { frenchSpacing } from '../domain/format'
import { NOTION_LABELS, THEME_LABELS, THEMES, type Theme as ThemeId } from '../domain/types'
import { useAppData } from '../state'
import { NotFound } from './Lecon'

export default function Theme({ theme }: Record<string, string>) {
  const read = useAppData().data!.lessonsRead
  if (!THEMES.includes(theme as ThemeId)) return <NotFound />
  const id = theme as ThemeId
  const list = lessons.filter((l) => l.theme === id)
  const done = list.filter((l) => read.includes(l.id)).length
  const official = questions.filter((q) => q.theme === id && q.official).length

  return (
    <div className="theme-screen">
      <ThemeHero
        theme={id}
        back="#/lecons"
        eyebrow={`Thématique ${THEMES.indexOf(id) + 1} sur ${THEMES.length}`}
        title={THEME_LABELS[id]}
        chips={[`${done}/${list.length} ${list.length > 1 ? 'leçons lues' : 'leçon lue'}`, `${official} questions officielles`]}
      />
      <ol className="theme-screen__list">
        {list.map((lesson) => {
          const isRead = read.includes(lesson.id)
          return (
            <li key={lesson.id}>
              <a href={`#/lecon/${lesson.id}`} className="lesson-card">
                <span className="lesson-card__text">
                  <span className="lesson-card__title">{frenchSpacing(lesson.title)}</span>
                  <span className="lesson-card__meta">
                    {lesson.minutes} min · {NOTION_LABELS[lesson.notion]}
                  </span>
                </span>
                {isRead ? (
                  <span className="lesson-card__read">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                    <span className="sr-only">Lue</span>
                  </span>
                ) : (
                  <svg className="lesson-card__chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                )}
              </a>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
