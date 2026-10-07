import Image from 'next/image'
import { getAbout } from '@/lib/supabase/queries'
import { SayHello } from '@/components/SayHello'

export default async function AboutPage() {
  const about = await getAbout().catch(() => null)

  return (
    <div>
      <section className="mx-auto grid max-w-[1600px] gap-10 px-5 pt-10 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:pt-16">
        {about?.portrait_url && (
          // Portrait holds still while the story scrolls past it.
          <div className="relative aspect-[4/5] overflow-hidden bg-surface sm:aspect-[3/2] lg:sticky lg:top-24 lg:aspect-auto lg:h-[calc(100svh-8rem)]">
            <Image src={about.portrait_url} alt="Andrew Hall" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="hero-image object-cover" />
          </div>
        )}
        <div className="flex flex-col justify-center lg:min-h-[calc(100svh-8rem)] lg:py-16">
          <h1 className="hero-rise font-display text-[clamp(3rem,7vw,5.5rem)] font-[340] leading-[0.95] tracking-[-0.025em] text-ink">
            Andrew Hall
          </h1>
          <p className="fade-in mt-3 text-muted" style={{ animationDelay: '400ms' }}>
            Photographer &amp; videographer, HallWay Creative
          </p>
          <p className="mt-10 max-w-[62ch] whitespace-pre-line text-pretty text-lg leading-[1.75] text-ink">
            {about?.bio || "Andrew's story is coming soon — check back shortly."}
          </p>
        </div>
      </section>
      <SayHello />
    </div>
  )
}
