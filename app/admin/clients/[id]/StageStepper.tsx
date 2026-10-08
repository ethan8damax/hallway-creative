'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { CLIENT_STAGES, STAGE_LABELS, type ClientStage } from '@/lib/supabase/types'
import { btn } from '@/components/admin/ui'
import { moveClient } from '../actions'

export function StageStepper({ id, stage }: { id: string; stage: ClientStage }) {
  const [pending, startTransition] = useTransition()
  const [current, setOptimistic] = useOptimistic(stage)
  const [error, setError] = useState(false)
  const index = CLIENT_STAGES.indexOf(current as (typeof CLIENT_STAGES)[number])

  function go(next: ClientStage) {
    setError(false)
    startTransition(async () => {
      setOptimistic(next)
      try {
        await moveClient(id, next)
      } catch {
        setError(true)
      }
    })
  }

  return (
    <div>
      <ol className="flex flex-wrap gap-1.5" aria-label="Pipeline stage">
        {CLIENT_STAGES.map((s, i) => {
          const isCurrent = s === current
          const done = index > -1 && i < index
          return (
            <li key={s}>
              <button
                type="button"
                onClick={() => go(s)}
                disabled={pending || isCurrent}
                aria-current={isCurrent ? 'step' : undefined}
                className={`rounded-xs border px-3 py-1.5 text-sm transition-colors disabled:cursor-default ${
                  isCurrent
                    ? 'border-tally bg-tally font-semibold text-on-accent'
                    : done
                      ? 'border-border text-ink hover:bg-surface'
                      : 'border-border text-muted hover:bg-surface hover:text-ink'
                }`}
              >
                {done && <span aria-hidden="true">✓ </span>}
                {STAGE_LABELS[s]}
              </button>
            </li>
          )
        })}
      </ol>
      <div className="mt-3 flex items-center gap-3">
        {current === 'archived' ? (
          <span className="text-sm text-muted">Archived. Pick a stage above to bring this client back.</span>
        ) : (
          <button type="button" onClick={() => go('archived')} disabled={pending} className={btn.quiet}>
            Archive client
          </button>
        )}
        {error && (
          <span role="alert" className="text-sm text-tally-text">
            Could not change the stage. Try again.
          </span>
        )}
      </div>
    </div>
  )
}
