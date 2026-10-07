import Image from 'next/image'
import Link from 'next/link'
import { connection } from 'next/server'
import { getAbout, getCategories, getHeroCandidates, getSiteSettings } from '@/lib/supabase/queries'
import { CategoryBands } from '@/components/CategoryBands'
import { SayHello } from '@/components/SayHello'

export default async function HomePage() {
  // A different portfolio photo leads the page on every visit, so this page
  // renders per request rather than once at build time.
  await connection()

  // ponytail: matches the outage-handling pattern in app/layout.tsx — a
  // Supabase hiccup degrades to fallback copy, not a dead homepage.
  const [settings, categories, about, candidates] = await Promise.all([
    getSiteSettings().catch(() => null),
    getCategories().catch(() => []),
    getAbout().catch(() => null),
    getHeroCandidates().catch(() => []),
  ])
  const hero = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null
  const bioLead = about?.bio?.split(/\n\s*\n/)[0]

  return (
    <div>
      <section className="relative flex h-svh min-h-[34rem] items-end overflow-hidden bg-[oklch(0.09_0_0)]">
        {hero && (
          <Image
            src={hero.url}
            alt={hero.caption ?? ''}
            fill
            priority
            sizes="100vw"
            className="hero-image object-cover"
          />
        )}
        <div className="photo-scrim-top absolute inset-x-0 top-0 h-32" />
        <div className="photo-scrim absolute inset-0" />

        <div className="on-photo relative mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-5 pb-10 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:pb-14">
          <h1
            className="hero-rise max-w-4xl text-balance font-display text-[clamp(3rem,8vw,6rem)] font-[340] leading-[0.98] tracking-[-0.025em]"
            style={{ animationDelay: '350ms' }}
          >
            {settings?.hero_headline || 'HallWay Creative'}
          </h1>
          {hero && (
            <Link
              href={`/portfolio/${hero.categorySlug}`}
              className="fade-in group shrink-0 text-sm opacity-85 transition-opacity hover:opacity-100"
              style={{ animationDelay: '1100ms' }}
            >
              From the {hero.categoryTitle.toLowerCase()} portfolio{' '}
              <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          )}
        </div>
        <span aria-hidden="true" className="absolute bottom-0 left-1/2 h-10 w-px">
          <span className="scroll-cue block h-full w-full bg-white/70" />
        </span>
      </section>

      {settings?.hero_subtext && (
        <section className="mx-auto max-w-4xl px-5 py-28 text-center sm:py-40">
          <p className="reveal text-balance font-display text-[clamp(1.6rem,3.2vw,2.5rem)] leading-[1.25] tracking-[-0.01em] text-ink">
            {settings.hero_subtext}
          </p>
        </section>
      )}

      {about?.portrait_url && (
        <section className="reveal mx-auto grid max-w-[1600px] items-center gap-10 px-5 pb-28 sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] sm:gap-16 sm:px-8 sm:pb-40">
          <div className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-xs bg-surface sm:justify-self-end">
            <Image src={about.portrait_url} alt="Andrew Hall" fill sizes="(min-width: 640px) 40vw, 100vw" className="object-cover" />
          </div>
          <div className="max-w-lg">
            {bioLead && <p className="text-pretty text-lg leading-[1.7] text-ink">{bioLead}</p>}
            <Link href="/about" className="group mt-8 inline-flex items-center gap-2 text-[0.9375rem] font-medium text-ink">
              <span className="border-b border-border pb-0.5 transition-colors group-hover:border-ink">About Andrew</span>
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </section>
      )}

      <section aria-label="Portfolio">
        {categories.length > 0 ? (
          <CategoryBands categories={categories} />
        ) : (
          <p className="mx-auto max-w-[1600px] px-5 py-16 text-muted sm:px-8">Portfolio categories coming soon.</p>
        )}
      </section>

      <SayHello />
    </div>
  )
}
