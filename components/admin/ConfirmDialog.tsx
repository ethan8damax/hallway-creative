'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { btn, inputClass } from './ui'

type ConfirmOptions = {
  title: string
  body: string
  confirmLabel?: string
  // for deletes that wipe many photos at once: the exact text Andrew must type
  requireText?: string
}

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void }

const ConfirmContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(async () => false)

// `const confirm = useConfirm(); if (!(await confirm({...}))) return`
export const useConfirm = () => useContext(ConfirmContext)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null)
  const [typed, setTyped] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setTyped('')
        setPending({ ...options, resolve })
      }),
    []
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (pending && dialog && !dialog.open) dialog.showModal()
  }, [pending])

  function finish(ok: boolean) {
    pending?.resolve(ok)
    setPending(null)
    dialogRef.current?.close()
  }

  const matches = !pending?.requireText || typed.trim() === pending.requireText.trim()

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialogRef}
        // Esc or clicking outside counts as Cancel
        onCancel={(e) => {
          e.preventDefault()
          finish(false)
        }}
        onClick={(e) => e.target === dialogRef.current && finish(false)}
        aria-labelledby="confirm-title"
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-md border border-border bg-bg p-0 text-ink shadow-[0_24px_64px_rgba(0,0,0,0.45)] backdrop:bg-black/70 backdrop:backdrop-blur-[2px]"
      >
        {pending && (
          <form
            className="flex flex-col gap-4 p-5"
            onSubmit={(e) => {
              e.preventDefault()
              if (matches) finish(true)
            }}
          >
            <h2 id="confirm-title" className="text-base font-semibold">
              {pending.title}
            </h2>
            <p className="text-sm leading-relaxed text-muted">{pending.body}</p>
            {pending.requireText && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-ink">
                  Type <strong className="font-semibold">{pending.requireText}</strong> to confirm
                </span>
                <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoFocus className={inputClass} />
              </label>
            )}
            <div className="mt-2 flex justify-end gap-2">
              {/* Cancel takes focus (unless there's a name to type), so a stray Enter never deletes anything */}
              <button type="button" onClick={() => finish(false)} autoFocus={!pending.requireText} className={btn.secondary}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={!matches}
                className={`${btn.primary} disabled:cursor-not-allowed`}
              >
                {pending.confirmLabel ?? 'Delete'}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </ConfirmContext.Provider>
  )
}
