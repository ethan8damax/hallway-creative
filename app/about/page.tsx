import Image from 'next/image'
import { getAbout } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'

export default async function AboutPage() {
  // ponytail: matches the outage-handling pattern in app/page.tsx,
  // app/portfolio/page.tsx, and app/services/page.tsx — a Sanity hiccup
  // degrades to the "Bio coming soon." fallback rather than crashing the page.
  const about = await getAbout().catch(() => null)

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold">About</h1>
      {about?.portrait ? (
        <div className="relative mt-8 aspect-[4/5] w-full max-w-sm overflow-hidden rounded-md">
          <Image src={urlForImage(about.portrait).width(600).height(750).url()} alt="Andrew Hall" fill className="object-cover" />
        </div>
      ) : null}
      <p className="mt-8 whitespace-pre-line text-neutral-700">{about?.bio || 'Bio coming soon.'}</p>
    </div>
  )
}
