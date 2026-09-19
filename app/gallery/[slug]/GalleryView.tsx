'use client'

import { useState } from 'react'
import type { Photo } from '@/lib/supabase/types'
import { DownloadAllButton } from './DownloadAllButton'

export function GalleryView({ title, photos }: { title: string; photos: Photo[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-ink">{title}</h1>
        <DownloadAllButton photos={photos} title={title} />
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <button key={photo.id} type="button" onClick={() => setOpenIndex(index)} className="block">
            <img src={photo.preview_url} alt="" className="aspect-[4/5] w-full rounded-xs object-cover" />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95 p-6" onClick={() => setOpenIndex(null)}>
          <img src={photos[openIndex].preview_url} alt="" className="max-h-[85vh] max-w-full" onClick={(e) => e.stopPropagation()} />
          <a
            href={photos[openIndex].url}
            download
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-6 right-6 rounded-xs bg-tally px-4 py-2 text-sm font-semibold text-on-accent"
          >
            Download
          </a>
        </div>
      )}
    </div>
  )
}
