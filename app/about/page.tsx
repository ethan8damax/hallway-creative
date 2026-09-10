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
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold">About</h1>
      <h2 className="mt-2 text-lg font-normal text-neutral-600">Andrew Hall</h2>
      {portraitSrc ? (
        <div className="relative mt-8 aspect-[4/5] w-full max-w-sm overflow-hidden rounded-md">
          <Image src={portraitSrc} alt="Andrew Hall" fill className="object-cover" />
        </div>
      ) : null}
      <p className="mt-8 whitespace-pre-line text-neutral-700">{about?.bio || "Andrew's story is coming soon — check back shortly."}</p>
    </div>
  )
}
