'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const inputClass =
  'w-full border-b border-border bg-transparent py-2 text-ink focus:border-b-2 focus:border-[oklch(0.72_0.09_230)] focus:outline-none'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) {
      setError('Wrong email or password.')
      return
    }
    router.push('/admin')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <label className="ds-field">
        <span className="mb-2 block text-sm font-medium text-muted">Email</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </label>
      <label className="ds-field">
        <span className="mb-2 block text-sm font-medium text-muted">Password</span>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
      </label>
      {error && <p className="text-sm text-[var(--tally-red-text)]">{error}</p>}
      <button type="submit" className="w-fit rounded-xs bg-tally px-6 py-3 font-semibold text-on-accent">
        Sign in
      </button>
    </form>
  )
}
