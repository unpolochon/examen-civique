import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { clear, load, save } from './domain/storage'
import type { AppData } from './domain/types'

interface AppDataContext {
  /** null while no profile exists. */
  data: AppData | null
  /** Replaces the data (a value or a function of the current data) and saves it. Returns false when the browser refused to save. */
  update: (next: AppData | ((data: AppData) => AppData)) => boolean
  /** Erases everything: back to the first launch. */
  reset: () => void
}

const Context = createContext<AppDataContext | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(load)
  // Latest data for updates chained before a re-render.
  const current = useRef(data)

  const update = useCallback((next: AppData | ((data: AppData) => AppData)) => {
    if (typeof next === 'function' && !current.current) throw new Error('Aucun profil à modifier')
    const value = typeof next === 'function' ? next(current.current!) : next
    current.current = value
    setData(value)
    return save(value)
  }, [])

  const reset = useCallback(() => {
    clear()
    current.current = null
    setData(null)
  }, [])

  const value = useMemo(() => ({ data, update, reset }), [data, update, reset])
  return <Context value={value}>{children}</Context>
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with its provider
export function useAppData(): AppDataContext {
  const value = useContext(Context)
  if (!value) throw new Error('useAppData doit être utilisé dans AppDataProvider')
  return value
}
