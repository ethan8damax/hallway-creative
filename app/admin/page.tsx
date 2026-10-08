import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { Badge, Panel, btn, formatDate } from '@/components/admin/ui'
import { buildToday, type TodayGallery } from '@/lib/todayTasks'
import { CLIENT_STAGES, STAGE_LABELS, type Client } from '@/lib/supabase/types'

export default async function TodayPage() {
  const db = createServiceClient()
  const [{ data: clientRows }, { data: galleryRows }] = await Promise.all([
    db.from('clients').select('*').neq('stage', 'archived'),
    db.from('galleries').select('id, title, client_name, status, sent_at, first_viewed_at, expires_on'),
  ])
  const clients = (clientRows ?? []) as Client[]
  const { tasks, upcoming, dateLabel } = buildToday(clients, (galleryRows ?? []) as TodayGallery[])

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">{dateLabel}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.01em] text-ink">Today</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/galleries/new" className={btn.primary}>
            New gallery
          </Link>
          <Link href="/admin/clients" className={btn.secondary}>
            Open pipeline
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="Needs you" description={tasks.length ? `${tasks.length} ${tasks.length === 1 ? 'thing' : 'things'} waiting on you.` : undefined}>
          {tasks.length > 0 ? (
            <ul className="-mx-2 flex flex-col">
              {tasks.map((task) => (
                <li key={task.key}>
                  <Link href={task.href} className="flex items-start justify-between gap-4 rounded-xs px-2 py-3 transition-colors hover:bg-surface/60">
                    <span>
                      <span className="block text-sm font-medium text-ink">{task.title}</span>
                      <span className="mt-0.5 block text-sm text-muted">{task.detail}</span>
                    </span>
                    <Badge tone={task.tone}>{task.tag}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-sm text-muted">All caught up. New inquiries and gallery follow-ups will show up here.</p>
          )}
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel title="Coming up" description="Booked and likely events in the next six weeks.">
            {upcoming.length > 0 ? (
              <ul className="flex flex-col divide-y divide-border">
                {upcoming.map((c) => (
                  <li key={c.id}>
                    <Link href={`/admin/clients/${c.id}`} className="flex items-baseline gap-4 py-2.5 hover:text-ink">
                      <span className="w-14 shrink-0 text-sm font-medium tabular-nums text-ink">{formatDate(c.event_date, { month: 'short', day: 'numeric' })}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-ink">{c.name}</span>
                        <span className="block text-xs text-muted">
                          {[c.event_type, c.event_location, STAGE_LABELS[c.stage]].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Nothing on the calendar yet. Add event dates on client pages and they&apos;ll appear here.</p>
            )}
          </Panel>

          <Panel title="Pipeline">
            <ul className="grid grid-cols-3 gap-2">
              {CLIENT_STAGES.map((stage) => (
                <li key={stage}>
                  <Link href="/admin/clients" className="flex flex-col rounded-xs border border-border px-3 py-2 transition-colors hover:bg-surface/60">
                    <span className="text-lg font-semibold tabular-nums text-ink">{clients.filter((c) => c.stage === stage).length}</span>
                    <span className="text-xs text-muted">{STAGE_LABELS[stage]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}
