import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { ActionForm } from '@/components/admin/ActionForm'
import { Field, PageHeader, inputClass } from '@/components/admin/ui'
import type { Client } from '@/lib/supabase/types'
import { PipelineBoard } from './PipelineBoard'
import { addClient } from './actions'

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
  const showArchived = (await searchParams).archived === '1'
  const db = createServiceClient()
  const query = db.from('clients').select('*').order('stage_changed_at', { ascending: false })
  const { data } = await (showArchived ? query.eq('stage', 'archived') : query.neq('stage', 'archived'))
  const clients = (data ?? []) as Client[]

  return (
    <div>
      <PageHeader
        title={showArchived ? 'Archived clients' : 'Clients'}
        description={
          showArchived
            ? 'Leads that went nowhere and finished jobs you’ve filed away. Open one to move it back into the pipeline.'
            : 'Every client from first message to posted work. Drag a card to move it to the next stage.'
        }
        actions={
          <Link href={showArchived ? '/admin/clients' : '/admin/clients?archived=1'} className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
            {showArchived ? '← Back to pipeline' : 'View archived'}
          </Link>
        }
      />

      {showArchived ? (
        <ul className="divide-y divide-border rounded-md border border-border">
          {clients.map((client) => (
            <li key={client.id}>
              <Link href={`/admin/clients/${client.id}`} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-surface/50">
                <span className="text-ink">{client.name}</span>
                <span className="text-muted">{client.email}</span>
              </Link>
            </li>
          ))}
          {clients.length === 0 && <li className="px-4 py-6 text-sm text-muted">Nothing archived.</li>}
        </ul>
      ) : (
        <>
          <PipelineBoard clients={clients} />

          <details className="group mt-10 max-w-2xl rounded-md border border-border">
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-ink marker:hidden">
              <span className="mr-2 inline-block transition-transform group-open:rotate-45">+</span>
              Add a client by hand
              <span className="ml-2 font-normal text-muted">for leads that came by phone, DM or in person</span>
            </summary>
            <div className="border-t border-border px-5 py-5">
              <ActionForm action={addClient} submitLabel="Add client" resetOnSuccess>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name">
                    <input name="name" required className={inputClass} />
                  </Field>
                  <Field label="Email">
                    <input name="email" type="email" required className={inputClass} />
                  </Field>
                  <Field label="Phone">
                    <input name="phone" type="tel" className={inputClass} />
                  </Field>
                  <Field label="Event type">
                    <input name="event_type" placeholder="Wedding, game, gala…" className={inputClass} />
                  </Field>
                  <Field label="Event date">
                    <input name="event_date" type="date" className={inputClass} />
                  </Field>
                </div>
              </ActionForm>
            </div>
          </details>
        </>
      )}
    </div>
  )
}
