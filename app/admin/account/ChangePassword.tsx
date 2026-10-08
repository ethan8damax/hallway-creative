'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Field, btn, inputClass } from '@/components/admin/ui'

export function ChangePassword() {
  const [state, setState] = useState<{ status: 'idle' | 'saving' | 'saved' | 'error'; message?: string }>({ status: 'idle' })

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const password = String(fd.get('password'))
    if (password.length < 10) return setState({ status: 'error', message: 'Use at least 10 characters.' })
    if (password !== fd.get('confirm')) return setState({ status: 'error', message: "The two passwords don't match." })
    setState({ status: 'saving' })
    const { error } = await createClient().auth.updateUser({ password })
    if (error) return setState({ status: 'error', message: error.message })
    form.reset()
    setState({ status: 'saved' })
  }

  return (
    <form onSubmit={submit} className="flex max-w-sm flex-col gap-4">
      <Field label="New password" hint="At least 10 characters.">
        <input name="password" type="password" autoComplete="new-password" required className={inputClass} />
      </Field>
      <Field label="Type it again">
        <input name="confirm" type="password" autoComplete="new-password" required className={inputClass} />
      </Field>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={state.status === 'saving'} className={btn.primary}>
          {state.status === 'saving' ? 'Saving…' : 'Change password'}
        </button>
        <span role="status" aria-live="polite" className="text-sm">
          {state.status === 'saved' && <span className="text-monitor">Password changed</span>}
          {state.status === 'error' && <span className="text-tally-text">{state.message}</span>}
        </span>
      </div>
    </form>
  )
}
