'use client'

import { useRef, useState } from 'react'
import { UploadZone, type UploadResult } from '@/components/admin/UploadZone'
import { SortablePhotoGrid } from '@/components/admin/SortablePhotoGrid'
import { addPhoto, deletePhoto, reorderPhotos } from '../actions'
import type { Photo } from '@/lib/supabase/types'
import { useConfirm } from '@/components/admin/ConfirmDialog'

export function PhotosEditor({ galleryId, slug, initialPhotos }: { galleryId: string; slug: string; initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState(initialPhotos)
  const confirm = useConfirm()
  const [error, setError] = useState<string | null>(null)
  // Claimed synchronously per upload, so parallel uploads never share a slot.
  const nextOrder = useRef(Math.max(-1, ...initialPhotos.map((p) => p.sort_order)) + 1)

  async function handleUploaded(result: UploadResult) {
    const sortOrder = nextOrder.current++
    const photo = await addPhoto(galleryId, {
      r2_key: result.key,
      url: result.url,
      preview_url: result.previewUrl,
      width: result.width,
      height: result.height,
      filename: result.filename,
      sort_order: sortOrder,
    })
    setPhotos((current) => [...current, photo])
  }

  async function handleReorder(ids: string[]) {
    const previous = photos
    setPhotos(ids.map((id) => photos.find((p) => p.id === id)!))
    setError(null)
    try {
      await reorderPhotos(galleryId, ids)
    } catch {
      setPhotos(previous)
      setError('Could not save the new order. Try again.')
    }
  }

  async function handleDelete(id: string) {
    const photo = photos.find((p) => p.id === id)
    const ok = await confirm({
      title: 'Delete this photo?',
      body: `${photo?.filename ? `“${photo.filename}” is` : 'It’s'} removed from the gallery and the file is permanently deleted. Your client won’t see it anymore.`,
      confirmLabel: 'Delete photo',
    })
    if (!ok) return
    await deletePhoto(id, galleryId)
    setPhotos((current) => current.filter((p) => p.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">
      <UploadZone prefix={`galleries/${slug}`} onUploaded={handleUploaded} existingNames={new Set(photos.map((p) => p.filename ?? ''))} />
      {error && (
        <p role="alert" className="text-sm text-tally-text">
          {error}
        </p>
      )}
      {photos.length > 0 ? (
        <SortablePhotoGrid
          photos={photos.map((p) => ({ id: p.id, src: p.preview_url, label: p.filename ?? undefined }))}
          onReorder={handleReorder}
          onDelete={handleDelete}
        />
      ) : (
        <p className="text-sm text-muted">No photos yet. The first photo you upload becomes the cover; you can change it any time.</p>
      )}
    </div>
  )
}
