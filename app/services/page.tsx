import Image from 'next/image'
import Link from 'next/link'
import { getCategories, getServices } from '@/lib/supabase/queries'
import { SayHello } from '@/components/SayHello'

export default async function ServicesPage() {
  // ponytail: matches the outage-handling pattern in app/page.tsx and
  // app/portfolio/page.tsx — a Supabase hiccup degrades to the empty state.
  const [services, categories] = await Promise.all([getServices().catch(() => []), getCategories().catch(() => [])])
  const categoryById = new Map(categories.map((c) => [c.id, c]))

  return (
    <div>
      <header className="mx-auto max-w-[1600px] px-5 pb-12 pt-20 sm:px-8 sm:pb-20 sm:pt-28">
        <h1 className="hero-rise font-display text-[clamp(3rem,8vw,6rem)] font-[340] leading-[0.95] tracking-[-0.025em] text-ink">
          Services
        </h1>
        <p className="fade-in mt-6 max-w-xl text-pretty text-lg text-muted" style={{ animationDelay: '400ms' }}>
          Photo and video coverage, shaped around your day. Every booking starts with a conversation.
        </p>
      </header>

      {services.length > 0 ? (
        <ul className="mx-auto flex max-w-[1600px] flex-col gap-20 px-5 sm:gap-32 sm:px-8">
          {services.map((service, i) => {
            const category = service.category_id ? categoryById.get(service.category_id) : undefined
            return (
              <li key={service.id} className="reveal grid items-center gap-8 md:grid-cols-2 md:gap-16">
                {category?.cover_url && (
                  <div className={`relative aspect-[4/3] overflow-hidden bg-surface ${i % 2 === 1 ? 'md:order-2' : ''}`}>
                    <Image src={category.cover_url} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
                  </div>
                )}
                <div className="max-w-lg">
                  <h2 className="text-balance font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.02] tracking-[-0.02em] text-ink">
                    {service.title}
                  </h2>
                  <p className="mt-5 text-pretty text-lg leading-[1.7] text-muted">{service.description}</p>
                  {category && (
                    <Link href={`/portfolio/${category.slug}`} className="group mt-8 inline-flex items-center gap-2 text-[0.9375rem] font-medium text-ink">
                      <span className="border-b border-border pb-0.5 transition-colors group-hover:border-ink">
                        See {category.title.toLowerCase()} work
                      </span>
                      <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </Link>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mx-auto max-w-[1600px] border-t border-border px-5 pt-6 text-muted sm:px-8">
          New services coming soon — check back shortly.
        </p>
      )}

      <SayHello />
    </div>
  )
}
