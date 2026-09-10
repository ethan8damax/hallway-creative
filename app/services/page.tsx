import { getServices } from '@/lib/sanity/queries'

export default async function ServicesPage() {
  // ponytail: matches the outage-handling pattern in app/page.tsx and
  // app/portfolio/page.tsx — a Sanity hiccup degrades to the empty state.
  const services = await getServices().catch(() => [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Services</h1>
      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
        {services.length > 0 ? (
          services.map((service) => (
            <div key={service._id}>
              <h2 className="text-xl font-medium">{service.title}</h2>
              <p className="mt-2 text-neutral-600">{service.description}</p>
            </div>
          ))
        ) : (
          <p className="col-span-full text-neutral-400">Services coming soon.</p>
        )}
      </div>
    </div>
  )
}
