import Link from 'next/link'
import { getCategories } from '@/lib/sanity/queries'
import { PlaceholderTile } from '@/components/PlaceholderTile'

export default async function PortfolioPage() {
  // ponytail: matches the outage-handling pattern in app/page.tsx — a
  // Sanity hiccup degrades to the empty state, not a dead page.
  const categories = await getCategories().catch(() => [])

  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <h1 className="font-display text-4xl text-ink">Portfolio</h1>
      <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3">
        {categories.length > 0 ? (
          categories.map((category) => (
            <Link key={category._id} href={`/portfolio/${category.slug}`} className="group block">
              <div className="overflow-hidden rounded-xs transition-transform duration-[400ms] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.02]">
                <PlaceholderTile />
              </div>
              <h2 className="mt-4 font-display text-xl text-ink transition-colors group-hover:text-tally-text">
                {category.title}
              </h2>
              {category.description && <p className="mt-2 text-sm text-muted">{category.description}</p>}
            </Link>
          ))
        ) : (
          <p className="col-span-full bg-surface py-16 text-center text-lg text-muted">
            New galleries coming soon — check back shortly.
          </p>
        )}
      </div>
    </div>
  )
}
