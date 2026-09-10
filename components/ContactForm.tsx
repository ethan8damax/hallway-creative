'use client'

import { useState } from 'react'
import { validateContactForm } from '@/lib/validateContactForm'

type Status = 'idle' | 'submitting' | 'success' | 'error'

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
    return <p role="status">Thanks — Andrew will get back to you soon.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <label className="flex flex-col gap-1">
        Name
        <input
          type="text"
          name="name"
          className="rounded-md border border-neutral-300 p-2"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <span id="name-error" role="alert" className="text-sm text-red-600">
            {errors.name}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        Email
        <input
          type="email"
          name="email"
          className="rounded-md border border-neutral-300 p-2"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <span id="email-error" role="alert" className="text-sm text-red-600">
            {errors.email}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        Event type
        <input type="text" name="eventType" className="rounded-md border border-neutral-300 p-2" />
      </label>

      <label className="flex flex-col gap-1">
        Message
        <textarea
          name="message"
          rows={5}
          className="rounded-md border border-neutral-300 p-2"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? 'message-error' : undefined}
        />
        {errors.message && (
          <span id="message-error" role="alert" className="text-sm text-red-600">
            {errors.message}
          </span>
        )}
      </label>

      <button type="submit" disabled={status === 'submitting'} className="rounded-md bg-neutral-900 px-6 py-3 text-white disabled:opacity-50">
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </button>

      {status === 'error' && (
        <p role="alert" className="text-sm text-red-600">Something went wrong — please email Andrew directly instead.</p>
      )}
    </form>
  )
}
