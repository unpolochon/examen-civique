/** Opened from the home screen icon. */
export const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

/** Safari on iPhone or iPad (iPadOS says it is a Mac, with touch). Other iOS browsers have their own menus. */
export function isIosSafari(): boolean {
  const ua = navigator.userAgent
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  return ios && /Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
}

const HINT_KEY = 'civique:conseil-installation-masque'

export function installHintDismissed(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) !== null
  } catch {
    return false
  }
}

export function dismissInstallHint(): void {
  try {
    localStorage.setItem(HINT_KEY, '1')
  } catch {
    // Storage refused: the hint shows again on the next visit.
  }
}
