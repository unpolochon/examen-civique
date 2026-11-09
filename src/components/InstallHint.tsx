/** How to add the app to the iPhone home screen. With `onDismiss`, a close button. */
export default function InstallHint({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <section className="install-hint" aria-label="Installer l’app">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="6" y="2" width="12" height="20" rx="3" />
        <path d="M11 18h2" />
      </svg>
      <p>
        Sur iPhone, touchez <strong>Partager</strong> puis <strong>Sur l’écran d’accueil</strong>. L’app marche hors ligne et vos données sont
        mieux conservées.
      </p>
      {onDismiss && (
        <button type="button" className="icon-button icon-button--small install-hint__close" aria-label="Masquer ce conseil" onClick={onDismiss}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
    </section>
  )
}
