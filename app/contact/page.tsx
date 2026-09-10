import { ContactForm } from '@/components/ContactForm'

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Contact</h1>
      <p className="mt-2 text-neutral-600">Tell Andrew about your event and he&apos;ll get back to you.</p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  )
}
