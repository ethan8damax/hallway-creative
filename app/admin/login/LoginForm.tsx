'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin/auth/callback` },
    })
    if (error) {
      setError('Could not send login link. Try again.')
      return
    }
    setSent(true)
  }

  if (sent) {
    return <p className="text-ink">Check your email for a login link.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <label className="ds-field">
        <span className="mb-2 block text-sm font-medium text-muted">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border-b border-border bg-transparent py-2 text-ink focus:border-b-2 focus:border-[oklch(0.72_0.09_230)] focus:outline-none"
        />
      </label>
      {error && <p className="text-sm text-[var(--tally-red-text)]">{error}</p>}
      <button type="submit" className="w-fit rounded-xs bg-tally px-6 py-3 font-semibold text-on-accent">
        Send magic link
      </button>
    </form>
  )
}
