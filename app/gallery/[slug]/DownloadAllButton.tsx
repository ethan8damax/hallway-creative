'use client'

import { useState } from 'react'
import JSZip from 'jszip'
import type { Photo } from '@/lib/supabase/types'

export function DownloadAllButton({
  title,
  photos,
  className = '',
  onDownloaded,
}: {
  title: string
  photos: Photo[]
  className?: string
  onDownloaded?: () => void
}) {
  const [zipping, setZipping] = useState(false)
  const [done, setDone] = useState(0)
  const [error, setError] = useState(false)

  async function handleClick() {
    setZipping(true)
    setDone(0)
    setError(false)
    try {
      const zip = new JSZip()

      for (const photo of photos) {
        const response = await fetch(photo.url)
        if (!response.ok) throw new Error(`Failed to fetch ${photo.filename ?? photo.id}`)
        const blob = await response.blob()
        zip.file(photo.filename ?? `${photo.id}.jpg`, blob)
        setDone((n) => n + 1)
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/\s+/g, '-')}.zip`
      a.click()
      URL.revokeObjectURL(url)
      onDownloaded?.()
    } catch {
      setError(true)
    } finally {
      setZipping(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={zipping || photos.length === 0}
        className={`rounded-xs px-6 py-3 text-[0.9375rem] font-semibold tabular-nums transition-colors disabled:opacity-60 ${className}`}
      >
        {zipping ? `Preparing ${done} of ${photos.length}…` : 'Download all'}
      </button>
      {error && <p className="text-xs text-[var(--tally-red-text)]">Download failed. Try again.</p>}
    </div>
  )
}
