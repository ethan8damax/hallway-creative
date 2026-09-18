import Image from 'next/image'
import { getAbout } from '@/lib/supabase/queries'

export default async function AboutPage() {
  const about = await getAbout().catch(() => null)

  return (
    <div className="mx-auto max-w-4xl px-6 py-24">
      <h1 className="font-display text-4xl text-ink">About</h1>
      <p className="mt-2 text-lg text-muted">Andrew Hall</p>
      <div className="mt-10 flex flex-col gap-10 sm:flex-row sm:items-start">
        {about?.portrait_url && (
          <div className="relative aspect-[4/5] w-full max-w-sm shrink-0 overflow-hidden rounded-xs bg-surface">
            <Image src={about.portrait_url} alt="Andrew Hall" fill className="object-cover" />
          </div>
        )}
        <p className="whitespace-pre-line text-lg leading-relaxed text-ink">
          {about?.bio || "Andrew's story is coming soon — check back shortly."}
        </p>
      </div>
    </div>
  )
}
