import type { Theme } from '../domain/types'

/** Pastel header of the Theme and Lecon screens (mockup Lecon.dc.html). */
export default function ThemeHero(props: { theme: Theme; back: string; eyebrow: string; title: string; chips: string[] }) {
  return (
    <header className={`theme-hero theme-tile--${props.theme}`}>
      <div className="theme-hero__top">
        <a href={props.back} className="icon-button icon-button--small" aria-label="Retour">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </a>
        <span className="theme-hero__eyebrow">{props.eyebrow}</span>
      </div>
      <h1>{props.title}</h1>
      <div className="theme-hero__chips">
        {props.chips.map((chip) => (
          <span key={chip} className="chip">
            {chip}
          </span>
        ))}
      </div>
    </header>
  )
}
