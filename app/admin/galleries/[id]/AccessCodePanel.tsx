'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ActionForm } from '@/components/admin/ActionForm'
import { Field, btn, inputClass } from '@/components/admin/ui'
import { changeAccessCode } from '../actions'

// Shows the current code (with copy); "Change code" swaps in the form, and the
// new code shows as soon as it's saved.
export function AccessCodePanel({ id, code }: { id: string; code: string | null }) {
  const router = useRouter()
  const [editing, setEditing] = useState(!code)
  const [copied, setCopied] = useState(false)

  if (code && !editing) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-xs border border-border bg-bg px-3 py-2 text-base tracking-wide text-ink">{code}</code>
          <button
            type="button"
            className={btn.secondary}
            onClick={async () => {
              await navigator.clipboard.writeText(code)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <button type="button" onClick={() => setEditing(true)} className={`${btn.quiet} self-start`}>
          Change code
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {!code && (
        <p className="text-sm text-muted">This gallery&apos;s code was set before codes could be shown here. Set it again to see it.</p>
      )}
      <ActionForm
        action={changeAccessCode.bind(null, id)}
        submitLabel={code ? 'Save new code' : 'Set code'}
        onSuccess={() => {
          setEditing(false)
          router.refresh()
        }}
      >
        <Field label={code ? 'New code' : 'Code'} hint={code ? 'Anyone who already unlocked the gallery will need the new code.' : undefined}>
          <input name="access_code" required autoComplete="off" autoFocus={!!code} placeholder="e.g. lakeside-2026" className={inputClass} />
        </Field>
      </ActionForm>
      {code && (
        <button type="button" onClick={() => setEditing(false)} className={`${btn.quiet} self-start`}>
          Cancel
        </button>
      )}
    </div>
  )
}
