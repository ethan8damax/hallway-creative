'use client'

import { useActionState } from 'react'
import { btn } from './ui'

type State = { ok?: true; error?: string; at?: number }

// Wraps a server action with visible feedback: "Saving…", then "Saved" (fades
// out on its own) or the error message.
export function ActionForm({
  action,
  submitLabel = 'Save',
  children,
  className = '',
  resetOnSuccess = false,
}: {
  action: (formData: FormData) => Promise<void>
  submitLabel?: string
  children: React.ReactNode
  className?: string
  resetOnSuccess?: boolean
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(async (_prev, formData) => {
    try {
      await action(formData)
      return { ok: true, at: Date.now() }
    } catch (e) {
      return { error: e instanceof Error && e.message !== 'unauthorized' ? e.message : 'Could not save. Try again.' }
    }
  }, {})

  return (
    // a new key after success clears the fields, for "add" forms
    <form key={resetOnSuccess ? state.at : undefined} action={formAction} className={`flex flex-col gap-5 ${className}`}>
      {children}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={btn.primary}>
          {pending ? 'Saving…' : submitLabel}
        </button>
        <span role="status" aria-live="polite" className="text-sm">
          {state.error ? (
            <span className="text-tally-text">{state.error}</span>
          ) : state.at ? (
            <span key={state.at} className="saved-flash text-monitor">
              Saved
            </span>
          ) : null}
        </span>
      </div>
    </form>
  )
}
