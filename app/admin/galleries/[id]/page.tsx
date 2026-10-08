import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { ActionForm } from '@/components/admin/ActionForm'
import { Badge, Field, Panel, btn, formatDate, inputClass } from '@/components/admin/ui'
import { isExpired } from '@/lib/galleryExpiry'
import type { Gallery, Photo } from '@/lib/supabase/types'
import { updateGallery } from '../actions'
import { decryptCode } from '@/lib/codeCrypto'
import { AccessCodePanel } from './AccessCodePanel'
import { CopyLink, DeleteGallery, PublishToggle, SendToClient } from './GalleryControls'
import { PhotosEditor } from './PhotosEditor'

function Milestone({ label, at }: { label: string; at: string | null }) {
  return (
    <li className="flex flex-col gap-0.5">
      <span className={`text-sm ${at ? 'text-ink' : 'text-muted'}`}>
        <span aria-hidden="true" className={`mr-2 inline-block h-2 w-2 rounded-full ${at ? 'bg-monitor' : 'border border-border'}`} />
        {label}
      </span>
      <span className="pl-4 text-xs text-muted">{at ? formatDate(at, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Not yet'}</span>
    </li>
  )
}

export default async function GalleryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createServiceClient()

  const [{ data: gallery }, { data: photos }] = await Promise.all([
    db.from('galleries').select('*').eq('id', id).maybeSingle<Gallery>(),
    db.from('photos').select('*').eq('gallery_id', id).order('sort_order', { ascending: true }),
  ])
  if (!gallery) notFound()

  const { data: client } = gallery.client_id
    ? await db.from('clients').select('id, name').eq('id', gallery.client_id).maybeSingle()
    : { data: null }
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/gallery/${gallery.slug}`
  const expired = isExpired(gallery.expires_on)
  const code = decryptCode(gallery.access_code_encrypted)

  return (
    <div>
      <Link href="/admin/galleries" className="text-sm text-muted hover:text-ink">
        ← Galleries
      </Link>

      <div className="mb-8 mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">{gallery.title}</h1>
            {expired ? <Badge tone="warn">Expired</Badge> : gallery.status === 'published' ? <Badge tone="good">Published</Badge> : <Badge>Draft</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted">
            {client ? (
              <Link href={`/admin/clients/${client.id}`} className="text-monitor underline-offset-4 hover:underline">
                {client.name}
              </Link>
            ) : (
              gallery.client_name
            )}
            {' · '}
            {(photos ?? []).length} photos
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/gallery/${gallery.slug}`} target="_blank" rel="noopener noreferrer" className={btn.secondary}>
            Preview
          </a>
          <PublishToggle id={gallery.id} status={gallery.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="Photos" description="Drag to reorder. The first photo is the cover your client sees.">
          <PhotosEditor galleryId={gallery.id} slug={gallery.slug} initialPhotos={(photos ?? []) as Photo[]} />
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel title="Access code" description="What your client types to open the gallery. Set it before you send.">
            <AccessCodePanel id={gallery.id} code={code} />
          </Panel>
          <Panel title="Delivery">
            <ol className="mb-6 grid grid-cols-3 gap-3">
              <Milestone label="Sent" at={gallery.sent_at} />
              <Milestone label="Opened" at={gallery.first_viewed_at} />
              <Milestone label="Downloaded" at={gallery.downloaded_at} />
            </ol>
            <SendToClient id={gallery.id} email={gallery.client_email} published={gallery.status === 'published'} sentAt={gallery.sent_at} hasCode={!!code} />
            <div className="mt-6 border-t border-border pt-5">
              <p className="mb-2 text-sm font-medium text-ink">Gallery link</p>
              <CopyLink url={url} />
            </div>
          </Panel>

          <Panel title="Settings">
            <ActionForm action={updateGallery.bind(null, gallery.id)}>
              <Field label="Title">
                <input name="title" required defaultValue={gallery.title} className={inputClass} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Client name">
                  <input name="client_name" required defaultValue={gallery.client_name} className={inputClass} />
                </Field>
                <Field label="Client email">
                  <input name="client_email" type="email" required defaultValue={gallery.client_email} className={inputClass} />
                </Field>
                <Field label="Event date">
                  <input name="event_date" type="date" defaultValue={gallery.event_date ?? ''} className={inputClass} />
                </Field>
                <Field label="Closes after" hint="Optional. Leave empty to keep it open.">
                  <input name="expires_on" type="date" defaultValue={gallery.expires_on ?? ''} className={inputClass} />
                </Field>
              </div>
            </ActionForm>
          </Panel>


          <div>
            <DeleteGallery id={gallery.id} title={gallery.title} />
          </div>
        </div>
      </div>
    </div>
  )
}
