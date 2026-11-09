import { useEffect, useMemo, useRef } from 'react'
import ThemeHero from '../components/ThemeHero'
import { lessonById, lessons, questions } from '../content'
import { renderLesson } from '../content/markdown'
import { frenchSpacing } from '../domain/format'
import { THEME_LABELS, type Lesson } from '../domain/types'
import { useAppData } from '../state'

export default function Lecon({ theme, slug }: Record<string, string>) {
  const { data, update } = useAppData()
  const id = `${theme}/${slug}`
  const lesson = lessonById.get(id)
  const isRead = data!.lessonsRead.includes(id)
  const end = useRef<HTMLDivElement>(null)
  const body = useMemo(() => lesson && renderLesson(lesson.body), [lesson])

  // Read once the end of the lesson ("À retenir") has been on screen.
  useEffect(() => {
    if (!lesson || isRead || !end.current) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting))
        update((d) => (d.lessonsRead.includes(id) ? d : { ...d, lessonsRead: [...d.lessonsRead, id] }))
    })
    observer.observe(end.current)
    return () => observer.disconnect()
  }, [id, lesson, isRead, update])

  if (!lesson || !body) return <NotFound />
  const siblings = lessons.filter((l) => l.theme === lesson.theme)
  const index = siblings.indexOf(lesson)
  const [previous, next] = [siblings[index - 1], siblings[index + 1]]
  const linked = questions.filter((q) => q.lesson === id && q.official).length

  return (
    <article className="lecon">
      <ThemeHero
        theme={lesson.theme}
        back={`#/lecons/${lesson.theme}`}
        eyebrow={`${THEME_LABELS[lesson.theme]} · Leçon ${index + 1} sur ${siblings.length}`}
        title={lesson.title}
        chips={[`${lesson.minutes} min de lecture`, ...(linked ? [`${linked} ${linked > 1 ? 'questions officielles' : 'question officielle'}`] : [])]}
      />
      <div className="lecon__content">
        {/* Built by marked from our own Markdown files, raw HTML escaped (content/markdown.ts). */}
        <div className="lecon__body" dangerouslySetInnerHTML={{ __html: body.html }} />
        {body.retenir && (
          <section className="lecon__retenir" aria-labelledby="lecon-retenir">
            <h2 id="lecon-retenir">À retenir</h2>
            <div dangerouslySetInnerHTML={{ __html: body.retenir }} />
          </section>
        )}
        <div ref={end} className="lecon__end" />

        <section className="lecon__sources" aria-labelledby="lecon-sources">
          <h2 id="lecon-sources">Sources</h2>
          <ul>
            {lesson.sources.map((url, i) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <span>
                    {`Fiche officielle${lesson.sources.length > 1 ? ` ${i + 1}` : ''}`}
                    <span className="sr-only"> (nouvel onglet)</span>
                    <small>{new URL(url).hostname}</small>
                  </span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 4h6v6" />
                    <path d="M20 4l-9 9" />
                    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {linked > 0 && (
          <a href={`#/cartes?lecon=${encodeURIComponent(id)}`} className="pill-button pill-button--primary">
            Me tester sur cette leçon
          </a>
        )}

        {(previous || next) && (
          <nav className="lecon__siblings" aria-label="Autres leçons de la thématique">
            {previous && <Sibling lesson={previous} label="Leçon précédente" />}
            {next && <Sibling lesson={next} label="Leçon suivante" next />}
          </nav>
        )}
      </div>
    </article>
  )
}

function Sibling({ lesson, label, next }: { lesson: Lesson; label: string; next?: boolean }) {
  return (
    <a href={`#/lecon/${lesson.id}`} className={next ? 'lecon__sibling lecon__sibling--next' : 'lecon__sibling'}>
      <small>{label}</small>
      <span>{frenchSpacing(lesson.title)}</span>
    </a>
  )
}

export function NotFound() {
  return (
    <div className="lecons">
      <header className="screen-header">
        <a href="#/lecons" className="icon-button icon-button--small" aria-label="Retour aux leçons">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </a>
        <h1>Leçon introuvable</h1>
      </header>
      <p className="lecons__empty">Cette page n’existe pas ou plus.</p>
    </div>
  )
}
