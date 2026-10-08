'use client'

import Link from 'next/link'
import { useOptimistic, useState, useTransition } from 'react'
import { Badge, formatDate } from '@/components/admin/ui'
import { CLIENT_STAGES, STAGE_LABELS, type Client, type ClientStage } from '@/lib/supabase/types'
import { moveClient } from './actions'

const STAGE_HINTS: Record<(typeof CLIENT_STAGES)[number], string> = {
  inquiry: 'New leads from the contact form land here.',
  conversation: 'Talking it through: dates, scope, price.',
  contract: 'Contract sent or waiting on a signature.',
  event: 'Booked. The shoot is coming up.',
  red_room: 'Shot. Editing in progress.',
  posted: 'Delivered to the client.',
}

function daysSince(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  return days === 0 ? 'today' : days === 1 ? '1 day' : `${days} days`
}

function ClientCard({ client, draggable = false }: { client: Client; draggable?: boolean }) {
  return (
    <Link
      href={`/admin/clients/${client.id}`}
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/client-id', client.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      className="block rounded-xs border border-border bg-bg p-3 transition-colors hover:border-muted focus-visible:outline-2 focus-visible:outline-monitor"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-ink">{client.name}</span>
        {client.is_new && <Badge tone="new">New</Badge>}
      </div>
      <p className="mt-1 text-xs text-muted">
        {[client.event_type, formatDate(client.event_date)].filter(Boolean).join(' · ') || client.email}
      </p>
      <p className="mt-2 text-[0.6875rem] text-muted">In stage {daysSince(client.stage_changed_at)}</p>
    </Link>
  )
}

export function PipelineBoard({ clients }: { clients: Client[] }) {
  const [, startTransition] = useTransition()
  const [optimistic, applyMove] = useOptimistic(clients, (state, move: { id: string; stage: ClientStage }) =>
    state.map((c) => (c.id === move.id ? { ...c, stage: move.stage, stage_changed_at: new Date().toISOString(), is_new: false } : c))
  )
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [mobileStage, setMobileStage] = useState<(typeof CLIENT_STAGES)[number]>('inquiry')
  const [error, setError] = useState<string | null>(null)

  function drop(stage: ClientStage, id: string) {
    setDragOver(null)
    if (!id || optimistic.find((c) => c.id === id)?.stage === stage) return
    setError(null)
    startTransition(async () => {
      applyMove({ id, stage })
      try {
        await moveClient(id, stage)
      } catch {
        setError('Could not move that client. Try again.')
      }
    })
  }

  const byStage = (stage: string) => optimistic.filter((c) => c.stage === stage)

  return (
    <>
      {error && (
        <p role="alert" className="mb-4 text-sm text-tally-text">
          {error}
        </p>
      )}

      {/* Desktop: drag between columns */}
      <div className="hidden gap-3 overflow-x-auto pb-4 lg:grid lg:grid-cols-6">
        {CLIENT_STAGES.map((stage) => {
          const items = byStage(stage)
          return (
            <section
              key={stage}
              aria-label={STAGE_LABELS[stage]}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(stage)
              }}
              onDragLeave={() => setDragOver((s) => (s === stage ? null : s))}
              onDrop={(e) => drop(stage, e.dataTransfer.getData('text/client-id'))}
              className={`flex min-h-[60vh] min-w-0 flex-col rounded-md border p-2 transition-colors ${
                dragOver === stage ? 'border-monitor bg-surface/70' : 'border-border bg-surface/30'
              }`}
            >
              <header className="flex items-baseline justify-between px-1.5 pb-2 pt-1">
                <h2 className="text-sm font-semibold text-ink">{STAGE_LABELS[stage]}</h2>
                <span className="text-xs tabular-nums text-muted">{items.length}</span>
              </header>
              <div className="flex flex-col gap-2">
                {items.map((client) => (
                  <ClientCard key={client.id} client={client} draggable />
                ))}
                {items.length === 0 && <p className="px-1.5 py-2 text-xs leading-relaxed text-muted">{STAGE_HINTS[stage]}</p>}
              </div>
            </section>
          )
        })}
      </div>

      {/* Phone / tablet: pick a stage, see its clients */}
      <div className="lg:hidden">
        <div role="tablist" aria-label="Stage" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
          {CLIENT_STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              role="tab"
              aria-selected={mobileStage === stage}
              onClick={() => setMobileStage(stage)}
              className={`shrink-0 rounded-xs border px-3 py-1.5 text-sm transition-colors ${
                mobileStage === stage ? 'border-ink bg-surface text-ink' : 'border-border text-muted'
              }`}
            >
              {STAGE_LABELS[stage]} <span className="tabular-nums opacity-70">{byStage(stage).length}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {byStage(mobileStage).map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
          {byStage(mobileStage).length === 0 && <p className="py-6 text-sm text-muted">{STAGE_HINTS[mobileStage]}</p>}
        </div>
      </div>
    </>
  )
}
