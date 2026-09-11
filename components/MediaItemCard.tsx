import Image from 'next/image'
import { urlForImage } from '@/lib/sanity/image'
import { getVideoEmbedUrl } from '@/lib/video'
import type { MediaItem } from '@/lib/sanity/types'

export function MediaItemCard({ item }: { item: MediaItem }) {
  if (item.mediaType === 'video') {
    // ponytail: videoUrl missing or unparseable both land here, so a
    // malformed video document reads the same as a broken embed link.
    const embedUrl = item.videoUrl ? getVideoEmbedUrl(item.videoUrl) : null
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xs bg-surface">
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

  // ponytail: urlForImage() throws synchronously on a malformed/incomplete
  // image ref (e.g. missing asset) — guard so one bad document doesn't crash
  // the whole grid.
  const src = item.image
    ? (() => {
        try {
          return urlForImage(item.image).width(800).height(1000).url()
        } catch (error) {
          console.error(`Failed to build image URL for media item ${item._id}`, error)
          return null
        }
      })()
    : null

  if (src) {
    return (
      <figure className="group m-0">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xs bg-surface">
          <Image
            src={src}
            alt={item.caption || ''}
            fill
            className="object-cover transition-transform duration-[400ms] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.02]"
          />
        </div>
        {item.caption && (
          <figcaption className="mt-3 text-lg font-semibold text-ink">{item.caption}</figcaption>
        )}
      </figure>
    )
  }

  return null
}
