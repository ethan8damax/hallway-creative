import Image from 'next/image'
import { connection } from 'next/server'
import { ContactForm } from '@/components/ContactForm'
import { getRandomHeroPhoto, getSiteSettings } from '@/lib/supabase/queries'

export default async function ContactPage() {
  await connection() // a different frame from the portfolio on each visit
  const [settings, photo] = await Promise.all([
    getSiteSettings().catch(() => null),
    getRandomHeroPhoto().catch(() => null),
  ])

  return (
    <div className="mx-auto grid max-w-[1600px] gap-12 px-5 pb-28 pt-10 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:pt-16">
      <div className="relative hidden overflow-hidden bg-surface lg:sticky lg:top-24 lg:block lg:h-[calc(100svh-8rem)]">
        {photo && <Image src={photo.url} alt={photo.caption ?? ''} fill priority sizes="50vw" className="hero-image object-cover" />}
      </div>
      <div className="flex flex-col justify-center lg:py-16">
        <h1 className="hero-rise text-balance font-display text-[clamp(3rem,7vw,5.5rem)] font-[340] leading-[0.95] tracking-[-0.025em] text-ink">
          Let&apos;s talk.
        </h1>
        <p className="fade-in mt-6 max-w-md text-pretty text-lg leading-[1.7] text-muted" style={{ animationDelay: '400ms' }}>
          Tell Andrew about your day — the date, the place, what matters most — and he&apos;ll get back to you.
        </p>
        {settings?.contact_email && (
          <p className="mt-4 text-[0.9375rem] text-muted">
            Or email directly:{' '}
            <a href={`mailto:${settings.contact_email}`} className="text-monitor underline-offset-4 hover:underline">
              {settings.contact_email}
            </a>
          </p>
        )}
        <div className="mt-14 max-w-xl">
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
