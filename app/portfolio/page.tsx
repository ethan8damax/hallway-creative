import Link from 'next/link'
import { getCategories } from '@/lib/sanity/queries'

export default async function PortfolioPage() {
  // ponytail: matches the outage-handling pattern in app/page.tsx — a
  // Sanity hiccup degrades to the empty state, not a dead page.
  const categories = await getCategories().catch(() => [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Portfolio</h1>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {categories.length > 0 ? (
          categories.map((category) => (
            <Link key={category._id} href={`/portfolio/${category.slug}`} className="rounded-md border border-neutral-200 p-6">
              <h2 className="text-lg font-medium">{category.title}</h2>
              {category.description && <p className="mt-2 text-sm text-neutral-600">{category.description}</p>}
            </Link>
          ))
        ) : (
          <p className="col-span-full text-neutral-400">No categories yet.</p>
        )}
      </div>
    </div>
  )
}
