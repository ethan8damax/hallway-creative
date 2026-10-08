import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { ActionForm } from '@/components/admin/ActionForm'
import { Badge, Field, Panel, btn, formatDate, inputClass } from '@/components/admin/ui'
import { STAGE_LABELS, type Client, type ClientActivity, type Gallery } from '@/lib/supabase/types'
import { addNote, updateClient } from '../actions'
import { StageStepper } from './StageStepper'
import { DeleteClient } from './DeleteClient'

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createServiceClient()
  const [{ data: client }, { data: activity }, { data: galleries }] = await Promise.all([
    db.from('clients').select('*').eq('id', id).maybeSingle<Client>(),
    db.from('client_activity').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    db.from('galleries').select('id, title, status, sent_at, first_viewed_at, downloaded_at').eq('client_id', id).order('created_at', { ascending: false }),
  ])
  if (!client) notFound()

  // Opening a client clears its "New" badge.
  if (client.is_new) await db.from('clients').update({ is_new: false }).eq('id', id)

  return (
    <div>
      <Link href="/admin/clients" className="text-sm text-muted hover:text-ink">
        ← Clients
      </Link>

      <div className="mb-8 mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">{client.name}</h1>
            <Badge>{STAGE_LABELS[client.stage]}</Badge>
          </div>
          <p className="mt-1 flex flex-wrap gap-x-4 text-sm">
            <a href={`mailto:${client.email}`} className="text-monitor underline-offset-4 hover:underline">
              {client.email}
            </a>
            {client.phone && (
              <a href={`tel:${client.phone}`} className="text-monitor underline-offset-4 hover:underline">
                {client.phone}
              </a>
            )}
          </p>
        </div>
        <a href={`mailto:${client.email}`} className={btn.secondary}>
          Email {client.name.split(' ')[0]}
        </a>
      </div>

      <Panel className="mb-6">
        <StageStepper id={client.id} stage={client.stage} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          {client.inquiry_message && (
            <Panel title="Their inquiry" description={`Sent ${formatDate(client.created_at)}`}>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{client.inquiry_message}</p>
            </Panel>
          )}

          <Panel title="Details">
            <ActionForm action={updateClient.bind(null, client.id)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name">
                  <input name="name" required defaultValue={client.name} className={inputClass} />
                </Field>
                <Field label="Email">
                  <input name="email" type="email" required defaultValue={client.email} className={inputClass} />
                </Field>
                <Field label="Phone">
                  <input name="phone" type="tel" defaultValue={client.phone ?? ''} className={inputClass} />
                </Field>
                <Field label="Event type">
                  <input name="event_type" defaultValue={client.event_type ?? ''} className={inputClass} />
                </Field>
                <Field label="Event date">
                  <input name="event_date" type="date" defaultValue={client.event_date ?? ''} className={inputClass} />
                </Field>
                <Field label="Location">
                  <input name="event_location" defaultValue={client.event_location ?? ''} className={inputClass} />
                </Field>
                <Field label="Contract link" hint="Paste a link to the contract (Google Drive, HoneyBook, PDF…).">
                  <input name="contract_url" type="url" defaultValue={client.contract_url ?? ''} placeholder="https://" className={inputClass} />
                </Field>
                <Field label="Contract signed on">
                  <input name="contract_signed_on" type="date" defaultValue={client.contract_signed_on ?? ''} className={inputClass} />
                </Field>
              </div>
              {client.contract_url && (
                <a href={client.contract_url} target="_blank" rel="noopener noreferrer" className="-mt-1 text-sm text-monitor underline-offset-4 hover:underline">
                  Open contract ↗
                </a>
              )}
            </ActionForm>
          </Panel>

          <Panel title="Galleries">
            {galleries && galleries.length > 0 ? (
              <ul className="mb-4 divide-y divide-border">
                {(galleries as Pick<Gallery, 'id' | 'title' | 'status' | 'sent_at' | 'first_viewed_at' | 'downloaded_at'>[]).map((g) => (
                  <li key={g.id}>
                    <Link href={`/admin/galleries/${g.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-ink">
                      <span className="text-ink">{g.title}</span>
                      <span className="text-xs text-muted">
                        {g.downloaded_at ? 'Downloaded' : g.first_viewed_at ? 'Viewed' : g.sent_at ? 'Sent' : g.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-4 text-sm text-muted">No galleries yet. Create one when the photos are ready.</p>
            )}
            <Link href={`/admin/galleries/new?client=${client.id}`} className={btn.secondary}>
              New gallery for {client.name.split(' ')[0]}
            </Link>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Notes & history">
            <ActionForm action={addNote.bind(null, client.id)} submitLabel="Add note" resetOnSuccess>
              <Field label="New note">
                <textarea name="body" rows={3} placeholder="Called about timeline, wants a second shooter…" className={inputClass} />
              </Field>
            </ActionForm>
            <ol className="mt-6 flex flex-col gap-4 border-l border-border pl-4">
              {((activity ?? []) as ClientActivity[]).map((entry) => (
                <li key={entry.id} className="relative">
                  <span
                    aria-hidden="true"
                    className={`absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full ${entry.kind === 'note' ? 'bg-ink' : 'bg-border'}`}
                  />
                  <p className={`whitespace-pre-line text-sm ${entry.kind === 'note' ? 'text-ink' : 'text-muted'}`}>{entry.body}</p>
                  <time dateTime={entry.created_at} className="text-xs text-muted">
                    {formatDate(entry.created_at, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </time>
                </li>
              ))}
            </ol>
          </Panel>
          <div>
            <DeleteClient id={client.id} name={client.name} />
          </div>
        </div>
      </div>
    </div>
  )
}
