import { useState, type FormEvent } from 'react'
import { newAppData } from '../domain/storage'
import { navigate } from '../router'
import { useAppData } from '../state'

const tiles = [
  { theme: 'principes', label: 'Principes et valeurs', icon: <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" /> },
  { theme: 'institutions', label: 'Institutions', icon: <path d="M3 21h18M4 10h16M12 3l9 5H3zM6 10v8M10 10v8M14 10v8M18 10v8" /> },
  { theme: 'droits', label: 'Droits et devoirs', icon: <path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0zM8 21h8" /> },
  {
    theme: 'histoire',
    label: 'Histoire et géographie',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </>
    ),
  },
]

export default function Bienvenue() {
  const { update } = useAppData()
  const [firstName, setFirstName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [error, setError] = useState(false)

  function submit(e: FormEvent) {
    e.preventDefault()
    const name = firstName.trim()
    if (!name) {
      setError(true)
      return
    }
    update(newAppData(name, examDate || null, new Date()))
    navigate('/', true)
  }

  return (
    <div className="bienvenue">
      <div className="bienvenue__tiles" aria-hidden="true">
        {tiles.map(({ theme, label, icon }) => (
          <div key={theme} className={`theme-tile theme-tile--${theme} bienvenue__tile`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {icon}
            </svg>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="bienvenue__intro">
        <h1>Préparez l’examen civique de la carte de résident</h1>
        <p>40 questions, 45 minutes, 32 bonnes réponses pour réussir. Vos données restent sur ce téléphone.</p>
      </div>

      <form className="form-card" onSubmit={submit} noValidate>
        <label className="field">
          Votre prénom
          <input
            type="text"
            placeholder="Prénom"
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value)
              setError(false)
            }}
            aria-invalid={error || undefined}
            aria-describedby={error ? 'prenom-erreur' : undefined}
          />
          {error && (
            <span id="prenom-erreur" className="field__error">
              Indiquez votre prénom pour commencer.
            </span>
          )}
        </label>
        <label className="field">
          Date de votre examen (facultatif)
          <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        </label>
        <button type="submit" className="pill-button pill-button--primary pill-button--large">
          Commencer
        </button>
      </form>
    </div>
  )
}
