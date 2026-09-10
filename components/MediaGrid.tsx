import type { MediaItem } from '@/lib/sanity/types'
import { MediaItemCard } from './MediaItemCard'
import { PlaceholderTile } from './PlaceholderTile'

const PLACEHOLDER_COUNT = 6

export function MediaGrid({ items }: { items: MediaItem[] }) {
  const tiles =
    items.length > 0
      ? items.map((item) => <MediaItemCard key={item._id} item={item} />)
      : Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => <PlaceholderTile key={i} />)

  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{tiles}</div>
}
