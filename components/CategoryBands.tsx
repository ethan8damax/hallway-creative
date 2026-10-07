import Image from 'next/image'
import Link from 'next/link'
import type { Category } from '@/lib/supabase/types'

// Full-width cinematic bands, one per category, stacked like frames on a strip.
export function CategoryBands({ categories, headingLevel = 'h3' }: { categories: Category[]; headingLevel?: 'h2' | 'h3' }) {
  const Heading = headingLevel
  return (
    <ul className="flex flex-col gap-1.5">
      {categories.map((category, i) => (
        <li key={category.id} className="reveal">
          <Link
            href={`/portfolio/${category.slug}`}
            className="group relative block aspect-[4/5] overflow-hidden bg-surface sm:aspect-[21/9]"
          >
            {category.cover_url && (
              <Image
                src={category.cover_url}
                alt=""
                fill
                sizes="100vw"
                priority={i === 0}
                className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
              />
            )}
            <div className="photo-scrim absolute inset-0" />
            <div className="on-photo absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 px-5 pb-6 sm:px-10 sm:pb-10">
              <div>
                <Heading className="font-display text-[clamp(2.25rem,5vw,4.5rem)] leading-[0.95] tracking-[-0.02em]">
                  {category.title}
                </Heading>
                {category.description && (
                  <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed opacity-85">{category.description}</p>
                )}
              </div>
              <span className="mb-1 hidden shrink-0 items-center gap-2 text-sm font-medium sm:flex">
                View the work
                <span aria-hidden="true" className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5">
                  →
                </span>
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
