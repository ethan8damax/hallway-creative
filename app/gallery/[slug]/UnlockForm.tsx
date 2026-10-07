'use client'

import { useState } from 'react'

export function UnlockForm({ slug, title }: { slug: string; title?: string }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(false)
    setChecking(true)
    const response = await fetch(`/api/gallery/${slug}/unlock`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
    if (!response.ok) {
      setError(true)
      setChecking(false)
      return
    }
    window.location.reload()
  }

  return (
    <section className="mx-auto flex min-h-[calc(100svh-12rem)] max-w-md flex-col justify-center px-5 py-24">
      {title && (
        <h1 className="hero-rise text-balance font-display text-[clamp(2.25rem,6vw,3.5rem)] font-[340] leading-[1.02] tracking-[-0.02em] text-ink">
          {title}
        </h1>
      )}
      <p className="fade-in mt-4 text-muted" style={{ animationDelay: '400ms' }}>
        Enter the access code from your email to see your photos.
      </p>
      <form onSubmit={handleSubmit} className="mt-12 flex flex-col gap-6">
        <label htmlFor="access-code" className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted">Access code</span>
          <input
            id="access-code"
            aria-label="Access code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-invalid={error}
            aria-describedby={error ? 'access-code-error' : undefined}
            className={`border-b bg-transparent py-2 text-lg text-ink focus:border-b-2 focus:border-monitor focus:outline-none ${
              error ? 'border-tally' : 'border-border'
            }`}
          />
        </label>
        {error && (
          <p id="access-code-error" role="alert" className="-mt-3 text-sm text-tally-text">
            Incorrect code. Try again.
          </p>
        )}
        <button
          type="submit"
          disabled={checking || !code.trim()}
          className="w-fit rounded-xs bg-tally px-8 py-3.5 font-semibold text-on-accent transition-colors hover:bg-tally-deep disabled:opacity-50"
        >
          {checking ? 'Checking…' : 'Unlock'}
        </button>
      </form>
    </section>
  )
}
