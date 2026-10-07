import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/service'
import { validateContactForm, type ContactFormData } from '@/lib/validateContactForm'

// Every inquiry lands in the admin pipeline first, then emails Andrew. Either
// one succeeding counts as delivered — the database copy means an email outage
// (e.g. the unverified Resend domain) can no longer lose a lead.
async function saveInquiry(data: ContactFormData) {
  const db = createServiceClient()
  const { data: client, error } = await db
    .from('clients')
    .insert({
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || null,
      event_type: data.eventType?.trim() || null,
      event_date: data.eventDate || null,
      inquiry_message: data.message.trim(),
    })
    .select('id')
    .single()
  if (error) throw error
  await db.from('client_activity').insert({ client_id: client.id, kind: 'inquiry', body: 'Inquiry received from the website' })
}

async function emailAndrew(data: ContactFormData) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.CONTACT_FROM_EMAIL || 'HallWay Creative <onboarding@resend.dev>'
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: process.env.CONTACT_TO_EMAIL!,
    replyTo: data.email,
    subject: `New inquiry from ${data.name}`,
    text: [
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone || 'n/a'}`,
      `Event type: ${data.eventType || 'n/a'}`,
      `Event date: ${data.eventDate || 'n/a'}`,
      '',
      data.message,
      '',
      `Open in admin: ${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/admin/clients`,
    ].join('\n'),
  })
  // ponytail: the Resend SDK resolves (doesn't throw) on API-level errors
  // (e.g. domain not verified), so a thrown exception alone isn't enough.
  if (error) throw error
}

export async function POST(request: Request) {
  const data = (await request.json()) as ContactFormData

  if (data.company) {
    return NextResponse.json({ ok: true })
  }

  const errors = validateContactForm(data)
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 400 })
  }

  const [saved, emailed] = await Promise.allSettled([saveInquiry(data), emailAndrew(data)])
  if (saved.status === 'rejected') console.error('Failed to save inquiry', saved.reason)
  if (emailed.status === 'rejected') console.error('Failed to send contact email', emailed.reason)

  if (saved.status === 'rejected' && emailed.status === 'rejected') {
    return NextResponse.json({ ok: false, error: 'send_failed' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
