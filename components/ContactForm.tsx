'use client'

import { useState } from 'react'
import { validateContactForm } from '@/lib/validateContactForm'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const fieldClass =
  'w-full border-0 border-b border-border bg-transparent py-2 text-ink outline-none transition-colors focus:border-monitor'
const labelClass = 'text-sm font-medium tracking-[0.02em] text-muted'

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = {
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      eventType: String(form.get('eventType') || ''),
      message: String(form.get('message') || ''),
      company: String(form.get('company') || ''),
    }

    const validationErrors = validateContactForm(data)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setStatus('submitting')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <p role="status" className="text-lg text-ink">
        Thanks — Andrew will get back to you soon.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <label className="flex flex-col gap-2">
        <span className={labelClass}>Name</span>
        <input
          type="text"
          name="name"
          className={fieldClass}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <span id="name-error" role="alert" className="text-sm text-tally-text">
            {errors.name}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>Email</span>
        <input
          type="email"
          name="email"
          className={fieldClass}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <span id="email-error" role="alert" className="text-sm text-tally-text">
            {errors.email}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>Event type</span>
        <input type="text" name="eventType" className={fieldClass} />
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>Message</span>
        <textarea
          name="message"
          rows={5}
          className={fieldClass}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? 'message-error' : undefined}
        />
        {errors.message && (
          <span id="message-error" role="alert" className="text-sm text-tally-text">
            {errors.message}
          </span>
        )}
      </label>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="self-start rounded-xs bg-tally px-8 py-3.5 font-semibold text-on-accent transition-colors hover:bg-tally-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-monitor disabled:opacity-50"
      >
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </button>

      {status === 'error' && (
        <p role="alert" className="text-sm text-tally-text">
          Something went wrong — please email Andrew directly instead.
        </p>
      )}
    </form>
  )
}
