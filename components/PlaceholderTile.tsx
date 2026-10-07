import Image from 'next/image'

export function PlaceholderTile({ src }: { src?: string | null }) {
  if (src) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xs bg-surface">
        <Image src={src} alt="" fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover" />
      </div>
    )
  }
  return (
    <div className="flex aspect-[4/5] w-full items-center justify-center rounded-xs bg-surface text-sm text-muted">
      Photo coming soon
    </div>
  )
}
