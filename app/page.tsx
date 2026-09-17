import Link from 'next/link'
import { getCategories, getSiteSettings } from '@/lib/supabase/queries'
import { PlaceholderTile } from '@/components/PlaceholderTile'

export default async function HomePage() {
  // ponytail: matches the outage-handling pattern in app/layout.tsx — a
  // Supabase hiccup degrades to fallback copy, not a dead homepage.
  const [settings, categories] = await Promise.all([
    getSiteSettings().catch(() => null),
    getCategories().catch(() => []),
  ])

  return (
    <div>
      <section className="mx-auto flex min-h-[80vh] max-w-6xl flex-col items-start justify-center px-6 py-24">
        <h1 className="max-w-3xl text-balance font-display text-[clamp(2.75rem,6vw,5.5rem)] leading-[1.02] tracking-[-0.02em] text-ink">
          {settings?.hero_headline || 'HallWay Creative'}
        </h1>
        {settings?.hero_subtext && <p className="mt-6 max-w-xl text-lg text-muted">{settings.hero_subtext}</p>}
        <Link
          href="/contact"
          className="mt-10 rounded-xs bg-tally px-8 py-3.5 font-semibold text-on-accent transition-colors hover:bg-tally-deep"
        >
          Get in touch
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="font-display text-2xl text-ink">Recent work</h2>
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {categories.length > 0 ? (
            categories.map((category) => (
              <Link key={category.id} href={`/portfolio/${category.slug}`} className="group block">
                <div className="overflow-hidden rounded-xs transition-transform duration-[400ms] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.02]">
                  <PlaceholderTile />
                </div>
                <h3 className="mt-4 font-display text-xl text-ink transition-colors group-hover:text-tally-text">
                  {category.title}
                </h3>
                <span className="mt-1 inline-block text-sm text-muted transition-colors group-hover:text-ink">
                  View gallery →
                </span>
              </Link>
            ))
          ) : (
            <p className="col-span-full text-muted">Portfolio categories coming soon.</p>
          )}
        </div>
      </section>
    </div>
  )
}
