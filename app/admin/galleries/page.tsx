import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { Badge, EmptyState, PageHeader, btn, formatDate } from '@/components/admin/ui'
import { isExpired } from '@/lib/galleryExpiry'
import type { Gallery } from '@/lib/supabase/types'

type Row = Gallery & { photos: { count: number }[] }

function deliveryLabel(g: Row) {
  if (g.downloaded_at) return { text: `Downloaded ${formatDate(g.downloaded_at, { month: 'short', day: 'numeric' })}`, tone: 'good' as const }
  if (g.first_viewed_at) return { text: `Opened ${formatDate(g.first_viewed_at, { month: 'short', day: 'numeric' })}`, tone: 'good' as const }
  if (g.sent_at) return { text: `Sent ${formatDate(g.sent_at, { month: 'short', day: 'numeric' })}, not opened`, tone: 'warn' as const }
  if (g.status === 'published') return { text: 'Published, not sent', tone: 'warn' as const }
  return { text: 'Draft', tone: 'neutral' as const }
}

export default async function AdminGalleriesPage() {
  const { data } = await createServiceClient()
    .from('galleries')
    .select('*, photos(count)')
    .order('created_at', { ascending: false })
  const galleries = (data ?? []) as Row[]

  return (
    <div>
      <PageHeader
        title="Galleries"
        description="Private photo deliveries. Each one has its own link and access code."
        actions={
          <Link href="/admin/galleries/new" className={btn.primary}>
            New gallery
          </Link>
        }
      />
      {galleries.length === 0 ? (
        <EmptyState title="No galleries yet">Create one when a shoot is edited. You can also start from a client&apos;s page.</EmptyState>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {galleries.map((g) => {
            const delivery = isExpired(g.expires_on) ? { text: 'Expired', tone: 'neutral' as const } : deliveryLabel(g)
            return (
              <li key={g.id}>
                <Link href={`/admin/galleries/${g.id}`} className="flex flex-col gap-1 px-4 py-3.5 transition-colors hover:bg-surface/50 sm:flex-row sm:items-center sm:gap-4">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{g.title}</span>
                    <span className="block text-xs text-muted">
                      {g.client_name} · {g.photos[0]?.count ?? 0} photos
                      {g.expires_on && !isExpired(g.expires_on) ? ` · closes ${formatDate(g.expires_on, { month: 'short', day: 'numeric' })}` : ''}
                    </span>
                  </span>
                  <Badge tone={delivery.tone}>{delivery.text}</Badge>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
