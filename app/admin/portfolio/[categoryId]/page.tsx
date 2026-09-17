'use client'

import { useEffect, useState } from 'react'
import { UploadZone, type UploadResult } from '@/components/admin/UploadZone'
import { addMediaItem, deleteMediaItem } from '../actions'
import type { MediaItem } from '@/lib/supabase/types'

export default function CategoryMediaPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [items, setItems] = useState<MediaItem[]>([])

  useEffect(() => {
    params.then(({ categoryId }) => setCategoryId(categoryId))
  }, [params])

  async function handleUploaded(result: UploadResult) {
    if (!categoryId) return
    await addMediaItem(categoryId, {
      media_type: 'image',
      r2_key: result.key,
      image_url: result.url,
      preview_url: result.previewUrl,
    })
    setItems((current) => [...current, { id: result.key, media_type: 'image', image_url: result.url, preview_url: result.previewUrl, video_url: null, caption: null, sort_order: current.length }])
  }

  if (!categoryId) return null

  return (
    <div>
      <h2 className="font-display text-2xl">Category media</h2>
      <div className="mt-6">
        <UploadZone prefix={`portfolio/${categoryId}`} onUploaded={handleUploaded} />
      </div>
      <ul className="mt-8 grid grid-cols-3 gap-4">
        {items.map((item) => (
          <li key={item.id} className="relative">
            {item.image_url && <img src={item.image_url} alt="" className="aspect-[4/5] w-full rounded-xs object-cover" />}
            <button
              type="button"
              onClick={async () => {
                await deleteMediaItem(item.id)
                setItems((current) => current.filter((i) => i.id !== item.id))
              }}
              className="absolute right-2 top-2 rounded-xs bg-bg/80 px-2 py-1 text-xs text-tally-text"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
