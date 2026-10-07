'use client'

import Image from 'next/image'
import { useState } from 'react'
import { aspectOf, screeningRows } from '@/lib/screeningRows'
import { getVideoEmbedUrl } from '@/lib/video'
import type { MediaItem } from '@/lib/supabase/types'
import { Lightbox } from './Lightbox'

const VIDEO = { width: 16, height: 9 }

export function ScreeningSequence({ items }: { items: MediaItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const images = items.filter((item) => item.media_type === 'image' && item.image_url)
  const lightboxItems = images.map((item) => ({ src: item.image_url!, alt: item.caption ?? '' }))
  const shaped = items.map((item) => (item.media_type === 'video' ? { ...item, ...VIDEO } : item))

  return (
    <>
      <div className="flex flex-col gap-1.5 sm:gap-2">
        {screeningRows(shaped).map((row) => {
          // A lone portrait would otherwise blow up to full width; keep it at a portrait's natural size.
          const lonePortrait = row.length === 1 && aspectOf(row[0]) < 1
          return (
            <div
              key={row[0].id}
              className="reveal flex flex-col gap-1.5 sm:flex-row sm:gap-2"
              style={lonePortrait ? { width: 'min(100%, 36rem)', marginInline: 'auto' } : undefined}
            >
              {row.map((item) => {
                const aspect = aspectOf(item)
                // Mobile stacks full-width; from sm up, flex-grow by aspect makes the row share one height.
                const style = { '--aspect': aspect, aspectRatio: String(aspect) } as React.CSSProperties

                if (item.media_type === 'video') {
                  const embedUrl = item.video_url ? getVideoEmbedUrl(item.video_url) : null
                  return (
                    <div key={item.id} style={style} className="overflow-hidden bg-surface sm:[flex:var(--aspect)_1_0%]">
                      {embedUrl ? (
                        <iframe
                          src={embedUrl}
                          title={item.caption || 'Video'}
                          className="h-full w-full"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted">Video unavailable</div>
                      )}
                    </div>
                  )
                }
                if (!item.image_url) return null

                const lightboxIndex = images.findIndex((img) => img.id === item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOpenIndex(lightboxIndex)}
                    style={style}
                    aria-label={item.caption ? `View larger: ${item.caption}` : 'View larger'}
                    className="group relative cursor-zoom-in sm:[flex:var(--aspect)_1_0%] overflow-hidden bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-monitor"
                  >
                    <Image
                      src={item.image_url}
                      alt={item.caption ?? ''}
                      fill
                      sizes={row.length === 1 ? '100vw' : `(min-width: 640px) ${Math.round(100 / row.length)}vw, 100vw`}
                      className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.025]"
                    />
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      <Lightbox items={lightboxItems} index={openIndex} onIndexChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
    </>
  )
}
