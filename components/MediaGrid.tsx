import type { MediaItem } from '@/lib/supabase/types'
import { MediaItemCard } from './MediaItemCard'
import { PlaceholderTile } from './PlaceholderTile'

const PLACEHOLDER_COUNT = 6

export function MediaGrid({ items }: { items: MediaItem[] }) {
  const tiles =
    items.length > 0
      ? items.map((item) => <MediaItemCard key={item.id} item={item} />)
      : Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => <PlaceholderTile key={i} />)

  return <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">{tiles}</div>
}
