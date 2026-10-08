'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { btn, inputClass, Field } from '@/components/admin/ui'
import { deleteGallery, togglePublish } from '../actions'
import { useConfirm } from '@/components/admin/ConfirmDialog'

export function PublishToggle({ id, status }: { id: string; status: 'draft' | 'published' }) {
  const [pending, startTransition] = useTransition()
  const next = status === 'draft' ? 'published' : 'draft'
  return (
    <button type="button" disabled={pending} onClick={() => startTransition(() => togglePublish(id, next))} className={status === 'draft' ? btn.primary : btn.secondary}>
      {pending ? 'Saving…' : status === 'draft' ? 'Publish' : 'Unpublish'}
    </button>
  )
}

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <code className="min-w-0 flex-1 truncate rounded-xs border border-border bg-bg px-3 py-2 text-sm text-ink">{url}</code>
      <button
        type="button"
        className={btn.secondary}
        onClick={async () => {
          await navigator.clipboard.writeText(url)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
      >
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  )
}

export function SendToClient({
  id,
  email,
  published,
  sentAt,
  hasCode,
}: {
  id: string
  email: string
  published: boolean
  sentAt: string | null
  hasCode: boolean
}) {
  const router = useRouter()
  const confirm = useConfirm()
  const [code, setCode] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'wrong_code' | 'failed'>('idle')

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (
      sentAt &&
      !(await confirm({ title: 'Send it again?', body: `This gallery was already emailed to ${email}. They’ll get a second email with the link and code.`, confirmLabel: 'Send again' }))
    )
      return
    setState('sending')
    const res = await fetch(`/api/admin/galleries/${id}/send`, { method: 'POST', body: JSON.stringify({ code }) })
    if (res.ok) {
      setState('sent')
      setCode('')
      router.refresh()
    } else {
      setState(res.status === 400 ? 'wrong_code' : 'failed')
    }
  }

  if (!published) {
    return <p className="text-sm text-muted">Publish the gallery first. Then you can email {email} the link and code.</p>
  }

  return (
    <form onSubmit={send} className="flex flex-col gap-3">
      {hasCode ? (
        <p className="text-sm text-muted">The email includes the gallery link and the access code above.</p>
      ) : (
        <Field label="Access code to include" hint="Type the code you set. It's checked before sending, so a typo can't go out.">
          <input value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" required className={`${inputClass} sm:max-w-xs`} />
        </Field>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={state === 'sending' || (!hasCode && !code.trim())} className={btn.primary}>
          {state === 'sending' ? 'Sending…' : sentAt ? `Send again to ${email}` : `Send to ${email}`}
        </button>
        <span role="status" aria-live="polite" className="text-sm">
          {state === 'sent' && <span className="text-monitor">Sent</span>}
          {state === 'wrong_code' && <span className="text-tally-text">That isn&apos;t this gallery&apos;s code. Check it, or set a new one above.</span>}
          {state === 'failed' && <span className="text-tally-text">The email didn&apos;t go out. Try again, or share the link and code yourself.</span>}
        </span>
      </div>
    </form>
  )
}

export function DeleteGallery({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  const confirm = useConfirm()
  return (
    <button
      type="button"
      className={btn.danger}
      onClick={async () => {
        const ok = await confirm({
          title: `Delete “${title}”?`,
          body: 'Your client’s link stops working and every photo in the gallery is permanently deleted. Make sure they’ve downloaded everything first. This can’t be undone.',
          confirmLabel: 'Delete gallery',
          requireText: title,
        })
        if (!ok) return
        await deleteGallery(id)
        router.push('/admin/galleries')
      }}
    >
      Delete gallery
    </button>
  )
}
