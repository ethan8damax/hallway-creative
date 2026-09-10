import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { validateContactForm, type ContactFormData } from '@/lib/validateContactForm'

export async function POST(request: Request) {
  const data = (await request.json()) as ContactFormData

  if (data.company) {
    return NextResponse.json({ ok: true })
  }

  const errors = validateContactForm(data)
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 400 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.CONTACT_FROM_EMAIL || 'HallWay Creative <onboarding@resend.dev>'

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: process.env.CONTACT_TO_EMAIL!,
      replyTo: data.email,
      subject: `New inquiry from ${data.name}`,
      text: `Name: ${data.name}\nEmail: ${data.email}\nEvent type: ${data.eventType || 'n/a'}\n\n${data.message}`,
    })
    // ponytail: the Resend SDK resolves (doesn't throw) on API-level errors
    // (e.g. domain not verified), so a thrown exception alone isn't enough.
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to send contact email', error)
    return NextResponse.json({ ok: false, error: 'send_failed' }, { status: 502 })
  }
}
