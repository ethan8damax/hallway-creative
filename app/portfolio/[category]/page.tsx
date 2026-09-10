import { notFound } from 'next/navigation'
import { getCategoryBySlug, getMediaItemsForCategory } from '@/lib/sanity/queries'
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

  const items = await getMediaItemsForCategory(category._id).catch(() => [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-semibold">{category.title}</h1>
      {category.description && <p className="mt-2 text-neutral-600">{category.description}</p>}
      <div className="mt-8">
        <MediaGrid items={items} />
      </div>
    </div>
  )
}
