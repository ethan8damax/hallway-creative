import { getServices } from '@/lib/sanity/queries'

export default async function ServicesPage() {
  // ponytail: matches the outage-handling pattern in app/page.tsx and
  // app/portfolio/page.tsx — a Sanity hiccup degrades to the empty state.
  const services = await getServices().catch(() => [])

  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <h1 className="font-display text-4xl text-ink">Services</h1>
      <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2">
        {services.length > 0 ? (
          services.map((service) => (
            <div key={service._id} className="border-t border-border pt-6">
              <h2 className="font-display text-xl text-ink">{service.title}</h2>
              <p className="mt-2 text-muted">{service.description}</p>
            </div>
          ))
        ) : (
          <p className="col-span-full border-t border-border pt-6 text-muted">
            New services coming soon — check back shortly.
          </p>
        )}
      </div>
    </div>
  )
}
