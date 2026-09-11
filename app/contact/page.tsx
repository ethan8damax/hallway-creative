import { ContactForm } from '@/components/ContactForm'

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24">
      <h1 className="font-display text-4xl text-ink">Contact</h1>
      <p className="mt-3 text-muted">Tell Andrew about your event and he&apos;ll get back to you.</p>
      <div className="mt-12">
        <ContactForm />
      </div>
    </div>
  )
}
