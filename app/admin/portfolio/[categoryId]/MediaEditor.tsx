'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { UploadZone, type UploadResult } from '@/components/admin/UploadZone'
import { SortablePhotoGrid } from '@/components/admin/SortablePhotoGrid'
import { btn } from '@/components/admin/ui'
import type { MediaItem } from '@/lib/supabase/types'
import { addMediaItem, deleteCategory, deleteMediaItem, reorderMedia, updateCaption } from '../actions'

function CaptionField({ id, initial }: { id: string; initial: string }) {
  const [value, setValue] = useState(initial)
  const [state, setState] = useState<'idle' | 'saved' | 'error'>('idle')
  return (
    <label className="block border-t border-border px-1.5 pb-1.5 pt-1.5">
      <span className="px-1.5 text-[0.6875rem] font-medium text-muted">Caption</span>
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setState('idle')
        }}
        onBlur={async () => {
          if (value === initial) return
          try {
            await updateCaption(id, value)
            setState('saved')
          } catch {
            setState('error')
          }
        }}
        placeholder="Describe the photo"
        className="mt-0.5 w-full rounded-xs border border-border bg-bg px-1.5 py-1 text-xs text-ink placeholder:text-muted focus:border-monitor focus:outline-none"
      />
      {state !== 'idle' && (
        <span className={`px-1.5 text-[0.6875rem] ${state === 'saved' ? 'text-monitor' : 'text-tally-text'}`}>{state === 'saved' ? 'Saved' : 'Not saved, try again'}</span>
      )}
    </label>
  )
}

export function MediaEditor({ categoryId, initialItems }: { categoryId: string; initialItems: MediaItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [error, setError] = useState<string | null>(null)
  const photos = items.filter((i) => i.media_type === 'image' && i.image_url)
  const videos = items.filter((i) => i.media_type === 'video')

  async function handleUploaded(result: UploadResult) {
    const item = await addMediaItem(categoryId, {
      r2_key: result.key,
      image_url: result.url,
      preview_url: result.previewUrl,
      width: result.width,
      height: result.height,
    })
    setItems((current) => [...current, item])
  }

  async function handleReorder(photoIds: string[]) {
    const previous = items
    const next = [...photoIds.map((id) => items.find((i) => i.id === id)!), ...videos]
    setItems(next)
    setError(null)
    try {
      await reorderMedia(next.map((i) => i.id))
    } catch {
      setItems(previous)
      setError('Could not save the new order. Try again.')
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remove this from the portfolio?')) return
    await deleteMediaItem(id)
    setItems((current) => current.filter((i) => i.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">
      <UploadZone prefix={`portfolio/${categoryId}`} onUploaded={handleUploaded} />
      {error && (
        <p role="alert" className="text-sm text-tally-text">
          {error}
        </p>
      )}
      {photos.length > 0 ? (
        <SortablePhotoGrid
          photos={photos.map((p) => ({ id: p.id, src: p.preview_url ?? p.image_url!, label: p.caption ?? undefined }))}
          onReorder={handleReorder}
          onDelete={handleDelete}
          renderExtra={(p) => <CaptionField id={p.id} initial={items.find((i) => i.id === p.id)?.caption ?? ''} />}
        />
      ) : (
        <p className="text-sm text-muted">No photos yet. The first one becomes the cover on the homepage and portfolio.</p>
      )}
      {videos.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border">
          {videos.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="min-w-0 truncate text-ink">{v.caption || v.video_url}</span>
              <button type="button" onClick={() => handleDelete(v.id)} className={btn.danger}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function DeleteCategory({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  return (
    <button
      type="button"
      className={btn.danger}
      onClick={async () => {
        if (!window.confirm(`Delete the ${title} category and everything in it? This removes it from the site.`)) return
        await deleteCategory(id)
        router.push('/admin/portfolio')
      }}
    >
      Delete category
    </button>
  )
}
