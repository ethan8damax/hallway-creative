import { getCategories } from '@/lib/supabase/queries'
import { CategoryBands } from '@/components/CategoryBands'
import { SayHello } from '@/components/SayHello'

export default async function PortfolioPage() {
  // ponytail: matches the outage-handling pattern in app/page.tsx — a
  // Supabase hiccup degrades to the empty state, not a dead page.
  const categories = await getCategories().catch(() => [])

  return (
    <div>
      <header className="mx-auto max-w-[1600px] px-5 pb-12 pt-20 sm:px-8 sm:pb-16 sm:pt-28">
        <h1 className="hero-rise font-display text-[clamp(3rem,8vw,6rem)] font-[340] leading-[0.95] tracking-[-0.025em] text-ink">
          Portfolio
        </h1>
      </header>
      {categories.length > 0 ? (
        <CategoryBands categories={categories} headingLevel="h2" />
      ) : (
        <p className="mx-auto max-w-[1600px] bg-surface px-6 py-16 text-center text-lg text-muted">
          New galleries coming soon — check back shortly.
        </p>
      )}
      <SayHello />
    </div>
  )
}
