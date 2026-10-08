'use client'

import { useState } from 'react'
import { Lightbox } from '@/components/Lightbox'
import type { Gallery, Photo } from '@/lib/supabase/types'
import { DownloadAllButton } from './DownloadAllButton'

function formatDate(date: string | null) {
  if (!date) return null
  // event_date is a plain date; pin to UTC so it never shifts a day in the viewer's timezone
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export function GalleryView({
  gallery,
  photos,
  isPreview = false,
}: {
  gallery: Pick<Gallery, 'title' | 'event_date' | 'slug'>
  photos: Photo[]
  isPreview?: boolean
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const cover = photos[0]
  const date = formatDate(gallery.event_date)
  // Tells Andrew the client got their photos; skipped when he's previewing.
  const reportDownload = () => {
    if (!isPreview) fetch(`/api/gallery/${gallery.slug}/downloaded`, { method: 'POST' }).catch(() => {})
  }

  return (
    <div>
      {isPreview && (
        <p className="bg-surface px-5 py-2.5 text-center text-sm text-ink">
          Preview: this is what your client sees after entering the code. Your visits aren&apos;t counted as views.
        </p>
      )}
      <section className="relative flex h-[72svh] min-h-[26rem] items-end overflow-hidden bg-surface">
        {cover && <img src={cover.url} alt="" className="hero-image absolute inset-0 h-full w-full object-cover" />}
        <div className="photo-scrim absolute inset-0" />
        <div className="on-photo relative mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-5 pb-10 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:pb-14">
          <div>
            <h1
              className="hero-rise text-balance font-display text-[clamp(2.5rem,6vw,5rem)] font-[340] leading-[1] tracking-[-0.02em]"
              style={{ animationDelay: '200ms' }}
            >
              {gallery.title}
            </h1>
            <p className="fade-in mt-4 text-[0.9375rem] opacity-85" style={{ animationDelay: '700ms' }}>
              {[date, `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}`].filter(Boolean).join(' · ')}
            </p>
          </div>
          <DownloadAllButton
            title={gallery.title}
            photos={photos}
            onDownloaded={reportDownload}
            className="border border-white/60 hover:border-white hover:bg-white/10"
          />
        </div>
      </section>

      {photos.length > 0 ? (
        // Dense masonry: clients scan hundreds of frames, so every photo keeps its shape and nothing is cropped.
        <ul className="mx-auto max-w-[1600px] columns-2 gap-1.5 px-1.5 pt-1.5 sm:columns-3 sm:gap-2 sm:px-2 sm:pt-2 lg:columns-4">
          {photos.map((photo, index) => (
            <li key={photo.id} className="mb-1.5 break-inside-avoid sm:mb-2">
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                aria-label={`View photo ${index + 1}${photo.filename ? `, ${photo.filename}` : ''}`}
                className="group block w-full cursor-zoom-in overflow-hidden bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-monitor"
              >
                <img
                  src={photo.preview_url}
                  alt=""
                  width={photo.width ?? undefined}
                  height={photo.height ?? undefined}
                  loading={index < 8 ? 'eager' : 'lazy'}
                  className="h-auto w-full transition-transform duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.025]"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mx-auto max-w-[1600px] px-5 py-24 text-center text-lg text-muted">
          Your photos are still being added — check back soon.
        </p>
      )}

      <p className="mx-auto max-w-[1600px] px-5 py-20 text-center text-sm text-muted">
        Photographed by Andrew Hall · HallWay Creative
      </p>

      <Lightbox
        items={photos.map((photo, i) => ({
          src: photo.preview_url,
          alt: '',
          downloadUrl: photo.url,
          filename: photo.filename ?? `photo-${i + 1}.jpg`,
        }))}
        index={openIndex}
        onIndexChange={setOpenIndex}
        onClose={() => setOpenIndex(null)}
        onDownload={reportDownload}
      />
    </div>
  )
}
