import Image from 'next/image'
import { getAbout } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'

export default async function AboutPage() {
  // ponytail: matches the outage-handling pattern in app/page.tsx,
  // app/portfolio/page.tsx, and app/services/page.tsx — a Sanity hiccup
  // degrades to the fallback bio text rather than crashing the page.
  const about = await getAbout().catch(() => null)

  // ponytail: urlForImage() throws synchronously on a malformed/incomplete
  // image ref — same guard as components/MediaItemCard.tsx, so a bad
  // portrait doc degrades to no image instead of crashing the page.
  const portraitSrc = about?.portrait
    ? (() => {
        try {
          return urlForImage(about.portrait).width(600).height(750).url()
        } catch (error) {
          console.error('Failed to build portrait image URL', error)
          return null
        }
      })()
    : null

  return (
    <div className="mx-auto max-w-4xl px-6 py-24">
      <h1 className="font-display text-4xl text-ink">About</h1>
      <p className="mt-2 text-lg text-muted">Andrew Hall</p>
      <div className="mt-10 flex flex-col gap-10 sm:flex-row sm:items-start">
        {portraitSrc && (
          <div className="relative aspect-[4/5] w-full max-w-sm shrink-0 overflow-hidden rounded-xs bg-surface">
            <Image src={portraitSrc} alt="Andrew Hall" fill className="object-cover" />
          </div>
        )}
        <p className="whitespace-pre-line text-lg leading-relaxed text-ink">
          {about?.bio || "Andrew's story is coming soon — check back shortly."}
        </p>
      </div>
    </div>
  )
}
