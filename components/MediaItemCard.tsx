import Image from 'next/image'
import { urlForImage } from '@/lib/sanity/image'
import { getVideoEmbedUrl } from '@/lib/video'
import type { MediaItem } from '@/lib/sanity/types'

export function MediaItemCard({ item }: { item: MediaItem }) {
  if (item.mediaType === 'video' && item.videoUrl) {
    const embedUrl = getVideoEmbedUrl(item.videoUrl)
    return (
      <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
        {embedUrl ? (
          <iframe src={embedUrl} title={item.caption || 'Video'} className="h-full w-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">Video unavailable</div>
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
        } catch {
          return null
        }
      })()
    : null

  if (src) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md">
        <Image src={src} alt={item.caption || ''} fill className="object-cover" />
      </div>
    )
  }

  return null
}
