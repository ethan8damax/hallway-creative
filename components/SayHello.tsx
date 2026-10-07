import Link from 'next/link'

// The closing beat on every page that isn't the contact page itself.
export function SayHello() {
  return (
    <section className="reveal mx-auto flex max-w-[1600px] flex-col items-start gap-10 px-5 py-28 sm:px-8 sm:py-40 lg:flex-row lg:items-end lg:justify-between">
      <h2 className="max-w-3xl text-balance font-display text-[clamp(2.25rem,5vw,4.25rem)] leading-[1.02] tracking-[-0.02em] text-ink">
        Something worth remembering coming up?
      </h2>
      <Link
        href="/contact"
        className="shrink-0 rounded-xs bg-tally px-8 py-3.5 font-semibold text-on-accent transition-colors hover:bg-tally-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-monitor"
      >
        Get in touch
      </Link>
    </section>
  )
}
