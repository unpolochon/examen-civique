import { useRef, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import { exportFileName } from '../domain/format'
import { exportJson, importJson } from '../domain/storage'
import type { AppData } from '../domain/types'
import { navigate } from '../router'
import { useAppData } from '../state'

const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export default function Reglages() {
  const { data, update, reset } = useAppData()
  const fileInput = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<AppData | null>(null)
  const [confirmErase, setConfirmErase] = useState(false)
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null)
  // Bumped after an import so the profile fields show the imported values.
  const [profileKey, setProfileKey] = useState(0)
  if (!data) return null

  function exportData() {
    const url = URL.createObjectURL(new Blob([exportJson(data!)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = exportFileName(new Date())
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000) // Safari needs the URL a moment after the click
    setMessage(null)
  }

  async function readFile(file: File | undefined) {
    if (fileInput.current) fileInput.current.value = '' // allows choosing the same file again
    if (!file) return
    try {
      setPendingImport(importJson(await file.text()))
      setMessage(null)
    } catch (e) {
      setMessage({ error: true, text: e instanceof Error ? e.message : 'Import impossible.' })
    }
  }

  function replaceData() {
    const saved = update(pendingImport!)
    setPendingImport(null)
    setProfileKey((k) => k + 1)
    setMessage(
      saved
        ? { error: false, text: 'Données importées.' }
        : { error: true, text: "Données importées, mais ce navigateur refuse de les enregistrer : elles seront perdues à la fermeture." },
    )
  }

  return (
    <div className="reglages">
      <header className="screen-header">
        <a href="#/" className="icon-button icon-button--small" aria-label="Retour">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </a>
        <h1>Réglages</h1>
      </header>

      <ProfileForm key={profileKey} data={data} update={update} />

      <section className="form-card form-card--compact reglages__backup" aria-labelledby="sauvegarde-titre">
        <h2 id="sauvegarde-titre">Sauvegarde</h2>
        <p>Vos données restent sur ce téléphone. Gardez une copie pour changer de téléphone.</p>
        <div className="reglages__buttons">
          <button type="button" className="soft-button" onClick={exportData}>
            Exporter
          </button>
          <button type="button" className="soft-button" onClick={() => fileInput.current?.click()}>
            Importer
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          hidden
          aria-label="Fichier de sauvegarde à importer"
          onChange={(e) => readFile(e.target.files?.[0])}
        />
        {message && (
          <p role={message.error ? 'alert' : 'status'} className={message.error ? 'field__error' : 'reglages__status'}>
            {message.text}
          </p>
        )}
      </section>

      {!isStandalone() && (
        <div className="reglages__install">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="6" y="2" width="12" height="20" rx="3" />
            <path d="M11 18h2" />
          </svg>
          <span>
            Sur iPhone, touchez <strong>Partager</strong> puis <strong>Sur l'écran d'accueil</strong>. L'app marche hors ligne et vos données
            sont mieux conservées.
          </span>
        </div>
      )}

      <button type="button" className="reglages__erase" onClick={() => setConfirmErase(true)}>
        Effacer toutes mes données
      </button>

      {pendingImport && (
        <ConfirmDialog
          title="Remplacer vos données ?"
          confirm="Remplacer"
          onConfirm={replaceData}
          onCancel={() => setPendingImport(null)}
        >
          Les données de ce téléphone seront remplacées par celles du fichier (profil de {pendingImport.profile.firstName},{' '}
          {pendingImport.exams.length} examen{pendingImport.exams.length > 1 ? 's' : ''} terminé
          {pendingImport.exams.length > 1 ? 's' : ''}).
        </ConfirmDialog>
      )}

      {confirmErase && (
        <ConfirmDialog
          title="Effacer toutes vos données ?"
          confirm="Tout effacer"
          danger
          onConfirm={() => {
            reset()
            navigate('/bienvenue', true)
          }}
          onCancel={() => setConfirmErase(false)}
        >
          Votre profil, vos examens et vos cartes seront supprimés de ce téléphone. Exportez d'abord une sauvegarde pour les garder.
        </ConfirmDialog>
      )}
    </div>
  )
}

function ProfileForm({ data, update }: { data: AppData; update: ReturnType<typeof useAppData>['update'] }) {
  // Local value so the field can be empty or end with a space while typing; only a non-empty trimmed name is saved.
  const [firstName, setFirstName] = useState(data.profile.firstName)
  const empty = !firstName.trim()
  const setProfile = (patch: Partial<AppData['profile']>) => update((d) => ({ ...d, profile: { ...d.profile, ...patch } }))

  return (
    <form className="form-card form-card--compact" aria-labelledby="profil-titre" onSubmit={(e) => e.preventDefault()}>
      <h2 id="profil-titre">Mon profil</h2>
      <label className="field">
        Prénom
        <input
          type="text"
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => {
            setFirstName(e.target.value)
            if (e.target.value.trim()) setProfile({ firstName: e.target.value.trim() })
          }}
          aria-invalid={empty || undefined}
          aria-describedby={empty ? 'prenom-erreur' : undefined}
        />
        {empty && (
          <span id="prenom-erreur" className="field__error">
            Le prénom ne peut pas être vide.
          </span>
        )}
      </label>
      <label className="field">
        Date de l'examen
        <input type="date" value={data.profile.examDate ?? ''} onChange={(e) => setProfile({ examDate: e.target.value || null })} />
      </label>
    </form>
  )
}
