import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { getMediaItemsForCategory } from '@/lib/supabase/queries'
import { ActionForm } from '@/components/admin/ActionForm'
import { Field, Panel, btn, inputClass } from '@/components/admin/ui'
import type { Category } from '@/lib/supabase/types'
import { addVideo, updateCategory } from '../actions'
import { DeleteCategory, MediaEditor } from './MediaEditor'

export default async function CategoryMediaPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params
  const [{ data: category }, items] = await Promise.all([
    createServiceClient().from('categories').select('*').eq('id', categoryId).maybeSingle<Category>(),
    getMediaItemsForCategory(categoryId),
  ])
  if (!category) notFound()

  return (
    <div>
      <Link href="/admin/portfolio" className="text-sm text-muted hover:text-ink">
        ← Portfolio
      </Link>
      <div className="mb-8 mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">{category.title}</h1>
        <a href={`/portfolio/${category.slug}`} target="_blank" rel="noopener noreferrer" className={btn.secondary}>
          View on site
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <Panel title="Photos" description="Drag to reorder, or use the arrows. The first photo is the cover. Edit a caption and it saves when you click away. Delete removes the photo from the site.">
          {/* remount when the server adds items (e.g. a video) so local state picks them up */}
          <MediaEditor key={items.length} categoryId={category.id} initialItems={items} />
        </Panel>
        <div className="flex flex-col gap-6">
          <Panel title="Details">
            <ActionForm action={updateCategory.bind(null, category.id)}>
              <Field label="Name">
                <input name="title" required defaultValue={category.title} className={inputClass} />
              </Field>
              <Field label="Description">
                <textarea name="description" rows={3} defaultValue={category.description ?? ''} className={inputClass} />
              </Field>
            </ActionForm>
          </Panel>
          <Panel title="Add a video" description="Reels play from YouTube or Vimeo.">
            <ActionForm action={addVideo.bind(null, category.id)} submitLabel="Add video" resetOnSuccess>
              <Field label="Video link">
                <input name="video_url" type="url" required placeholder="https://vimeo.com/…" className={inputClass} />
              </Field>
              <Field label="Caption">
                <input name="caption" className={inputClass} />
              </Field>
            </ActionForm>
          </Panel>
          <div>
            <DeleteCategory id={category.id} title={category.title} />
          </div>
        </div>
      </div>
    </div>
  )
}
