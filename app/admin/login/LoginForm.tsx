'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Field, btn, inputClass } from '@/components/admin/ui'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) {
      setError('Wrong email or password.')
      setPending(false)
      return
    }
    router.push('/admin')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Email">
        <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Password">
        <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
      </Field>
      {error && (
        <p role="alert" className="text-sm text-tally-text">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${btn.primary} mt-2 w-full py-2.5`}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
