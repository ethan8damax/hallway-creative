import { notFound } from 'next/navigation'
import { getCategoryBySlug, getMediaItemsForCategory } from '@/lib/supabase/queries'
import { MediaGrid } from '@/components/MediaGrid'

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params
  // ponytail: matches the outage-handling pattern in app/page.tsx — a fetch
  // failure on the category lookup degrades to the same notFound() as a
  // genuinely unknown slug, rather than an unhandled rejection.
  const category = await getCategoryBySlug(slug).catch(() => null)

  if (!category) {
    notFound()
  }

  const items = await getMediaItemsForCategory(category.id).catch(() => [])

  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <h1 className="font-display text-4xl text-ink">{category.title}</h1>
      {category.description && <p className="mt-3 max-w-2xl text-muted">{category.description}</p>}
      <div className="mt-12">
        <MediaGrid items={items} />
      </div>
    </div>
  )
}
