import { useEffect, useRef, type ReactNode } from 'react'

/** Modal confirmation, opened on mount. Escape and "Annuler" call onCancel. */
export default function ConfirmDialog(props: {
  title: string
  confirm: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return (
    <dialog ref={ref} className="dialog" aria-labelledby="dialog-titre" aria-describedby="dialog-texte" onCancel={props.onCancel}>
      <h2 id="dialog-titre">{props.title}</h2>
      <p id="dialog-texte">{props.children}</p>
      <div className="dialog__buttons">
        <button type="button" className="soft-button" onClick={props.onCancel} autoFocus>
          Annuler
        </button>
        <button type="button" className={props.danger ? 'soft-button soft-button--danger' : 'soft-button soft-button--primary'} onClick={props.onConfirm}>
          {props.confirm}
        </button>
      </div>
    </dialog>
  )
}
