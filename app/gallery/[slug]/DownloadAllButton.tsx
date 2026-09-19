'use client'

import { useState } from 'react'
import JSZip from 'jszip'
import type { Photo } from '@/lib/supabase/types'

export function DownloadAllButton({ title, photos }: { title: string; photos: Photo[] }) {
  const [zipping, setZipping] = useState(false)
  const [error, setError] = useState(false)

  async function handleClick() {
    setZipping(true)
    setError(false)
    try {
      const zip = new JSZip()

      for (const photo of photos) {
        const response = await fetch(photo.url)
        if (!response.ok) throw new Error(`Failed to fetch ${photo.filename ?? photo.id}`)
        const blob = await response.blob()
        zip.file(photo.filename ?? `${photo.id}.jpg`, blob)
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/\s+/g, '-')}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError(true)
    } finally {
      setZipping(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={zipping || photos.length === 0}
        className="rounded-xs border border-border px-4 py-2 text-sm text-ink disabled:opacity-40"
      >
        {zipping ? 'Zipping…' : 'Download all'}
      </button>
      {error && <p className="text-xs text-[var(--tally-red-text)]">Download failed. Try again.</p>}
    </div>
  )
}
