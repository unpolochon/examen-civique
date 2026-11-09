import { lessons, questions } from '../content'
import { themeMeta } from '../domain/format'
import { THEME_LABELS, THEMES } from '../domain/types'
import { useAppData } from '../state'

export default function Lecons() {
  const read = useAppData().data!.lessonsRead
  return (
    <div className="lecons">
      <h1>Leçons</h1>
      <ul className="lecons__tiles">
        {THEMES.map((theme) => {
          const ids = lessons.filter((l) => l.theme === theme).map((l) => l.id)
          const done = ids.filter((id) => read.includes(id)).length
          return (
            <li key={theme}>
              <a href={`#/lecons/${theme}`} className={`theme-tile theme-tile--${theme} lecons__tile`}>
                <span className="lecons__title">{THEME_LABELS[theme]}</span>
                <span className="theme-tile__meta">{themeMeta(theme, lessons, questions)}</span>
                <span className="lecons__progress">
                  <span className="lecons__bar" aria-hidden="true">
                    <span style={{ width: `${ids.length ? (100 * done) / ids.length : 0}%` }} />
                  </span>
                  {done}/{ids.length} {ids.length > 1 ? 'leçons lues' : 'leçon lue'}
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
