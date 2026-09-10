import Link from 'next/link'
import { getCategories, getSiteSettings } from '@/lib/sanity/queries'

export default async function HomePage() {
  const [settings, categories] = await Promise.all([getSiteSettings(), getCategories()])

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <section className="text-center">
        <h1 className="text-4xl font-semibold">{settings?.heroHeadline || 'HallWay Creative'}</h1>
        {settings?.heroSubtext && <p className="mt-4 text-lg text-neutral-600">{settings.heroSubtext}</p>}
        <Link href="/contact" className="mt-8 inline-block rounded-md bg-neutral-900 px-6 py-3 text-white">
          Get in touch
        </Link>
      </section>

      <section className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {categories.length > 0 ? (
          categories.map((category) => (
            <Link key={category._id} href={`/portfolio/${category.slug}`} className="rounded-md border border-neutral-200 p-6 text-center hover:border-neutral-400">
              <h2 className="text-lg font-medium">{category.title}</h2>
            </Link>
          ))
        ) : (
          <p className="col-span-full text-center text-neutral-400">Portfolio categories coming soon.</p>
        )}
      </section>
    </div>
  )
}
