'use client'

import { useState } from 'react'
import { UploadZone, type UploadResult } from '@/components/admin/UploadZone'
import { addPhoto, deletePhoto, togglePublish } from '../actions'
import type { Gallery, Photo } from '@/lib/supabase/types'

export function GalleryEditor({ gallery, initialPhotos }: { gallery: Gallery; initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [status, setStatus] = useState(gallery.status)
  const [sending, setSending] = useState(false)
  const [sentAt, setSentAt] = useState(gallery.sent_at)

  async function handleUploaded(result: UploadResult) {
    const photo = await addPhoto(gallery.id, {
      r2_key: result.key,
      url: result.url,
      preview_url: result.previewUrl,
      width: result.width,
      height: result.height,
      filename: result.key.split('/').pop() ?? 'photo.jpg',
    })
    setPhotos((current) => [...current, photo])
  }

  async function handleTogglePublish() {
    const next = status === 'draft' ? 'published' : 'draft'
    await togglePublish(gallery.id, next)
    setStatus(next)
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this photo? This cannot be undone.')) return
    await deletePhoto(id, gallery.id)
    setPhotos((current) => current.filter((p) => p.id !== id))
  }

  async function handleSendToClient() {
    const message = sentAt
      ? 'This gallery was already sent to the client. Send again?'
      : `Send this gallery to ${gallery.client_email}?`
    if (!window.confirm(message)) return

    setSending(true)
    try {
      const response = await fetch(`/api/admin/galleries/${gallery.id}/send`, { method: 'POST' })
      if (response.ok) setSentAt(new Date().toISOString())
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl">
        {gallery.title} — {gallery.client_name}
      </h2>
      <p className="mt-1 text-sm text-muted">/gallery/{gallery.slug} · {status}</p>

      <div className="mt-4 flex gap-3">
        <button type="button" onClick={handleTogglePublish} className="rounded-xs border border-border px-4 py-2 text-sm">
          {status === 'draft' ? 'Publish' : 'Unpublish'}
        </button>
        <button
          type="button"
          onClick={handleSendToClient}
          disabled={status === 'draft' || sending}
          className="rounded-xs bg-tally px-4 py-2 text-sm font-semibold text-on-accent disabled:opacity-40"
        >
          {sending ? 'Sending…' : sentAt ? 'Send again' : 'Send to client'}
        </button>
      </div>
      {sentAt && <p className="mt-2 text-xs text-muted">Sent to client on {new Date(sentAt).toLocaleDateString()}</p>}

      <div className="mt-8">
        <UploadZone prefix={`galleries/${gallery.slug}`} onUploaded={handleUploaded} />
      </div>

      <ul className="mt-8 grid grid-cols-3 gap-4">
        {photos.map((photo) => (
          <li key={photo.id} className="relative">
            <img src={photo.preview_url} alt="" className="aspect-[4/5] w-full rounded-xs object-cover" />
            <button
              type="button"
              onClick={() => handleDelete(photo.id)}
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
