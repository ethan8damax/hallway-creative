import Image from 'next/image'
import { getVideoEmbedUrl } from '@/lib/video'
import type { MediaItem } from '@/lib/supabase/types'

export function MediaItemCard({ item }: { item: MediaItem }) {
  if (item.media_type === 'video') {
    const embedUrl = item.video_url ? getVideoEmbedUrl(item.video_url) : null
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

  if (!item.image_url) return null

  return (
    <figure className="group m-0">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xs bg-surface">
        <Image
          src={item.image_url}
          alt={item.caption || ''}
          fill
          className="object-cover transition-transform duration-[400ms] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.02]"
        />
      </div>
      {item.caption && <figcaption className="mt-3 text-lg font-semibold text-ink">{item.caption}</figcaption>}
    </figure>
  )
}
