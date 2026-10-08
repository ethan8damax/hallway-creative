import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { PageHeader, Panel } from '@/components/admin/ui'
import type { Client } from '@/lib/supabase/types'
import { NewGalleryForm } from './NewGalleryForm'

export default async function NewGalleryPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client: clientId } = await searchParams
  const db = createServiceClient()
  const { data: clients } = await db.from('clients').select('id, name, email, event_type, event_date').neq('stage', 'archived').order('name')
  const client = (clients as Pick<Client, 'id' | 'name' | 'email' | 'event_type' | 'event_date'>[] | null)?.find((c) => c.id === clientId)

  return (
    <div className="max-w-2xl">
      <Link href="/admin/galleries" className="text-sm text-muted hover:text-ink">
        ← Galleries
      </Link>
      <div className="mt-3">
        <PageHeader title="New gallery" description="Start it as a draft, upload the photos, then publish and send it." />
      </div>
      <Panel>
        <NewGalleryForm
          clients={(clients ?? []).map((c) => ({ id: c.id, name: c.name }))}
          prefill={
            client
              ? {
                  clientId: client.id,
                  title: [client.name, client.event_type].filter(Boolean).join(' — '),
                  clientName: client.name,
                  clientEmail: client.email,
                  eventDate: client.event_date ?? undefined,
                }
              : {}
          }
        />
      </Panel>
    </div>
  )
}
