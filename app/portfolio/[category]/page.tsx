import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCategories, getCategoryBySlug, getMediaItemsForCategory } from '@/lib/supabase/queries'
import { ScreeningSequence } from '@/components/ScreeningSequence'
import { SayHello } from '@/components/SayHello'

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params
  // ponytail: matches the outage-handling pattern in app/page.tsx — a fetch
  // failure on the category lookup degrades to the same notFound() as a
  // genuinely unknown slug, rather than an unhandled rejection.
  const category = await getCategoryBySlug(slug).catch(() => null)

  if (!category) {
    notFound()
  }

  const [items, categories] = await Promise.all([
    getMediaItemsForCategory(category.id).catch(() => []),
    getCategories().catch(() => []),
  ])
  const cover = items.find((item) => item.media_type === 'image' && item.image_url)
  // The cover leads the page, so the sequence starts with the next frame.
  const rest = items.filter((item) => item !== cover)
  const position = categories.findIndex((c) => c.id === category.id)
  const next = categories.length > 1 ? categories[(position + 1) % categories.length] : null

  return (
    <div>
      <section className="relative flex h-[78svh] min-h-[28rem] items-end overflow-hidden bg-surface">
        {cover?.image_url && (
          <Image src={cover.image_url} alt={cover.caption ?? ''} fill priority sizes="100vw" className="hero-image object-cover" />
        )}
        <div className="photo-scrim absolute inset-0" />
        <div className="on-photo relative mx-auto w-full max-w-[1600px] px-5 pb-10 sm:px-8 sm:pb-14">
          <h1
            className="hero-rise font-display text-[clamp(3rem,8vw,6rem)] font-[340] leading-[0.95] tracking-[-0.025em]"
            style={{ animationDelay: '200ms' }}
          >
            {category.title}
          </h1>
          {category.description && (
            <p className="fade-in mt-4 max-w-xl text-pretty text-lg opacity-90" style={{ animationDelay: '700ms' }}>
              {category.description}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-1.5 pt-1.5 sm:px-2 sm:pt-2">
        {rest.length > 0 && <ScreeningSequence items={rest} />}
        {items.length === 0 && (
          <p className="bg-surface px-6 py-24 text-center text-lg text-muted">New work for this category is on its way.</p>
        )}
      </div>

      {next && next.id !== category.id && (
        <Link
          href={`/portfolio/${next.slug}`}
          className="group mx-auto mt-24 flex max-w-[1600px] items-baseline justify-between gap-6 border-t border-border px-5 pt-8 sm:px-8"
        >
          <span className="text-sm text-muted">Next</span>
          <span className="font-display text-[clamp(2rem,4vw,3.25rem)] leading-none tracking-[-0.02em] text-ink">
            {next.title}{' '}
            <span aria-hidden="true" className="inline-block transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-2">
              →
            </span>
          </span>
        </Link>
      )}

      <SayHello />
    </div>
  )
}
