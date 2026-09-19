'use client'

import { useState } from 'react'

export function UnlockForm({ slug }: { slug: string }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(false)
    const response = await fetch(`/api/gallery/${slug}/unlock`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
    if (!response.ok) {
      setError(true)
      return
    }
    window.location.reload()
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-sm flex-col gap-4 px-6 py-24">
      <label htmlFor="access-code" className="text-sm font-medium text-muted">
        Access code
      </label>
      <input
        id="access-code"
        aria-label="Access code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="border-b border-border bg-transparent py-2 text-ink focus:outline-none"
      />
      {error && <p className="text-sm text-[var(--tally-red-text)]">Incorrect code. Try again.</p>}
      <button type="submit" className="w-fit rounded-xs bg-tally px-6 py-3 font-semibold text-on-accent">
        Unlock
      </button>
    </form>
  )
}
