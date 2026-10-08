'use client'

import { useState, useTransition } from 'react'
import { inputClass } from '@/components/admin/ui'
import { setClosingDate } from './actions'

// Set, change or clear when a gallery closes, without opening it.
export function ClosingDate({ id, value, title }: { id: string; value: string | null; title: string }) {
  const [date, setDate] = useState(value ?? '')
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<'idle' | 'saved' | 'error'>('idle')

  function save(next: string) {
    setDate(next)
    setState('idle')
    startTransition(async () => {
      try {
        await setClosingDate(id, next || null)
        setState('saved')
      } catch {
        setState('error')
        setDate(value ?? '')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-2 text-xs text-muted">
        Closes
        <input
          type="date"
          value={date}
          onChange={(e) => save(e.target.value)}
          disabled={pending}
          aria-label={`Closing date for ${title}`}
          className={`${inputClass} w-auto py-1 text-xs`}
        />
      </label>
      {date ? (
        <button type="button" onClick={() => save('')} disabled={pending} className="text-xs text-muted hover:text-ink">
          Clear
        </button>
      ) : (
        <span className="text-xs text-muted">Never</span>
      )}
      <span role="status" aria-live="polite" className="w-10 text-xs">
        {state === 'saved' && (
          <span key={date} className="saved-flash text-monitor">
            Saved
          </span>
        )}
        {state === 'error' && <span className="text-tally-text">Failed</span>}
      </span>
    </div>
  )
}
